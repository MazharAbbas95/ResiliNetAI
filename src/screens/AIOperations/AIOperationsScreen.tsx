import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { agentEventBus } from '../../agents/core/AgentEvents';
import { agentManager } from '../../agents/core/AgentManager';
import { sharedMemory } from '../../agents/core/AgentMemory';
import { AgentEventPayload } from '../../agents/core/AgentTypes';
import { useOrchestrationStore } from '../../store/orchestrationStore';
import { useInfraHealthStore } from '../../store/infraHealthStore';
import { useHazardStore } from '../../store/hazardStore';
import { useWeatherStore } from '../../store/weatherStore';

interface AgentConsoleStatus {
  name: string;
  status: 'IDLE' | 'ACTIVE' | 'VERIFYING' | 'NEGOTIATING' | 'RETRYING' | 'ESCALATING' | 'BLOCKED' | 'RECOVERY_MODE';
  confidenceContribution: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  task: string;
}

const AIOperationsScreen = () => {
  const { loopBlockingMetrics, steps, metrics: orchestrationStoreMetrics } = useOrchestrationStore();
  const infraHealth = useInfraHealthStore();
  const hazardStore = useHazardStore();
  const weatherData = useWeatherStore((state) => state.weatherData);

  const [events, setEvents] = useState<AgentEventPayload[]>([]);
  const [agents, setAgents] = useState<AgentConsoleStatus[]>([
    { name: 'SentinelAgent', status: 'IDLE', confidenceContribution: 0.45, priority: 'LOW', task: 'Idle - Scanning telemetry streams' },
    { name: 'VerificationAgent', status: 'IDLE', confidenceContribution: 0.75, priority: 'MEDIUM', task: 'Idle - Waiting' },
    { name: 'AnalystAgent', status: 'IDLE', confidenceContribution: 0.85, priority: 'HIGH', task: 'Idle - Dormant' },
    { name: 'RoutingAgent', status: 'IDLE', confidenceContribution: 0.90, priority: 'HIGH', task: 'Idle - Calculating alternative routes' },
    { name: 'AlertAgent', status: 'IDLE', confidenceContribution: 0.95, priority: 'CRITICAL', task: 'Idle - Broadcaster ready' },
    { name: 'PredictiveAgent', status: 'IDLE', confidenceContribution: 0.80, priority: 'HIGH', task: 'Idle - Waiting' }
  ]);
  const [confidenceHistory, setConfidenceHistory] = useState<number[]>([0.45, 0.58, 0.74, 0.88]);
  const [isRecoveryActive, setIsRecoveryActive] = useState<boolean>(false);
  const [activeDebates, setActiveDebates] = useState<any[]>([]);

  // Scale value for pulsing glow animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial load from Shared Memory to preserve historical data on mount
    const initialEvents = sharedMemory.getState().eventHistory || [];
    setEvents(initialEvents.slice(0, 25));

    const initialDebates = sharedMemory.negotiationMemory.getAllActiveNegotiations() || [];
    setActiveDebates(initialDebates);

    const initialRecovery = agentManager.getIsGlobalRecoveryMode();
    setIsRecoveryActive(initialRecovery);

    // Initial confidence history calculation
    const confValues = initialEvents
      .filter(evt => evt.payload?.confidence !== undefined || evt.payload?.response?.confidence !== undefined)
      .map(evt => evt.payload?.confidence !== undefined ? evt.payload.confidence : evt.payload.response.confidence)
      .reverse()
      .slice(-8);
    if (confValues.length > 0) {
      setConfidenceHistory(confValues);
    }

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        })
      ])
    ).start();

    // Subscribe to entire event bus stream
    const unsubscribe = agentEventBus.subscribeAll((event: AgentEventPayload) => {
      // 1. Log enqueuer: prepend new event, deduplicate, limit log history count to 25 to protect rendering latency
      setEvents((prev) => {
        if (prev.some(e => e.eventId === event.eventId)) return prev;
        return [event, ...prev].slice(0, 25);
      });

      // 2. Feed dynamic parameters: extract confidence values to display evolution line
      if (event.payload?.confidence !== undefined) {
        setConfidenceHistory((prev) => [...prev, event.payload.confidence].slice(-8));
      } else if (event.payload?.response?.confidence !== undefined) {
        setConfidenceHistory((prev) => [...prev, event.payload.response.confidence].slice(-8));
      }

      // 3. Update agent states dynamically depending on event types
      setAgents((prevAgents) =>
        prevAgents.map((ag) => {
          let state = ag.status;
          let currentTask = ag.task;

          const sourceMatch = event.sourceAgent?.toLowerCase().includes(ag.name.toLowerCase().replace('agent', ''));
          const targetMatch = event.targetAgent?.toLowerCase().includes(ag.name.toLowerCase().replace('agent', ''));

          if (sourceMatch || targetMatch) {
            if (event.eventType === 'RETRY_TRIGGERED') {
              state = 'RETRYING';
              currentTask = `Re-evaluating due to failure: ${event.payload?.reason || 'Corridor blockage'}`;
            } else if (event.eventType === 'NEGOTIATION_STARTED') {
              state = 'NEGOTIATING';
              currentTask = `Engaged in consensus challenge: ${event.payload?.debate?.negotiationType || 'Alert escalation Blocked'}`;
            } else if (event.eventType === 'ROUTE_DISPUTED' && ag.name === 'RoutingAgent') {
              state = 'NEGOTIATING';
              currentTask = `Disputing evacuation corridor safety!`;
            } else if (event.eventType === 'ALERT_ESCALATED') {
              state = 'ESCALATING';
              currentTask = `Escalating critical warning notification!`;
            } else if (event.eventType === 'VERIFICATION_REQUIRED') {
              state = 'VERIFYING';
              currentTask = `Validating ground-truth signals and rainfall data`;
            } else if (event.eventType === 'MEMORY_UPDATED') {
              state = 'ACTIVE';
              currentTask = `Synchronizing telemetry database state`;
            } else {
              state = 'ACTIVE';
              currentTask = `Executing active emergency pipeline task`;
            }
          } else {
            // Idle timeout: transition back to IDLE slowly if no event occurred for this agent
            state = 'IDLE';
            currentTask = ag.name === 'SentinelAgent' ? 'Idle - Scanning telemetry streams' : 'Idle - Waiting';
          }

          return {
            ...ag,
            status: state,
            task: currentTask,
            priority: agentManager.getTaskPriority(event.eventId)
          };
        })
      );

      // 4. Update recovery state indicators
      setIsRecoveryActive(agentManager.getIsGlobalRecoveryMode());

      // 5. Retrieve active multi-agent debate/dispute history
      const activeDebatesList = sharedMemory.negotiationMemory.getAllActiveNegotiations();
      setActiveDebates(activeDebatesList);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const simulateHazard = () => {
    // Import location store for real GPS coordinates
    const { useLocationStore } = require('../../store/locationStore');
    const loc = useLocationStore.getState().currentLocation;
    const lat = (loc?.latitude && loc.latitude !== 0) ? loc.latitude : 31.5204 + (Math.random() - 0.5) * 0.05;
    const lng = (loc?.longitude && loc.longitude !== 0) ? loc.longitude : 74.3587 + (Math.random() - 0.5) * 0.05;

    // Route through agentManager.dispatchTask so ALL orchestration guards,
    // deduplication, loop shields, and consensus checks are applied.
    agentManager.dispatchTask({
      id: `sim-evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      payload: {
        hazardId: `haz-sim-${Math.floor(Math.random() * 900 + 100)}`,
        severity: 'HIGH',
        lat,
        lng,
        // Realistic rainfall value that triggers agent escalation
        rainfall: 18.5,
        socialReports: 7,
        source: 'pipeline-emulator',
        isSimulated: true,
      },
      sourceAgent: 'pipeline-emulator',
      timestamp: Date.now(),
      retryCount: 0,
    }, 'sentinel');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return COLORS.accent;
      case 'VERIFYING': return COLORS.warning;
      case 'NEGOTIATING': return COLORS.primary;
      case 'RETRYING': return COLORS.warning;
      case 'ESCALATING': return COLORS.critical;
      case 'BLOCKED': return COLORS.critical;
      case 'RECOVERY_MODE': return COLORS.critical;
      default: return COLORS.textDim;
    }
  };

  const getEventBadgeColor = (type: string) => {
    if (type.includes('DETECTED') || type.includes('TRIGGERED')) return COLORS.accent;
    if (type.includes('ESCALATED') || type.includes('BLOCKED')) return COLORS.critical;
    if (type.includes('RETRY') || type.includes('DELAYED')) return COLORS.warning;
    if (type.includes('RECOVERED') || type.includes('REACHED')) return COLORS.success;
    return COLORS.primary;
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return COLORS.primary;
      case 'DEGRADED': return COLORS.warning;
      case 'FAILED': return COLORS.critical;
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* ── HEADER & GLOWING STATUS ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI OPERATIONS</Text>
            <Text style={styles.subtitle}>TACTICAL MULTI-AGENT COORDINATOR</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isRecoveryActive ? 'rgba(255, 69, 58, 0.15)' : 'rgba(52, 199, 89, 0.15)' }
          ]}>
            <Animated.View style={[
              styles.pulseDot,
              {
                backgroundColor: isRecoveryActive ? COLORS.critical : COLORS.success,
                transform: [{ scale: pulseAnim }]
              }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isRecoveryActive ? COLORS.critical : COLORS.success }
            ]}>
              {isRecoveryActive ? 'RECOVERY MODE ACTIVE' : 'OPTIMAL / STABLE'}
            </Text>
          </View>
        </View>

        {/* ── SIMULATOR TRIGGER PANEL ── */}
        <GlassCard style={styles.triggerCard}>
          <View style={styles.triggerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.panelTitle}>AI PIPELINE EMULATOR</Text>
              <Text style={styles.panelDesc}>Inject a telemetry anomaly to trigger autonomous debates, evacuations, and routing in real-time.</Text>
            </View>
            <TouchableOpacity style={styles.simulateBtn} onPress={simulateHazard}>
              <Ionicons name="flash" size={16} color={COLORS.dark} />
              <Text style={styles.simulateBtnText}>INJECT THREAT</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── LIVE SYSTEM DIAGNOSTICS GRID (Section 3) ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="cog" size={14} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>LIVE SYSTEM DIAGNOSTICS PANEL</Text>
        </View>
        <GlassCard style={styles.diagnosticsCard}>
          <View style={styles.diagnosticsGrid}>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>ORCHESTRATION HEALTH</Text>
              <Text style={[styles.diagVal, { color: isRecoveryActive ? COLORS.warning : COLORS.success }]}>
                {isRecoveryActive ? 'HEALING' : 'OPTIMAL'}
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>BACKEND TELEMETRY</Text>
              <Text style={[styles.diagVal, { color: infraHealth.backendConnected ? COLORS.success : COLORS.critical }]}>
                {infraHealth.backendConnected ? 'OPERATIONAL' : 'DISCONNECTED'}
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>FIREBASE FIRESTORE SYNC</Text>
              <Text style={[styles.diagVal, { color: infraHealth.firebaseSynced ? COLORS.success : COLORS.critical }]}>
                {infraHealth.firebaseSynced ? 'CONNECTED' : 'DISCONNECTED'}
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>ACTIVE PIPELINE LOCKS</Text>
              <Text style={[styles.diagVal, { color: loopBlockingMetrics?.activeLocks > 0 ? COLORS.critical : COLORS.success }]}>
                {loopBlockingMetrics?.activeLocks || 0}
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>ACTIVE MULTI-AGENTS</Text>
              <Text style={[styles.diagVal, { color: COLORS.primary }]}>6/6 ONLINE</Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>VERIFIED FLOOD ZONES</Text>
              <Text style={[styles.diagVal, { color: COLORS.accent }]}>
                {hazardStore.hazardZones.length} ACTIVE
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>EVENT THROUGHPUT</Text>
              <Text style={[styles.diagVal, { color: COLORS.primary }]}>
                {events.length} MSGS
              </Text>
            </View>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>AVG PIPELINE LATENCY</Text>
              <Text style={[styles.diagVal, { color: COLORS.white }]}>
                {orchestrationStoreMetrics.totalLatencyMs}ms
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ── RECURSION SHIELD & LOOP BLOCKER PANEL ── */}
        <GlassCard style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.metricsTitle}>RECURSION SHIELD & LOOP BLOCKER</Text>
            <View style={styles.activeShieldBadge}>
              <Text style={styles.activeShieldText}>ACTIVE PROTECT</Text>
            </View>
          </View>
          <Text style={styles.metricsDesc}>Strict non-linear state-machine safety guards preventing recursive orchestration storms and deadlock loops.</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: loopBlockingMetrics?.blockedLoops > 0 ? COLORS.critical : COLORS.success }]}>
                {loopBlockingMetrics?.blockedLoops || 0}
              </Text>
              <Text style={styles.statLabel}>Blocked Replays</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: COLORS.accent }]}>
                {loopBlockingMetrics?.consumedEvents || 0}
              </Text>
              <Text style={styles.statLabel}>Consumed Events</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>
                {loopBlockingMetrics?.activeLocks || 0}
              </Text>
              <Text style={styles.statLabel}>Active Locks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {loopBlockingMetrics?.finalizedTasks || 0}
              </Text>
              <Text style={styles.statLabel}>Finalized Tasks</Text>
            </View>
          </View>
        </GlassCard>

        {/* ── ACTIVE NODES VISUALIZER (Section 6) ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="git-network" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>ACTIVE NODES ORCHESTRATOR</Text>
        </View>
        <GlassCard style={styles.nodesCard}>
          <View style={styles.nodesGrid}>
            {[
              { id: 'sentinel', name: 'SENTINEL', icon: 'shield-checkmark', status: steps.find(s => s.id === 'sentinel')?.status === 'processing' ? 'ACTIVE' : steps.find(s => s.id === 'sentinel')?.status === 'error' ? 'FAILED' : 'IDLE' },
              { id: 'verification', name: 'VERIFICATION', icon: 'checkbox', status: steps.find(s => s.id === 'verification')?.status === 'processing' ? 'ACTIVE' : steps.find(s => s.id === 'verification')?.status === 'error' ? 'FAILED' : 'IDLE' },
              { id: 'analyst', name: 'ANALYST', icon: 'analytics', status: steps.find(s => s.id === 'analyst')?.status === 'processing' ? 'ACTIVE' : steps.find(s => s.id === 'analyst')?.status === 'error' ? 'FAILED' : 'IDLE' },
              { id: 'routing', name: 'ROUTING', icon: 'map', status: steps.find(s => s.id === 'routing')?.status === 'processing' ? 'ACTIVE' : steps.find(s => s.id === 'routing')?.status === 'error' ? 'FAILED' : 'IDLE' },
              { id: 'alert', name: 'ALERT', icon: 'megaphone', status: steps.find(s => s.id === 'alert')?.status === 'processing' ? 'ACTIVE' : steps.find(s => s.id === 'alert')?.status === 'error' ? 'FAILED' : 'IDLE' },
              { id: 'firebase', name: 'FIREBASE CLOUD', icon: 'cloud-done', status: infraHealth.firebaseSynced ? 'ACTIVE' : 'FAILED' },
              { id: 'weather', name: 'WEATHER API', icon: 'cloudy-night', status: weatherData ? (weatherData.weather.condition === 'Unknown' ? 'DEGRADED' : 'ACTIVE') : 'FAILED' },
            ].map(node => (
              <View key={node.id} style={styles.nodeItem}>
                <View style={[styles.nodeIconBox, { backgroundColor: getNodeStatusColor(node.status) + '15' }]}>
                  <Ionicons name={node.icon as any} size={14} color={getNodeStatusColor(node.status)} />
                </View>
                <Text style={styles.nodeName}>{node.name}</Text>
                <Text style={[styles.nodeStatus, { color: getNodeStatusColor(node.status) }]}>{node.status}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* ── LATENCY & PERFORMANCE DIAGNOSTICS (Section 10) ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse" size={14} color={COLORS.critical} />
          <Text style={styles.sectionTitle}>LATENCY & PERFORMANCE OBSERVER</Text>
        </View>
        <GlassCard style={styles.latencyCard}>
          <View style={styles.latencyContainer}>
            <View style={styles.latencyRow}>
              <View style={styles.latencyItemInfo}>
                <Text style={styles.latencyItemTitle}>BACKEND TELEMETRY PING</Text>
                <Text style={styles.latencyItemDesc}>Duration to resolve health checks from Axios client</Text>
              </View>
              <Text style={[styles.latencyVal, { color: COLORS.success }]}>{infraHealth.backendLatencyMs}ms</Text>
            </View>
            <View style={styles.rowDivider} />
            
            <View style={styles.latencyRow}>
              <View style={styles.latencyItemInfo}>
                <Text style={styles.latencyItemTitle}>OPENWEATHER API TELEMETRY</Text>
                <Text style={styles.latencyItemDesc}>Atmospheric sensor query resolution latency</Text>
              </View>
              <Text style={[styles.latencyVal, { color: COLORS.success }]}>{infraHealth.weatherApiLatencyMs}ms</Text>
            </View>
            <View style={styles.rowDivider} />
            
            <View style={styles.latencyRow}>
              <View style={styles.latencyItemInfo}>
                <Text style={styles.latencyItemTitle}>FIREBASE FIRESTORE CLOUD SYNC</Text>
                <Text style={styles.latencyItemDesc}>Duration of shared memory transactions to Firestore</Text>
              </View>
              <Text style={[styles.latencyVal, { color: COLORS.success }]}>{infraHealth.firebaseSyncLatencyMs}ms</Text>
            </View>
            <View style={styles.rowDivider} />
            
            <View style={styles.latencyRow}>
              <View style={styles.latencyItemInfo}>
                <Text style={styles.latencyItemTitle}>ORCHESTRATION PIPELINE CYCLE</Text>
                <Text style={styles.latencyItemDesc}>Sum execution of the Sentinel, Analyst, and Alert engines</Text>
              </View>
              <Text style={[styles.latencyVal, { color: COLORS.primary }]}>{infraHealth.orchestrationLatencyMs}ms</Text>
            </View>
            <View style={styles.rowDivider} />
            
            <View style={styles.latencyRow}>
              <View style={styles.latencyItemInfo}>
                <Text style={styles.latencyItemTitle}>EVACUATION ROUTE CALCULATION</Text>
                <Text style={styles.latencyItemDesc}>Safe escape navigation pathfinding & safety bypass checks</Text>
              </View>
              <Text style={[styles.latencyVal, { color: COLORS.accent }]}>{infraHealth.routingLatencyMs}ms</Text>
            </View>
          </View>
        </GlassCard>

        {/* ── ACTIVE MULTI-AGENT STATUSES ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={14} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>ACTIVE INTELLIGENCE AGENTS</Text>
        </View>

        {agents.map((ag) => (
          <GlassCard key={ag.name} style={styles.agentCard}>
            <View style={styles.agentInfoRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.agentName}>{ag.name}</Text>
                <Text style={styles.agentTask} numberOfLines={1}>{ag.task}</Text>
              </View>
              <View style={styles.badgeColumn}>
                <View style={[styles.stateBadge, { borderColor: getStatusColor(ag.status) }]}>
                  <View style={[styles.innerDot, { backgroundColor: getStatusColor(ag.status) }]} />
                  <Text style={[styles.stateText, { color: getStatusColor(ag.status) }]}>{ag.status}</Text>
                </View>
                <Text style={styles.contributionText}>Weight: {(ag.confidenceContribution * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </GlassCard>
        ))}

        {/* ── DYNAMIC CONFIDENCE PROGRESSION LINE ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>CONFIDENCE STATE EVOLUTION</Text>
        </View>

        <GlassCard style={styles.evolutionCard}>
          <View style={styles.evolutionChain}>
            {confidenceHistory.map((val, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.chainNode}>
                  <Text style={styles.nodeVal}>{(val * 100).toFixed(0)}%</Text>
                  <Text style={styles.nodeLabel}>STEP {idx + 1}</Text>
                </View>
                {idx < confidenceHistory.length - 1 && (
                  <Ionicons name="arrow-forward" size={14} color={COLORS.textDim} style={styles.chainArrow} />
                )}
              </React.Fragment>
            ))}
          </View>
        </GlassCard>

        {/* ── ACTIVE NEGOTIATIONS & DEBATES ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubbles" size={14} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>LIVE COORDINATION DEBATES</Text>
        </View>

        {activeDebates.length === 0 ? (
          <GlassCard style={styles.emptyDebatesCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
            <Text style={styles.emptyDebatesText}>No active disputes. Agent agreements are stabilized.</Text>
          </GlassCard>
        ) : (
          activeDebates.map((deb) => (
            <GlassCard key={deb.id} style={styles.debateCard}>
              <View style={styles.debateHeader}>
                <Text style={styles.debateType}>{deb.negotiationType}</Text>
                <View style={styles.debateStatusBadge}>
                  <Text style={styles.debateStatusText}>{deb.status}</Text>
                </View>
              </View>
              <Text style={styles.debateProposal}>
                <Text style={{ color: COLORS.accent }}>{deb.sourceAgent}</Text>
                {" challenged "}
                <Text style={{ color: COLORS.primary }}>{deb.targetAgent}</Text>
              </Text>
              <View style={styles.debateReasoningContainer}>
                {deb.reasoning.map((reason: string, rIdx: number) => (
                  <Text key={rIdx} style={styles.debateReason}>• {reason}</Text>
                ))}
              </View>
              <Text style={styles.debateAction}>
                {"Suggested Action: "}
                <Text style={{ color: COLORS.warning, fontWeight: '800' }}>{deb.suggestedAction}</Text>
              </Text>
            </GlassCard>
          ))
        )}

        {/* ── REALTIME ORCHESTRATION EVENT STREAM ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={14} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>REAL-TIME EVENT BUS STREAM</Text>
        </View>

        <View style={styles.streamContainer}>
          {events.length === 0 ? (
            <View style={styles.emptyStream}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.emptyStreamText}>Awaiting system anomaly trigger signals...</Text>
            </View>
          ) : (
            events.map((evt, idx) => (
              <View key={evt.eventId || idx} style={styles.streamItem}>
                <View style={styles.streamHeaderRow}>
                  <View style={[styles.eventBadge, { backgroundColor: getEventBadgeColor(evt.eventType) }]}>
                    <Text style={styles.eventBadgeText}>{evt.eventType}</Text>
                  </View>
                  <Text style={styles.streamTime}>{new Date(evt.timestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.streamMeta}>
                  {"Source: "}
                  <Text style={{ color: COLORS.accent }}>{evt.sourceAgent}</Text>
                  {evt.targetAgent ? ` → Target: ${evt.targetAgent}` : ''}
                </Text>
                {evt.payload && (
                  <Text style={styles.streamPayload} numberOfLines={2}>
                    Payload: {JSON.stringify(evt.payload)}
                  </Text>
                )}
              </View>
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  triggerCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 97, 56, 0.25)',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  panelDesc: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 11,
  },
  simulateBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  simulateBtnText: {
    color: COLORS.dark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  diagnosticsCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  diagItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  diagLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diagVal: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
  },
  metricsCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metricsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    flex: 1,
  },
  activeShieldBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  activeShieldText: {
    color: COLORS.success,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsDesc: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    fontWeight: '600',
    lineHeight: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  nodesCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  nodeItem: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  nodeIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeName: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
  },
  nodeStatus: {
    fontSize: 7,
    fontWeight: '900',
    marginTop: 2,
  },
  latencyCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  latencyContainer: {
    gap: 10,
  },
  latencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latencyItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  latencyItemTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  latencyItemDesc: {
    fontSize: 7.5,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  latencyVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  agentCard: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  agentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
  },
  agentTask: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  stateText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  contributionText: {
    fontSize: 8,
    color: COLORS.textDim,
    fontWeight: '700',
  },
  evolutionCard: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  evolutionChain: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chainNode: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 46,
  },
  nodeVal: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
  },
  nodeLabel: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '900',
    marginTop: 1,
  },
  chainArrow: {
    alignSelf: 'center',
  },
  emptyDebatesCard: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  emptyDebatesText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  debateCard: {
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  debateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debateType: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  debateStatusBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  debateStatusText: {
    color: COLORS.warning,
    fontSize: 7.5,
    fontWeight: '900',
  },
  debateProposal: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  debateReasoningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    gap: 3,
  },
  debateReason: {
    fontSize: 8.5,
    color: COLORS.white,
    fontWeight: '600',
    lineHeight: 11,
  },
  debateAction: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  streamContainer: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    marginBottom: 40,
  },
  emptyStream: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStreamText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  streamItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  streamHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventBadgeText: {
    color: COLORS.dark,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  streamTime: {
    fontSize: 8,
    color: COLORS.textDim,
    fontWeight: '700',
  },
  streamMeta: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  streamPayload: {
    fontSize: 8,
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 4,
    borderRadius: 4,
  }
});

export default AIOperationsScreen;
