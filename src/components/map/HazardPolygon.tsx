import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Polygon } from 'react-native-maps';
import { HazardPolygon as HazardPolygonType } from '@appTypes/geospatial';

interface HazardPolygonProps {
  zone: HazardPolygonType;
}

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export const HazardPolygon: React.FC<HazardPolygonProps> = React.memo(({ zone }) => {
  if (!zone.isActive || !zone.isVisible) return null;

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [currentPoints, setCurrentPoints] = useState(zone.polygon);

  // Confidence-based colors
  const getColors = () => {
    const { confidenceScore, severity, status } = zone;
    
    if (status === 'Resolved') {
      return { fill: 'rgba(0, 255, 0, 0.2)', stroke: 'rgba(0, 255, 0, 0.5)' };
    }
    if (status === 'Monitoring') {
      return { fill: 'rgba(255, 204, 0, 0.3)', stroke: 'rgba(255, 204, 0, 0.8)' };
    }

    if (severity === 'Critical') {
      return { fill: 'rgba(255, 0, 0, 0.5)', stroke: 'rgba(255, 0, 0, 1)' };
    } else if (severity === 'High') {
      return { fill: 'rgba(255, 69, 0, 0.4)', stroke: 'rgba(255, 69, 0, 0.9)' };
    } else if (severity === 'Medium') {
      return { fill: 'rgba(255, 140, 0, 0.3)', stroke: 'rgba(255, 140, 0, 0.8)' };
    }
    return { fill: 'rgba(255, 255, 0, 0.2)', stroke: 'rgba(255, 255, 0, 0.6)' };
  };

  const colors = getColors();

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    
    pulseAnim.setValue(0);

    if (zone.severity === 'Critical') {
      // Deep red animated expansion / violent pulse
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
        ])
      );
    } else if (zone.severity === 'High' || zone.severity === 'Medium') {
      // Orange/Red pulse
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
    } else if (zone.status === 'Monitoring') {
      // Blinking
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      );
    }

    if (anim) anim.start();

    return () => {
      if (anim) anim.stop();
    };
  }, [zone.severity, zone.status, zone.confidenceScore]);

  // Smooth Coordinate Interpolation
  useEffect(() => {
    // A simple approach to gradually expand/contract:
    // If zone.polygon changes, we update it directly. For real "gradual" expansion, 
    // we would use a requestAnimationFrame loop interpolating old->new coordinates.
    // For performance and simplicity in maps, updating state directly works,
    // but we can simulate the "evolution" by applying an animated stroke width.
    setCurrentPoints(zone.polygon);
  }, [zone.polygon]);

  const animatedFill = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colors.fill, 
      colors.fill.replace(/0\.\d+\)/, '0.1)') // fade out to 0.1
    ]
  });

  const strokeWidthAnim = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [zone.severity === 'Critical' ? 4 : 2, zone.severity === 'Critical' ? 8 : 4]
  });

  return (
    <>
      <AnimatedPolygon
        coordinates={currentPoints}
        fillColor={animatedFill as unknown as string}
        strokeColor={colors.stroke}
        strokeWidth={zone.severity === 'Critical' ? 3 : 2}
        tappable
        onPress={() => {}}
        zIndex={zone.severity === 'Critical' ? 100 : 10}
      />
      {zone.predictiveState?.predictedPolygon && zone.predictiveState.predictedPolygon.length > 0 && (
        <Polygon
          coordinates={zone.predictiveState.predictedPolygon}
          fillColor="rgba(255, 255, 255, 0.05)"
          strokeColor="rgba(255, 255, 255, 0.6)"
          strokeWidth={1}
          lineDashPattern={[5, 5]}
          zIndex={5}
        />
      )}
    </>
  );
});
