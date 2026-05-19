import { create } from 'zustand';

export type SafetyState = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'CRITICAL';

interface SafetyStatus {
  state: SafetyState;
  nearestHazardId: string | null;
  distanceToHazard: number | null;
  lastEntryTimestamp: number | null;
  history: { state: SafetyState; timestamp: number }[];
}

interface SafetyStore {
  status: SafetyStatus;
  isModalOpen: boolean;
  setSafetyState: (state: SafetyState, hazardId?: string, distance?: number) => void;
  setModalOpen: (open: boolean) => void;
  reset: () => void;
}

export const useSafetyStore = create<SafetyStore>((set) => ({
  status: {
    state: 'SAFE',
    nearestHazardId: null,
    distanceToHazard: null,
    lastEntryTimestamp: null,
    history: [],
  },
  isModalOpen: false,

  setSafetyState: (state, hazardId, distance) => set((store) => {
    const isNewState = store.status.state !== state;
    const now = Date.now();
    const shouldOpenModal = (state === 'DANGER' || state === 'CRITICAL' || state === 'WARNING') && isNewState;
    
    return {
      isModalOpen: shouldOpenModal ? true : store.isModalOpen,
      status: {
        ...store.status,
        state,
        nearestHazardId: hazardId || null,
        distanceToHazard: distance !== undefined ? distance : null,
        lastEntryTimestamp: (state === 'DANGER' || state === 'CRITICAL') && isNewState ? now : store.status.lastEntryTimestamp,
        history: isNewState 
          ? [{ state, timestamp: now }, ...store.status.history].slice(0, 50)
          : store.status.history
      }
    };
  }),

  setModalOpen: (open) => set({ isModalOpen: open }),

  reset: () => set({
    status: {
      state: 'SAFE',
      nearestHazardId: null,
      distanceToHazard: null,
      lastEntryTimestamp: null,
      history: [],
    }
  }),
}));
