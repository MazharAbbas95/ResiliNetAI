import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';

export type ResponseStrategy = 'MONITOR' | 'CAUTION' | 'PREPARE_EVACUATION' | 'IMMEDIATE_RESPONSE';

export interface TacticalAnalysis {
  strategy: ResponseStrategy;
  strategyReason: string;
  estimatedSeverity: 'low' | 'medium' | 'high' | 'critical';
  affectedAreaKm: number;
  recommendedActions: string[];
  timeToAction: string;
  uncertaintyNote: string;
}

export class TacticalAnalyzerAgent implements Agent {
  public id = 'tactical';
  public name = 'TACTICAL';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const reasoning: string[] = [];
    const actions: string[] = [];

    const confidence: number = task.payload?.confidence ?? task.payload?.verificationResult?.fusedConfidence ?? 0;
    const verificationResult = task.payload?.verificationResult;
    const shieldResult = task.payload?.shieldResult;
    const normalizedSignal = task.payload?.normalizedSignal;

    // Only allowed to run if Shield passed
    if (shieldResult && !shieldResult.passed) {
      reasoning.push('Tactical Analyzer: Shield Module blocked escalation. No strategy required.');
      return {
        success: false,
        confidence,
        requiresVerification: false,
        requiresEscalation: false,
        reasoning,
        actions: ['No tactical action required — signal was suppressed by Shield Module.'],
        memoryUpdates: [{ type: 'TACTICAL_RESULT', strategy: 'MONITOR', reason: 'Shield blocked' }],
        timestamp: Date.now(),
      };
    }

    const rainfall = verificationResult ? (verificationResult.conditionA_weatherAnomaly ? 1 : 0) : 0;
    const reportCount = task.payload?.crowdResult?.uniqueReportCount ?? 0;
    const signalType = normalizedSignal?.type ?? 'general_observation';

    // Strategy determination: evidence-weighted
    let strategy: ResponseStrategy = 'MONITOR';
    let estimatedSeverity: TacticalAnalysis['estimatedSeverity'] = 'low';
    let timeToAction = 'No immediate action required';
    let uncertaintyNote = '';

    if (confidence >= 0.80 && rainfall && reportCount >= 3) {
      strategy = 'IMMEDIATE_RESPONSE';
      estimatedSeverity = 'critical';
      timeToAction = 'Immediate — within 30 minutes';
      reasoning.push('HIGH CONFIDENCE + weather + multiple reports → IMMEDIATE_RESPONSE recommended.');
    } else if (confidence >= 0.65 && rainfall) {
      strategy = 'PREPARE_EVACUATION';
      estimatedSeverity = 'high';
      timeToAction = 'Prepare within 1–2 hours';
      reasoning.push('MODERATE-HIGH CONFIDENCE + weather anomaly → Prepare evacuation corridors.');
    } else if (confidence >= 0.45) {
      strategy = 'CAUTION';
      estimatedSeverity = 'medium';
      timeToAction = 'Issue caution advisory — monitor closely';
      reasoning.push('MODERATE CONFIDENCE → Issue CAUTION advisory. Continue monitoring.');
    } else {
      strategy = 'MONITOR';
      estimatedSeverity = 'low';
      timeToAction = 'Continue passive monitoring only';
      uncertaintyNote = 'Confidence is below actionable threshold. Escalation not warranted.';
      reasoning.push(`LOW CONFIDENCE (${(confidence * 100).toFixed(0)}%) → MONITOR only. No emergency action.`);
    }

    // Affected area based on signal type
    const affectedAreaKm = signalType === 'emergency_distress' ? 2.0
      : signalType === 'flood_report' ? 1.5
      : signalType === 'road_incident' ? 0.5
      : 0.2;

    const recommendedActions: string[] = [];
    if (strategy === 'IMMEDIATE_RESPONSE') {
      recommendedActions.push('Activate emergency response teams');
      recommendedActions.push('Issue public alert via all channels');
      recommendedActions.push('Deploy shelters along safe corridors');
    } else if (strategy === 'PREPARE_EVACUATION') {
      recommendedActions.push('Pre-position emergency resources');
      recommendedActions.push('Alert relevant authorities');
      recommendedActions.push('Identify nearest shelter locations');
    } else if (strategy === 'CAUTION') {
      recommendedActions.push('Issue weather advisory notification');
      recommendedActions.push('Increase monitoring frequency');
    } else {
      recommendedActions.push('Log observation for trend analysis');
      recommendedActions.push('No public notification warranted');
    }

    const result: TacticalAnalysis = {
      strategy,
      strategyReason: reasoning[0] ?? 'Evidence-based determination',
      estimatedSeverity,
      affectedAreaKm,
      recommendedActions,
      timeToAction,
      uncertaintyNote: uncertaintyNote || `Based on ${(confidence * 100).toFixed(0)}% fused confidence score.`,
    };

    actions.push(`Strategy: ${strategy} | Severity: ${estimatedSeverity.toUpperCase()}`);
    actions.push(`Recommended actions: ${recommendedActions[0]}`);

    return {
      success: true,
      confidence,
      requiresVerification: false,
      requiresEscalation: strategy === 'IMMEDIATE_RESPONSE' || strategy === 'PREPARE_EVACUATION',
      nextAgent: 'PRIORITY',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'TACTICAL_RESULT', result }],
      eventType: strategy === 'IMMEDIATE_RESPONSE' ? 'ALERT_ESCALATED' : 'CONFIDENCE_UPDATED',
      timestamp: Date.now(),
    };
  }
}

export const tacticalAnalyzerAgent = new TacticalAnalyzerAgent();
