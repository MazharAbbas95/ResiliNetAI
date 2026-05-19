import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@theme';
import { useLocationStore } from '@store/locationStore';

export const GPSIndicator = () => {
  const trackingState = useLocationStore((state) => state.trackingState);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (trackingState === 'tracking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [trackingState]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.indicator, 
          { 
            backgroundColor: trackingState === 'tracking' ? COLORS.success : COLORS.warning,
            transform: [{ scale: pulseAnim }],
            opacity: trackingState === 'tracking' ? 0.8 : 0.5,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
