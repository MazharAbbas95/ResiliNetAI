import { z } from 'zod';

const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const sendAlertSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    message: z.string().min(10),
    level: z.enum(['Info', 'Warning', 'Critical']),
    targetArea: z.array(CoordinateSchema).optional(),
    targetHazardId: z.string().optional(),
  }),
});
