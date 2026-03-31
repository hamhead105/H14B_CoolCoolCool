import { jest } from '@jest/globals';

const mPrisma = {
  buyer: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  seller: {
    findUnique: jest.fn(),
    create: jest.fn(),
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
      if (token === 'Invalid token' || !token) {
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
  mBcrypt.compare.mockResolvedValue(true);
});

// ── BUYER REGISTER ─────────────────────────────────────────

describe('POST /buyers/register', () => {
  const validBuyer = {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password123',
    street: '123 Main Street',
    city: 'Sydney',
    postalCode: '2000',
    countryCode: 'AU'
  };

  test('HTTP 400: missing required fields', async () => {
    const response = await fetch(`${url}/buyers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 409: email already exists', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue({ buyerId: 1, email: 'john@example.com' });
    const response = await fetch(`${url}/buyers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBuyer)
    });
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 200: registers buyer and returns buyerId and token', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    mPrisma.buyer.create.mockResolvedValue({
      buyerId: 1,
      name: 'John Smith',
      email: 'john@example.com',
      password: 'hashed_password',
      street: '123 Main Street',
      city: 'Sydney',
      postalCode: '2000',
      countryCode: 'AU',
      loyaltyPoints: 0,
      createdAt: new Date()
    });
    const response = await fetch(`${url}/buyers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBuyer)
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ buyerId: 1, token: 'mock_jwt_token' });
  });

  test('HTTP 200: optional fields are accepted', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    mPrisma.buyer.create.mockResolvedValue({
      buyerId: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'hashed_password',
      street: '456 Other Street',
      city: 'Melbourne',
      postalCode: '3000',
      countryCode: 'AU',
      companyId: '123456789',
      taxSchemeId: 'GST',
      contactPhone: '0400000000',
      loyaltyPoints: 0,
      createdAt: new Date()
    });
    const response = await fetch(`${url}/buyers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBuyer,
        email: 'jane@example.com',
        companyId: '123456789',
        taxSchemeId: 'GST',
        contactPhone: '0400000000'
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ buyerId: 2, token: 'mock_jwt_token' });
  });
});

// ── BUYER LOGIN ────────────────────────────────────────────

describe('POST /buyers/login', () => {
  const validLogin = { email: 'john@example.com', password: 'password123' };

  test('HTTP 400: missing required fields', async () => {
    const response = await fetch(`${url}/buyers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 401: buyer not found', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/buyers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLogin)
    });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

test('HTTP 401: wrong password', async () => {
  mPrisma.buyer.findUnique.mockResolvedValue({ buyerId: 1, email: 'john@example.com', password: 'hashed_password' });
  mBcrypt.compare.mockResolvedValueOnce(false);
  const response = await fetch(`${url}/buyers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validLogin)
  });
  expect(response.status).toBe(401);
  const data = await response.json();
  expect(data).toHaveProperty('error');
});

  test('HTTP 200: returns token and buyerId', async () => {
    mPrisma.buyer.findUnique.mockResolvedValue({ buyerId: 1, email: 'john@example.com', password: 'hashed_password' });
    const response = await fetch(`${url}/buyers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLogin)
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ token: 'mock_jwt_token', buyerId: 1 });
  });
});

// ── SELLER REGISTER ────────────────────────────────────────

describe('POST /sellers/register', () => {
  const validSeller = {
    name: 'Hardware Co Pty Ltd',
    email: 'contact@hardwareco.com',
    password: 'password123',
    street: '456 Trade Street',
    city: 'Melbourne',
    postalCode: '3000',
    countryCode: 'AU',
    companyId: '987654321',
    legalEntityId: '987654321',
    taxSchemeId: 'GST',
    contactName: 'Jane Doe',
    contactPhone: '0411111111',
    contactEmail: 'jane@hardwareco.com'
  };

  test('HTTP 400: missing required fields', async () => {
    const response = await fetch(`${url}/sellers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hardware Co', email: 'contact@hardwareco.com' })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 409: email already exists', async () => {
    mPrisma.seller.findUnique.mockResolvedValue({ sellerId: 1, email: 'contact@hardwareco.com' });
    const response = await fetch(`${url}/sellers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSeller)
    });
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 200: registers seller and returns sellerId and token', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(null);
    mPrisma.seller.create.mockResolvedValue({
      sellerId: 1,
      name: 'Hardware Co Pty Ltd',
      email: 'contact@hardwareco.com',
      password: 'hashed_password',
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
    });
    const response = await fetch(`${url}/sellers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSeller)
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ sellerId: 1, token: 'mock_jwt_token' });
  });

  test('HTTP 400: missing one required seller field', async () => {
    const { contactEmail, ...missingContactEmail } = validSeller;
    const response = await fetch(`${url}/sellers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missingContactEmail)
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

// ── SELLER LOGIN ───────────────────────────────────────────

describe('POST /sellers/login', () => {
  const validLogin = { email: 'contact@hardwareco.com', password: 'password123' };

  test('HTTP 400: missing required fields', async () => {
    const response = await fetch(`${url}/sellers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'contact@hardwareco.com' })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('HTTP 401: seller not found', async () => {
    mPrisma.seller.findUnique.mockResolvedValue(null);
    const response = await fetch(`${url}/sellers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLogin)
    });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

test('HTTP 401: wrong password', async () => {
  mPrisma.seller.findUnique.mockResolvedValue({ sellerId: 1, email: 'contact@hardwareco.com', password: 'hashed_password' });
  mBcrypt.compare.mockResolvedValueOnce(false);
  const response = await fetch(`${url}/sellers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validLogin)
  });
  expect(response.status).toBe(401);
  const data = await response.json();
  expect(data).toHaveProperty('error');
});

  test('HTTP 200: returns token and sellerId', async () => {
    mPrisma.seller.findUnique.mockResolvedValue({ sellerId: 1, email: 'contact@hardwareco.com', password: 'hashed_password' });
    const response = await fetch(`${url}/sellers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLogin)
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ token: 'mock_jwt_token', sellerId: 1 });
  });
});