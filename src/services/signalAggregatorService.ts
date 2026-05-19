// ─── Types ────────────────────────────────────────────────────────────────────

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RainfallIntensity = 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';

export interface AggregatedSignalPayload {
  location: {
    lat: number;
    lng: number;
    region: string;
  };
  weather: {
    condition: string;
    rainfall: number;
    humidity: number;
    windSpeed: number;
    cloudCoverage: number;
    temperature: number;
    stormWarning: boolean;
  };
  socialSignals: Array<{
    id: string;
    text: string;
    severity: string;
    locationName: string;
  }>;
  signalSummary: {
    weatherSeverity: HazardSeverity;
    socialSeverity: HazardSeverity;
    overallSeverity: HazardSeverity;
    signalDensity: number;
    rainfallIntensity: RainfallIntensity;
  };
  metadata: {
    generatedAt: number;
    sourceCount: number;
    aggregationMs: number;
  };
}

// ─── Thresholds (mirrors backend) ─────────────────────────────────────────────

const RAINFALL_THRESHOLDS = {
  none:     0,
  light:    2.5,
  moderate: 7.5,
  heavy:    15,
  extreme:  30,
};

const SEVERITY_RANK: Record<HazardSeverity, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

// ─── Local Aggregation (offline / no backend) ─────────────────────────────────

import { weatherService } from '@services/weatherService';
import { socialSignalService } from '@services/socialSignalService';

function classifyRainfall(mm: number): RainfallIntensity {
  if (mm <= RAINFALL_THRESHOLDS.none)     return 'none';
  if (mm <= RAINFALL_THRESHOLDS.light)    return 'light';
  if (mm <= RAINFALL_THRESHOLDS.moderate) return 'moderate';
  if (mm <= RAINFALL_THRESHOLDS.heavy)    return 'heavy';
  return 'extreme';
}

function scoreWeatherSeverity(w: AggregatedSignalPayload['weather']): HazardSeverity {
  if (w.rainfall >= RAINFALL_THRESHOLDS.extreme || w.windSpeed > 80)  return 'critical';
  if (w.rainfall >= RAINFALL_THRESHOLDS.heavy   || w.windSpeed > 50 || w.stormWarning) return 'high';
  if (w.rainfall >= RAINFALL_THRESHOLDS.moderate || w.windSpeed > 30)  return 'medium';
  return 'low';
}

function scoreSocialSeverity(count: number, criticalCount: number, highCount: number): HazardSeverity {
  if (criticalCount >= 2 || count >= 8)        return 'critical';
  if (criticalCount >= 1 || highCount >= 3)    return 'high';
  if (highCount >= 1 || count >= 4)            return 'medium';
  return 'low';
}

function mergeOverall(wSev: HazardSeverity, sSev: HazardSeverity, rainfall: number, reportCount: number): HazardSeverity {
  const wR = SEVERITY_RANK[wSev];
  const sR = SEVERITY_RANK[sSev];
  if (rainfall >= RAINFALL_THRESHOLDS.heavy && reportCount >= 3) {
    const elevated = Math.min(4, Math.max(wR, sR) + 1);
    return (Object.keys(SEVERITY_RANK) as HazardSeverity[]).find((k) => SEVERITY_RANK[k] === elevated) ?? 'critical';
  }
  return wR >= sR ? wSev : sSev;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const signalAggregatorService = {
  /**
   * Aggregates weather + social signals locally on the device.
   * Mirrors the backend aggregation logic for offline-safe operation.
   */
  aggregate: async (lat: number, lng: number): Promise<AggregatedSignalPayload> => {
    const startMs = Date.now();
    console.log(`[SignalAggregator] Aggregating signals for lat=${lat} lng=${lng}`);

    const [weatherRaw, socialResponse] = await Promise.all([
      weatherService.getWeatherForLocation(lat, lng),
      socialSignalService.getReports(),
    ]);

    const w = weatherRaw.weather;
    const allSocial = socialResponse.reports;

    // Strict Weather Gate: If weather is safe (rainfall is 0 and no storm warnings),
    // simulated/mock reports are completely ignored to prevent false escalations.
    const isWeatherThreatActive = w.rainfall > 0 || weatherRaw.alerts.length > 0;
    const social = allSocial.filter(r => {
      if (r.source === 'mock-social' && !isWeatherThreatActive) {
        return false;
      }
      return true;
    });

    const weather: AggregatedSignalPayload['weather'] = {
      condition:     w.condition,
      rainfall:      w.rainfall,
      humidity:      w.humidity,
      windSpeed:     w.windSpeed,
      cloudCoverage: w.cloudCoverage,
      temperature:   w.temperature,
      stormWarning:  weatherRaw.alerts.length > 0,
    };

    const criticalCount = social.filter((r) => r.severity === 'critical').length;
    const highCount     = social.filter((r) => r.severity === 'high').length;

    const weatherSeverity = scoreWeatherSeverity(weather);
    const socialSeverity  = scoreSocialSeverity(social.length, criticalCount, highCount);
    const overallSeverity = mergeOverall(weatherSeverity, socialSeverity, weather.rainfall, social.length);

    const aggregationMs = Date.now() - startMs;

    console.log(`[SignalAggregator] ✅ Complete in ${aggregationMs}ms | overall=${overallSeverity} | reports=${social.length} (filtered from ${allSocial.length})`);

    return {
      location: { lat, lng, region: 'Lahore' },
      weather,
      socialSignals: social.map((r) => ({
        id: r.id,
        text: r.text,
        severity: r.severity,
        locationName: r.locationName,
      })),
      signalSummary: {
        weatherSeverity,
        socialSeverity,
        overallSeverity,
        signalDensity:     social.length,
        rainfallIntensity: classifyRainfall(weather.rainfall),
      },
      metadata: {
        generatedAt:    Math.floor(Date.now() / 1000),
        sourceCount:    2,
        aggregationMs,
      },
    };
  },
};
