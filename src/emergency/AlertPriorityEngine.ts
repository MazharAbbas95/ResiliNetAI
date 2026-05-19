import { SafetyState } from '../store/safetyStore';

export interface AlertContent {
  title: string;
  subtitle: string;
  tone: string;
  recommendation: string;
  icon: string;
}

export const AlertPriorityEngine = {
  getContent: (state: SafetyState): AlertContent => {
    switch (state) {
      case 'CRITICAL':
        return {
          title: 'CRITICAL EMERGENCY',
          subtitle: 'Immediate danger detected. Major flooding confirmed in your current location.',
          tone: '#FF3B30',
          recommendation: 'Evacuate immediately to the nearest high-elevation shelter.',
          icon: 'flash',
        };
      case 'DANGER':
        return {
          title: 'ACTIVE DANGER ZONE',
          subtitle: 'You have entered a validated flood hazard area.',
          tone: '#FF3B30',
          recommendation: 'Seek safe ground and avoid low-lying roads or drainage channels.',
          icon: 'warning',
        };
      case 'WARNING':
        return {
          title: 'HAZARD WARNING',
          subtitle: 'Approaching an active flood zone. Situation is escalating.',
          tone: '#FB6138',
          recommendation: 'Change course to the suggested safe route immediately.',
          icon: 'alert-circle',
        };
      case 'CAUTION':
        return {
          title: 'CAUTION ADVISED',
          subtitle: 'Potential hazard detected in your vicinity.',
          tone: '#FF9500',
          recommendation: 'Stay alert and monitor conditions. Follow the tactical map closely.',
          icon: 'eye',
        };
      default:
        return {
          title: 'SITUATION STABLE',
          subtitle: 'No immediate threats detected.',
          tone: '#34C759',
          recommendation: 'Continue monitoring for updates.',
          icon: 'shield-checkmark',
        };
    }
  }
};
