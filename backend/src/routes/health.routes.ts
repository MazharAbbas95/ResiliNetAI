import { Router } from 'express';
import { getBackendHealth } from '../controllers/healthController.ts';

const router = Router();

router.get('/', getBackendHealth);

export default router;
