import { Router, Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signalAggregatorService';
import { SentinelAgent } from '../agents/sentinel/sentinelAgent';
import { GeminiService } from '../services/geminiService';
import { TerrainService } from '../services/terrainService';
import { ConfidenceScoringService } from '../services/confidenceScoringService';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

/**
 * GET /api/confidence-score
 * 
 * The ultimate intelligence orchestration endpoint.
 * Combines Sentinel logic, Gemini AI, and Terrain Heuristics.
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string) || 31.5204;
    const lng = parseFloat(req.query.lng as string) || 74.3587;

    // 1. Gather all raw and pre-processed data
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const sentinelData = SentinelAgent.process(aggregated);
    
    // 2. Run Parallel AI and Terrain Analysis
    const [aiAnalysis, terrainRisk] = await Promise.all([
      GeminiService.analyzeSignals(sentinelData),
      Promise.resolve(TerrainService.calculateTerrainRisk(lat, lng))
    ]);

    // 3. Compute Final Unified Confidence
    const confidencePayload = ConfidenceScoringService.compute(
      sentinelData,
      aiAnalysis,
      terrainRisk
    );

    res.json({
      success: true,
      data: confidencePayload,
      meta: {
        lat,
        lng,
        processingTimeMs: Date.now() - confidencePayload.timestamp
      }
    });
  })
);

export default router;
