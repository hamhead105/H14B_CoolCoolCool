import { jest } from '@jest/globals';

const mPrisma = {
  buyer: {
    findUnique: jest.fn(),
  },
  seller: {
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

await jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
  }
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
    verify: jest.fn().mockImplementation((token) => {
      if (token === 'Invalid token' || !token) throw new Error('invalid token');
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
    url = `http://localhost:${server.address().port}`;
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

// GET /buyers/:id/loyalty

describe('GET /buyers/:id/loyalty', () => {
  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/buyers/1/loyalty`);
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/buyers/1/loyalty`, {
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 400: invalid id', async () => {
    const response = await fetch(`${url}/buyers/abc/loyalty`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(400);
  });

  test('HTTP 404: buyer not found', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/buyers/999/loyalty`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 200: returns loyalty points', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue({ buyerId: 1, loyaltyPoints: 150 });
    const response = await fetch(`${url}/buyers/1/loyalty`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ buyerId: 1, loyaltyPoints: 150 });
  });

  test('HTTP 200: returns zero loyalty points', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue({ buyerId: 1, loyaltyPoints: 0 });
    const response = await fetch(`${url}/buyers/1/loyalty`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ buyerId: 1, loyaltyPoints: 0 });
  });
});