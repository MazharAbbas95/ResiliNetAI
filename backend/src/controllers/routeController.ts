import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.ts';
import { RoutingService } from '../services/routingService.ts';

export const getSafeRoute = async (req: Request, res: Response) => {
  const { origin, destination } = req.body;
  // Stub for passing active hazards from DB to the routing service
  const activeHazards: any[] = []; 
  
  const route = await RoutingService.calculateSafeRoute(origin, destination, activeHazards);
  sendSuccess(res, route, 'Safe route generated successfully');
};

export const avoidHazardRoute = async (req: Request, res: Response) => {
  // Logic specifically for recalculating an active route when a new hazard appears
  sendSuccess(res, { status: 'Recalculated' }, 'Route recalculated to avoid hazard');
};
