import { Router } from 'express';
import { 
  getHazards, 
  getActiveHazards, 
  getHazardById, 
  createHazard, 
  updateHazard, 
  removeHazard 
} from '../controllers/hazardController.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { validateRequest } from '../middleware/validationMiddleware.ts';
import { createHazardSchema, updateHazardSchema } from '../validators/hazardValidator.ts';

const router = Router();

router.get('/', catchAsync(getHazards));
router.get('/active', catchAsync(getActiveHazards));
router.get('/:id', catchAsync(getHazardById));

router.post('/create', validateRequest(createHazardSchema), catchAsync(createHazard));
router.post('/update/:id', validateRequest(updateHazardSchema), catchAsync(updateHazard));
router.post('/remove/:id', catchAsync(removeHazard));

export default router;

