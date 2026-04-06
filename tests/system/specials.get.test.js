import { jest } from '@jest/globals';

const mPrisma = {
    special: {
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn()
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

describe('GET /specials', () => {
    test('HTTP 401: invalid token', async () => {
        const response = await fetch(`${url}/specials`, {
            headers: { Authorization: 'Invalid token' }
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 401: missing token', async () => {
        const response = await fetch(`${url}/specials`);
        expect(response.status).toBe(401);
    });

    test('HTTP 200: retrieve empty specials list', async () => {
        prisma.special.findMany.mockResolvedValueOnce([]);

        const response = await fetch(`${url}/specials`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
    });

    test('HTTP 200: retrieve one special', async () => {
        prisma.special.findMany.mockResolvedValueOnce([
            {
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-30T00:00:00.000Z',
                product: {
                    name: 'item1',
                    description: 'does xyz'
                }
            }
        ]);

        const response = await fetch(`${url}/specials`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([
            {
                productId: 'PROD-1',
                name: 'item1',
                description: 'does xyz',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-30T00:00:00.000Z'
            }
        ]);
    });

    test('HTTP 200: retrieve multiple specials', async () => {
        prisma.special.findMany.mockResolvedValueOnce([
            {
                productId: 'PROD-1',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-30T00:00:00.000Z',
                product: {
                    name: 'item1',
                    description: 'does xyz'
                }
            },
            {
                productId: 'PROD-2',
                discount: 0.10,
                theme: 'Flash Deal',
                startDate: '2026-04-10T00:00:00.000Z',
                endDate: '2026-04-20T00:00:00.000Z',
                product: {
                    name: 'item2',
                    description: 'does abc'
                }
            }
        ]);

        const response = await fetch(`${url}/specials`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([
            {
                productId: 'PROD-1',
                name: 'item1',
                description: 'does xyz',
                discount: 0.25,
                theme: 'Winter Sale',
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-30T00:00:00.000Z'
            },
            {
                productId: 'PROD-2',
                name: 'item2',
                description: 'does abc',
                discount: 0.10,
                theme: 'Flash Deal',
                startDate: '2026-04-10T00:00:00.000Z',
                endDate: '2026-04-20T00:00:00.000Z'
            }
        ]);
    });
});

describe('GET /specials/:productId', () => {
    test('HTTP 401: invalid token', async () => {
        const response = await fetch(`${url}/specials/PROD-1`, {
            headers: { Authorization: 'Invalid token' }
        });

        expect(response.status).toBe(401);
    });

    test('HTTP 401: missing token', async () => {
        const response = await fetch(`${url}/specials/PROD-1`);
        expect(response.status).toBe(401);
    });

    test('HTTP 404: special not found', async () => {
        prisma.special.findUnique.mockResolvedValueOnce(null);

        const response = await fetch(`${url}/specials/PROD-404`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(404);
    });

    test('HTTP 200: retrieve special details', async () => {
        prisma.special.findUnique.mockResolvedValueOnce({
            productId: 'PROD-1',
            discount: 0.25,
            theme: 'Winter Sale',
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-04-30T00:00:00.000Z',
            product: {
                name: 'item1',
                description: 'does xyz'
            }
        });

        const response = await fetch(`${url}/specials/PROD-1`, {
            method: 'GET',
            headers: {
                Authorization: 'Valid token'
            }
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            productId: 'PROD-1',
            name: 'item1',
            description: 'does xyz',
            discount: 0.25,
            theme: 'Winter Sale',
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2026-04-30T00:00:00.000Z'
        });
    });
});