import { Router } from 'express';
import { getShelters, getNearbyShelters, createShelter, updateShelter } from '../controllers/shelterController.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

router.get('/', catchAsync(getShelters));
router.get('/nearby', catchAsync(getNearbyShelters));

router.post('/create', catchAsync(createShelter));
router.post('/update/:id', catchAsync(updateShelter));

export default router;
