import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.ts';
import { AIService } from '../services/aiService.ts';

export const analyzeSituation = async (req: Request, res: Response) => {
  const analysis = await AIService.analyzeSituation(req.body);
  sendSuccess(res, analysis, 'Situation analyzed successfully');
};

export const getConfidence = async (req: Request, res: Response) => {
  // Stub for confidence scoring logic
  sendSuccess(res, { confidenceScore: 0.92, source: 'Sentinel-1' }, 'Confidence score calculated');
};

export const triangulateHazard = async (req: Request, res: Response) => {
  // Stub for multi-source triangulation
  sendSuccess(res, { triangulatedPolygon: [], accuracy: 'High' }, 'Hazard triangulated successfully');
};
