import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@theme';
import { GlassCard } from '../ui/GlassCard';
import { AgentStep, AgentStepStatus } from '../../store/orchestrationStore';
import { Ionicons } from '@expo/vector-icons';

interface AgentNodeProps {
  step: AgentStep;
  isActive: boolean;
}

export const AgentNode: React.FC<AgentNodeProps> = ({ step, isActive }) => {
  const getAgentMetadata = (id: string) => {
    switch (id) {
      case 'aggregator':
        return {
          title: 'CROWD FILTER ENGINE',
          objective: 'Filtering and structured parsing of unstructured community signals',
          icon: 'cloud-download-outline',
          color: '#00FFFF', // Cyan
          glow: 'rgba(0, 255, 255, 0.4)',
          details: 'Extracting location coordinates and checking text credibility logs'
        };
      case 'sentinel':
        return {
          title: 'SENTINEL DETECTOR',
          objective: 'Active weather telemetry & sensor scanning sweeps',
          icon: 'radio-outline',
          color: '#00E6FF', // Electric Blue
          glow: 'rgba(0, 230, 255, 0.4)',
          details: 'Monitoring wind vectors, rain anomalies, and environment instability'
        };
      case 'verification':
        return {
          title: 'VERIFICATION FUSION',
          objective: 'Coordinating physical sensors with crowd-submitted credibility indices',
          icon: 'shield-checkmark-outline',
          color: '#34C759', // Emerald Green
          glow: 'rgba(52, 199, 89, 0.4)',
          details: 'Fusing weather context & nearby community reports for anomaly check'
        };
      case 'analyst':
        return {
          title: 'ANALYST THREAT MODELER',
          objective: 'Mapping hazard parameters and drawing tactical safety vectors',
          icon: 'analytics-outline',
          color: '#FF9500', // Vibrant Amber
          glow: 'rgba(255, 149, 0, 0.4)',
          details: 'Synthesizing coordinate coordinates and assessing severity indices'
        };
      case 'predictive':
        return {
          title: 'PREDICTIVE SIMULATOR',
          objective: 'Simulating dynamic water flow and forecasting future hazard areas',
          icon: 'trending-up-outline',
          color: '#AF52DE', // Purple
          glow: 'rgba(175, 82, 222, 0.4)',
          details: 'Modeling environment escalation indices over 24-hour window'
        };
      case 'routing':
        return {
          title: 'CORRIDOR NAVIGATION ROUTER',
          objective: 'Computing safe detours and secure evacuation corridors',
          icon: 'map-outline',
          color: '#5AC8FA', // Sky Blue
          glow: 'rgba(90, 200, 250, 0.4)',
          details: 'Verifying route geometry intersections and boundary limits'
        };
      case 'alert':
        return {
          title: 'TACTICAL ALERTER',
          objective: 'Triggering authorized safety notifications and alert updates',
          icon: 'megaphone-outline',
          color: '#FF3B30', // Deep Orange/Red
          glow: 'rgba(255, 59, 48, 0.4)',
          details: 'Broadcasting verified alerts after passing fusion gating'
        };
      default:
        return {
          title: 'COORDINATION ORCHESTRATOR',
          objective: 'Aligning agent tasks and monitoring replay-safe state logs',
          icon: 'sync-outline',
          color: '#E5C158',
          glow: 'rgba(229, 193, 88, 0.4)',
          details: 'Ensuring non-linear loop avoidance locks and sliding TTL'
        };
    }
  };

  const meta = getAgentMetadata(step.id);

  const getStatusColor = (status: AgentStepStatus) => {
    switch (status) {
      case 'processing': return meta.color;
      case 'completed':  return COLORS.success;
      case 'error':      return COLORS.critical;
      default:           return 'rgba(255, 255, 255, 0.08)';
    }
  };

  const cleanReasoning = (reasoning: string) => {
    return reasoning
      .replace(/\[\w+\]\s*/g, '') // remove bracket tags
      .replace(/Reject:\s*/g, 'Action: ') // clean reject logs
      .trim();
  };

  const renderFormattedOutput = (output: any) => {
    if (!output || typeof output !== 'object') return null;
    
    // Pick meaningful fields, avoid raw dumps
    const displayKeys = ['severity', 'confidence', 'trustScore', 'fusedTrust', 'locationName', 'distanceKm', 'blocked', 'suggestedAction'];
    const entries = Object.entries(output).filter(([key]) => displayKeys.includes(key));
    if (entries.length === 0) return null;
    
    return (
      <View style={styles.outputGrid}>
        {entries.map(([key, val]) => {
          let displayVal = '';
          if (typeof val === 'number' && val <= 1) {
            displayVal = `${(val * 100).toFixed(0)}%`;
          } else {
            displayVal = String(val).toUpperCase();
          }
          const cleanKey = key.replace(/([A-Z])/g, ' $1').toUpperCase();
          return (
            <View key={key} style={styles.outputItem}>
              <Text style={styles.outputKey}>{cleanKey}</Text>
              <Text style={styles.outputVal} numberOfLines={1}>{displayVal}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <GlassCard 
      style={StyleSheet.flatten([
        styles.container, 
        isActive && styles.activeContainer,
        isActive && { borderColor: meta.color + '50' }
      ])} 
      intensity={isActive ? 35 : 15}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: getStatusColor(step.status) + '15' }]}>
          <Ionicons name={meta.icon as any} size={16} color={getStatusColor(step.status)} />
        </View>
        <View style={styles.titleArea}>
          <Text style={[styles.name, { color: step.status === 'idle' ? COLORS.textDim : COLORS.white }]}>
            {meta.title}
          </Text>
          <Text style={styles.objectiveText} numberOfLines={2}>{meta.objective}</Text>
        </View>
        
        {step.status === 'processing' ? (
          <View style={[styles.badge, { backgroundColor: meta.color + '20' }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>SIMULATING...</Text>
          </View>
        ) : step.status === 'completed' ? (
          <View style={[styles.badge, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.success }]}>VERIFIED</Text>
          </View>
        ) : step.status === 'error' ? (
          <View style={[styles.badge, { backgroundColor: 'rgba(255,59,48,0.15)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.critical }]}>HALTED</Text>
          </View>
        ) : null}
      </View>

      {(step.status === 'completed' || step.status === 'processing' || step.status === 'error') && (
        <View style={styles.details}>
          {!!step.reasoning && (
            <View style={styles.reasoningBox}>
               <Text style={styles.reasoningLabel}>DECISION MATRIX NARRATIVE</Text>
               <Text style={styles.reasoningText}>{cleanReasoning(step.reasoning)}</Text>
            </View>
          )}

          {renderFormattedOutput(step.output)}

          {/* Dynamic Confidence Meter */}
          {(step.status === 'completed' || step.status === 'processing') && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>CONFIDENCE ALIGNMENT</Text>
                <Text style={[styles.confidenceVal, { color: meta.color }]}>
                  {((step.output?.confidence ?? step.output?.fusedTrust ?? (isActive ? 0.65 : 0.85)) * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.meterBg}>
                <View style={[
                  styles.meterFill, 
                  { 
                    backgroundColor: meta.color, 
                    width: `${((step.output?.confidence ?? step.output?.fusedTrust ?? (isActive ? 0.65 : 0.85)) * 100).toFixed(0)}%` 
                  } as any
                ]} />
              </View>
            </View>
          )}

          {/* ── RICH PERFORMANCE STATE MATRIX ── */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
               <Text style={styles.metaLabel}>LATENCY: <Text style={styles.metaValue}>{step.processingTimeMs || 8}ms</Text></Text>
               <Text style={styles.metaLabel}>FLOW NODE: <Text style={[styles.metaValue, { color: meta.color }]}>{meta.title.split(' ')[0]}</Text></Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
  },
  activeContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  objectiveText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    lineHeight: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  details: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  reasoningBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  reasoningLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
    lineHeight: 14,
  },
  outputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  outputItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  outputKey: {
    fontSize: 6.5,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.3,
  },
  outputVal: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  confidenceContainer: {
    gap: 4,
    marginVertical: 2,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.5,
  },
  confidenceVal: {
    fontSize: 10,
    fontWeight: '900',
  },
  meterBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  metaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.25)',
  },
  metaValue: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
