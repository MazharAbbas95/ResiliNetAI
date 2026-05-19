import { create } from 'zustand';
import { Shelter } from '@appTypes/intelligence';

interface ShelterState {
  shelters: Shelter[];
  setShelters: (shelters: Shelter[]) => void;
}

const MOCK_SHELTERS: Shelter[] = [
  {
    id: 'S1',
    name: 'Central Relief Center',
    type: 'Hospital',
    location: { latitude: 37.78325, longitude: -122.4314 },
    address: '101 Emergency Way',
    contactInfo: '555-0199',
    capacity: 500,
    occupancy: 450,
    operationalStatus: 'Open',
  },
  {
    id: 'S2',
    name: 'North Sector Shelter',
    type: 'Shelter',
    location: { latitude: 37.79125, longitude: -122.4354 },
    address: '202 Safety Blvd',
    contactInfo: '555-0188',
    capacity: 200,
    occupancy: 200,
    operationalStatus: 'Full',
  },
  {
    id: 'S3',
    name: 'East Corridor Med-Station',
    type: 'Hospital',
    location: { latitude: 37.78725, longitude: -122.4284 },
    address: '303 Health St',
    contactInfo: '555-0177',
    capacity: 100,
    occupancy: 40,
    operationalStatus: 'Open',
  },
];

export const useShelterStore = create<ShelterState>((set) => ({
  shelters: MOCK_SHELTERS,
  setShelters: (shelters) => set({ shelters }),
}));
