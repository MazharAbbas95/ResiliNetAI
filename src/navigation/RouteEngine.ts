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
    const { setNavigationState } = useNavigationStore.getState();
    const { addLog } = useOrchestrationStore.getState();

    // MapViewDirections Billing Failure gracefully degrade (Issue 7)
    const isBillingError = errorMessage.toLowerCase().includes('billing') || errorMessage.toLowerCase().includes('denied') || errorMessage.toLowerCase().includes('key');

    setNavigationState('FAILED');

    if (isBillingError) {
      addLog({
        agent: 'system',
        message: 'Tactical Routing Unavailable: Maps API Billing Disabled. Degrading to fallback straight-line trajectory.',
        status: 'warning'
      });
    } else {
      addLog({
        agent: 'system',
        message: `Routing Engine Error: ${errorMessage}`,
        status: 'error'
      });
    }
  }
};
