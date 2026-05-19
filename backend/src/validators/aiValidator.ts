import { z } from 'zod';

export const analyzeSituationSchema = z.object({
  body: z.object({
    contextType: z.enum(['Weather', 'Social', 'Sensor', 'MultiModal']),
    rawData: z.any(),
    regionId: z.string().optional(),
  }),
});

export const getSafeRouteSchema = z.object({
  body: z.object({
    origin: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    destination: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    vehicleType: z.enum(['Emergency', 'Civilian', 'Heavy']).optional(),
  }),
});
