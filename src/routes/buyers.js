import express from 'express';
import { registerBuyer } from '../controllers/buyerController.js';

const router = express.Router();

router.post('/register', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  registerBuyer(req, res);
});

export default router;