import express from 'express';
import { postRating, getRating } from '../controllers/ratingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /orders/{id}/rating:
 *   post:
 *     summary: Submit a rating for a completed order
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score]
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: Rating score from 1 to 5
 *               comment:
 *                 type: string
 *                 example: "Great service, fast delivery!"
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratingId: { type: integer, example: 1 }
 *                 orderId: { type: string, example: "ORD-2025-001" }
 *                 buyerId: { type: integer, example: 1 }
 *                 score: { type: integer, example: 4 }
 *                 comment: { type: string, example: "Great service, fast delivery!" }
 *                 createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – only buyers can rate their own orders
 *       404:
 *         description: Order not found
 *       409:
 *         description: Rating already exists for this order
 *       422:
 *         description: Invalid score – must be an integer between 1 and 5
 *       500:
 *         description: Server error
 */
router.post('/:id/rating', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  postRating(req, res);
});

/**
 * @swagger
 * /orders/{id}/rating:
 *   get:
 *     summary: Retrieve the rating for a specific order
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID to get the rating for
 *     responses:
 *       200:
 *         description: Rating retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratingId: { type: integer, example: 1 }
 *                 orderId: { type: string, example: "ORD-2025-001" }
 *                 buyerId: { type: integer, example: 1 }
 *                 score: { type: integer, example: 4 }
 *                 comment: { type: string, example: "Great service, fast delivery!" }
 *                 createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or rating not found
 *       500:
 *         description: Server error
 */
router.get('/:id/rating', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getRating(req, res);
});

export default router;
