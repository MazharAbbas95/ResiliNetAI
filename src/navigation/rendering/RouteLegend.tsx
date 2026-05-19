import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@theme';
import { GlassCard } from '../../components/ui/GlassCard';

export const RouteLegend = () => {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={30}>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.text}>SAFE ROUTE</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: '#FFCC00' }]} />
          <Text style={styles.text}>MODERATE RISK</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.text}>BLOCKED / HAZARD</Text>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140, // Positioned above the dashboard
    right: SPACING.md,
    zIndex: 100,
  },
  card: {
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  }
});
