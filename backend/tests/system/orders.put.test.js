import { jest } from '@jest/globals';
import fs from 'fs';

const mPrisma = {
  order: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
    verify: jest.fn().mockImplementation((token) => {
      const actualToken = token.replace('Bearer ', '');
      if (actualToken === 'Invalid token' || !actualToken) {
        throw new Error('invalid token');
      }
      if (actualToken === 'Seller token') return { sellerId: '1', role: 'seller' };
      return { buyerId: 1, role: 'buyer' };
    })
  }
}));


// Replace the invoiceService mock in orders.put.test.js with this:
await jest.unstable_mockModule('../../src/services/invoiceService.js', () => ({
  createInvoice: jest.fn().mockResolvedValue({
    message: 'Invoice created',
    invoice: {
      invoice_id: 'INV-TEST-001',
      status: 'draft',
      order_reference: 'ORD-2025-001',
      payable_amount: 692.97,
    },
  }),
  getInvoice: jest.fn().mockResolvedValue({}),
  getInvoiceXML: jest.fn().mockResolvedValue(''),
}));

// Mock despatch advice service
await jest.unstable_mockModule('../../src/services/despatchAdviceService.js', () => ({
  createDespatchAdvice: jest.fn().mockResolvedValue({
    despatchAdviceId: 'DA-ORD-2025-001',
    status: 'Active',
    orderReference: 'ORD-2025-001',
  }),
  getDespatchAdvice: jest.fn(),
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { default: app } = await import('../../src/server.js');

const creation_input1 = fs.readFileSync('tests/inputs/creation_input_1.json', 'utf-8');

// Build mock input data where all items belong to seller "1" and are already despatched
// Used for the all-despatched scenario
const allDespatchedInput = (() => {
  const data = JSON.parse(creation_input1);
  data.items = data.items.map(item => ({ ...item, sellerId: '1', itemStatus: 'confirmed' }));
  return data;
})();

// Build mock input data where item[0] belongs to seller "1", rest are pending from other sellers
const mixedSellerInput = (() => {
  const data = JSON.parse(creation_input1);
  if (data.items.length > 0) data.items[0].sellerId = '1';
  if (data.items.length > 1) data.items[1].sellerId = '2';
  return data;
})();

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

describe('PUT /orders/:id', () => {

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 422: empty body', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Valid token' },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 404: order not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/NONEXISTENT`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Valid token' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 500: database failure', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Valid token' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    expect(response.status).toBe(500);
  });

  test('HTTP 200: updates order note successfully', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      externalInvoiceId: null,
      externalDespatchAdviceId: null,
      inputData: JSON.parse(creation_input1)
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'order placed' });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Valid token' },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.orderId).toBe('ORD-2025-001');
    expect(data.inputData.ublDocument).toBeDefined();
    expect(data.inputData.order.note).toBe('Updated note');
  });

  test('HTTP 200: seller confirms their items — status becomes partially fulfilled', async () => {
    const mockInputData = JSON.parse(creation_input1);
    if (mockInputData.items?.length > 0) mockInputData.items[0].sellerId = '1';

    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      externalInvoiceId: null,
      externalDespatchAdviceId: null,
      inputData: mockInputData
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'partially fulfilled' });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Seller token' },
      body: JSON.stringify({ status: 'confirmed', sellerId: '1' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('partially fulfilled');

    const sellerItem = data.inputData.items.find(i => String(i.sellerId) === '1');
    expect(sellerItem).toBeDefined();
    expect(sellerItem.itemStatus).toBe('confirmed');
  });

  test('HTTP 200: seller marks items as despatched — despatch advice auto-created, status partially fulfilled', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'partially fulfilled',
      externalInvoiceId: null,
      externalDespatchAdviceId: null, // not yet created
      inputData: mixedSellerInput,
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'partially fulfilled' });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Seller token' },
      body: JSON.stringify({ status: 'despatched', sellerId: '1' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Global status still partially fulfilled because seller 2 hasn't despatched
    expect(data.status).toBe('partially fulfilled');

    // Despatch advice should have been created
    expect(data.externalDespatchAdviceId).toBe('DA-ORD-2025-001');

    // DB should have been updated with despatch advice fields
    expect(mPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalDespatchAdviceId: 'DA-ORD-2025-001',
        }),
      })
    );

    // Invoice should NOT have been created yet (not all despatched)
    expect(mPrisma.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalInvoiceId: expect.anything(),
        }),
      })
    );
  });

  test('HTTP 200: all items despatched — despatch advice AND invoice both auto-created', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'confirmed',
      externalInvoiceId: null,
      externalDespatchAdviceId: null,
      inputData: allDespatchedInput, // all items are seller "1", all confirmed
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'despatched' });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Seller token' },
      body: JSON.stringify({ status: 'despatched', sellerId: '1' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe('despatched');

    // Both despatch advice and invoice should be present in response
    expect(data.externalDespatchAdviceId).toBe('DA-ORD-2025-001');
    expect(data.externalInvoiceId).toBe('INV-TEST-001');

    // DB updated with both
    expect(mPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalDespatchAdviceId: 'DA-ORD-2025-001',
          externalInvoiceId: 'INV-TEST-001',
          invoiceStatus: 'draft',
        }),
      })
    );
  });

  test('HTTP 200: despatch advice failure is non-fatal — order still updates', async () => {
    const { createDespatchAdvice } = await import('../../src/services/despatchAdviceService.js');
    createDespatchAdvice.mockRejectedValueOnce(new Error('Despatch API down'));  // ← move this BEFORE the fetch

    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'confirmed',
      externalInvoiceId: null,
      externalDespatchAdviceId: null,
      inputData: allDespatchedInput,
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'despatched' });

    // ← REMOVE the import and mockRejectedValueOnce that was here after fetch setup

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Seller token' },
      body: JSON.stringify({ status: 'despatched', sellerId: '1' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('despatched');

    expect(mPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          despatchAdviceError: 'Despatch API down',
        }),
      })
    );
  });

  test('HTTP 200: despatch advice not re-created if already exists', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'partially fulfilled',
      externalInvoiceId: null,
      externalDespatchAdviceId: 'DA-ORD-2025-001', // already created
      inputData: allDespatchedInput,
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({ ...existingOrder, status: 'despatched' });

    const { createDespatchAdvice } = await import('../../src/services/despatchAdviceService.js');

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Seller token' },
      body: JSON.stringify({ status: 'despatched', sellerId: '1' })
    });

    expect(response.status).toBe(200);

    // createDespatchAdvice should NOT have been called again
    expect(createDespatchAdvice).not.toHaveBeenCalled();
  });
});