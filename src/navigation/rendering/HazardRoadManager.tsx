import React from 'react';
import { Circle } from 'react-native-maps';
import { HazardZone } from '../../services/analystService';

interface Props {
  intersectingZones: HazardZone[];
  routeCoordinates: { latitude: number; longitude: number }[];
}

export const HazardRoadManager = ({ intersectingZones, routeCoordinates }: Props) => {
  return (
    <>
      {intersectingZones.map((zone) => (
        <React.Fragment key={zone.zoneId}>
          <Circle
            center={{ latitude: zone.center.lat, longitude: zone.center.lng }}
            radius={200}
            fillColor="rgba(255, 59, 48, 0.2)"
            strokeColor="rgba(255, 59, 48, 0.5)"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}
    </>
  );
};
