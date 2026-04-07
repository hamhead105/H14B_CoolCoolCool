import { jest } from '@jest/globals';

const mPrisma = {
    product: {
        findUnique: jest.fn()
    },
    special: {
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
            if (token === 'Seller token') {
                return { sellerId: 1, role: 'seller' };
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
    await prisma.special.deleteMany({});
});

describe('POST /specials', () => {
    test('HTTP 401: invalid token', async () => {
        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Invalid token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01',
                endDate: '2026-04-30'
            })
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 401: missing token', async () => {
        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01',
                endDate: '2026-04-30'
            })
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 400: bad json', async () => {
        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: '{ invalid json'
        });

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Bad JSON' });
    });

    test('HTTP 400: missing required fields', async () => {
        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-1',
                discount: 0.25,
                startDate: '2026-04-01'
            })
        });

        expect(response.status).toBe(400);
    });

    test('HTTP 404: product not found', async () => {
        prisma.product.findUnique.mockResolvedValueOnce(null);

        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-404',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01',
                endDate: '2026-04-30'
            })
        });

        expect(response.status).toBe(404);
    });

    test('HTTP 409: product already on special', async () => {
        prisma.product.findUnique.mockResolvedValueOnce({
            productId: 'PROD-1',
            name: 'item1',
            description: 'does xyz'
        });
        prisma.special.findUnique.mockResolvedValueOnce({
            productId: 'PROD-1',
            discount: 0.20
        });

        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01',
                endDate: '2026-04-30'
            })
        });

        expect(response.status).toBe(409);
    });

    test('HTTP 200: create special successfully', async () => {
        prisma.product.findUnique.mockResolvedValueOnce({
            productId: 'PROD-1',
            name: 'item1',
            description: 'does xyz'
        });
        prisma.special.findUnique.mockResolvedValueOnce(null);
        prisma.special.create.mockResolvedValueOnce({
            productId: 'PROD-1',
            discount: 0.25,
            theme: 'Winter Sale',
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-04-30T00:00:00.000Z'
        });

        const response = await fetch(`${url}/specials`, {
            method: 'POST',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01',
                endDate: '2026-04-30'
            })
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            productId: 'PROD-1',
            discount: 0.25,
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-04-30T00:00:00.000Z'
        });
    });
});