import { Router } from 'express';
import { getCurrentWeather } from '../controllers/weatherController.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

router.get('/', catchAsync(getCurrentWeather));

export default router;
