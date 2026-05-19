import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROUTES } from './routes';

export type RootStackParamList = {
  [ROUTES.SPLASH]: undefined;
  [ROUTES.MAIN_TABS]: undefined;
  [ROUTES.EMERGENCY_DETAIL]: { alertId: string };
  [ROUTES.HAZARD_REPORT]: { coordinate: { latitude: number; longitude: number } };
};

export type MainTabParamList = {
  [ROUTES.MAP_TAB]: undefined;
  [ROUTES.ALERTS_TAB]: undefined;
  [ROUTES.INTELLIGENCE_TAB]: undefined;
  [ROUTES.OPERATIONS_TAB]: undefined;
  [ROUTES.HUB_TAB]: undefined;
  [ROUTES.SETTINGS_TAB]: undefined;
  [ROUTES.DEVELOPER_TAB]: undefined;
  [ROUTES.AI_OPERATIONS_TAB]: undefined;
  [ROUTES.SIMULATION_TAB]: undefined;
};

export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<MainTabParamList, T>;
