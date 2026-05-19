import { SentinelPayload } from '../agents/sentinel/types/sentinelTypes';
import { GeminiAnalysisPayload } from './geminiService';
import { TerrainVulnerability } from './terrainService';

export interface UnifiedConfidencePayload {
  confidenceScore: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  scoreBreakdown: {
    weatherScore: number;
    terrainScore: number;
    socialScore: number;
  };
  weightedContributions: {
    weather: number;
    terrain: number;
    social: number;
  };
  riskFactors: string[];
  recommendation: {
    generateHazardPolygon: boolean;
    triggerMonitoring: boolean;
  };
  timestamp: number;
}

export class ConfidenceScoringService {
  /**
   * Computes a deterministic hazard confidence score.
   * Formula: (Weather * 0.4) + (Terrain * 0.3) + (Social * 0.3)
   */
  static compute(
    sentinel: SentinelPayload,
    ai: GeminiAnalysisPayload,
    terrain: TerrainVulnerability
  ): UnifiedConfidencePayload {
    
    // 1. Calculate Weather Score (40%)
    const weather = sentinel.weather;
    let weatherScore = 0;
    
    // Rainfall contribution (max 50)
    weatherScore += Math.min(50, (weather.rainfall / 30) * 50); 
    // Wind and storm contribution (max 30)
    if (weather.stormWarning) weatherScore += 20;
    if (weather.windSpeed > 60) weatherScore += 10;
    // Condition contribution (max 20)
    if (['Rain', 'Thunderstorm', 'Drizzle'].includes(weather.condition)) weatherScore += 20;
    
    weatherScore = Math.min(100, weatherScore);

    // 2. Calculate Social Score (30%)
    const social = sentinel.signalSummary;
    let socialScore = 0;
    
    // Density contribution (max 50)
    socialScore += Math.min(50, (social.signalDensity / 10) * 50);
    // Severity contribution (max 50)
    if (social.socialSeverity === 'critical') socialScore += 50;
    else if (social.socialSeverity === 'high') socialScore += 35;
    else if (social.socialSeverity === 'medium') socialScore += 20;
    
    socialScore = Math.min(100, socialScore);

    // 3. Terrain Score (30%)
    const terrainScore = terrain.terrainScore;

    // Final Weighted Calculation
    const weatherContrib = weatherScore * 0.4;
    // Terrain risk is zero if weather is completely dry and storm-free
    const activeWeatherFactor = weather.rainfall > 0 || weather.stormWarning ? 1.0 : 0.0;
    const terrainContrib = terrainScore * 0.3 * activeWeatherFactor;
    const socialContrib  = socialScore * 0.3;
    
    const finalScore = Math.round(weatherContrib + terrainContrib + socialContrib);

    // Severity Classification
    let severity: UnifiedConfidencePayload['severity'] = 'low';
    if (finalScore >= 76) severity = 'critical';
    else if (finalScore >= 51) severity = 'high';
    else if (finalScore >= 26) severity = 'medium';

    // Aggregate Risk Factors
    const riskFactors = [
      ...terrain.terrainFactors,
      ...(weather.rainfall > 10 ? ['heavy rainfall activity'] : []),
      ...(social.signalDensity >= 5 ? ['high social reporting density'] : []),
      ...ai.hazardAssessment.riskFactors.slice(0, 2) // Top 2 from Gemini
    ];

    return {
      confidenceScore: finalScore,
      severity,
      scoreBreakdown: {
        weatherScore: Math.round(weatherScore),
        terrainScore: Math.round(terrainScore),
        socialScore: Math.round(socialScore)
      },
      weightedContributions: {
        weather: parseFloat(weatherContrib.toFixed(1)),
        terrain: parseFloat(terrainContrib.toFixed(1)),
        social: parseFloat(socialContrib.toFixed(1))
      },
      riskFactors,
      recommendation: {
        generateHazardPolygon: finalScore > 60,
        triggerMonitoring: finalScore > 30
      },
      timestamp: Date.now()
    };
  }
}
