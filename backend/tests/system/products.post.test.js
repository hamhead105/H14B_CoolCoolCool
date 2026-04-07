import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import fs from 'fs';

const mPrisma = {
  product: {
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
      if (token === 'Invalid token' || !token) {
        throw new Error('invalid token');
      }
      if (token === 'Buyer token') return { buyerId: 1, role: 'buyer' };

      return { sellerId: 5, role: 'seller' };
    })
  }
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { default: app } = await import('../../src/server.js');

const prod_input1 = fs.readFileSync('tests/inputs/prod_post_input1.json', 'utf-8');
const prod_input2 = fs.readFileSync('tests/inputs/prod_post_input2.json', 'utf-8');
const prod_input_missing = fs.readFileSync('tests/inputs/prod_post_input_missing.json', 'utf-8');

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

beforeEach(async () => {
  jest.clearAllMocks();
  await prisma.product.deleteMany({});
});

describe('POST /products', () => {

  test('HTTP 403: buyer cannot create products', async () => {
    const response = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Buyer token'
      },
      body: prod_input1
    });

    expect(response.status).toBe(403);
  });

  test('HTTP 400: malformed JSON', async () => {
    const response = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: '{"invalid-json":}'
    });

    expect(response.status).toBe(400);
  });

  test('HTTP 401: invalid or missing token', async () => {
    const response = await fetch(`${url}/products`, {
      method: 'POST',
      headers: { Authorization: 'Invalid token' },
      body: prod_input1
    });

    expect(response.status).toBe(401);
  });

  test('HTTP 422: missing required fields', async () => {
    const response = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input_missing
    });

    expect(response.status).toBe(422);
  });

  test('HTTP 200: creates product and returns right json', async () => {
    prisma.product.create.mockResolvedValue({
      productId: '-1',
      sellerId: '5',
      name: "item1",
      description: "does xyz",
      cost: 24,
      brand: "brand1",
      family: "series1",
      onSpecial: false,
      discount: 0.2,
      productTier: 1,
      nextProduct: "",
      releaseDate: "2025-04-05"
    });

    const response = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input1
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 5
        })
      })
    );

    expect(data).toMatchObject({
        productId: "PROD-12345",
        name: "item1",
        description: "does xyz"
    });
  });

  test('HTTP 400 duplicate products', async () => {
    const prismaDuplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.0.0' }
    );
    
    prisma.product.create.mockResolvedValueOnce({
      productId: 'PROD-12345',
      sellerId: '5',
      name: "item1",
      description: "does xyz",
      cost: 24,
      brand: "brand1",
      family: "series1",
      onSpecial: false,
      discount: 0.2,
      productTier: 1,
      nextProduct: "",
      releaseDate: "2025-04-05"
    })
    .mockRejectedValueOnce(prismaDuplicateError);

    const response1 = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input1
    });

    const response2 = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input1
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(400);
  });

  test('HTTP 200 multiple non duplicate products', async () => {    
    prisma.product.create.mockResolvedValueOnce({
      productId: 'PROD-12345',
      sellerId: '5',
      name: "item1",
      description: "does xyz",
      cost: 24,
      brand: "brand1",
      family: "series1",
      onSpecial: false,
      discount: 0.2,
      productTier: 1,
      nextProduct: "",
      releaseDate: "2025-04-05"
    })
    .mockResolvedValueOnce({
      productId: 'PROD-2',
      sellerId: '5',
      name: "item1",
      description: "does xyz",
      cost: 24,
      brand: "brand1",
      family: "series1",
      onSpecial: false,
      discount: 0.2,
      productTier: 1,
      nextProduct: "",
      releaseDate: "2025-04-05"
    })

    const response1 = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input1
    });

    const response2 = await fetch(`${url}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: prod_input2
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});

