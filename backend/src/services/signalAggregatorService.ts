import { WeatherService } from './weatherService';
import { socialSignalService, NormalizedFloodReport, SignalSeverity } from './socialSignalService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';

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
    severity: SignalSeverity;
    locationName: string;
  }>;
  signalSummary: {
    weatherSeverity: HazardSeverity;
    socialSeverity: HazardSeverity;
    overallSeverity: HazardSeverity;
    signalDensity: number;
    rainfallIntensity: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';
  };
  metadata: {
    generatedAt: number;
    sourceCount: number;
    aggregationMs: number;
  };
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const RAINFALL_THRESHOLDS = {
  none:     0,
  light:    2.5,
  moderate: 7.5,
  heavy:    15,
  extreme:  30,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyRainfall(mm: number): 'none' | 'light' | 'moderate' | 'heavy' | 'extreme' {
  if (mm <= RAINFALL_THRESHOLDS.none)    return 'none';
  if (mm <= RAINFALL_THRESHOLDS.light)   return 'light';
  if (mm <= RAINFALL_THRESHOLDS.moderate) return 'moderate';
  if (mm <= RAINFALL_THRESHOLDS.heavy)   return 'heavy';
  return 'extreme';
}

function scoreWeatherSeverity(weather: AggregatedSignalPayload['weather']): HazardSeverity {
  const rainfall = weather.rainfall;
  const windKph  = weather.windSpeed;
  const stormWarn = weather.stormWarning;

  if (rainfall >= RAINFALL_THRESHOLDS.extreme || windKph > 80)  return 'critical';
  if (rainfall >= RAINFALL_THRESHOLDS.heavy   || windKph > 50 || stormWarn) return 'high';
  if (rainfall >= RAINFALL_THRESHOLDS.moderate || windKph > 30)  return 'medium';
  return 'low';
}

const SEVERITY_RANK: Record<HazardSeverity, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

function scoreSocialSeverity(reports: NormalizedFloodReport[]): HazardSeverity {
  if (!reports.length) return 'low';

  const criticalCount = reports.filter((r) => r.severity === 'critical').length;
  const highCount     = reports.filter((r) => r.severity === 'high').length;

  if (criticalCount >= 2 || reports.length >= 8)  return 'critical';
  if (criticalCount >= 1 || highCount >= 3)        return 'high';
  if (highCount >= 1 || reports.length >= 4)       return 'medium';
  return 'low';
}

function mergeOverallSeverity(
  weatherSev: HazardSeverity,
  socialSev: HazardSeverity,
  rainfall: number,
  reportCount: number,
): HazardSeverity {
  const wRank = SEVERITY_RANK[weatherSev];
  const sRank = SEVERITY_RANK[socialSev];

  // Elevation rule: heavy rain + multiple social reports → bump up one level
  if (rainfall >= RAINFALL_THRESHOLDS.heavy && reportCount >= 3) {
    const elevated = Math.min(4, Math.max(wRank, sRank) + 1);
    return (Object.keys(SEVERITY_RANK) as HazardSeverity[]).find(
      (k) => SEVERITY_RANK[k] === elevated,
    ) ?? 'critical';
  }

  // Default: take the higher of the two
  return wRank >= sRank ? weatherSev : socialSev;
}

function resolveRegionName(lat: number, lng: number): string {
  // Coarse bounding-box lookup for Pakistan regions
  if (lat > 31.0 && lat < 32.2 && lng > 73.8 && lng < 75.0) return 'Lahore';
  if (lat > 33.3 && lat < 33.8 && lng > 72.8 && lng < 73.3) return 'Rawalpindi';
  if (lat > 24.6 && lat < 25.1 && lng > 66.8 && lng < 67.4) return 'Karachi';
  if (lat > 33.5 && lat < 34.0 && lng > 72.9 && lng < 73.5) return 'Islamabad';
  if (lat > 31.3 && lat < 31.8 && lng > 72.9 && lng < 74.0) return 'Faisalabad';
  return 'Pakistan';
}

// ─── Signal Aggregator Service ────────────────────────────────────────────────

export class SignalAggregatorService {
  /**
   * Aggregates weather + social signals into a single unified hazard payload.
   * All fusion logic is deterministic — no LLM involvement at this stage.
   */
  static async aggregate(lat: number, lng: number): Promise<AggregatedSignalPayload> {
    const startMs = Date.now();

    console.log(`[SignalAggregator] Starting aggregation for lat=${lat} lng=${lng}`);

    // ── Fetch signals in parallel ──────────────────────────────────────────
    const [weatherRaw, socialReports] = await Promise.all([
      WeatherService.getLocalWeather({ latitude: lat, longitude: lng }),
      Promise.resolve(socialSignalService.getAllReports()),
    ]);

    console.log(`[SignalAggregator] Weather fetched | Social reports: ${socialReports.length}`);

    // ── Normalize weather ──────────────────────────────────────────────────
    const weather: AggregatedSignalPayload['weather'] = {
      condition:     weatherRaw.weather?.condition     ?? 'Unknown',
      rainfall:      weatherRaw.weather?.rainfall      ?? 0,
      humidity:      weatherRaw.weather?.humidity      ?? 0,
      windSpeed:     weatherRaw.weather?.windSpeed     ?? 0,
      cloudCoverage: weatherRaw.weather?.cloudCoverage ?? 0,
      temperature:   weatherRaw.weather?.temperature   ?? 0,
      stormWarning:  (weatherRaw.alerts?.length ?? 0) > 0,
    };

    // ── Severity scoring ───────────────────────────────────────────────────
    const weatherSeverity = scoreWeatherSeverity(weather);
    const socialSeverity  = scoreSocialSeverity(socialReports);
    const overallSeverity = mergeOverallSeverity(
      weatherSeverity, socialSeverity, weather.rainfall, socialReports.length,
    );

    console.log(
      `[SignalAggregator] Severity → weather=${weatherSeverity} social=${socialSeverity} overall=${overallSeverity}`,
    );

    const aggregationMs = Date.now() - startMs;
    console.log(`[SignalAggregator] Aggregation complete in ${aggregationMs}ms`);

    return {
      location: {
        lat,
        lng,
        region: resolveRegionName(lat, lng),
      },
      weather,
      socialSignals: socialReports.map((r) => ({
        id:           r.id,
        text:         r.text,
        severity:     r.severity,
        locationName: r.locationName,
      })),
      signalSummary: {
        weatherSeverity,
        socialSeverity,
        overallSeverity,
        signalDensity:      socialReports.length,
        rainfallIntensity:  classifyRainfall(weather.rainfall),
      },
      metadata: {
        generatedAt:    Math.floor(Date.now() / 1000),
        sourceCount:    2, // weather + social
        aggregationMs,
      },
    };
  }
}
