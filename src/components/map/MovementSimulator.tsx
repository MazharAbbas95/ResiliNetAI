import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@theme';
import { useLocationStore } from '../../store/locationStore';
import { GlassCard } from '../ui/GlassCard';

const MOVE_STEP = 0.0003; // ~30 meters

export const MovementSimulator = () => {
  const simulateMovement = useLocationStore((state) => state.simulateMovement);

  // Only show in development
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={20}>
        <Text style={styles.title}>SIMULATE</Text>
        <View style={styles.controls}>
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.btn} 
              onPress={() => simulateMovement(MOVE_STEP, 0)}
            >
              <Ionicons name="caret-up" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.btn} 
              onPress={() => simulateMovement(0, -MOVE_STEP)}
            >
              <Ionicons name="caret-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.spacer} />
            <TouchableOpacity 
              style={styles.btn} 
              onPress={() => simulateMovement(0, MOVE_STEP)}
            >
              <Ionicons name="caret-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.btn} 
              onPress={() => simulateMovement(-MOVE_STEP, 0)}
            >
              <Ionicons name="caret-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    bottom: 250, // Positioned above the log
    zIndex: 1000,
  },
  card: {
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  title: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
    letterSpacing: 1,
  },
  controls: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 32,
  }
});
