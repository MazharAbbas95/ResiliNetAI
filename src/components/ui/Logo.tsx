import React, { useEffect } from 'react';
import { View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Defs, 
  LinearGradient, 
  Stop, 
  G, 
  Line 
} from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '@theme';
import { SafeText } from './SafeText';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'monochrome' | 'dark';
  animated?: boolean;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 120,
  variant = 'full',
  animated = true,
  style,
}) => {
  // Animation shared values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.8);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    if (animated) {
      // 1. Slow, premium rotation for the radar grid
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 20000,
          easing: Easing.linear,
        }),
        -1,
        false
      );

      // 2. Pulse for central nodes and signal emission
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(0.85, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );

      // 3. Glowing opacity pulse for connection lines
      glow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1800 }),
          withTiming(0.3, { duration: 1800 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      pulse.value = 1;
      glow.value = 0.6;
    }
  }, [animated]);

  // Animated styles for radar rings
  const radarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Animated styles for glowing network nodes
  const nodeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  // Animated styles for network path connections
  const lineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animated ? glow.value : 0.6,
    };
  });

  // Color selection based on variant
  const isMonochrome = variant === 'monochrome';
  const isDark = variant === 'dark';

  const primaryColor = isMonochrome 
    ? '#FFFFFF' 
    : isDark 
    ? '#1D2E4C' 
    : COLORS.primary; // Orange Accent
  const cyanColor = isMonochrome ? '#FFFFFF' : COLORS.accent; // Cyber Cyan
  const whiteAccent = isMonochrome ? '#FFFFFF' : '#FFFFFF';
  const mutedStroke = isMonochrome ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 229, 255, 0.15)';
  const gridStroke = isMonochrome ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 229, 255, 0.35)';

  // R Path and central branding styling
  const logoMark = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={styles.svg}
    >
      <Defs>
        <LinearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={cyanColor} />
          <Stop offset="100%" stopColor="#2979FF" />
        </LinearGradient>
        <LinearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} />
          <Stop offset="100%" stopColor="#FF8F70" />
        </LinearGradient>
      </Defs>

      {/* BACKGROUND GRAPHIC: Concentric Radar Pulse Grids (Rotating) */}
      {/* @ts-ignore */}
      <AnimatedG style={radarAnimatedStyle} origin="50, 50">
        {/* Outer dotted telemetry boundary */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          stroke={mutedStroke}
          strokeWidth="0.8"
          strokeDasharray="4 4"
          fill="none"
        />
        {/* Mid-level solid connection perimeter */}
        <Circle
          cx="50"
          cy="50"
          r="34"
          stroke={mutedStroke}
          strokeWidth="0.8"
          fill="none"
        />
        {/* Inner coordinate grid axes */}
        <Line x1="50" y1="5" x2="50" y2="95" stroke={mutedStroke} strokeWidth="0.5" strokeDasharray="3 6" />
        <Line x1="5" y1="50" x2="95" y2="50" stroke={mutedStroke} strokeWidth="0.5" strokeDasharray="3 6" />
      </AnimatedG>

      {/* SYSTEM NETWORK LAYERS: Interconnected Intelligence Nodes */}
      <G>
        {/* Network Connection Lines (Opacity glow animated) */}
        {/* @ts-ignore */}
        <AnimatedLine x1="50" y1="16" x2="80" y2="38" stroke={cyanColor} strokeWidth="1" style={lineAnimatedStyle} />
        {/* @ts-ignore */}
        <AnimatedLine x1="80" y1="38" x2="68" y2="78" stroke={cyanColor} strokeWidth="1" style={lineAnimatedStyle} />
        {/* @ts-ignore */}
        <AnimatedLine x1="68" y1="78" x2="32" y2="78" stroke={cyanColor} strokeWidth="1" style={lineAnimatedStyle} />
        {/* @ts-ignore */}
        <AnimatedLine x1="32" y1="78" x2="20" y2="38" stroke={cyanColor} strokeWidth="1" style={lineAnimatedStyle} />
        {/* @ts-ignore */}
        <AnimatedLine x1="20" y1="38" x2="50" y2="16" stroke={cyanColor} strokeWidth="1" style={lineAnimatedStyle} />
        
        {/* Inner connection spokes to central hub */}
        <Line x1="50" y1="16" x2="50" y2="50" stroke={cyanColor} strokeWidth="0.6" opacity={0.4} />
        <Line x1="80" y1="38" x2="50" y2="50" stroke={cyanColor} strokeWidth="0.6" opacity={0.4} />
        <Line x1="68" y1="78" x2="50" y2="50" stroke={cyanColor} strokeWidth="0.6" opacity={0.4} />
        <Line x1="32" y1="78" x2="50" y2="50" stroke={cyanColor} strokeWidth="0.6" opacity={0.4} />
        <Line x1="20" y1="38" x2="50" y2="50" stroke={cyanColor} strokeWidth="0.6" opacity={0.4} />

        {/* Outer active nodes */}
        <Circle cx="50" cy="16" r="3.5" fill={cyanColor} />
        <Circle cx="80" cy="38" r="2.5" fill={cyanColor} />
        <Circle cx="68" cy="78" r="3" fill={primaryColor} />
        <Circle cx="32" cy="78" r="3" fill={cyanColor} />
        <Circle cx="20" cy="38" r="2.5" fill={primaryColor} />
      </G>

      {/* CORE BRAND MARK: Abstract Geometric "R" (Pulsing central nodes) */}
      {/* @ts-ignore */}
      <AnimatedG style={nodeAnimatedStyle} origin="50, 50">
        <Circle
          cx="50"
          cy="50"
          r="18"
          fill="rgba(11, 14, 17, 0.95)"
          stroke={gridStroke}
          strokeWidth="1.5"
        />
        
        {/* Sleek Vector 'R' Mark */}
        {/* Vert Stem */}
        <Path
          d="M44 40 L44 60"
          stroke="url(#cyanGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Upper Loop */}
        <Path
          d="M44 40 H52 C55.5 40 57.5 41.5 57.5 44.5 C57.5 47.5 55.5 49 52 49 H44"
          stroke="url(#cyanGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Diag Leg */}
        <Path
          d="M51 49 L57 60"
          stroke="url(#cyanGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        
        {/* Core signal locator blip */}
        <Circle
          cx="50"
          cy="50"
          r="1"
          fill={whiteAccent}
        />
      </AnimatedG>
    </Svg>
  );

  if (variant === 'icon') {
    return (
      <View style={[styles.container, style]}>
        {logoMark}
      </View>
    );
  }

  // Full Wordmark Layout
  return (
    <View style={[styles.container, style]}>
      {logoMark}
      
      {/* Title */}
      <SafeText style={[styles.title, isMonochrome && styles.textWhite]}>
        ResiliNet<SafeText style={styles.titleAccent}>AI</SafeText>
      </SafeText>
      
      {/* Subtitle */}
      <SafeText style={[styles.subtitle, isMonochrome && styles.textWhiteMuted]}>
        Autonomous Disaster Intelligence
      </SafeText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    alignSelf: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'System',
  },
  titleAccent: {
    color: COLORS.primary, // glowing emergency orange accent
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3.5,
    marginTop: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: 'System',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textWhiteMuted: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
