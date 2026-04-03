import express from 'express';
import { register, login } from '../controllers/buyerController.js';

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

export default router;