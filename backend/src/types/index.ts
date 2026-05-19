export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface HazardPayload {
  title: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  polygon: Coordinates[];
}

export interface AlertPayload {
  title: string;
  message: string;
  level: 'Info' | 'Warning' | 'Critical';
  targetArea?: Coordinates[];
}
