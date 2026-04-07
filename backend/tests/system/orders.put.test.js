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
      if (actualToken === 'Seller token') return { sellerId: "1", role: 'seller' };
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
    url = `http://localhost:${port}/api`;
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 200: updates order note successfully (Full Edit)', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      inputData: JSON.parse(creation_input1)
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    // The controller returns the status and the recalculated totalCost
    mPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      status: 'order placed'
    });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Check that it returns the order structure + nested ublDocument
    expect(data.orderId).toBe('ORD-2025-001');
    expect(data.inputData.ublDocument).toBeDefined();
    expect(data.inputData.order.note).toBe('Updated note');
  });

  test('HTTP 200: seller confirms their specific items (Dashboard Action)', async () => {
    // 1. Prepare input data ensuring there is an item for seller "1"
    const mockInputData = JSON.parse(creation_input1);
    
    // Force at least one item to belong to seller "1" for the test
    if (mockInputData.items && mockInputData.items.length > 0) {
      mockInputData.items[0].sellerId = "1";
    }

    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      inputData: mockInputData
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    
    // The controller logic should change status to 'partially fulfilled' 
    // because other items remain 'pending'
    mPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      status: 'partially fulfilled'
    });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Seller token'
      },
      body: JSON.stringify({ 
        status: 'confirmed', 
        sellerId: "1" 
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.status).toBe('partially fulfilled');
    
    // 2. Find the item and verify status
    // We use String() on both sides to be 100% sure
    const sellerItem = data.inputData.items.find(i => String(i.sellerId) === "1");
    
    // Guard against undefined with a clear error message
    expect(sellerItem).toBeDefined(); 
    expect(sellerItem.itemStatus).toBe('confirmed');
  });

  
  test('HTTP 404: order not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/NONEXISTENT`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 500: database failure', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    expect(response.status).toBe(500);
  });
});