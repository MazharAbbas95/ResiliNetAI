"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlertSchema = void 0;
const zod_1 = require("zod");
const CoordinateSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
exports.sendAlertSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        message: zod_1.z.string().min(10),
        level: zod_1.z.enum(['Info', 'Warning', 'Critical']),
        targetArea: zod_1.z.array(CoordinateSchema).optional(),
        targetHazardId: zod_1.z.string().optional(),
    }),
});
