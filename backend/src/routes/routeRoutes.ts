import { Router } from 'express';
import { getSafeRoute, avoidHazardRoute } from '../controllers/routeController.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { validateRequest } from '../middleware/validationMiddleware.ts';
import { getSafeRouteSchema } from '../validators/aiValidator.ts';

const router = Router();

router.post('/safe-route', validateRequest(getSafeRouteSchema), catchAsync(getSafeRoute));
router.post('/avoid-hazard', catchAsync(avoidHazardRoute));

export default router;
