import { HazardSeverity } from '../../../services/signalAggregatorService.ts';

// ─── Severity Normalizer ──────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, HazardSeverity> = {
  // Direct matches
  low:      'low',
  medium:   'medium',
  high:     'high',
  critical: 'critical',
  // Aliases
  severe:   'high',
  danger:   'critical',
  warning:  'medium',
  moderate: 'medium',
  extreme:  'critical',
  minor:    'low',
  minor_:   'low',
};

export function normalizeSeverity(raw: string): HazardSeverity {
  const key = raw?.toLowerCase?.().trim() ?? '';
  return SEVERITY_MAP[key] ?? 'medium'; // Default to medium on unknown
}

// ─── Text Normalizer ──────────────────────────────────────────────────────────

export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .replace(/[^\x20-\x7E\u0600-\u06FF\s]/g, '') // keep ASCII + Urdu range
    .substring(0, 500);              // cap length
}

// ─── Timestamp Normalizer ─────────────────────────────────────────────────────

export function normalizeTimestamp(ts: unknown): number {
  if (typeof ts === 'number' && ts > 0) {
    // If in milliseconds (> year 2001 in ms), convert to seconds
    return ts > 9_999_999_999 ? Math.floor(ts / 1000) : ts;
  }
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) return Math.floor(parsed / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

// ─── Coordinate Normalizer ────────────────────────────────────────────────────

export function normalizeCoordinate(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}
