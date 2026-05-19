import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.ts';
import { AlertService } from '../services/alertService.ts';
import { adminDb } from '../config/firebaseAdmin.ts';

export const getAlerts = async (req: Request, res: Response) => {
  const snapshot = await adminDb.collection('alerts').get();
  const alerts = snapshot.docs.map(doc => doc.data());
  sendSuccess(res, alerts, 'Alerts retrieved successfully');
};

export const getActiveAlerts = async (req: Request, res: Response) => {
  const snapshot = await adminDb.collection('alerts').where('status', '==', 'Active').get();
  const alerts = snapshot.docs.map(doc => doc.data());
  sendSuccess(res, alerts, 'Active alerts retrieved successfully');
};

export const sendAlert = async (req: Request, res: Response) => {
  const payload = req.body;
  const alertId = await AlertService.processAndDispatchAlert(payload);
  sendSuccess(res, { alertId }, 'Alert sent successfully', 201);
};

export const broadcastAlert = async (req: Request, res: Response) => {
  const payload = req.body;
  // Stub for mass-broadcasting (e.g. FCM push notifications)
  const alertId = await AlertService.processAndDispatchAlert({ ...payload, level: 'Critical' });
  sendSuccess(res, { alertId, broadcasted: true }, 'Alert broadcasted successfully', 201);
};

export const removeAlert = async (req: Request, res: Response) => {
  const { id } = req.params;
  await adminDb.collection('alerts').doc(id).delete();
  sendSuccess(res, { id }, 'Alert removed successfully');
};
