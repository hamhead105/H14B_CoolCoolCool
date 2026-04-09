import { jest } from '@jest/globals';

process.env.INVOICE_BASE_URL = 'https://mock-invoice-api.com';
process.env.INVOICE_API_KEY = 'mock-api-key';

// Mock node-fetch
const mockFetch = jest.fn();
await jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch,
}));

const { createInvoice, getInvoice, getInvoiceXML } = await import('../../src/services/invoiceService.js');

const mockOrder = {
  orderId: 'ORD-2025-001',
  inputData: {
    order: { currencyID: 'AUD' },
    buyer: { name: 'John Smith', companyId: '123456789' },
    seller: { name: 'Hardware Co', companyId: '987654321' },
    items: [
      {
        product: { name: 'Vacuum Cleaner', description: 'Bagless upright' },
        quantity: 2,
        priceAmount: 299.99,
        unitCode: 'EA',
      },
    ],
  },
};

const mockInvoiceResponse = {
  message: 'Invoice created',
  invoice: {
    invoice_id: 'INV-TEST-001',
    status: 'draft',
    order_reference: 'ORD-2025-001',
    currency: 'AUD',
    payable_amount: 692.97,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INVOICE_BASE_URL = 'https://mock-invoice-api.com';
  process.env.INVOICE_API_KEY = 'mock-api-key';
});

// ─── createInvoice ────────────────────────────────────────────────────────────

describe('createInvoice', () => {
  test('sends correct payload and returns invoice on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockInvoiceResponse),
    });

    const result = await createInvoice(mockOrder);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-invoice-api.com/v1/invoices',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'mock-api-key',
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verify payload shape
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      order_reference: 'ORD-2025-001',
      customer_id: '123456789',
      currency: 'AUD',
      supplier: { name: 'Hardware Co', identifier: '987654321' },
      customer: { name: 'John Smith', identifier: '123456789' },
      items: [
        expect.objectContaining({
          name: 'Vacuum Cleaner',
          quantity: 2,
          unit_price: 299.99,
        }),
      ],
    });

    expect(result).toEqual(mockInvoiceResponse);
  });

  test('throws with API error message when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ message: 'Invalid customer_id' }),
    });

    await expect(createInvoice(mockOrder)).rejects.toThrow('Invalid customer_id');
  });

  test('throws generic error when error response has no message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(createInvoice(mockOrder)).rejects.toThrow('Invoice API error: 500');
  });

  test('falls back to defaults when inputData fields are missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockInvoiceResponse),
    });

    const minimalOrder = {
      orderId: 'ORD-MIN-001',
      inputData: {}, // no buyer, seller, items, order
    };

    await createInvoice(minimalOrder);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.customer_id).toBe('BUYER');
    expect(body.currency).toBe('AUD');
    expect(body.supplier.name).toBe('Supplier');
    expect(body.customer.name).toBe('Buyer');
    expect(body.items).toEqual([
        { name: 'Order Item', description: '', quantity: 1, unit_price: 0, unit_code: 'EA' }
    ]);
  });

  test('uses Item N fallback when product name is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockInvoiceResponse),
    });

    const orderWithBlankItem = {
      orderId: 'ORD-2025-002',
      inputData: {
        ...mockOrder.inputData,
        items: [{ quantity: 1, priceAmount: 10 }], // no product field
      },
    };

    await createInvoice(orderWithBlankItem);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.items[0].name).toBe('Item 1');
    expect(body.items[0].unit_code).toBe('EA');
  });
});

// ─── getInvoice ───────────────────────────────────────────────────────────────

describe('getInvoice', () => {
  test('fetches invoice JSON by ID', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockInvoiceResponse.invoice),
    });

    const result = await getInvoice('INV-TEST-001');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-invoice-api.com/v1/invoices/INV-TEST-001',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-API-Key': 'mock-api-key',
        }),
      })
    );
    expect(result).toEqual(mockInvoiceResponse.invoice);
  });

  test('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: 'Invoice not found' }),
    });

    await expect(getInvoice('BAD-ID')).rejects.toThrow('Invoice not found');
  });

  test('throws generic error when error body is unparseable', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    });

    await expect(getInvoice('INV-TEST-001')).rejects.toThrow('Invoice API error: 503');
  });
});

// ─── getInvoiceXML ────────────────────────────────────────────────────────────

describe('getInvoiceXML', () => {
  test('fetches invoice XML by ID', async () => {
    const xmlString = '<?xml version="1.0"?><Invoice></Invoice>';

    mockFetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(xmlString),
    });

    const result = await getInvoiceXML('INV-TEST-001');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-invoice-api.com/v1/invoices/INV-TEST-001',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/xml',
          'X-API-Key': 'mock-api-key',
        }),
      })
    );
    expect(result).toBe(xmlString);
  });

  test('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: 'Invoice not found' }),
    });

    await expect(getInvoiceXML('BAD-ID')).rejects.toThrow('Invoice not found');
  });

  test('throws generic error when error body is unparseable', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    });

    await expect(getInvoiceXML('INV-TEST-001')).rejects.toThrow('Invoice API error: 500');
  });
});