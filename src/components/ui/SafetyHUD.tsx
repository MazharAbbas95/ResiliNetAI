import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@theme';
import { useSafetyStore } from '../../store/safetyStore';
import { GlassCard } from './GlassCard';
import { Ionicons } from '@expo/vector-icons';

export const SafetyHUD = () => {
  const { state, distanceToHazard } = useSafetyStore((store) => store.status);

  if (state === 'SAFE') return null;

  const getStyle = () => {
    switch (state) {
      case 'CRITICAL': return { color: '#FF3B30', icon: 'flash', label: 'CRITICAL DANGER ZONE' };
      case 'DANGER':   return { color: '#FF3B30', icon: 'warning', label: 'ACTIVE FLOOD ZONE' };
      case 'WARNING':  return { color: '#FB6138', icon: 'alert-circle', label: 'APPROACHING HAZARD' };
      case 'CAUTION':  return { color: '#FF9500', icon: 'eye', label: 'MONITORING PROXIMITY' };
      default:         return { color: COLORS.primary, icon: 'shield', label: 'SAFE' };
    }
  };

  const config = getStyle();

  return (
    <View style={styles.wrapper}>
      <GlassCard style={styles.container} intensity={40}>
        <View style={[styles.indicator, { backgroundColor: config.color }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name={config.icon as any} size={12} color={config.color} />
            <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
          </View>
          {distanceToHazard && (
            <Text style={styles.distance}>Distance: {Math.round(distanceToHazard)}m</Text>
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 105,
    left: SPACING.md,
    right: SPACING.md,
    alignItems: 'center',
    zIndex: 20,
  },
  container: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  content: {
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  distance: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: '700',
  }
});
