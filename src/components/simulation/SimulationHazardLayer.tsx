import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Polygon } from 'react-native-maps';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// Utility to create a circular polygon from center + radius (in meters)
const createCirclePolygon = (center: { latitude: number, longitude: number }, radius: number, points = 32) => {
  const coords = [];
  const distanceLat = radius / 111300;
  const distanceLng = radius / (111300 * Math.cos(center.latitude * Math.PI / 180));
  
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coords.push({
      latitude: center.latitude + distanceLat * Math.sin(theta),
      longitude: center.longitude + distanceLng * Math.cos(theta),
    });
  }
  return coords;
};

export const SimulationHazardLayer = () => {
  const activeHazards = useSimulationDemoStore(state => state.activeHazards);

  return (
    <>
      {activeHazards.map(hazard => (
        <HazardPolygonVisualizer key={hazard.id} hazard={hazard} />
      ))}
    </>
  );
};

const HazardPolygonVisualizer = ({ hazard }: { hazard: any }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous tactical pulse animation
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: false })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  // Generate 3 concentric circles for heatmap effect
  const corePolygon = createCirclePolygon(hazard.center, hazard.radius * 0.4);
  const midPolygon = createCirclePolygon(hazard.center, hazard.radius * 0.7);
  const outerPolygon = createCirclePolygon(hazard.center, hazard.radius);

  // Determine colors based on severity
  const isCritical = hazard.severity === 'critical';
  const baseColor = isCritical ? '255, 59, 48' : '255, 149, 0'; // Red vs Orange
  
  const outerFillAnim = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`rgba(${baseColor}, 0.1)`, `rgba(${baseColor}, 0.3)`]
  });

  return (
    <>
      {/* Outer pulsing ring */}
      <AnimatedPolygon
        coordinates={outerPolygon}
        fillColor={outerFillAnim as unknown as string}
        strokeColor={`rgba(${baseColor}, 0.6)`}
        strokeWidth={1}
        lineDashPattern={[10, 10]}
      />
      
      {/* Mid density ring */}
      <Polygon
        coordinates={midPolygon}
        fillColor={`rgba(${baseColor}, 0.4)`}
        strokeColor={`rgba(${baseColor}, 0.8)`}
        strokeWidth={2}
      />

      {/* Core intensity */}
      <Polygon
        coordinates={corePolygon}
        fillColor={`rgba(${baseColor}, 0.7)`}
        strokeColor={`rgba(${baseColor}, 1)`}
        strokeWidth={3}
      />
    </>
  );
};
