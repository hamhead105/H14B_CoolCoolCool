import { createInvoice, getInvoice, getInvoiceXML } from '../services/invoiceService.js';
import { getOrderById, updateOrder } from '../services/orderService.js';

export async function postInvoice(req, res) {
  const { id } = req.params;

  try {
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const invoice = await createInvoice(order);

    await updateOrder(id, {
    status: 'invoiced',
    externalInvoiceId: invoice.invoice.invoice_id,
    invoiceStatus: invoice.invoice.status,
    invoiceMetadata: invoice.invoice,
    });
    
    return res.status(200).json({ invoice: invoice.invoice });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export async function fetchInvoice(req, res) {
  const { invoiceId } = req.params;
  try {
    const invoice = await getInvoice(invoiceId);
    return res.status(200).json(invoice);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export async function fetchInvoiceXML(req, res) {
  const { invoiceId } = req.params;
  try {
    const xml = await getInvoiceXML(invoiceId);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}   