import { Router } from 'express';
import { analyzeSituation, getConfidence, triangulateHazard } from '../controllers/aiController.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { validateRequest } from '../middleware/validationMiddleware.ts';
import { analyzeSituationSchema } from '../validators/aiValidator.ts';

const router = Router();

router.post('/analyze', validateRequest(analyzeSituationSchema), catchAsync(analyzeSituation));
router.post('/confidence', catchAsync(getConfidence));
router.post('/triangulate', catchAsync(triangulateHazard));

export default router;
