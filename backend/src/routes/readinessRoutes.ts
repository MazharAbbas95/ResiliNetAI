import { Router } from 'express';
import { getReadiness } from '../controllers/readinessController.ts';

const router = Router();

router.get('/', getReadiness);

export default router;
