import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@theme';

export const SimulationResponderLayer = () => {
  const activeResponders = useSimulationDemoStore(state => state.activeResponders);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ambulance': return 'medical';
      case 'fire': return 'flame';
      case 'rescue': return 'airplane';
      default: return 'car';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'ambulance': return '#FF3B30';
      case 'fire': return '#FF9500';
      case 'rescue': return '#00E6FF';
      default: return '#34C759';
    }
  };

  return (
    <>
      {activeResponders.map(responder => {
        const color = getColor(responder.type);
        return (
          <Marker
            key={responder.id}
            coordinate={responder.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerContainer, { borderColor: color }]}>
              <Ionicons name={getIcon(responder.type) as any} size={14} color={color} />
            </View>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{responder.eta}</Text>
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  etaBadge: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  etaText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  }
});
