import { usePlacesStore, EmergencyPlace } from '../../store/placesStore';
import { useSafeRadiusStore } from '../../store/safeRadiusStore';
import { useAnalystStore } from '../../store/analystStore';
import { SurvivalProbabilityEngine } from './SurvivalProbabilityEngine';
import { PolygonIntersection } from '../../geofence/PolygonIntersection';

export const SafeRadiusEngine = {
  evaluateProximitySafety: () => {
    const { places } = usePlacesStore.getState();
    const { analysis } = useAnalystStore.getState();
    const { setNearestSafePlace, setSurvivableZones } = useSafeRadiusStore.getState();

    if (places.length === 0) return;

    const hazardZones = analysis?.hazardZones || [];

    // 1. Filter only SAFE or MONITOR places
    const viablePlaces = places.filter(p => 
      p.safetyStatus === 'SAFE' || p.safetyStatus === 'MONITOR'
    );

    // 2. Rank by survival probability and distance
    const rankedPlaces = viablePlaces.map(place => {
      const survival = SurvivalProbabilityEngine.calculate(place.location, hazardZones);
      
      return {
        ...place,
        survivalProbability: survival.probability,
        isolationRisk: survival.isolationRisk
      };
    }).sort((a, b) => {
      // Priority: High Survival Prob > Distance
      if (b.survivalProbability !== a.survivalProbability) {
        return b.survivalProbability - a.survivalProbability;
      }
      return (a.distance || 0) - (b.distance || 0);
    });

    if (rankedPlaces.length > 0) {
      setNearestSafePlace(rankedPlaces[0]);
    }

    // 3. Generate survivable zones for map visualization
    const zones = rankedPlaces.slice(0, 3).map(p => ({
      center: p.location,
      radius: 300,
      status: p.safetyStatus
    }));

    setSurvivableZones(zones);
  }
};
