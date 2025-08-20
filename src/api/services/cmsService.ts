import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';

export interface CmsPage { slug: string; title: string; content: string }

export const cmsService = {
  async get(slug: string): Promise<CmsPage> {
    const res = await apiClient.get<{ data: CmsPage }>(API_ENDPOINTS.CMS.SHOW(slug));
    return (res as any)?.data ?? (res as any);
  },
}; 