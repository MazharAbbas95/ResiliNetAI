import { COLORS } from '@theme';

export const SeverityColorEngine = {
  getColors: (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          fill: 'rgba(255, 59, 48, 0.4)',
          stroke: 'rgba(255, 59, 48, 0.8)',
          glow: '#FF3B30',
        };
      case 'high':
        return {
          fill: 'rgba(251, 97, 56, 0.4)',
          stroke: 'rgba(251, 97, 56, 0.8)',
          glow: '#FB6138',
        };
      case 'medium':
        return {
          fill: 'rgba(255, 184, 0, 0.4)',
          stroke: 'rgba(255, 184, 0, 0.8)',
          glow: '#FFB800',
        };
      default:
        return {
          fill: 'rgba(52, 199, 89, 0.3)',
          stroke: 'rgba(52, 199, 89, 0.6)',
          glow: '#34C759',
        };
    }
  }
};
