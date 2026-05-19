import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '@store/locationStore';
import { useSettingsStore } from '@store/settingsStore';
import { useOrchestrationStore } from '@store/orchestrationStore';
import { useHazardStore } from '@store/hazardStore';
import { useInfraHealthStore } from '@store/infraHealthStore';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { sharedMemory } from '../agents/core/AgentMemory';

export const SettingsScreen = () => {
  const { isAutoFollowEnabled, toggleAutoFollow } = useLocationStore();
  const [notificationPerm, setNotificationPerm] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [gpsPerm, setGpsPerm] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const {
    backendConnected,
    firebaseSynced,
    backendLatencyMs,
    weatherApiLatencyMs,
    firebaseSyncLatencyMs,
    routingLatencyMs
  } = useInfraHealthStore();

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const notifyRes = await Notifications.getPermissionsAsync();
        setNotificationPerm(notifyRes.status);
        
        const gpsRes = await Location.getForegroundPermissionsAsync();
        setGpsPerm(gpsRes.status);
      } catch (e) {
        console.warn('[SettingsScreen] Failed to query native permissions:', e);
      }
    };
    checkPermissions();
  }, []);
  const {
    isCriticalResponseActive,
    isEmergencyAlertActive,
    isLiveGpsTrackingActive,
    isIntelligentAutoRefreshActive,
    isBackgroundSyncActive,
    toggleCriticalResponse,
    toggleEmergencyAlert,
    toggleLiveGpsTracking,
    toggleIntelligentAutoRefresh,
    toggleBackgroundSync,
    resetSettings
  } = useSettingsStore();

  const handleResetData = () => {
    Alert.alert(
      "CONFIRM SYSTEM RESET",
      "This action will completely wipe all real-time orchestration tasks, verification cache, shared memory state, and active hazard coordinates. This action is irreversible.",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "WIPE ALL DATA",
          style: "destructive",
          onPress: () => {
            try {
              // 1. Reset pipeline steps and loop blockers
              useOrchestrationStore.getState().resetPipeline();
              
              // 2. Clear hazard cache
              useHazardStore.getState().setHazardZones([]);

              // 3. Purge shared agent memories, negotiations, and alerts
              sharedMemory.clear();

              // 4. Reset user settings back to stable defaults
              resetSettings();

              Alert.alert(
                "SYSTEM PURGED",
                "All intelligence stores, debate registries, and geospatial overlays have been successfully stabilized."
              );
            } catch (err: any) {
              Alert.alert("RESET FAILURE", `Purge cycle encountered errors: ${err.message || err}`);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>SYSTEM SETTINGS</Text>
        <Text style={styles.subtitle}>INFRASTRUCTURE & CONFIGURATION</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CORE PREFERENCES</Text>
          <GlassCard style={styles.card} intensity={20}>
            {/* Auto-Follow Location */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="navigate" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Auto-Follow Location</Text>
                  <Text style={styles.rowSubtitle}>Keep map centered on user</Text>
                </View>
              </View>
              <Switch 
                value={isAutoFollowEnabled} 
                onValueChange={toggleAutoFollow}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>

            <View style={styles.divider} />

            {/* Critical Response Mode */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="flash" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Critical Response Mode</Text>
                  <Text style={styles.rowSubtitle}>High-frequency agent coordination</Text>
                </View>
              </View>
              <Switch 
                value={isCriticalResponseActive} 
                onValueChange={toggleCriticalResponse}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>

            <View style={styles.divider} />

            {/* Emergency Alerts */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Emergency Alerts</Text>
                  <Text style={styles.rowSubtitle}>Realtime push notifications</Text>
                </View>
              </View>
              <Switch 
                value={isEmergencyAlertActive} 
                onValueChange={toggleEmergencyAlert}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>

            <View style={styles.divider} />

            {/* Live GPS Tracking */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="location" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Live GPS Tracking</Text>
                  <Text style={styles.rowSubtitle}>Continuous geospatial updates</Text>
                </View>
              </View>
              <Switch 
                value={isLiveGpsTrackingActive} 
                onValueChange={toggleLiveGpsTracking}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>

            <View style={styles.divider} />

            {/* Intelligent Auto Refresh */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="refresh-circle" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Intelligent Auto Refresh</Text>
                  <Text style={styles.rowSubtitle}>Periodic telemetry sync</Text>
                </View>
              </View>
              <Switch 
                value={isIntelligentAutoRefreshActive} 
                onValueChange={toggleIntelligentAutoRefresh}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>

            <View style={styles.divider} />

            {/* Background Synchronization */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="cloud-upload" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.rowTitle}>Background Sync</Text>
                  <Text style={styles.rowSubtitle}>Secure shared memory upload</Text>
                </View>
              </View>
              <Switch 
                value={isBackgroundSyncActive} 
                onValueChange={toggleBackgroundSync}
                trackColor={{ false: '#333', true: COLORS.primary }}
              />
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>API & CONNECTION STATUS</Text>
          <GlassCard style={styles.card} intensity={20}>
            {/* Firebase Cloud Sync */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>FIREBASE CLOUD STATUS</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, { backgroundColor: firebaseSynced ? COLORS.success : COLORS.critical }]} />
                <Text style={styles.statusText}>{firebaseSynced ? 'ONLINE' : 'OFFLINE'}</Text>
              </View>
            </View>
            
            {/* Analyst Intelligence API */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>ANALYST INTELLIGENCE API</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, { backgroundColor: backendConnected ? COLORS.success : COLORS.critical }]} />
                <Text style={styles.statusText}>{backendConnected ? 'ONLINE' : 'DEGRADED'}</Text>
              </View>
            </View>

            {/* Weather Telemetry Front */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>WEATHER TELEMETRY FRONT</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, { backgroundColor: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ? COLORS.success : COLORS.warning }]} />
                <Text style={styles.statusText}>{process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ? 'ONLINE' : 'DEGRADED (SANDBOX)'}</Text>
              </View>
            </View>

            {/* Live GPS Access */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>TACTICAL GPS PERMISSIONS</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, { backgroundColor: gpsPerm === 'granted' ? COLORS.success : COLORS.critical }]} />
                <Text style={styles.statusText}>{gpsPerm === 'granted' ? 'VERIFIED' : gpsPerm === 'denied' ? 'DENIED' : 'PENDING'}</Text>
              </View>
            </View>

            {/* Notification Permissions */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>EMERGENCY ALERT CHANNELS</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, { backgroundColor: notificationPerm === 'granted' ? COLORS.success : COLORS.critical }]} />
                <Text style={styles.statusText}>{notificationPerm === 'granted' ? 'ONLINE' : notificationPerm === 'denied' ? 'OFFLINE' : 'PENDING'}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Live System Performance Panel */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LIVE SYSTEM PERFORMANCE (REAL TELEMETRY)</Text>
          <GlassCard style={styles.card} intensity={20}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>BACKEND EXPRESS API LATENCY</Text>
              <Text style={[styles.statusText, { color: COLORS.accent }]}>{backendLatencyMs}ms</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>WEATHER TELEMETRY RESPONSE</Text>
              <Text style={[styles.statusText, { color: COLORS.accent }]}>{weatherApiLatencyMs}ms</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>FIREBASE SYNCING DELAY</Text>
              <Text style={[styles.statusText, { color: COLORS.accent }]}>{firebaseSyncLatencyMs}ms</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>CORRIDOR ROUTING DURATION</Text>
              <Text style={[styles.statusText, { color: COLORS.accent }]}>{routingLatencyMs}ms</Text>
            </View>
          </GlassCard>
        </View>

        <TouchableOpacity style={styles.dangerZone} onPress={handleResetData}>
          <Text style={styles.dangerText}>RESET ALL INTELLIGENCE DATA</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  rowSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
  dangerZone: {
    marginTop: 10,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
  },
  dangerText: {
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  }
});

export default SettingsScreen;
