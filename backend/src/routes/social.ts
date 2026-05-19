import { Router, Request, Response } from 'express';
import { socialSignalService } from '../services/socialSignalService.ts';
import { catchAsync } from '../utils/catchAsync.ts';

const router = Router();

// GET /api/social
// Optional query: ?severity=high&location=Lahore
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const severity = req.query.severity as string | undefined;
    const location = req.query.location as string | undefined;

    const reports = socialSignalService.getReports({ severity, location });

    console.log(`[SocialRoute] Serving ${reports.length} reports | severity=${severity ?? 'all'} location=${location ?? 'all'}`);

    res.json({
      reports,
      count: reports.length,
      source: 'mock-social-feed',
    });
  })
);

export default router;
