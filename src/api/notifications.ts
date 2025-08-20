import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api';

export const NotificationsApi = {
  list: (params?: { status?: 'all' | 'unread'; category?: string; limit?: number; page?: number }) =>
    apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params }),

  unreadCount: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),

  markRead: (id: string) => apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),

  markAllRead: () => apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),

  registerToken: (payload: { token: string; platform: 'ios' | 'android' | 'web'; appVersion?: string; deviceInfo?: Record<string, any> }) =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, payload),

  unregisterToken: (token: string) => apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_TOKEN(token)),

  // Web Push
  getWebPushPublicKey: async (): Promise<string> => {
    const res = await apiClient.get<{ publicKey: string }>(API_ENDPOINTS.NOTIFICATIONS.WEBPUSH_PUBLIC_KEY);
    return (res as any)?.publicKey || (res as any)?.data?.publicKey || '';
  },
  subscribeWebPush: (payload: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.WEBPUSH_SUBSCRIBE, payload),
  unsubscribeWebPush: (endpoint: string) =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.WEBPUSH_UNSUBSCRIBE, { endpoint }),

  // Preferences
  getPreferences: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES.SHOW),
  updatePreferences: (payload: any) => apiClient.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES.UPDATE, payload),
}; 