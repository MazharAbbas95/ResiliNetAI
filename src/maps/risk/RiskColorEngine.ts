export interface RiskStyle {
  fillColor: string;
  strokeColor: string;
  glowColor: string;
  opacity: number;
  pulseDuration: number;
  borderWidth: number;
  label: string;
}

export const RISK_PALETTE = {
  LOW: '#FFD60A',
  MEDIUM: '#FF9500',
  HIGH: '#FB6138',
  CRITICAL: '#FF3B30',
};

export const RiskColorEngine = {
  getStyle: (confidence: number, severity: string): RiskStyle => {
    // 1. Determine Base Risk Level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (confidence >= 85 || severity === 'critical') level = 'CRITICAL';
    else if (confidence >= 65 || severity === 'high') level = 'HIGH';
    else if (confidence >= 40 || severity === 'medium') level = 'MEDIUM';
    else level = 'LOW';

    // 2. Map Level to Visual Styles
    switch (level) {
      case 'CRITICAL':
        return {
          fillColor: 'rgba(255, 59, 48, 0.45)',
          strokeColor: 'rgba(255, 59, 48, 0.9)',
          glowColor: RISK_PALETTE.CRITICAL,
          opacity: 0.8,
          pulseDuration: 1000,
          borderWidth: 4,
          label: 'CRITICAL RISK',
        };
      case 'HIGH':
        return {
          fillColor: 'rgba(251, 97, 56, 0.4)',
          strokeColor: 'rgba(251, 97, 56, 0.85)',
          glowColor: RISK_PALETTE.HIGH,
          opacity: 0.7,
          pulseDuration: 2000,
          borderWidth: 3,
          label: 'HIGH RISK',
        };
      case 'MEDIUM':
        return {
          fillColor: 'rgba(255, 149, 0, 0.35)',
          strokeColor: 'rgba(255, 149, 0, 0.75)',
          glowColor: RISK_PALETTE.MEDIUM,
          opacity: 0.6,
          pulseDuration: 3000,
          borderWidth: 2,
          label: 'MEDIUM RISK',
        };
      default:
        return {
          fillColor: 'rgba(255, 214, 10, 0.25)',
          strokeColor: 'rgba(255, 214, 10, 0.6)',
          glowColor: RISK_PALETTE.LOW,
          opacity: 0.4,
          pulseDuration: 4000,
          borderWidth: 1.5,
          label: 'LOW RISK',
        };
    }
  }
};
