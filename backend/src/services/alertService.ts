import { FirebaseService } from './firebaseService.ts';
import { AlertPayload } from '../types/index.ts';

export class AlertService {
  /**
   * Processes an incoming alert signal and dispatches it to the realtime database.
   */
  static async processAndDispatchAlert(payload: AlertPayload): Promise<string> {
    console.log(`[AlertService] Processing Alert: ${payload.title}`);
    
    // Additional logic for notification fan-out can be added here
    
    return await FirebaseService.createAlert(payload);
  }
}
