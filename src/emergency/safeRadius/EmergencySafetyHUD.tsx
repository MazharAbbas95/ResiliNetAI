import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRadiusStore } from '../../store/safeRadiusStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { COLORS, SPACING } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationStore } from '../../store/navigationStore';

export const EmergencySafetyHUD = () => {
  const { nearestSafePlace } = useSafeRadiusStore();
  const { setRoute, setNavigationState, state: navState } = useNavigationStore();

  if (!nearestSafePlace || navState !== 'IDLE') return null;

  const handleQuickNav = () => {
    setNavigationState('CALCULATING');
    setRoute({
      distance: '...',
      duration: '...',
      coordinates: [],
      destination: nearestSafePlace.location
    });
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={50}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>NEAREST SAFE SUPPORT</Text>
          <Text style={styles.placeName}>{nearestSafePlace.name}</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={handleQuickNav}>
          <Ionicons name="navigate" size={20} color="#FFF" />
          <Text style={styles.navBtnText}>EVACUATE</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 90,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    gap: 12,
    backgroundColor: 'rgba(25, 28, 32, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  }
});
