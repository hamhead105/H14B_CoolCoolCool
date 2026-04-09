import { create_xml, getLineExtension, getTaxAmount, getPayableAmount } from '../services/xmlService.js';
import { createOrder, getOrderById, updateOrder, deleteOrderById, getAllOrders } from '../services/orderService.js';
import { sendOrderEmail, isEmailConfigured } from '../services/emailService.js';
import { createInvoice } from '../services/invoiceService.js';

const LOYALTY_COEFF = 0.08;

export async function postOrder(req, res) {
  const buyerId = req.user.buyerId;

  const { order, buyer, seller, delivery, tax, items, loyaltyPointsRedeemed } = req.body;

  if (!order?.id || !buyer?.companyId || !items || !Array.isArray(items)) {
    return res.status(422).json({
      error: 'Missing required fields: order.id, buyer.companyId, and items array are mandatory.'
    });
  }

  try {
    const initializedItems = items.map(item => ({
      ...item,
      itemStatus: 'pending'
    }));

    const enrichedBody = { ...req.body, items: initializedItems };

    const xml_output = create_xml(enrichedBody);
    const taxAmount = Number(getTaxAmount(enrichedBody).toFixed(2));
    const payableAmount = Number(getPayableAmount(enrichedBody).toFixed(2));
    const lineExtensionAmount = getLineExtension(enrichedBody);
    const loyaltyPointsEarned = Math.round(payableAmount * LOYALTY_COEFF);

    let createdOrder;

    try {
      createdOrder = await createOrder({
        orderId: order.id,
        buyerId: parseInt(buyerId, 10),
        status: 'order placed',
        inputData: enrichedBody,
        totalCost: payableAmount,
        taxAmount,
        payableAmount,
        anticipatedMonetaryTotal: lineExtensionAmount,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed: 0,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Duplicate order: An order with this ID already exists.',
        });
      }
      throw error;
    }

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);

    if (isEmailConfigured() && buyer.email && buyer.email !== 'NOT-PROVIDED') {
      try {
        await sendOrderEmail(buyer.email, order.id, xml_output);
        console.log(`UBL email sent to ${buyer.email} for order ${order.id}`);
      } catch (emailError) {
        console.error('Failed to send UBL email:', emailError);
      }
    } else if (!isEmailConfigured()) {
      console.log('Email service not configured, skipping UBL email send');
    }

    return res.status(200).json({
      orderId: order.id,
      status: 'order placed',
      totalCost: payableAmount,
      taxAmount,
      payableAmount,
      anticipatedMonetaryTotal: lineExtensionAmount,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed: 0,
      ublDocument: xml_output,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getOrder(req, res) {
  const orderId = req.params.id;

  try {
    const found = await getOrderById(orderId);
    
    if (!found) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const xml_output = create_xml(found.inputData);

    return res.status(200).json({
      ...found,
      inputData: {
        ...found.inputData,
        ublDocument: xml_output
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteOrder(req, res) {
    const orderId = req.params.id;

  try {
    const found = await getOrderById(orderId);

    if (!found) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await deleteOrderById(orderId);

    return res.status(200).json({
      message: 'Order deleted successfully',
      id: orderId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      detail: error.message
    });
  }
}

export async function putOrder(req, res) {
  const orderId = req.params.id;
  const { status, sellerId, order, buyer, seller, delivery, tax, items } = req.body;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(422).json({ error: 'No valid fields provided.' });
  }

  try {
    const existing = await getOrderById(orderId);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    let updatedItems = items || [...existing.inputData.items];

    if (sellerId && status) {
      updatedItems = updatedItems.map(item =>
        String(item.sellerId) === String(sellerId)
          ? { ...item, itemStatus: status }
          : item
      );
    }

    let globalStatus = existing.status;
    const allStatuses = updatedItems.map(i => i.itemStatus);

    if (allStatuses.every(s => s === 'despatched')) {
      globalStatus = 'despatched';
    } else if (allStatuses.some(s => s === 'despatched' || s === 'confirmed')) {
      globalStatus = 'partially fulfilled';
    }

    const mergedInput = {
      ...existing.inputData,
      order:    { ...existing.inputData.order,    ...(order || {}) },
      buyer:    { ...existing.inputData.buyer,    ...(buyer || {}) },
      seller:   { ...existing.inputData.seller,   ...(seller || {}) },
      delivery: { ...existing.inputData.delivery, ...(delivery || {}) },
      tax:      { ...existing.inputData.tax,      ...(tax || {}) },
      items:    updatedItems,
    };

    const xml_output = create_xml(mergedInput);
    const taxAmount = Number(getTaxAmount(mergedInput).toFixed(2));
    const payableAmount = Number(getPayableAmount(mergedInput).toFixed(2));

    // Base update — always applied
    const orderUpdate = {
      status: globalStatus,
      inputData: mergedInput,
      totalCost: payableAmount,
      taxAmount,
      payableAmount,
      anticipatedMonetaryTotal: getLineExtension(mergedInput),
    };

    // Auto-generate invoice when all items hit despatched for the first time
    let invoice = null;
    if (globalStatus === 'despatched' && !existing.externalInvoiceId) {
      try {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 7);

        invoice = await createInvoice({
          orderId: orderId,
          inputData: mergedInput,
        });

        orderUpdate.externalInvoiceId = invoice.invoice.invoice_id;
        orderUpdate.invoiceStatus = invoice.invoice.status;
        orderUpdate.invoiceMetadata = invoice.invoice;
      } catch (invoiceError) {
        console.error('Failed to auto-generate invoice:', invoiceError.message);
        orderUpdate.invoiceError = invoiceError.message;
      }
    }

    await updateOrder(orderId, orderUpdate);

    return res.status(200).json({
      orderId,
      status: globalStatus,
      totalCost: payableAmount,
      inputData: { ...mergedInput, ublDocument: xml_output },
      ...(invoice && { invoice: invoice.invoice }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function listOrders(req, res) {
  const { buyerId, status } = req.query;

  const filters = {};
  if (buyerId) filters.buyerId = buyerId;
  if (status) filters.status = status;

  try {
    const orders = await getAllOrders(filters);
    return res.status(200).json(orders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      totalCost: o.totalCost,
      createdAt: o.createdAt,
      inputData: o.inputData,
      rating: o.ratingScore ? {
        score: o.ratingScore,
        comment: o.ratingComment
      } : null
    })));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function postRating(req, res) {
  const orderId = req.params.id;
  const buyerId = req.user.buyerId;
  const role = req.user.role;

  if (role !== 'buyer') {
    return res.status(403).json({ error: 'Only buyers can rate orders.' });
  }

  const { score, comment } = req.body;

  if (score === undefined || score === null || !Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(422).json({ error: 'Score is required and must be an integer between 1 and 5.' });
  }

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'You can only rate your own orders.' });
    }

    if (order.ratingScore !== null) {
      return res.status(409).json({ error: 'Rating already exists for this order.' });
    }

    await updateOrder(orderId, {
      ratingScore: score,
      ratingComment: comment || null
    });

    return res.status(201).json({
      orderId,
      score,
      comment: comment || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getRating(req, res) {
  const orderId = req.params.id;

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.ratingScore === null) {
      return res.status(404).json({ error: 'Rating not found for this order.' });
    }

    return res.status(200).json({
      orderId,
      score: order.ratingScore,
      comment: order.ratingComment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
