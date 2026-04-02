import express from 'express';
import { postProduct, getProducts, getProductId, putProduct, deleteProduct } from '../controllers/productController.js';
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

router.get('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getProductId(req, res);
});

router.put('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  putProduct(req, res);
});

router.delete('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  deleteProduct(req, res);
});

export default router;