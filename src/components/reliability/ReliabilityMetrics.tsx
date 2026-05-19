import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@theme';

interface Props {
  validationFailures: number;
  hallucinationsBlocked: number;
  systemStability: number;
}

export const ReliabilityMetrics: React.FC<Props> = ({ validationFailures, hallucinationsBlocked, systemStability }) => {
  return (
    <View style={styles.container}>
      <View style={styles.metric}>
        <Text style={styles.label}>STABILITY</Text>
        <Text style={[styles.value, { color: COLORS.success }]}>{systemStability}%</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <Text style={styles.label}>REJECTED</Text>
        <Text style={[styles.value, { color: COLORS.warning }]}>{validationFailures}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <Text style={styles.label}>HALLUCINATIONS</Text>
        <Text style={[styles.value, { color: COLORS.critical }]}>{hallucinationsBlocked}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'center',
  },
});
