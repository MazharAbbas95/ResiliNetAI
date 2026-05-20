import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axiosClient from '@services/api/axiosClient';
import API_BASE_URL from '@config/api';
import { COLORS, SPACING, RADIUS } from '@theme';

interface HealthState {
  status: 'online' | 'offline' | 'error';
  success: boolean;
  latencyMs: number | null;
  message: string;
}

export const FrontendHealthCheck = () => {
  const [health, setHealth] = useState<HealthState>({
    status: 'offline',
    success: false,
    latencyMs: null,
    message: 'Initializing health probe...',
  });
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await axiosClient.get('/health');
      const latencyMs = Date.now() - startTime;

      setHealth({
        status: response?.data?.success ? 'online' : 'error',
        success: response?.data?.success === true,
        latencyMs,
        message: response?.data?.status || 'Connected',
      });
    } catch (error: any) {
      setHealth({
        status: 'error',
        success: false,
        latencyMs: Date.now() - startTime,
        message: error.message || 'Health probe failed',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = health.status === 'online' ? COLORS.success : COLORS.error;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: statusColor }]}>        
        <View style={styles.header}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.title}>Backend Connectivity</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>API URL</Text>
          <Text style={styles.value}>{API_BASE_URL}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: statusColor }]}>
            {loading ? 'Checking…' : health.success ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Latency</Text>
          <Text style={styles.value}>
            {loading ? '…' : health.latencyMs !== null ? `${health.latencyMs} ms` : 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Message</Text>
          <Text style={styles.value}>{health.message}</Text>
        </View>

        <View style={styles.loadingRow}>
          {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : null}
          <Text style={styles.refreshText}>Auto-refresh every 10 seconds</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.success,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  row: {
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: 10,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  loadingRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshText: {
    color: COLORS.textDim,
    fontSize: 12,
  },
});

export default FrontendHealthCheck;
