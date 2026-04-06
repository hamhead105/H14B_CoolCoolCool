import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn()
};

const mSendMail = jest.fn();

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
      return { buyerId: 1, role: 'buyer' };
    })
  }
}));

await jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: mSendMail
    }))
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

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleOrder = {
  orderId: 'ORD-001',
  buyerId: 1,
  status: 'order placed',
  totalCost: 100,
  taxAmount: 10,
  payableAmount: 110,
  anticipatedMonetaryTotal: 100,
  createdAt: new Date(),
  inputData: {
    order: {
      id: 'ORD-001',
      issueDate: '2025-04-01',
      note: 'Test',
      currencyID: 'AUD',
      orderDocumentReference: ''
    },
    buyer: {
      name: 'John', street: '123 St', city: 'Sydney',
      postalCode: '2000', countryCode: 'AU', companyId: '111',
      legalEntityId: '111', taxSchemeId: 'GST',
      contactName: 'John', contactPhone: '0400000000', contactEmail: 'john@test.com'
    },
    seller: {
      name: 'Seller Co', street: '456 Ave', city: 'Melbourne',
      postalCode: '3000', countryCode: 'AU', companyId: '222',
      legalEntityId: '222', taxSchemeId: 'GST',
      contactName: 'Jane', contactPhone: '0411111111', contactEmail: 'jane@seller.com'
    },
    delivery: {
      street: '123 St', city: 'Sydney', postalCode: '2000',
      countryCode: 'AU', requestedStartDate: '2025-04-05', requestedEndDate: '2025-04-07'
    },
    tax: { taxTypeCode: 'GST', taxPercent: 10.0 },
    items: [
      {
        id: 'LINE-1',
        product: { sellersItemId: 'P1', name: 'Widget', description: 'A widget' },
        quantity: 2, unitCode: 'EA', priceAmount: 50
      }
    ]
  }
};

describe('POST /orders/:id/email', () => {

  test('HTTP 401: missing token', async () => {
    const res = await fetch(`${url}/orders/ORD-001/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'a@b.com' })
    });
    expect(res.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const res = await fetch(`${url}/orders/ORD-001/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Invalid token' },
      body: JSON.stringify({ recipientEmail: 'a@b.com' })
    });
    expect(res.status).toBe(401);
  });

  test('HTTP 422: missing recipientEmail', async () => {
    const res = await fetch(`${url}/orders/ORD-001/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/recipientEmail/);
  });

  test('HTTP 404: order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const res = await fetch(`${url}/orders/ORD-NOPE/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: JSON.stringify({ recipientEmail: 'a@b.com' })
    });
    expect(res.status).toBe(404);
  });

  test('HTTP 200: email sent successfully', async () => {
    prisma.order.findUnique.mockResolvedValue(sampleOrder);
    mSendMail.mockResolvedValue({ messageId: '<abc@test>' });

    const res = await fetch(`${url}/orders/ORD-001/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: JSON.stringify({ recipientEmail: 'recipient@example.com' })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      orderId: 'ORD-001',
      recipientEmail: 'recipient@example.com'
    });
    expect(data.message).toMatch(/sent/i);
    expect(mSendMail).toHaveBeenCalledTimes(1);

    const call = mSendMail.mock.calls[0][0];
    expect(call.to).toBe('recipient@example.com');
    expect(call.attachments[0].filename).toBe('ORD-001.xml');
    expect(call.attachments[0].content).toContain('<Order');
    expect(call.attachments[0].content).toContain('UBLVersionID');
  });

  test('HTTP 500: email delivery failure', async () => {
    prisma.order.findUnique.mockResolvedValue(sampleOrder);
    mSendMail.mockRejectedValue(new Error('SMTP connection refused'));

    const res = await fetch(`${url}/orders/ORD-001/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: JSON.stringify({ recipientEmail: 'a@b.com' })
    });
    expect(res.status).toBe(500);
  });
});
