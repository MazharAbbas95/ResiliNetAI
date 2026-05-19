import { GeminiIntegration } from '../integrations/gemini';
import { SentinelPayload } from '../agents/sentinel/types/sentinelTypes';

export interface GeminiAnalysisPayload {
  hazardAssessment: {
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    riskFactors: string[];
  };
  environmentalAnalysis: {
    rainfallRisk: 'low' | 'medium' | 'high' | 'critical';
    socialSignalRisk: 'low' | 'medium' | 'high' | 'critical';
    stormIntensity: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendation: {
    monitorClosely: boolean;
    preparePolygonGeneration: boolean;
  };
}

export class GeminiService {
  /**
   * Analyzes Sentinel intelligence using Gemini 2.5 Flash.
   */
  static async analyzeSignals(sentinelData: SentinelPayload): Promise<GeminiAnalysisPayload> {
    const startTime = Date.now();
    console.log('[GeminiService] ▶ Starting AI analysis...');

    const model = GeminiIntegration.getModel();

    const prompt = `
      You are a senior disaster intelligence AI. 
      Analyze the following validated environmental and social signal payload for flood risk.
      
      DATA:
      - Location: ${sentinelData.location.region} (${sentinelData.location.lat}, ${sentinelData.location.lng})
      - Weather: ${JSON.stringify(sentinelData.weather)}
      - Social Signals: ${JSON.stringify(sentinelData.socialSignals.slice(0, 10))}
      - Summary: ${JSON.stringify(sentinelData.signalSummary)}
      
      TASK:
      1. Assess overall hazard severity.
      2. Evaluate risk factors (rainfall, social signal density, storm activity).
      3. Determine storm intensity.
      4. Provide actionable monitoring recommendations.
      
      STRICT REQUIREMENTS:
      - Output MUST be deterministic JSON.
      - Use ONLY the following severity labels: low, medium, high, critical.
      - NO markdown, NO explanations, NO conversational text.
      - Base analysis ONLY on provided data.
      
      JSON FORMAT:
      {
        "hazardAssessment": {
          "overallSeverity": "string",
          "confidence": number,
          "riskFactors": ["string"]
        },
        "environmentalAnalysis": {
          "rainfallRisk": "string",
          "socialSignalRisk": "string",
          "stormIntensity": "string"
        },
        "recommendation": {
          "monitorClosely": boolean,
          "preparePolygonGeneration": boolean
        }
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean potential markdown or extra characters
      const cleanedJson = responseText.replace(/```json|```/g, '').trim();
      const analysis: GeminiAnalysisPayload = JSON.parse(cleanedJson);

      // Simple validation of the severity labels
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(analysis.hazardAssessment.overallSeverity)) {
        analysis.hazardAssessment.overallSeverity = 'medium';
      }

      console.log(`[GeminiService] ✅ AI Analysis complete in ${Date.now() - startTime}ms`);
      return analysis;
    } catch (error: any) {
      console.error('[GeminiService] AI analysis failed:', error.message ?? error);
      
      // Fallback response
      return {
        hazardAssessment: {
          overallSeverity: sentinelData.signalSummary.overallSeverity as any,
          confidence: 0.5,
          riskFactors: ['fallback: ai unreachable'],
        },
        environmentalAnalysis: {
          rainfallRisk: 'medium',
          socialSignalRisk: 'medium',
          stormIntensity: 'medium',
        },
        recommendation: {
          monitorClosely: true,
          preparePolygonGeneration: false,
        },
      };
    }
  }

  /**
   * Analyzes a raw text signal directly using Gemini 2.5 Flash.
   */
  static async analyzeRawText(text: string): Promise<{
    isThreat: boolean;
    classification: string;
    condition: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    reasoning: string;
  }> {
    const startTime = Date.now();
    console.log(`[GeminiService] ▶ Analyzing raw text: "${text}"...`);

    const model = GeminiIntegration.getModel();

    const prompt = `
      You are a disaster intelligence AI. 
      Analyze the following raw user text input reporting an environmental or weather condition.
      
      TEXT: "${text}"
      
      Determine:
      1. Is there an active threat (e.g. flood, heavy rain, storm, fire) or is it safe/normal weather (e.g. cool, nice breeze, light shower, dry)?
      2. Classification of threat (weather_observation, flood_report, emergency_distress, general_observation, road_incident, or safe).
      3. Primary condition keyword.
      4. Location name mentioned.
      5. Is it a false alarm, exaggerated hyperbole, or a calm/safe observation?
      
      STRICT REQUIREMENTS:
      - Output MUST be deterministic JSON.
      - Use ONLY the following severity labels: low, medium, high, critical.
      - NO markdown, NO explanations, NO conversational text.
      
      JSON FORMAT:
      {
        "isThreat": boolean,
        "classification": "string",
        "condition": "string",
        "location": "string",
        "severity": "low" | "medium" | "high" | "critical",
        "confidence": number,
        "reasoning": "string"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const analysis = JSON.parse(cleanedJson);

      console.log(`[GeminiService] ✅ Raw text AI analysis complete in ${Date.now() - startTime}ms`);
      return {
        isThreat: !!analysis.isThreat,
        classification: analysis.classification || 'general_observation',
        condition: analysis.condition || 'unknown',
        location: analysis.location || 'Unknown Location',
        severity: analysis.severity || 'low',
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        reasoning: analysis.reasoning || '',
      };
    } catch (error: any) {
      console.error('[GeminiService] Raw text AI analysis failed:', error.message ?? error);
      
      // Fallback
      return {
        isThreat: false,
        classification: 'general_observation',
        condition: 'unknown',
        location: 'Unknown Location',
        severity: 'low',
        confidence: 0.2,
        reasoning: 'AI processing failed, degrading to heuristic rules.',
      };
    }
  }
}
