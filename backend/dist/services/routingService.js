"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingService = void 0;
const env_1 = require("@/config/env");
class RoutingService {
    /**
     * Prepares rerouting logic considering active hazard zones.
     */
    static async calculateSafeRoute(origin, destination, activeHazards) {
        console.log(`[RoutingService] Calculating safe route avoiding ${activeHazards.length} hazards.`);
        if (!env_1.ENV.GOOGLE_MAPS_BACKEND_KEY) {
            console.warn('[RoutingService] GOOGLE_MAPS_BACKEND_KEY missing. Returning mock route.');
        }
        // Stub for Google Maps Directions API integration
        return {
            status: 'OK',
            polyline: 'mock_polyline_string',
            distance: '5.2 km',
            duration: '15 mins',
            hazardsAvoided: activeHazards.length
        };
    }
}
exports.RoutingService = RoutingService;
