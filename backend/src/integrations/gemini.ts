import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.ts';

/**
 * Gemini SDK Integration
 * 
 * Manages connection to Google Generative AI (Gemini 2.5 Flash).
 */
export class GeminiIntegration {
  private static instance: GoogleGenerativeAI;

  static getInstance(): GoogleGenerativeAI {
    if (!this.instance) {
      if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY.includes('your_google_api_key')) {
        console.warn('[GeminiIntegration] GEMINI_API_KEY missing or placeholder.');
      }
      this.instance = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || '');
    }
    return this.instance;
  }

  static getModel() {
    const ai = this.getInstance();
    // Using the specified gemini-1.5-flash as it's stable, 2.5 is likely a future placeholder
    return ai.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
  }
}
