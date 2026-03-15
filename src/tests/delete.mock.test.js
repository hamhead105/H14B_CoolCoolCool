const request = require('supertest');
const fs = require('fs');

// Mock swagger-jsdoc to prevent file reading issues during tests
jest.mock('swagger-jsdoc', () => {
    return jest.fn(() => ({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
    }));
});

// Mock swagger-ui-express
jest.mock('swagger-ui-express', () => ({
    serve: (req, res, next) => next(),
    setup: () => (req, res) => res.json({ message: 'swagger ui' })
}));

// Mock the entire input module
jest.mock('../input.js', () => ({
    create_xml: jest.fn()
}));

// Mock the file system operations
jest.mock('fs');

const app = require('../server.js');
const { create_xml } = require('../input.js');

// Mock data
const mockOrder = {
    order: { id: "ORDER-123" },
    buyer: { companyId: "BUYER-456" },
    seller: { companyId: "SELLER-789" },
    items: [
        { id: "ITEM-1", quantity: 2, price: 10.50 }
    ]
};

const mockXmlOutput = `<?xml version="1.0" encoding="UTF-8"?>
<Order>
    <ID>ORDER-123</ID>
    <BuyerCompanyID>BUYER-456</BuyerCompanyID>
</Order>`;

describe('DELETE /order/:id', () => {
    let mockFs;
    let mockCreateXml;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Setup fs mocks
        mockFs = fs;
        mockFs.readFileSync.mockReturnValue(mockXmlOutput);
        mockFs.appendFileSync.mockReturnValue(undefined);
        mockFs.existsSync.mockReturnValue(true);
        mockFs.writeFileSync.mockReturnValue(undefined);

        // Setup input.js mocks
        mockCreateXml = create_xml;
        mockCreateXml.mockReturnValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should successfully delete an order with valid ID', async () => {
        const response = await request(app)
            .delete('/order/ORDER-123')
            .set('Authorisation', 'Valid token');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            message: 'Order deleted successfully',
            id: 'ORDER-123'
        });
        expect(response.body.deleteAt).toBeDefined();
    });

    test('should return valid ISO timestamp', async () => {
        const response = await request(app)
            .delete('/order/ORDER-123')
            .set('Authorisation', 'Valid token');

        expect(response.status).toBe(200);
        expect(response.body.deleteAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}s$/);
        
        // Verify it's a valid date
        const deleteTime = new Date(response.body.deleteAt);
        expect(deleteTime).toBeInstanceOf(Date);
        expect(deleteTime.getTime()).not.toBeNaN();
    });

    test('should handle malformed JSON in request body', async () => {
        const response = await request(app)
            .delete('/order/ORDER-123')
            .set('Content-Type', 'application/json')
            .send('{"invalid-json":}');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad JSON');
    });

    test('should integrate with order creation and deletion flow', async () => {
        // First create an order (mocked)
        const createResponse = await request(app)
            .post('/orders')
            .set('Authorisation', 'Valid token')
            .send(mockOrder);

        expect(createResponse.status).toBe(200);

        // Then delete the order
        const deleteResponse = await request(app)
            .delete('/order/ORDER-123')
            .set('Authorisation', 'Valid token');

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.id).toBe('ORDER-123');

        // Verify create_xml was called during creation
        expect(create_xml).toHaveBeenCalledWith(mockOrder);
    });
});
