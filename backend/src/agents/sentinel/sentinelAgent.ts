import { AggregatedSignalPayload, HazardSeverity } from '../../services/signalAggregatorService';
import { SentinelPayload, ValidatedSocialSignal, ValidatedWeather, SentinelStatus, SourceIntegrity } from './types/sentinelTypes';
import { validateWeatherPayload, isValidSocialSignal, isValidCoordinate } from './validators/signalValidators';
import { normalizeSeverity, normalizeText, normalizeTimestamp } from './normalizers/signalNormalizers';
import { deduplicateSignals } from './filters/duplicateFilter';

// ─── Confidence Scoring ───────────────────────────────────────────────────────

function computeSignalConfidence(signal: any): number {
  let score = 0.5; // base

  // More text detail → higher confidence
  const wordCount = signal.text?.split(/\s+/).length ?? 0;
  if (wordCount > 5)  score += 0.10;
  if (wordCount > 10) score += 0.10;

  // Higher severity → slightly more weight (crowdsourced urgency)
  if (signal.severity === 'high')     score += 0.10;
  if (signal.severity === 'critical') score += 0.15;

  // Has location name → more credible
  if (signal.locationName && signal.locationName.length > 2) score += 0.07;

  return Math.min(1.0, parseFloat(score.toFixed(2)));
}

// ─── Weather Clamper ──────────────────────────────────────────────────────────

function clampWeather(w: any): ValidatedWeather & { severity: HazardSeverity } {
  const rainfall      = Math.max(0, Math.min(500, Number(w.rainfall)      || 0));
  const humidity      = Math.max(0, Math.min(100, Number(w.humidity)      || 0));
  const windSpeed     = Math.max(0, Math.min(400, Number(w.windSpeed)     || 0));
  const cloudCoverage = Math.max(0, Math.min(100, Number(w.cloudCoverage) || 0));
  const temperature   = Math.max(-90, Math.min(60, Number(w.temperature)  || 0));
  const stormWarning  = Boolean(w.stormWarning);
  const condition     = typeof w.condition === 'string' ? w.condition.trim() : 'Unknown';

  // Derive severity from clamped values
  let severity: HazardSeverity = 'low';
  if (rainfall >= 30  || windSpeed > 80)                          severity = 'critical';
  else if (rainfall >= 15 || windSpeed > 50 || stormWarning)      severity = 'high';
  else if (rainfall >= 7.5 || windSpeed > 30)                     severity = 'medium';

  return { condition, rainfall, humidity, windSpeed, cloudCoverage, temperature, stormWarning, severity };
}

// ─── Source Integrity Assessment ──────────────────────────────────────────────

function assessIntegrity(removedCount: number, totalInput: number): SourceIntegrity {
  if (totalInput === 0) return 'corrupted';
  const removalRatio = removedCount / totalInput;
  if (removalRatio > 0.5) return 'degraded';
  if (removalRatio > 0.8) return 'corrupted';
  return 'stable';
}

// ─── Sentinel Agent ───────────────────────────────────────────────────────────

export class SentinelAgent {
  /**
   * Main entry point.
   * Receives aggregated payload → validates → normalizes → deduplicates → returns clean output.
   */
  static process(input: AggregatedSignalPayload): SentinelPayload {
    const startMs = Date.now();
    let removedCount    = 0;
    let normCount       = 0;

    console.log('[SentinelAgent] ▶ Processing started');

    // ── 1. Validate location ───────────────────────────────────────────────
    const lat = Number(input.location?.lat);
    const lng = Number(input.location?.lng);
    const locationValid = isValidCoordinate(lat, lng);

    if (!locationValid) {
      console.warn('[SentinelAgent] ⚠ Invalid location coordinates — using defaults');
    }

    // ── 2. Validate + clamp weather ───────────────────────────────────────
    const weatherValidation = validateWeatherPayload(input.weather);
    if (!weatherValidation.valid) {
      console.warn(`[SentinelAgent] ⚠ Weather issues: ${weatherValidation.reasons.join(', ')}`);
      normCount++;
    }
    const validatedWeather = clampWeather(input.weather ?? {});

    // ── 3. Validate + normalize social signals ────────────────────────────
    const rawSignals = input.socialSignals ?? [];
    const preFilterCount = rawSignals.length;

    const validSignals: ValidatedSocialSignal[] = [];

    for (const signal of rawSignals) {
      if (!isValidSocialSignal(signal)) {
        console.log(`[SentinelAgent] ✗ Invalid signal rejected: ${signal?.id ?? 'unknown'}`);
        removedCount++;
        continue;
      }

      const normalizedSeverity = normalizeSeverity(signal.severity);
      const normalizedText     = normalizeText(signal.text);

      if (normalizedSeverity !== signal.severity || normalizedText !== signal.text) {
        normCount++;
      }

      validSignals.push({
        id:           signal.id.trim(),
        text:         normalizedText,
        severity:     normalizedSeverity,
        locationName: signal.locationName?.trim() ?? 'Unknown',
        confidence:   computeSignalConfidence({ ...signal, severity: normalizedSeverity }),
      });
    }

    // ── 4. Deduplicate ────────────────────────────────────────────────────
    const { unique, duplicatesRemoved } = deduplicateSignals(validSignals);
    removedCount += duplicatesRemoved;

    console.log(
      `[SentinelAgent] Signals: ${preFilterCount} in → ${unique.length} clean | removed=${removedCount} dupes=${duplicatesRemoved} norms=${normCount}`,
    );

    // ── 5. Derive overall severity from cleaned data ───────────────────────
    const weatherSeverity  = validatedWeather.severity;
    const critCount = unique.filter((s) => s.severity === 'critical').length;
    const highCount = unique.filter((s) => s.severity === 'high').length;

    let socialSeverity: HazardSeverity = 'low';
    if (critCount >= 2 || unique.length >= 8)     socialSeverity = 'critical';
    else if (critCount >= 1 || highCount >= 3)    socialSeverity = 'high';
    else if (highCount >= 1 || unique.length >= 4) socialSeverity = 'medium';

    const RANK: Record<HazardSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const overallRank = Math.min(4, Math.max(RANK[weatherSeverity], RANK[socialSeverity]) +
      (validatedWeather.rainfall >= 15 && unique.length >= 3 ? 1 : 0));

    const overallSeverity = (Object.keys(RANK) as HazardSeverity[])
      .find((k) => RANK[k] === overallRank) ?? 'critical';

    // ── 6. Assess source integrity ─────────────────────────────────────────
    const integrity = assessIntegrity(removedCount, preFilterCount + 1 /* +1 weather */);

    const processingMs = Date.now() - startMs;
    const sentinelStatus: SentinelStatus = integrity === 'corrupted' ? 'failed'
      : integrity === 'degraded' ? 'partial' : 'validated';

    console.log(
      `[SentinelAgent] ✅ Done in ${processingMs}ms | status=${sentinelStatus} overall=${overallSeverity} integrity=${integrity}`,
    );

    return {
      sentinelStatus,
      location: {
        lat:    locationValid ? lat : 31.5204,
        lng:    locationValid ? lng : 74.3587,
        region: input.location?.region ?? 'Pakistan',
      },
      weather: validatedWeather,
      socialSignals: unique,
      signalSummary: {
        overallSeverity,
        weatherSeverity,
        socialSeverity,
        signalDensity: unique.length,
      },
      diagnostics: {
        removedSignals:        removedCount,
        duplicatesFiltered:    duplicatesRemoved,
        normalizationsApplied: normCount,
        processingMs,
      },
      metadata: {
        validatedAt:     Math.floor(Date.now() / 1000),
        removedSignals:  removedCount,
        sourceIntegrity: integrity,
      },
    };
  }
}
