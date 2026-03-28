import express from 'express';
import { postProduct, getProducts } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  postProduct(req, res);
});

router.get('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getProducts(req, res);
});


export default router;