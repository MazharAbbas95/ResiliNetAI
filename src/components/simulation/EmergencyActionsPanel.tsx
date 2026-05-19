import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { COLORS } from '@theme';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';

const ACTIONS = [
  { id: 'rescue', icon: 'airplane-outline', label: 'CALL RESCUE', color: '#00E6FF' },
  { id: 'ambulance', icon: 'medical-outline', label: 'AMBULANCE', color: '#FF3B30' },
  { id: 'fire', icon: 'flame-outline', label: 'FIRE DEPT', color: '#FF9500' },
  { id: 'location', icon: 'location-outline', label: 'SHARE LOCATION', color: '#AF52DE' },
  { id: 'family', icon: 'people-outline', label: 'FAMILY ALERT', color: '#34C759' }
];

export const EmergencyActionsPanel = () => {
  const { selectedScenario, activeHazards, dispatchResponder } = useSimulationDemoStore();
  
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handlePress = (actionId: string) => {
    setActiveAction(actionId);
    setShowModal(true);

    const targetCoordinate = activeHazards.length > 0 
      ? activeHazards[0].center 
      : { latitude: selectedScenario.initialRegion.latitude, longitude: selectedScenario.initialRegion.longitude };

    // Random origin outside the hazard
    const originCoordinate = {
      latitude: targetCoordinate.latitude + (Math.random() > 0.5 ? 0.05 : -0.05),
      longitude: targetCoordinate.longitude + (Math.random() > 0.5 ? 0.05 : -0.05),
    };

    setTimeout(() => {
      // Dispatch the responder logic in store
      dispatchResponder(actionId as any, originCoordinate, targetCoordinate);
      setTimeout(() => {
        setShowModal(false);
        setActiveAction(null);
      }, 1500);
    }, 1000); // Simulate network latency
  };

  const currentAction = ACTIONS.find(a => a.id === activeAction);

  return (
    <>
      <GlassCard style={styles.container} intensity={25}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={14} color="#00E6FF" />
          <Text style={styles.title}>EMERGENCY PROTOCOLS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {ACTIONS.map(action => {
            const isActive = activeAction === action.id;
            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionBtn, 
                  { borderColor: isActive ? action.color : 'rgba(255,255,255,0.1)' },
                  isActive && { backgroundColor: `${action.color}20` }
                ]}
                onPress={() => handlePress(action.id)}
                disabled={activeAction !== null}
              >
                <Ionicons 
                  name={action.icon as any} 
                  size={20} 
                  color={isActive ? action.color : 'rgba(255,255,255,0.5)'} 
                />
                <Text style={[
                  styles.label, 
                  isActive ? { color: action.color } : undefined
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </GlassCard>

      {/* DISPATCH MODAL OVERLAY */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} intensity={40}>
            <View style={[styles.modalIconBox, { borderColor: currentAction?.color }]}>
              <Ionicons name={currentAction?.icon as any} size={32} color={currentAction?.color} />
            </View>
            <Text style={styles.modalTitle}>TRANSMITTING PROTOCOL</Text>
            <Text style={[styles.modalActionText, { color: currentAction?.color }]}>
              {currentAction?.label}
            </Text>
            
            <View style={styles.loadingRow}>
              <ActivityIndicator color={currentAction?.color} size="small" />
              <Text style={styles.loadingText}>Establishing encrypted handshake...</Text>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },
  scroll: {
    padding: 12,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(20,20,20,0.95)'
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
  }
});
