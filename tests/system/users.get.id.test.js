import { jest } from '@jest/globals';

const mPrisma = {
  buyer: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  seller: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn()
};

const mBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

await jest.unstable_mockModule('bcrypt', () => ({
  default: mBcrypt
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

const mockBuyer = {
  buyerId: 1,
  name: 'John Smith',
  email: 'john@example.com',
  street: '123 Main Street',
  city: 'Sydney',
  postalCode: '2000',
  countryCode: 'AU',
  companyId: null,
  taxSchemeId: null,
  contactPhone: null,
  loyaltyPoints: 100,
  createdAt: new Date()
};

const mockSeller = {
  sellerId: 1,
  name: 'Hardware Co',
  email: 'contact@hardwareco.com',
  street: '456 Trade Street',
  city: 'Melbourne',
  postalCode: '3000',
  countryCode: 'AU',
  companyId: '987654321',
  legalEntityId: '987654321',
  taxSchemeId: 'GST',
  contactName: 'Jane Doe',
  contactPhone: '0411111111',
  contactEmail: 'jane@hardwareco.com',
  createdAt: new Date()
};

// GET /buyers/:id

describe('GET /buyers/:id', () => {
  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/buyers/1`);
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/buyers/1`, {
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 404: buyer not found', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/buyers/999`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 400: invalid id', async () => {
    const response = await fetch(`${url}/buyers/abc`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(400);
  });

  test('HTTP 200: returns buyer profile', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(mockBuyer);
    const response = await fetch(`${url}/buyers/1`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      buyerId: 1,
      name: 'John Smith',
      email: 'john@example.com',
      loyaltyPoints: 100
    });
    expect(data).not.toHaveProperty('password');
  });
});

// GET /sellers/:id

describe('GET /sellers/:id', () => {
  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/sellers/1`, {
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 404: seller not found', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/sellers/999`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 400: invalid id', async () => {
    const response = await fetch(`${url}/sellers/abc`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(400);
  });

  test('HTTP 200: returns seller profile', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    const response = await fetch(`${url}/sellers/1`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      sellerId: 1,
      name: 'Hardware Co',
      email: 'contact@hardwareco.com'
    });
    expect(data).not.toHaveProperty('password');
  });
});
