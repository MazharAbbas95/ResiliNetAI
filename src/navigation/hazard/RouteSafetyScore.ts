import { IntersectionResult } from './RouteIntersectionAnalyzer';

export const RouteSafetyScore = {
  calculate: (result: IntersectionResult): number => {
    if (!result.isUnsafe) return 100;

    let penalty = 0;
    result.intersectingZones.forEach(zone => {
      switch (zone.severity) {
        case 'critical': penalty += 50; break;
        case 'high': penalty += 30; break;
        case 'medium': penalty += 15; break;
        case 'low': penalty += 5; break;
      }
    });

    return Math.max(0, 100 - penalty);
  },

  getLabel: (score: number) => {
    if (score >= 90) return 'SAFE';
    if (score >= 70) return 'LOW RISK';
    if (score >= 50) return 'MODERATE RISK';
    if (score >= 30) return 'HIGH RISK';
    return 'UNSAFE';
  },

  getColor: (score: number) => {
    if (score >= 90) return '#007AFF';
    if (score >= 70) return '#5AC8FA';
    if (score >= 50) return '#FFCC00';
    if (score >= 30) return '#FF9500';
    return '#FF3B30';
  }
};
