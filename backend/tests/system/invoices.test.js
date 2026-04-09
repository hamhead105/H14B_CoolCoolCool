import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma),
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
    verify: jest.fn().mockImplementation((token) => {
      const actualToken = token.replace('Bearer ', '');
      if (actualToken === 'Invalid token' || !actualToken) throw new Error('invalid token');
      if (actualToken === 'Seller token') return { sellerId: '1', role: 'seller' };
      return { buyerId: 1, role: 'buyer' };
    }),
  },
}));

// Mock the invoice service so we never hit the real external API
await jest.unstable_mockModule('../../src/services/invoiceService.js', () => ({
  createInvoice: jest.fn().mockResolvedValue({
    message: 'Invoice created',
    invoice: {
      invoice_id: 'INV-TEST-001',
      status: 'draft',
      order_reference: 'ORD-2025-001',
      issue_date: '2025-04-01',
      due_date: '2025-04-08',
      currency: 'AUD',
      payable_amount: 692.97,
    },
  }),
  getInvoice: jest.fn().mockResolvedValue({
    invoice_id: 'INV-TEST-001',
    status: 'draft',
    order_reference: 'ORD-2025-001',
    payable_amount: 692.97,
    items: [],
  }),
  getInvoiceXML: jest.fn().mockResolvedValue(
    '<?xml version="1.0"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"></Invoice>'
  ),
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const { default: app } = await import('../../src/server.js');

const mockOrder = {
  orderId: 'ORD-2025-001',
  status: 'order placed',
  buyerId: 1,
  externalInvoiceId: null,
  invoiceStatus: null,
  inputData: {
    order: { id: 'ORD-2025-001', currencyID: 'AUD' },
    buyer: { name: 'John Smith', companyId: '123456789' },
    seller: { name: 'Hardware Co', companyId: '987654321' },
    items: [
      {
        product: { name: 'Vacuum Cleaner', description: 'Bagless upright' },
        quantity: 2,
        priceAmount: 299.99,
        unitCode: 'EA',
      },
    ],
  },
  totalCost: 755.97,
  taxAmount: 63,
  payableAmount: 692.97,
  createdAt: new Date(),
};

let server;
let url;

beforeAll((done) => {
  server = app.listen(0, () => {
    url = `http://localhost:${server.address().port}/api`;
    done();
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── POST /orders/:id/invoice ────────────────────────────────────────────────

describe('POST /orders/:id/invoice', () => {
  test('HTTP 401: missing token', async () => {
    const res = await fetch(`${url}/orders/ORD-2025-001/invoice`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const res = await fetch(`${url}/orders/ORD-2025-001/invoice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Invalid token' },
    });
    expect(res.status).toBe(401);
  });

  test('HTTP 404: order not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const res = await fetch(`${url}/orders/NONEXISTENT/invoice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });
    expect(res.status).toBe(404);
  });

  test('HTTP 200: creates invoice, saves to DB, returns invoice detail', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mPrisma.order.update.mockResolvedValue({
      ...mockOrder,
      status: 'invoiced',
      externalInvoiceId: 'INV-TEST-001',
      invoiceStatus: 'draft',
      invoiceMetadata: { invoice_id: 'INV-TEST-001' },
    });

    const res = await fetch(`${url}/orders/ORD-2025-001/invoice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoice).toMatchObject({
      invoice_id: 'INV-TEST-001',
      order_reference: 'ORD-2025-001',
    });

    // Verify DB was updated with invoice fields
    expect(mPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'ORD-2025-001' },
        data: expect.objectContaining({
          status: 'invoiced',
          externalInvoiceId: 'INV-TEST-001',
          invoiceStatus: 'draft',
        }),
      })
    );
  });

  test('HTTP 500: invoice service throws', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockOrder);

    const { createInvoice } = await import('../../src/services/invoiceService.js');
    createInvoice.mockRejectedValueOnce(new Error('Invoice API error: 500'));

    const res = await fetch(`${url}/orders/ORD-2025-001/invoice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 500: database failure', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

    const res = await fetch(`${url}/orders/ORD-2025-001/invoice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
  });
});

// ─── GET /invoices/:invoiceId ────────────────────────────────────────────────

describe('GET /invoices/:invoiceId', () => {
  test('HTTP 401: missing token', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001`);
    expect(res.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001`, {
      headers: { Authorization: 'Bearer Invalid token' },
    });
    expect(res.status).toBe(401);
  });

  test('HTTP 200: returns invoice JSON detail', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      invoice_id: 'INV-TEST-001',
      order_reference: 'ORD-2025-001',
      payable_amount: 692.97,
    });
  });

  test('HTTP 500: invoice service throws', async () => {
    const { getInvoice } = await import('../../src/services/invoiceService.js');
    getInvoice.mockRejectedValueOnce(new Error('Invoice API error: 404'));

    const res = await fetch(`${url}/invoices/INV-TEST-001`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

// ─── GET /invoices/:invoiceId/xml ────────────────────────────────────────────

describe('GET /invoices/:invoiceId/xml', () => {
  test('HTTP 401: missing token', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001/xml`);
    expect(res.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001/xml`, {
      headers: { Authorization: 'Bearer Invalid token' },
    });
    expect(res.status).toBe(401);
  });

  test('HTTP 200: returns XML with correct content-type', async () => {
    const res = await fetch(`${url}/invoices/INV-TEST-001/xml`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('xml');
    const text = await res.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('Invoice');
  });

  test('HTTP 500: invoice service throws', async () => {
    const { getInvoiceXML } = await import('../../src/services/invoiceService.js');
    getInvoiceXML.mockRejectedValueOnce(new Error('Invoice API error: 500'));

    const res = await fetch(`${url}/invoices/INV-TEST-001/xml`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});