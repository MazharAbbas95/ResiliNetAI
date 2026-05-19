import React, { useEffect, useState, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { agentEventBus } from '../../agents/core/AgentEvents';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

interface AgentActivity {
  id: string;
  agentName: string;
  action: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const AgentActivityOverlay = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  useEffect(() => {
    // Listen to generic agent events that carry lat/lng
    const handleEvent = (event: any) => {
      const lat = event.payload?.lat || event.payload?.latitude || event.payload?.center?.lat;
      const lng = event.payload?.lng || event.payload?.longitude || event.payload?.center?.lng;
      
      if (lat && lng) {
        setActivities(prev => {
          const newAct = {
            id: Math.random().toString(),
            agentName: event.sourceAgent,
            action: event.eventType,
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
          };
          return [...prev, newAct].slice(-5); // Keep max 5 concurrent activities
        });
      }
    };

    const subscriptions = [
      agentEventBus.subscribe('VERIFICATION_REQUIRED', handleEvent),
      agentEventBus.subscribe('REANALYZE_REQUIRED', handleEvent),
      agentEventBus.subscribe('ROUTE_REJECTED', handleEvent),
      agentEventBus.subscribe('ALERT_ESCALATED', handleEvent)
    ];

    const interval = setInterval(() => {
      const now = Date.now();
      setActivities(prev => prev.filter(a => now - a.timestamp < 10000));
    }, 2000);

    return () => {
      subscriptions.forEach(unsub => unsub());
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {activities.map(activity => (
        <AgentMarker key={activity.id} activity={activity} />
      ))}
    </>
  );
};

const AgentMarker = ({ activity }: { activity: AgentActivity }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(8000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  const getAgentColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('routing')) return COLORS.accent;
    if (n.includes('verification')) return COLORS.warning;
    if (n.includes('alert')) return COLORS.error;
    return COLORS.primary;
  };

  const getAgentIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('routing')) return 'git-branch';
    if (n.includes('verification')) return 'shield-checkmark';
    if (n.includes('alert')) return 'warning';
    return 'hardware-chip';
  };

  const color = getAgentColor(activity.agentName);

  return (
    <Marker
      coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={999}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={[styles.bubble, { borderColor: color }]}>
          <Ionicons name={getAgentIcon(activity.agentName) as any} size={14} color={color} />
          <Text style={[styles.agentName, { color }]}>{activity.agentName.toUpperCase()}</Text>
        </View>
        <View style={styles.pointerContainer}>
          <View style={[styles.pointer, { borderTopColor: color }]} />
        </View>
      </Animated.View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  agentName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  pointerContainer: {
    alignItems: 'center',
    height: 6,
    width: 10,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  }
});
