import { Router } from 'express';
import { 
  getAlerts, 
  getActiveAlerts, 
  sendAlert, 
  broadcastAlert, 
  removeAlert 
} from '../controllers/alertController.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { validateRequest } from '../middleware/validationMiddleware.ts';
import { sendAlertSchema } from '../validators/alertValidator.ts';

const router = Router();

router.get('/', catchAsync(getAlerts));
router.get('/active', catchAsync(getActiveAlerts));

router.post('/send', validateRequest(sendAlertSchema), catchAsync(sendAlert));
router.post('/broadcast', validateRequest(sendAlertSchema), catchAsync(broadcastAlert));
router.post('/remove/:id', catchAsync(removeAlert));

export default router;
