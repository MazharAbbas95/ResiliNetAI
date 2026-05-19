import { HazardMemory, HazardMemoryState, Coordinate } from './HazardMemory';
import { RouteMemory, RouteMemoryState } from './RouteMemory';
import { AlertMemory } from './AlertMemory';
import { ConfidenceMemory } from './ConfidenceMemory';
import { SeverityLevel } from '../core/AgentTypes';

export interface DecisionContext {
  nearbyHazardsCount: number;
  activeEscalationsCount: number;
  highestNearbySeverity: SeverityLevel;
  confidenceTrend: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  unresolvedVerificationsCount: number;
  recentRerouteFailuresCount: number;
  nearbyHazards: Omit<HazardMemoryState, 'history'>[];
  failedReroutes: RouteMemoryState[];
  predictedNearbyHazardsCount?: number;
  maxEscalationProbability?: number;
}

export class ContextRetrievalEngine {
  constructor(
    private hazardMemory: HazardMemory,
    private routeMemory: RouteMemory,
    private alertMemory: AlertMemory,
    private confidenceMemory: ConfidenceMemory
  ) {}

  /**
   * Helper to calculate Haversine distance in kilometers between two geo-coordinates.
   */
  private getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Assembles a structured operational DecisionContext snapshot based on a given coordinate.
   */
  public getContextSnapshot(
    lat?: number,
    lng?: number,
    maxDistanceKm: number = 5.0
  ): DecisionContext {
    const allHazards = this.hazardMemory.getAllHazards();
    const allRoutes = this.routeMemory.getAllRoutes();
    
    let nearbyHazards: Omit<HazardMemoryState, 'history'>[] = [];
    let unresolvedVerificationsCount = 0;
    let activeEscalationsCount = 0;
    let highestNearbySeverity: SeverityLevel = 'LOW';
    let predictedNearbyHazardsCount = 0;
    let maxEscalationProbability = 0;

    // 1. Process Hazards and apply Proximity Relevance logic
    Object.keys(allHazards).forEach(id => {
      const hazard = allHazards[id];
      const isActive = ['DETECTED', 'VERIFYING', 'ACTIVE', 'ESCALATED'].includes(hazard.lifecycleState);

      if (isActive) {
        let isNearby = false;

        if (lat !== undefined && lng !== undefined && hazard.polygonPoints && hazard.polygonPoints.length > 0) {
          // Check distance to hazard centroid or points
          const centroid = {
            lat: hazard.polygonPoints.reduce((sum, p) => sum + p.lat, 0) / hazard.polygonPoints.length,
            lng: hazard.polygonPoints.reduce((sum, p) => sum + p.lng, 0) / hazard.polygonPoints.length
          };
          
          const distance = this.getDistanceKm(lat, lng, centroid.lat, centroid.lng);
          if (distance <= maxDistanceKm) {
            isNearby = true;
          }
        } else {
          // If no coordinate provided, fallback to matching all active hazards
          isNearby = true;
        }

        if (isNearby) {
          // Exclude history log to keep snapshot payload lightweight
          const { history, ...lightweightHazard } = hazard;
          nearbyHazards.push(lightweightHazard);

          if (hazard.verificationState !== 'verified' && hazard.verificationState !== 'rejected') {
            unresolvedVerificationsCount++;
          }

          if (hazard.lifecycleState === 'ESCALATED') {
            activeEscalationsCount++;
          }

          // Evaluate highest nearby severity
          const severityRanks: Record<SeverityLevel, number> = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3,
            'CRITICAL': 4
          };
          if (severityRanks[hazard.severity] > severityRanks[highestNearbySeverity]) {
            highestNearbySeverity = hazard.severity;
          }

          if (hazard.predictiveState) {
            predictedNearbyHazardsCount++;
            if (hazard.predictiveState.escalationProbability && hazard.predictiveState.escalationProbability > maxEscalationProbability) {
              maxEscalationProbability = hazard.predictiveState.escalationProbability;
            }
          }
        }
      }
    });

    // 2. Process Confidence Trends
    let upwardTrends = 0;
    let downwardTrends = 0;
    const allTrends = this.confidenceMemory.getAllConfidenceStates();
    
    Object.keys(allTrends).forEach(targetId => {
      const state = allTrends[targetId];
      if (state.trend === 'UPWARD') upwardTrends++;
      else if (state.trend === 'DOWNWARD') downwardTrends++;
    });

    const confidenceTrend =
      upwardTrends > downwardTrends ? 'UPWARD' :
      downwardTrends > upwardTrends ? 'DOWNWARD' : 'STABLE';

    // 3. Process Route Failures
    let recentRerouteFailuresCount = 0;
    const failedReroutes: RouteMemoryState[] = [];

    Object.keys(allRoutes).forEach(id => {
      const route = allRoutes[id];
      const failedAttempts = route.recalculationHistory.filter(h => !h.success);
      
      if (failedAttempts.length > 0) {
        recentRerouteFailuresCount += failedAttempts.length;
        failedReroutes.push(route);
      }
    });

    return {
      nearbyHazardsCount: nearbyHazards.length,
      activeEscalationsCount,
      highestNearbySeverity,
      confidenceTrend,
      unresolvedVerificationsCount,
      recentRerouteFailuresCount,
      nearbyHazards,
      failedReroutes,
      predictedNearbyHazardsCount,
      maxEscalationProbability
    };
  }
}
