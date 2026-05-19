import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TEXT_VARIANTS } from '@theme';

interface OperationalMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: string;
}

export const OperationalMetric: React.FC<OperationalMetricProps> = ({ 
  label, 
  value, 
  unit, 
  icon,
  color = COLORS.primary 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      <View style={[styles.indicator, { backgroundColor: color + '40' }]}>
        <View style={[styles.indicatorFill, { backgroundColor: color, width: '70%' }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  indicator: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
    borderRadius: 1,
  },
});
