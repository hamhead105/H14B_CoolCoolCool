import express from 'express';
import { emailOrder } from '../controllers/emailController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /orders/{id}/email:
 *   post:
 *     summary: Generate UBL XML for an order and email it to a recipient
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail]
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: "recipient@example.com"
 *                 description: The email address to send the UBL XML to
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 orderId: { type: string }
 *                 recipientEmail: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       422:
 *         description: Missing recipientEmail
 *       500:
 *         description: Server error / email delivery failure
 */
router.post('/:id/email', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  emailOrder(req, res);
});

export default router;
