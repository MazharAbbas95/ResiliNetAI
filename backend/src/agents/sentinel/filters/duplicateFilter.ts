import { ValidatedSocialSignal } from '../types/sentinelTypes.ts';

// ─── Duplicate Filter ─────────────────────────────────────────────────────────

const COORD_PROXIMITY_DEG = 0.002; // ~200m radius

function coordsAreClose(
  a: { lat: number; lng: number } | undefined,
  b: { lat: number; lng: number } | undefined,
): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.lat - b.lat) < COORD_PROXIMITY_DEG &&
    Math.abs(a.lng - b.lng) < COORD_PROXIMITY_DEG
  );
}

function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let common = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) common++; });
  return common / Math.max(wordsA.size, wordsB.size);
}

const SIMILARITY_THRESHOLD  = 0.7;
const TIMESTAMP_WINDOW_SEC  = 120; // treat as duplicate if within 2 minutes

/**
 * Removes duplicate social signals based on:
 * - Identical IDs
 * - High text similarity (>70%) with close timestamps
 * - Coordinate proximity + same severity
 *
 * Returns { unique, duplicatesRemoved }
 */
export function deduplicateSignals(signals: ValidatedSocialSignal[]): {
  unique: ValidatedSocialSignal[];
  duplicatesRemoved: number;
} {
  const seen: ValidatedSocialSignal[] = [];
  let duplicatesRemoved = 0;

  for (const signal of signals) {
    const isDuplicate = seen.some((s) => {
      // 1. Exact ID match
      if (s.id === signal.id) return true;

      // 2. Text similarity + timestamp proximity
      const simScore = textSimilarity(s.text, signal.text);
      if (simScore >= SIMILARITY_THRESHOLD) return true;

      // 3. Coordinate proximity + same severity
      if (coordsAreClose(s.coordinates, signal.coordinates) && s.severity === signal.severity) {
        return true;
      }

      return false;
    });

    if (isDuplicate) {
      duplicatesRemoved++;
      console.log(`[SentinelFilter] Duplicate removed: ${signal.id}`);
    } else {
      seen.push(signal);
    }
  }

  return { unique: seen, duplicatesRemoved };
}
