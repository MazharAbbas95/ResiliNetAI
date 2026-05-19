import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { TacticalButton } from '@components/ui/TacticalButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/routes';
import { useNavigationStore } from '../store/navigationStore';
import { useSafeRadiusStore } from '../store/safeRadiusStore';
import { useSocialSignalStore } from '../store/socialSignalStore';
import { useLocationStore } from '../store/locationStore';

const EmergencyScreen = () => {
  const navigation = useNavigation<any>();
  const { setRoute, setNavigationState } = useNavigationStore();
  const { nearestSafePlace } = useSafeRadiusStore();
  const addReport = useSocialSignalStore((state) => state.addReport);
  const currentLocation = useLocationStore((state) => state.currentLocation);

  const handleSOS = () => {
    Alert.alert(
      "BROADCAST SOS",
      "This will send your critical location and emergency status to all nearby responders. Proceed?",
      [
        { text: "CANCEL", style: "cancel" },
        { 
          text: "BROADCAST", 
          style: "destructive",
          onPress: () => {
            if (currentLocation) {
              addReport({
                id: `sos-${Date.now()}`,
                text: "CRITICAL: EMERGENCY SOS BROADCASTED",
                severity: 'critical',
                timestamp: Math.floor(Date.now() / 1000),
                coordinates: {
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude
                },
                locationName: 'My Location',
                source: 'user-sos'
              });
              Alert.alert("SOS SENT", "Your emergency signal has been broadcasted.");
            }
          }
        }
      ]
    );
  };

  const handleEvacuate = () => {
    if (nearestSafePlace) {
      setNavigationState('CALCULATING');
      setRoute({
        distance: '...',
        duration: '...',
        coordinates: [],
        destination: nearestSafePlace.location
      });
      navigation.navigate(ROUTES.MAP_TAB);
    } else {
      navigation.navigate(ROUTES.MAP_TAB);
    }
  };

  const handleShareLocation = async () => {
    if (currentLocation && currentLocation.latitude !== 0) {
      try {
        const message = `ResiliNet AI Tactical Coordinates:\nLatitude: ${currentLocation.latitude}\nLongitude: ${currentLocation.longitude}\nLive Map Link: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
        await Share.share({ message });
      } catch (err: any) {
        Alert.alert("SHARING FAILURE", `Could not launch sharing sheet: ${err.message}`);
      }
    } else {
      Alert.alert(
        "GPS TELEMETRY LIMIT",
        "Awaiting GPS satellite synchronization. Ensure Location Tracking is active in Settings."
      );
    }
  };

  const EMERGENCY_CONTACTS = [
    { name: 'Rescue 1122', number: '1122', icon: 'medical' },
    { name: 'Police Helpline', number: '15', icon: 'shield' },
    { name: 'Disaster Mgt', number: '1700', icon: 'business' },
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>EMERGENCY</Text>
          <Text style={styles.subtitle}>TACTICAL RESPONSE UNIT</Text>
        </View>

        {/* ── ALIGNMENT & READINESS STATUS ── */}
        <GlassCard style={styles.readinessCard} intensity={25}>
          <View style={styles.readinessHeader}>
            <View style={styles.readinessIndicator}>
              <View style={styles.readinessPulse} />
              <Text style={styles.readinessLevel}>TACTICAL ALIGNMENT LEVEL 1: READY</Text>
            </View>
            <Text style={styles.readinessTime}>SECURE LINK</Text>
          </View>
          <View style={styles.resourceList}>
            <View style={styles.resourceItem}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
              <Text style={styles.resourceText}>ResiliNet HQ Station — 0.8 km <Text style={styles.resourceStatusGreen}>[ACTIVE]</Text></Text>
            </View>
            <View style={styles.resourceItem}>
              <Ionicons name="medical" size={14} color={COLORS.primary} />
              <Text style={styles.resourceText}>General Medical Outpost — 1.4 km <Text style={styles.resourceStatusBlue}>[OPERATIONAL]</Text></Text>
            </View>
            <View style={styles.resourceItem}>
              <Ionicons name="business" size={14} color={COLORS.accent} />
              <Text style={styles.resourceText}>Assembly Shelter Area — 2.1 km <Text style={styles.resourceStatusGreen}>[CLEARED / SAFE]</Text></Text>
            </View>
          </View>
        </GlassCard>

        {/* ── CRITICAL ACTIONS ── */}
        <View style={styles.actionGrid}>
           <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.critical }]}
            onPress={handleSOS}
          >
              <Ionicons name="megaphone" size={32} color="#FFF" />
              <Text style={styles.actionLabel}>BROADCAST SOS</Text>
           </TouchableOpacity>
           <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleEvacuate}
            >
              <Ionicons name="navigate" size={32} color="#FFF" />
              <Text style={styles.actionLabel}>EVACUATION ROUTE</Text>
           </TouchableOpacity>
        </View>

        {/* ── SHARE LOCATION TRIGGERS ── */}
        <TacticalButton 
          title="Share My Location" 
          onPress={handleShareLocation} 
          variant="secondary"
          icon={<Ionicons name="share-social" size={18} color="#FFF" />}
          style={{ marginBottom: 25 }}
        />

        {/* ── EMERGENCY CONTACTS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIRECT HOTLINES</Text>
          {EMERGENCY_CONTACTS.map((contact, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${contact.number}`)}>
              <GlassCard style={styles.contactCard}>
                <View style={styles.contactInfo}>
                   <View style={styles.iconCircle}>
                      <Ionicons name={contact.icon as any} size={18} color={COLORS.primary} />
                   </View>
                   <View>
                      <Text style={styles.contactName}>{contact.name.toUpperCase()}</Text>
                      <Text style={styles.contactNumber}>{contact.number}</Text>
                   </View>
                </View>
                <Ionicons name="call" size={20} color={COLORS.success} />
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SAFETY PROTOCOLS ── */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>FLOOD SAFETY PROTOCOLS</Text>
           <GlassCard style={styles.protocolCard}>
              <View style={styles.protocolItem}>
                 <Ionicons name="flash-off" size={20} color={COLORS.warning} />
                 <Text style={styles.protocolText}>Switch off electricity and gas connections immediately.</Text>
              </View>
              <View style={styles.protocolItem}>
                 <Ionicons name="water" size={20} color={COLORS.accent} />
                 <Text style={styles.protocolText}>Do not walk or drive through flowing water.</Text>
              </View>
              <View style={styles.protocolItem}>
                 <Ionicons name="radio" size={20} color={COLORS.primary} />
                 <Text style={styles.protocolText}>Keep a battery-operated radio for emergency updates.</Text>
              </View>
           </GlassCard>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 4,
  },
  readinessCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readinessPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  readinessLevel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.white,
  },
  readinessTime: {
    fontSize: 7.5,
    color: COLORS.textMuted,
    fontWeight: '800',
  },
  resourceList: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resourceText: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  resourceStatusGreen: {
    color: COLORS.success,
    fontWeight: '800',
  },
  resourceStatusBlue: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  actionBtn: {
    flex: 1,
    height: 120,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  contactNumber: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  protocolCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  protocolText: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    lineHeight: 14,
  }
});

export default EmergencyScreen;
