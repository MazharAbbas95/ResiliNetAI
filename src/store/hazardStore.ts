import { create } from 'zustand';
import { HazardZone, HazardSeverity } from '@appTypes/geospatial';

interface HazardState {
  hazardZones: HazardZone[];
  setHazardZones: (zones: HazardZone[]) => void;
  addHazardZone: (zone: HazardZone) => void;
  removeHazardZone: (id: string) => void;
  updateHazardZone: (id: string, updates: Partial<HazardZone>) => void;
  activeHazardsCount: () => number;
  highestSeverity: () => HazardSeverity;
}

// No mock hazards — hazardZones starts empty.
// Real hazards are written by the agent orchestration pipeline
// via SharedMemoryManager → Firebase → hazardService subscription.

export const useHazardStore = create<HazardState>((set, get) => ({
  hazardZones: [],
  setHazardZones: (zones) => set({ hazardZones: zones }),
  addHazardZone: (zone) => set((state) => ({ 
    hazardZones: [...state.hazardZones, zone] 
  })),
  removeHazardZone: (id) => set((state) => ({ 
    hazardZones: state.hazardZones.filter(z => z.id !== id) 
  })),
  updateHazardZone: (id, updates) => set((state) => ({
    hazardZones: state.hazardZones.map(z => z.id === id ? { ...z, ...updates } : z)
  })),
  activeHazardsCount: () => get().hazardZones.filter(h => h.isActive).length,
  highestSeverity: () => {
    const zones = get().hazardZones.filter(h => h.isActive);
    if (zones.some(z => z.severity === 'Critical')) return 'Critical';
    if (zones.some(z => z.severity === 'High')) return 'High';
    if (zones.some(z => z.severity === 'Medium')) return 'Medium';
    return 'Low';
  }
}));
