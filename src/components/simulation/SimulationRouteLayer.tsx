import React from 'react';
import { Polyline } from 'react-native-maps';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';

export const SimulationRouteLayer = () => {
  const activeRoutes = useSimulationDemoStore(state => state.activeRoutes);

  return (
    <>
      {activeRoutes.map(route => (
        <Polyline
          key={route.id}
          coordinates={route.coordinates}
          strokeColor={route.type === 'blocked' ? '#FF3B30' : '#00E6FF'}
          strokeWidth={route.type === 'blocked' ? 4 : 5}
          lineDashPattern={route.type === 'blocked' ? [10, 10] : undefined}
          geodesic={true}
        />
      ))}
    </>
  );
};
