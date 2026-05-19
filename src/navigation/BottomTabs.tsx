import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { MainTabParamList } from './types';
import { ROUTES } from './routes';
import { COLORS, SPACING } from '@theme';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LiveMapScreen from '../screens/LiveMapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AIPipelineScreen from '../screens/AIPipelineScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import IntelligenceHubScreen from '../screens/IntelligenceHubScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DeveloperScreen from '../screens/DeveloperScreen';
import AIOperationsScreen from '../screens/AIOperations/AIOperationsScreen';
import SimulationDemoScreen from '../screens/SimulationDemoScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case ROUTES.MAP_TAB:
              iconName = focused ? 'map' : 'map-outline';
              break;
            case ROUTES.ALERTS_TAB:
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case ROUTES.INTELLIGENCE_TAB:
              iconName = focused ? 'sparkles' : 'sparkles-outline';
              break;
            case ROUTES.OPERATIONS_TAB:
              iconName = focused ? 'shield-checkmark' : 'shield-outline';
              break;
            case ROUTES.HUB_TAB:
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case ROUTES.SETTINGS_TAB:
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case ROUTES.DEVELOPER_TAB:
              iconName = focused ? 'terminal' : 'terminal-outline';
              break;
            case ROUTES.AI_OPERATIONS_TAB:
              iconName = focused ? 'options' : 'options-outline';
              break;
            case ROUTES.SIMULATION_TAB:
              iconName = focused ? 'beaker' : 'beaker-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
              {focused && <View style={styles.iconDot} />}
            </View>
          );
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={80} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 15,
          right: 15,
          height: 75,
          backgroundColor: 'rgba(23, 23, 23, 0.7)',
          borderRadius: 35,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          paddingBottom: Platform.OS === 'ios' ? 0 : 10,
          elevation: 10,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          marginBottom: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name={ROUTES.MAP_TAB} 
        component={LiveMapScreen} 
        options={{ title: 'LIVE MAP' }}
      />
      <Tab.Screen 
        name={ROUTES.ALERTS_TAB} 
        component={AlertsScreen} 
        options={{ title: 'ALERTS' }}
      />
      <Tab.Screen 
        name={ROUTES.INTELLIGENCE_TAB} 
        component={AIPipelineScreen} 
        options={{ title: 'AI PIPELINE' }}
      />
      <Tab.Screen 
        name={ROUTES.OPERATIONS_TAB} 
        component={EmergencyScreen} 
        options={{ title: 'EMERGENCY' }}
      />
      <Tab.Screen 
        name={ROUTES.HUB_TAB} 
        component={IntelligenceHubScreen} 
        options={{ title: 'INTEL HUB' }}
      />
      <Tab.Screen 
        name={ROUTES.SETTINGS_TAB} 
        component={SettingsScreen} 
        options={{ title: 'SETTINGS' }}
      />
      <Tab.Screen 
        name={ROUTES.DEVELOPER_TAB} 
        component={DeveloperScreen} 
        options={{ title: 'DEV' }}
      />
      <Tab.Screen 
        name={ROUTES.AI_OPERATIONS_TAB} 
        component={AIOperationsScreen} 
        options={{ title: 'AI OPERATIONS' }}
      />
      <Tab.Screen 
        name={ROUTES.SIMULATION_TAB} 
        component={SimulationDemoScreen} 
        options={{ title: 'DEMO' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  iconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  }
});
