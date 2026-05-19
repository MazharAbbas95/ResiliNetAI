import { HazardSeverity, AggregatedSignalPayload } from '../../../services/signalAggregatorService.ts';

// ─── Sentinel-specific Types ──────────────────────────────────────────────────

export type SentinelStatus = 'validated' | 'partial' | 'failed';
export type SourceIntegrity = 'stable' | 'degraded' | 'corrupted';

export interface ValidatedSocialSignal {
  id: string;
  text: string;
  severity: HazardSeverity;
  locationName: string;
  confidence: number;      // 0.0 – 1.0
  coordinates?: { lat: number; lng: number };
}

export interface ValidatedWeather {
  condition: string;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  cloudCoverage: number;
  temperature: number;
  stormWarning: boolean;
  severity: HazardSeverity;
}

export interface SentinelPayload {
  sentinelStatus: SentinelStatus;

  location: {
    lat: number;
    lng: number;
    region: string;
  };

  weather: ValidatedWeather;

  socialSignals: ValidatedSocialSignal[];

  signalSummary: {
    overallSeverity: HazardSeverity;
    weatherSeverity: HazardSeverity;
    socialSeverity:  HazardSeverity;
    signalDensity:   number;
  };

  diagnostics: {
    removedSignals:   number;
    duplicatesFiltered: number;
    normalizationsApplied: number;
    processingMs:     number;
  };

  metadata: {
    validatedAt:     number;
    removedSignals:  number;
    sourceIntegrity: SourceIntegrity;
  };
}

export interface SentinelProcessingContext {
  input:          AggregatedSignalPayload;
  removedCount:   number;
  dupCount:       number;
  normCount:      number;
  startMs:        number;
}
