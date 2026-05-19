import { Router } from 'express';
import { getStatus, getHealth, getRealtimeStatus } from '../controllers/systemController.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

router.get('/status', catchAsync(getStatus));
router.get('/health', catchAsync(getHealth));
router.get('/realtime', catchAsync(getRealtimeStatus));

export default router;
