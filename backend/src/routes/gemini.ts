import { Router, Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signalAggregatorService';
import { SentinelAgent } from '../agents/sentinel/sentinelAgent';
import { GeminiService } from '../services/geminiService';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

/**
 * GET /api/gemini-analysis?lat=31.5204&lng=74.3587
 * 
 * Pipeline:
 * SignalAggregator → SentinelAgent → GeminiService → AI Intelligence
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string) || 31.5204;
    const lng = parseFloat(req.query.lng as string) || 74.3587;

    // 1. Fetch raw aggregated signals
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);

    // 2. Validate and clean with Sentinel Agent
    const sentinelPayload = SentinelAgent.process(aggregated);

    // 3. Perform AI analysis with Gemini
    const aiAnalysis = await GeminiService.analyzeSignals(sentinelPayload);

    res.json({
      success: true,
      sentinel: {
        status: sentinelPayload.sentinelStatus,
        severity: sentinelPayload.signalSummary.overallSeverity
      },
      analysis: aiAnalysis,
      timestamp: Date.now()
    });
  }),
);

/**
 * GET /api/gemini-analysis/text?text=...
 * 
 * Direct raw text analysis with Gemini AI
 */
router.get(
  '/text',
  catchAsync(async (req: Request, res: Response) => {
    const text = req.query.text as string || '';
    const analysis = await GeminiService.analyzeRawText(text);

    res.json({
      success: true,
      analysis,
      timestamp: Date.now()
    });
  }),
);

export default router;
