import { Animated, Easing } from 'react-native';

export const SeverityAnimationEngine = {
  createSeverityPulse: (anim: Animated.Value, duration: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
  }
};
