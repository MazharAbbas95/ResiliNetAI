import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { UserLocation } from '@appTypes/geospatial';
import { COLORS } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafetyStore } from '../../store/safetyStore';

interface UserMarkerProps {
  location: UserLocation;
}

export const UserMarker: React.FC<UserMarkerProps> = ({ location }) => {
  const safetyState = useSafetyStore((state) => state.status.state);
  const rotation = location.heading ? `${location.heading}deg` : '0deg';

  const getMarkerColor = () => {
    switch (safetyState) {
      case 'CRITICAL': return '#FF3B30';
      case 'DANGER':   return '#FF3B30';
      case 'WARNING':  return '#FB6138';
      case 'CAUTION':  return '#FF9500';
      default:         return COLORS.primary;
    }
  };

  const markerColor = getMarkerColor();

  return (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
    >
      <View style={styles.container}>
        {(safetyState === 'DANGER' || safetyState === 'CRITICAL') && (
          <View style={[styles.dangerRing, { borderColor: markerColor }]} />
        )}
        <View style={styles.pulseContainer}>
          <View style={[styles.pulse, { backgroundColor: markerColor }]} />
        </View>
        <View style={[styles.marker, { backgroundColor: markerColor, transform: [{ rotate: rotation }] }]}>
          <Ionicons name="navigate" size={14} color="#FFF" />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  pulseContainer: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.3,
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
