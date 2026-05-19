import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { HazardZone } from '@appTypes/geospatial';
import { Alert, Shelter, SystemStatus } from '@appTypes/intelligence';

export const seedingService = {
  async seedMockData() {
    console.log('[Seeding] Starting Data Population...');
    const batch = writeBatch(db);

    // 1. Seed System Status
    const systemRef = doc(db, COLLECTIONS.SYSTEM_STATUS, 'global');
    const systemData: SystemStatus = {
      id: 'global',
      aiStatus: 'Operational',
      firebaseStatus: 'Connected',
      activeHazards: 3,
      activeUsers: 142,
      lastUpdated: Date.now(),
    };
    batch.set(systemRef, systemData);

    // 2. Seed Shelters
    const shelterData: Shelter[] = [
      {
        id: 'S1',
        name: 'Sector-7 Relief Hub',
        type: 'Hospital',
        location: { latitude: 37.78325, longitude: -122.4314 },
        address: '101 Emergency Way',
        contactInfo: '555-0199',
        capacity: 500,
        occupancy: 420,
        operationalStatus: 'Open',
      },
      {
        id: 'S2',
        name: 'North Corridor Station',
        type: 'Shelter',
        location: { latitude: 37.79125, longitude: -122.4354 },
        address: '202 Safety Blvd',
        contactInfo: '555-0188',
        capacity: 200,
        occupancy: 200,
        operationalStatus: 'Full',
      }
    ];
    shelterData.forEach(s => {
      const sRef = doc(db, COLLECTIONS.SHELTERS, s.id);
      batch.set(sRef, s);
    });

    // 3. Seed Hazards
    const hazardData: HazardZone[] = [
      {
        id: 'H1',
        title: 'Mission District Flash Flood',
        type: 'FlashFlood',
        severity: 'High',
        confidenceScore: 0.94,
        polygon: [
          { latitude: 37.78825, longitude: -122.4324 },
          { latitude: 37.78925, longitude: -122.4334 },
          { latitude: 37.79025, longitude: -122.4314 },
        ],
        centroid: { latitude: 37.789, longitude: -122.432 },
        riskLevel: 8,
        terrainRisk: 7,
        sourceSignals: ['SAT-RADAR', 'IOT-VALVE-A1'],
        aiAnalysis: 'High-confidence runoff accumulation detected.',
        status: 'Active',
        isActive: true,
        isVisible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: { confidence: 0.94, lastUpdated: Date.now(), source: 'SENTINEL-1' }
      }
    ];
    hazardData.forEach(h => {
      const hRef = doc(db, COLLECTIONS.HAZARDS, h.id);
      batch.set(hRef, h);
    });

    try {
      await batch.commit();
      console.log('[Seeding] Successfully populated Firestore.');
    } catch (error) {
      console.error('[Seeding] Error:', error);
    }
  }
};
