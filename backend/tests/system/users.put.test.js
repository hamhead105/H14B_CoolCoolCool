import { jest } from '@jest/globals';

const mPrisma = {
  buyer: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  seller: {
    findUnique: jest.fn(),
    update: jest.fn(),
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
  loyaltyPoints: 0,
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

// PUT /buyers/:id

describe('PUT /buyers/:id', () => {
  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/buyers/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/buyers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Invalid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 400: invalid id', async () => {
    const response = await fetch(`${url}/buyers/abc`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(400);
  });

  test('HTTP 404: buyer not found', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/buyers/999`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 200: updates name', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(mockBuyer);
    mPrisma.buyer.update.mockResolvedValue({ ...mockBuyer, name: 'Updated Name' });
    const response = await fetch(`${url}/buyers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ buyerId: 1, name: 'Updated Name' });
  });

  test('HTTP 200: updates address fields', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(mockBuyer);
    mPrisma.buyer.update.mockResolvedValue({
      ...mockBuyer,
      street: '999 New Street',
      city: 'Brisbane',
      postalCode: '4000'
    });
    const response = await fetch(`${url}/buyers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ street: '999 New Street', city: 'Brisbane', postalCode: '4000' })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ street: '999 New Street', city: 'Brisbane', postalCode: '4000' });
  });

  test('HTTP 200: ignores non-allowed fields', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(mockBuyer);
    mPrisma.buyer.update.mockResolvedValue({ ...mockBuyer, name: 'Updated Name' });
    const response = await fetch(`${url}/buyers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', email: 'hacker@evil.com', loyaltyPoints: 9999 })
    });
    expect(response.status).toBe(200);
    expect(mPrisma.buyer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ email: 'hacker@evil.com', loyaltyPoints: 9999 })
      })
    );
  });
});

// PUT /sellers/:id

describe('PUT /sellers/:id', () => {
  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/sellers/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/sellers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Invalid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 400: invalid id', async () => {
    const response = await fetch(`${url}/sellers/abc`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(400);
  });

  test('HTTP 404: seller not found', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/sellers/999`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 200: updates name', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mPrisma.seller.update.mockResolvedValue({ ...mockSeller, name: 'Updated Co' });
    const response = await fetch(`${url}/sellers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Co' })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ sellerId: 1, name: 'Updated Co' });
  });

  test('HTTP 200: updates contact details', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mPrisma.seller.update.mockResolvedValue({
      ...mockSeller,
      contactName: 'New Contact',
      contactPhone: '0499999999',
      contactEmail: 'new@hardwareco.com'
    });
    const response = await fetch(`${url}/sellers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactName: 'New Contact', contactPhone: '0499999999', contactEmail: 'new@hardwareco.com' })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ contactName: 'New Contact', contactPhone: '0499999999' });
  });

  test('HTTP 200: ignores non-allowed fields', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(mockSeller);
    mPrisma.seller.update.mockResolvedValue({ ...mockSeller, name: 'Updated Co' });
    const response = await fetch(`${url}/sellers/1`, {
      method: 'PUT',
      headers: { Authorization: 'Valid token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Co', email: 'hacker@evil.com' })
    });
    expect(response.status).toBe(200);
    expect(mPrisma.seller.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ email: 'hacker@evil.com' })
      })
    );
  });
});