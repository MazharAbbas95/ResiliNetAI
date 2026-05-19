import { PlacesAPIService } from './PlacesAPIService';
import { PlaceSafetyAnalyzer } from './PlaceSafetyAnalyzer';
import { SafeRadiusEngine } from '../safeRadius/SafeRadiusEngine';
import { usePlacesStore, EmergencyPlace } from '../../store/placesStore';
import { useAnalystStore } from '../../store/analystStore';
import { useOrchestrationStore } from '../../store/orchestrationStore';

export const EmergencyPlacesEngine = {
  syncNearbyInfrastructure: async (lat: number, lng: number) => {
    const { setPlaces, setLoading, setNearbySafeShelter } = usePlacesStore.getState();
    const { analysis } = useAnalystStore.getState();
    const { addLog } = useOrchestrationStore.getState();

    setLoading(true);
    addLog({ agent: 'system', message: 'Scanning for nearby emergency infrastructure...', status: 'info' });

    const rawPlaces = await PlacesAPIService.findNearbyEmergencyPlaces(lat, lng);
    const hazardZones = analysis?.hazardZones || [];

    const processedPlaces: EmergencyPlace[] = rawPlaces.map((p: any) => {
      const location = {
        latitude: p.geometry.location.lat,
        longitude: p.geometry.location.lng
      };

      const safety = PlaceSafetyAnalyzer.evaluate(location, hazardZones);

      return {
        id: p.place_id,
        name: p.name,
        type: p.types.includes('hospital') ? 'hospital' : 'relief',
        location: location,
        address: p.vicinity,
        rating: p.rating,
        isOpen: p.opening_hours?.open_now,
        safetyStatus: safety.status,
        safetyScore: safety.score
      };
    });

    setPlaces(processedPlaces);

    // Find best safe shelter (highest score, nearest)
    const safeShelters = processedPlaces
      .filter(p => p.safetyStatus === 'SAFE')
      .sort((a, b) => b.safetyScore - a.safetyScore);

    if (safeShelters.length > 0) {
      setNearbySafeShelter(safeShelters[0]);
      addLog({ 
        agent: 'Analyst', 
        message: `Emergency Scan Complete: Found ${processedPlaces.length} facilities. Nearest Safe: ${safeShelters[0].name}`, 
        status: 'success' 
      });
    } else {
      addLog({ agent: 'system', message: 'Warning: No 100% safe infrastructure found in immediate vicinity.', status: 'warning' });
    }

    // New: Trigger Safe Radius Engine for survival ranking
    SafeRadiusEngine.evaluateProximitySafety();

    setLoading(false);
  }
};
