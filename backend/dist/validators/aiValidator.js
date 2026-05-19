"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeRouteSchema = exports.analyzeSituationSchema = void 0;
const zod_1 = require("zod");
exports.analyzeSituationSchema = zod_1.z.object({
    body: zod_1.z.object({
        contextType: zod_1.z.enum(['Weather', 'Social', 'Sensor', 'MultiModal']),
        rawData: zod_1.z.any(),
        regionId: zod_1.z.string().optional(),
    }),
});
exports.getSafeRouteSchema = zod_1.z.object({
    body: zod_1.z.object({
        origin: zod_1.z.object({
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
        }),
        destination: zod_1.z.object({
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
        }),
        vehicleType: zod_1.z.enum(['Emergency', 'Civilian', 'Heavy']).optional(),
    }),
});
