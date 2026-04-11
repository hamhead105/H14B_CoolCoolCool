/**
 * CoolCoolCool MCP Server
 * ========================
 * Exposes CoolCoolCool API tools to Claude via the Model Context Protocol.
 *
 * Supports TWO demo scenarios:
 *   1. "Minimise My Cart" (Buyer) — search products, find cheaper alternatives
 *      via family endpoint, apply loyalty points, create the cheapest order
 *   2. "Photo → Product Catalogue" (Seller) — Claude reads an image, extracts
 *      product data, bulk-creates products via seller auth
 *
 * Transport: Streamable HTTP (primary, /mcp endpoint)
 *            SSE legacy (/sse + /messages) for older clients / Claude.ai integrations
 *
 * Run locally:   node mcp-server.js
 * Deploy:        any Node host (Railway, Render, fly.io) — set PORT + API_BASE env vars
 */

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT     = process.env.PORT     || 3333;
const API_BASE = process.env.API_BASE || 'https://h14-b-cool-cool-cool.vercel.app/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Thin wrapper around the CoolCoolCool REST API.
 * Always returns { ok, status, data } — never throws on HTTP errors.
 */
async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

/** Format a tool result for MCP — always returns { content: [{ type, text }] } */
function result(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

function err(message) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

function createMcpServer() {
  const server = new McpServer({
    name: 'coolcoolcool',
    version: '1.0.0',
  });

  // ── SHARED / AUTH ──────────────────────────────────────────────────────────

  /**
   * buyer_login
   * Authenticate as a buyer. Returns { buyerId, token } to use in subsequent calls.
   * Demo 1 entry point.
   */
  server.tool(
    'buyer_login',
    'Authenticate a buyer account. Returns buyerId and JWT token needed for all buyer operations.',
    {
      email:    z.string().email().describe('Buyer email address'),
      password: z.string().describe('Buyer password'),
    },
    async ({ email, password }) => {
      const { ok, data } = await api('POST', '/buyers/login', {
        body: { email, password },
      });
      if (!ok) return err(`Login failed: ${data.error || data.message || 'unknown error'}`);
      return result({ buyerId: data.buyerId, token: data.token });
    }
  );

  /**
   * seller_login
   * Authenticate as a seller. Returns { sellerId, token } to use in subsequent calls.
   * Demo 2 entry point.
   */
  server.tool(
    'seller_login',
    'Authenticate a seller account. Returns sellerId and JWT token needed for all seller operations.',
    {
      email:    z.string().email().describe('Seller email address'),
      password: z.string().describe('Seller password'),
    },
    async ({ email, password }) => {
      const { ok, data } = await api('POST', '/sellers/login', {
        body: { email, password },
      });
      if (!ok) return err(`Login failed: ${data.error || data.message || 'unknown error'}`);
      return result({ sellerId: data.sellerId, token: data.token });
    }
  );

  // ── DEMO 1 — MINIMISE MY CART (BUYER) ──────────────────────────────────────

  /**
   * get_loyalty_points
   * Check how many loyalty points the buyer currently has.
   * Use this BEFORE creating an order to decide whether to redeem points.
   * 100 points = $1 AUD discount.
   */
  server.tool(
    'get_loyalty_points',
    "Get a buyer's current loyalty points balance. 100 points = $1 AUD discount on an order.",
    {
      token:   z.string().describe('JWT token from buyer_login'),
      buyerId: z.number().int().describe('Buyer ID from buyer_login'),
    },
    async ({ token, buyerId }) => {
      const { ok, data } = await api('GET', `/buyers/${buyerId}/loyalty`, { token });
      if (!ok) return err(`Failed to fetch loyalty points: ${data.error || data.message}`);
      return result({ buyerId, loyaltyPoints: data.loyaltyPoints });
    }
  );

  /**
   * search_products
   * Search the product catalogue with optional filters.
   * Use this to find products matching what the buyer wants to buy.
   * Returns name, cost, brand, family, onSpecial, discount for each product.
   */
  server.tool(
    'search_products',
    'Search the product catalogue. Filter by name, brand, family, onSpecial, or price range. Use this to find products and compare prices.',
    {
      token:     z.string().describe('JWT token from buyer_login or seller_login'),
      name:      z.string().optional().describe('Partial product name to search for'),
      brand:     z.string().optional().describe('Filter by brand name'),
      family:    z.string().optional().describe('Filter by product family/category'),
      onSpecial: z.boolean().optional().describe('If true, only return discounted products'),
      minCost:   z.number().optional().describe('Minimum price filter (AUD)'),
      maxCost:   z.number().optional().describe('Maximum price filter (AUD)'),
    },
    async ({ token, name, brand, family, onSpecial, minCost, maxCost }) => {
      const params = new URLSearchParams();
      if (name)      params.set('name', name);
      if (brand)     params.set('brand', brand);
      if (family)    params.set('family', family);
      if (onSpecial !== undefined) params.set('onSpecial', String(onSpecial));
      if (minCost !== undefined)   params.set('minCost', String(minCost));
      if (maxCost !== undefined)   params.set('maxCost', String(maxCost));

      const qs = params.toString();
      const { ok, data } = await api('GET', `/products${qs ? `?${qs}` : ''}`, { token });
      if (!ok) return err(`Failed to fetch products: ${data.error || data.message}`);

      // Return a clean summary — cost optimisation happens in Claude's reasoning
      const products = (Array.isArray(data) ? data : data.products || []).map(p => ({
        productId:    p.productId,
        name:         p.name,
        description:  p.description,
        brand:        p.brand,
        family:       p.family,
        cost:         p.cost,
        onSpecial:    p.onSpecial,
        discount:     p.discount,
        // Frontend formula: cost * (1 - discount) where discount is a decimal e.g. 0.15 = 15%
        effectiveCost: p.onSpecial ? +(p.cost * (1 - p.discount)).toFixed(2) : p.cost,
        sellerId:     p.sellerId,
      }));

      return result({ count: products.length, products });
    }
  );

  /**
   * get_product_family
   * Given a productId, returns all products in the same family.
   * Use this to find cheaper alternatives to items in the buyer's cart.
   * Key endpoint for the "minimise cost" demo logic.
   */
  server.tool(
    'get_product_family',
    'Get all products in the same family/category as a given product. Use this to find cheaper alternatives to items in a cart.',
    {
      token:     z.string().describe('JWT token'),
      productId: z.string().describe('Product ID to find alternatives for'),
    },
    async ({ token, productId }) => {
      const { ok, data } = await api('GET', `/products/${productId}/family`, { token });
      if (!ok) return err(`Failed to fetch product family: ${data.error || data.message}`);

      const products = (Array.isArray(data) ? data : data.products || []).map(p => ({
        productId:    p.productId,
        name:         p.name,
        brand:        p.brand,
        family:       p.family,
        cost:         p.cost,
        onSpecial:    p.onSpecial,
        discount:     p.discount,
        // Frontend formula: cost * (1 - discount) — discount is decimal e.g. 0.15
        effectiveCost: p.onSpecial ? +(p.cost * (1 - p.discount)).toFixed(2) : p.cost,
        sellerId:     p.sellerId,
      }));

      // Sort by effective cost ascending so Claude sees cheapest first
      products.sort((a, b) => a.effectiveCost - b.effectiveCost);

      return result({ originalProductId: productId, familySize: products.length, products });
    }
  );

  /**
   * get_product
   * Fetch full details for a single product by ID.
   */
  server.tool(
    'get_product',
    'Get full details for a single product by its ID.',
    {
      token:     z.string().describe('JWT token'),
      productId: z.string().describe('Product ID'),
    },
    async ({ token, productId }) => {
      const { ok, data } = await api('GET', `/products/${productId}`, { token });
      if (!ok) return err(`Product not found: ${data.error || data.message}`);
      return result(data);
    }
  );

  /**
   * create_order
   * Place a new order and generate a UBL 2.1 XML purchase order.
   * This is the final step of Demo 1.
   *
   * Mirrors the exact payload shape used by the frontend CartPage:
   *   - buyer/seller/order/delivery/tax/items are all top-level keys (not nested under inputData)
   *   - seller data is resolved server-side by fetching GET /sellers/:id with the buyer token
   *   - if cart has multiple sellers, seller block uses "Multiple Sellers" placeholder (same as frontend)
   *   - each line item carries sellerId directly
   *   - priceAmount already reflects any special/discount (pass the effective price, not base cost)
   *
   * redeemLoyaltyPoints: 100 pts = $1 AUD discount.
   */
  server.tool(
    'create_order',
    'Place a new order and generate a UBL 2.1 XML purchase order. Call this after optimising the cart with get_product_family and checking loyalty points with get_loyalty_points.',
    {
      token:   z.string().describe('JWT token from buyer_login'),
      buyerId: z.number().int().describe('Buyer ID from buyer_login'),
      items: z.array(z.object({
        productId:   z.string().describe('Product ID'),
        name:        z.string().describe('Product name'),
        description: z.string().default('').describe('Product description'),
        quantity:    z.number().int().min(1).describe('Quantity to order'),
        // Pass the already-discounted effective price (cost * (1 - discount) if onSpecial)
        effectivePrice: z.number().describe('Final unit price after any discounts, in AUD'),
        sellerId:    z.number().int().describe('Seller ID this product belongs to'),
        onSpecial:   z.boolean().default(false).describe('Whether item is discounted'),
      })).min(1).describe('Optimised cart line items'),
      redeemLoyaltyPoints: z.number().int().min(0).default(0)
        .describe('Loyalty points to redeem. 100 pts = $1 AUD discount. Pass 0 to skip.'),
    },
    async ({ token, buyerId, items, redeemLoyaltyPoints }) => {
      // ── 1. Fetch buyer profile ───────────────────────────────────────────
      const buyerRes = await api('GET', `/buyers/${buyerId}`, { token });
      if (!buyerRes.ok) return err(`Could not fetch buyer profile: ${buyerRes.data.error || buyerRes.data.message}`);
      const dbBuyer = buyerRes.data;

      const buyerData = {
        buyerId,
        name:         dbBuyer.businessName || dbBuyer.name         || 'NOT-PROVIDED',
        email:        dbBuyer.email                                 || 'NOT-PROVIDED',
        street:       dbBuyer.address      || dbBuyer.street       || 'NOT-PROVIDED',
        city:         dbBuyer.city                                  || 'NOT-PROVIDED',
        postalCode:   dbBuyer.postalCode                            || '0000',
        countryCode:  dbBuyer.countryCode                          || 'AU',
        companyId:    dbBuyer.companyId                             || 'NOT-PROVIDED',
        taxSchemeId:  dbBuyer.taxSchemeId                          || 'GST',
        legalEntityId: dbBuyer.legalEntityId                       || 'NOT-PROVIDED',
        contactName:  dbBuyer.contactName  || dbBuyer.name         || 'NOT-PROVIDED',
        contactPhone: dbBuyer.phone        || dbBuyer.contactPhone  || 'NOT-PROVIDED',
        contactEmail: dbBuyer.contactEmail || dbBuyer.email         || 'NOT-PROVIDED',
      };

      // ── 2. Resolve seller(s) — same logic as frontend CartPage ──────────
      const uniqueSellerIds = [...new Set(items.map(i => String(i.sellerId)))];

      let sellerData = {
        name: 'Multiple Sellers',
        street: 'Multi', city: 'Multi', postalCode: '0000', countryCode: 'AU',
        companyId: 'N/A', taxSchemeId: 'GST', legalEntityId: 'N/A',
        contactName: 'N/A', contactPhone: 'N/A', contactEmail: 'N/A',
      };

      if (uniqueSellerIds.length === 1) {
        const sellerRes = await api('GET', `/sellers/${uniqueSellerIds[0]}`, { token });
        if (sellerRes.ok) {
          const sDb = sellerRes.data;
          sellerData = {
            name:          sDb.businessName || sDb.name            || 'NOT-PROVIDED',
            street:        sDb.street                              || 'NOT-PROVIDED',
            city:          sDb.city                                || 'NOT-PROVIDED',
            postalCode:    sDb.postalCode                          || '0000',
            countryCode:   sDb.countryCode                         || 'AU',
            companyId:     sDb.companyId                           || 'NOT-PROVIDED',
            taxSchemeId:   sDb.taxSchemeId                         || 'GST',
            legalEntityId: sDb.legalEntityId                       || 'NOT-PROVIDED',
            contactName:   sDb.contactName  || sDb.name            || 'NOT-PROVIDED',
            contactPhone:  sDb.contactPhone                        || 'NOT-PROVIDED',
            contactEmail:  sDb.contactEmail || sDb.email           || 'NOT-PROVIDED',
          };
        }
      }

      // ── 3. Build dates ───────────────────────────────────────────────────
      const today   = new Date().toISOString().split('T')[0];
      const weekOut = new Date(Date.now() + 604800000).toISOString().split('T')[0];

      // ── 4. Build the flat order payload (mirrors frontend exactly) ───────
      const orderPayload = {
        buyerId,
        order: {
          id:         `ORD-${Date.now()}`,
          currencyID: 'AUD',
          issueDate:  today,
          note:       'Standard B2B Order',
        },
        buyer:  buyerData,
        seller: sellerData,
        delivery: {
          street:             buyerData.street,
          city:               buyerData.city,
          postalCode:         buyerData.postalCode,
          countryCode:        buyerData.countryCode,
          requestedStartDate: today,
          requestedEndDate:   weekOut,
        },
        tax: { taxPercent: 10, taxTypeCode: 'GST' },
        items: items.map((item, idx) => ({
          id:          (idx + 1).toString(),
          quantity:    Number(item.quantity),
          unitCode:    'EA',
          priceAmount: item.effectivePrice,   // already discounted, matches frontend
          product: {
            name:          item.name,
            description:   item.description || '',
            sellersItemId: item.productId,
          },
          sellerId: String(item.sellerId),    // per-line sellerId, matches frontend
        })),
        // Loyalty points passed through so backend can apply the discount
        loyaltyPointsRedeemed: redeemLoyaltyPoints,
      };

      // ── 5. POST the order ────────────────────────────────────────────────
      const { ok, data } = await api('POST', '/orders', { token, body: orderPayload });
      if (!ok) return err(`Order creation failed: ${data.error || data.message || JSON.stringify(data)}`);

      // ── 6. Return a clean summary for Claude to narrate ──────────────────
      const subtotal       = items.reduce((s, i) => s + i.effectivePrice * i.quantity, 0);
      const taxAmount      = +(subtotal * 0.1).toFixed(2);
      const loyaltyDiscount = +(redeemLoyaltyPoints / 100).toFixed(2);
      const payable        = +(subtotal + taxAmount - loyaltyDiscount).toFixed(2);

      return result({
        success:      true,
        orderId:      data.orderId || data.order?.orderId,
        itemCount:    items.length,
        sellers:      uniqueSellerIds.length === 1 ? `Seller ${uniqueSellerIds[0]}` : 'Multiple sellers',
        subtotal:     `$${subtotal.toFixed(2)} AUD`,
        gst:          `$${taxAmount.toFixed(2)} AUD`,
        loyaltyDiscount: redeemLoyaltyPoints > 0
          ? `-$${loyaltyDiscount.toFixed(2)} AUD (${redeemLoyaltyPoints} pts redeemed)`
          : 'none',
        totalPayable: `$${payable.toFixed(2)} AUD`,
        xmlGenerated: true,
        message:      'Order placed. UBL 2.1 XML purchase order generated successfully.',
      });
    }
  );

  /**
   * list_orders
   * List orders, optionally filtered by buyer.
   */
  server.tool(
    'list_orders',
    'List orders with optional filters. Use to show a buyer their order history.',
    {
      token:   z.string().describe('JWT token'),
      buyerId: z.number().int().optional().describe('Filter by buyer ID'),
      status:  z.string().optional().describe('Filter by status (e.g. pending, despatched)'),
    },
    async ({ token, buyerId, status }) => {
      const params = new URLSearchParams();
      if (buyerId) params.set('buyerId', String(buyerId));
      if (status)  params.set('status', status);
      const qs = params.toString();
      const { ok, data } = await api('GET', `/orders${qs ? `?${qs}` : ''}`, { token });
      if (!ok) return err(`Failed to fetch orders: ${data.error || data.message}`);
      return result(data);
    }
  );

  // ── DEMO 2 — PHOTO → PRODUCT CATALOGUE (SELLER) ────────────────────────────

  /**
   * create_product
   * Create a single product listing for a seller.
   * Called once per extracted product in Demo 2.
   *
   * Claude extracts all fields from the uploaded image/handwritten list,
   * then calls this tool for each product found.
   */
  server.tool(
    'create_product',
    'Create a new product listing for a seller. Use this after extracting product details from an image or document to bulk-onboard a catalogue.',
    {
      token:       z.string().describe('JWT token from seller_login'),
      sellerId:    z.number().int().describe('Seller ID from seller_login'),
      name:        z.string().describe('Product name'),
      description: z.string().describe('Product description'),
      cost:        z.number().describe('Product price in AUD'),
      brand:       z.string().describe('Brand name'),
      family:      z.string().describe('Product family / category (e.g. "Vitamins", "Pain Relief")'),
      onSpecial:   z.boolean().default(false).describe('Whether the product is currently on special/discount'),
      discount:    z.number().min(0).max(100).default(0)
        .describe('Discount percentage if onSpecial is true (0-100)'),
      productTier: z.number().int().min(1).max(3).default(1)
        .describe('Product tier: 1 = standard, 2 = premium, 3 = exclusive'),
      nextProduct: z.string().default('')
        .describe('Optional: productId of the next/upgraded product in this line'),
    },
    async ({ token, sellerId, name, description, cost, brand, family, onSpecial, discount, productTier, nextProduct }) => {
      const productId = `PROD-${brand.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { ok, data } = await api('POST', '/products', {
        token,
        body: {
          productId,
          sellerId,
          name,
          description,
          cost,
          brand,
          family,
          onSpecial,
          discount: onSpecial ? discount : 0,
          productTier,
          nextProduct: nextProduct || '',
        },
      });

      if (!ok) return err(`Failed to create product "${name}": ${data.error || data.message || JSON.stringify(data)}`);

      return result({
        success:   true,
        productId: data.productId || productId,
        name,
        brand,
        family,
        cost:      `$${cost.toFixed(2)} AUD`,
        onSpecial,
        discount:  onSpecial ? `${discount}%` : 'none',
      });
    }
  );

  /**
   * list_products_for_seller
   * List all products for a given seller.
   * Use after Demo 2 bulk-create to confirm what was added.
   */
  server.tool(
    'list_products_for_seller',
    "List all products belonging to a specific seller. Use after bulk-creating products to confirm the catalogue was created correctly.",
    {
      token:    z.string().describe('JWT token'),
      sellerId: z.number().int().describe('Seller ID to filter by'),
    },
    async ({ token, sellerId }) => {
      const { ok, data } = await api('GET', `/products?sellerId=${sellerId}`, { token });
      if (!ok) return err(`Failed to list products: ${data.error || data.message}`);

      const products = (Array.isArray(data) ? data : data.products || []).map(p => ({
        productId:   p.productId,
        name:        p.name,
        brand:       p.brand,
        family:      p.family,
        cost:        p.cost,
        onSpecial:   p.onSpecial,
        discount:    p.discount,
        productTier: p.productTier,
      }));

      return result({
        sellerId,
        totalProducts: products.length,
        products,
      });
    }
  );

  /**
   * update_product
   * Update a product listing. Useful for correcting OCR errors after Demo 2.
   */
  server.tool(
    'update_product',
    'Update an existing product listing. Use to correct details after creating products from an image.',
    {
      token:       z.string().describe('JWT token from seller_login'),
      productId:   z.string().describe('Product ID to update'),
      name:        z.string().optional(),
      description: z.string().optional(),
      cost:        z.number().optional(),
      brand:       z.string().optional(),
      family:      z.string().optional(),
      onSpecial:   z.boolean().optional(),
      discount:    z.number().min(0).max(100).optional(),
      productTier: z.number().int().min(1).max(3).optional(),
    },
    async ({ token, productId, ...fields }) => {
      // Strip undefined fields
      const body = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
      const { ok, data } = await api('PUT', `/products/${productId}`, { token, body });
      if (!ok) return err(`Failed to update product: ${data.error || data.message}`);
      return result({ success: true, productId, updated: body });
    }
  );

  // ── BONUS: INVOICE + RATING (nice to show off in demo) ────────────────────

  /**
   * generate_invoice
   * Generate a UBL 2.1 invoice for an order. Sets order status to "despatched".
   * Great to run at the end of Demo 1 to show the full procurement flow.
   */
  server.tool(
    'generate_invoice',
    'Generate a UBL 2.1 invoice for an order. Sets order status to despatched. Run this after creating an order to complete the procurement cycle.',
    {
      token:   z.string().describe('JWT token'),
      orderId: z.string().describe('Order ID to generate invoice for'),
    },
    async ({ token, orderId }) => {
      const { ok, data } = await api('POST', `/orders/${orderId}/invoice`, { token });
      if (!ok) return err(`Invoice generation failed: ${data.error || data.message || JSON.stringify(data)}`);
      return result({
        success:   true,
        invoiceId: data.invoiceId || data.invoice?.invoice_id,
        status:    data.status || 'despatched',
        message:   'Invoice generated. Order status set to despatched. UBL 2.1 XML invoice is ready.',
      });
    }
  );

  /**
   * get_seller_profile
   * Fetch a seller's profile (name, contact info etc.).
   */
  server.tool(
    'get_seller_profile',
    "Get a seller's full profile including contact information.",
    {
      token:    z.string().describe('JWT token from seller_login'),
      sellerId: z.number().int().describe('Seller ID'),
    },
    async ({ token, sellerId }) => {
      const { ok, data } = await api('GET', `/sellers/${sellerId}`, { token });
      if (!ok) return err(`Failed to fetch seller: ${data.error || data.message}`);
      // Omit password from response
      const { password: _, ...safe } = data;
      return result(safe);
    }
  );

  return server;
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS — needed for Claude.ai to connect
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Mcp-Session-Id, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, mcp-session-id');
  res.setHeader('ngrok-skip-browser-warning', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/.well-known/oauth-protected-resource', (req, res) => {
  const base = 'https://coolcoolcool-production.up.railway.app';
  res.json({
    resource: base,
    authorization_servers: [base],
    mcp_endpoint: `${base}/sse`,
  });
});

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const base = 'https://coolcoolcool-production.up.railway.app';
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
  });
});

app.post('/register', (req, res) => {
  res.status(201).json({
    client_id: `client_${Date.now()}`,
    client_secret: 'not-needed',
    redirect_uris: req.body?.redirect_uris || [],
    grant_types: ['authorization_code'],
    token_endpoint_auth_method: 'none'
  });
});

// ── Streamable HTTP transport (recommended, single /mcp endpoint) ──────────

// Per-session transport map for stateful connections
const sessions = new Map();

app.all('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'];

    // Reuse existing session transport if present
    if (sessionId && sessions.has(sessionId)) {
      const { transport } = sessions.get(sessionId);
      await transport.handleRequest(req, res);
      return;
    }

    // New session
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      onsessioninitialized: (id) => {
        sessions.set(id, { transport, server: mcpServer });
      },
    });

    // Clean up on close
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (e) {
    console.error('MCP Streamable HTTP error:', e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── Legacy SSE transport (/sse + /messages) — for older clients ───────────
app.get('/authorize', (req, res) => {
  console.log('AUTHORIZE:', JSON.stringify(req.query));
  const { redirect_uri, state } = req.query;
  const code = `code_${Date.now()}`;
  
  if (redirect_uri) {
    // Must be a real 302 — the backend OAuth client can't run JS
    return res.redirect(302, `${redirect_uri}?code=${code}&state=${state}`);
  }
  res.json({ status: 'ok' });
});

app.post('/token', express.urlencoded({ extended: true }), express.json(), (req, res) => {
  console.log('TOKEN body:', req.body);
  res.json({
    access_token: `mcp_token_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 86400,
    scope: 'mcp',
  });
});

app.get('/.well-known/oauth-protected-resource/sse', (req, res) => {
  const base = 'https://coolcoolcool-production.up.railway.app';
  res.json({
    resource: `${base}/sse`,
    authorization_servers: [base],
  });
});

// ── SSE / Streamable HTTP on /sse ─────────────────────────────────────────

app.post('/sse', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] || req.query.sessionId;

  // 1. If we ALREADY have a session ID, route the message to the existing transport
  if (sessionId && sessions.has(sessionId)) {
    console.log(`Routing message to existing session: ${sessionId}`);
    const entry = sessions.get(sessionId);
    return await entry.transport.handleRequest(req, res, req.body);
  }

  // 2. If it's an 'initialize' call without a session, create a NEW session
  if (req.body?.method === 'initialize') {
    console.log('Creating NEW session...');
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      onsessioninitialized: (id) => {
        sessions.set(id, { transport, server: mcpServer });
      },
    });

    await mcpServer.connect(transport);
    return await transport.handleRequest(req, res, req.body);
  }

  // 3. Fallback for unexpected requests
  console.log('400: Received message without valid session or initialization');
  res.status(400).json({ error: 'Missing session or invalid initialization' });
});


app.get('/sse', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  console.log('SSE GET sessionId:', sessionId, 'active:', [...sessions.keys()]);

  // Must have a valid session ID — no fallback, as that caused wrong session matching
  const entry = sessionId ? sessions.get(sessionId) : null;

  if (!entry) {
    console.log('SSE GET - no session found, returning 404');
    return res.status(404).json({ error: 'Session not found. POST /sse first.' });
  }

  try {
    await entry.transport.handleRequest(req, res);
    console.log('SSE GET handleRequest completed');
  } catch (e) {
    console.error('SSE GET error:', e.message);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

app.delete('/sse', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (sessionId) sessions.delete(sessionId);
  res.status(200).end();
});

// /messages routes to the sessions map too
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId || req.headers['mcp-session-id'];
  console.log('POST /messages sessionId:', sessionId, 'active:', [...sessions.keys()]);

  const entry = (sessionId && sessions.get(sessionId)) || [...sessions.values()].at(-1);
  if (!entry) return res.status(404).json({ error: 'No session' });

  try {
    await entry.transport.handleRequest(req, res);
  } catch (e) {
    console.error('messages error:', e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});


// ── Health / info ─────────────────────────────────────────────────────────

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    server: 'coolcoolcool-mcp',
    version: '1.0.0',
    transports: ['streamable-http @ /mcp', 'sse @ /sse'],
    activeSessions: sessions.size,
    tools: [
      'buyer_login', 'seller_login',
      'get_loyalty_points', 'search_products', 'get_product_family',
      'get_product', 'create_order', 'list_orders',
      'create_product', 'list_products_for_seller', 'update_product',
      'generate_invoice', 'get_seller_profile',
    ],
  });
});

app.get('/', (_, res) => {
  res.json({
    name: 'CoolCoolCool MCP Server',
    description: 'MCP server for CoolCoolCool B2B procurement platform',
    demos: {
      demo1: 'Minimise My Cart — buyer searches products, finds cheaper alternatives, applies loyalty points, creates order',
      demo2: 'Photo → Product Catalogue — seller uploads handwritten product list, Claude extracts and bulk-creates products',
    },
    endpoints: {
      streamableHttp: '/mcp',
      sseLegacy:      '/sse + /messages',
      health:         '/health',
    },
    apiBase: API_BASE,
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 CoolCoolCool MCP Server running on port ${PORT}`);
  console.log(`   Streamable HTTP : http://localhost:${PORT}/mcp`);
  console.log(`   SSE legacy      : http://localhost:${PORT}/sse`);
  console.log(`   Health          : http://localhost:${PORT}/health`);
  console.log(`   API base        : ${API_BASE}\n`);
});

export default app;