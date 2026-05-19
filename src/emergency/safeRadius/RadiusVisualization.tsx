import React from 'react';
import { Circle } from 'react-native-maps';
import { useSafeRadiusStore } from '../../store/safeRadiusStore';
import { COLORS } from '@theme';

export const RadiusVisualization = () => {
  const { survivableZones, nearestSafePlace } = useSafeRadiusStore();

  return (
    <>
      {survivableZones.map((zone, idx) => (
        <Circle
          key={`zone-${idx}`}
          center={zone.center}
          radius={zone.radius}
          fillColor={zone.status === 'SAFE' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)'}
          strokeColor={zone.status === 'SAFE' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 149, 0, 0.3)'}
          strokeWidth={1}
        />
      ))}

      {nearestSafePlace && (
        <Circle
          center={nearestSafePlace.location}
          radius={500}
          fillColor="rgba(0, 122, 255, 0.05)"
          strokeColor="rgba(0, 122, 255, 0.4)"
          strokeWidth={2}
          lineDashPattern={[5, 5]}
        />
      )}
    </>
  );
};
