export type NegotiationType =
  | 'CONFIDENCE_CHALLENGE'
  | 'ESCALATION_REQUEST'
  | 'ESCALATION_BLOCK'
  | 'ROUTE_REJECTION'
  | 'VERIFICATION_REQUEST'
  | 'REANALYSIS_REQUEST'
  | 'PRIORITY_OVERRIDE'
  | 'HAZARD_DOWNGRADE'
  | 'HAZARD_ESCALATION';

export interface NegotiationMessage {
  id: string;
  taskId: string;
  sourceAgent: string;
  targetAgent: string;
  negotiationType: NegotiationType;
  reasoning: string[];
  suggestedAction: string;
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}

export class NegotiationMemory {
  private negotiations: Map<string, NegotiationMessage[]> = new Map();
  private activeNegotiations: Map<string, NegotiationMessage> = new Map();

  /**
   * Registers a structural agent debate session log.
   */
  public startNegotiation(
    taskId: string,
    sourceAgent: string,
    targetAgent: string,
    negotiationType: NegotiationType,
    reasoning: string | string[],
    suggestedAction: string
  ): NegotiationMessage {
    const id = `neg-${Math.random().toString(36).substr(2, 9)}`;
    const reasoningArray = Array.isArray(reasoning) ? reasoning : [reasoning];
    const timestamp = Date.now();

    const message: NegotiationMessage = {
      id,
      taskId,
      sourceAgent,
      targetAgent,
      negotiationType,
      reasoning: reasoningArray,
      suggestedAction,
      timestamp,
      status: 'PENDING'
    };

    // Store in active lookup
    this.activeNegotiations.set(id, message);

    // Append to task history
    const existing = this.negotiations.get(taskId) || [];
    this.negotiations.set(taskId, [...existing, message]);

    return message;
  }

  /**
   * Resolves/updates a pending debate status.
   */
  public respondToNegotiation(
    negotiationId: string,
    status: 'ACCEPTED' | 'REJECTED',
    responseReasoning?: string
  ): void {
    const active = this.activeNegotiations.get(negotiationId);
    if (active) {
      active.status = status;
      if (responseReasoning) {
        active.reasoning.push(`[Response] ${responseReasoning}`);
      }
      this.activeNegotiations.delete(negotiationId);
    }
  }

  /**
   * Evaluates if consensus is reached between critical agents.
   * Consensus rules:
   * 1. Alert escalations require VerificationAgent validation.
   * 2. Alert dispatches require RoutingAgent escape corridor clearance.
   */
  public evaluateMultiAgentConsensus(
    taskId: string,
    context: any
  ): { hasConsensus: boolean; reasoning: string[] } {
    const reasoning: string[] = [];
    let verificationApproved = true;
    let routingApproved = true;

    // 1. Audit Verification approval: reject if confidence score is low (< 0.6) or conflicts exist
    if (context?.highestNearbySeverity === 'LOW') {
      verificationApproved = false;
      reasoning.push('[Consensus Audit] VerificationAgent DISSENT: Environmental severity metrics are graded low; escalation is premature.');
    }

    // 2. Audit Routing safety: reject if escape routes have consecutive blockages (>1)
    if (context?.recentRerouteFailuresCount > 1) {
      routingApproved = false;
      reasoning.push(`[Consensus Audit] RoutingAgent DISSENT: Evacuation corridors have active blockages (${context.recentRerouteFailuresCount} failures). Escape paths are compromised.`);
    }

    const hasConsensus = verificationApproved && routingApproved;
    if (hasConsensus) {
      reasoning.push('[Consensus Audit] Multi-agent coordination approved: Verification Agent confirms threat, Routing Agent approves corridor safety.');
    }

    return {
      hasConsensus,
      reasoning
    };
  }

  public getNegotiationHistory(taskId: string): NegotiationMessage[] {
    return this.negotiations.get(taskId) || [];
  }

  public getAllActiveNegotiations(): NegotiationMessage[] {
    return Array.from(this.activeNegotiations.values());
  }

  /**
   * Deadlock prevention: automatically expires stale pending debates beyond 15 seconds.
   */
  public expireOldNegotiations(maxAgeMs: number = 15000): string[] {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.activeNegotiations.forEach((msg, id) => {
      if (now - msg.timestamp > maxAgeMs) {
        msg.status = 'EXPIRED';
        msg.reasoning.push(`[System] Negotiation expired automatically to prevent orchestrator deadlocks.`);
        this.activeNegotiations.delete(id);
        expiredIds.push(id);
      }
    });

    return expiredIds;
  }

  public clear(): void {
    this.negotiations.clear();
    this.activeNegotiations.clear();
  }
}
