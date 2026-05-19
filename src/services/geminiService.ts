import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

const getApiUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname || '127.0.0.1';
    return `http://${hostname}:5000/api/gemini-analysis`;
  }
  
  let host = '127.0.0.1';
  try {
    const manifest = (Constants.expoConfig as any) || (Constants as any).manifest;
    const debuggerHost = manifest?.debuggerHost || manifest?.hostUri;
    if (debuggerHost) {
      host = debuggerHost.split(':').shift() || '127.0.0.1';
    }
  } catch (e) {
    console.warn('[GeminiService] Could not resolve host IP via expo-constants, using fallback.');
  }

  // Fallback to standard loopbacks if no local network IP could be detected
  if (host === '127.0.0.1' || !host) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:5000/api/gemini-analysis'
      : 'http://127.0.0.1:5000/api/gemini-analysis';
  }

  return `http://${host}:5000/api/gemini-analysis`;
};

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
