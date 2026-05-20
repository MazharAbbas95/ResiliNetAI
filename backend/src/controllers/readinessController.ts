import { Request, Response } from 'express';
import { runReadinessChecks, getReadinessState as getReadinessStateService } from '../services/readinessService.ts';

export const getReadiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await runReadinessChecks();
    res.status(200).json({
      success: true,
      service: 'ResiliNet AI Backend',
      status: result.firestore === 'connected' ? 'ready' : 'degraded',
      checks: result,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Readiness checks failed',
      timestamp: new Date().toISOString(),
    });
  }
};

export const getReadinessSnapshot = (req: Request, res: Response): void => {
  const state = getReadinessStateService();
  res.status(200).json({ success: true, checks: state });
};
