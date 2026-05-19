import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { Shelter } from '@appTypes/intelligence';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '@theme';
import { Ionicons } from '@expo/vector-icons';

interface ShelterMarkerProps {
  shelter: Shelter;
}

export const ShelterMarker: React.FC<ShelterMarkerProps> = ({ shelter }) => {
  return (
    <Marker
      coordinate={shelter.location}
      tracksViewChanges={false} // Performance optimization
    >
      <View style={[styles.marker, { backgroundColor: shelter.operationalStatus === 'Open' ? COLORS.success : COLORS.warning }]}>
        <Ionicons name="home" size={12} color={COLORS.text} />
      </View>
      
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.name}>{shelter.name}</Text>
          <Text style={styles.status}>{shelter.operationalStatus} • {shelter.occupancy}/{shelter.capacity} capacity</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  callout: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 150,
  },
  name: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  status: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
