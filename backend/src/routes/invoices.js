import express from 'express';
import { postInvoice, fetchInvoice, fetchInvoiceXML } from '../controllers/invoiceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /orders/{id}/invoice:
 *   post:
 *     summary: Generate invoice for an order, sets status to despatched
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice created }
 *       403: { description: Sellers only }
 *       404: { description: Order not found }
 *       500: { description: Invoice generation failed }
 */
router.post('/:id/invoice', authMiddleware, postInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID (JSON)
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice detail }
 */
router.get('/:invoiceId', authMiddleware, fetchInvoice);

/**
 * @swagger
 * /invoices/{invoiceId}/xml:
 *   get:
 *     summary: Get invoice as UBL 2.1 XML
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: UBL XML invoice }
 */
router.get('/:invoiceId/xml', authMiddleware, fetchInvoiceXML);

export default router;