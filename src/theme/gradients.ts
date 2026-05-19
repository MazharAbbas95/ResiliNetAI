import { COLORS } from './colors';

export const GRADIENTS = {
  orange: [COLORS.primary, '#FF8F70'] as const,
  navy: [COLORS.secondary, '#171717'] as const,
  dark: ['#171717', '#0B0D11'] as const,
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'] as const,
  hazard: ['#FF3B30', '#8E0000'] as const,
};
