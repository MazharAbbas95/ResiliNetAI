import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { VerificationFusionResult } from '../verification/VerificationAgent';

export interface ShieldResult {
  passed: boolean;
  reason: string;
  suppressionTriggers: string[];
  riskAssessment: 'SAFE_TO_ESCALATE' | 'MONITOR_ONLY' | 'BLOCKED';
}

const HALLUCINATION_PATTERNS = [
  /entire (city|country|region) (is |has been )?(flooded|destroyed|underwater)/i,
  /everything (is |has been )?(destroyed|flooded|gone)/i,
  /millions (of people |are )?(affected|trapped|dying)/i,
  /(worst|biggest|largest) (flood|disaster|storm) (in history|ever)/i,
];

export class ShieldModuleAgent implements Agent {
  public id = 'shield';
  public name = 'SHIELD';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];
    const suppressionTriggers: string[] = [];

    const verificationResult: VerificationFusionResult | undefined = task.payload?.verificationResult;
    const crowdResult = task.payload?.crowdResult;
    const normalizedSignal = task.payload?.normalizedSignal;
    const rawText: string = normalizedSignal?.rawInput ?? task.payload?.rawText ?? task.payload?.text ?? '';

    reasoning.push('Shield Module: Scanning for false positive indicators...');

    // ── Check 1: Verification must have approved ──
    if (verificationResult && !verificationResult.conditionD_approved) {
      suppressionTriggers.push(`Verification rejected (status: ${verificationResult.verificationStatus})`);
      reasoning.push(`✗ Shield Block: Verification Fusion did not approve. Status: ${verificationResult.verificationStatus}`);
    }

    // ── Check 2: Confidence floor guard ──
    const confidence = verificationResult?.fusedConfidence ?? task.payload?.confidence ?? 0;
    if (confidence < 0.40) {
      suppressionTriggers.push(`Confidence too low: ${(confidence * 100).toFixed(0)}% (minimum 40%)`);
      reasoning.push(`✗ Shield Block: Fused confidence ${(confidence * 100).toFixed(0)}% is below minimum escalation floor of 40%.`);
    }

    // ── Check 3: Single source with no weather backing ──
    const uniqueReports = crowdResult?.uniqueReportCount ?? 0;
    const hasWeatherAnomaly = verificationResult?.conditionA_weatherAnomaly ?? false;
    if (uniqueReports <= 1 && !hasWeatherAnomaly) {
      suppressionTriggers.push('Single-source unverified report with no weather anomaly');
      reasoning.push(`✗ Shield Block: Only ${uniqueReports} report(s) and weather shows no anomaly. This combination cannot be escalated.`);
    }

    // ── Check 4: Hallucination/exaggeration pattern detection ──
    for (const pattern of HALLUCINATION_PATTERNS) {
      if (pattern.test(rawText)) {
        suppressionTriggers.push(`Hallucination pattern detected: "${rawText.substring(0, 50)}..."`);
        reasoning.push(`✗ Shield Block: Input matches known exaggeration pattern. Credibility discounted.`);
        break;
      }
    }

    // ── Check 5: Contradiction analysis ──
    const contradictions = verificationResult?.contradictions ?? [];
    if (contradictions.length >= 2) {
      suppressionTriggers.push(`${contradictions.length} evidence contradictions active`);
      reasoning.push(`✗ Shield Block: ${contradictions.length} contradictions detected: ${contradictions.slice(0, 2).join(' | ')}`);
    }

    const passed = suppressionTriggers.length === 0;
    let riskAssessment: ShieldResult['riskAssessment'];

    if (passed) {
      riskAssessment = 'SAFE_TO_ESCALATE';
      reasoning.push('✓ Shield Module: All checks passed. Safe to proceed with escalation.');
      actions.push('Shield approved. Forwarding to Analyst for strategic assessment.');
    } else if (confidence >= 0.30 && suppressionTriggers.length === 1) {
      riskAssessment = 'MONITOR_ONLY';
      reasoning.push(`Shield Module: ${suppressionTriggers.length} concern(s) flagged. Downgrading to MONITOR_ONLY.`);
      actions.push('Escalation suppressed. Flagged as monitoring-only observation.');
    } else {
      riskAssessment = 'BLOCKED';
      reasoning.push(`Shield Module: ${suppressionTriggers.length} suppression trigger(s) active. Blocking escalation entirely.`);
      actions.push('Escalation BLOCKED. Signal does not meet safety threshold for emergency response.');
    }

    const result: ShieldResult = { passed, reason: suppressionTriggers[0] ?? 'All checks passed', suppressionTriggers, riskAssessment };

    return {
      success: passed,
      confidence,
      requiresVerification: false,
      requiresEscalation: passed && confidence > 0.70,
      nextAgent: passed ? 'ANALYST' : undefined,
      reasoning,
      actions,
      memoryUpdates: [{ type: 'SHIELD_RESULT', result }],
      eventType: passed ? 'SIGNAL_VALIDATED' : 'ESCALATION_BLOCKED',
      timestamp: Date.now(),
    };
  }
}

export const shieldModuleAgent = new ShieldModuleAgent();
