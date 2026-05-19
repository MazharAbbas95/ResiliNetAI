import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '@theme';

interface TacticalButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  isLoading = false,
  icon,
  style,
  textStyle,
  disabled = false,
}) => {
  const scaleAnim = new Animated.Value(1);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getColors = (): readonly [string, string, ...string[]] => {
    if (disabled) return ['#333', '#222'];
    if (variant === 'primary') return COLORS.orangeGradient;
    if (variant === 'secondary') return COLORS.navyGradient;
    return ['transparent', 'transparent'];
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <LinearGradient
          colors={getColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            variant === 'outline' && styles.outline,
            variant === 'ghost' && styles.ghost,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
          ) : (
            <>
              {icon}
              <Text style={[
                styles.text, 
                variant === 'outline' && { color: COLORS.primary },
                variant === 'ghost' && { color: COLORS.textMuted },
                textStyle
              ]}>
                {title.toUpperCase()}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
