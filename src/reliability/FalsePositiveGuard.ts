import { WeatherData } from '../services/weatherService';
import { FloodReport } from '../services/socialSignalService';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  reason: string;
  contradictions: string[];
}

export const FalsePositiveGuard = {
  validateHazard: (
    report: Partial<FloodReport>,
    weather: WeatherData | null,
    confidence: number
  ): ValidationResult => {
    const contradictions: string[] = [];
    let validationScore = confidence;

    // 1. Weather Consistency Check
    if (weather) {
      const isRaining = weather.weather.rainfall > 0;
      const isReportFlooding = report.text?.toLowerCase().includes('flood');

      if (isReportFlooding && !isRaining && weather.weather.cloudCoverage < 50) {
        contradictions.push('Report indicates flooding but weather is clear (0mm rain).');
        validationScore -= 40;
      }
    }

    // 2. Confidence Threshold
    if (confidence < 50) {
      contradictions.push('Confidence score below reliability threshold.');
    }

    // 3. Location Plausibility
    if (report.coordinates && (report.coordinates.lat === 0 || report.coordinates.lng === 0)) {
      contradictions.push('Invalid or empty coordinates detected.');
      validationScore = 0;
    }

    // 4. Content Noise
    if (report.text && report.text.length < 10) {
      contradictions.push('Report content too brief for verification.');
      validationScore -= 20;
    }

    const isValid = validationScore >= 60 && contradictions.length === 0;

    return {
      isValid,
      score: Math.max(0, validationScore),
      reason: isValid ? 'High environmental consistency.' : 'Intelligence rejected due to contradictions.',
      contradictions
    };
  }
};
