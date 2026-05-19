import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { SplashScreen } from '../screens/SplashScreen';
import { RootStackParamList } from './types';
import { ROUTES } from './routes';
import { linking } from './linking';
import { THEME } from '@theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer theme={THEME} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
        <Stack.Screen name={ROUTES.MAIN_TABS} component={BottomTabs} />
        {/* Detail screens will be added here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
