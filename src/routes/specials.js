import express from 'express';
import {
  getSpecials,
  postSpecial,
  getSpecialId,
  putSpecial,
  deleteSpecialId
} from '../controllers/specialController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getSpecials(req, res);
});

router.post('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  postSpecial(req, res);
});

router.get('/:productId', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getSpecialId(req, res);
});

router.put('/:productId', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  putSpecial(req, res);
});

router.delete('/:productId', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  deleteSpecialId(req, res);
});

export default router;