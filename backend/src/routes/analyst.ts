import { Router, Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signalAggregatorService';
import { SentinelAgent } from '../agents/sentinel/sentinelAgent';
import { GeminiService } from '../services/geminiService';
import { TerrainService } from '../services/terrainService';
import { ConfidenceScoringService } from '../services/confidenceScoringService';
import { AnalystAgent } from '../agents/analyst/analystAgent';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

/**
 * GET /api/analyst
 * 
 * The comprehensive intelligence endpoint that executes the full reasoning stack.
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string) || 31.5204;
    const lng = parseFloat(req.query.lng as string) || 31.5204;

    // 1. Core Data Extraction
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const sentinelData = SentinelAgent.process(aggregated);
    
    // 2. Parallel Secondary Intelligence
    const [aiAnalysis, terrainRisk] = await Promise.all([
      GeminiService.analyzeSignals(sentinelData),
      Promise.resolve(TerrainService.calculateTerrainRisk(lat, lng))
    ]);

    // 3. Score Integration
    const confidencePayload = ConfidenceScoringService.compute(
      sentinelData,
      aiAnalysis,
      terrainRisk
    );

    // 4. Strategic Analysis Execution
    const strategicAnalysis = AnalystAgent.process(
      sentinelData,
      aiAnalysis,
      confidencePayload
    );

    res.json({
      success: true,
      data: strategicAnalysis
    });
  })
);

export default router;
