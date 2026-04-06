import { jest } from '@jest/globals';

const mPrisma = {
    special: {
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
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

describe('PUT /specials/:productId', () => {
    test('HTTP 401: invalid token', async () => {
        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'PUT',
            headers: {
                Authorization: 'Invalid token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discount: 0.30
            })
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 401: missing token', async () => {
        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discount: 0.30
            })
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 400: no valid fields provided', async () => {
        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'PUT',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        expect(response.status).toBe(400);
    });

    test('HTTP 404: special not found', async () => {
        prisma.special.findUnique.mockResolvedValueOnce(null);

        const response = await fetch(`${url}/specials/PROD-404`, {
            method: 'PUT',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discount: 0.30
            })
        });

        expect(response.status).toBe(404);
    });

    test('HTTP 200: update discount only', async () => {
        prisma.special.findUnique
            .mockResolvedValueOnce({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                endDate: '2026-04-30T00:00:00.000Z'
            })
            .mockResolvedValueOnce({
                productId: 'PROD-1',
                discount: 0.30,
                theme: 'Winter Sale',
                endDate: '2026-04-30T00:00:00.000Z'
            });

        prisma.special.update.mockResolvedValueOnce({
            productId: 'PROD-1',
            discount: 0.30,
            theme: 'Winter Sale',
            endDate: '2026-04-30T00:00:00.000Z'
        });

        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'PUT',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discount: 0.30
            })
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            productId: 'PROD-1',
            discount: 0.30,
            theme: 'Winter Sale',
            endDate: '2026-04-30T00:00:00.000Z'
        });
    });

    test('HTTP 200: update multiple fields', async () => {
        prisma.special.findUnique
            .mockResolvedValueOnce({
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                endDate: '2026-04-30T00:00:00.000Z'
            })
            .mockResolvedValueOnce({
                productId: 'PROD-1',
                discount: 0.35,
                theme: 'EOFY',
                endDate: '2026-05-15T00:00:00.000Z'
            });

        prisma.special.update.mockResolvedValueOnce({
            productId: 'PROD-1',
            discount: 0.35,
            theme: 'EOFY',
            endDate: '2026-05-15T00:00:00.000Z'
        });

        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'PUT',
            headers: {
                Authorization: 'Seller token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discount: 0.35,
                theme: 'EOFY',
                endDate: '2026-05-15'
            })
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            productId: 'PROD-1',
            discount: 0.35,
            theme: 'EOFY',
            endDate: '2026-05-15T00:00:00.000Z'
        });
    });
});