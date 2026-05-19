import { create } from 'zustand';

export type AgentStepStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface PipelineLog {
  id: string;
  timestamp: number;
  agent: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  status: AgentStepStatus;
  processingTimeMs?: number;
  input?: any;
  output?: any;
  reasoning?: string;
  lastExecutionTime?: number;
  queueCount?: number;
  failureCount?: number;
  healthIndicator?: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'IDLE' | 'PROCESSING';
  currentTask?: string;
}

interface OrchestrationState {
  isActive: boolean;
  activeStepId: string | null;
  steps: AgentStep[];
  logs: PipelineLog[];
  metrics: {
    totalLatencyMs: number;
    lastUpdate: number;
    hazardsGenerated: number;
  };
  loopBlockingMetrics: {
    blockedLoops: number;
    consumedEvents: number;
    activeLocks: number;
    finalizedTasks: number;
  };

  // Actions
  setStepStatus: (id: string, status: AgentStepStatus, data?: Partial<AgentStep>) => void;
  addLog: (log: Omit<PipelineLog, 'id' | 'timestamp'>) => void;
  resetPipeline: () => void;
  startOrchestration: () => void;
  completeOrchestration: (latency: number) => void;
  setLoopBlockingMetrics: (metrics: Partial<OrchestrationState['loopBlockingMetrics']>) => void;
  incrementBlockedLoops: () => void;
}

const INITIAL_STEPS: AgentStep[] = [
  { id: 'normalization', name: 'INPUT NORMALIZATION', description: 'Convert raw data to structured intelligence', status: 'idle' },
  { id: 'crowd', name: 'CROWD-SOURCED UNION', description: 'Deduplicate reports & score trustworthiness', status: 'idle' },
  { id: 'sentiment', name: 'SENTIMENT DETECTOR', description: 'Analyze urgency and panic level', status: 'idle' },
  { id: 'verification', name: 'VERIFICATION FUSION', description: 'Verify API, telemetry, and multiple sources', status: 'idle' },
  { id: 'analyst', name: 'ANALYST', description: 'Create strategic interpretation', status: 'idle' },
  { id: 'shield', name: 'SHIELD MODULE', description: 'Prevent false positives & panic alerts', status: 'idle' },
  { id: 'predictive', name: 'PREDICTIVE SIMULATOR', description: 'Model possible future outcomes', status: 'idle' },
  { id: 'routing', name: 'CORRIDOR NAVIGATION ROUTER', description: 'Compute safe evacuation routing', status: 'idle' },
  { id: 'tactical', name: 'TACTICAL ANALYZER', description: 'Recommend response strategy', status: 'idle' },
  { id: 'priority', name: 'COORDINATION PRIORITY', description: 'Assign final response priority', status: 'idle' },
];

export const useOrchestrationStore = create<OrchestrationState>((set) => ({
  isActive: false,
  activeStepId: null,
  steps: INITIAL_STEPS,
  logs: [],
  metrics: {
    totalLatencyMs: 0,
    lastUpdate: Date.now(),
    hazardsGenerated: 0,
  },
  loopBlockingMetrics: {
    blockedLoops: 0,
    consumedEvents: 0,
    activeLocks: 0,
    finalizedTasks: 0,
  },

  setStepStatus: (id, status, data) => set((state) => {
    const newSteps = state.steps.map((s) => 
      s.id === id ? { ...s, status, ...data } : s
    );
    return { 
      steps: newSteps, 
      activeStepId: status === 'processing' ? id : state.activeStepId 
    };
  }),

  addLog: (log) => set((state) => ({
    logs: [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      ...log
    }, ...state.logs].slice(0, 50)
  })),

  resetPipeline: () => set({ 
    steps: INITIAL_STEPS.map(s => ({ ...s, status: 'idle' })),
    activeStepId: null,
    isActive: false,
    loopBlockingMetrics: {
      blockedLoops: 0,
      consumedEvents: 0,
      activeLocks: 0,
      finalizedTasks: 0,
    }
  }),

  startOrchestration: () => set({ 
    isActive: true, 
    steps: INITIAL_STEPS.map(s => ({ ...s, status: 'idle' })),
    activeStepId: 'aggregator' 
  }),

  completeOrchestration: (latency) => set((state) => ({
    isActive: false,
    activeStepId: null,
    metrics: {
      ...state.metrics,
      totalLatencyMs: latency,
      lastUpdate: Date.now(),
      hazardsGenerated: state.metrics.hazardsGenerated + 1
    }
  })),

  setLoopBlockingMetrics: (metrics) => set((state) => ({
    loopBlockingMetrics: {
      ...state.loopBlockingMetrics,
      ...metrics
    }
  })),

  incrementBlockedLoops: () => set((state) => ({
    loopBlockingMetrics: {
      ...state.loopBlockingMetrics,
      blockedLoops: state.loopBlockingMetrics.blockedLoops + 1
    }
  })),
}));
