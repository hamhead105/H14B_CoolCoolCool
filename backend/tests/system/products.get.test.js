import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import fs from 'fs';

const mPrisma = {
    product: {
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
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
      if (token === 'Seller token') return { sellerId: 1, role: 'seller' };
      return { buyerId: 1, role: 'buyer' };
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

describe('GET /products/', () => {

    test('HTTP 401: invalid token', async () => {
        const response = await fetch(`${url}/products/`, {
            headers: { Authorization: 'Invalid token' }
        });
        expect(response.status).toBe(401);
    });

    test('HTTP 401: missing token', async () => {
        const response = await fetch(`${url}/products/`);
        expect(response.status).toBe(401);
    });


    test('HTTP 200: retrieve single product by name', async () => {
        prisma.product.findMany.mockResolvedValueOnce([{
            productId: 'PROD-1',
            sellerId: '1',
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
        }]);

        const params = new URLSearchParams({
            name: "item1",
        });

        const response = await fetch(`${url}/products/?${params}`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ productId: 'PROD-1', name: "item1", sellerId: '1' })
            ])
        );
    });

    test('HTTP 200: retrieve single product by product name', async () => {
        prisma.product.findMany.mockResolvedValueOnce([{
            productId: 'PROD-1',
            sellerId: '1',
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
        }]);

        const params = new URLSearchParams({
            productId: "PROD-1",
        });

        const response = await fetch(`${url}/products/?${params}`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ productId: 'PROD-1', name: "item1", sellerId: '1' })
            ])
        );
    });

    test('HTTP 200: retrieve single product by all', async () => {
        prisma.product.findMany.mockResolvedValueOnce([
            {
                productId: 'PROD-1',
                sellerId: '1',
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
            },
            {
                productId: 'PROD-2',
                sellerId: 'seller2',
                name: "item2",
                description: "does xyz",
                cost: 24,
                brand: "brand1",
                family: "series1",
                onSpecial: false,
                discount: 0.2,
                productTier: 1,
                nextProduct: "",
                releaseDate: "2025-04-05"
            }
        ]);

        const params = new URLSearchParams({
            name: 'PROD-1',
            brand: "brand1",
            family: "series1",
            onSpecial: false
        });

        const response = await fetch(`${url}/products/?${params}`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ productId: 'PROD-1', name: "item1", sellerId: '1' })
            ])
        );
    });

    test('HTTP 200: retrieve multiple product by seller', async () => {
        prisma.product.findMany.mockResolvedValueOnce([
            {
                productId: 'PROD-1',
                sellerId: '1',
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
            },
            {
                productId: 'PROD-2',
                sellerId: '1',
                name: "item2",
                description: "does xyz",
                cost: 24,
                brand: "brand1",
                family: "series1",
                onSpecial: false,
                discount: 0.2,
                productTier: 1,
                nextProduct: "",
                releaseDate: "2025-04-05"
            }
        ]);

        const params = new URLSearchParams({
            name: 'P123123213',
            brand: "brand1",
            family: "series1",
            onSpecial: false
        });

        const response = await fetch(`${url}/products/?${params}`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ sellerId: '1', name: "item1" }),
                expect.objectContaining({ sellerId: '1', name: "item2" })
            ])
        );
    });

    test('HTTP 200: retrieve multiple product by partial name', async () => {
        prisma.product.findMany.mockResolvedValueOnce([
            {
                productId: 'PROD-1',
                sellerId: '1',
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
            },
            {
                productId: 'PROD-2',
                sellerId: '1',
                name: "item2",
                description: "does xyz",
                cost: 24,
                brand: "brand1",
                family: "series1",
                onSpecial: false,
                discount: 0.2,
                productTier: 1,
                nextProduct: "",
                releaseDate: "2025-04-05"
            },
        ]);

        const params = new URLSearchParams({
            name: 'PROD-1',
            brand: "brand1",
            family: "series1",
            onSpecial: false
        });

        const response = await fetch(`${url}/products/?${params}`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ sellerId: '1', name: "item1" }),
                expect.objectContaining({ sellerId: '1', name: "item2" })
            ])
        );
    });

});