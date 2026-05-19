import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { FloodReport, SignalSeverity } from '@services/socialSignalService';
import { COLORS } from '@theme';

interface Props {
  reports: FloodReport[];
}

const SEVERITY_CONFIG: Record<SignalSeverity, { color: string; label: string }> = {
  low:      { color: '#22C55E', label: 'Low Risk'        },
  medium:   { color: '#EAB308', label: 'Medium Risk'     },
  high:     { color: '#F97316', label: 'High Risk'       },
  critical: { color: '#EF4444', label: 'Critical Danger' },
};

const formatRelativeTime = (timestamp: number): string => {
  const diffSec = Math.floor(Date.now() / 1000) - timestamp;
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export const SocialSignalLayer: React.FC<Props> = ({ reports }) => {
  return (
    <>
      {reports.map((report) => {
        const cfg = SEVERITY_CONFIG[report.severity] ?? SEVERITY_CONFIG.medium;

        return (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.coordinates.lat, longitude: report.coordinates.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            {/* Minimal Tactical Threat Dot */}
            <View style={styles.markerContainer}>
               <View style={[styles.pulseRing, { backgroundColor: cfg.color }]} />
               <View style={[styles.coreDot, { backgroundColor: cfg.color }]} />
            </View>

            {/* Callout shown on tap */}
            <Callout tooltip>
              <View style={styles.callout}>
                <View style={styles.calloutHeader}>
                  <Text style={[styles.calloutSeverity, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.calloutTime}>{formatRelativeTime(report.timestamp)}</Text>
                </View>
                <Text style={styles.calloutText}>{report.text}</Text>
                <Text style={styles.calloutLocation}>📍 {report.locationName.toUpperCase()}</Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.3,
  },
  coreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  callout: {
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 240,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutSeverity: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  calloutTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: '700',
  },
  calloutText: {
    color: '#FFF',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  calloutLocation: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
