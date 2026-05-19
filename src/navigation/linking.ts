import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';
import { ROUTES } from './routes';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'resilinetai://'],
  config: {
    screens: {
      [ROUTES.MAIN_TABS]: {
        screens: {
          [ROUTES.MAP_TAB]: 'map',
          [ROUTES.ALERTS_TAB]: 'alerts',
          [ROUTES.INTELLIGENCE_TAB]: 'intelligence',
          [ROUTES.OPERATIONS_TAB]: 'operations',
        },
      },
      [ROUTES.EMERGENCY_DETAIL]: 'emergency/:alertId',
    },
  },
};


