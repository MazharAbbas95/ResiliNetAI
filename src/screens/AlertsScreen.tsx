import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, TEXT_VARIANTS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useSocialSignalStore } from '@store/socialSignalStore';
import { useAlertStore } from '@store/alertStore';

const AlertsScreen = () => {
  const [activeTab, setActiveTab] = useState<'verified' | 'raw'>('verified');
  const verifiedAlerts = useAlertStore((state) => state.activeAlerts);
  const rawSignals = useSocialSignalStore((state) => state.reports);

  const displayData = activeTab === 'verified' ? verifiedAlerts : rawSignals;

  const renderAlertItem = ({ item }: { item: any }) => {
    const isVerified = activeTab === 'verified';
    
    // Normalize properties
    const severity = (item.severity || 'medium').toLowerCase();
    const timestamp = isVerified ? item.sentAt : item.timestamp * 1000;
    const text = isVerified ? item.message : item.text;
    const region = isVerified ? item.targetRegion : (item.locationName || 'Lahore Region');
    const isSimulated = !isVerified && item.source === 'mock-social';
    const badgeText = isVerified ? 'AGENCY VERIFIED' : (isSimulated ? 'SIMULATED SIGNAL' : 'RAW SIGNAL');
    const badgeColor = isVerified ? COLORS.success : (isSimulated ? '#FF8C00' : COLORS.warning);
    const badgeIcon = isVerified ? "shield-checkmark" : (isSimulated ? "alert-circle-outline" : "warning-outline");

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.alertItem}>
        <GlassCard style={styles.alertCard} borderOpacity={severity === 'critical' ? 0.3 : 0.1}>
          <View style={styles.alertHeader}>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) + '20', borderColor: getSeverityColor(severity) }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(severity) }]}>
                {severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.timestamp}>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          
          <Text style={styles.alertText}>{text}</Text>
          
          <View style={styles.alertFooter}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={COLORS.primary} />
              <Text style={styles.locationText}>{region}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name={badgeIcon} size={12} color={badgeColor} />
              <Text style={[styles.verifiedText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return COLORS.critical;
      case 'high':     return COLORS.primary;
      case 'medium':   return COLORS.warning;
      case 'low':      return COLORS.success;
      default:         return COLORS.textMuted;
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>EMERGENCY INFOCENTER</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayData.length} ACTIVE</Text>
        </View>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'verified' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('verified')}
        >
          <Ionicons name="shield-checkmark" size={14} color={activeTab === 'verified' ? COLORS.white : COLORS.textDim} />
          <Text style={[styles.segmentText, activeTab === 'verified' && styles.segmentTextActive]}>
            VERIFIED ({verifiedAlerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeTab === 'raw' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('raw')}
        >
          <Ionicons name="radio" size={14} color={activeTab === 'raw' ? COLORS.white : COLORS.textDim} />
          <Text style={[styles.segmentText, activeTab === 'raw' && styles.segmentTextActive]}>
            RAW FEEDS ({rawSignals.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyText}>NO ACTIVE THREATS IN THIS SECTOR</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(23, 23, 23, 0.6)',
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDim,
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
    gap: 12,
    paddingBottom: 120,
  },
  alertItem: {
    width: '100%',
  },
  alertCard: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textDim,
    fontWeight: '700',
  },
  alertText: {
    fontSize: 13,
    color: COLORS.white,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 20,
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default AlertsScreen;
