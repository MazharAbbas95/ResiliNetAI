import { Coordinate, HazardSeverity, HazardZone } from './geospatial';

export { HazardZone };

// Alerts
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  targetHazardId?: string;
  targetRegion: string;
  dispatchStatus: 'Sent' | 'Delivered' | 'Read';
  sentAt: number;
  expiresAt: number;
}

// Shelters
export interface Shelter {
  id: string;
  name: string;
  type: 'Hospital' | 'Shelter' | 'Logistics' | 'CommandCenter';
  location: Coordinate;
  address: string;
  contactInfo: string;
  capacity: number;
  occupancy: number;
  operationalStatus: 'Open' | 'Full' | 'Closed' | 'Maintenance';
}

// Users
export interface UserProfile {
  id: string;
  deviceToken: string;
  liveLocation: Coordinate;
  activeHazardZone?: string;
  movementStatus: 'Stationary' | 'Moving' | 'Automotive';
  lastUpdated: number;
  emergencyMode: boolean;
}

// AI Logs
export interface AILog {
  id: string;
  agentName: string;
  inputSummary: string;
  outputSummary: string;
  confidence: number;
  processingTime: number;
  timestamp: number;
}

// AI Status
export interface AIStatus {
  isOrchestrating: boolean;
  activeAgents: number;
  lastAnalysisTimestamp: number | null;
  currentObjective: string | null;
}

// Routes
export interface EmergencyRoute {
  id: string;
  origin: Coordinate;
  destination: Coordinate;
  safeRouteCoordinates: Coordinate[];
  avoidedHazards: string[];
  estimatedArrival: number;
  routeStatus: 'Active' | 'Recalculating' | 'Completed';
}

// System Status
export interface SystemStatus {
  id: string;
  aiStatus: 'Operational' | 'Degraded' | 'Offline';
  firebaseStatus: 'Connected' | 'Disconnected';
  activeHazards: number;
  activeUsers: number;
  lastUpdated: number;
}
