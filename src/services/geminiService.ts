import axios from 'axios';
import API_BASE_URL from '@config/api';

export interface GeminiAnalysis {
  hazardAssessment: {
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    riskFactors: string[];
  };
  environmentalAnalysis: {
    rainfallRisk: string;
    socialSignalRisk: string;
    stormIntensity: string;
  };
  recommendation: {
    monitorClosely: boolean;
    preparePolygonGeneration: boolean;
  };
}

const getApiUrl = () => `${API_BASE_URL}/api/gemini-analysis`;

export const geminiService = {
  /**
   * Fetches AI-driven hazard analysis from the backend.
   */
  getAnalysis: async (lat: number, lng: number): Promise<GeminiAnalysis> => {
    try {
      const apiUrl = getApiUrl();
      console.log(`[GeminiService] Fetching AI analysis for ${lat}, ${lng} from ${apiUrl}...`);

      const response = await axios.get(apiUrl, {
        params: { lat, lng },
        timeout: 10000
      });

      return response.data.analysis;
    } catch (error: any) {
      console.error('[GeminiService] AI Fetch failed:', error.message ?? error);

      // Fallback for UI robustness
      return {
        hazardAssessment: {
          overallSeverity: 'medium',
          confidence: 0.0,
          riskFactors: ['ai processing unavailable'],
        },
        environmentalAnalysis: {
          rainfallRisk: 'unknown',
          socialSignalRisk: 'unknown',
          stormIntensity: 'unknown',
        },
        recommendation: {
          monitorClosely: true,
          preparePolygonGeneration: false,
        },
      };
    }
  },

  /**
   * Analyzes raw user text input using the backend Gemini endpoint.
   */
  analyzeRawText: async (text: string): Promise<{
    isThreat: boolean;
    classification: string;
    condition: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    reasoning: string;
  }> => {
    try {
      const apiUrl = `${getApiUrl()}/text`;
      console.log(`[GeminiService] Fetching raw text analysis for "${text}" from ${apiUrl}...`);

      const response = await axios.get(apiUrl, {
        params: { text },
        timeout: 10000
      });

      return response.data.analysis;
    } catch (error: any) {
      console.error('[GeminiService] Raw text AI analysis failed:', error.message ?? error);
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
};
