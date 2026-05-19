export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Trend = 'increasing' | 'stable' | 'decreasing';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface HazardZone {
  zoneId: string;
  severity: Severity;
  confidence: number;
  coordinates: Coordinate[];
  center: Coordinate;
  radius: number; // in meters, for fallback or circles
}

export interface AnalystPayload {
  analystStatus: 'active' | 'standby' | 'error';
  overallSeverity: Severity;
  confidenceScore: number;

  hazardAssessment: {
    floodRisk: Severity;
    terrainRisk: Severity;
    socialDensity: Severity;
    stormSeverity: Severity;
  };

  hazardZones: HazardZone[];

  escalationAnalysis: {
    activeEscalation: boolean;
    trend: Trend;
    velocity: number; // 0-1 (rate of change)
  };

  recommendations: {
    generatePolygons: boolean;
    enableGeoFence: boolean;
    prepareEmergencyRouting: boolean;
    dispatchReady: boolean;
  };

  metadata: {
    processedAt: number;
    analysisLatencyMs: number;
    regionsAnalyzed: string[];
  };
}
