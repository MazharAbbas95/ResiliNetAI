import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.ts';
import { adminDb } from '../config/firebaseAdmin.ts';

export const getStatus = async (req: Request, res: Response) => {
  // Stub for overall system intelligence status
  sendSuccess(res, { aiStatus: 'Operational', backend: 'Operational', db: 'Operational' }, 'System status retrieved');
};

export const getHealth = async (req: Request, res: Response) => {
  let firebaseStatus = 'Disconnected';
  try {
    if (adminDb) {
      await adminDb.collection('system_ping').limit(1).get();
      firebaseStatus = 'Connected';
    }
  } catch (err) {
    firebaseStatus = 'Error';
  }

  sendSuccess(res, {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    firebase: firebaseStatus,
    environment: process.env.NODE_ENV
  }, 'System health retrieved');
};

export const getRealtimeStatus = async (req: Request, res: Response) => {
  // Stub for pipeline metrics
  sendSuccess(res, { activeStreams: 4, messagesPerSecond: 12 }, 'Realtime metrics retrieved');
};
