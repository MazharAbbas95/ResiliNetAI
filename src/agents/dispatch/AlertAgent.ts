import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { useSafetyStore } from '../../store/safetyStore';
import { useNavigationStore } from '../../store/navigationStore';
import { useLocationStore } from '../../store/locationStore';
import { useSocialSignalStore } from '../../store/socialSignalStore';
import { Alert, Linking } from 'react-native';

export class AlertAgent implements Agent {
  public id = 'alert';
  public name = 'ALERT';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];
    let memoryUpdates: Record<string, any>[] = [];

    try {
      const { status } = useSafetyStore.getState();
      const { routeInfo } = useNavigationStore.getState();
      const { currentLocation } = useLocationStore.getState();
      const { addReport } = useSocialSignalStore.getState();

      const context = task.payload?.context;
      let isCritical = status.state === 'CRITICAL' || task.payload?.escalation;

      if (context) {
        reasoning.push(`Loaded pre-analysis context: verified ${context.nearbyHazardsCount} active nearby hazards.`);
        reasoning.push(`Highest local threat severity graded as: ${context.highestNearbySeverity}.`);
        if (context.activeEscalationsCount > 0) {
          reasoning.push(`Operational Alert: detected ${context.activeEscalationsCount} active escalations in the local geofence.`);
        }

        // Block premature alert escalations under weak confidence/severity
        const isWeakAlert = context.highestNearbySeverity === 'LOW' && context.activeEscalationsCount === 0;
        if (isWeakAlert) {
          reasoning.push('[Alert] Low-confidence alert dispatch blocked. Preventing spammy warning notifications.');
          actions.push('[Alert] Blocked premature emergency escalation; looping back to VERIFICATION.');
          
          return {
            success: false,
            confidence: 0.35,
            requiresVerification: true,
            requiresEscalation: false,
            nextAgent: 'VERIFICATION',
            feedbackAgent: 'VERIFICATION',
            reasoning,
            actions,
            memoryUpdates,
            eventType: 'ESCALATION_BLOCKED',
            timestamp: Date.now()
          };
        }

        // Auto-escalate if severe threats are nearby
        if (context.highestNearbySeverity === 'CRITICAL' || context.activeEscalationsCount > 0) {
          isCritical = true;
          reasoning.push('Elevated threat metrics verified via temporal memory; upgrading alert state to CRITICAL.');
        }
      }

      const isTrapped = isCritical && (!routeInfo || routeInfo.coordinates.length === 0);

      // Safe Idempotent Check: Track delivered alert task IDs statically
      const taskId = task.id;
      if (AlertAgent.deliveredAlertTasks.has(taskId)) {
        reasoning.push(`[Alert Agent] Task ${taskId} has already finalized alerts. Dropping redundant execution.`);
        return {
          success: true,
          confidence: 1.0,
          requiresVerification: false,
          requiresEscalation: false,
          reasoning,
          actions: ['Blocked redundant alert broadcast'],
          memoryUpdates,
          timestamp: Date.now()
        };
      }

      if (isTrapped && currentLocation) {
        reasoning.push('User is trapped with no safe evacuation route in a critical zone');
        actions.push('Initiated Autonomous HelpAid Dispatch');
        actions.push('Triggered native device SOS Alert');

        AlertAgent.deliveredAlertTasks.add(taskId);

        addReport({
          id: `auto-dispatch-${Date.now()}`,
          text: "AUTONOMOUS EMERGENCY DISPATCH: User trapped in critical zone. Immediate rescue required.",
          severity: 'critical',
          timestamp: Math.floor(Date.now() / 1000),
          coordinates: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude
          },
          locationName: 'Trapped User Location',
          source: 'autonomous-dispatch-agent'
        });

        // Async alert to UI (non-blocking for orchestrator)
        setTimeout(() => {
          Alert.alert(
            "🚨 AUTONOMOUS DISPATCH ACTIVE",
            "The AI has detected you are in a trapped state. Your location has been shared with HelpAid systems and an emergency call is being initiated.",
            [
              { 
                text: "CALL HELPAID", 
                onPress: () => Linking.openURL('tel:1122'),
                style: 'destructive'
              }
            ]
          );
        }, 100);

        return {
          success: true,
          confidence: 1.0,
          requiresVerification: false,
          requiresEscalation: false, // Set to false to avoid further escalation
          reasoning,
          actions,
          memoryUpdates,
          timestamp: Date.now()
        };
      }

      reasoning.push('User is not in a trapped or critical state requiring auto-dispatch');
      AlertAgent.deliveredAlertTasks.add(taskId);

      return {
        success: true,
        confidence: 0.9,
        requiresVerification: false,
        requiresEscalation: false,
        reasoning,
        actions,
        memoryUpdates,
        timestamp: Date.now()
      };
      
    } catch (error: any) {
      actions.push('Failed to evaluate alert escalation');
      reasoning.push(error.message || 'Unknown error during alert execution');
      
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

  public static deliveredAlertTasks = new Set<string>();
}

export const alertAgent = new AlertAgent();
