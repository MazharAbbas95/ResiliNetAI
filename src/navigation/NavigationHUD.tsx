import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@theme';
import { useNavigationStore } from '../store/navigationStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useSafetyStore } from '../store/safetyStore';
import { useAnalystStore } from '../store/analystStore';
import { RouteIntersectionAnalyzer } from './hazard/RouteIntersectionAnalyzer';
import { RouteSafetyScore } from './hazard/RouteSafetyScore';

export const NavigationHUD = () => {
  const { routeInfo, state, clearRoute } = useNavigationStore();
  const { state: safetyState } = useSafetyStore((store) => store.status);
  const { analysis } = useAnalystStore();

  const safetyInfo = React.useMemo(() => {
    if (!routeInfo || !analysis) return { label: 'VERIFYING', color: COLORS.primary, avoided: 0 };
    const result = RouteIntersectionAnalyzer.analyze(routeInfo.coordinates, analysis.hazardZones);
    const score = RouteSafetyScore.calculate(result);
    
    // Count "avoided" as hazards nearby but not intersecting
    const avoidedCount = analysis.hazardZones.length - result.intersectingZones.length;

    return {
      label: RouteSafetyScore.getLabel(score),
      color: RouteSafetyScore.getColor(score),
      avoided: avoidedCount,
      confidence: analysis.confidenceScore
    };
  }, [routeInfo, analysis]);

  if (state === 'IDLE') return null;

  return (
    <View style={styles.wrapper}>
      <GlassCard style={styles.container} intensity={50}>
        <View style={styles.mainInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="navigate" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.statusLabel, { color: safetyInfo.color }]}>
              {state === 'CALCULATING' ? 'CALCULATING SAFE ROUTE...' : `ROUTE: ${safetyInfo.label}`}
            </Text>
            {routeInfo && (
              <View style={styles.metricsRow}>
                <Text style={styles.metricText}>{routeInfo.duration}</Text>
                <View style={styles.dot} />
                <Text style={styles.metricText}>{routeInfo.distance}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
           <View style={styles.safetyBadge}>
             <View style={[styles.safetyDot, { backgroundColor: safetyInfo.color }]} />
             <Text style={styles.safetyText}>HAZARD AVOIDANCE ACTIVE • {safetyInfo.avoided} AVOIDED</Text>
           </View>
           <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>AI CONFIDENCE: {Math.round((safetyInfo as any).confidence * 100)}%</Text>
           </View>
           <TouchableOpacity style={styles.exitBtn} onPress={clearRoute}>
             <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
           </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 55, // Positioned below the main header
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 100,
  },
  container: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metricText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  confidenceContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  confidenceText: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  exitBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
