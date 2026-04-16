import {
  createDespatchAdvice,
  getDespatchAdvice,
} from '../services/despatchAdviceService.js';
import { getOrderById, updateOrder } from '../services/orderService.js';

export async function postDespatchAdvice(req, res) {
  const { id } = req.params;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const despatchAdvice = await createDespatchAdvice(order);

    await updateOrder(id, {
      status: 'despatched',
      externalDespatchAdviceId: despatchAdvice.despatchAdviceId,
      despatchAdviceMetadata: despatchAdvice,
    });

    return res.status(200).json({ despatchAdvice });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export async function fetchDespatchAdvice(req, res) {
  const { despatchAdviceId } = req.params;

  try {
    const despatchAdvice = await getDespatchAdvice(despatchAdviceId);
    return res.status(200).json(despatchAdvice);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}