import { create } from 'zustand';

export interface EmergencyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'police' | 'fire' | 'relief';
  location: { latitude: number; longitude: number };
  address: string;
  rating?: number;
  isOpen?: boolean;
  safetyScore: number;
  safetyStatus: 'SAFE' | 'MONITOR' | 'CAUTION' | 'UNSAFE';
  distance?: number;
}

interface PlacesState {
  places: EmergencyPlace[];
  nearbySafeShelter: EmergencyPlace | null;
  isLoading: boolean;
  setPlaces: (places: EmergencyPlace[]) => void;
  setNearbySafeShelter: (shelter: EmergencyPlace | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePlacesStore = create<PlacesState>((set) => ({
  places: [],
  nearbySafeShelter: null,
  isLoading: false,
  setPlaces: (places) => set({ places }),
  setNearbySafeShelter: (shelter) => set({ nearbySafeShelter: shelter }),
  setLoading: (isLoading) => set({ isLoading }),
}));
