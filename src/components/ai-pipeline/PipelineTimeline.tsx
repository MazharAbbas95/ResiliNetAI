import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@theme';
import { PipelineLog } from '../../store/orchestrationStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  logs: PipelineLog[];
}

export const PipelineTimeline: React.FC<Props> = ({ logs }) => {
  const getNarrativeLog = (agent: string, message: string) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('raw text ingestion')) {
      return 'New unstructured community incident signal registered & queued for scanning.';
    }
    if (lowerMsg.includes('initiating reroute') || lowerMsg.includes('avoidance')) {
      return 'Hazard intersection verified on active transit route. Detour pathfinding initiated.';
    }
    if (lowerMsg.includes('insufficient evidence') || lowerMsg.includes('fails safety threshold')) {
      return 'Signal cross-validation failed. Environmental telemetry indicates safe baseline.';
    }
    if (lowerMsg.includes('ground verification failed') || lowerMsg.includes('rejected')) {
      return 'Signal marked as unverified anomaly and safely archived.';
    }
    if (lowerMsg.includes('approved') || lowerMsg.includes('passes safety')) {
      return 'Ground validation approved. Escalating coordinate threat indices.';
    }
    if (lowerMsg.includes('storm risk evaluated')) {
      return 'Environmental threat probability modeled and aligned with historical patterns.';
    }
    if (lowerMsg.includes('scanning telemetry') || lowerMsg.includes('radar')) {
      return 'Sentinel completed grid telemetry scan. Synchronized weather conditions.';
    }
    if (lowerMsg.includes('consensus challenge') || lowerMsg.includes('debate')) {
      return 'Consensus challenge triggered between agent nodes to align coordinate parameters.';
    }

    return message
      .replace(/\[\w+\]\s*/g, '')
      .replace(/resiliNet/gi, 'Tactical OS')
      .trim();
  };

  const getAgentColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'sentinel': return '#00E6FF';
      case 'verification': return '#34C759';
      case 'analyst': return '#FF9500';
      case 'predictive': return '#AF52DE';
      case 'routing': return '#5AC8FA';
      case 'alert': return '#FF3B30';
      default: return COLORS.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error':   return COLORS.critical;
      default:        return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="git-commit-outline" size={14} color="rgba(255,255,255,0.4)" />
        <Text style={styles.headerTitle}>TACTICAL LOG NARRATIVE</Text>
      </View>
      <View style={styles.listContent}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>AWAITING PIPELINE NARRATIVE ENTRIES</Text>
          </View>
        ) : (
          logs.slice().reverse().map((item) => (
            <View key={item.id} style={styles.logItem}>
               <Text style={styles.timestamp}>
                 {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </Text>
               <View style={styles.content}>
                  <Text style={[styles.agent, { color: getAgentColor(item.agent) }]}>
                    {item.agent.toUpperCase()} AGENT
                  </Text>
                  <Text style={styles.message}>{getNarrativeLog(item.agent, item.message)}</Text>
               </View>
               <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(15, 15, 15, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
  },
  listContent: {
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timestamp: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textDim,
    width: 60,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  agent: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  message: {
    fontSize: 9.5,
    color: COLORS.white,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 13,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  }
});
