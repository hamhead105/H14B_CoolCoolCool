import express from 'express';
import {
  postDespatchAdvice,
  fetchDespatchAdvice,
  fetchDespatchAdviceXML,
} from '../controllers/despatchAdviceController.js';
import { authMiddleware } from '../middleware/auth.js';

export const orderDespatchRouter = express.Router();
orderDespatchRouter.post('/:id/despatch-advice', authMiddleware, postDespatchAdvice);

export const despatchAdviceRouter = express.Router();
despatchAdviceRouter.get('/:despatchAdviceId', fetchDespatchAdvice);
despatchAdviceRouter.get('/:despatchAdviceId/xml', fetchDespatchAdviceXML);