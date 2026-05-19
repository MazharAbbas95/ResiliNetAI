import React from 'react';
import { useHazardStore } from '@store/hazardStore';
import { HazardPolygon } from './HazardPolygon';

/** Guards against catastrophic zero-coordinate and invalid polygon rendering */
function isValidZone(zone: any): boolean {
  if (!zone.isVisible || !zone.isActive) return false;
  if (!zone.polygon || zone.polygon.length < 3) return false;
  const c = zone.centroid;
  if (!c || (c.latitude === 0 && c.longitude === 0)) return false;
  return true;
}

export const HazardLayer = React.memo(() => {
  const hazardZones = useHazardStore((state) => state.hazardZones);
  const validZones = hazardZones.filter(isValidZone);

  return (
    <>
      {validZones.map((zone) => (
        <HazardPolygon key={zone.id} zone={zone} />
      ))}
    </>
  );
});
