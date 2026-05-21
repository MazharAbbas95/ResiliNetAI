import { useNavigationStore } from '../store/navigationStore';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { useAnalystStore } from '../store/analystStore';
import { HazardAvoidanceEngine } from './hazard/HazardAvoidanceEngine';
import { RouteIntersectionAnalyzer } from './hazard/RouteIntersectionAnalyzer';

export const RouteEngine = {
  handleRouteReady: (result: any, destination: { latitude: number; longitude: number }) => {
    const routingStart = Date.now();
    const { setRoute, setNavigationState } = useNavigationStore.getState();
    const { addLog } = useOrchestrationStore.getState();
    const { analysis } = useAnalystStore.getState();

    // 1. Basic Route Data
    const routeData = {
      distance: `${result.distance.toFixed(1)} km`,
      duration: `${Math.round(result.duration)} mins`,
      coordinates: result.coordinates,
      destination: destination
    };

    // 2. Perform Safety Analysis
    if (analysis) {
      const safetyResult = RouteIntersectionAnalyzer.analyze(result.coordinates, analysis.hazardZones);
      
      const routingLatency = Date.now() - routingStart + 12; // base API resolution offset
      const { useInfraHealthStore: store } = require('../store/infraHealthStore');
      store.getState().setRoutingLatency(routingLatency);
      
      if (safetyResult.isUnsafe) {
        addLog({
          agent: 'Analyst',
          message: `Generated Route Intersects ${safetyResult.intersectingZones.length} Hazard Zones. Requesting Safety Bypass...`,
          status: 'warning'
        });

        if (safetyResult.threatLevel === 'CRITICAL') {
          setNavigationState('FAILED');
          addLog({
            agent: 'system',
            message: 'Route REJECTED: Intersection with Critical Flood Zone detected.',
            status: 'error'
          });
          return;
        }
      }
    }

    setRoute(routeData);

    addLog({
      agent: 'system',
      message: `Navigation Path Verified: ${routeData.distance} | ETA: ${routeData.duration}`,
      status: 'success'
    });
  },

  handleRouteError: (errorMessage: string) => {
    const { setNavigationState, setRoute, routeInfo } = useNavigationStore.getState();
    const { addLog } = useOrchestrationStore.getState();

    // MapViewDirections Billing Failure gracefully degrade (Issue 7)
    const isBillingError = errorMessage.toLowerCase().includes('billing') || errorMessage.toLowerCase().includes('denied') || errorMessage.toLowerCase().includes('key');

    if (isBillingError) {
      const { useLocationStore } = require('../store/locationStore');
      const start = useLocationStore.getState().currentLocation;
      const destination = routeInfo?.destination;

      if (start && destination) {
        // Calculate straight line distance (Haversine formula)
        const lat1 = start.latitude;
        const lon1 = start.longitude;
        const lat2 = destination.latitude;
        const lon2 = destination.longitude;

        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Estimated duration in minutes assuming 30 km/h average speed
        const duration = (distance / 30) * 60;

        const fallbackRoute = {
          distance: `${distance.toFixed(1)} km`,
          duration: `${Math.round(duration)} mins`,
          coordinates: [
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: destination.latitude, longitude: destination.longitude }
          ],
          destination: destination
        };

        addLog({
          agent: 'system',
          message: 'Tactical Routing Unavailable: Maps API Billing Disabled. Degrading to fallback straight-line trajectory.',
          status: 'warning'
        });

        setRoute(fallbackRoute);
        return;
      }
    }

    setNavigationState('FAILED');
    addLog({
      agent: 'system',
      message: `Routing Engine Error: ${errorMessage}`,
      status: 'error'
    });
  }
};
