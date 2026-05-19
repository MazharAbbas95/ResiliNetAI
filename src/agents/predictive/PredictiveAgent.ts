import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';

export interface PredictiveSimulation {
  isPrediction: boolean; // Always true — clearly NOT current facts
  horizon: string;
  scenarioLabel: string;
  escalationProbability: number;
  predictedSeverityIfUnaddressed: 'low' | 'medium' | 'high' | 'critical';
  expansionRateKmPerHr: number;
  timeToEscalationMinutes: number | null;
  simulationNote: string; // Explicit disclaimer that this is a model, not verified fact
}

export class PredictiveAgent implements Agent {
  public id = 'predictive';
  public name = 'PREDICTIVE';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const reasoning: string[] = [];
    const actions: string[] = [];

    const confidence: number = task.payload?.confidence
      ?? task.payload?.verificationResult?.fusedConfidence ?? 0;
    const tacticalResult = task.payload?.tacticalResult;
    const verificationResult = task.payload?.verificationResult;

    const rainfall = verificationResult?.conditionA_weatherAnomaly ? 1 : 0;
    const strategy = tacticalResult?.strategy ?? 'MONITOR';

    reasoning.push('Predictive Simulator: IMPORTANT — outputs below are probabilistic FORECASTS, not verified current facts.');

    // Only model futures for verified signals
    if (!verificationResult?.conditionD_approved) {
      const sim: PredictiveSimulation = {
        isPrediction: true,
        horizon: 'N/A',
        scenarioLabel: 'No Prediction',
        escalationProbability: 0,
        predictedSeverityIfUnaddressed: 'low',
        expansionRateKmPerHr: 0,
        timeToEscalationMinutes: null,
        simulationNote: 'Prediction model skipped: Signal was not verified. No future risk model generated.',
      };
      reasoning.push('No prediction model generated — unverified signal cannot anchor a reliable forecast.');
      return {
        success: true,
        confidence,
        requiresVerification: false,
        requiresEscalation: false,
        nextAgent: 'TACTICAL',
        reasoning,
        actions: ['Predictive simulation skipped: Unverified signal.'],
        memoryUpdates: [{ type: 'PREDICTIVE_SIMULATION', simulation: sim }],
        timestamp: Date.now(),
      };
    }

    // Base escalation probability from confidence + strategy
    const trendWeight = strategy === 'IMMEDIATE_RESPONSE' ? 0.90
      : strategy === 'PREPARE_EVACUATION' ? 0.65
      : strategy === 'CAUTION' ? 0.40
      : 0.15;

    const expansionRate = rainfall ? trendWeight * 1.2 : trendWeight * 0.4;
    const escalationProbability = Math.min(0.95, trendWeight * 0.7 + confidence * 0.3);
    const timeToEscalation = escalationProbability > 0.6
      ? Math.round(30 - (escalationProbability - 0.6) * 50)
      : null;

    let predictedSeverity: PredictiveSimulation['predictedSeverityIfUnaddressed'] = 'low';
    if (escalationProbability >= 0.80) predictedSeverity = 'critical';
    else if (escalationProbability >= 0.60) predictedSeverity = 'high';
    else if (escalationProbability >= 0.40) predictedSeverity = 'medium';

    const simulation: PredictiveSimulation = {
      isPrediction: true,
      horizon: '6-hour forecast window',
      scenarioLabel: strategy === 'IMMEDIATE_RESPONSE' ? 'Rapid Escalation Scenario'
        : strategy === 'PREPARE_EVACUATION' ? 'Progressive Deterioration Scenario'
        : 'Stable-to-Moderate Risk Scenario',
      escalationProbability,
      predictedSeverityIfUnaddressed: predictedSeverity,
      expansionRateKmPerHr: parseFloat(expansionRate.toFixed(2)),
      timeToEscalationMinutes: timeToEscalation,
      simulationNote: `[SIMULATION ONLY] This is a probabilistic model based on ${(confidence * 100).toFixed(0)}% verified confidence. It does NOT represent a confirmed hazard. Monitor verified data sources for ground truth updates.`,
    };

    reasoning.push(`Scenario: ${simulation.scenarioLabel}`);
    reasoning.push(`Escalation probability (6-hour): ${(escalationProbability * 100).toFixed(0)}%`);
    reasoning.push(`Predicted severity if unaddressed: ${predictedSeverity.toUpperCase()}`);
    if (timeToEscalation) reasoning.push(`Estimated time to escalation threshold: ${timeToEscalation} minutes`);
    reasoning.push(`⚠ DISCLAIMER: ${simulation.simulationNote}`);

    actions.push(`Forecast generated: ${simulation.scenarioLabel}`);
    actions.push(`Expansion rate modelled at ${simulation.expansionRateKmPerHr} km/hr`);

    return {
      success: true,
      confidence: escalationProbability,
      requiresVerification: false,
      requiresEscalation: escalationProbability > 0.75,
      nextAgent: 'TACTICAL',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'PREDICTIVE_SIMULATION', simulation }],
      eventType: escalationProbability > 0.75 ? 'EARLY_WARNING_TRIGGERED' : 'PREDICTION_UPDATED',
      timestamp: Date.now(),
    };
  }
}

export const predictiveAgent = new PredictiveAgent();
