import { z } from 'zod';

const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const createHazardSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    type: z.string().min(3),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
    polygon: z.array(CoordinateSchema).min(3, "A polygon must have at least 3 points"),
    confidenceScore: z.number().min(0).max(1).optional(),
    riskLevel: z.number().min(0).max(10).optional(),
  }),
});

export const updateHazardSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    isVisible: z.boolean().optional(),
  }),
});
