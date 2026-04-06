import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  rating: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
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
      if (token === 'Invalid token' || !token) {
        throw new Error('invalid token');
      }
      if (token === 'Seller token') return { sellerId: 1, role: 'seller' };
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

describe('GET /orders/:id/rating', () => {

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET'
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 404: order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/ORD-NONEXISTENT/rating`, {
      method: 'GET',
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Order not found/);
  });

  test('HTTP 404: order exists but no rating', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Rating not found/);
  });

  test('HTTP 200: rating retrieved successfully', async () => {
    const now = new Date();
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue({
      ratingId: 1,
      orderId: 'ORD-001',
      buyerId: 1,
      score: 4,
      comment: 'Great service!',
      createdAt: now
    });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      ratingId: 1,
      orderId: 'ORD-001',
      buyerId: 1,
      score: 4,
      comment: 'Great service!'
    });
    expect(data.createdAt).toBeDefined();
  });

  test('HTTP 200: rating with no comment', async () => {
    const now = new Date();
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-002',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue({
      ratingId: 2,
      orderId: 'ORD-002',
      buyerId: 1,
      score: 5,
      comment: null,
      createdAt: now
    });

    const response = await fetch(`${url}/orders/ORD-002/rating`, {
      method: 'GET',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.score).toBe(5);
    expect(data.comment).toBeNull();
  });

  test('HTTP 500: database error', async () => {
    prisma.order.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'GET',
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(500);
  });
});
