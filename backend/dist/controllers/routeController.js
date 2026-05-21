"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avoidHazardRoute = exports.getSafeRoute = void 0;
const response_ts_1 = require("../utils/response.ts");
const routingService_ts_1 = require("../services/routingService.ts");
const getSafeRoute = async (req, res) => {
    const { origin, destination } = req.body;
    // Stub for passing active hazards from DB to the routing service
    const activeHazards = [];
    const route = await routingService_ts_1.RoutingService.calculateSafeRoute(origin, destination, activeHazards);
    (0, response_ts_1.sendSuccess)(res, route, 'Safe route generated successfully');
};
exports.getSafeRoute = getSafeRoute;
const avoidHazardRoute = async (req, res) => {
    // Logic specifically for recalculating an active route when a new hazard appears
    (0, response_ts_1.sendSuccess)(res, { status: 'Recalculated' }, 'Route recalculated to avoid hazard');
};
exports.avoidHazardRoute = avoidHazardRoute;
