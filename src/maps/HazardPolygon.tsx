import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Polygon, Circle } from 'react-native-maps';
import { RiskColorEngine } from './risk/RiskColorEngine';
import { HazardAnimationEngine } from './animations/HazardAnimationEngine';

interface PolygonCoords {
  latitude: number;
  longitude: number;
}

interface Props {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  coordinates: PolygonCoords[];
  center: { latitude: number; longitude: number };
  onPress?: () => void;
}

export const HazardPolygon: React.FC<Props> = ({ id, severity, confidence, coordinates, center, onPress }) => {
  const style = RiskColorEngine.getStyle(confidence, severity);
  const animConfig = HazardAnimationEngine.getAnimationConfig(severity, confidence);
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [currentOpacity, setCurrentOpacity] = useState(animConfig.minOpacity);
  const [currentStroke, setCurrentStroke] = useState(animConfig.minStroke);

  // Radar wave for Critical
  const radarAnim = useRef(new Animated.Value(0)).current;
  const [radarRadius, setRadarRadius] = useState(0);

  useEffect(() => {
    // Breathing Animation
    const breathing = HazardAnimationEngine.createBreathingAnimation(pulseAnim, animConfig);
    
    const listenerId = pulseAnim.addListener(({ value }) => {
      const opacity = animConfig.minOpacity + (animConfig.maxOpacity - animConfig.minOpacity) * value;
      const stroke = animConfig.minStroke + (animConfig.maxStroke - animConfig.minStroke) * value;
      setCurrentOpacity(opacity);
      setCurrentStroke(stroke);
    });

    breathing.start();

    // Radar Animation for Critical
    let radarLoop: any;
    if (severity === 'critical') {
      radarLoop = Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      );
      
      const radarListener = radarAnim.addListener(({ value }) => {
        setRadarRadius(value * 1000); // Expanding radar up to 1km
      });
      
      radarLoop.start();
    }

    return () => {
      breathing.stop();
      pulseAnim.removeListener(listenerId);
      if (radarLoop) {
        radarLoop.stop();
        radarAnim.removeAllListeners();
      }
    };
  }, [severity, confidence]);

  // Escalation Flash Simulation
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 500);
    return () => clearTimeout(timer);
  }, [severity]);

  return (
    <>
      {severity === 'critical' && (
        <Circle
          center={center}
          radius={radarRadius}
          fillColor="rgba(255, 59, 48, 0.1)"
          strokeColor="rgba(255, 59, 48, 0.3)"
          strokeWidth={1}
        />
      )}
      <Polygon
        coordinates={coordinates}
        fillColor={flash ? 'rgba(255,255,255,0.6)' : style.fillColor.replace(/[\d.]+\)$/g, `${currentOpacity})`)}
        strokeColor={style.strokeColor}
        strokeWidth={currentStroke}
        tappable
        onPress={onPress}
        zIndex={confidence + (severity === 'critical' ? 100 : 0)}
      />
    </>
  );
};
