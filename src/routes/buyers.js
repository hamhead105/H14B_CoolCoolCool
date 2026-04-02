import express from 'express';
import { register, login, getProfile, deleteProfile } from '../controllers/buyerController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /buyers/register:
 *   post:
 *     summary: Register a new buyer account
 *     tags: [Buyers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, street, city, postalCode, countryCode]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               postalCode: { type: string }
 *               countryCode: { type: string }
 *               companyId: { type: string }
 *               taxSchemeId: { type: string }
 *               contactPhone: { type: string }
 *     responses:
 *       200: { description: Buyer registered successfully }
 *       400: { description: Missing required fields }
 *       409: { description: Email already exists }
 */
router.post('/register', register);

/**
 * @swagger
 * /buyers/login:
 *   post:
 *     summary: Authenticate a buyer and return a token
 *     tags: [Buyers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Missing required fields }
 *       401: { description: Invalid credentials }
 */
router.post('/login', login);


/**
 * @swagger
 * /buyers/{id}:
 *   get:
 *     summary: Get a buyer's profile
 *     tags: [Buyers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Buyer profile }
 *       401: { description: Unauthorized }
 *       404: { description: Buyer not found }
 */
router.get('/:id', authMiddleware, getProfile);

/**
 * @swagger
 * /buyers/{id}:
 *   delete:
 *     summary: Delete a buyer account
 *     tags: [Buyers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Buyer deleted }
 *       401: { description: Unauthorized }
 *       404: { description: Buyer not found }
 */
router.delete('/:id', authMiddleware, deleteProfile);

export default router;