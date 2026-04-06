import express from 'express';
import { postProduct, getProducts, getProductId, putProduct, deleteProduct, getProductFamily } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product listing
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, name, description, cost, brand, family, releaseDate, onSpecial, discount]
 *             properties:
 *               productId: { type: string, example: "PROD-001" }
 *               name: { type: string, example: "Widget A" }
 *               description: { type: string, example: "A high-quality widget" }
 *               cost: { type: number, example: 29.99 }
 *               brand: { type: string, example: "Acme" }
 *               family: { type: string, example: "Widgets" }
 *               releaseDate: { type: string, format: date-time, example: "2024-01-15T00:00:00.000Z" }
 *               onSpecial: { type: boolean, example: false }
 *               discount: { type: number, example: 0 }
 *               productTier: { type: integer, example: 1 }
 *               nextProduct: { type: string, example: "PROD-002" }
 *     responses:
 *       200:
 *         description: Product created successfully
 *       400:
 *         description: Duplicate product ID
 *       403:
 *         description: Only sellers can create products
 *       422:
 *         description: Missing required fields
 */
router.post('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  postProduct(req, res);
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get products filtered by query parameters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by product name
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: Filter by brand
 *       - in: query
 *         name: family
 *         schema: { type: string }
 *         description: Filter by product family
 *       - in: query
 *         name: onSpecial
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Filter by special status
 *     responses:
 *       200:
 *         description: List of matching products
 *       500:
 *         description: Server error
 */
router.get('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getProducts(req, res);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getProductId(req, res);
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               cost: { type: number }
 *               discount: { type: number }
 *               onSpecial: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated product
 *       404:
 *         description: Product not found
 */
router.put('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  putProduct(req, res);
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  deleteProduct(req, res);
});

/**
 * @swagger
 * /products/{id}/family:
 *   get:
 *     summary: Get all products in the same family as the given product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The product ID to find the family for
 *     responses:
 *       200:
 *         description: List of products in the same family
 *       404:
 *         description: Product not found
 */
router.get('/:id/family', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getProductFamily(req, res);
});

export default router;