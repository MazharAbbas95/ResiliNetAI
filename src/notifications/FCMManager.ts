import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

export const FCMManager = {
  /**
   * Registers for push notifications.
   * Uses a safe local mock token in development to prevent Expo SDK 53 crashes.
   */
  registerForPushNotificationsAsync: async (): Promise<string | undefined> => {
    // 1. FAST BYPASS FOR EXPO GO / LOCAL DEVELOPMENT
    if (__DEV__) {
      console.log('[FCMManager] Development environment detected. Using mock push token.');
      return 'ExponentPushToken[MOCK_DEV_TOKEN_LOCAL]';
    }

    // 2. PRODUCTION BUILD ENGINE (Runs on standalone native builds)
    let token: string | undefined;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F71',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('[FCMManager] Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = 
          Constants.expoConfig?.extra?.eas?.projectId ?? 
          Constants.easConfig?.projectId;
          
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[FCMManager] Native Push Token generated:', token);
      } catch (e) {
        console.error('[FCMManager] Error getting native push token:', e);
      }
    } else {
      console.log('[FCMManager] Must use physical device for real Push Notifications');
    }

    return token;
  },

  /**
   * Schedules a local notification alert instantly.
   */
  sendLocalNotification: async (title: string, body: string, priority: 'default' | 'high' | 'max') => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        categoryIdentifier: 'emergency',
      },
      trigger: null, // Null fires the notification immediately
    });
  }
};
