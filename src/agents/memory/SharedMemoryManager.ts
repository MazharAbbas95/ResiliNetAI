import { AgentEventPayload, SeverityLevel } from '../core/AgentTypes';
import { HazardMemory, HazardMemoryState, Coordinate, HazardLifecycleState, HazardVerificationState } from './HazardMemory';
import { RouteMemory } from './RouteMemory';
import { AlertMemory } from './AlertMemory';
import { ConfidenceMemory } from './ConfidenceMemory';
import { NegotiationMemory } from './NegotiationMemory';
import { hazardService } from '../../services/firebase/hazardService';
import { alertService } from '../../services/firebase/alertService';
import { HazardZone, HazardSeverity } from '../../types/geospatial';
import { ContextRetrievalEngine, DecisionContext } from './ContextRetrievalEngine';

export interface MemorySnapshot {
  hazardConfidence: Record<string, number>;
  previousAlerts: string[];
  rerouteHistory: any[];
  verificationState: Record<string, 'pending' | 'verified' | 'rejected'>;
  escalationHistory: any[];
  failedAttempts: Record<string, number>;
  activeHazards: Record<string, any>;
  eventHistory: AgentEventPayload[];
  predictiveMetrics: {
    escalationForecasts: any[];
    predictiveConfidenceTrends: Record<string, any>;
  };
  lastUpdated: number;
}

/**
 * Recursively sanitizes any payload to make it 100% compliant with Firestore rules.
 * Converts all 'undefined' values into 'null', and strips functions.
 */
export function sanitizeFirestorePayload<T>(payload: T): T {
  if (payload === undefined) {
    return null as any;
  }
  if (payload === null) {
    return null as any;
  }
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizeFirestorePayload(item)) as any;
  }
  if (typeof payload === 'object') {
    const sanitizedObj: any = {};
    for (const key of Object.keys(payload)) {
      const val = (payload as any)[key];
      if (val !== undefined) {
        sanitizedObj[key] = sanitizeFirestorePayload(val);
      } else {
        sanitizedObj[key] = null;
      }
    }
    return sanitizedObj;
  }
  return payload;
}

export class SharedMemoryManager {
  private static instance: SharedMemoryManager;

  public hazardMemory = new HazardMemory();
  public routeMemory = new RouteMemory();
  public alertMemory = new AlertMemory();
  public confidenceMemory = new ConfidenceMemory();
  public negotiationMemory = new NegotiationMemory();

  public contextEngine = new ContextRetrievalEngine(
    this.hazardMemory,
    this.routeMemory,
    this.alertMemory,
    this.confidenceMemory
  );

  private failedAttempts: Record<string, number> = {};
  private eventHistory: AgentEventPayload[] = [];
  private lastUpdated: number = Date.now();
  private syncTimeouts = new Map<string, any>();

  // Callback to publish events dynamically to the AgentEventBus without circular dependencies
  private eventPublisher: ((event: Omit<AgentEventPayload, 'eventId' | 'timestamp'>) => void) | null = null;

  private constructor() {}

  public static getInstance(): SharedMemoryManager {
    if (!SharedMemoryManager.instance) {
      SharedMemoryManager.instance = new SharedMemoryManager();
    }
    return SharedMemoryManager.instance;
  }

  public getContextSnapshot(lat?: number, lng?: number, maxDistanceKm?: number): DecisionContext {
    return this.contextEngine.getContextSnapshot(lat, lng, maxDistanceKm);
  }

  public registerPublisher(pub: (event: Omit<AgentEventPayload, 'eventId' | 'timestamp'>) => void): void {
    this.eventPublisher = pub;
  }

  private publishEvent(event: Omit<AgentEventPayload, 'eventId' | 'timestamp'>): void {
    if (this.eventPublisher) {
      this.eventPublisher(event);
    }
  }

  /**
   * Syncs the in-memory hazard representation to the Firebase Firestore database with debouncing.
   */
  private syncHazardToFirebase(hazard: HazardMemoryState, immediate = false): void {
    const hazardId = hazard.hazardId;

    if (this.syncTimeouts.has(hazardId)) {
      clearTimeout(this.syncTimeouts.get(hazardId));
      this.syncTimeouts.delete(hazardId);
    }

    const runSync = async () => {
      this.syncTimeouts.delete(hazardId);

      // Ephemeral gating guard: Only persist to Firestore AFTER successful verification (Issue 10)
      if (hazard.verificationState !== 'verified') {
        console.log(`[SharedMemoryManager] Ephemeral state active for ${hazardId} (${hazard.verificationState}). Firestore persistence blocked.`);
        if (hazard.firebaseId) {
          try {
            const { hazardService } = require('../../services/hazardService');
            await hazardService.deleteHazard(hazard.firebaseId);
            console.log(`[SharedMemoryManager] Cleaned up rejected/unverified hazard ${hazardId} (Firestore ID: ${hazard.firebaseId})`);
            hazard.firebaseId = undefined;
          } catch (e) {
            console.warn(`[SharedMemoryManager] Failed to delete unverified hazard from Firestore:`, e);
          }
        }
        return;
      }

      const severityMap: Record<SeverityLevel, HazardSeverity> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'CRITICAL': 'Critical'
      };

      const statusMap: Record<HazardLifecycleState, 'Active' | 'Resolved' | 'Monitoring'> = {
        'DETECTED': 'Monitoring',
        'VERIFYING': 'Monitoring',
        'ACTIVE': 'Active',
        'ESCALATED': 'Active',
        'STABILIZING': 'Monitoring',
        'RESOLVED': 'Resolved',
        'ARCHIVED': 'Resolved'
      };

      const isActiveLifecycle = ['ACTIVE', 'ESCALATED', 'DETECTED', 'VERIFYING'].includes(hazard.lifecycleState);

      const polygon = (hazard.polygonPoints || []).map(p => ({
        latitude: p.lat,
        longitude: p.lng
      }));

      const centroid = polygon.length > 0 
        ? {
            latitude: polygon.reduce((sum, p) => sum + p.latitude, 0) / polygon.length,
            longitude: polygon.reduce((sum, p) => sum + p.longitude, 0) / polygon.length
          }
        : { latitude: 0, longitude: 0 };

      const formattedPredictiveState = hazard.predictiveState ? {
        predictedPolygon: hazard.predictiveState.predictedPolygon?.map(p => ({
          latitude: p.lat ?? 0,
          longitude: p.lng ?? 0
        })) || null,
        expansionRate: hazard.predictiveState.expansionRate ?? null,
        escalationProbability: hazard.predictiveState.escalationProbability ?? null,
        estimatedEscalationTime: hazard.predictiveState.estimatedEscalationTime ?? null
      } : null;

      const hazardZoneData: Omit<HazardZone, 'id'> = {
        title: `Threat: ${hazard.hazardId}`,
        type: 'FlashFlood',
        severity: severityMap[hazard.severity] || 'Medium',
        confidenceScore: hazard.confidence,
        polygon,
        centroid,
        riskLevel: hazard.severity === 'CRITICAL' ? 5 : hazard.severity === 'HIGH' ? 4 : 3,
        terrainRisk: 3,
        sourceSignals: ['sensor-telemetry', 'agent-collaboration'],
        aiAnalysis: `Dynamic hazard state: ${hazard.lifecycleState}. Verification state: ${hazard.verificationState}. Managed by: ${hazard.metadata.lastUpdatedBy || hazard.metadata.createdBy}`,
        status: statusMap[hazard.lifecycleState] || 'Active',
        isActive: isActiveLifecycle,
        isVisible: isActiveLifecycle,
        metadata: {
          confidence: hazard.confidence,
          lastUpdated: hazard.timestamp,
          source: hazard.metadata.lastUpdatedBy || hazard.metadata.createdBy
        },
        createdAt: hazard.createdAt,
        updatedAt: hazard.timestamp,
        predictiveState: formattedPredictiveState
      };

      const sanitizedData = sanitizeFirestorePayload(hazardZoneData);

      const syncStart = Date.now();
      try {
        if (hazard.firebaseId) {
          await hazardService.updateHazard(hazard.firebaseId, sanitizedData);
          console.log(`[SharedMemoryManager] Updated Firestore hazard: ${hazard.hazardId} (Firestore ID: ${hazard.firebaseId})`);
        } else {
          // Absolute Idempotency: Use hazard.hazardId as custom doc ID (Issue 5)
          const newDocId = await hazardService.createHazard(sanitizedData, hazard.hazardId);
          hazard.firebaseId = newDocId;
          console.log(`[SharedMemoryManager] Created Firestore hazard: ${hazard.hazardId} (Firestore ID: ${newDocId})`);
        }
        const syncLatency = Date.now() - syncStart;
        const { useInfraHealthStore: store } = require('../../store/infraHealthStore');
        store.getState().setFirebaseSyncLatency(syncLatency);
        store.getState().setFirebaseSynced(true);
      } catch (error) {
        console.error(`[SharedMemoryManager] Firebase sync error for hazard ${hazard.hazardId}:`, error);
        const { useInfraHealthStore: store } = require('../../store/infraHealthStore');
        store.getState().setFirebaseSynced(false);
      }
    };

    const isTerminal = ['RESOLVED', 'ARCHIVED'].includes(hazard.lifecycleState);
    if (immediate || isTerminal) {
      runSync();
    } else {
      const timeout = setTimeout(runSync, 500); // 500ms debounce write window
      this.syncTimeouts.set(hazardId, timeout);
    }
  }

  public getState(): Readonly<MemorySnapshot> {
    const hazards = this.hazardMemory.getAllHazards();
    const routes = this.routeMemory.getAllRoutes();
    const alerts = this.alertMemory.getAllAlerts();

    const hazardConfidence: Record<string, number> = {};
    const verificationState: Record<string, 'pending' | 'verified' | 'rejected'> = {};
    const activeHazards: Record<string, any> = {};
    const previousAlerts: string[] = [];
    const escalationHistory: any[] = [];
    const rerouteHistory: any[] = [];
    
    const escalationForecasts: any[] = [];
    const predictiveConfidenceTrends: Record<string, any> = {};

    Object.keys(hazards).forEach(id => {
      const hazard = hazards[id];
      hazardConfidence[id] = hazard.confidence;
      
      // Map Verification states compatibly
      verificationState[id] = hazard.verificationState === 'verified' ? 'verified' : 
                          hazard.verificationState === 'rejected' ? 'rejected' : 'pending';

      if (['DETECTED', 'VERIFYING', 'ACTIVE', 'ESCALATED'].includes(hazard.lifecycleState)) {
        activeHazards[id] = hazard;
      }
      if (hazard.lifecycleState === 'ESCALATED') {
        escalationHistory.push({
          type: 'HAZARD',
          targetId: id,
          level: hazard.alertEscalationLevel || 1,
          timestamp: hazard.timestamp
        });
      }

      if (hazard.predictiveState) {
        escalationForecasts.push({
          targetId: id,
          probability: hazard.predictiveState.escalationProbability,
          estimatedTime: hazard.predictiveState.estimatedEscalationTime
        });
      }
    });

    Object.keys(alerts).forEach(id => {
      const alert = alerts[id];
      previousAlerts.push(id);
      if (alert.escalationLevel > 0) {
        escalationHistory.push({
          type: 'ALERT',
          targetId: id,
          level: alert.escalationLevel,
          timestamps: alert.timestamps
        });
      }
    });

    Object.keys(routes).forEach(id => {
      const route = routes[id];
      rerouteHistory.push({
        routeId: id,
        attempts: route.attemptsCount,
        lastRecalculated: route.lastRecalculated,
        confidence: route.routeConfidence,
        history: route.recalculationHistory
      });
    });

    const confidences = this.confidenceMemory.getAllConfidenceStates();
    Object.keys(confidences).forEach(id => {
      const state = confidences[id];
      if (state.predictiveState) {
        predictiveConfidenceTrends[id] = {
          forecastedState: state.predictiveState.forecastedState,
          predictedConfidence: state.predictiveState.predictedConfidence
        };
      }
    });

    return {
      hazardConfidence,
      previousAlerts,
      rerouteHistory,
      verificationState,
      escalationHistory,
      failedAttempts: this.failedAttempts,
      activeHazards,
      eventHistory: this.eventHistory,
      predictiveMetrics: {
        escalationForecasts,
        predictiveConfidenceTrends
      },
      lastUpdated: this.lastUpdated
    };
  }

  public updateMemory(updates: Partial<MemorySnapshot> | Record<string, any>): void {
    this.lastUpdated = Date.now();
    const agent = (updates as any).agent || 'SYSTEM';

    if (updates.failedAttempts) {
      this.failedAttempts = { ...this.failedAttempts, ...updates.failedAttempts };
    }

    if (updates.activeHazards) {
      Object.keys(updates.activeHazards).forEach(id => {
        const hzData = updates.activeHazards[id];
        const current = this.hazardMemory.getHazard(id);
        const agent = hzData.agent || hzData.metadata?.lastUpdatedBy || 'SYSTEM';

        if (current) {
          this.hazardMemory.evolveHazard(
            id,
            agent,
            {
              confidence: hzData.confidence || current.confidence,
              severity: hzData.severity || current.severity,
              lifecycleState: hzData.lifecycleState || current.lifecycleState,
              verificationState: hzData.verificationState || current.verificationState,
              polygonPoints: hzData.polygonPoints || current.polygonPoints,
              affectedRoutes: hzData.affectedRoutes || current.affectedRoutes
            },
            'Synchronized memory update',
            'Applying changes from Agent Manager'
          );
        } else {
          this.hazardMemory.getOrCreateHazard(id, agent, {
            confidence: hzData.confidence,
            severity: hzData.severity,
            lifecycleState: hzData.lifecycleState,
            verificationState: hzData.verificationState,
            polygonPoints: hzData.polygonPoints,
            affectedRoutes: hzData.affectedRoutes
          });
        }

        const evolved = this.hazardMemory.getHazard(id);
        if (evolved) {
          this.syncHazardToFirebase(evolved);
        }
      });
    }

    if (updates.hazardConfidence) {
      Object.keys(updates.hazardConfidence).forEach(id => {
        const confidence = updates.hazardConfidence[id];
        this.setHazardConfidence(id, confidence, agent, 'Updated hazard confidence properties via memory update');
      });
    }

    if (updates.verificationState) {
      Object.keys(updates.verificationState).forEach(id => {
        const rawState = updates.verificationState[id];
        const hazard = this.hazardMemory.getHazard(id);
        const mappedState: HazardVerificationState = rawState === 'verified' ? 'verified' : 
                                                    rawState === 'rejected' ? 'rejected' : 'unverified';
        if (hazard) {
          this.hazardMemory.evolveHazard(
            id,
            'SYSTEM',
            { verificationState: mappedState },
            `Verification set to ${mappedState}`
          );
          this.syncHazardToFirebase(hazard);
        }
      });
    }
  }

  public getHazardConfidence(hazardId: string): number {
    const hazard = this.hazardMemory.getHazard(hazardId);
    return hazard ? hazard.confidence : 0;
  }

  public getVerificationState(hazardId: string): 'pending' | 'verified' | 'rejected' {
    const hazard = this.hazardMemory.getHazard(hazardId);
    if (!hazard) return 'pending';
    return hazard.verificationState === 'verified' ? 'verified' :
           hazard.verificationState === 'rejected' ? 'rejected' : 'pending';
  }

  public setHazardConfidence(
    hazardId: string,
    confidence: number,
    sourceAgent: string = 'SYSTEM',
    reasoning: string | string[] = 'Set hazard confidence score',
    triggerEvent?: string,
    isConflictStabilized: boolean = false
  ): void {
    const nextState = this.confidenceMemory.recordConfidence(
      hazardId,
      confidence,
      sourceAgent,
      reasoning,
      triggerEvent,
      isConflictStabilized
    );
    const evolvedConfidence = nextState.currentConfidence;

    const current = this.hazardMemory.getHazard(hazardId);
    if (current) {
      const isEscalated = nextState.currentState === 'HIGH_RISK' || nextState.currentState === 'CRITICAL';
      const lifecycleState: HazardLifecycleState = isEscalated ? 'ESCALATED' :
                                                  evolvedConfidence > 0.6 ? 'ACTIVE' : 'DETECTED';
      
      this.hazardMemory.evolveHazard(
        hazardId,
        sourceAgent,
        {
          confidence: evolvedConfidence,
          lifecycleState
        },
        Array.isArray(reasoning) ? reasoning.join(', ') : reasoning
      );
      this.syncHazardToFirebase(current);
    } else {
      const newHz = this.hazardMemory.getOrCreateHazard(hazardId, sourceAgent, {
        confidence: evolvedConfidence
      });
      this.syncHazardToFirebase(newHz);
    }

    this.lastUpdated = Date.now();

    // Publish confidence events
    if (this.eventPublisher) {
      this.eventPublisher({
        eventType: 'CONFIDENCE_UPDATED',
        sourceAgent,
        payload: {
          hazardId,
          confidence: evolvedConfidence,
          stateName: nextState.currentState,
          reasoning
        }
      });

      if (nextState.currentState === 'HIGH_RISK' || nextState.currentState === 'CRITICAL') {
        this.eventPublisher({
          eventType: 'ALERT_ESCALATED',
          sourceAgent,
          payload: {
            hazardId,
            confidence: evolvedConfidence,
            stateName: nextState.currentState
          }
        });
      }

      if (nextState.currentState === 'CRITICAL') {
        this.eventPublisher({
          eventType: 'ALERT_ESCALATED',
          sourceAgent,
          payload: {
            hazardId,
            confidence: evolvedConfidence,
            stateName: nextState.currentState,
            isCriticalTrigger: true
          }
        });
      }
    }
  }

  public decayStaleConfidences(maxAgeMs: number = 30000): void {
    const decayedIds = this.confidenceMemory.decayStaleConfidences(maxAgeMs);
    
    decayedIds.forEach(id => {
      const state = this.confidenceMemory.getConfidenceState(id);
      const hazard = this.hazardMemory.getHazard(id);
      if (state && hazard) {
        this.hazardMemory.evolveHazard(
          id,
          'SYSTEM_DECAY_ENGINE',
          { confidence: state.currentConfidence },
          'Decayed confidence due to stale reporting telemetry'
        );
        this.syncHazardToFirebase(hazard);

        if (this.eventPublisher) {
          this.eventPublisher({
            eventType: 'CONFIDENCE_UPDATED',
            sourceAgent: 'SYSTEM_DECAY_ENGINE',
            payload: {
              hazardId: id,
              confidence: state.currentConfidence,
              stateName: state.currentState,
              isDecayed: true
            }
          });
        }
      }
    });
  }

  public recordFailedAttempt(agentId: string): number {
    const current = this.failedAttempts[agentId] || 0;
    this.failedAttempts[agentId] = current + 1;
    this.lastUpdated = Date.now();
    return this.failedAttempts[agentId];
  }

  public resetFailedAttempt(agentId: string): void {
    this.failedAttempts[agentId] = 0;
    this.lastUpdated = Date.now();
  }

  public updateVerificationState(taskId: string, state: 'pending' | 'verified' | 'rejected'): void {
    const hazard = this.hazardMemory.getHazard(taskId);
    const mappedState: HazardVerificationState = state === 'verified' ? 'verified' : 
                                                state === 'rejected' ? 'rejected' : 'unverified';
    if (hazard) {
      this.hazardMemory.evolveHazard(
        taskId,
        'VERIFICATION',
        { verificationState: mappedState },
        `Verification state updated to ${mappedState}`
      );
      this.syncHazardToFirebase(hazard);
    }
    this.lastUpdated = Date.now();
  }

  public recordEvent(event: AgentEventPayload): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }
    this.lastUpdated = Date.now();

    try {
      if (event.eventType === 'HAZARD_DETECTED') {
        const hazardId = (event.payload as any).hazardId || `hz-${Date.now()}`;
        const severity: SeverityLevel = event.severity as SeverityLevel || (event.payload as any).severity || 'MEDIUM';
        const confidence = event.confidence || (event.payload as any).confidence || 0.4;
        
        // Dynamic coordinates
        const rawPoints = (event.payload as any).polygonPoints || [];
        const polygonPoints: Coordinate[] = rawPoints.map((p: any) => ({
          lat: p.lat || p.latitude || 0,
          lng: p.lng || p.longitude || 0
        }));

        const hazard = this.hazardMemory.getOrCreateHazard(hazardId, event.sourceAgent, {
          confidence,
          severity,
          polygonPoints,
          lifecycleState: 'DETECTED',
          verificationState: 'unverified'
        });

        this.syncHazardToFirebase(hazard);

        this.confidenceMemory.recordConfidence(
          hazardId,
          confidence,
          event.sourceAgent,
          'Dynamic event detection processed',
          event.eventType
        );

      } else if (event.eventType === 'CONFIDENCE_UPDATED') {
        const targetId = (event.payload as any).hazardId || (event.payload as any).targetId;
        const confidence = event.confidence || (event.payload as any).confidence;
        
        if (targetId && confidence !== undefined) {
          const current = this.hazardMemory.getHazard(targetId);
          if (current) {
            const oldConfidence = current.confidence;
            
            this.hazardMemory.evolveHazard(
              targetId,
              event.sourceAgent,
              { confidence },
              'Confidence properties evolved',
              (event.payload as any).reasoning || 'Updated confidence from Agent verification/analyst cycle'
            );

            const updated = this.hazardMemory.getHazard(targetId);
            if (updated) {
              this.syncHazardToFirebase(updated);

              // Trigger secondary events
              if (oldConfidence < 0.6 && confidence >= 0.85 && updated.lifecycleState !== 'ACTIVE') {
                this.hazardMemory.evolveHazard(targetId, 'SYSTEM', { lifecycleState: 'ACTIVE' }, 'Auto-activated via high confidence');
                this.publishEvent({
                  eventType: 'SIGNAL_VALIDATED',
                  sourceAgent: 'SYSTEM',
                  payload: { hazardId: targetId, confidence }
                });
              }
            }
          }

          this.confidenceMemory.recordConfidence(
            targetId,
            confidence,
            event.sourceAgent,
            (event.payload as any).reasoning || 'Confidence evolution state updated',
            event.eventType
          );
        }

      } else if (event.eventType === 'ROUTE_UNSAFE') {
        const routeId = (event.payload as any).routeId || 'default';
        const corridor = (event.payload as any).corridor || 'intersection-zone';
        const hazardId = (event.payload as any).hazardId;

        this.routeMemory.recordRerouteAttempt(routeId, false, {
          reason: 'Bypassed route intersecting unsafe hazard zone coordinates',
          unsafeCorridor: corridor,
          confidence: event.confidence || 0.5
        });

        if (hazardId) {
          const hazard = this.hazardMemory.getHazard(hazardId);
          if (hazard) {
            this.hazardMemory.evolveHazard(
              hazardId,
              event.sourceAgent,
              { 
                blockedRoutes: Array.from(new Set([...hazard.blockedRoutes, routeId])),
                rerouteAttemptsCount: hazard.rerouteAttemptsCount + 1
              },
              'Route evaluation flagged as Unsafe',
              `Route intersection blocked at corridor: ${corridor}`
            );
            this.syncHazardToFirebase(hazard);
          }
        }

      } else if (event.eventType === 'SAFE_ROUTE_FOUND') {
        const routeId = (event.payload as any).routeId || 'default';
        const safePath = (event.payload as any).polyline || (event.payload as any).safePath;
        const hazardId = (event.payload as any).hazardId;

        this.routeMemory.recordRerouteAttempt(routeId, true, {
          reason: 'Secure route corridor generated bypass around threats',
          safeCorridor: safePath,
          confidence: event.confidence || 0.95
        });

        if (hazardId) {
          const hazard = this.hazardMemory.getHazard(hazardId);
          if (hazard) {
            this.hazardMemory.evolveHazard(
              hazardId,
              event.sourceAgent,
              { 
                affectedRoutes: Array.from(new Set([...hazard.affectedRoutes, routeId]))
              },
              'Found Safe Route bypass',
              'Collaborating routing agent discovered safe bypass corridor'
            );
            this.syncHazardToFirebase(hazard);
          }
        }

      } else if (event.eventType === 'ALERT_TRIGGERED') {
        const alertId = (event.payload as any).alertId || `alt-${Date.now()}`;
        const hazardId = (event.payload as any).hazardId;

        this.alertMemory.recordAlertTrigger(alertId, event.sourceAgent, hazardId);

        // Sync Alert to Firestore
        const alertObj = {
          title: 'TACTICAL HAZARD ALERT',
          message: (event.payload as any).reason || (event.payload as any).message || 'A hazardous condition has been detected in your area.',
          severity: 'High' as any,
          targetHazardId: hazardId || '',
          targetRegion: 'Lahore Region',
          dispatchStatus: 'Sent' as any,
          sentAt: Date.now(),
          expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
        alertService.createAlert(sanitizeFirestorePayload(alertObj));

        if (hazardId) {
          const hazard = this.hazardMemory.getHazard(hazardId);
          if (hazard) {
            this.hazardMemory.evolveHazard(
              hazardId,
              event.sourceAgent,
              {
                issuedAlertIds: Array.from(new Set([...hazard.issuedAlertIds, alertId]))
              },
              'Triggered alert broadcast'
            );
            this.syncHazardToFirebase(hazard);
          }
        }

      } else if (event.eventType === 'ALERT_ESCALATED') {
        const alertId = (event.payload as any).alertId || `alt-${Date.now()}`;
        const hazardId = (event.payload as any).hazardId;

        this.alertMemory.recordAlertTrigger(alertId, event.sourceAgent, hazardId);
        this.alertMemory.escalateAlert(alertId, (event.payload as any).reason || 'Escalated danger zone indicators');

        // Sync Alert to Firestore
        const alertObj = {
          title: 'CRITICAL EVACUATION ESCALATION',
          message: (event.payload as any).reason || 'The AI has detected you are trapped. Autonomous rescue is initiated.',
          severity: 'Critical' as any,
          targetHazardId: hazardId || '',
          targetRegion: 'Lahore Region',
          dispatchStatus: 'Sent' as any,
          sentAt: Date.now(),
          expiresAt: Date.now() + 2 * 60 * 60 * 1000
        };
        alertService.createAlert(sanitizeFirestorePayload(alertObj));

        if (hazardId) {
          const hazard = this.hazardMemory.getHazard(hazardId);
          if (hazard) {
            this.hazardMemory.evolveHazard(
              hazardId,
              event.sourceAgent,
              {
                lifecycleState: 'ESCALATED',
                alertEscalationLevel: hazard.alertEscalationLevel + 1
              },
              'Evolving hazard state to ESCALATED',
              (event.payload as any).reason || 'Threat metrics and alert escalations exceeded threshold limits'
            );
            this.syncHazardToFirebase(hazard);
          }
        }
      }
    } catch (err) {
      console.error('[SharedMemoryManager] Hazard event processing error:', err);
    }
  }

  public clear(): void {
    this.hazardMemory.clear();
    this.routeMemory.clear();
    this.alertMemory.clear();
    this.confidenceMemory.clear();
    this.failedAttempts = {};
    this.eventHistory = [];
    this.lastUpdated = Date.now();
  }
}

export const sharedMemory = SharedMemoryManager.getInstance();
