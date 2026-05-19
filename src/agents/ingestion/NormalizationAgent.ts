import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';

export interface NormalizedSignal {
  type: 'weather_observation' | 'flood_report' | 'emergency_distress' | 'road_incident' | 'general_observation' | 'unknown';
  condition: string;
  location: string;
  severityIndicators: string[];
  entityKeywords: string[];
  rawConfidence: number; // 0.0 - 1.0, based on text evidence quality alone
  sourceType: 'user_input' | 'social_report' | 'api_feed' | 'sensor';
  verified: false;
  timestamp: number;
  rawInput: string;
}

/** Maps text patterns to hazard conditions */
const HAZARD_KEYWORDS: Record<string, { type: NormalizedSignal['type']; indicators: string[]; baseConfidence: number }> = {
  flood: { type: 'flood_report', indicators: ['flood', 'inundation', 'overflow'], baseConfidence: 0.55 },
  'flash flood': { type: 'flood_report', indicators: ['flash flood'], baseConfidence: 0.65 },
  'water level': { type: 'flood_report', indicators: ['water level rising'], baseConfidence: 0.50 },
  rain: { type: 'weather_observation', indicators: ['rain'], baseConfidence: 0.30 },
  'heavy rain': { type: 'weather_observation', indicators: ['heavy rain', 'rainfall'], baseConfidence: 0.40 },
  storm: { type: 'weather_observation', indicators: ['storm', 'thunderstorm'], baseConfidence: 0.45 },
  wind: { type: 'weather_observation', indicators: ['wind', 'gust'], baseConfidence: 0.25 },
  'road flooding': { type: 'road_incident', indicators: ['road flooding', 'road blocked', 'highway'], baseConfidence: 0.60 },
  emergency: { type: 'emergency_distress', indicators: ['emergency', 'help', 'trapped'], baseConfidence: 0.70 },
  rescue: { type: 'emergency_distress', indicators: ['rescue', 'sos', 'stranded'], baseConfidence: 0.75 },
};

const LOCATION_PATTERNS = [
  /(?:near|in|at|around|by)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?)/g,
  /([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s+(?:area|district|city|road|highway|bridge|river)/gi,
];

function extractLocation(text: string): string {
  for (const pattern of LOCATION_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1];
  }
  return 'Unknown Location';
}

function extractEntities(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const keyword of Object.keys(HAZARD_KEYWORDS)) {
    if (lower.includes(keyword)) found.push(keyword);
  }
  return [...new Set(found)];
}

export class NormalizationAgent implements Agent {
  public id = 'normalization';
  public name = 'NORMALIZATION';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const rawText: string = task.payload?.rawText || task.payload?.text || '';
    const actions: string[] = [];
    const reasoning: string[] = [];

    // Step 1: Sanitize
    const sanitized = rawText.trim().replace(/\s+/g, ' ').substring(0, 500);
    reasoning.push(`Raw input received: "${sanitized.substring(0, 80)}${sanitized.length > 80 ? '…' : ''}"`);

    if (!sanitized || sanitized.length < 5) {
      reasoning.push('Input rejected: Too short or empty. Cannot extract meaningful signal.');
      return {
        success: false,
        confidence: 0,
        requiresVerification: false,
        requiresEscalation: false,
        reasoning,
        actions: ['Rejected: Empty or malformed input'],
        memoryUpdates: [],
        eventType: 'VERIFICATION_FAILED',
        timestamp: Date.now(),
      };
    }

    // Step 2: Entity Extraction
    const entities = extractEntities(sanitized);
    let location = extractLocation(sanitized);
    actions.push(`Extracted ${entities.length} hazard keyword(s): ${entities.join(', ') || 'none'}`);
    actions.push(`Detected location: ${location}`);

    // Step 3: Type & Confidence Classification
    let detectedType: NormalizedSignal['type'] = 'general_observation';
    let severityIndicators: string[] = [];
    let rawConfidence = 0.10; // Floor confidence for any input

    let bestMatch: typeof HAZARD_KEYWORDS[string] | null = null;
    for (const entity of entities) {
      const candidate = HAZARD_KEYWORDS[entity];
      if (candidate && candidate.baseConfidence > (bestMatch?.baseConfidence ?? 0)) {
        bestMatch = candidate;
        detectedType = candidate.type;
        severityIndicators = candidate.indicators;
      }
    }

    if (bestMatch) {
      rawConfidence = bestMatch.baseConfidence;
      // Boost confidence slightly if multiple hazard keywords present
      if (entities.length > 1) rawConfidence = Math.min(0.75, rawConfidence + entities.length * 0.05);
    }

    // Call Gemini for high-fidelity structured analysis
    let aiThreat = false;
    let aiClassification = 'general_observation';
    let aiCondition = 'unknown';
    let aiLocation = location;
    let aiSeverity = 'low';
    let aiConfidence = 0.10;
    let aiReasoning = '';

    try {
      const { geminiService } = require('../../services/geminiService');
      const aiResult = await geminiService.analyzeRawText(sanitized);
      aiThreat = aiResult.isThreat;
      aiClassification = aiResult.classification;
      aiCondition = aiResult.condition;
      if (aiResult.location && aiResult.location !== 'Unknown Location') {
        aiLocation = aiResult.location;
        location = aiResult.location;
      }
      aiSeverity = aiResult.severity;
      aiConfidence = aiResult.confidence;
      aiReasoning = aiResult.reasoning;
      reasoning.push(`Gemini AI Grounding: ${aiReasoning}`);
    } catch (e: any) {
      reasoning.push(`Gemini API connection offline: falling back to heuristic classification.`);
    }

    // Blend Gemini AI with Heuristics
    if (aiConfidence > 0.10) {
      if (aiClassification === 'safe' || !aiThreat) {
        // Capped confidence for safe/cool/general comments
        rawConfidence = 0.10;
        detectedType = 'general_observation';
        reasoning.push('Gemini flagged this signal as safe/non-threatening. Setting confidence to baseline floor (10%).');
      } else {
        detectedType = aiClassification as any;
        rawConfidence = Math.max(rawConfidence, aiConfidence);
        reasoning.push(`Gemini validated active threat risk: severity=${aiSeverity}, confidence=${Math.round(aiConfidence * 100)}%`);
      }
    } else {
      // Single vague word = cap at LOW confidence if heuristics only
      if (entities.length <= 1 && sanitized.split(' ').length < 4) {
        rawConfidence = Math.min(rawConfidence, 0.20);
        reasoning.push('Confidence capped: Input too short and contains only one indicator keyword.');
      }
    }

    const normalizedSignal: NormalizedSignal = {
      type: detectedType,
      condition: entities[0] ?? 'unknown',
      location,
      severityIndicators,
      entityKeywords: entities,
      rawConfidence,
      sourceType: 'user_input',
      verified: false,
      timestamp: Date.now(),
      rawInput: sanitized,
    };

    reasoning.push(`Classified as: ${detectedType.toUpperCase()} | Condition: ${normalizedSignal.condition}`);
    reasoning.push(`Raw text-only confidence: ${(rawConfidence * 100).toFixed(0)}% — Requires telemetry corroboration.`);
    actions.push(`Normalized signal structured. Text-confidence: ${(rawConfidence * 100).toFixed(0)}%.`);

    return {
      success: true,
      confidence: rawConfidence,
      requiresVerification: true,
      requiresEscalation: false,
      nextAgent: 'CROWD',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'NORMALIZED_SIGNAL', signal: normalizedSignal }],
      eventType: 'SIGNAL_VALIDATED',
      timestamp: Date.now(),
    };
  }
}

export const normalizationAgent = new NormalizationAgent();
