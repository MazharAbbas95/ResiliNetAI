import React, { useMemo } from 'react';
import { Polyline } from 'react-native-maps';
import { COLORS } from '@theme';
import { useNavigationStore } from '../store/navigationStore';
import { useAnalystStore } from '../store/analystStore';
import { RouteIntersectionAnalyzer } from './hazard/RouteIntersectionAnalyzer';
import { RouteSafetyScore } from './hazard/RouteSafetyScore';

export const RoutePolyline = () => {
  const { routeInfo, state } = useNavigationStore();
  const { analysis } = useAnalystStore();

  const safetyColor = useMemo(() => {
    if (!routeInfo || !analysis) return COLORS.primary;
    const result = RouteIntersectionAnalyzer.analyze(routeInfo.coordinates, analysis.hazardZones);
    const score = RouteSafetyScore.calculate(result);
    return RouteSafetyScore.getColor(score);
  }, [routeInfo, analysis]);

  if (!routeInfo || state === 'IDLE' || state === 'FAILED') return null;

  return (
    <>
      {/* Outer Glow */}
      <Polyline
        coordinates={routeInfo.coordinates}
        strokeColor={safetyColor + '33'} // Add transparency
        strokeWidth={10}
        lineCap="round"
        lineJoin="round"
      />
      
      {/* Inner Glow */}
      <Polyline
        coordinates={routeInfo.coordinates}
        strokeColor={safetyColor + '66'} // Add transparency
        strokeWidth={6}
        lineCap="round"
        lineJoin="round"
      />

      {/* Core Path */}
      <Polyline
        coordinates={routeInfo.coordinates}
        strokeColor={safetyColor}
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};
