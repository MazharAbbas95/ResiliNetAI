import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { weatherService } from '../../services/weatherService';
import { socialSignalService, getDistanceKm } from '../../services/socialSignalService';

export interface VerificationFusionResult {
  conditionA_weatherAnomaly: boolean;
  conditionB_multipleReports: boolean;
  conditionC_confidenceThreshold: boolean;
  conditionD_approved: boolean;
  fusedConfidence: number;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'MONITORING' | 'REJECTED';
  weatherSummary: string;
  evidenceSources: string[];
  contradictions: string[];
}

const VERIFICATION_THRESHOLD = 0.55;
const MIN_REPORTS_FOR_CORROBORATION = 2;

export class VerificationFusionAgent implements Agent {
  public id = 'verification';
  public name = 'VERIFICATION';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];
    const contradictions: string[] = [];
    const evidenceSources: string[] = [];

    const lat = task.payload?.lat ?? task.payload?.originalTask?.payload?.lat ?? 0;
    const lng = task.payload?.lng ?? task.payload?.originalTask?.payload?.lng ?? 0;
    const crowdResult = task.payload?.crowdResult;
    const normalizedSignal = task.payload?.normalizedSignal;
    const sentimentResult = task.payload?.sentimentResult;

    // ── Condition A: Real Weather Anomaly ──
    let conditionA = false;
    let rainfall = 0;
    let windSpeed = 0;
    let stormRisk = 0;
    let weatherSummary = 'No weather data';

    try {
      const weather = await weatherService.getWeatherForLocation(lat, lng);
      rainfall = weather.weather.rainfall ?? 0;
      windSpeed = weather.weather.windSpeed ?? 0;
      stormRisk = weather.weather.stormProbability ?? 0;
      const condition = weather.weather.condition;

      weatherSummary = `${condition} | Rain: ${rainfall.toFixed(1)}mm/hr | Wind: ${windSpeed}km/h | Storm Risk: ${stormRisk}%`;
      evidenceSources.push(`Weather API: ${condition}`);

      conditionA = rainfall > 5 || stormRisk > 35 || windSpeed > 40;
      reasoning.push(`Condition A (Weather Anomaly): ${conditionA ? '✓ PASSED' : '✗ FAILED'} — ${weatherSummary}`);

      if (!conditionA) {
        contradictions.push(`Weather API reports normal conditions (rainfall: ${rainfall}mm/hr, storm risk: ${stormRisk}%).`);
      }
    } catch (e) {
      reasoning.push('Condition A: Weather API unavailable. Cannot confirm anomaly.');
      conditionA = false;
      contradictions.push('Weather telemetry unavailable — cannot verify environmental claim.');
    }

    // ── Condition B: Multiple Corroborating Reports ──
    let conditionB = false;
    let nearbyReportCount = 0;

    try {
      const response = await socialSignalService.getReports();
      const nearbyReports = response.reports.filter(r => {
        const dist = getDistanceKm(lat, lng, r.coordinates.lat, r.coordinates.lng);
        return dist <= 5.0;
      });
      nearbyReportCount = nearbyReports.length + (crowdResult?.uniqueReportCount ?? 0);
      conditionB = nearbyReportCount >= MIN_REPORTS_FOR_CORROBORATION;
      evidenceSources.push(`Social signals: ${nearbyReportCount} report(s) within 5km`);
      reasoning.push(`Condition B (Multiple Reports): ${conditionB ? '✓ PASSED' : '✗ FAILED'} — ${nearbyReportCount} corroborating report(s) required: ${MIN_REPORTS_FOR_CORROBORATION}`);
      if (!conditionB) {
        contradictions.push(`Only ${nearbyReportCount} report(s) found. Minimum ${MIN_REPORTS_FOR_CORROBORATION} required for corroboration.`);
      }
    } catch (e) {
      reasoning.push('Condition B: Social signal service unavailable.');
    }

    // ── Fused Confidence Calculation ──
    // Weighted evidence scoring:
    // 40% weather severity, 35% report density, 25% normalized text confidence
    const weatherScore = Math.min(1.0, (rainfall / 20) * 0.5 + (stormRisk / 100) * 0.3 + (windSpeed / 60) * 0.2);
    const reportScore = Math.min(1.0, nearbyReportCount * 0.18);
    const textScore = normalizedSignal?.rawConfidence ?? 0.10;
    const sentimentBoost = sentimentResult?.urgencyScore ? sentimentResult.urgencyScore * 0.05 : 0; // Tiny context boost only

    const fusedConfidence = Math.min(
      1.0,
      weatherScore * 0.40 + reportScore * 0.35 + textScore * 0.20 + sentimentBoost
    );

    // ── Condition C: Confidence Threshold ──
    const conditionC = fusedConfidence >= VERIFICATION_THRESHOLD;
    reasoning.push(`Condition C (Confidence ≥ ${(VERIFICATION_THRESHOLD * 100).toFixed(0)}%): ${conditionC ? '✓ PASSED' : '✗ FAILED'} — Fused confidence: ${(fusedConfidence * 100).toFixed(0)}%`);
    reasoning.push(`Evidence weights → Weather: ${(weatherScore * 100).toFixed(0)}% | Reports: ${(reportScore * 100).toFixed(0)}% | Text: ${(textScore * 100).toFixed(0)}%`);

    // ── Condition D: Overall Verification Approval ──
    // All conditions A, B, and C must pass for verification
    const conditionD = conditionA && conditionB && conditionC;
    reasoning.push(`Condition D (Full Verification): ${conditionD ? '✓ APPROVED' : '✗ BLOCKED'}`);

    let verificationStatus: VerificationFusionResult['verificationStatus'];
    if (conditionD) {
      verificationStatus = 'VERIFIED';
      actions.push('Verification APPROVED. All evidence conditions satisfied.');
    } else if (fusedConfidence >= 0.30) {
      verificationStatus = 'MONITORING';
      actions.push('Verification MONITORING. Insufficient evidence for escalation — flagged for observation.');
    } else {
      verificationStatus = 'REJECTED';
      actions.push('Verification REJECTED. Evidence too weak. Escalation blocked.');
    }

    if (contradictions.length > 0) {
      reasoning.push(`Contradictions detected: ${contradictions.join(' | ')}`);
    }

    const result: VerificationFusionResult = {
      conditionA_weatherAnomaly: conditionA,
      conditionB_multipleReports: conditionB,
      conditionC_confidenceThreshold: conditionC,
      conditionD_approved: conditionD,
      fusedConfidence,
      verificationStatus,
      weatherSummary,
      evidenceSources,
      contradictions,
    };

    return {
      success: conditionD,
      confidence: fusedConfidence,
      requiresVerification: false,
      requiresEscalation: conditionD && fusedConfidence > 0.70,
      nextAgent: conditionD ? 'ANALYST' : undefined,
      feedbackAgent: 'ANALYST',
      reasoning,
      actions,
      memoryUpdates: [
        { type: 'VERIFICATION_RESULT', result },
        { verificationState: { [task.id]: conditionD ? 'verified' : 'rejected' } }
      ],
      eventType: conditionD ? 'SIGNAL_VALIDATED' : 'VERIFICATION_FAILED',
      timestamp: Date.now(),
    };
  }
}

export const verificationFusionAgent = new VerificationFusionAgent();
