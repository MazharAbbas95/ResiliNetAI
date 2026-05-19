import { Router, Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signalAggregatorService.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

/**
 * GET /api/signals?lat=31.5204&lng=74.3587
 *
 * Returns one unified aggregated hazard intelligence payload
 * combining weather + social signal sources.
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string) || 31.5204; // Default: Lahore
    const lng = parseFloat(req.query.lng as string) || 74.3587;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Provide numeric lat and lng query params.',
      });
      return;
    }

    const payload = await SignalAggregatorService.aggregate(lat, lng);

    res.json(payload);
  }),
);

export default router;
