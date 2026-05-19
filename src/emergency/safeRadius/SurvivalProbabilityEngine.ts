import { PolygonIntersection } from '../../geofence/PolygonIntersection';
import { HazardZone } from '../../services/analystService';

export const SurvivalProbabilityEngine = {
  calculate: (location: { latitude: number; longitude: number }, hazardZones: HazardZone[]) => {
    let isolationRisk = 0;
    const SAFETY_BUFFER = 0.01; // ~1km

    // Check if location is surrounded by hazards
    const threatsNearby = hazardZones.filter(zone => {
      const dist = PolygonIntersection.calculateDistance(
        location,
        { latitude: zone.center.lat, longitude: zone.center.lng }
      );
      return dist < 2.0; // within 2km
    });

    if (threatsNearby.length > 2) isolationRisk += 40;
    
    const criticalThreats = threatsNearby.filter(t => t.severity === 'critical');
    if (criticalThreats.length > 0) isolationRisk += 50;

    // Survivability is inverse of risk
    const probability = Math.max(0, 100 - isolationRisk);
    
    return {
      probability,
      isolationRisk,
      recommendation: probability > 70 ? 'STAY' : probability > 40 ? 'MONITOR' : 'EVACUATE'
    };
  }
};
