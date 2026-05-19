import { Animated } from 'react-native';

export const PolygonAnimationEngine = {
  createPulse: (anim: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
  }
};
