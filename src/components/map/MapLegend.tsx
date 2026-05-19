import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';

export const MapLegend = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEGEND</Text>
      
      <View style={styles.item}>
        <View style={[styles.box, { backgroundColor: 'rgba(155, 0, 0, 0.5)', borderColor: COLORS.error, borderWidth: 1 }]} />
        <Text style={styles.label}>Critical Risk</Text>
      </View>
      
      <View style={styles.item}>
        <View style={[styles.box, { backgroundColor: 'rgba(229, 62, 62, 0.4)', borderColor: COLORS.primary, borderWidth: 1 }]} />
        <Text style={styles.label}>High Risk</Text>
      </View>

      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
        <Text style={styles.label}>Open Shelter</Text>
      </View>

      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
        <Text style={styles.label}>Full Shelter</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(21, 25, 30, 0.9)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  box: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  label: {
    color: COLORS.text,
    fontSize: 10,
  },
});
