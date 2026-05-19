import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '@theme';
import { GlassCard } from '../ui/GlassCard';
import { useHealthStore, HealthStatus } from '../../reliability/AgentHealthMonitor';
import { Ionicons } from '@expo/vector-icons';

export const AgentHealthCard = () => {
  const { agents } = useHealthStore();

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return COLORS.success;
      case 'processing': return COLORS.primary;
      case 'delayed': return COLORS.warning;
      case 'failed':  return COLORS.critical;
      default:        return COLORS.textMuted;
    }
  };

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.title}>AGENT OPERATIONAL STATUS</Text>
      <View style={styles.grid}>
        {Object.values(agents).map((agent) => (
          <View key={agent.id} style={styles.agentItem}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.status) }]} />
            <Text style={styles.agentName}>{agent.name.toUpperCase()}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(agent.status) }]}>
              {agent.status.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 15,
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  agentName: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.white,
    flex: 1,
  },
  statusText: {
    fontSize: 7,
    fontWeight: '900',
  },
});
