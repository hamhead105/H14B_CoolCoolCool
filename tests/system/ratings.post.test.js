import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  rating: {
    findUnique: jest.fn(),
    create: jest.fn(),
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
      if (token === 'Buyer2 token') return { buyerId: 2, role: 'buyer' };
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

describe('POST /orders/:id/rating', () => {

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 5 })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Invalid token'
      },
      body: JSON.stringify({ score: 5 })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 403: seller cannot rate orders', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Seller token'
      },
      body: JSON.stringify({ score: 5 })
    });
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Only buyers/);
  });

  test('HTTP 422: missing score', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ comment: 'Great!' })
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 422: score out of range (0)', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 0 })
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 422: score out of range (6)', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 6 })
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 422: score is not an integer', async () => {
    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 3.5 })
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 404: order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/ORD-NONEXISTENT/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/Order not found/);
  });

  test('HTTP 403: buyer cannot rate another buyer\'s order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 99,
      status: 'order placed'
    });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/your own orders/);
  });

  test('HTTP 409: rating already exists', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue({
      ratingId: 1,
      orderId: 'ORD-001',
      buyerId: 1,
      score: 5,
      comment: 'Already rated',
      createdAt: new Date()
    });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 3 })
    });
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toMatch(/already exists/);
  });

  test('HTTP 201: rating created successfully with comment', async () => {
    const now = new Date();
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue(null);
    prisma.rating.create.mockResolvedValue({
      ratingId: 1,
      orderId: 'ORD-001',
      buyerId: 1,
      score: 4,
      comment: 'Great service!',
      createdAt: now
    });

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 4, comment: 'Great service!' })
    });

    expect(response.status).toBe(201);
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

  test('HTTP 201: rating created successfully without comment', async () => {
    const now = new Date();
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-002',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue(null);
    prisma.rating.create.mockResolvedValue({
      ratingId: 2,
      orderId: 'ORD-002',
      buyerId: 1,
      score: 5,
      comment: null,
      createdAt: now
    });

    const response = await fetch(`${url}/orders/ORD-002/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 5 })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toMatchObject({
      ratingId: 2,
      orderId: 'ORD-002',
      buyerId: 1,
      score: 5,
      comment: null
    });
  });

  test('HTTP 500: database error', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-001',
      buyerId: 1,
      status: 'order placed'
    });
    prisma.rating.findUnique.mockResolvedValue(null);
    prisma.rating.create.mockRejectedValue(new Error('DB connection failed'));

    const response = await fetch(`${url}/orders/ORD-001/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ score: 4 })
    });
    expect(response.status).toBe(500);
  });
});
