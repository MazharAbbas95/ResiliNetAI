import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';

export type UrgencyLevel = 'CALM' | 'CONCERN' | 'PANIC' | 'DISTRESS';

export interface SentimentResult {
  urgencyLevel: UrgencyLevel;
  urgencyScore: number; // 0.0 - 1.0
  emotionalMarkers: string[];
  isHysteria: boolean; // True if the signal shows signs of panic-exaggeration
  sentimentSummary: string;
}

const PANIC_MARKERS = ['help', 'sos', 'dying', 'trapped', 'cant breathe', 'emergency', 'mayday', 'urgent', 'please', 'drowning', 'rescue me'];
const DISTRESS_MARKERS = ['danger', 'critical', 'severe', 'extreme', 'catastrophic', 'disaster', 'devastating'];
const CONCERN_MARKERS = ['worried', 'bad', 'concerning', 'bad weather', 'flooding', 'rising', 'heavy', 'strong'];
const HYSTERIA_MARKERS = ['worst ever', 'apocalypse', 'city underwater', 'everything destroyed', 'entire area flooded', 'definitely going to die'];

function detectMarkers(text: string, markers: string[]): string[] {
  const lower = text.toLowerCase();
  return markers.filter(m => lower.includes(m));
}

export class SentimentDetectorAgent implements Agent {
  public id = 'sentiment';
  public name = 'SENTIMENT';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];

    const rawText: string = task.payload?.normalizedSignal?.rawInput
      ?? task.payload?.rawText
      ?? task.payload?.text
      ?? '';

    if (!rawText || rawText.trim().length < 3) {
      return {
        success: true,
        confidence: 0,
        requiresVerification: false,
        requiresEscalation: false,
        nextAgent: 'VERIFICATION',
        reasoning: ['No text provided. Sentiment defaulting to CALM.'],
        actions: ['Skipped sentiment analysis: no input text'],
        memoryUpdates: [{ type: 'SENTIMENT_RESULT', result: { urgencyLevel: 'CALM', urgencyScore: 0, emotionalMarkers: [], isHysteria: false, sentimentSummary: 'No input detected' } }],
        timestamp: Date.now(),
      };
    }

    const panicFound = detectMarkers(rawText, PANIC_MARKERS);
    const distressFound = detectMarkers(rawText, DISTRESS_MARKERS);
    const concernFound = detectMarkers(rawText, CONCERN_MARKERS);
    const hysteriaFound = detectMarkers(rawText, HYSTERIA_MARKERS);

    const allMarkers = [...panicFound, ...distressFound, ...concernFound, ...hysteriaFound];

    let urgencyLevel: UrgencyLevel = 'CALM';
    let urgencyScore = 0.05;

    if (panicFound.length > 0) {
      urgencyLevel = 'DISTRESS';
      urgencyScore = Math.min(0.95, 0.65 + panicFound.length * 0.10);
    } else if (distressFound.length > 0) {
      urgencyLevel = 'PANIC';
      urgencyScore = Math.min(0.80, 0.45 + distressFound.length * 0.10);
    } else if (concernFound.length > 0) {
      urgencyLevel = 'CONCERN';
      urgencyScore = Math.min(0.55, 0.20 + concernFound.length * 0.08);
    }

    const isHysteria = hysteriaFound.length > 0;

    // Hysteria discounts urgency score — hyperbole lowers credibility
    if (isHysteria) {
      urgencyScore = Math.max(0.05, urgencyScore - 0.25);
      reasoning.push(`CAUTION: Hysterical language detected (${hysteriaFound.join(', ')}). Discounting credibility by 25%.`);
      actions.push('Applied hysteria discount to urgency score.');
    }

    const sentimentSummary = isHysteria
      ? `Signal appears exaggerated. Urgency: ${urgencyLevel} (discounted from hyperbole).`
      : `Signal emotional state: ${urgencyLevel}. Markers: ${allMarkers.slice(0, 3).join(', ') || 'none'}.`;

    const result: SentimentResult = {
      urgencyLevel,
      urgencyScore,
      emotionalMarkers: allMarkers,
      isHysteria,
      sentimentSummary,
    };

    reasoning.push(`Emotional urgency classified as: ${urgencyLevel}`);
    reasoning.push(`Urgency score: ${(urgencyScore * 100).toFixed(0)}% — Context only, does NOT trigger alert.`);
    reasoning.push(`Note: Sentiment alone cannot escalate a hazard. Requires telemetry + verification.`);

    actions.push(`Detected ${allMarkers.length} emotional marker(s).`);
    actions.push(`Sentiment context packaged for Verification Fusion.`);

    return {
      success: true,
      confidence: urgencyScore,
      requiresVerification: true,
      requiresEscalation: false, // NEVER escalates from sentiment alone
      nextAgent: 'VERIFICATION',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'SENTIMENT_RESULT', result }],
      eventType: 'SIGNAL_VALIDATED',
      timestamp: Date.now(),
    };
  }
}

export const sentimentDetectorAgent = new SentimentDetectorAgent();
