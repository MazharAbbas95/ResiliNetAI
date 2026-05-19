"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHazardSchema = exports.createHazardSchema = void 0;
const zod_1 = require("zod");
const CoordinateSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
exports.createHazardSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        type: zod_1.z.string().min(3),
        severity: zod_1.z.enum(['Low', 'Medium', 'High', 'Critical']),
        polygon: zod_1.z.array(CoordinateSchema).min(3, "A polygon must have at least 3 points"),
        confidenceScore: zod_1.z.number().min(0).max(1).optional(),
        riskLevel: zod_1.z.number().min(0).max(10).optional(),
    }),
});
exports.updateHazardSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        severity: zod_1.z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        status: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
        isVisible: zod_1.z.boolean().optional(),
    }),
});
