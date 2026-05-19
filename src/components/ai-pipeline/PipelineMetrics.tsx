import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@theme';

interface Props {
  totalLatency: number;
  hazards: number;
  isActive: boolean;
}

export const PipelineMetrics: React.FC<Props> = ({ totalLatency, hazards, isActive }) => {
  return (
    <View style={styles.container}>
      <View style={styles.metric}>
        <Text style={styles.label}>AVG LATENCY</Text>
        <Text style={styles.value}>{totalLatency}<Text style={styles.unit}>ms</Text></Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <Text style={styles.label}>ORCHESTRATIONS</Text>
        <Text style={styles.value}>{hazards}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <Text style={styles.label}>STATUS</Text>
        <Text style={[styles.value, { color: isActive ? COLORS.primary : COLORS.success }]}>
          {isActive ? 'ACTIVE' : 'READY'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  unit: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
});
