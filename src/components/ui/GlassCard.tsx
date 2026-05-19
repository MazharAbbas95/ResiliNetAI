import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS } from '@theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderOpacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  intensity = 40,
  tint = 'dark',
  borderOpacity = 0.1
}) => {
  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill}>
          <View style={[styles.border, { borderColor: `rgba(255, 255, 255, ${borderOpacity})` }]} />
        </BlurView>
      ) : (
        <View style={[styles.androidFallback, { backgroundColor: COLORS.card }]}>
           <View style={[styles.border, { borderColor: `rgba(255, 255, 255, ${borderOpacity})` }]} />
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.card,
  },
  content: {
    padding: 16,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  androidFallback: {
    ...StyleSheet.absoluteFillObject,
  }
});
