import { RouteIntersectionAnalyzer, IntersectionResult } from './RouteIntersectionAnalyzer';
import { HazardZone } from '../../services/analystService';
import { useNavigationStore } from '../../store/navigationStore';
import { useOrchestrationStore } from '../../store/orchestrationStore';
import { useAnalystStore } from '../../store/analystStore';
import { NotificationEngine } from '../../notifications/NotificationEngine';

export const HazardAvoidanceEngine = {
  evaluateCurrentRoute: () => {
    const { routeInfo, state, setNavigationState } = useNavigationStore.getState();
    const { analysis } = useAnalystStore.getState();
    const { addLog } = useOrchestrationStore.getState();

    if (!routeInfo || state !== 'ACTIVE' || !analysis) return;

    const result = RouteIntersectionAnalyzer.analyze(routeInfo.coordinates, analysis.hazardZones);

    if (result.isUnsafe) {
      addLog({
        agent: 'Analyst',
        message: `Hazard Detected on Active Route: ${result.threatLevel} severity. Initiating reroute.`,
        status: 'warning'
      });

      // Trigger rerouting logic
      setNavigationState('REROUTING');
      
      // Push local notification for route hazard
      NotificationEngine.processSafetyEvent('WARNING', result.intersectingZones[0].zoneId);
    }
  },

  getSafetyStatus: (result: IntersectionResult) => {
    if (!result.isUnsafe) return 'SAFE';
    if (result.threatLevel === 'CRITICAL' || result.threatLevel === 'HIGH') return 'UNSAFE';
    return 'MODERATE RISK';
  }
};
