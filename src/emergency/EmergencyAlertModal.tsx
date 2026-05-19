import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { useSafetyStore } from '../store/safetyStore';
import { AlertPriorityEngine } from './AlertPriorityEngine';
import { GlassCard } from '../components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useAnalystStore } from '../store/analystStore';
import { useNavigationStore } from '../store/navigationStore';
import { useShelterStore } from '../store/shelterStore';
import { useLocationStore } from '../store/locationStore';
import { useHazardStore } from '../store/hazardStore';
import { PolygonIntersection } from '../geofence/PolygonIntersection';
import { BlurView } from 'expo-blur';

export const EmergencyAlertModal = () => {
  const { status, isModalOpen, setModalOpen } = useSafetyStore();
  const analystAnalysis = useAnalystStore((state) => state.analysis);
  const { shelters } = useShelterStore();
  const { currentLocation } = useLocationStore();
  const { setNavigationState, setRoute } = useNavigationStore();
  const hazardZones = useHazardStore((state) => state.hazardZones);
  
  const selectedZone = hazardZones.find(z => z.id === status.nearestHazardId);

  const handleSafeRoute = () => {
    if (!currentLocation) return;

    setNavigationState('CALCULATING');

    // Find nearest open shelter
    let nearestShelter = null;
    let minDistance = Infinity;

    shelters.forEach(shelter => {
      if (shelter.operationalStatus === 'Open') {
        const dist = PolygonIntersection.calculateDistance(
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          shelter.location
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestShelter = shelter;
        }
      }
    });

    if (nearestShelter) {
      // Set destination - MapViewDirections will handle the rest
      useNavigationStore.getState().setRoute({
        distance: '...',
        duration: '...',
        coordinates: [],
        destination: (nearestShelter as any).location
      });
      setModalOpen(false);
    }
  };

  const content = AlertPriorityEngine.getContent(status.state);

  if (!isModalOpen) return null;

  return (
    <Modal
      transparent
      visible={isModalOpen}
      animationType="fade"
      onRequestClose={() => setModalOpen(false)}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <GlassCard style={styles.container} intensity={60}>
          <View style={[styles.header, { borderBottomColor: content.tone }]}>
             <View style={styles.titleRow}>
                <Ionicons name={content.icon as any} size={24} color={content.tone} />
                <Text style={[styles.title, { color: content.tone }]}>{content.title}</Text>
             </View>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
             </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>AI CONFIDENCE</Text>
                <Text style={styles.infoValue}>
                  {selectedZone?.confidenceScore ? Math.round(selectedZone.confidenceScore * 100) : 0}%
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DISTANCE</Text>
                <Text style={styles.infoValue}>
                  {status.distanceToHazard ? `${Math.round(status.distanceToHazard)}m` : 'INSIDE'}
                </Text>
              </View>
            </View>

            <View style={styles.intelligenceCard}>
               <Text style={styles.cardTitle}>ANALYST REASONING</Text>
               <Text style={styles.cardText}>
                 {analystAnalysis?.hazardAssessment.floodRisk || 'Monitoring environmental instability.'} 
                 Evacuation routes are currently being prioritized by autonomous dispatch agents.
               </Text>
            </View>

            <View style={styles.guidanceSection}>
               <Text style={styles.sectionTitle}>RECOMMENDED ACTION</Text>
               <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationText}>{content.recommendation}</Text>
               </View>
            </View>

            <View style={styles.actionGrid}>
               <TouchableOpacity 
                 style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                 onPress={handleSafeRoute}
               >
                  <Ionicons name="navigate-outline" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>SAFE ROUTE</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="business-outline" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>SHELTERS</Text>
               </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.dismissBtn} 
              onPress={() => setModalOpen(false)}
            >
               <Text style={styles.dismissText}>DISMISS WARNING</Text>
            </TouchableOpacity>
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  intelligenceCard: {
    backgroundColor: 'rgba(251, 97, 56, 0.05)',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 97, 56, 0.1)',
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    fontWeight: '500',
  },
  guidanceSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 1,
  },
  recommendationBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  recommendationText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  dismissText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
