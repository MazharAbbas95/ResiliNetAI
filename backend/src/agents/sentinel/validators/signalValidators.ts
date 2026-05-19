import { HazardSeverity } from '../../../services/signalAggregatorService.ts';

// ─── Coordinate Validator ─────────────────────────────────────────────────────

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng))                           return false;
  if (lat < -90  || lat > 90)                             return false;
  if (lng < -180 || lng > 180)                            return false;
  return true;
}

// ─── Weather Validator ────────────────────────────────────────────────────────

export interface WeatherValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validateWeatherPayload(w: any): WeatherValidationResult {
  const reasons: string[] = [];

  if (typeof w !== 'object' || w === null) {
    return { valid: false, reasons: ['Weather payload is null or not an object'] };
  }

  if (typeof w.rainfall !== 'number' || w.rainfall < 0 || w.rainfall > 500) {
    reasons.push(`Rainfall out of range: ${w.rainfall}`);
  }
  if (typeof w.humidity !== 'number' || w.humidity < 0 || w.humidity > 100) {
    reasons.push(`Humidity out of range: ${w.humidity}`);
  }
  if (typeof w.windSpeed !== 'number' || w.windSpeed < 0 || w.windSpeed > 400) {
    reasons.push(`WindSpeed out of range: ${w.windSpeed}`);
  }
  if (typeof w.cloudCoverage !== 'number' || w.cloudCoverage < 0 || w.cloudCoverage > 100) {
    reasons.push(`CloudCoverage out of range: ${w.cloudCoverage}`);
  }
  if (typeof w.temperature !== 'number' || w.temperature < -90 || w.temperature > 60) {
    reasons.push(`Temperature out of range: ${w.temperature}`);
  }
  if (!w.condition || typeof w.condition !== 'string') {
    reasons.push('Missing or invalid condition string');
  }

  return { valid: reasons.length === 0, reasons };
}

// ─── Social Signal Validator ──────────────────────────────────────────────────

const VALID_SEVERITIES: HazardSeverity[] = ['low', 'medium', 'high', 'critical'];

export function isValidSocialSignal(signal: any): boolean {
  if (typeof signal !== 'object' || signal === null) return false;
  if (!signal.id || typeof signal.id !== 'string')   return false;
  if (!signal.text || typeof signal.text !== 'string' || signal.text.trim().length < 5) return false;
  if (!VALID_SEVERITIES.includes(signal.severity))   return false;
  return true;
}
