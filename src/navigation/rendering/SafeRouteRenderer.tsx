import React from 'react';
import { RoutePolyline } from '../RoutePolyline';
import { useNavigationStore } from '../../store/navigationStore';
import { useAnalystStore } from '../../store/analystStore';
import { RouteIntersectionAnalyzer } from '../hazard/RouteIntersectionAnalyzer';
import { HazardRoadManager } from './HazardRoadManager';

export const SafeRouteRenderer = () => {
  const { routeInfo, state } = useNavigationStore();
  const { analysis } = useAnalystStore();

  if (!routeInfo || state === 'IDLE') return null;

  // Analyze the current route to identify blocked segments if any
  const safetyResult = analysis 
    ? RouteIntersectionAnalyzer.analyze(routeInfo.coordinates, analysis.hazardZones)
    : null;

  return (
    <>
      {/* 1. The Main Safe Route Path */}
      <RoutePolyline />

      {/* 2. Blocked Road Overlays (Visualizing AI Decisions) */}
      {safetyResult?.isUnsafe && (
        <HazardRoadManager 
          intersectingZones={safetyResult.intersectingZones} 
          routeCoordinates={routeInfo.coordinates} 
        />
      )}

      {/* 3. Future: Alternative routes can be added here */}
    </>
  );
};
