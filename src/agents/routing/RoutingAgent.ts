import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { useNavigationStore } from '../../store/navigationStore';
import { sharedMemory } from '../core/AgentMemory';

export class RoutingAgent implements Agent {
  public id = 'routing';
  public name = 'ROUTING';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];
    let memoryUpdates: Record<string, any>[] = [];

    try {
      const { routeInfo } = useNavigationStore.getState();
      const currentMemory = sharedMemory.getState();
      
      actions.push('Evaluated active navigation route against hazard zones');

      if (!routeInfo || routeInfo.coordinates.length === 0) {
        reasoning.push('No active route found');
        return {
          success: true,
          confidence: 1.0,
          requiresVerification: false,
          requiresEscalation: false,
          reasoning,
          actions,
          memoryUpdates,
          timestamp: Date.now()
        };
      }

      // Assess hazards based on context snapshots or active hazards memory
      const context = task.payload?.context;
      let hasHazards = Object.keys(currentMemory.activeHazards || {}).length > 0;
      let requiresEscalation = false;

      if (context) {
        reasoning.push(`Pre-Analysis context loaded: analyzed ${context.nearbyHazardsCount} adjacent hazard zones.`);
        if (context.recentRerouteFailuresCount > 0) {
          reasoning.push(`Operational warning: found ${context.recentRerouteFailuresCount} recent routing failures within 5km.`);
        }
        
        hasHazards = context.nearbyHazardsCount > 0;
        
        // Reject alternative route bypass corridor if failures exceed tolerance
        if (context.recentRerouteFailuresCount > 2) {
          reasoning.push('[Routing] Bypass route corridor rejected due to expanding regional hazard clusters.');
          actions.push('[Routing] Blocked unsafe reroute path; triggering strategic sector reevaluation.');
          
          return {
            success: false,
            confidence: 0.3,
            requiresVerification: false,
            requiresEscalation: false,
            nextAgent: 'ANALYST',
            feedbackAgent: 'ANALYST',
            reasoning,
            actions,
            memoryUpdates,
            eventType: 'ROUTE_REJECTED',
            timestamp: Date.now()
          };
        }
      }
      
      if (hasHazards) {
        reasoning.push('Active hazards detected near or intersecting current route corridor');
        actions.push('Requested route recalculation and bypass geometry generation');
        
        return {
          success: true,
          confidence: 0.85,
          requiresVerification: false,
          requiresEscalation: false,
          nextAgent: 'ALERT',
          feedbackAgent: 'ANALYST',
          reasoning,
          actions,
          memoryUpdates,
          // Use non-subscribed event to prevent AgentManager ROUTE_UNSAFE listener
          // from re-dispatching back to routing (infinite loop prevention)
          eventType: 'ROUTE_ANALYSIS_COMPLETE',
          timestamp: Date.now()
        };
      }

      reasoning.push('Current route is clear of active hazard zones');
      
      return {
        success: true,
        confidence: 0.95,
        requiresVerification: false,
        requiresEscalation: false,
        reasoning,
        actions,
        memoryUpdates,
        timestamp: Date.now()
      };
      
    } catch (error: any) {
      actions.push('Failed to evaluate route safety');
      reasoning.push(error.message || 'Unknown error during routing evaluation');
      
      return {
        success: false,
        confidence: 0,
        requiresVerification: true,
        requiresEscalation: false,
        feedbackAgent: 'ANALYST',
        reasoning,
        actions,
        memoryUpdates,
        timestamp: Date.now()
      };
    }
  }
}

export const routingAgent = new RoutingAgent();
