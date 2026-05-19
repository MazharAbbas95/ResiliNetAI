import { Agent, AgentTask, AgentResponse, ConfidenceState } from '../core/AgentTypes';
import { sentinelService, SentinelPayload } from '../../services/sentinelService';

export class SentinelAgent implements Agent {
  public id = 'sentinel';
  public name = 'SENTINEL';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const lat = task.payload?.lat || 0;
    const lng = task.payload?.lng || 0;
    
    const actions: string[] = [];
    const reasoning: string[] = [];
    let memoryUpdates: Record<string, any>[] = [];

    try {
      actions.push(`Requested validation from sentinelService at [${lat}, ${lng}]`);
      
      const payload: SentinelPayload = await sentinelService.getValidatedPayload(lat, lng);
      
      const { metadata, signalSummary, socialSignals } = payload;
      const confidence = socialSignals.length > 0 ? 0.85 : 0.4;
      
      reasoning.push(`Processed ${socialSignals.length} unique signals`);
      reasoning.push(`Filtered ${metadata.removedSignals} duplicates`);
      reasoning.push(`Overall severity assessed as ${signalSummary.overallSeverity.toUpperCase()}`);

      if (metadata.sourceIntegrity === 'degraded') {
        reasoning.push('Source integrity is degraded, reducing confidence');
      }

      memoryUpdates.push({
        type: 'confidence_update',
        agent: this.name,
        value: confidence,
        severity: signalSummary.overallSeverity.toUpperCase()
      });

      return {
        success: true,
        confidence,
        requiresVerification: confidence < 0.6,
        requiresEscalation: false,
        nextAgent: 'ANALYST',
        reasoning,
        actions,
        memoryUpdates,
        eventType: 'CONFIDENCE_UPDATED',
        timestamp: Date.now()
      };
    } catch (error: any) {
      actions.push('Failed to validate payload');
      reasoning.push(error.message || 'Unknown error during sentinel execution');
      
      return {
        success: false,
        confidence: 0,
        requiresVerification: true,
        requiresEscalation: false,
        feedbackAgent: 'VERIFICATION',
        reasoning,
        actions,
        memoryUpdates,
        timestamp: Date.now()
      };
    }
  }
}

export const sentinelAgent = new SentinelAgent();
