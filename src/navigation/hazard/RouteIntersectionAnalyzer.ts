import { PolygonIntersection, Point } from '../../geofence/PolygonIntersection';
import { HazardZone } from '../../services/analystService';

export interface IntersectionResult {
  isUnsafe: boolean;
  intersectingZones: HazardZone[];
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const RouteIntersectionAnalyzer = {
  analyze: (routeCoordinates: { latitude: number; longitude: number }[], hazardZones: HazardZone[]): IntersectionResult => {
    const intersectingZones: HazardZone[] = [];
    let maxSeverity = 'low';

    // To improve performance, we sample the route coordinates
    // instead of checking every single point for long routes.
    const sampleRate = Math.max(1, Math.floor(routeCoordinates.length / 50));
    
    for (let i = 0; i < routeCoordinates.length; i += sampleRate) {
      const point = routeCoordinates[i];
      
      for (const zone of hazardZones) {
        const isInside = PolygonIntersection.isPointInPolygon(
          { latitude: point.latitude, longitude: point.longitude },
          zone.coordinates.map(c => ({ latitude: c.lat, longitude: c.lng }))
        );

        if (isInside) {
          if (!intersectingZones.find(z => z.zoneId === zone.zoneId)) {
            intersectingZones.push(zone);
          }
          // Track highest severity
          if (zone.severity === 'critical') maxSeverity = 'critical';
          else if (zone.severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
          else if (zone.severity === 'medium' && maxSeverity === 'low') maxSeverity = 'medium';
        }
      }
    }

    const threatMap: Record<string, IntersectionResult['threatLevel']> = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'critical': 'CRITICAL'
    };

    return {
      isUnsafe: intersectingZones.length > 0,
      intersectingZones,
      threatLevel: intersectingZones.length > 0 ? threatMap[maxSeverity] : 'NONE'
    };
  }
};
