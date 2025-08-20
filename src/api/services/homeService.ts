import { apiClient } from '../client';

export interface HomeContentItem {
  id: string | number;
  title?: string;
  image_url?: string;
  content?: string; // HTML
}

export interface HomeCarouselConfig {
  interval_ms: number;
  duration_ms: number;
  animation: 'slide-left' | 'fade' | 'none' | 'push-left' | 'push-right' | 'push-up' | 'push-down' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down';
}

const DEFAULT_HOME_CONFIG: HomeCarouselConfig = {
  interval_ms: 3500,
  duration_ms: 500,
  animation: 'slide-left',
};

class HomeService {
  async getHomeContent(): Promise<HomeContentItem[]> {
    const res = await apiClient.get<{ data: HomeContentItem[] }>('/api/home/content');
    return res.data ?? [];
  }

  async getHomeConfig(): Promise<HomeCarouselConfig> {
    try {
      const res = await apiClient.get<{ data: Partial<HomeCarouselConfig> }>('/api/home/config');
      return { ...DEFAULT_HOME_CONFIG, ...(res.data || {}) } as HomeCarouselConfig;
    } catch (e) {
      return DEFAULT_HOME_CONFIG;
    }
  }
}

export const homeService = new HomeService(); 