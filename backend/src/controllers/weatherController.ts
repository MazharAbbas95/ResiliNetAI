import { Request, Response } from 'express';
import { WeatherService } from '../services/weatherService.ts';

export const getCurrentWeather = async (req: Request, res: Response) => {
  const coords = { 
    latitude: Number(req.query.lat) || 0, 
    longitude: Number(req.query.lng) || 0 
  };
  
  const weatherPayload = await WeatherService.getLocalWeather(coords);
  
  // Return the specific structured JSON exactly as requested
  res.json(weatherPayload);
};
