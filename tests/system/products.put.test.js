import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import fs from 'fs';

const mPrisma = {
  product: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
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

beforeEach(async () => {
  jest.clearAllMocks();
  await prisma.product.deleteMany({});
});

describe('PUT /products/:id', () => {

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


  test('HTTP 404: product does not exist', async () => {
      mPrisma.product.findUnique.mockResolvedValueOnce(null);

      const response = await fetch(`${url}/products/NONEXISTENT`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              Authorization: 'Valid token'
          },
          body: JSON.stringify({ name: "New Name" })
      });

      expect(response.status).toBe(404);
  });


  test('HTTP 200: updates product successfully', async () => {
    const existing = {
      "productId": "PROD-1",
      "sellerId": "12345", 
      "name": "item1", 
      "description": "old", 
      "cost": 24,
      "brand": "brandname", 
      "family": "series1", 
      "releaseDate": "2025-04-05T00:00:00.000Z", 
      "onSpecial": false, 
      "discount": 0.2, 
      "productTier": 1, 
      "nextProduct": ""
    };

    const updated = {
      "productId": "PROD-1",
      "sellerId": "12345", 
      "name": "item1-new", 
      "description": "new", 
      "cost": 24,
      "brand": "brandname", 
      "family": "series1", 
      "releaseDate": "2025-04-05T00:00:00.000Z", 
      "onSpecial": false, 
      "discount": 0.2, 
      "productTier": 1, 
      "nextProduct": ""
    };

    mPrisma.product.findUnique.mockResolvedValueOnce(existing); // first call
    mPrisma.product.findUnique.mockResolvedValueOnce(updated); // second call at end of putProduct
    mPrisma.product.update.mockResolvedValueOnce(existing);

    console.log(mPrisma.product.findUnique.mock.results);

    const response = await fetch(`${url}/products/PROD-1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({
        name: { value: "item1-new" },
        description: { value: "new" },
        cost: { value: 24 },
        discount: { value: 0.2 },
        onSpecial: { value: false }
      })
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    console.log(data);
    expect(data).toMatchObject({  
      "productId": "PROD-1",
      "sellerId": "12345", 
      "name": "item1-new", 
      "description": "new", 
      "cost": 24,
      "brand": "brandname", 
      "family": "series1", 
      "releaseDate": "2025-04-05T00:00:00.000Z", 
      "onSpecial": false, 
      "discount": 0.2, 
      "productTier": 1, 
      "nextProduct": ""
    });
  });

  test('HTTP 500: database error during update', async () => {
      mPrisma.product.findUnique.mockResolvedValueOnce({ productId: 'PROD1', inputData: {} });
      
      // Mock a crash during update
      mPrisma.product.update = jest.fn().mockRejectedValueOnce(new Error('DB Crash'));

      const response = await fetch(`${url}/products/PROD1`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              Authorization: 'Valid token'
          },
          body: JSON.stringify({ name: "Crash Me" })
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('DB Crash');
  });
});

