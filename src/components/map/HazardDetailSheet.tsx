import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { GlassCard } from '../ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { HazardZone } from '../../services/analystService';

interface Props {
  zone: HazardZone;
  onClose: () => void;
}

export const HazardDetailSheet: React.FC<Props> = ({ zone, onClose }) => {
  return (
    <GlassCard style={styles.container} intensity={60}>
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(zone.severity) }]}>
            <Text style={styles.severityText}>{zone.severity.toUpperCase()}</Text>
          </View>
          <Text style={styles.zoneId}>ID: {zone.zoneId}</Text>
        </View>

        <Text style={styles.hazardTitle}>TACTICAL FLOOD ZONE</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>AI CONFIDENCE</Text>
            <Text style={styles.statValue}>{zone.confidence}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>RISK RADIUS</Text>
            <Text style={styles.statValue}>{zone.radius}m</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>STATUS</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.intelligenceCard}>
          <Text style={styles.cardTitle}>ANALYST INTELLIGENCE</Text>
          <Text style={styles.cardText}>
            High concentration of social signals validated by environmental sensors. 
            Terrain vulnerability assessment indicates rapid water accumulation probability.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="navigate-outline" size={18} color="#FFF" />
            <Text style={styles.actionText}>SAFE ROUTE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Ionicons name="business-outline" size={18} color="#FFF" />
            <Text style={styles.actionText}>SHELTERS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GlassCard>
  );
};

const getSeverityColor = (s: string) => {
  switch (s) {
    case 'critical': return COLORS.critical;
    case 'high':     return COLORS.primary;
    case 'medium':   return COLORS.warning;
    default:         return COLORS.success;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    maxHeight: 350,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: -5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  zoneId: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
  },
  hazardTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  intelligenceCard: {
    backgroundColor: 'rgba(251, 97, 56, 0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 97, 56, 0.1)',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
