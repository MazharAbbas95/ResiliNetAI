import { SafetyState } from '../store/safetyStore';

export const EmergencyMessageBuilder = {
  build: (state: SafetyState, hazardType: string = 'Flood'): { title: string; body: string } => {
    switch (state) {
      case 'CRITICAL':
        return {
          title: `🚨 CRITICAL ${hazardType.toUpperCase()} ALERT`,
          body: 'Extreme danger detected in your immediate location. Evacuate to high ground now.'
        };
      case 'DANGER':
        return {
          title: `⚠️ ACTIVE ${hazardType.toUpperCase()} ZONE`,
          body: 'You have entered a validated flood zone. Avoid low-elevation roads.'
        };
      case 'WARNING':
        return {
          title: `⚠️ ${hazardType.toUpperCase()} WARNING`,
          body: 'Approaching active danger zone. Situational risk is escalating.'
        };
      case 'CAUTION':
        return {
          title: '🛡️ CAUTION: PROXIMITY ALERT',
          body: 'Potential flooding detected nearby. Monitoring situation.'
        };
      default:
        return {
          title: '✅ Safety Update',
          body: 'You are now outside the active hazard zone.'
        };
    }
  }
};
