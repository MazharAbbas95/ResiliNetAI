import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '@theme';
import { RISK_PALETTE } from './risk/RiskColorEngine';
import { GlassCard } from '../components/ui/GlassCard';

export const RiskLegend = () => {
  return (
    <GlassCard style={styles.container} intensity={30}>
      <Text style={styles.title}>RISK LEVELS</Text>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: RISK_PALETTE.CRITICAL }]} />
        <Text style={styles.label}>CRITICAL</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: RISK_PALETTE.HIGH }]} />
        <Text style={styles.label}>HIGH</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: RISK_PALETTE.MEDIUM }]} />
        <Text style={styles.label}>MEDIUM</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: RISK_PALETTE.LOW }]} />
        <Text style={styles.label}>LOW</Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 15,
    bottom: 240, // Above the tactical status pill
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
