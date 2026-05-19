import { EventType, AgentEventPayload } from './AgentTypes';
import { sharedMemory } from './AgentMemory';
import { useOrchestrationStore } from '../../store/orchestrationStore';

type AgentEventHandler = (event: AgentEventPayload) => Promise<void> | void;

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export class AgentEventBus {
  private static instance: AgentEventBus;
  private listeners: Map<EventType, Set<AgentEventHandler>> = new Map();
  private globalListeners: Set<AgentEventHandler> = new Set();
  private processedEvents: Map<string, number> = new Map(); // Fingerprint hash -> timestamp
  private eventTimestamps: Map<string, number> = new Map(); // Sliding window tracking

  private constructor() {}

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
      sharedMemory.registerPublisher((event) => AgentEventBus.instance.publish(event));
    }
    return AgentEventBus.instance;
  }

  private cleanExpiredFingerprints(): void {
    const now = Date.now();
    const TTL = 15000; // 15 seconds

    for (const [key, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > TTL) {
        this.processedEvents.delete(key);
      }
    }

    for (const [key, timestamp] of this.eventTimestamps.entries()) {
      if (now - timestamp > TTL) {
        this.eventTimestamps.delete(key);
      }
    }
  }

  public subscribe(type: EventType, handler: AgentEventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  public subscribeAll(handler: AgentEventHandler): () => void {
    this.globalListeners.add(handler);
    return () => {
      this.globalListeners.delete(handler);
    };
  }

  public publish(event: Omit<AgentEventPayload, 'eventId' | 'timestamp'>): void {
    this.cleanExpiredFingerprints();

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullEvent: AgentEventPayload = {
      ...event,
      eventId,
      timestamp: Date.now(),
    };

    // Rule 1 & Rule 4: Terminal State Rejection
    const taskId = fullEvent.payload?.taskId || fullEvent.payload?.hazardId || fullEvent.payload?.originalTask?.id;
    if (taskId) {
      try {
        const { agentManager } = require('./AgentManager');
        const state = agentManager.getOrchestrationState(taskId);
        const TERMINAL_STATES = new Set(['FINALIZING', 'COMPLETED', 'FAILED', 'EXPIRED', 'RESOLVED', 'BLOCKED', 'ABORTED', 'TERMINATED', 'FINALIZED', 'STABILIZED_FAILURE']);
        if (TERMINAL_STATES.has(state)) {
          console.warn(`[EventBus] RULE 1 VIOLATION PREVENTED: Blocked event '${fullEvent.eventType}' for task '${taskId}' in terminal state '${state}'.`);
          return;
        }
      } catch (err) {
        // In case agentManager is not fully initialized yet
      }
    }

    // Event TTL check: automatic expiration of stale events (15s TTL)
    const EVENT_TTL_MS = 15000;
    if (Date.now() - fullEvent.timestamp > EVENT_TTL_MS) {
      console.warn(`[EventBus] Expired Event dropped. Type: ${fullEvent.eventType} | Source: ${fullEvent.sourceAgent}`);
      return;
    }

    // Deduplication check based on compact DJB2 fingerprint hash
    const payloadStr = JSON.stringify(fullEvent.payload || {});
    const rawKey = `${fullEvent.eventType}-${fullEvent.sourceAgent}-${payloadStr}`;
    const dedupKey = djb2Hash(rawKey);
    
    const now = Date.now();
    const lastFired = this.eventTimestamps.get(dedupKey) || 0;
    
    // Throttling: prevent identical events from firing within a 500ms window
    if (now - lastFired < 500) {
      console.warn(`[EventBus] Throttled: Suppressing duplicate event ${fullEvent.eventType} from ${fullEvent.sourceAgent} within 500ms.`);
      useOrchestrationStore.getState().incrementBlockedLoops();
      return;
    }
    this.eventTimestamps.set(dedupKey, now);

    if (this.processedEvents.has(dedupKey)) {
      console.warn(`[EventBus] Duplicate blocked: Suppression of duplicate event replay: ${fullEvent.eventType}`);
      useOrchestrationStore.getState().incrementBlockedLoops();
      return;
    }
    
    this.processedEvents.set(dedupKey, now);

    // Log history to Shared Memory
    sharedMemory.recordEvent(fullEvent);

    // Process type-specific handlers asynchronously
    const handlers = this.listeners.get(fullEvent.eventType);
    if (handlers) {
      setTimeout(() => {
        handlers.forEach(async (handler) => {
          try {
            await handler(fullEvent);
          } catch (error) {
            console.error(`[EventBus] Error in handler for ${fullEvent.eventType}:`, error);
          }
        });
      }, 0);
    }

    // Process global listeners asynchronously
    if (this.globalListeners.size > 0) {
      setTimeout(() => {
        this.globalListeners.forEach(async (handler) => {
          try {
            await handler(fullEvent);
          } catch (error) {
            console.error(`[EventBus] Error in global listener:`, error);
          }
        });
      }, 0);
    }
  }

  public reset(): void {
    this.processedEvents.clear();
    this.eventTimestamps.clear();
    console.log('[EventBus] Deduplication queues and sliding window registries successfully drained.');
  }
}

export const agentEventBus = AgentEventBus.getInstance();
