import React from 'react';
import { useHazardStore } from '../store/hazardStore';
import { HazardPolygon } from './HazardPolygon';

interface Props {
  onZonePress?: (zoneId: string) => void;
}

export const PolygonRenderer: React.FC<Props> = ({ onZonePress }) => {
  const hazardZones = useHazardStore((state) => state.hazardZones);

  if (!hazardZones || hazardZones.length === 0) return null;

  return (
    <>
      {hazardZones.map((zone) => (
        <HazardPolygon
          key={zone.id}
          id={zone.id}
          severity={zone.severity.toLowerCase() as any}
          confidence={zone.confidenceScore}
          coordinates={zone.polygon.map(p => ({
            latitude: p.latitude,
            longitude: p.longitude
          }))}
          center={{
            latitude: zone.centroid.latitude,
            longitude: zone.centroid.longitude
          }}
          onPress={() => onZonePress?.(zone.id)}
        />
      ))}
    </>
  );
};
