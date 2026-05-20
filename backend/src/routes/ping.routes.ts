import { Router } from 'express';
import { getPing } from '../controllers/pingController.ts';

const router = Router();

router.get('/', getPing);

export default router;
