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

// Mock the despatch advice service so we never hit the real external API
await jest.unstable_mockModule('../../src/services/despatchAdviceService.js', () => ({
  createDespatchAdvice: jest.fn().mockResolvedValue({
    despatchAdviceId: 'DA-ORD-2025-001',
    status: 'Active',
    orderReference: 'ORD-2025-001',
    issueDate: '2025-04-01',
    despatchAdviceTypeCode: 'delivery',
    despatchLines: [
      {
        id: 'LINE-1',
        deliveredQuantity: 2,
        deliveredQuantityUnitCode: 'EA',
        item: { name: 'Vacuum Cleaner' },
      },
    ],
  }),
  getDespatchAdvice: jest.fn().mockResolvedValue({
    despatchAdviceId: 'DA-ORD-2025-001',
    status: 'Active',
    orderReference: 'ORD-2025-001',
    despatchLines: [
      {
        id: 'LINE-1',
        deliveredQuantity: 2,
        item: { name: 'Vacuum Cleaner' },
      },
    ],
  }),
  getDespatchAdviceXML: jest.fn().mockResolvedValue(
    '<?xml version="1.0" encoding="UTF-8"?><DespatchAdvice><cbc:ID>DA-ORD-2025-001</cbc:ID></DespatchAdvice>'
  ),
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const { default: app } = await import('../../src/server.js');

const mockOrder = {
  orderId: 'ORD-2025-001',
  status: 'order placed',
  buyerId: 1,
  externalDespatchAdviceId: null,
  despatchAdviceMetadata: null,
  inputData: {
    order: { id: 'ORD-2025-001', currencyID: 'AUD', issueDate: '2025-04-01' },
    buyer: {
      name: 'John Smith',
      companyId: '123456789',
      street: '1 Buyer St',
      city: 'Sydney',
      postalCode: '2000',
      countryCode: 'AU',
    },
    seller: {
      name: 'Hardware Co',
      companyId: '987654321',
      street: '1 Seller St',
      city: 'Melbourne',
      postalCode: '3000',
      countryCode: 'AU',
      contactName: 'Jane Doe',
      contactPhone: '0400000000',
      contactEmail: 'jane@hardwareco.com',
    },
    delivery: {
      street: '1 Delivery Rd',
      city: 'Sydney',
      postalCode: '2000',
      countryCode: 'AU',
      requestedStartDate: '2025-04-05',
      requestedEndDate: '2025-04-07',
    },
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

// ─── POST /orders/:id/despatch-advice ────────────────────────────────────────

describe('POST /orders/:id/despatch-advice', () => {

  test('HTTP 404: order not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const res = await fetch(`${url}/orders/NONEXISTENT/despatch-advice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });
    expect(res.status).toBe(404);
  });

  test('HTTP 200: creates despatch advice, saves to DB, returns despatch advice detail', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mPrisma.order.update.mockResolvedValue({
      ...mockOrder,
      status: 'despatched',
      externalDespatchAdviceId: 'DA-ORD-2025-001',
      despatchAdviceMetadata: { despatchAdviceId: 'DA-ORD-2025-001' },
    });

    const res = await fetch(`${url}/orders/ORD-2025-001/despatch-advice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.despatchAdvice).toMatchObject({
      despatchAdviceId: 'DA-ORD-2025-001',
      orderReference: 'ORD-2025-001',
    });

    // Verify DB was updated with despatch advice fields
    expect(mPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'ORD-2025-001' },
        data: expect.objectContaining({
          status: 'despatched',
          externalDespatchAdviceId: 'DA-ORD-2025-001',
        }),
      })
    );
  });

  test('HTTP 500: despatch advice service throws', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockOrder);

    const { createDespatchAdvice } = await import('../../src/services/despatchAdviceService.js');
    createDespatchAdvice.mockRejectedValueOnce(new Error('Despatch Advice API error: 500'));

    const res = await fetch(`${url}/orders/ORD-2025-001/despatch-advice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 500: database failure on findUnique', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

    const res = await fetch(`${url}/orders/ORD-2025-001/despatch-advice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
  });

  test('HTTP 500: database failure on update', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mPrisma.order.update.mockRejectedValue(new Error('Database update error'));

    const res = await fetch(`${url}/orders/ORD-2025-001/despatch-advice`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
  });
});

// ─── GET /despatch-advices/:despatchAdviceId ──────────────────────────────────

describe('GET /despatch-advices/:despatchAdviceId', () => {

  test('HTTP 200: returns despatch advice JSON detail', async () => {
    const res = await fetch(`${url}/despatch-advices/DA-ORD-2025-001`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      despatchAdviceId: 'DA-ORD-2025-001',
      orderReference: 'ORD-2025-001',
      status: 'Active',
    });
  });

  test('HTTP 500: despatch advice service throws', async () => {
    const { getDespatchAdvice } = await import('../../src/services/despatchAdviceService.js');
    getDespatchAdvice.mockRejectedValueOnce(new Error('Despatch Advice API error: 404'));

    const res = await fetch(`${url}/despatch-advices/DA-ORD-2025-001`, {
      headers: { Authorization: 'Bearer Seller token' },
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});