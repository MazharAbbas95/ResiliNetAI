import { Animated, Easing } from 'react-native';

export interface AnimationConfig {
  pulseDuration: number;
  maxOpacity: number;
  minOpacity: number;
  maxStroke: number;
  minStroke: number;
}

export const HazardAnimationEngine = {
  getAnimationConfig: (severity: string, confidence: number): AnimationConfig => {
    switch (severity) {
      case 'critical':
        return {
          pulseDuration: 1000,
          maxOpacity: 0.6,
          minOpacity: 0.3,
          maxStroke: 5,
          minStroke: 3,
        };
      case 'high':
        return {
          pulseDuration: 2000,
          maxOpacity: 0.5,
          minOpacity: 0.25,
          maxStroke: 4,
          minStroke: 2,
        };
      case 'medium':
        return {
          pulseDuration: 3000,
          maxOpacity: 0.4,
          minOpacity: 0.2,
          maxStroke: 3,
          minStroke: 1.5,
        };
      default:
        return {
          pulseDuration: 4000,
          maxOpacity: 0.3,
          minOpacity: 0.15,
          maxStroke: 2,
          minStroke: 1,
        };
    }
  },

  createBreathingAnimation: (anim: Animated.Value, config: AnimationConfig) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: config.pulseDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: config.pulseDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
  }
};
