import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@theme';
import { ScreenWrapper } from '@components/ui/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { WeatherCard } from '@components/dashboard/WeatherCard';
import { Ionicons } from '@expo/vector-icons';
import { useWeatherStore } from '@store/weatherStore';
import { useAnalystStore } from '@store/analystStore';
import { useOrchestrationStore } from '@store/orchestrationStore';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { MAP_STYLE_DARK } from '@components/map/mapStyle';

const IntelligenceHubScreen = () => {
  const weatherData = useWeatherStore((state) => state.weatherData);
  const analystData = useAnalystStore((state) => state.analysis);
  const logs = useOrchestrationStore((state) => state.logs);

  const isOffline = !weatherData || weatherData.weather.condition === 'Unknown';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>INTELLIGENCE HUB</Text>
            <Text style={styles.subtitle}>TACTICAL ENVIRONMENTAL MONITORING</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOffline ? 'rgba(255, 69, 58, 0.15)' : 'rgba(52, 199, 89, 0.15)' }]}>
            <View style={[styles.pulseDot, { backgroundColor: isOffline ? COLORS.critical : COLORS.success }]} />
            <Text style={[styles.statusText, { color: isOffline ? COLORS.critical : COLORS.success }]}>
              {isOffline ? 'OFFLINE / DISCONNECTED' : 'API CONNECTED'}
            </Text>
          </View>
        </View>

        {/* ── OFFLINE / DISCONNECTED WARNING BANNER ── */}
        {isOffline && (
          <GlassCard style={styles.warningCard} intensity={30}>
            <Ionicons name="alert-circle" size={24} color={COLORS.critical} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.warningTitle}>ENVIRONMENTAL DATA TEMPORARILY UNAVAILABLE</Text>
              <Text style={styles.warningDesc}>OpenWeather API disconnected or telemetry credentials offline. Relying strictly on local physical sensory models.</Text>
            </View>
          </GlassCard>
        )}

        {/* ── OPERATIONAL WEATHER MAP ── */}
        <GlassCard style={styles.mapCard}>
           <Text style={styles.sectionTitle}>TACTICAL WEATHER OVERLAY</Text>
           <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                customMapStyle={MAP_STYLE_DARK}
                initialRegion={{
                  latitude: 31.5204,
                  longitude: 74.3587,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              />
              <View style={styles.mapOverlay}>
                 <Text style={styles.mapRegion}>REGION: LAHORE CENTRAL</Text>
                 <Text style={styles.mapCoord}>31.5204° N, 74.3587° E</Text>
              </View>
           </View>
        </GlassCard>

        {/* ── WEATHER DASHBOARD GRID (9 VARIABLES) ── */}
        <Text style={styles.sectionTitle}>ATMOSPHERIC TELEMETRY MATRIX</Text>
        <View style={styles.grid}>
          <WeatherCard 
            label="Rainfall" 
            value={isOffline ? '--' : `${(weatherData?.weather.rainfall || 0).toFixed(1)}`} 
            unit="mm" 
            icon="rainy" 
            color={COLORS.primary} 
          />
          <WeatherCard 
            label="Temperature" 
            value={isOffline ? '--' : `${weatherData?.weather.temperature || 0}`} 
            unit="°C" 
            icon="thermometer" 
            color={COLORS.warning} 
          />
          <WeatherCard 
            label="Wind Speed" 
            value={isOffline ? '--' : `${weatherData?.weather.windSpeed || 0}`} 
            unit="km/h" 
            icon="speedometer" 
            color={COLORS.accent} 
          />
          <WeatherCard 
            label="Humidity" 
            value={isOffline ? '--' : `${weatherData?.weather.humidity || 0}`} 
            unit="%" 
            icon="water" 
            color={COLORS.primary} 
          />
          <WeatherCard 
            label="Pressure" 
            value={isOffline ? '--' : `${weatherData?.weather.pressure || 1013}`} 
            unit="hPa" 
            icon="compass" 
            color={COLORS.success} 
          />
          <WeatherCard 
            label="Visibility" 
            value={isOffline ? '--' : `${weatherData?.weather.visibility || 10}`} 
            unit="km" 
            icon="eye" 
            color={COLORS.accent} 
          />
          <WeatherCard 
            label="Storm Probability" 
            value={isOffline ? '--' : `${weatherData?.weather.stormProbability || 0}`} 
            unit="%" 
            icon="thunderstorm" 
            color={COLORS.critical} 
          />
          <WeatherCard 
            label="Air Quality Index" 
            value={isOffline ? 'UNKNOWN' : `${weatherData?.weather.airQuality || 'GOOD'}`} 
            unit="" 
            icon="cloud" 
            color={weatherData?.weather.airQuality === 'GOOD' ? COLORS.success : COLORS.warning} 
          />
          <WeatherCard 
            label="Stability State" 
            value={isOffline ? 'STABLE' : `${weatherData?.weather.environmentalStability || 'STABLE'}`} 
            unit="" 
            icon="shield" 
            color={weatherData?.weather.environmentalStability === 'UNSTABLE' ? COLORS.critical : COLORS.success} 
          />
        </View>

        {/* ── REALTIME INTELLIGENCE FEED ── */}
        <View style={styles.feedContainer}>
           <Text style={styles.sectionTitle}>REALTIME INTELLIGENCE STREAM</Text>
           {logs.slice(0, 5).map((log) => (
             <View key={log.id} style={styles.feedItem}>
                <View style={[styles.feedDot, { backgroundColor: getLogColor(log.status) }]} />
                <View style={styles.feedContent}>
                   <Text style={styles.feedAgent}>{log.agent.toUpperCase()}</Text>
                   <Text style={styles.feedMsg}>{log.message}</Text>
                </View>
                <Text style={styles.feedTime}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
             </View>
           ))}
        </View>

        {/* ── HAZARD DENSITY ── */}
        <GlassCard style={styles.densityCard}>
           <Text style={styles.sectionTitle}>HAZARD ESCALATION TRENDS</Text>
           <View style={styles.trendRow}>
              <View style={styles.trendItem}>
                 <Text style={styles.trendLabel}>DENSITY</Text>
                 <Text style={styles.trendValue}>{analystData?.hazardZones.length || 0} ZONES</Text>
              </View>
              <View style={styles.trendDivider} />
              <View style={styles.trendItem}>
                 <Text style={styles.trendLabel}>ESCALATION</Text>
                 <Text style={[styles.trendValue, { color: analystData?.escalationAnalysis.trend === 'increasing' ? COLORS.critical : COLORS.success }]}>
                    {analystData?.escalationAnalysis.trend.toUpperCase() || 'STABLE'}
                  </Text>
              </View>
           </View>
        </GlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const getLogColor = (status: string) => {
  switch (status) {
    case 'success': return COLORS.success;
    case 'error':   return COLORS.critical;
    case 'warning': return COLORS.warning;
    default:        return COLORS.primary;
  }
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  warningTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.critical,
    letterSpacing: 0.5,
  },
  warningDesc: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    lineHeight: 12,
    marginTop: 2,
  },
  mapCard: {
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 6,
  },
  mapRegion: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
  mapCoord: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  feedContainer: {
    marginBottom: 25,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  feedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedContent: {
    flex: 1,
  },
  feedAgent: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  feedMsg: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: 2,
  },
  feedTime: {
    fontSize: 8,
    color: COLORS.textDim,
    fontWeight: '700',
  },
  densityCard: {
    padding: 20,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
    gap: 6,
  },
  trendLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  trendDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});

export default IntelligenceHubScreen;
