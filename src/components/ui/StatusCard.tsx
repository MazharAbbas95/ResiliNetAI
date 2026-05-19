import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../theme';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  type = 'info',
  style,
}) => {
  const getAccentColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      default: return COLORS.accent;
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getAccentColor() }, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: getAccentColor() }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginVertical: SPACING.xxs,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.size.xxs,
  },
});
