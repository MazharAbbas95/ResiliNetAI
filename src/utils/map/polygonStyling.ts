import { HazardSeverity } from '@appTypes/geospatial';
import { COLORS } from '@theme';

export interface PolygonStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export const polygonStyling = {
  getStyleBySeverity(severity: HazardSeverity): PolygonStyle {
    switch (severity) {
      case 'Critical':
        return {
          fillColor: 'rgba(155, 0, 0, 0.5)',
          strokeColor: COLORS.error,
          strokeWidth: 3,
        };
      case 'High':
        return {
          fillColor: 'rgba(229, 62, 62, 0.4)',
          strokeColor: COLORS.primary,
          strokeWidth: 2,
        };
      case 'Medium':
        return {
          fillColor: 'rgba(255, 165, 0, 0.4)',
          strokeColor: COLORS.warning,
          strokeWidth: 1.5,
        };
      case 'Low':
        return {
          fillColor: 'rgba(255, 255, 0, 0.3)',
          strokeColor: '#D69E2E',
          strokeWidth: 1,
        };
      default:
        return {
          fillColor: 'rgba(128, 128, 128, 0.3)',
          strokeColor: COLORS.border,
          strokeWidth: 1,
        };
    }
  }
};
