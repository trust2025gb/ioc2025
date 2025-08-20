import { apiClient } from '../client';

export type GlobalSearchItem = {
  type: 'customer' | 'order' | 'contract' | 'claim' | 'product' | 'chat';
  id: number | string; // 通用主键；对于聊天为 conversationId
  title: string;
  subtitle?: string;
  snippet?: string;
  code?: string | null;
  message_id?: string; // 对聊天结果，原始消息ID（可用于定位）
};

export type GlobalSearchResponse = {
  query: string;
  items: GlobalSearchItem[];
  summary: {
    total: number;
    counts: Record<string, number>;
    page: number;
    per_page: number;
    total_pages: number;
  };
};

export const searchService = {
  async suggest(q: string): Promise<{ query: string; suggestions: string[] }> {
    return apiClient.get('/api/search/suggest', { q });
  },

  async search(params: { q: string; types?: string; page?: number; per_page?: number }): Promise<GlobalSearchResponse> {
    return apiClient.get('/api/search', params);
  },
}; 