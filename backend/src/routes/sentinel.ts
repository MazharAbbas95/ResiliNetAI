import { Router, Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signalAggregatorService.ts';
import { SentinelAgent } from '../agents/sentinel/sentinelAgent.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

/**
 * GET /api/sentinel?lat=31.5204&lng=74.3587
 *
 * Runs full pipeline:
 *   SignalAggregator → SentinelAgent validation → Clean JSON
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string) || 31.5204;
    const lng = parseFloat(req.query.lng as string) || 74.3587;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Provide numeric lat (-90..90) and lng (-180..180).',
      });
      return;
    }

    // Step 1: Aggregate raw signals
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);

    // Step 2: Run Sentinel Agent (sync — deterministic, fast)
    const validated = SentinelAgent.process(aggregated);

    res.json(validated);
  }),
);

export default router;
