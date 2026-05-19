import { Agent } from './AgentTypes';

// Ingestion Layer
import { normalizationAgent } from '../ingestion/NormalizationAgent';
import { crowdSourcedUnionAgent } from '../ingestion/CrowdSourcedUnionAgent';
import { sentimentDetectorAgent } from '../ingestion/SentimentDetectorAgent';

// Validation Layer
import { verificationFusionAgent } from '../verification/VerificationAgent';
import { shieldModuleAgent } from '../verification/ShieldModuleAgent';

// Analysis Layer
import { analystAgent } from '../analyst/AnalystAgent';

// Prediction & Response Layer
import { predictiveAgent } from '../predictive/PredictiveAgent';
import { routingAgent } from '../routing/RoutingAgent';
import { tacticalAnalyzerAgent } from '../alert/TacticalAnalyzerAgent';
import { coordinationPriorityAgent } from '../alert/CoordinationPriorityAgent';

// Legacy agents retained for backward compat
import { alertAgent } from '../dispatch/AlertAgent';
import { sentinelAgent } from '../sentinel/SentinelAgent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();

  private constructor() {
    // Ingestion
    this.register(normalizationAgent);
    this.register(crowdSourcedUnionAgent);
    this.register(sentimentDetectorAgent);

    // Validation
    this.register(verificationFusionAgent);
    this.register(shieldModuleAgent);

    // Analysis
    this.register(analystAgent);

    // Prediction & Response
    this.register(predictiveAgent);
    this.register(routingAgent);
    this.register(tacticalAnalyzerAgent);
    this.register(coordinationPriorityAgent);

    // Legacy
    this.register(alertAgent);
    this.register(sentinelAgent);
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public register(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`[AgentRegistry] Agent "${agent.id}" already registered. Overwriting.`);
    }
    this.agents.set(agent.id, agent);
  }

  public unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}

export const agentRegistry = AgentRegistry.getInstance();
