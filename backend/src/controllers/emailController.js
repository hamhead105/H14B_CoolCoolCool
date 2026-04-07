import { getOrderById } from '../services/orderService.js';
import { create_xml } from '../services/xmlService.js';
import { sendOrderEmail } from '../services/emailService.js';

export async function emailOrder(req, res) {
  const orderId = req.params.id;
  const { recipientEmail } = req.body;

  if (!recipientEmail) {
    return res.status(422).json({ error: 'recipientEmail is required.' });
  }

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const xml = create_xml(order.inputData);

    await sendOrderEmail(recipientEmail, orderId, xml);

    return res.status(200).json({
      message: `UBL XML for order ${orderId} sent to ${recipientEmail}`,
      orderId,
      recipientEmail,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
