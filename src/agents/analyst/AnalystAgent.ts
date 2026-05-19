import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { weatherService } from '../../services/weatherService';
import { VerificationFusionResult } from '../verification/VerificationAgent';

export interface AnalystInterpretation {
  severityEstimate: 'low' | 'medium' | 'high' | 'critical';
  confidenceExplanation: string;
  uncertaintyFactors: string[];
  evidenceWeights: {
    weather: number;
    reports: number;
    textSignal: number;
    verification: number;
  };
  riskNarrative: string;
  canEscalate: boolean;
}

export class AnalystAgent implements Agent {
  public id = 'analyst';
  public name = 'ANALYST';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const reasoning: string[] = [];
    const actions: string[] = [];
    const uncertaintyFactors: string[] = [];

    const lat = task.payload?.lat ?? 0;
    const lng = task.payload?.lng ?? 0;
    const verificationResult: VerificationFusionResult | undefined = task.payload?.verificationResult;
    const normalizedSignal = task.payload?.normalizedSignal;
    const crowdResult = task.payload?.crowdResult;
    const shieldResult = task.payload?.shieldResult;

    reasoning.push('Analyst: Beginning strategic evidence interpretation...');

    // Only proceed if shield passed
    if (shieldResult && !shieldResult.passed) {
      reasoning.push('Analyst: Shield Module suppressed signal. No strategic interpretation warranted.');
      return {
        success: false,
        confidence: 0,
        requiresVerification: false,
        requiresEscalation: false,
        reasoning,
        actions: ['Analysis blocked — Shield Module suppressed this signal.'],
        memoryUpdates: [],
        timestamp: Date.now(),
      };
    }

    const fusedConfidence = verificationResult?.fusedConfidence ?? 0;
    const conditionA = verificationResult?.conditionA_weatherAnomaly ?? false;
    const conditionB = verificationResult?.conditionB_multipleReports ?? false;
    const uniqueReports = crowdResult?.uniqueReportCount ?? 0;
    const textConfidence = normalizedSignal?.rawConfidence ?? 0.10;

    // Fetch live weather for analyst narrative
    let rainfall = 0;
    let weatherNarrative = 'Weather data unavailable';
    try {
      const weather = await weatherService.getWeatherForLocation(lat, lng);
      rainfall = weather.weather.rainfall ?? 0;
      const wind = weather.weather.windSpeed ?? 0;
      const storm = weather.weather.stormProbability ?? 0;
      weatherNarrative = `${weather.weather.condition} | ${rainfall.toFixed(1)}mm/hr rain | ${wind}km/h wind | ${storm}% storm risk`;
    } catch (e) {
      uncertaintyFactors.push('Weather data unavailable — analysis based on crowd signals only');
    }

    // Evidence weight breakdown
    const evidenceWeights = {
      weather: conditionA ? Math.min(0.40, (rainfall / 20) * 0.4) : 0,
      reports: Math.min(0.35, uniqueReports * 0.10),
      textSignal: textConfidence * 0.20,
      verification: (verificationResult?.conditionD_approved ? 0.05 : 0),
    };
    const totalWeightedEvidence = Object.values(evidenceWeights).reduce((a, b) => a + b, 0);

    // Severity estimation — only from hard evidence
    let severityEstimate: AnalystInterpretation['severityEstimate'] = 'low';
    if (totalWeightedEvidence >= 0.75 && conditionA && conditionB) {
      severityEstimate = 'critical';
    } else if (totalWeightedEvidence >= 0.55 && conditionA) {
      severityEstimate = 'high';
    } else if (totalWeightedEvidence >= 0.35) {
      severityEstimate = 'medium';
    }

    // Uncertainty factors
    if (!conditionA) uncertaintyFactors.push('No verified weather anomaly from API');
    if (!conditionB) uncertaintyFactors.push('Insufficient corroborating reports');
    if (textConfidence < 0.30) uncertaintyFactors.push('Text-only signal confidence is low');
    if (uniqueReports === 0) uncertaintyFactors.push('Zero independent crowd reports detected');

    const canEscalate = fusedConfidence >= 0.55 && conditionA && conditionB;

    const confidenceExplanation = `Fused evidence score: ${(fusedConfidence * 100).toFixed(0)}%. `
      + `Weather: ${(evidenceWeights.weather * 100).toFixed(0)}pts, `
      + `Reports: ${(evidenceWeights.reports * 100).toFixed(0)}pts, `
      + `Text: ${(evidenceWeights.textSignal * 100).toFixed(0)}pts. `
      + (canEscalate ? 'Evidence sufficient for escalation.' : 'Evidence insufficient for escalation.');

    const riskNarrative = canEscalate
      ? `${severityEstimate.toUpperCase()} risk detected. ${weatherNarrative}. ${uniqueReports} corroborating crowd report(s) confirm environmental anomaly.`
      : `Risk classified as ${severityEstimate.toUpperCase()} but evidence is insufficient for emergency escalation. ${uncertaintyFactors[0] ?? 'Monitoring recommended.'}`;

    reasoning.push(`Severity estimate: ${severityEstimate.toUpperCase()}`);
    reasoning.push(confidenceExplanation);
    if (uncertaintyFactors.length > 0) {
      reasoning.push(`Uncertainty factors: ${uncertaintyFactors.join(' | ')}`);
    }
    reasoning.push(riskNarrative);

    actions.push(`Strategic severity assessed as: ${severityEstimate.toUpperCase()}`);
    actions.push(canEscalate ? 'Escalation pathway opened.' : 'Escalation blocked — insufficient evidence.');

    const interpretation: AnalystInterpretation = {
      severityEstimate,
      confidenceExplanation,
      uncertaintyFactors,
      evidenceWeights,
      riskNarrative,
      canEscalate,
    };

    return {
      success: canEscalate,
      confidence: fusedConfidence,
      requiresVerification: false,
      requiresEscalation: canEscalate && severityEstimate === 'critical',
      nextAgent: 'SHIELD',
      feedbackAgent: 'SENTINEL',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'ANALYST_RESULT', interpretation }],
      eventType: canEscalate ? 'ALERT_ESCALATED' : 'CONFIDENCE_UPDATED',
      timestamp: Date.now(),
    };
  }
}

export const analystAgent = new AnalystAgent();
