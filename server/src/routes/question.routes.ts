import { Router } from 'express';
import { getQuestions, getQuestion } from '../controllers/question.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getQuestions);
router.get('/:id', getQuestion);

export default router;