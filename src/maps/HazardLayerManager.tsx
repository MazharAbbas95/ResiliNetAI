import React from 'react';
import { PolygonRenderer } from './PolygonRenderer';

interface Props {
  onZoneSelect: (zoneId: string) => void;
}

export const HazardLayerManager: React.FC<Props> = ({ onZoneSelect }) => {
  return (
    <>
      <PolygonRenderer onZonePress={onZoneSelect} />
    </>
  );
};
