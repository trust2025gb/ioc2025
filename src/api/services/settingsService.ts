import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';

export interface AppSettings {
  dark_mode: boolean;
  biometric_login: boolean;
  language: string;
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    const res = await apiClient.get<{ data: AppSettings }>(API_ENDPOINTS.SETTINGS.SHOW);
    return (res as any)?.data ?? (res as any) ?? { dark_mode: false, biometric_login: false, language: 'zh_CN' };
  },
  async update(payload: Partial<AppSettings>): Promise<AppSettings> {
    const res = await apiClient.put<{ success: boolean; data: AppSettings }>(API_ENDPOINTS.SETTINGS.UPDATE, payload);
    return (res as any)?.data ?? (res as any);
  },
}; 