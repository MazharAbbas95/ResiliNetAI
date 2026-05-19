import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@theme';
import { EmergencyPlace } from '../../store/placesStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationStore } from '../../store/navigationStore';

interface Props {
  place: EmergencyPlace;
  onClose: () => void;
}

export const EmergencyFacilityCard = ({ place, onClose }: Props) => {
  const { setRoute, setNavigationState } = useNavigationStore();

  const handleNavigate = () => {
    setNavigationState('CALCULATING');
    // Set destination - LiveMap will handle Directions API
    setRoute({
      distance: '...',
      duration: '...',
      coordinates: [],
      destination: place.location
    });
    onClose();
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={40}>
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.address} numberOfLines={1}>{place.address}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>SAFETY STATUS</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: place.safetyStatus === 'SAFE' ? '#34C759' : '#FF3B30' }]} />
              <Text style={[styles.statusText, { color: place.safetyStatus === 'SAFE' ? '#34C759' : '#FF3B30' }]}>
                {place.safetyStatus}
              </Text>
            </View>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.statLabel}>INFRASTRUCTURE</Text>
            <Text style={styles.statValue}>{place.type.toUpperCase()}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: place.safetyStatus === 'UNSAFE' ? 'rgba(255,59,48,0.2)' : COLORS.primary }]}
          onPress={handleNavigate}
          disabled={place.safetyStatus === 'UNSAFE'}
        >
          <Ionicons name="navigate" size={18} color="#FFF" />
          <Text style={styles.navBtnText}>NAVIGATE TO {place.safetyStatus === 'UNSAFE' ? 'DANGER' : 'FACILITY'}</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
  },
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleArea: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  closeBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 24,
  },
  stat: {
    gap: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '900',
  },
  navBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
