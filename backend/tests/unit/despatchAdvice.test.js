import { jest } from '@jest/globals';

const mockFetch = jest.fn();
await jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));

process.env.DESPATCH_BASE_URL = 'https://mock-despatch-api.com/Prod';
process.env.DESPATCH_SESSION_ID = 'mock-session-id';

const { createDespatchAdvice, getDespatchAdvice } = await import(
  '../../src/services/despatchAdviceService.js'
);

function makeOkResponse(body) {
  return { ok: true, json: jest.fn().mockResolvedValue(body) };
}

function makeErrorResponse(status, body = {}) {
  return { ok: false, status, json: jest.fn().mockResolvedValue(body) };
}

const fullOrder = {
  orderId: 'ORD-2025-001',
  inputData: {
    order: { issueDate: '2025-04-01', note: 'Test order' },
    buyer: {
      name: 'John Smith',
      companyId: '123456789',
      street: '1 Buyer St',
      city: 'Sydney',
      postalCode: '2000',
      countryCode: 'AU',
    },
    seller: {
      name: 'Hardware Co',
      companyId: '987654321',
      street: '1 Seller St',
      buildingName: 'HQ',
      buildingNumber: '10',
      city: 'Melbourne',
      postalCode: '3000',
      countryCode: 'AU',
      addressLine: 'Level 1',
      contactName: 'Jane Doe',
      contactPhone: '0400000000',
      contactFax: '0398765432',
      contactEmail: 'jane@hardwareco.com',
    },
    delivery: {
      street: '1 Delivery Rd',
      city: 'Sydney',
      postalCode: '2000',
      countryCode: 'AU',
      requestedStartDate: '2025-04-05',
      requestedEndDate: '2025-04-07',
    },
    items: [
      {
        product: { name: 'Vacuum Cleaner', description: 'Bagless upright' },
        quantity: 2,
        unitCode: 'EA',
      },
    ],
  },
};

// Hits the falsy/fallback side of every branch
const minimalOrder = {
  orderId: 'ORD-MIN-001',
  inputData: {},
};

const orderWithBuyerId = {
  orderId: 'ORD-2025-002',
  inputData: {
    buyerId: '999',
    items: [],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createDespatchAdvice ────────────────────────────────────────────────────

describe('createDespatchAdvice', () => {
  test('calls the correct endpoint with sessionId header', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ despatchAdviceId: 'DA-ORD-2025-001' }));
    await createDespatchAdvice(fullOrder);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-despatch-api.com/Prod/despatch-advices',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          sessionId: 'mock-session-id',
        }),
      })
    );
  });

  test('builds payload correctly from full order data', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(fullOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.documentID).toBe('DA-ORD-2025-001');
    expect(body.orderReference.id).toBe('ORD-2025-001');
    expect(body.senderId).toBe('987654321');
    expect(body.receiverId).toBe('123456789');
    expect(body.issueDate).toBe('2025-04-01');
    expect(body.note).toBe('Test order');
  });

  test('falls back to SUPPLIER/BUYER when seller/buyer companyId missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.senderId).toBe('SUPPLIER');
    expect(body.receiverId).toBe('BUYER');
    expect(body.despatchSupplierParty.customerAssignedAccountId).toBe('SUPPLIER');
  });

  test('uses buyerId as receiverId when buyer object missing but buyerId present', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(orderWithBuyerId);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.receiverId).toBe('999');
  });

  test('falls back to todays date when issueDate missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const today = new Date().toISOString().split('T')[0];
    expect(body.issueDate).toBe(today);
  });

  test('falls back to default note when order note missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.note).toBe('Generated from order creation');
  });

  test('falls back to default seller party fields when seller missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const party = body.despatchSupplierParty.party;
    expect(party.name).toBe('Supplier');
    expect(party.postalAddress.countryIdentificationCode).toBe('AU');
    expect(party.postalAddress.streetName).toBe('');
    expect(party.contact.name).toBe('');
    expect(party.contact.telephone).toBe('');
    expect(party.contact.email).toBe('');
  });

  test('falls back to default buyer party fields when buyer missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const party = body.deliveryCustomerParty.party;
    expect(party.name).toBe('Buyer');
    expect(party.postalAddress.countryIdentificationCode).toBe('AU');
  });

  test('falls back to buyer address when delivery address missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    const orderBuyerNoDelivery = {
      orderId: 'ORD-2025-003',
      inputData: {
        buyer: { name: 'Bob', street: 'Buyer St', city: 'Brisbane', postalCode: '4000', countryCode: 'AU' },
        items: [],
      },
    };
    await createDespatchAdvice(orderBuyerNoDelivery);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const addr = body.deliveryCustomerParty.party.postalAddress;
    expect(addr.streetName).toBe('Buyer St');
    expect(addr.cityName).toBe('Brisbane');
  });

  test('falls back to issueDate for delivery period when delivery dates missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    const orderNoDeliveryDates = {
      orderId: 'ORD-2025-004',
      inputData: {
        order: { issueDate: '2025-05-01' },
        delivery: { street: '1 Rd', city: 'Perth', postalCode: '6000', countryCode: 'AU' },
        items: [],
      },
    };
    await createDespatchAdvice(orderNoDeliveryDates);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.shipment.delivery.requestedDeliveryPeriod.startDate).toBe('2025-05-01');
    expect(body.shipment.delivery.requestedDeliveryPeriod.endDate).toBe('2025-05-01');
  });

  test('falls back to todays date for delivery period when all dates missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const today = new Date().toISOString().split('T')[0];
    expect(body.shipment.delivery.requestedDeliveryPeriod.startDate).toBe(today);
    expect(body.shipment.delivery.requestedDeliveryPeriod.endDate).toBe(today);
  });

  test('builds despatch lines from items', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(fullOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.despatchLines).toHaveLength(1);
    expect(body.despatchLines[0]).toMatchObject({
      id: 'LINE-1',
      deliveredQuantity: 2,
      deliveredQuantityUnitCode: 'EA',
      item: { name: 'Vacuum Cleaner', description: 'Bagless upright' },
    });
  });

  test('falls back to default quantity/unitCode/name when item fields missing', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    const orderMinimalItems = {
      orderId: 'ORD-2025-005',
      inputData: { items: [{ product: null }] },
    };
    await createDespatchAdvice(orderMinimalItems);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.despatchLines[0].deliveredQuantity).toBe(1);
    expect(body.despatchLines[0].deliveredQuantityUnitCode).toBe('EA');
    expect(body.despatchLines[0].item.name).toBe('Item 1');
    expect(body.despatchLines[0].item.description).toBe('');
  });

  test('falls back to single default line when items is empty array', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(orderWithBuyerId);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.despatchLines).toHaveLength(1);
    expect(body.despatchLines[0].item.name).toBe('Order Item');
  });

  test('falls back to single default line when items is undefined', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({}));
    await createDespatchAdvice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.despatchLines).toHaveLength(1);
    expect(body.despatchLines[0].item.name).toBe('Order Item');
  });

  test('returns parsed response on success', async () => {
    const mockResponse = { despatchAdviceId: 'DA-ORD-2025-001', status: 'Active' };
    mockFetch.mockResolvedValue(makeOkResponse(mockResponse));

    const result = await createDespatchAdvice(fullOrder);
    expect(result).toEqual(mockResponse);
  });

  test('throws with API error message on non-ok response', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(400, { message: 'Invalid payload' }));
    await expect(createDespatchAdvice(fullOrder)).rejects.toThrow('Invalid payload');
  });

  test('throws with status code when error response has no message', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500));
    await expect(createDespatchAdvice(fullOrder)).rejects.toThrow('Despatch Advice API error: 500');
  });
});

// ─── getDespatchAdvice ───────────────────────────────────────────────────────

describe('getDespatchAdvice', () => {
  test('calls the correct endpoint with despatch advice ID', async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ despatchAdviceId: 'DA-ORD-2025-001' }));
    await getDespatchAdvice('DA-ORD-2025-001');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-despatch-api.com/Prod/despatch-advices/DA-ORD-2025-001',
      expect.objectContaining({
        headers: expect.objectContaining({ sessionId: 'mock-session-id' }),
      })
    );
  });

  test('returns parsed response on success', async () => {
    const mockResponse = { despatchAdviceId: 'DA-ORD-2025-001', status: 'Active' };
    mockFetch.mockResolvedValue(makeOkResponse(mockResponse));

    const result = await getDespatchAdvice('DA-ORD-2025-001');
    expect(result).toEqual(mockResponse);
  });

  test('throws with API error message on non-ok response', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(404, { message: 'Despatch advice not found' }));
    await expect(getDespatchAdvice('DA-ORD-2025-001')).rejects.toThrow('Despatch advice not found');
  });

  test('throws with status code when error response has no message', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500));
    await expect(getDespatchAdvice('DA-ORD-2025-001')).rejects.toThrow('Despatch Advice API error: 500');
  });
});