import { create } from 'zustand';
import { AIStatus } from '@appTypes/intelligence';

interface AIState extends AIStatus {
  setOrchestrating: (status: boolean) => void;
  setObjective: (objective: string | null) => void;
  updateStats: (agents: number) => void;
}

export const useAIStore = create<AIState>((set) => ({
  isOrchestrating: false,
  activeAgents: 0,
  lastAnalysisTimestamp: null,
  currentObjective: null,
  setOrchestrating: (status) => set({ isOrchestrating: status, lastAnalysisTimestamp: Date.now() }),
  setObjective: (objective) => set({ currentObjective: objective }),
  updateStats: (agents) => set({ activeAgents: agents }),
}));
