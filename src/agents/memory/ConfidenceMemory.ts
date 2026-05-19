export type ConfidenceStateName =
  | 'LOW_CONFIDENCE'
  | 'MONITORING'
  | 'VERIFIED'
  | 'HIGH_RISK'
  | 'CRITICAL'
  | 'REJECTED';

export interface ConfidenceRecord {
  timestamp: number;
  confidence: number;
  stateName: ConfidenceStateName;
  sourceAgent: string;
  reasoning: string[];
  triggerEvent?: string;
}

export interface PredictiveConfidenceState {
  predictedConfidence?: number;
  forecastedState?: ConfidenceStateName;
  estimatedTimeMs?: number;
}

export interface ConfidenceMemoryState {
  targetId: string;
  history: ConfidenceRecord[];
  trend: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  currentConfidence: number;
  currentState: ConfidenceStateName;
  predictiveState?: PredictiveConfidenceState;
}

export class ConfidenceMemory {
  private confidenceStates: Map<string, ConfidenceMemoryState> = new Map();

  // Smoothing factor for exponential moving average
  private readonly SMOOTHING_ALPHA = 0.4;
  // Maximum step adjustment per record transaction to prevent jumps
  private readonly MAX_STEP_DELTA = 0.18;

  public getConfidenceState(targetId: string): ConfidenceMemoryState | undefined {
    return this.confidenceStates.get(targetId);
  }

  public getAllConfidenceStates(): Record<string, ConfidenceMemoryState> {
    const result: Record<string, ConfidenceMemoryState> = {};
    this.confidenceStates.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Translates a numeric confidence score into a standardized risk state name.
   */
  public mapConfidenceToStateName(score: number): ConfidenceStateName {
    if (score <= 0.3) return 'LOW_CONFIDENCE';
    if (score <= 0.6) return 'MONITORING';
    if (score <= 0.8) return 'VERIFIED';
    if (score <= 0.95) return 'HIGH_RISK';
    return 'CRITICAL';
  }

  /**
   * Standardized weighted multi-signal calculation.
   * Confidence = (Rainfall * 0.4) + (SocialReports * 0.3) + (TerrainRisk * 0.2) + (VerificationScore * 0.1)
   */
  public calculateWeightedConfidence(
    rainfall: number, // 0.0 - 1.0
    socialReports: number, // 0.0 - 1.0
    terrainRisk: number, // 0.0 - 1.0
    verificationScore: number // 0.0 - 1.0
  ): { score: number; explanations: string[] } {
    const explanations: string[] = [];

    const rainWeight = rainfall * 0.4;
    explanations.push(`Rainfall telemetry component: ${rainWeight.toFixed(2)} (Weight: 40%)`);

    const socialWeight = socialReports * 0.3;
    explanations.push(`Social signals density component: ${socialWeight.toFixed(2)} (Weight: 30%)`);

    const terrainWeight = terrainRisk * 0.2;
    explanations.push(`Terrain topological susceptibility component: ${terrainWeight.toFixed(2)} (Weight: 20%)`);

    const verificationWeight = verificationScore * 0.1;
    explanations.push(`Ground-truth Verification audit component: ${verificationWeight.toFixed(2)} (Weight: 10%)`);

    const score = rainWeight + socialWeight + terrainWeight + verificationWeight;
    return {
      score: parseFloat(score.toFixed(3)),
      explanations
    };
  }

  /**
   * Evolve a confidence score stepwise with exponential smoothing.
   */
  public recordConfidence(
    targetId: string,
    rawTargetConfidence: number,
    sourceAgent: string,
    rawReasoning: string | string[],
    triggerEvent?: string,
    isConflictStabilized: boolean = false
  ): ConfidenceMemoryState {
    const existing = this.confidenceStates.get(targetId);
    const now = Date.now();
    
    const reasoningArray = Array.isArray(rawReasoning) ? rawReasoning : [rawReasoning];
    const reasoningLog = [...reasoningArray];

    // 1. Smoothing and Dampening Logic
    let lastConfidence = existing ? existing.currentConfidence : rawTargetConfidence;
    
    // Stabilize/dampen updates under active conflicts
    const alpha = isConflictStabilized ? this.SMOOTHING_ALPHA * 0.5 : this.SMOOTHING_ALPHA;
    
    let evolvedConfidence = existing
      ? lastConfidence * (1 - alpha) + rawTargetConfidence * alpha
      : rawTargetConfidence;

    // Apply incremental step delta limits
    if (existing) {
      const delta = evolvedConfidence - lastConfidence;
      if (Math.abs(delta) > this.MAX_STEP_DELTA) {
        evolvedConfidence = lastConfidence + Math.sign(delta) * this.MAX_STEP_DELTA;
        reasoningLog.push(`[ConfidenceEngine] Smoothed transition delta to cap within standard rate-limits (+/- ${this.MAX_STEP_DELTA})`);
      }
    }

    evolvedConfidence = parseFloat(Math.max(0.0, Math.min(1.0, evolvedConfidence)).toFixed(3));
    const stateName = this.mapConfidenceToStateName(evolvedConfidence);

    const record: ConfidenceRecord = {
      timestamp: now,
      confidence: evolvedConfidence,
      stateName,
      sourceAgent,
      reasoning: reasoningLog,
      triggerEvent
    };

    let updatedState: ConfidenceMemoryState;

    if (existing) {
      const updatedHistory = [...existing.history, record];
      const trend = this.calculateTrend(updatedHistory);

      updatedState = {
        targetId,
        history: updatedHistory,
        trend,
        currentConfidence: evolvedConfidence,
        currentState: stateName
      };
    } else {
      updatedState = {
        targetId,
        history: [record],
        trend: 'STABLE',
        currentConfidence: evolvedConfidence,
        currentState: stateName
      };
    }

    this.confidenceStates.set(targetId, updatedState);
    return updatedState;
  }

  /**
   * Evolve decay incrementally on stale, un-updated target tracks.
   */
  public decayStaleConfidences(maxAgeMs: number = 20000): string[] {
    const now = Date.now();
    const decayedIds: string[] = [];

    this.confidenceStates.forEach((state, id) => {
      const lastRecord = state.history[state.history.length - 1];
      const age = now - lastRecord.timestamp;

      if (age > maxAgeMs && state.currentConfidence > 0.1) {
        // Apply slight progressive decay
        const decayedValue = parseFloat(Math.max(0.1, state.currentConfidence - 0.1).toFixed(3));
        const stateName = this.mapConfidenceToStateName(decayedValue);

        const decayRecord: ConfidenceRecord = {
          timestamp: now,
          confidence: decayedValue,
          stateName,
          sourceAgent: 'SYSTEM_DECAY_ENGINE',
          reasoning: [`[DecayEngine] Confidence decayed by 0.10 due to inactivity for ${(age / 1000).toFixed(0)} seconds`],
          triggerEvent: 'CONFIDENCE_DECAYED'
        };

        const updatedHistory = [...state.history, decayRecord];
        const trend = this.calculateTrend(updatedHistory);

        this.confidenceStates.set(id, {
          targetId: id,
          history: updatedHistory,
          trend,
          currentConfidence: decayedValue,
          currentState: stateName
        });

        decayedIds.push(id);
      }
    });

    return decayedIds;
  }

  private calculateTrend(history: ConfidenceRecord[]): 'UPWARD' | 'DOWNWARD' | 'STABLE' {
    if (history.length < 2) return 'STABLE';

    const recent = history.slice(-3);
    let upwardCount = 0;
    let downwardCount = 0;

    for (let i = 1; i < recent.length; i++) {
      const diff = recent[i].confidence - recent[i - 1].confidence;
      if (diff > 0.01) upwardCount++;
      else if (diff < -0.01) downwardCount++;
    }

    if (upwardCount > downwardCount) return 'UPWARD';
    if (downwardCount > upwardCount) return 'DOWNWARD';
    return 'STABLE';
  }

  public updatePredictiveState(targetId: string, state: PredictiveConfidenceState): void {
    const existing = this.confidenceStates.get(targetId);
    if (existing) {
      existing.predictiveState = {
        ...existing.predictiveState,
        ...state
      };
    }
  }

  public clear(): void {
    this.confidenceStates.clear();
  }
}
