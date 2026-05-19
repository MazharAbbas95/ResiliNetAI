import { SentinelPayload } from '../sentinel/types/sentinelTypes';
import { GeminiAnalysisPayload } from '../../services/geminiService';
import { UnifiedConfidencePayload } from '../../services/confidenceScoringService';
import { AnalystPayload, HazardZone, Severity, Trend } from './types/analystTypes';
import { clusterPoints } from './clustering/clusterDetection';
import { generatePolygonCoords } from './polygon/polygonGenerator';

export class AnalystAgent {
  /**
   * Primary entry point for the Analyst Agent.
   * Synthesizes all intelligence layers into a strategic hazard assessment.
   */
  static process(
    sentinel: SentinelPayload,
    ai: GeminiAnalysisPayload,
    confidence: UnifiedConfidencePayload
  ): AnalystPayload {
    const startMs = Date.now();

    // 1. Determine overall severity (Heuristic + AI weighted)
    const overallSeverity = this.deriveSeverity(sentinel, ai, confidence);

    // 2. Identify Hazard Zones through Clustering
    const socialPoints = sentinel.socialSignals
      .filter(s => s.coordinates)
      .map(s => ({ lat: s.coordinates!.lat, lng: s.coordinates!.lng }));
    
    // Add weather center if rainfall is high
    if (sentinel.weather.rainfall > 10) {
      socialPoints.push({ lat: sentinel.location.lat, lng: sentinel.location.lng });
    }

    const clusters = clusterPoints(socialPoints);
    const hazardZones: HazardZone[] = clusters.map((c, i) => ({
      zoneId: `zone-${String(i + 1).padStart(3, '0')}`,
      severity: this.mapScoreToSeverity(confidence.confidenceScore),
      confidence: confidence.confidenceScore,
      center: c.center,
      radius: c.radius,
      coordinates: generatePolygonCoords(c.center, c.radius + 100) // add buffer
    }));

    // 3. Analyze Escalation Trend
    const trendAnalysis = this.analyzeTrend(sentinel, confidence);

    // 4. Generate Recommendations
    const recommendations = {
      generatePolygons: hazardZones.length > 0 && confidence.confidenceScore > 50,
      enableGeoFence: overallSeverity === 'critical' || overallSeverity === 'high',
      prepareEmergencyRouting: overallSeverity === 'critical',
      dispatchReady: confidence.confidenceScore > 80
    };

    return {
      analystStatus: 'active',
      overallSeverity,
      confidenceScore: confidence.confidenceScore,
      hazardAssessment: {
        floodRisk: ai.hazardAssessment.overallSeverity,
        terrainRisk: this.mapScoreToSeverity(confidence.scoreBreakdown.terrainScore),
        socialDensity: this.mapScoreToSeverity(confidence.scoreBreakdown.socialScore),
        stormSeverity: sentinel.weather.stormWarning ? 'high' : 'medium'
      },
      hazardZones,
      escalationAnalysis: trendAnalysis,
      recommendations,
      metadata: {
        processedAt: Date.now(),
        analysisLatencyMs: Date.now() - startMs,
        regionsAnalyzed: [sentinel.location.region]
      }
    };
  }

  private static deriveSeverity(
    sentinel: SentinelPayload,
    ai: GeminiAnalysisPayload,
    confidence: UnifiedConfidencePayload
  ): Severity {
    // If AI says critical, and confidence is high, it's critical.
    if (ai.hazardAssessment.overallSeverity === 'critical' && confidence.confidenceScore > 70) {
      return 'critical';
    }
    return confidence.severity;
  }

  private static mapScoreToSeverity(score: number): Severity {
    if (score >= 76) return 'critical';
    if (score >= 51) return 'high';
    if (score >= 26) return 'medium';
    return 'low';
  }

  private static analyzeTrend(
    sentinel: SentinelPayload,
    confidence: UnifiedConfidencePayload
  ): { activeEscalation: boolean; trend: Trend; velocity: number } {
    let trend: Trend = 'stable';
    let velocity = 0.1;

    const isHighRain = sentinel.weather.rainfall > 15;
    const isHighDensity = sentinel.socialSignals.length > 8;

    if (isHighRain && isHighDensity) {
      trend = 'increasing';
      velocity = 0.8;
    } else if (isHighRain || isHighDensity) {
      trend = 'increasing';
      velocity = 0.4;
    }

    return {
      activeEscalation: trend === 'increasing',
      trend,
      velocity
    };
  }
}
