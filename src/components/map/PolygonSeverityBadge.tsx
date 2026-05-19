import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HazardSeverity } from '@appTypes/geospatial';
import { COLORS } from '@theme';

interface PolygonSeverityBadgeProps {
  severity: HazardSeverity;
}

export const PolygonSeverityBadge: React.FC<PolygonSeverityBadgeProps> = ({ severity }) => {
  const getBadgeColor = () => {
    switch (severity) {
      case 'Critical': return COLORS.error;
      case 'High': return COLORS.primary;
      case 'Medium': return COLORS.warning;
      case 'Low': return '#D69E2E';
      default: return COLORS.textMuted;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: `${getBadgeColor()}22`, borderColor: getBadgeColor() }]}>
      <Text style={[styles.text, { color: getBadgeColor() }]}>{severity.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
  },
});
