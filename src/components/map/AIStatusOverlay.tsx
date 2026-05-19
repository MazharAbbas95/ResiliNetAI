import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '@theme';
import { useAIStore } from '@store/aiStore';
import { useHazardStore } from '@store/hazardStore';
import { Ionicons } from '@expo/vector-icons';

export const AIStatusOverlay = () => {
  const { isOrchestrating, activeAgents } = useAIStore();
  const activeHazards = useHazardStore((state) => state.activeHazardsCount());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="hardware-chip" size={16} color={COLORS.primary} />
        <Text style={styles.title}>SENTINEL ORCHESTRATOR</Text>
      </View>
      
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.label}>Active Hazards</Text>
          <Text style={[styles.value, activeHazards > 0 && { color: COLORS.error }]}>{activeHazards}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.label}>Active Agents</Text>
          <Text style={styles.value}>{activeAgents}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.pulse, { backgroundColor: isOrchestrating ? COLORS.success : COLORS.warning }]} />
        <Text style={styles.statusText}>{isOrchestrating ? 'SYSTEM OPERATIONAL' : 'SYSTEM STANDBY'}</Text>
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
    width: 220,
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
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  stat: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
