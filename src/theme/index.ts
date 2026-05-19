import { COLORS } from './colors';
import { SPACING } from './spacing';
import { TYPOGRAPHY, TEXT_VARIANTS } from './typography';
import { RADIUS } from './radius';
import { SHADOWS } from './shadows';
import { ANIMATIONS } from './animations';
import { GRADIENTS } from './gradients';

export const THEME = {
  dark: true,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
  fonts: {
    regular: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontWeight: '400' as const },
    medium: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontWeight: '500' as const },
    bold: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontWeight: '700' as const },
    heavy: { fontFamily: TYPOGRAPHY.fontFamily.black, fontWeight: '900' as const },
  },
};

export { COLORS, SPACING, TYPOGRAPHY, TEXT_VARIANTS, RADIUS, SHADOWS, ANIMATIONS, GRADIENTS };
