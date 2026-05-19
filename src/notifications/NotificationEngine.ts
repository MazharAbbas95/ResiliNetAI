import { SafetyState } from '../store/safetyStore';
import { FCMManager } from './FCMManager';
import { EmergencyMessageBuilder } from './EmergencyMessageBuilder';
import { NotificationCooldown } from './NotificationCooldown';
import { useOrchestrationStore } from '../store/orchestrationStore';

export const NotificationEngine = {
  processSafetyEvent: async (state: SafetyState, hazardId: string | null) => {
    // 1. Don't notify for SAFE state unless it's a recovery
    if (state === 'SAFE' && !hazardId) return;

    const id = hazardId || 'recovery';

    // 2. Strict Delivery Gating & Verification Verification Check
    let isVerified = false;
    let band: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
    let confidence = 0.0;

    if (hazardId && hazardId !== 'recovery') {
      try {
        const { useAnalystStore } = require('../store/analystStore');
        const { sharedMemory } = require('../agents/core/AgentMemory');
        
        const { analysis } = useAnalystStore.getState();
        const hazardZone = analysis?.hazardZones.find((z: any) => z.zoneId === hazardId);
        
        const verificationState = sharedMemory.getVerificationState(hazardId) || hazardZone?.verificationState || 'unverified';
        isVerified = verificationState === 'verified';
        
        confidence = sharedMemory.getHazardConfidence(hazardId) ?? hazardZone?.confidence ?? 0.0;
        
        if (confidence > 0.80) band = 'RED';
        else if (confidence > 0.60) band = 'ORANGE';
        else if (confidence > 0.30) band = 'YELLOW';
        
        console.log(`[NotificationEngine] Evaluating Gating: HazardId=${hazardId} | Verified=${isVerified} | Confidence=${(confidence*100).toFixed(0)}% (Band=${band})`);
      } catch (err) {
        console.warn('[NotificationEngine] Error checking verification status:', err);
      }
    } else {
      // Safe recovery signals bypass verification gating
      isVerified = true;
      band = 'GREEN';
    }

    if (state !== 'SAFE') {
      // Notifications only sent AFTER successful verification, rejected threats never notify
      if (!isVerified) {
        console.warn(`[NotificationEngine] Gating Block: Silencing unverified alert warning for Hazard ID: ${hazardId}`);
        return;
      }

      // Notification delivery ONLY allowed for: ORANGE, RED
      if (band !== 'ORANGE' && band !== 'RED') {
        console.warn(`[NotificationEngine] Gating Block: Silencing low-severity band (${band}) warning for Hazard ID: ${hazardId}`);
        return;
      }
    }
    
    // 3. Apply Cooldown/Spam Prevention
    if (!NotificationCooldown.shouldNotify(id, state)) {
      return;
    }

    // 4. Build AI-Driven Message
    const { title, body } = EmergencyMessageBuilder.build(state);

    // 5. Log to AI Pipeline for Observability
    const { addLog } = useOrchestrationStore.getState();
    addLog({ 
      agent: 'system', 
      message: `Emergency Notification Triggered: ${state} for ${id} (Confidence: ${(confidence*100).toFixed(0)}%)`, 
      status: state === 'SAFE' ? 'success' : 'warning' 
    });

    // 6. Deliver via FCM / Local Notifications
    await FCMManager.sendLocalNotification(title, body, state === 'CRITICAL' ? 'max' : 'high');
    
    console.log(`[NotificationEngine] Alert Delivered: ${title}`);
  }
};
