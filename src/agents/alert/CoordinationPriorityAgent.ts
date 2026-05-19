import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { ResponseStrategy } from '../alert/TacticalAnalyzerAgent';

export type ResponsePriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW' | 'P4_OBSERVE';

export interface CoordinationPriorityResult {
  priority: ResponsePriority;
  priorityScore: number; // 0 - 100
  escalationApproved: boolean;
  finalVerifiedStatus: 'VERIFIED' | 'UNVERIFIED' | 'MONITORING' | 'REJECTED';
  evidenceSummary: string[];
  decisionTrace: string[];
  whyThisDecision: string;
}

const PRIORITY_THRESHOLDS: Record<ResponseStrategy, { priority: ResponsePriority; minConfidence: number }> = {
  IMMEDIATE_RESPONSE: { priority: 'P0_CRITICAL', minConfidence: 0.75 },
  PREPARE_EVACUATION: { priority: 'P1_HIGH', minConfidence: 0.60 },
  CAUTION: { priority: 'P2_MEDIUM', minConfidence: 0.40 },
  MONITOR: { priority: 'P3_LOW', minConfidence: 0.00 },
};

export class CoordinationPriorityAgent implements Agent {
  public id = 'priority';
  public name = 'PRIORITY';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const reasoning: string[] = [];
    const actions: string[] = [];
    const decisionTrace: string[] = [];

    const confidence: number = task.payload?.confidence
      ?? task.payload?.verificationResult?.fusedConfidence ?? 0;
    const verificationResult = task.payload?.verificationResult;
    const shieldResult = task.payload?.shieldResult;
    const tacticalResult = task.payload?.tacticalResult;
    const crowdResult = task.payload?.crowdResult;

    const strategy: ResponseStrategy = tacticalResult?.strategy ?? 'MONITOR';
    const verificationStatus = verificationResult?.verificationStatus ?? 'UNVERIFIED';
    const uniqueReports: number = crowdResult?.uniqueReportCount ?? 0;

    // Build decision trace
    decisionTrace.push(`Verification Status: ${verificationStatus}`);
    decisionTrace.push(`Fused Confidence: ${(confidence * 100).toFixed(0)}%`);
    decisionTrace.push(`Tactical Strategy: ${strategy}`);
    decisionTrace.push(`Shield Cleared: ${shieldResult?.passed ?? false}`);
    decisionTrace.push(`Unique Corroborating Reports: ${uniqueReports}`);

    // Priority determination
    const strategyConfig = PRIORITY_THRESHOLDS[strategy];
    let priority: ResponsePriority = strategyConfig.priority;
    let priorityScore = Math.round(confidence * 100);

    // Downgrade if confidence doesn't meet minimum for this strategy
    if (confidence < strategyConfig.minConfidence) {
      priority = 'P3_LOW';
      priorityScore = Math.min(30, priorityScore);
      decisionTrace.push(`Priority downgraded: confidence ${(confidence * 100).toFixed(0)}% < minimum ${(strategyConfig.minConfidence * 100).toFixed(0)}%`);
      reasoning.push(`Priority downgraded to P3_LOW — confidence below minimum for ${strategy}.`);
    }

    // Force P4_OBSERVE if shield blocked
    if (shieldResult && !shieldResult.passed) {
      priority = 'P4_OBSERVE';
      priorityScore = Math.min(15, priorityScore);
      decisionTrace.push('Priority forced to P4_OBSERVE: Shield Module suppressed escalation.');
      reasoning.push('Shield Module blocked this signal. Assigning observe-only priority.');
    }

    const escalationApproved = priority === 'P0_CRITICAL' || priority === 'P1_HIGH';
    const finalVerifiedStatus: CoordinationPriorityResult['finalVerifiedStatus'] =
      shieldResult?.passed === false ? 'REJECTED'
        : verificationStatus === 'VERIFIED' && escalationApproved ? 'VERIFIED'
        : priority === 'P4_OBSERVE' ? 'REJECTED'
        : priority === 'P3_LOW' ? 'MONITORING'
        : verificationStatus as any;

    // Build evidence summary
    const evidenceSummary: string[] = [];
    if (verificationResult?.evidenceSources) {
      evidenceSummary.push(...verificationResult.evidenceSources);
    }
    if (uniqueReports > 0) evidenceSummary.push(`${uniqueReports} crowd-sourced report(s)`);
    if (shieldResult?.passed) evidenceSummary.push('Shield Module: Passed all safety checks');

    // Human-readable explanation
    const whyThisDecision = priority === 'P0_CRITICAL'
      ? `Multiple verified sources, severe weather anomaly, and ${(confidence * 100).toFixed(0)}% fused confidence warranted critical response.`
      : priority === 'P1_HIGH'
      ? `High confidence (${(confidence * 100).toFixed(0)}%) with verified weather anomaly. Prepare evacuation recommended.`
      : priority === 'P2_MEDIUM'
      ? `Moderate confidence (${(confidence * 100).toFixed(0)}%). Issuing caution advisory. Continuing to monitor.`
      : priority === 'P3_LOW'
      ? `Low confidence (${(confidence * 100).toFixed(0)}%) or insufficient corroboration. Passive monitoring only.`
      : `Signal suppressed: ${shieldResult?.reason ?? 'Multiple safety checks failed'}. No escalation warranted.`;

    reasoning.push(`Final priority: ${priority} | Score: ${priorityScore}/100`);
    reasoning.push(`Escalation approved: ${escalationApproved}`);
    reasoning.push(whyThisDecision);

    actions.push(`Assigned priority: ${priority}`);
    actions.push(escalationApproved ? 'Releasing to Routing + Alert engines.' : 'No escalation — observation mode activated.');

    const result: CoordinationPriorityResult = {
      priority,
      priorityScore,
      escalationApproved,
      finalVerifiedStatus,
      evidenceSummary,
      decisionTrace,
      whyThisDecision,
    };

    return {
      success: true,
      confidence,
      requiresVerification: false,
      requiresEscalation: escalationApproved,
      nextAgent: escalationApproved ? 'ROUTING' : undefined,
      reasoning,
      actions,
      memoryUpdates: [{ type: 'PRIORITY_RESULT', result }],
      eventType: escalationApproved ? 'ALERT_ESCALATED' : 'CONFIDENCE_UPDATED',
      timestamp: Date.now(),
    };
  }
}

export const coordinationPriorityAgent = new CoordinationPriorityAgent();
