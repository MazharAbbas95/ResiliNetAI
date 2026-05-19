import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useOrchestrationStore } from '@store/orchestrationStore';
import { agentManager } from '../agents/core/AgentManager';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return COLORS.success;
    case 'processing': return COLORS.warning;
    case 'error': return COLORS.critical;
    default: return 'rgba(255,255,255,0.2)';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'checkmark-circle';
    case 'processing': return 'sync';
    case 'error': return 'close-circle';
    default: return 'ellipse-outline';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return COLORS.critical;
    case 'high':     return COLORS.primary;
    case 'medium':   return COLORS.warning;
    case 'low':      return COLORS.success;
    default:         return COLORS.textMuted;
  }
};

export default function AIInsightsScreen() {
  const { steps, isActive, metrics } = useOrchestrationStore();
  const [rawInput, setRawInput] = useState('');
  
  const handleIngest = async () => {
    if (!rawInput.trim() || isActive) return;
    const taskId = `task-${Date.now()}`;
    const payload = {
      text: rawInput,
      lat: 31.5204, // Defaulting for testing
      lng: 74.3587,
    };
    
    useOrchestrationStore.getState().resetPipeline();
    agentManager.executePipeline(taskId, payload, 'user_input');
  };

  const normStep = steps.find(s => s.id === 'normalization');
  const normalizedSignal = normStep?.output?.signal;

  const priorityStep = steps.find(s => s.id === 'priority');
  const finalOutput = priorityStep?.output;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>AUTONOMOUS REASONING</Text>
          <Text style={styles.subtitle}>EVIDENCE-DRIVEN AI PIPELINE</Text>
        </View>

        {/* RAW INPUT PANEL */}
        <GlassCard style={styles.inputCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="terminal" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>STAGE 1: RAW INPUT INGESTION</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter raw signal (e.g. 'Heavy rain near Milton, roads flooded')"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={rawInput}
            onChangeText={setRawInput}
            multiline
            editable={!isActive}
          />

          {/* QUICK TEMPLATES */}
          <View style={styles.templatesContainer}>
            <Text style={styles.templatesLabel}>QUICK SIMULATION TEMPLATES:</Text>
            <View style={styles.templatesList}>
              {[
                { label: 'Safe Observation', text: 'Multan weather is too cool and nice' },
                { label: 'Real Emergency', text: 'Heavy monsoon rain near Milton, water level rising rapidly, main road is flooded!' },
                { label: 'Hallucination Exaggeration', text: 'The entire city is flooded! Everything is underwater and millions are dying! Help!' }
              ].map((tmpl, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.templateBadge} 
                  onPress={() => setRawInput(tmpl.text)}
                  disabled={isActive}
                >
                  <Text style={styles.templateBadgeText}>{tmpl.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.ingestBtn, (!rawInput.trim() || isActive) && styles.ingestBtnDisabled]} 
            onPress={handleIngest}
            disabled={!rawInput.trim() || isActive}
          >
            {isActive ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.ingestBtnText}>INGEST & ANALYZE SIGNAL</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* STRUCTURED DATA PANEL */}
        {!!normalizedSignal && (
          <GlassCard style={styles.structuredCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-network-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>STAGE 2: STRUCTURED PREPROCESSING</Text>
            </View>
            <View style={styles.structuredGrid}>
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>SIGNAL CLASSIFICATION</Text>
                  <Text style={styles.gridValue}>{normalizedSignal.type?.toUpperCase() ?? 'GENERAL'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>HAZARD CONDITION</Text>
                  <Text style={styles.gridValue}>{normalizedSignal.condition?.toUpperCase() ?? 'UNKNOWN'}</Text>
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>DETECTED LOCATION</Text>
                  <Text style={styles.gridValue}>{normalizedSignal.location ?? 'Unknown'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>BASE EVIDENCE CONFIDENCE</Text>
                  <Text style={styles.gridValue}>{Math.round((normalizedSignal.rawConfidence ?? 0) * 100)}%</Text>
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>SEVERITY INDICATORS</Text>
                  <Text style={styles.gridValue}>{normalizedSignal.severityIndicators?.join(', ') || 'NONE'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>SOURCE TRUST / STATUS</Text>
                  <Text style={styles.gridValue}>
                    {normalizedSignal.sourceType?.toUpperCase() ?? 'USER'} | {normalizedSignal.verified ? 'VERIFIED' : 'UNVERIFIED'}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        )}

        {/* AGENT TRANSFORMATION FLOW */}
        <View style={styles.flowSection}>
           <Text style={styles.sectionTitle}>LIVE AGENT REASONING STREAM</Text>
           
           {steps.map((step, index) => {
             const statusColor = getStatusColor(step.status);
             const isProcessing = step.status === 'processing';
             
             return (
               <View key={step.id} style={styles.agentContainer}>
                 <View style={styles.timelineColumn}>
                    <View style={[styles.timelineNode, { borderColor: statusColor }]}>
                      {isProcessing ? (
                        <ActivityIndicator color={statusColor} size={12} />
                      ) : (
                        <Ionicons name={getStatusIcon(step.status)} size={14} color={statusColor} />
                      )}
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: statusColor }]} />
                    )}
                 </View>
                 
                 <GlassCard style={isProcessing ? [styles.agentCard, styles.agentCardActive] : styles.agentCard}>
                    <View style={styles.agentHeader}>
                       <Text style={styles.agentName}>{step.name}</Text>
                       <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                         <Text style={[styles.statusText, { color: statusColor }]}>
                           {step.status.toUpperCase()}
                         </Text>
                       </View>
                    </View>
                    <Text style={styles.agentDesc}>{step.description}</Text>
                    
                    {step.reasoning ? (
                      <View style={styles.reasoningBox}>
                         <Text style={styles.reasoningText}>{step.reasoning}</Text>
                         
                         {/* Expanded Agent Telemetry */}
                         <View style={styles.telemetryGrid}>
                           <View style={styles.telemetryRow}>
                             <Text style={styles.telemetryLabel}>Execution Duration:</Text>
                             <Text style={styles.telemetryValue}>{step.processingTimeMs ?? 0}ms</Text>
                           </View>
                           {step.output?.confidence !== undefined && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Confidence Score:</Text>
                               <Text style={styles.telemetryValue}>{Math.round(step.output.confidence * 100)}%</Text>
                             </View>
                           )}
                           {step.id === 'normalization' && !!step.output?.type && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Extracted Type:</Text>
                               <Text style={styles.telemetryValue}>{step.output.type.toUpperCase()}</Text>
                             </View>
                           )}
                           {step.id === 'crowd' && !!step.output?.result && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Unique Source Clusters:</Text>
                               <Text style={styles.telemetryValue}>{step.output.result.uniqueReportCount} source(s)</Text>
                             </View>
                           )}
                           {step.id === 'sentiment' && !!step.output?.result && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Urgency / Panic Level:</Text>
                               <Text style={styles.telemetryValue}>{step.output.result.urgencyLevel}</Text>
                             </View>
                           )}
                           {step.id === 'verification' && !!step.output?.result && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Weather / Fusion Gate:</Text>
                               <Text style={[styles.telemetryValue, { color: step.output.result.conditionD_approved ? COLORS.success : COLORS.warning }]}>
                                 {step.output.result.conditionD_approved ? 'APPROVED' : 'SUPPRESSED'}
                               </Text>
                             </View>
                           )}
                           {step.id === 'shield' && !!step.output && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Threat Suppression:</Text>
                               <Text style={[styles.telemetryValue, { color: step.output.blocked ? COLORS.critical : COLORS.success }]}>
                                 {step.output.blocked ? 'FALSE POSITIVE BLOCKED' : 'CLEARED / SECURE'}
                               </Text>
                             </View>
                           )}
                           {step.id === 'predictive' && !!step.output?.simulation && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Scenario Forecast:</Text>
                               <Text style={styles.telemetryValue}>{step.output.simulation.scenarioLabel}</Text>
                             </View>
                           )}
                           {step.id === 'tactical' && !!step.output?.result && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Strategy / Action Plan:</Text>
                               <Text style={styles.telemetryValue}>{step.output.result.strategy}</Text>
                             </View>
                           )}
                           {step.id === 'priority' && !!step.output?.result && (
                             <View style={styles.telemetryRow}>
                               <Text style={styles.telemetryLabel}>Response priority score:</Text>
                               <Text style={styles.telemetryValue}>{step.output.result.priority} ({step.output.result.priorityScore}/100)</Text>
                             </View>
                           )}
                         </View>

                         {step.output?.confidence !== undefined && (
                           <View style={styles.confidenceRow}>
                             <Text style={styles.confLabel}>CONFIDENCE</Text>
                             <View style={styles.confBarBg}>
                                <View style={[styles.confBarFill, { width: `${(step.output.confidence * 100)}%`, backgroundColor: step.output.confidence > 0.7 ? COLORS.success : step.output.confidence > 0.4 ? COLORS.warning : COLORS.critical }]} />
                             </View>
                             <Text style={styles.confValue}>{Math.round(step.output.confidence * 100)}%</Text>
                           </View>
                         )}
                      </View>
                    ) : null}
                    {step.processingTimeMs ? (
                      <Text style={styles.timeText}>{step.processingTimeMs}ms</Text>
                    ) : null}
                 </GlassCard>
               </View>
             );
           })}
        </View>

        {/* FINAL ESCALATION DECISION */}
        {priorityStep?.status === 'completed' && (
          <GlassCard style={[styles.finalCard, { borderColor: priorityStep.output?.result?.finalVerifiedStatus === 'VERIFIED' ? COLORS.success : priorityStep.output?.result?.finalVerifiedStatus === 'REJECTED' ? COLORS.critical : COLORS.warning }]}>
            <View style={styles.cardHeader}>
              <Ionicons 
                name={priorityStep.output?.result?.finalVerifiedStatus === 'VERIFIED' ? "shield-checkmark" : priorityStep.output?.result?.finalVerifiedStatus === 'REJECTED' ? "alert-circle" : "eye-outline"} 
                size={18} 
                color={priorityStep.output?.result?.finalVerifiedStatus === 'VERIFIED' ? COLORS.success : priorityStep.output?.result?.finalVerifiedStatus === 'REJECTED' ? COLORS.critical : COLORS.warning} 
              />
              <Text style={styles.cardTitle}>FINAL COORDINATION DECISION</Text>
            </View>

            <View style={styles.finalGrid}>
               <View style={styles.finalItem}>
                 <Text style={styles.finalLabel}>VERIFIED STATUS</Text>
                 <Text style={[styles.finalValue, { color: priorityStep.output?.result?.finalVerifiedStatus === 'VERIFIED' ? COLORS.success : priorityStep.output?.result?.finalVerifiedStatus === 'REJECTED' ? COLORS.critical : COLORS.warning }]}>
                   {priorityStep.output?.result?.finalVerifiedStatus ?? 'MONITORING'}
                 </Text>
               </View>
               <View style={styles.finalItem}>
                 <Text style={styles.finalLabel}>FUSED CONFIDENCE</Text>
                 <Text style={styles.finalValue}>{Math.round((finalOutput?.confidence || 0) * 100)}%</Text>
               </View>
            </View>

            <View style={styles.finalGrid}>
               <View style={styles.finalItem}>
                 <Text style={styles.finalLabel}>ESCALATION STATUS</Text>
                 <Text style={[styles.finalValue, { color: priorityStep.output?.result?.escalationApproved ? COLORS.primary : COLORS.textDim }]}>
                   {priorityStep.output?.result?.escalationApproved ? 'APPROVED & ESCALATED' : 'SUPPRESSED / PASSIVE MONITORING'}
                 </Text>
               </View>
               <View style={styles.finalItem}>
                 <Text style={styles.finalLabel}>RISK LEVEL</Text>
                 <Text style={[styles.finalValue, { color: getSeverityColor(priorityStep.output?.result?.priority === 'P0_CRITICAL' ? 'critical' : priorityStep.output?.result?.priority === 'P1_HIGH' ? 'high' : priorityStep.output?.result?.priority === 'P2_MEDIUM' ? 'medium' : 'low') }]}>
                   {priorityStep.output?.result?.priority ?? 'P3_LOW'}
                 </Text>
               </View>
            </View>

            {/* EVIDENCE SOURCES */}
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>EVIDENCE-WEIGHTED GROUND TRUTH SOURCES</Text>
              {priorityStep.output?.result?.evidenceSummary && priorityStep.output.result.evidenceSummary.length > 0 ? (
                priorityStep.output.result.evidenceSummary.map((source: string, idx: number) => (
                  <View key={idx} style={styles.sourceRow}>
                    <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.success} />
                    <Text style={styles.sourceText}>{source}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sourceText}>No verified telemetry sources corroborated this signal.</Text>
              )}
            </View>

            {/* AGENT DECISION TRACE */}
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>INTELLIGENCE CONCORDANCE TRACE</Text>
              {priorityStep.output?.result?.decisionTrace && priorityStep.output.result.decisionTrace.length > 0 ? (
                priorityStep.output.result.decisionTrace.map((trace: string, idx: number) => (
                  <View key={idx} style={styles.sourceRow}>
                    <Ionicons name="chevron-forward-outline" size={10} color={COLORS.primary} />
                    <Text style={styles.traceText}>{trace}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.traceText}>No decision trace available.</Text>
              )}
            </View>

            {/* WHY DECISION MADE */}
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>EXPLAINABLE DECISION NARRATIVE (AI SUMMARY)</Text>
              <Text style={styles.finalReasoning}>
                {priorityStep.output?.result?.whyThisDecision ?? priorityStep.reasoning}
              </Text>
            </View>
          </GlassCard>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: SPACING.md },
  header: { marginBottom: SPACING.xl, marginTop: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 2, marginTop: 4 },
  
  inputCard: { padding: 16, marginBottom: SPACING.xl },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
  input: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 8, 
    padding: 12, 
    color: COLORS.white, 
    fontSize: 14, 
    minHeight: 80, 
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12
  },
  ingestBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  ingestBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  ingestBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  structuredCard: { padding: 16, marginBottom: SPACING.xl, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
  structuredGrid: { gap: 12, marginTop: 8 },
  gridRow: { flexDirection: 'row', gap: 16 },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  gridValue: { fontSize: 12, fontWeight: '900', color: COLORS.white },
  
  flowSection: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 16, marginLeft: 8 },
  
  agentContainer: { flexDirection: 'row', marginBottom: 0 },
  timelineColumn: { width: 30, alignItems: 'center' },
  timelineNode: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: -4, marginBottom: -4, opacity: 0.5, zIndex: 1 },
  
  agentCard: { flex: 1, padding: 12, marginBottom: 16, marginLeft: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  agentCardActive: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 8 },
  agentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  agentName: { fontSize: 12, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  agentDesc: { fontSize: 10, color: COLORS.textMuted, marginBottom: 8 },
  
  reasoningBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, marginTop: 4, gap: 10 },
  reasoningText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, lineHeight: 16, fontWeight: '500' },
  
  telemetryGrid: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, gap: 4 },
  telemetryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  telemetryLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted },
  telemetryValue: { fontSize: 9, fontWeight: '900', color: COLORS.white },

  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, width: 65 },
  confBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  confBarFill: { height: '100%', borderRadius: 2 },
  confValue: { fontSize: 10, fontWeight: '900', color: COLORS.white, width: 30, textAlign: 'right' },
  
  timeText: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'right', fontWeight: '600' },
  
  finalCard: { padding: 16, borderWidth: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', gap: 12 },
  finalGrid: { flexDirection: 'row', gap: 16 },
  finalItem: { flex: 1 },
  finalLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
  finalValue: { fontSize: 14, fontWeight: '900', color: COLORS.white },

  infoSection: { gap: 6 },
  infoSectionTitle: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  traceText: { fontSize: 10, color: COLORS.textDim, fontWeight: '700' },

  finalReasoning: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18, fontStyle: 'italic', padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6 },

  templatesContainer: { marginTop: 4, marginBottom: 12 },
  templatesLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  templatesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  templateBadge: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  templateBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary }
});
