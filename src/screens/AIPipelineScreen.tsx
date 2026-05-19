import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { useOrchestrationStore } from '../store/orchestrationStore';
import { agentEventBus } from '../agents/core/AgentEvents';
import { AgentNode } from '../components/ai-pipeline/AgentNode';
import { PipelineTimeline } from '../components/ai-pipeline/PipelineTimeline';
import { TerminalConsole } from '../components/ai-pipeline/TerminalConsole';
import { useCommandStore } from '../store/commandStore';
import { InputIngestionPanel } from '../components/pipeline/InputIngestionPanel';
import { useWeatherStore } from '@store/weatherStore';
import { useSocialSignalStore } from '@store/socialSignalStore';
import { useLocationStore } from '@store/locationStore';
import { useInfraHealthStore } from '@store/infraHealthStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { agentManager } from '../agents/core/AgentManager';

const AIPipelineScreen = () => {
  const { steps, logs, isActive, activeStepId, addLog } = useOrchestrationStore();
  const weatherData = useWeatherStore((state) => state.weatherData);
  const addReport = useSocialSignalStore((state) => state.addReport);
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const locationState = useLocationStore((state) => state.locationState);
  const infraHealth = useInfraHealthStore();
  
  const { addCommand } = useCommandStore();
  const [comparison, setComparison] = useState<{ input: string; output: any } | null>(null);

  const normStep = steps.find(s => s.id === 'normalization');
  const normalizedSignal = normStep?.output?.signal;
  const priorityStep = steps.find(s => s.id === 'priority');
  const priorityResult = priorityStep?.output?.result;

  // Pulse animation for header indicators
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

    const unsub = agentEventBus.subscribeAll((event) => {
      let type: 'executing' | 'success' | 'warning' | 'error' = 'success';
      if (event.eventType.includes('FAILURE') || event.eventType.includes('REJECTED') || event.eventType.includes('BLOCKED') || event.eventType.includes('UNSAFE')) {
        type = 'error';
      } else if (event.eventType.includes('ESCALATED') || event.eventType.includes('RETRY') || event.eventType.includes('REQUIRED')) {
        type = 'warning';
      }
      
      const payloadStr = JSON.stringify(event.payload || {}).substring(0, 60);
      addCommand(
        `AGENT_${event.sourceAgent.toUpperCase()} --event ${event.eventType}`,
        `Payload: ${payloadStr}...`,
        type
      );
    });

    return () => {
      unsub();
    };
  }, []);

  const handleIngestion = async (data: { text: string; severity: string; location?: string }) => {
    setComparison({ input: data.text, output: { severity: data.severity, reportType: 'FlashFlood', validated: true } });
    addLog({ agent: 'system', message: `Raw text ingestion received: "${data.text}"`, status: 'info' });
    addCommand("INIT_PIPELINE --mode production", "Orchestrator online. Ingesting text stream...", "success");

    const lat = currentLocation?.latitude || 31.5204;
    const lng = currentLocation?.longitude || 74.3587;

    addReport({
      id: `usr-${Date.now()}`,
      text: data.text,
      severity: data.severity.toLowerCase() as any,
      timestamp: Math.floor(Date.now() / 1000),
      coordinates: { lat, lng },
      locationName: data.location || 'Lahore, Pakistan',
      source: 'user-report'
    });

    const taskId = `task-${Date.now()}`;
    const payload = {
      text: data.text,
      lat,
      lng,
    };
    useOrchestrationStore.getState().resetPipeline();
    agentManager.executePipeline(taskId, payload, 'user_input');
  };

  // Determine connected states for thinking timeline nodes
  const getTimelineNodeState = (node: 'OBSERVE' | 'ANALYZE' | 'VERIFY' | 'PREDICT' | 'RESPOND') => {
    const sentinelStep = steps.find(s => s.id === 'sentinel');
    const verificationStep = steps.find(s => s.id === 'verification');
    const analystStep = steps.find(s => s.id === 'analyst');
    const predictiveStep = steps.find(s => s.id === 'predictive');
    const routingStep = steps.find(s => s.id === 'routing');

    switch (node) {
      case 'OBSERVE':
        if (activeStepId === 'aggregator' || activeStepId === 'sentinel') return 'processing';
        if (sentinelStep?.status === 'completed') return 'completed';
        return 'idle';
      case 'VERIFY':
        if (activeStepId === 'verification') return 'processing';
        if (verificationStep?.status === 'completed') return 'completed';
        return 'idle';
      case 'ANALYZE':
        if (activeStepId === 'analyst') return 'processing';
        if (analystStep?.status === 'completed') return 'completed';
        return 'idle';
      case 'PREDICT':
        if (activeStepId === 'predictive') return 'processing';
        if (predictiveStep?.status === 'completed') return 'completed';
        return 'idle';
      case 'RESPOND':
        if (activeStepId === 'routing' || activeStepId === 'alert') return 'processing';
        if (routingStep?.status === 'completed') return 'completed';
        return 'idle';
    }
  };

  const getNodeColor = (state: 'idle' | 'processing' | 'completed') => {
    if (state === 'completed') return '#34C759'; // green
    if (state === 'processing') return '#00E6FF'; // bright cyan
    return 'rgba(255, 255, 255, 0.15)';
  };

  // Weather Environmental parameters
  const temp = weatherData?.weather.temperature ? `${weatherData.weather.temperature.toFixed(1)}°C` : '29.5°C';
  const condition = weatherData?.weather.condition || 'CLEAR SKY';
  const stormProb = weatherData?.weather.stormProbability ?? 12;
  const rainfall = weatherData?.weather.rainfall ?? 0.0;
  const windSpeed = weatherData?.weather.windSpeed ?? 4.2;

  // Confidence & Risk index levels
  let riskLevel = 'LOW';
  let riskColor = '#34C759';
  if (stormProb > 60 || rainfall > 15) {
    riskLevel = 'CRITICAL';
    riskColor = '#FF3B30';
  } else if (stormProb > 40 || rainfall > 5) {
    riskLevel = 'HIGH';
    riskColor = '#FF9500';
  } else if (stormProb > 20) {
    riskLevel = 'MODERATE';
    riskColor = '#AF52DE';
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* ── 1. GLOBAL COMMAND HEADER ────────────────────────────────────── */}
        <GlassCard style={styles.commandHeader} intensity={25}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>RESILINET</Text>
              <Text style={styles.logoSub}>OS</Text>
            </View>
            <View style={styles.statusBadge}>
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.statusText}>AUTONOMOUS ACTIVE</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.rightStat}>
              <Ionicons name="cloud-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.rightVal}>{temp} | {condition.toUpperCase()}</Text>
            </View>
            <View style={styles.rightStat}>
              <Ionicons name="hardware-chip-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.rightVal}>6/6 THREADS ONLINE</Text>
            </View>
          </View>
        </GlassCard>

        {/* ── 2. AI THINKING TIMELINE ────────────────────────────────────── */}
        <View style={styles.sectionHeadingRow}>
          <Ionicons name="sparkles" size={14} color="#00E6FF" />
          <Text style={styles.sectionTitle}>DYNAMIC THINKING TIMELINE</Text>
        </View>
        
        <GlassCard style={styles.timelineCard} intensity={20}>
          <View style={styles.timelineContainer}>
            {[
              { id: 'OBSERVE', label: 'OBSERVE', icon: 'eye-outline' },
              { id: 'ANALYZE', label: 'ANALYZE', icon: 'analytics-outline' },
              { id: 'VERIFY', label: 'VERIFY', icon: 'shield-outline' },
              { id: 'PREDICT', label: 'PREDICT', icon: 'trending-up-outline' },
              { id: 'RESPOND', label: 'RESPOND', icon: 'navigate-outline' }
            ].map((node, index, arr) => {
              const state = getTimelineNodeState(node.id as any);
              const color = getNodeColor(state);
              return (
                <React.Fragment key={node.id}>
                  <View style={styles.nodeWrapper}>
                    <View style={[styles.nodeCircle, { borderColor: color, backgroundColor: state === 'completed' ? color + '15' : 'rgba(0,0,0,0.3)' }]}>
                      <Ionicons name={node.icon as any} size={14} color={state === 'idle' ? 'rgba(255,255,255,0.3)' : color} />
                    </View>
                    <Text style={[styles.nodeLabel, { color: state === 'idle' ? 'rgba(255,255,255,0.3)' : '#FFF' }]}>{node.label}</Text>
                  </View>
                  {index < arr.length - 1 && (
                    <View style={styles.timelineConnector}>
                      <View style={[styles.connectorLine, { backgroundColor: color === '#34C759' ? '#34C759' : 'rgba(255,255,255,0.1)' }]} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </GlassCard>

        {/* ── 3. LIVE ENVIRONMENTAL DIGITAL TWIN ─────────────────────────── */}
        <View style={styles.sectionHeadingRow}>
          <Ionicons name="planet-outline" size={14} color="#34C759" />
          <Text style={styles.sectionTitle}>ENVIRONMENTAL DIGITAL TWIN</Text>
        </View>

        <GlassCard style={styles.digitalTwinCard} intensity={15}>
          <View style={styles.twinGrid}>
            <View style={styles.twinItem}>
              <Text style={styles.twinLabel}>STORM PROBABILITY</Text>
              <Text style={styles.twinVal}>{stormProb}%</Text>
              <View style={styles.twinMeterBg}>
                <View style={[styles.twinMeterFill, { width: `${stormProb}%`, backgroundColor: '#AF52DE' }]} />
              </View>
            </View>

            <View style={styles.twinItem}>
              <Text style={styles.twinLabel}>RAINFALL DENSITY</Text>
              <Text style={styles.twinVal}>{rainfall.toFixed(1)} mm</Text>
              <View style={styles.twinMeterBg}>
                <View style={[styles.twinMeterFill, { width: `${Math.min(100, (rainfall / 30) * 100)}%`, backgroundColor: '#00E6FF' }]} />
              </View>
            </View>

            <View style={styles.twinItem}>
              <Text style={styles.twinLabel}>WIND VECTOR</Text>
              <Text style={styles.twinVal}>{windSpeed.toFixed(1)} m/s</Text>
              <View style={styles.twinMeterBg}>
                <View style={[styles.twinMeterFill, { width: `${Math.min(100, (windSpeed / 20) * 100)}%`, backgroundColor: '#FF9500' }]} />
              </View>
            </View>

            <View style={styles.twinItem}>
              <Text style={styles.twinLabel}>REGIONAL RISK INDEX</Text>
              <Text style={[styles.twinVal, { color: riskColor }]}>{riskLevel}</Text>
              <View style={styles.twinMeterBg}>
                <View style={[styles.twinMeterFill, { width: riskLevel === 'LOW' ? '25%' : riskLevel === 'MODERATE' ? '50%' : riskLevel === 'HIGH' ? '75%' : '100%', backgroundColor: riskColor }]} />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* ── 4. LIVE DATA SOURCE INGESTION ─────────────────────────────── */}
        <View style={styles.sectionHeadingRow}>
          <Ionicons name="git-network-outline" size={14} color="#FF9500" />
          <Text style={styles.sectionTitle}>DATA INGESTION CHANNELS</Text>
        </View>

        <GlassCard style={styles.channelsCard} intensity={15}>
          <View style={styles.channelsGrid}>
            {[
              { id: 'weather', name: 'OpenWeather Front', active: !!weatherData, color: '#00E6FF' },
              { id: 'fcm', name: 'Emergency Broadcast', active: infraHealth.firebaseSynced, color: '#FF3B30' },
              { id: 'gps', name: 'Tactical GPS Locking', active: locationState === 'LOCATION_VERIFIED', color: '#34C759' },
              { id: 'db', name: 'Corridor Route Nodes', active: infraHealth.backendConnected, color: '#FF9500' }
            ].map(ch => (
              <View key={ch.id} style={styles.channelItem}>
                <View style={[styles.channelDot, { backgroundColor: ch.active ? ch.color : 'rgba(255,255,255,0.1)' }]} />
                <Text style={styles.channelName}>{ch.name}</Text>
                <Text style={[styles.channelStatus, { color: ch.active ? ch.color : 'rgba(255,255,255,0.3)' }]}>
                  {ch.active ? 'CONNECTED' : 'DISCONNECTED'}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* ── 5. MANUAL INGESTION PANEL ─────────────────────────────────── */}
        <InputIngestionPanel onSubmit={handleIngestion} isProcessing={isActive} />

        {/* ── 6. LIVE COGNITIVE CONSOLE COMPARISON ───────────────────────── */}
        {comparison && (
          <View style={styles.comparisonContainer}>
            <View style={styles.sectionHeadingRow}>
              <Ionicons name="shield-outline" size={14} color="#5AC8FA" />
              <Text style={styles.sectionTitle}>INGESTED COGNITIVE STRUCTURE</Text>
            </View>
            <View style={styles.comparisonRow}>
              <GlassCard style={styles.comparisonCard} intensity={15}>
                <Text style={styles.cardLabel}>UNSTRUCTURED NATURAL SIGNAL</Text>
                <Text style={styles.rawText}>"{comparison.input}"</Text>
              </GlassCard>
              <View style={styles.arrowBox}>
                <Ionicons name="arrow-forward" size={18} color="#00E6FF" />
              </View>
              <GlassCard style={styles.comparisonCard} intensity={25}>
                <Text style={styles.cardLabel}>SYNTHESIZED THREAT PLAN</Text>
                <Text style={styles.predictedText}>
                  {isActive ? (
                    'ANALYZING THREAT PLAN...'
                  ) : normalizedSignal ? (
                    `SEVERITY: ${priorityResult?.priority ? priorityResult.priority : normalizedSignal.severityIndicators?.join(', ') || 'LOW'}\nHAZARD: ${normalizedSignal.condition?.toUpperCase() || normalizedSignal.type?.toUpperCase() || 'GENERAL OBSERVATION'}\nSTATUS: ${priorityResult?.finalVerifiedStatus || 'MONITORING'}\nCONFIDENCE: ${Math.round((priorityStep?.output?.confidence ?? normalizedSignal.rawConfidence ?? 0) * 100)}%`
                  ) : (
                    'ANALYZING THREAT PLAN...'
                  )}
                </Text>
              </GlassCard>
            </View>
          </View>
        )}

        {/* ── 7. TACTICAL REALTIME INGESTION LOGS ───────────────────────── */}
        <View style={styles.terminalSection}>
           <TerminalConsole />
        </View>

        {/* ── 8. LIVE AI AGENT ACTIVITY STREAM ──────────────────────────── */}
        <View style={styles.pipelineBody}>
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="people-outline" size={14} color="#00E6FF" />
            <Text style={styles.sectionTitle}>COORDINATED WORKER NODES</Text>
          </View>
          
          <View style={styles.nodesContainer}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <AgentNode 
                  step={step} 
                  isActive={activeStepId === step.id} 
                />
                {index < steps.length - 1 && (
                  <View style={styles.connector}>
                    <View style={[
                      styles.line, 
                      { backgroundColor: step.status === 'completed' ? '#34C759' : 'rgba(255, 255, 255, 0.08)' }
                    ]} />
                    {step.status === 'processing' && <View style={styles.activeParticle} />}
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── 9. NARRATIVE OPERATIONAL TIMELINE ──────────────────────────── */}
        <View style={styles.footer}>
           <PipelineTimeline logs={logs} />
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
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
  },
  headerLeft: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  logoSub: {
    fontSize: 8,
    fontWeight: '900',
    color: '#00E6FF',
    backgroundColor: 'rgba(0, 230, 255, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34C759',
  },
  statusText: {
    color: '#34C759',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  rightStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightVal: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  timelineCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 50,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  nodeLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    height: 1.5,
    width: '100%',
  },
  digitalTwinCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
  },
  twinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  twinItem: {
    width: '47%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  twinLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  twinVal: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6,
  },
  twinMeterBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  twinMeterFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  channelsCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  channelItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  channelDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  channelName: {
    fontSize: 8.5,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  channelStatus: {
    fontSize: 7,
    fontWeight: '900',
  },
  comparisonContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonCard: {
    flex: 1,
    padding: 12,
    height: 96,
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.5)',
  },
  cardLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rawText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  predictedText: {
    color: '#00E6FF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 12,
  },
  arrowBox: {
    width: 24,
    alignItems: 'center',
  },
  terminalSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  pipelineBody: {
    marginTop: 10,
  },
  nodesContainer: {
    paddingLeft: 4,
  },
  connector: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  line: {
    width: 2,
    height: '100%',
    borderRadius: 1,
  },
  activeParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E6FF',
    shadowColor: '#00E6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  footer: {
    marginTop: 16,
  }
});

export default AIPipelineScreen;
