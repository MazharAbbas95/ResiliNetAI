export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type PolygonCoordinate = Coordinate;

export interface Region extends Coordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

export type HazardSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface PolygonMetadata {
  areaSqKm?: number;
  confidence?: number;
  lastUpdated: number;
  source: string;
}

export interface HazardZone {
  id: string;
  title: string;
  type: 'FlashFlood' | 'Erosion' | 'Debris' | 'Wildfire';
  severity: HazardSeverity;
  confidenceScore: number;
  polygon: PolygonCoordinate[];
  centroid: Coordinate;
  riskLevel: number;
  terrainRisk: number;
  sourceSignals: string[];
  aiAnalysis: string;
  status: 'Active' | 'Resolved' | 'Monitoring';
  isActive: boolean;
  isVisible: boolean;
  metadata: PolygonMetadata;
  createdAt: number;
  updatedAt: number;
  predictiveState?: any;
}

export type HazardPolygon = HazardZone;

export interface UserLocation extends Coordinate {
  heading: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}
