import { createRating, getRatingByOrderId } from '../services/ratingService.js';
import { getOrderById } from '../services/orderService.js';

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

    const existing = await getRatingByOrderId(orderId);

    if (existing) {
      return res.status(409).json({ error: 'Rating already exists for this order.' });
    }

    const rating = await createRating({
      orderId,
      buyerId,
      score,
      comment: comment || null,
    });

    return res.status(201).json({
      ratingId: rating.ratingId,
      orderId: rating.orderId,
      buyerId: rating.buyerId,
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
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

    const rating = await getRatingByOrderId(orderId);

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found for this order.' });
    }

    return res.status(200).json({
      ratingId: rating.ratingId,
      orderId: rating.orderId,
      buyerId: rating.buyerId,
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
