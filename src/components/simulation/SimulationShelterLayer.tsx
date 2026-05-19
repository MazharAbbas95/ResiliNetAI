import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useSimulationDemoStore } from '../../store/simulationDemoStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@theme';

export const SimulationShelterLayer = () => {
  const activeShelters = useSimulationDemoStore(state => state.activeShelters);

  return (
    <>
      {activeShelters.map(shelter => {
        const capacityPercentage = Math.round((shelter.occupancy / shelter.capacity) * 100);
        const capacityColor = capacityPercentage > 90 ? '#FF3B30' : capacityPercentage > 75 ? '#FF9500' : '#34C759';

        return (
          <Marker
            key={shelter.id}
            coordinate={shelter.coordinate}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>{shelter.eta}</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="medical" size={16} color={COLORS.white} />
              </View>
              <View style={styles.infoBadge}>
                <Text style={styles.infoText}>{shelter.name}</Text>
                <Text style={[styles.capText, { color: capacityColor }]}>
                  {shelter.occupancy} / {shelter.capacity}
                </Text>
              </View>
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBadge: {
    backgroundColor: '#00E6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  etaText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  infoBadge: {
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    alignItems: 'center',
  },
  infoText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  capText: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  }
});
