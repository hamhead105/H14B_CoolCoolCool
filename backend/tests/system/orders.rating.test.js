import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
    verify: jest.fn((token) => {
      const raw = token.replace('Bearer ', '');
      if (raw === 'Invalid token' || !raw) {
        throw new Error('invalid token');
      }
      return { buyerId: 1, role: 'buyer' };
    })
  }
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const { default: app } = await import('../../src/server.js');

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

const sampleOrder = {
  orderId: 'ORD-001',
  buyerId: 1,
  status: 'order placed',
  ratingScore: null,
  ratingComment: null
};

describe('Ratings endpoints', () => {
  test('POST /orders/:id/rating returns 422 for invalid score', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ score: 10, comment: 'Too high' })
    });

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error).toMatch(/integer between 1 and 5/);
  });

  test('POST /orders/:id/rating returns 404 when order is missing', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/ORD-999/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Order not found/);
  });

  test('POST /orders/:id/rating returns 403 for buyer mismatch', async () => {
    mPrisma.order.findUnique.mockResolvedValue({ ...sampleOrder, buyerId: 2 });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/only rate your own orders/i);
  });

  test('POST /orders/:id/rating returns 409 when rating already exists', async () => {
    mPrisma.order.findUnique.mockResolvedValue({ ...sampleOrder, ratingScore: 5 });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toMatch(/Rating already exists/);
  });

  test('POST /orders/:id/rating returns 201 on success', async () => {
    mPrisma.order.findUnique.mockResolvedValue(sampleOrder);
    mPrisma.order.update.mockResolvedValue({ ...sampleOrder, ratingScore: 4, ratingComment: null });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: JSON.stringify({ score: 4, comment: 'Very good' })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual({ orderId: 'ORD-001', score: 4, comment: 'Very good' });
  });

  test('GET /orders/:id/rating returns 404 when order is missing', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/ORD-999/rating`, {
      method: 'GET',
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Order not found/);
  });

  test('GET /orders/:id/rating returns 404 when rating is not present', async () => {
    mPrisma.order.findUnique.mockResolvedValue({ ...sampleOrder, ratingScore: null });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Rating not found/);
  });

  test('GET /orders/:id/rating returns rating successfully', async () => {
    mPrisma.order.findUnique.mockResolvedValue({ ...sampleOrder, ratingScore: 5, ratingComment: 'Great' });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Bearer Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ orderId: 'ORD-001', score: 5, comment: 'Great' });
  });
});
