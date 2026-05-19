import { create } from 'zustand';

export type HealthStatus = 'healthy' | 'delayed' | 'failed' | 'idle' | 'processing';

interface AgentHealth {
  id: string;
  name: string;
  status: HealthStatus;
  lastPulse: number;
  errorCount: number;
}

interface HealthState {
  agents: Record<string, AgentHealth>;
  updateStatus: (id: string, status: HealthStatus) => void;
  reportPulse: (id: string) => void;
  reportError: (id: string, error: string) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  agents: {
    sentinel: { id: 'sentinel', name: 'Sentinel Agent', status: 'healthy', lastPulse: Date.now(), errorCount: 0 },
    gemini: { id: 'gemini', name: 'Gemini 2.5 Flash', status: 'healthy', lastPulse: Date.now(), errorCount: 0 },
    analyst: { id: 'analyst', name: 'Analyst Agent', status: 'healthy', lastPulse: Date.now(), errorCount: 0 },
    validator: { id: 'validator', name: 'Validation Engine', status: 'healthy', lastPulse: Date.now(), errorCount: 0 },
  },

  updateStatus: (id, status) => set((state) => ({
    agents: {
      ...state.agents,
      [id]: { ...state.agents[id], status, lastPulse: Date.now() }
    }
  })),

  reportPulse: (id) => set((state) => ({
    agents: {
      ...state.agents,
      [id]: { ...state.agents[id], status: 'healthy', lastPulse: Date.now() }
    }
  })),

  reportError: (id, error) => set((state) => {
    const agent = state.agents[id];
    const newErrorCount = agent.errorCount + 1;
    return {
      agents: {
        ...state.agents,
        [id]: { 
          ...agent, 
          status: newErrorCount > 3 ? 'failed' : 'delayed', 
          errorCount: newErrorCount,
          lastPulse: Date.now() 
        }
      }
    };
  }),
}));
