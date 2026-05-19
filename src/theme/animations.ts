import { Easing } from 'react-native';

export const ANIMATIONS = {
  // Durations
  durations: {
    fast: 200,
    normal: 400,
    slow: 800,
    cinematic: 1500,
  },
  
  // Easings
  easings: {
    outCubic: Easing.out(Easing.cubic),
    inOutExpo: Easing.inOut(Easing.exp),
    pulse: Easing.bezier(0.4, 0, 0.6, 1),
  },

  // Presets
  pulseConfig: {
    duration: 2000,
    easing: Easing.linear,
    useNativeDriver: true,
  }
};
