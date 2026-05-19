import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHazardStore } from '@store/hazardStore';
import { COLORS, SPACING, RADIUS } from '@theme';
import { PolygonSeverityBadge } from './PolygonSeverityBadge';
import { Ionicons } from '@expo/vector-icons';

export const HazardOverlayCard = () => {
  const activeCount = useHazardStore((state) => state.activeHazardsCount());
  const highestSeverity = useHazardStore((state) => state.highestSeverity());

  if (activeCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning" size={18} color={COLORS.error} />
        <Text style={styles.title}>ACTIVE HAZARDS: {activeCount}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.label}>Highest Threat Level</Text>
        <PolygonSeverityBadge severity={highestSeverity} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.source}>SOURCE: SENTINEL MESH-NET</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(21, 25, 30, 0.95)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 200,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  content: {
    marginBottom: SPACING.sm,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  source: {
    color: COLORS.textDim,
    fontSize: 8,
    fontWeight: 'bold',
  },
});
export default HazardOverlayCard;
