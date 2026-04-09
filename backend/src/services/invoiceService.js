import fetch from 'node-fetch';

const INVOICE_BASE_URL = process.env.INVOICE_BASE_URL;
const INVOICE_API_KEY = process.env.INVOICE_API_KEY;

export async function createInvoice(order) {
  const { inputData, orderId } = order;

  const payload = {
    order_reference: orderId,
    customer_id: String(inputData.buyer?.companyId || inputData.buyerId || 'BUYER'),
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: inputData.order?.currencyID || 'AUD',
    supplier: {
      name: inputData.seller?.name || 'Supplier',
      identifier: inputData.seller?.companyId || 'SUPPLIER',
    },
    customer: {
      name: inputData.buyer?.name || 'Buyer',
      identifier: String(inputData.buyer?.companyId || inputData.buyerId || 'BUYER'),
    },
    items: (inputData.items || []).length > 0
    ? (inputData.items || []).map((item, i) => ({
        name: item.product?.name || `Item ${i + 1}`,
        description: item.product?.description || '',
        quantity: item.quantity || 1,
        unit_price: item.priceAmount || 0,
        unit_code: item.unitCode || 'EA',
        }))
    : [{ name: 'Order Item', description: '', quantity: 1, unit_price: 0, unit_code: 'EA' }],
    };

  const res = await fetch(`${INVOICE_BASE_URL}/v1/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': INVOICE_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Invoice API error: ${res.status}`);
  }

  return res.json();
}

export async function getInvoice(invoiceId) {
  const res = await fetch(`${INVOICE_BASE_URL}/v1/invoices/${invoiceId}`, {
    headers: {
      'Accept': 'application/json',
      'X-API-Key': INVOICE_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Invoice API error: ${res.status}`);
  }

  return res.json();
}

export async function getInvoiceXML(invoiceId) {
  const res = await fetch(`${INVOICE_BASE_URL}/v1/invoices/${invoiceId}`, {
    headers: {
      'Accept': 'application/xml',
      'X-API-Key': INVOICE_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Invoice API error: ${res.status}`);
  }

  return res.text();
}