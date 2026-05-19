import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { COLORS, SPACING } from '@theme';
import { GlassCard } from '../ui/GlassCard';
import { useCommandStore } from '../../store/commandStore';
import { Ionicons } from '@expo/vector-icons';

export const TerminalConsole = () => {
  const { commands } = useCommandStore();

  const getEventDescription = (command: string, response: string) => {
    const lowerCmd = command.toLowerCase();
    
    if (lowerCmd.includes('sentinel')) {
      return {
        title: 'ENVIRONMENTAL METRIC INGESTED',
        desc: 'Sentinel detector mapped grid coordinate telemetry & active weather fronts.',
        icon: 'radio-outline',
        color: '#00E6FF'
      };
    }
    if (lowerCmd.includes('verification')) {
      return {
        title: 'GROUND-TRUTH VALIDATION COMPLETED',
        desc: 'Verification agent verified nearby crowd signals against physical sensors.',
        icon: 'shield-checkmark-outline',
        color: '#34C759'
      };
    }
    if (lowerCmd.includes('analyst')) {
      return {
        title: 'HAZARD GEOMETRY CORRIDORS RESOLVED',
        desc: 'Analyst computed safe coordinate bounds & incident hazard polygons.',
        icon: 'analytics-outline',
        color: '#FF9500'
      };
    }
    if (lowerCmd.includes('predictive')) {
      return {
        title: 'ESCALATION DYNAMICS MODEL SPLIT',
        desc: 'Predictive simulator ran scenarios modeling flood progression profiles.',
        icon: 'trending-up-outline',
        color: '#AF52DE'
      };
    }
    if (lowerCmd.includes('routing')) {
      return {
        title: 'TACTICAL ROUTING DETOUR GENERATED',
        desc: 'Corridor router computed detour vectors and bypassed block coordinates.',
        icon: 'map-outline',
        color: '#5AC8FA'
      };
    }
    if (lowerCmd.includes('alert')) {
      return {
        title: 'TACTICAL WARNING DISPATCH INITIATED',
        desc: 'Warning engine broadcasted critical community notices after fusion gate pass.',
        icon: 'megaphone-outline',
        color: '#FF3B30'
      };
    }
    if (lowerCmd.includes('init')) {
      return {
        title: 'COORDINATION ORCHESTRATOR ONLINE',
        desc: 'System initiated high-fidelity multi-agent tactical stabilization pipeline.',
        icon: 'sync-outline',
        color: '#E5C158'
      };
    }
    
    return {
      title: 'TACTICAL EVENT SYNCHRONIZATION',
      desc: response.replace(/Payload:\s*/gi, 'Operational parameters: ').substring(0, 80),
      icon: 'pulse-outline',
      color: COLORS.primary
    };
  };

  return (
    <GlassCard style={styles.container} intensity={25}>
      <View style={styles.header}>
        <View style={styles.headerIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.title}>AI TACTICAL INGESTION FEED</Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activeText}>LIVE SYNC</Text>
        </View>
      </View>
      <ScrollView 
        contentContainerStyle={styles.list} 
        showsVerticalScrollIndicator={false}
      >
        {commands.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wifi-outline" size={24} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>AWAITING TELEMETRY STIMULATION SIGNALS</Text>
          </View>
        ) : (
          [...commands].reverse().map(cmd => {
            const ui = getEventDescription(cmd.command, cmd.response);
            return (
              <View key={cmd.id} style={styles.line}>
                <View style={[styles.iconBox, { backgroundColor: ui.color + '15' }]}>
                  <Ionicons name={ui.icon as any} size={14} color={ui.color} />
                </View>
                <View style={styles.content}>
                  <View style={styles.row}>
                    <Text style={[styles.eventTitle, { color: ui.color }]}>{ui.title}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(cmd.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.desc}>{ui.desc}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  header: {
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  headerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  activePill: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    color: '#34C759',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  list: {
    padding: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    gap: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  line: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 7.5,
    color: COLORS.textDim,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  desc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 12,
  }
});
