import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { EmergencyPlace } from '../../store/placesStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@theme';

interface Props {
  place: EmergencyPlace;
  onPress: (place: EmergencyPlace) => void;
}

export const EmergencyFacilityMarker = ({ place, onPress }: Props) => {
  const getIcon = () => {
    switch (place.type) {
      case 'hospital': return 'medical';
      case 'police': return 'shield';
      case 'fire': return 'flame';
      default: return 'business';
    }
  };

  const getColor = () => {
    if (place.safetyStatus === 'UNSAFE') return '#FF3B30';
    if (place.safetyStatus === 'CAUTION') return '#FF9500';
    return place.type === 'hospital' ? '#007AFF' : '#34C759';
  };

  return (
    <Marker
      coordinate={place.location}
      onPress={() => onPress(place)}
      tracksViewChanges={false}
    >
      <View style={[styles.container, { backgroundColor: getColor() }]}>
        <Ionicons name={getIcon()} size={14} color="#FFF" />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
