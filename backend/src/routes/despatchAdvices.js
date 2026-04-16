import express from 'express';
import {
  postDespatchAdvice,
  fetchDespatchAdvice,
} from '../controllers/despatchAdviceController.js';

const router = express.Router();

router.post('/:id/despatch-advice', postDespatchAdvice);
router.get('/:despatchAdviceId', fetchDespatchAdvice);

export default router;