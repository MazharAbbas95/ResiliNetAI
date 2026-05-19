import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { useSimulationDemoStore } from '../store/simulationDemoStore';
import { Ionicons } from '@expo/vector-icons';
import { SimulationMap } from '../components/simulation/SimulationMap';
import { EmergencyActionsPanel } from '../components/simulation/EmergencyActionsPanel';
import { PredictiveTimelinePanel } from '../components/simulation/PredictiveTimelinePanel';

export const SimulationDemoScreen = () => {
  const { 
    isActive, 
    selectedScenario, 
    scenarios, 
    steps, 
    logs, 
    activeAlerts,
    simulationProgress, 
    selectScenario, 
    runSimulation, 
    stopSimulation,
    resetSimulation
  } = useSimulationDemoStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])
    ).start();
    return () => { stopSimulation(); };
  }, []);

  const getNodeColor = (state: 'idle' | 'processing' | 'completed' | 'error') => {
    if (state === 'completed') return '#34C759';
    if (state === 'error') return '#FF3B30';
    if (state === 'processing') return '#00E6FF';
    return 'rgba(255, 255, 255, 0.15)';
  };

  const activeAgents = steps.filter(s => s.status === 'processing').length;
  const completedAgents = steps.filter(s => s.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* =========================================
          UPPER 45%: LIVE MAP (NO OVERLAYS)
          ========================================= */}
      <View style={styles.mapContainer}>
        <SimulationMap />
      </View>

      {/* =========================================
          LOWER 55%: EMERGENCY WORKFLOW & CONTROLS
          ========================================= */}
      <View style={styles.bottomContainer}>
        
        {/* TOP HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>RESILINET COMMAND</Text>
            <View style={styles.badge}>
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }], backgroundColor: isActive ? '#FF9500' : '#34C759' }]} />
              <Text style={[styles.badgeText, { color: isActive ? '#FF9500' : '#34C759' }]}>
                {isActive ? 'SIMULATION ACTIVE' : 'SYSTEM READY'}
              </Text>
            </View>
          </View>
          <View style={styles.integrityBox}>
            <Ionicons name="shield-checkmark" size={10} color="#34C759" />
            <Text style={styles.integrityText}>INTEGRITY: 100%</Text>
          </View>
        </View>

        {/* CONTROL BAR */}
        <View style={styles.controlBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenarioScroll}>
            {scenarios.map(scenario => (
              <TouchableOpacity 
                key={scenario.id} 
                style={[styles.scenarioBtn, selectedScenario.id === scenario.id && styles.scenarioBtnActive]}
                onPress={() => !isActive && selectScenario(scenario.id)}
                disabled={isActive}
              >
                <Text style={[styles.scenarioBtnText, selectedScenario.id === scenario.id && { color: '#00E6FF' }]}>
                  {scenario.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.controlButtons}>
            {isActive ? (
              <TouchableOpacity style={styles.actionBtnPause} onPress={stopSimulation}>
                <Ionicons name="pause" size={12} color="#FF9500" />
                <Text style={[styles.actionBtnText, { color: '#FF9500' }]}>PAUSE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionBtnPlay} onPress={runSimulation}>
                <Ionicons name="play" size={12} color="#FFF" />
                <Text style={styles.actionBtnText}>START</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtnReset} onPress={resetSimulation}>
              <Ionicons name="refresh" size={12} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SCROLLABLE WORKFLOW */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* MOCK ALERTS TOASTS */}
          {activeAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {activeAlerts.map(alert => (
                <View key={alert.id} style={styles.alertToast}>
                  <Ionicons name="warning" size={14} color="#FF9500" />
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
              ))}
            </View>
          )}

          <EmergencyActionsPanel />
          <PredictiveTimelinePanel />

          <View style={styles.sectionHeadingRow}>
            <Ionicons name="terminal-outline" size={14} color="#FF9500" />
            <Text style={styles.sectionTitle}>LIVE TERMINAL FEED</Text>
          </View>

          <View style={styles.terminalContainer}>
            <ScrollView style={{ height: 160 }} showsVerticalScrollIndicator={false}>
              {logs.length === 0 ? (
                <Text style={styles.emptyText}>[SYSTEM] Awaiting scenario initialization...</Text>
              ) : (
                [...logs].reverse().map(log => {
                  const isError = log.status === 'error';
                  const isWarn = log.status === 'warning';
                  const color = isError ? '#FF3B30' : isWarn ? '#FF9500' : '#00E6FF';
                  return (
                    <View key={log.id} style={{ marginBottom: 6, flexDirection: 'row' }}>
                      <Text style={[styles.termTime, { color: 'rgba(255,255,255,0.4)' }]}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                      </Text>
                      <Text style={[styles.termAgent, { color: color }]}> [{log.agent}]</Text>
                      <Text style={[styles.termMessage, { color: isError ? '#FF3B30' : 'rgba(255,255,255,0.8)' }]}> {log.message}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={styles.sectionHeadingRow}>
            <Ionicons name="git-branch-outline" size={14} color="#34C759" />
            <Text style={styles.sectionTitle}>AI AGENT ORCHESTRATION</Text>
          </View>

          <View style={styles.nodesContainer}>
            {steps.map((step, index) => {
              const color = getNodeColor(step.status);
              return (
                <React.Fragment key={step.id}>
                  <View style={[styles.nodeCard, step.status === 'processing' ? styles.nodeCardActive : {}]}>
                    <View style={styles.nodeHeader}>
                      <View style={styles.nodeTitleRow}>
                        <View style={[styles.nodeDot, { backgroundColor: color }]} />
                        <Text style={[styles.nodeName, { color: step.status === 'idle' ? 'rgba(255,255,255,0.4)' : '#FFF' }]}>{step.name}</Text>
                      </View>
                      {step.confidence && <Text style={styles.nodeConfidence}>{step.confidence}%</Text>}
                    </View>
                    {step.reasoning && <Text style={styles.nodeReasoning}>{step.reasoning}</Text>}
                  </View>
                  {index < steps.length - 1 && (
                    <View style={styles.connectorContainer}>
                      <View style={[styles.connectorLine, { backgroundColor: step.status === 'completed' ? '#34C759' : 'rgba(255,255,255,0.1)' }]} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapContainer: { height: '45%', width: '100%', backgroundColor: '#111' },
  bottomContainer: { flex: 1, backgroundColor: '#050505', borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: 'rgba(10,10,10,0.8)' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 13, fontWeight: '900', color: COLORS.white, letterSpacing: 1.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  integrityBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  integrityText: { fontSize: 8, fontWeight: '900', color: '#34C759', letterSpacing: 1 },
  controlBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,10,0.8)' },
  scenarioScroll: { flex: 1, marginRight: 8 },
  scenarioBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 6 },
  scenarioBtnActive: { backgroundColor: 'rgba(0, 230, 255, 0.1)', borderColor: '#00E6FF', borderWidth: 1 },
  scenarioBtnText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  controlButtons: { flexDirection: 'row', gap: 6 },
  actionBtnPlay: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52, 199, 89, 0.2)', borderWidth: 1, borderColor: '#34C759', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  actionBtnPause: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 149, 0, 0.2)', borderWidth: 1, borderColor: '#FF9500', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  actionBtnReset: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  actionBtnText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  scrollContent: { padding: 16 },
  alertsContainer: { marginBottom: 16, gap: 6 },
  alertToast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(10, 10, 10, 0.9)', borderLeftWidth: 3, borderLeftColor: '#FF9500', padding: 10, borderRadius: 6 },
  alertText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  terminalContainer: { backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 12, marginBottom: 16 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  termTime: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  termAgent: { fontSize: 9, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  termMessage: { fontSize: 9, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  nodesContainer: { paddingLeft: 4, paddingRight: 4 },
  nodeCard: { padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  nodeCardActive: { borderColor: 'rgba(0, 230, 255, 0.4)', backgroundColor: 'rgba(0, 230, 255, 0.05)' },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nodeDot: { width: 8, height: 8, borderRadius: 4 },
  nodeName: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  nodeConfidence: { fontSize: 9, fontWeight: '900', color: '#00E6FF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  nodeReasoning: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 6, marginLeft: 16, lineHeight: 12 },
  connectorContainer: { height: 16, marginLeft: 15 },
  connectorLine: { width: 2, height: '100%' }
});

export default SimulationDemoScreen;
