import { PolygonIntersection, Point } from './PolygonIntersection';
import { HazardZone } from '../services/analystService';
import { useSafetyStore, SafetyState } from '../store/safetyStore';
import { NotificationEngine } from '../notifications/NotificationEngine';
import { alertAgent } from '../agents/dispatch/AlertAgent';
export const GeoFenceEngine = {
  evaluateSafety: (userLocation: Point, zones: HazardZone[]) => {
    const { status, setSafetyState } = useSafetyStore.getState();
    const oldState = status.state;
    
    if (!zones || zones.length === 0) {
      if (oldState !== 'SAFE') setSafetyState('SAFE');
      return;
    }

    let nearestDistance = Infinity;
    let closestZone: HazardZone | null = null;
    let isInsideAny = false;
    let insideZone: HazardZone | null = null;

    for (const zone of zones) {
      // 1. Check if inside
      const inside = PolygonIntersection.isPointInPolygon(userLocation, zone.coordinates.map(c => ({
        latitude: c.lat,
        longitude: c.lng
      })));

      if (inside) {
        isInsideAny = true;
        insideZone = zone;
        break; // Priority: Inside is the most urgent
      }

      // 2. Calculate distance to center for proximity
      const dist = PolygonIntersection.calculateDistance(userLocation, {
        latitude: zone.center.lat,
        longitude: zone.center.lng
      });

      if (dist < nearestDistance) {
        nearestDistance = dist;
        closestZone = zone;
      }
    }

    // 3. Determine Final Safety State
    let newState: SafetyState = 'SAFE';
    let targetZoneId: string | undefined = undefined;

    if (isInsideAny && insideZone) {
      newState = insideZone.severity === 'critical' ? 'CRITICAL' : 'DANGER';
      targetZoneId = insideZone.zoneId;
    } else if (nearestDistance < 150) {
      newState = 'WARNING';
      targetZoneId = closestZone?.zoneId;
    } else if (nearestDistance < 400) {
      newState = 'CAUTION';
      targetZoneId = closestZone?.zoneId;
    }

    // 4. Update State and Trigger Notification on Escalation
    setSafetyState(newState, targetZoneId, newState === 'SAFE' ? nearestDistance : (isInsideAny ? 0 : nearestDistance));

    if (newState !== oldState) {
      NotificationEngine.processSafetyEvent(newState, targetZoneId || null);
    }

    alertAgent.execute({ id: `geo-${Date.now()}`, payload: { trigger: 'GeoFenceEngine' }, timestamp: Date.now() });
  }
};
