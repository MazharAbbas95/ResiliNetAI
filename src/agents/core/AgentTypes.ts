export type AgentName = 'NORMALIZATION' | 'CROWD' | 'SENTIMENT' | 'SENTINEL' | 'VERIFICATION' | 'ANALYST' | 'SHIELD' | 'ROUTING' | 'TACTICAL' | 'PRIORITY' | 'ALERT' | 'PREDICTIVE';

export type EventType = 
  | 'HAZARD_DETECTED'
  | 'SIGNAL_VALIDATED'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_FAILED'
  | 'CONFIDENCE_UPDATED'
  | 'ROUTE_UNSAFE'
  | 'SAFE_ROUTE_FOUND'
  | 'REROUTE_REQUIRED'
  | 'ALERT_TRIGGERED'
  | 'ALERT_ESCALATED'
  | 'REANALYZE_REQUIRED'
  | 'MEMORY_UPDATED'
  | 'AGENT_RETRY'
  | 'AGENT_FAILURE'
  | 'ESCALATION_BLOCKED'
  | 'ROUTE_REJECTED'
  | 'RETRY_TRIGGERED'
  | 'CONFIDENCE_DOWNGRADED'
  | 'NEGOTIATION_STARTED'
  | 'NEGOTIATION_RESPONSE'
  | 'CONSENSUS_REACHED'
  | 'ROUTE_DISPUTED'
  | 'REANALYSIS_APPROVED'
  | 'RETRY_DELAYED'
  | 'RETRY_EXPIRED'
  | 'RECOVERY_MODE_ENABLED'
  | 'AGENT_STALLED'
  | 'FAILURE_ESCALATED'
  | 'TASK_RECOVERED'
  | 'FUTURE_RISK_DETECTED'
  | 'ESCALATION_PROBABLE'
  | 'PREDICTIVE_REROUTE_REQUIRED'
  | 'EARLY_WARNING_TRIGGERED'
  | 'FUTURE_CORRIDOR_UNSAFE'
  | 'LOCATION_UNVERIFIED'
  | 'PREDICTION_UPDATED'
  | 'ORCHESTRATION_STEP_COMPLETE'
  | 'ROUTE_ANALYSIS_COMPLETE'
  | 'ESCALATION_BLOCKED_SAFETY';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceState = 'LOW_CONFIDENCE' | 'VERIFIED' | 'ESCALATED' | 'REJECTED';

export interface AgentResponse {
  success: boolean;
  confidence: number;
  requiresVerification: boolean;
  requiresEscalation: boolean;
  nextAgent?: AgentName | string;
  feedbackAgent?: AgentName | string;
  reasoning: string[];
  actions: string[];
  memoryUpdates: Record<string, any>[];
  eventType?: EventType | string;
  retryCount?: number;
  timestamp?: number;
}

export interface AgentTask {
  id: string;
  payload: any;
  sourceAgent?: string;
  timestamp: number;
  retryCount?: number;
}

export interface AgentEventPayload {
  eventId: string;
  eventType: EventType;
  sourceAgent: string;
  targetAgent?: string;
  confidence?: number;
  severity?: string;
  timestamp: number;
  payload: any;
  retryCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  execute: (task: AgentTask) => Promise<AgentResponse>;
}
