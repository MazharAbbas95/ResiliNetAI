import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';
import { Ionicons } from '@expo/vector-icons';

const TIMELINE = [
  { id: 'NOW', label: 'NOW', offset: 0 },
  { id: '+30M', label: '+30 MIN', offset: 1 },
  { id: '+1H', label: '+1 HOUR', offset: 2 },
  { id: '+2H', label: '+2 HOURS', offset: 3 },
];

export const PredictiveTimelinePanel = () => {
  const currentStatus = useSimulationDemoStore(state => state.predictiveTimeline);

  const currentIndex = TIMELINE.findIndex(t => t.id === currentStatus);

  return (
    <GlassCard style={styles.container} intensity={25}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={14} color="#AF52DE" />
        <Text style={styles.title}>PREDICTIVE EXPANSION TIMELINE</Text>
      </View>
      <View style={styles.timelineRow}>
        {TIMELINE.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <View key={step.id} style={styles.stepContainer}>
              <View style={[
                styles.dot, 
                isActive && styles.dotActive,
                isCurrent && styles.dotCurrent
              ]} />
              <Text style={[
                styles.label, 
                isActive && styles.labelActive,
                isCurrent && styles.labelCurrent
              ]}>{step.label}</Text>
              {index < TIMELINE.length - 1 && (
                <View style={[
                  styles.line, 
                  index < currentIndex && styles.lineActive
                ]} />
              )}
            </View>
          );
        })}
      </View>
    </GlassCard>
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
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  dotActive: {
    backgroundColor: '#AF52DE',
  },
  dotCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: -2,
    backgroundColor: '#00E6FF',
    shadowColor: '#00E6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  line: {
    position: 'absolute',
    top: 4,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  },
  lineActive: {
    backgroundColor: '#AF52DE',
  },
  label: {
    position: 'absolute',
    top: 18,
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    width: 60,
  },
  labelActive: {
    color: '#AF52DE',
  },
  labelCurrent: {
    color: '#00E6FF',
    fontSize: 9,
  }
});
