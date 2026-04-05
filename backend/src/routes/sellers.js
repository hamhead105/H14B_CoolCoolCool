import express from 'express';
import { register, login, getProfile, deleteProfile, updateProfile } from '../controllers/sellerController.js';
import { authMiddleware } from '../middleware/auth.js';

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

/**
 * @swagger
 * /sellers/{id}:
 *   get:
 *     summary: Get a seller's profile
 *     tags: [Sellers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Seller profile }
 *       401: { description: Unauthorized }
 *       404: { description: Seller not found }
 */
router.get('/:id', authMiddleware, getProfile);

/**
 * @swagger
 * /sellers/{id}:
 *   delete:
 *     summary: Delete a seller account
 *     tags: [Sellers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Seller deleted }
 *       401: { description: Unauthorized }
 *       404: { description: Seller not found }
 */
router.delete('/:id', authMiddleware, deleteProfile);

/**
 * @swagger
 * /sellers/{id}:
 *   put:
 *     summary: Update a seller's profile
 *     tags: [Sellers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated seller profile }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Seller not found }
 */
router.put('/:id', authMiddleware, updateProfile);

export default router;