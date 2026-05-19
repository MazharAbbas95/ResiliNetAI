import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@theme';
import { useLocationStore } from '../../store/locationStore';
import { GlassCard } from '../ui/GlassCard';

export const MapControls = () => {
  const isAutoFollowEnabled = useLocationStore((state) => state.isAutoFollowEnabled);
  const toggleAutoFollow = useLocationStore((state) => state.toggleAutoFollow);
  const currentLocation = useLocationStore((state) => state.currentLocation);

  const handleRecenter = () => {
    if (!isAutoFollowEnabled) {
      toggleAutoFollow();
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={30}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRecenter}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isAutoFollowEnabled ? "locate" : "locate-outline"} 
            size={22} 
            color={isAutoFollowEnabled ? COLORS.primary : "rgba(255,255,255,0.6)"} 
          />
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: SPACING.md,
    top: 240, // Positioned above the Legend
    zIndex: 100,
  },
  card: {
    padding: 8,
    borderRadius: RADIUS.md,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
