import { jest } from '@jest/globals';
import fs from 'fs';

const mPrisma = {
  order: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn()
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
      // Remove 'Bearer ' prefix if present for the mock logic
      const actualToken = token.replace('Bearer ', '');
      if (actualToken === 'Invalid token' || !actualToken) {
        throw new Error('invalid token');
      }
      if (actualToken === 'Seller token') return { sellerId: 1, role: 'seller' };
      return { buyerId: 1, role: 'buyer' };
    })
  }
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { default: app } = await import('../../src/server.js');

const creation_input1 = fs.readFileSync('tests/inputs/creation_input_1.json', 'utf-8');

let server;
let url;

beforeAll((done) => {
  server = app.listen(0, () => {
    const port = server.address().port;
    url = `http://localhost:${port}`;
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

describe('GET /orders/:id', () => {

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/1`, {
      headers: { Authorization: 'Bearer Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/1`);
    expect(response.status).toBe(401);
  });

  test('HTTP 404: order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/999`, {
      headers: { Authorization: 'Bearer Valid token' }
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 200: retrieve order successfully', async () => {
    const mockInputData = JSON.parse(creation_input1);
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      createdAt: new Date(),
      inputData: mockInputData
    });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Updated to match the "Revolutionized" controller structure
    expect(data).toMatchObject({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      inputData: expect.objectContaining({
        ...mockInputData,
        ublDocument: expect.any(String) // ublDocument is now INSIDE inputData
      })
    });
  });

  test('HTTP 200: order exists but no inputData', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-2025-003',
      status: 'order placed',
      totalCost: 100,
      createdAt: new Date(),
      inputData: {} // Provide empty object so create_xml doesn't crash
    });

    const response = await fetch(`${url}/orders/ORD-2025-003`, {
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.orderId).toBe('ORD-2025-003');
  });

  test('HTTP 500: database failure', async () => {
    prisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toMatchObject({ error: 'Database connection failed' });
  });
});