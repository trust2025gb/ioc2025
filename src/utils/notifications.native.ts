import { Platform } from 'react-native';
import { NotificationsApi } from '../api/notifications';

export async function registerPush(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const Notifications = await import('expo-notifications');
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await NotificationsApi.registerToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      appVersion: '1.0.0',
      deviceInfo: {},
    });
  } catch (e) {
    // expo-notifications 未安装或不可用时直接跳过
    return;
  }
} 