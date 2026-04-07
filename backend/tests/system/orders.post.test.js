import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
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
const creation_input2 = fs.readFileSync('tests/inputs/creation_input_2.json', 'utf-8');
const creation_input_missing = fs.readFileSync('tests/inputs/creation_input_missing.json', 'utf-8');
const creation_expectedContent = fs.readFileSync('tests/expected/creation_expected_1.xml', 'utf-8');

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

beforeEach(async () => {
  jest.clearAllMocks();
});

describe('POST /orders', () => {

  test('HTTP 400: malformed JSON', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: '{"invalid-json":}'
    });

    expect(response.status).toBe(400);
  });

  test('HTTP 403: seller cannot create orders', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Seller token'
      },
      body: creation_input1
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toMatch(/Only buyers/);
  });

  test('HTTP 401: invalid or missing token', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: { Authorization: 'Bearer Invalid token' },
      body: creation_input1
    });

    expect(response.status).toBe(401);
  });

  test('HTTP 422: missing required fields', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: creation_input_missing
    });

    expect(response.status).toBe(422);
  });

  test('HTTP 200: creates order and returns correct response with UBL XML', async () => {
    prisma.order.create.mockResolvedValue({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      createdAt: new Date()
    });

    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Valid token'
      },
      body: creation_input1
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Check transient response structure
    expect(data).toMatchObject({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      ublDocument: expect.any(String)
    });

    // Verify Prisma received an Integer for buyerId
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerId: 1 
        })
      })
    );

    expect(data.ublDocument.replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
  });

  test('HTTP 400: duplicate order', async () => {
    const prismaDuplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.0.0' }
    );
    
    prisma.order.create.mockRejectedValueOnce(prismaDuplicateError);

    const response = await fetch(`${url}/orders`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer Valid token' },
      body: creation_input1
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Duplicate order/);
  });
});