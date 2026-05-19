import { SeverityLevel } from '../core/AgentTypes';

export type HazardLifecycleState =
  | 'DETECTED'
  | 'VERIFYING'
  | 'ACTIVE'
  | 'ESCALATED'
  | 'STABILIZING'
  | 'RESOLVED'
  | 'ARCHIVED';

export type HazardVerificationState =
  | 'unverified'
  | 'partially_verified'
  | 'verified'
  | 'conflicting_signals'
  | 'rejected';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface PredictiveHazardState {
  predictedPolygon?: Coordinate[];
  expansionRate?: number;
  escalationProbability?: number;
  estimatedEscalationTime?: number;
}

export interface HazardMemoryState {
  hazardId: string;
  firebaseId?: string; // Firestore document ID reference
  confidence: number;
  severity: SeverityLevel;
  lifecycleState: HazardLifecycleState;
  verificationState: HazardVerificationState;
  polygonPoints?: Coordinate[];
  affectedRoutes: string[];
  blockedRoutes: string[];
  rerouteAttemptsCount: number;
  issuedAlertIds: string[];
  alertEscalationLevel: number;
  cascadeHazardIds: string[];
  parentHazardId?: string;
  predictiveState?: PredictiveHazardState;
  metadata: {
    createdBy: string;
    verifiedBy?: string;
    escalatedBy?: string;
    resolvedBy?: string;
    lastUpdatedBy?: string;
  };
  timestamp: number;
  createdAt: number;
  history: Array<{
    timestamp: number;
    lifecycleState: HazardLifecycleState;
    verificationState: HazardVerificationState;
    confidence: number;
    severity: SeverityLevel;
    action: string;
    triggeredBy: string;
    reasoning?: string;
    polygonPointCount?: number;
  }>;
}

export class HazardMemory {
  private hazards: Map<string, HazardMemoryState> = new Map();

  public getHazard(hazardId: string): HazardMemoryState | undefined {
    return this.hazards.get(hazardId);
  }

  public getAllHazards(): Record<string, HazardMemoryState> {
    const result: Record<string, HazardMemoryState> = {};
    this.hazards.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Safe getter or initial creator to retrieve/create a persistent hazard.
   */
  public getOrCreateHazard(
    hazardId: string,
    creator: string,
    initialData?: Partial<HazardMemoryState>
  ): HazardMemoryState {
    const existing = this.hazards.get(hazardId);
    if (existing) return existing;

    const now = Date.now();
    const newHazard: HazardMemoryState = {
      hazardId,
      confidence: initialData?.confidence || 0.4,
      severity: initialData?.severity || 'MEDIUM',
      lifecycleState: initialData?.lifecycleState || 'DETECTED',
      verificationState: initialData?.verificationState || 'unverified',
      polygonPoints: initialData?.polygonPoints || [],
      affectedRoutes: initialData?.affectedRoutes || [],
      blockedRoutes: initialData?.blockedRoutes || [],
      rerouteAttemptsCount: initialData?.rerouteAttemptsCount || 0,
      issuedAlertIds: initialData?.issuedAlertIds || [],
      alertEscalationLevel: initialData?.alertEscalationLevel || 0,
      cascadeHazardIds: initialData?.cascadeHazardIds || [],
      parentHazardId: initialData?.parentHazardId,
      metadata: {
        createdBy: creator,
        lastUpdatedBy: creator
      },
      timestamp: now,
      createdAt: now,
      history: [
        {
          timestamp: now,
          lifecycleState: initialData?.lifecycleState || 'DETECTED',
          verificationState: initialData?.verificationState || 'unverified',
          confidence: initialData?.confidence || 0.4,
          severity: initialData?.severity || 'MEDIUM',
          action: 'Created Evolving Hazard Entity',
          triggeredBy: creator,
          reasoning: 'Initial sensor or signal detection',
          polygonPointCount: initialData?.polygonPoints?.length || 0
        }
      ]
    };

    this.hazards.set(hazardId, newHazard);
    return newHazard;
  }

  /**
   * Evolves an existing hazard state.
   */
  public evolveHazard(
    hazardId: string,
    agent: string,
    updates: Partial<Omit<HazardMemoryState, 'hazardId' | 'history' | 'createdAt'>>,
    action: string,
    reasoning?: string
  ): HazardMemoryState | undefined {
    const existing = this.hazards.get(hazardId);
    if (!existing) return undefined;

    const now = Date.now();
    
    // Auto transition lifecycle state based on verification and confidence trends
    let nextLifecycle = updates.lifecycleState || existing.lifecycleState;
    let nextVerification = updates.verificationState || existing.verificationState;
    const nextConfidence = updates.confidence !== undefined ? updates.confidence : existing.confidence;

    if (updates.verificationState === 'verified' && nextLifecycle === 'VERIFYING') {
      nextLifecycle = 'ACTIVE';
    } else if (updates.verificationState === 'rejected') {
      nextLifecycle = 'ARCHIVED';
    }

    if (nextConfidence >= 0.85 && nextLifecycle === 'DETECTED') {
      nextLifecycle = 'ACTIVE';
    }

    const evolved: HazardMemoryState = {
      ...existing,
      ...updates,
      lifecycleState: nextLifecycle,
      verificationState: nextVerification,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        lastUpdatedBy: agent,
        verifiedBy: nextVerification === 'verified' ? agent : existing.metadata.verifiedBy,
        escalatedBy: nextLifecycle === 'ESCALATED' ? agent : existing.metadata.escalatedBy,
        resolvedBy: nextLifecycle === 'RESOLVED' ? agent : existing.metadata.resolvedBy
      },
      timestamp: now,
      history: [
        ...existing.history,
        {
          timestamp: now,
          lifecycleState: nextLifecycle,
          verificationState: nextVerification,
          confidence: nextConfidence,
          severity: updates.severity || existing.severity,
          action,
          triggeredBy: agent,
          reasoning,
          polygonPointCount: (updates.polygonPoints || existing.polygonPoints)?.length || 0
        }
      ]
    };

    this.hazards.set(hazardId, evolved);
    return evolved;
  }

  public updatePolygon(hazardId: string, agent: string, points: Coordinate[], reasoning?: string): void {
    const existing = this.hazards.get(hazardId);
    if (existing) {
      const typeOfUpdate = points.length > (existing.polygonPoints?.length || 0) ? 'expanded' : 'reduced';
      this.evolveHazard(
        hazardId,
        agent,
        { polygonPoints: points },
        `Polygon ${typeOfUpdate}`,
        reasoning || `Boundary recalculated: new area size is ${points.length} coords`
      );
    }
  }

  public updatePredictiveState(hazardId: string, state: PredictiveHazardState): void {
    const existing = this.hazards.get(hazardId);
    if (existing) {
      existing.predictiveState = {
        ...existing.predictiveState,
        ...state
      };
    }
  }

  public addRelationship(hazardId: string, cascadingId: string): void {
    const existing = this.hazards.get(hazardId);
    if (existing && !existing.cascadeHazardIds.includes(cascadingId)) {
      existing.cascadeHazardIds.push(cascadingId);
      
      // Update cascade relationship back-reference
      const target = this.hazards.get(cascadingId);
      if (target) {
        target.parentHazardId = hazardId;
      }
    }
  }

  public pruneStaleHazards(maxAgeMs: number): string[] {
    const now = Date.now();
    const removedIds: string[] = [];
    this.hazards.forEach((hazard, id) => {
      if (now - hazard.timestamp > maxAgeMs && (hazard.lifecycleState === 'RESOLVED' || hazard.lifecycleState === 'ARCHIVED')) {
        this.hazards.delete(id);
        removedIds.push(id);
      }
    });
    return removedIds;
  }

  public clear(): void {
    this.hazards.clear();
  }
}
