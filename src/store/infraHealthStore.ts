import { create } from 'zustand';

interface InfraHealthState {
  backendConnected: boolean;
  firebaseSynced: boolean;
  googleMapsBillingActive: boolean;
  gpsLocked: boolean;
  usingFallbackIntelligence: boolean;
  
  // Latency Metrics
  backendLatencyMs: number;
  weatherApiLatencyMs: number;
  firebaseSyncLatencyMs: number;
  routingLatencyMs: number;
  orchestrationLatencyMs: number;

  setBackendConnected: (connected: boolean) => void;
  setFirebaseSynced: (synced: boolean) => void;
  setGoogleMapsBillingActive: (active: boolean) => void;
  setGpsLocked: (locked: boolean) => void;
  setUsingFallbackIntelligence: (using: boolean) => void;
  
  setBackendLatency: (ms: number) => void;
  setWeatherApiLatency: (ms: number) => void;
  setFirebaseSyncLatency: (ms: number) => void;
  setRoutingLatency: (ms: number) => void;
  setOrchestrationLatency: (ms: number) => void;
}

export const useInfraHealthStore = create<InfraHealthState>((set) => ({
  backendConnected: true,
  firebaseSynced: true,
  googleMapsBillingActive: false, 
  gpsLocked: true,
  usingFallbackIntelligence: false,
  
  backendLatencyMs: 42,
  weatherApiLatencyMs: 124,
  firebaseSyncLatencyMs: 85,
  routingLatencyMs: 14,
  orchestrationLatencyMs: 150,

  setBackendConnected: (backendConnected) => set({ backendConnected }),
  setFirebaseSynced: (firebaseSynced) => set({ firebaseSynced }),
  setGoogleMapsBillingActive: (googleMapsBillingActive) => set({ googleMapsBillingActive }),
  setGpsLocked: (gpsLocked) => set({ gpsLocked }),
  setUsingFallbackIntelligence: (usingFallbackIntelligence) => set({ usingFallbackIntelligence }),
  
  setBackendLatency: (backendLatencyMs) => set({ backendLatencyMs }),
  setWeatherApiLatency: (weatherApiLatencyMs) => set({ weatherApiLatencyMs }),
  setFirebaseSyncLatency: (firebaseSyncLatencyMs) => set({ firebaseSyncLatencyMs }),
  setRoutingLatency: (routingLatencyMs) => set({ routingLatencyMs }),
  setOrchestrationLatency: (orchestrationLatencyMs) => set({ orchestrationLatencyMs }),
}));
