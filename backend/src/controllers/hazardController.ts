import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.ts';
import { FirebaseService } from '../services/firebaseService.ts';
import { HazardPayload } from '../types/index.ts';
import { adminDb } from '../config/firebaseAdmin.ts';

export const getHazards = async (req: Request, res: Response) => {
  const snapshot = await adminDb.collection('hazards').get();
  const hazards = snapshot.docs.map(doc => doc.data());
  sendSuccess(res, hazards, 'Hazards retrieved successfully');
};

export const getActiveHazards = async (req: Request, res: Response) => {
  const snapshot = await adminDb.collection('hazards').where('isActive', '==', true).get();
  const hazards = snapshot.docs.map(doc => doc.data());
  sendSuccess(res, hazards, 'Active hazards retrieved successfully');
};

export const getHazardById = async (req: Request, res: Response) => {
  const doc = await adminDb.collection('hazards').doc(req.params.id).get();
  if (!doc.exists) {
    return sendError(res, null, 'Hazard not found', 404);
  }
  sendSuccess(res, doc.data(), 'Hazard retrieved successfully');
};

export const createHazard = async (req: Request, res: Response) => {
  const payload: HazardPayload = req.body;
  const hazardId = await FirebaseService.createHazard(payload);
  sendSuccess(res, { hazardId }, 'Hazard created successfully', 201);
};

export const updateHazard = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  await adminDb.collection('hazards').doc(id).update({
    ...updates,
    updatedAt: Date.now()
  });
  sendSuccess(res, { id }, 'Hazard updated successfully');
};

export const removeHazard = async (req: Request, res: Response) => {
  const { id } = req.params;
  await adminDb.collection('hazards').doc(id).delete();
  sendSuccess(res, { id }, 'Hazard removed successfully');
};

