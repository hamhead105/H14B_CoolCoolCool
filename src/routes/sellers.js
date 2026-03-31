import express from 'express';
import { register, login } from '../controllers/sellerController.js';

const router = express.Router();

/**
 * @swagger
 * /sellers/register:
 *   post:
 *     summary: Register a new seller account
 *     tags: [Sellers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, street, city, postalCode, countryCode, companyId, legalEntityId, taxSchemeId, contactName, contactPhone, contactEmail]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               postalCode: { type: string }
 *               countryCode: { type: string }
 *               companyId: { type: string }
 *               legalEntityId: { type: string }
 *               taxSchemeId: { type: string }
 *               contactName: { type: string }
 *               contactPhone: { type: string }
 *               contactEmail: { type: string }
 *     responses:
 *       200: { description: Seller registered successfully }
 *       400: { description: Missing required fields }
 *       409: { description: Email already exists }
 */
router.post('/register', register);

/**
 * @swagger
 * /sellers/login:
 *   post:
 *     summary: Authenticate a seller and return a token
 *     tags: [Sellers]
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