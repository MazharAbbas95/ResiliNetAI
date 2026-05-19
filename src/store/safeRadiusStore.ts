import { create } from 'zustand';
import { EmergencyPlace } from './placesStore';

interface SafeRadiusState {
  nearestSafePlace: EmergencyPlace | null;
  survivalRadius: number; // in meters
  currentSafetyLevel: 'SAFE' | 'MONITOR' | 'CAUTION' | 'UNSAFE' | 'CRITICAL';
  survivableZones: { center: { latitude: number; longitude: number }, radius: number, status: string }[];
  
  setNearestSafePlace: (place: EmergencyPlace | null) => void;
  setSurvivalRadius: (radius: number) => void;
  setSafetyLevel: (level: 'SAFE' | 'MONITOR' | 'CAUTION' | 'UNSAFE' | 'CRITICAL') => void;
  setSurvivableZones: (zones: any[]) => void;
}

export const useSafeRadiusStore = create<SafeRadiusState>((set) => ({
  nearestSafePlace: null,
  survivalRadius: 5000,
  currentSafetyLevel: 'SAFE',
  survivableZones: [],

  setNearestSafePlace: (nearestSafePlace) => set({ nearestSafePlace }),
  setSurvivalRadius: (survivalRadius) => set({ survivalRadius }),
  setSafetyLevel: (currentSafetyLevel) => set({ currentSafetyLevel }),
  setSurvivableZones: (survivableZones) => set({ survivableZones }),
}));
