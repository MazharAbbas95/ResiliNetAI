import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.ts';
import { ShelterService } from '../services/shelterService.ts';

export const getShelters = async (req: Request, res: Response) => {
  const shelters = await ShelterService.getAllShelters();
  sendSuccess(res, shelters, 'Shelters retrieved successfully');
};

export const getNearbyShelters = async (req: Request, res: Response) => {
  // Stub for geospatial queries (requires lat/lng in query)
  const shelters = await ShelterService.getAllShelters();
  sendSuccess(res, shelters, 'Nearby shelters retrieved successfully');
};

export const createShelter = async (req: Request, res: Response) => {
  const payload = req.body;
  const shelterId = await ShelterService.createShelter(payload);
  sendSuccess(res, { shelterId }, 'Shelter registered successfully', 201);
};

export const updateShelter = async (req: Request, res: Response) => {
  // Stub for updating shelter capacity/status
  sendSuccess(res, { id: req.params.id }, 'Shelter updated successfully');
};
