import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { COLORS, SPACING, TEXT_VARIANTS, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { Ionicons } from '@expo/vector-icons';

export const DeveloperScreen = () => {
  const { logs, metrics } = useOrchestrationStore();

  const renderLog = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={[styles.logAgent, { color: item.status === 'error' ? COLORS.critical : COLORS.primary }]}>
          [{item.agent.toUpperCase()}]
        </Text>
        <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.logMessage}>{item.message}</Text>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DEV OBSERVABILITY</Text>
          <Text style={styles.subtitle}>REALTIME ENGINE TRACES</Text>
        </View>

        <View style={styles.metricsContainer}>
          <GlassCard style={styles.metricCard} intensity={20}>
            <Text style={styles.metricLabel}>AVG LATENCY</Text>
            <Text style={styles.metricValue}>{metrics.totalLatencyMs}ms</Text>
          </GlassCard>
          <GlassCard style={styles.metricCard} intensity={20}>
            <Text style={styles.metricLabel}>INTEL PROCESSED</Text>
            <Text style={styles.metricValue}>{metrics.hazardsGenerated}</Text>
          </GlassCard>
        </View>

        <View style={styles.logsWrapper}>
          <Text style={styles.sectionTitle}>SYSTEM LOG STREAM</Text>
          <FlatList
            data={logs}
            renderItem={renderLog}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.logsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  logsWrapper: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  logsList: {
    paddingBottom: 100,
  },
  logItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 122, 255, 0.3)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logAgent: {
    fontSize: 9,
    fontWeight: '900',
  },
  logTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
  },
  logMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  }
});

export default DeveloperScreen;
