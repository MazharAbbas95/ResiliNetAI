import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  ImageBackground, 
  FlatList,
  Platform
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS } from '@theme';
import { ROUTES } from '../navigation/routes';
import { RootStackParamList } from '../navigation/types';
import { Logo } from '../components/ui/Logo';
import { SafeText } from '../components/ui/SafeText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BOOT_LOGS = [
  '[SYS] BOOTING RESILINET AI PLATFORM v1.4.2...',
  '[SYS] SHIELDING ENCRYPTED DATA CORRIDORS...',
  '[SYS] CONNECTING TO METEOROLOGICAL TELEMETRY GRID...',
  '[SYS] FUSING GEOSPATIAL SATELLITE ARRAYS...',
  '[SYS] SPINNING UP MULTI-AGENT COGNITIVE ENGINE...',
  '[SYS] SYNCHRONIZING REAL-TIME THREAT DETECTORS...',
  '[SYS] DEPLOYING PREDICTIVE COLLABORATION MATRIX...',
  '[SYS] ALL AGENTS OPERATIONAL. PIPELINE SYNCHRONIZED.'
];

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  
  // Reanimated values
  const splashOpacity = useSharedValue(0);
  const scanLineY = useSharedValue(-100);
  const gridTranslateY = useSharedValue(0);

  // Fade in splash at mount
  useEffect(() => {
    splashOpacity.value = withTiming(1, { duration: 800 });

    // Slow, infinite telemetry grid panning animation
    gridTranslateY.value = withRepeat(
      withTiming(-50, { duration: 15000, easing: Easing.linear }),
      -1,
      true
    );

    // Infinite scanning laser line
    scanLineY.value = withRepeat(
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }),
      -1,
      false
    );

    // Telemetry log ticker simulator
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < BOOT_LOGS.length) {
        setVisibleLogs(prev => [...prev, BOOT_LOGS[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 280);

    // Transition timer - After 10 seconds, initiate transition
    const transitionTimer = setTimeout(() => {
      handleAppTransition();
    }, 10000);

    return () => {
      clearInterval(logInterval);
      clearTimeout(transitionTimer);
    };
  }, []);

  // Graceful native navigation transition
  const handleAppTransition = () => {
    // Fade out splash screen elements
    splashOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(navigateToDashboard)();
      }
    });
  };

  const navigateToDashboard = () => {
    // Reset stack to MainTabs to prevent returning to splash
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.MAIN_TABS }],
    });
  };

  // Reanimated style bindings
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: splashOpacity.value,
    };
  });

  const animatedScanLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanLineY.value }],
    };
  });

  const animatedGridStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: gridTranslateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedContainerStyle]}>
        {/* Cinematic dark telemetry background image */}
        <ImageBackground 
          source={require('../../assets/splash-icon.png')} 
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          {/* Subtle grid pattern movement */}
          <Animated.View style={[styles.gridOverlay, animatedGridStyle]} />

          {/* Core dark gradient overlay */}
          <LinearGradient
            colors={[
              'rgba(11, 13, 17, 0.95)',
              'rgba(11, 13, 17, 0.70)',
              'rgba(11, 13, 17, 0.98)'
            ]}
            style={StyleSheet.absoluteFill}
          />

          {/* Dynamic Laser Scanline */}
          <Animated.View style={[styles.scanLineContainer, animatedScanLineStyle]}>
            <LinearGradient
              colors={[
                'rgba(0, 229, 255, 0)',
                'rgba(0, 229, 255, 0.75)',
                'rgba(0, 229, 255, 0)'
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.scanLine}
            />
            {/* Subtle glow border */}
            <View style={styles.scanLineGlow} />
          </Animated.View>

          {/* Center Branding Content */}
          <View style={styles.brandContainer}>
            <Logo size={145} variant="full" animated={true} />
            
            {/* Dynamic Status Badging */}
            <View style={styles.statusBadgeContainer}>
              <View style={styles.statusDot} />
              <SafeText style={styles.statusText}>Live Telemetry Active</SafeText>
            </View>
          </View>

          {/* High-Tech Boot Ticker Console (Monospace) */}
          <View style={styles.consoleContainer}>
            <FlatList
              data={visibleLogs}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <SafeText style={styles.consoleText}>
                  {item}
                </SafeText>
              )}
              contentContainerStyle={styles.consoleList}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D11',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
    opacity: 0.2, // Blend background photo subtly
  },
  gridOverlay: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    bottom: -100,
    opacity: 0.15,
    borderWidth: 0.5,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  scanLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    zIndex: 10,
  },
  scanLine: {
    width: '100%',
    height: '100%',
  },
  scanLineGlow: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 229, 255, 0.4)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 24,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  statusText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  consoleContainer: {
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  consoleList: {
    justifyContent: 'flex-end',
  },
  consoleText: {
    color: '#00E5FF',
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
    opacity: 0.85,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
});
