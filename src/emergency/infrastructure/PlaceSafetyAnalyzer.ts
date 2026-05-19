import { PolygonIntersection } from '../../geofence/PolygonIntersection';
import { HazardZone } from '../../services/analystService';
import { EmergencyPlace } from '../../store/placesStore';

export const PlaceSafetyAnalyzer = {
  evaluate: (place: { latitude: number; longitude: number }, hazardZones: HazardZone[]) => {
    let minDistance = Infinity;
    let isInsideHazard = false;
    let highestSeverity = 'none';

    for (const zone of hazardZones) {
      const isInside = PolygonIntersection.isPointInPolygon(
        { latitude: place.latitude, longitude: place.longitude },
        zone.coordinates.map(c => ({ latitude: c.lat, longitude: c.lng }))
      );

      if (isInside) {
        isInsideHazard = true;
        highestSeverity = zone.severity;
        break; // Stop at first intersection
      }

      const dist = PolygonIntersection.calculateDistance(
        { latitude: place.latitude, longitude: place.longitude },
        { latitude: zone.center.lat, longitude: zone.center.lng }
      );
      if (dist < minDistance) minDistance = dist;
    }

    if (isInsideHazard) {
      return { 
        status: 'UNSAFE' as const, 
        score: highestSeverity === 'critical' ? 0 : 20 
      };
    }

    // Proximity scoring
    if (minDistance < 0.5) return { status: 'CAUTION' as const, score: 50 };
    if (minDistance < 1.5) return { status: 'MONITOR' as const, score: 80 };
    
    return { status: 'SAFE' as const, score: 100 };
  }
};
