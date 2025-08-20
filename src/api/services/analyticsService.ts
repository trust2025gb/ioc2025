import { apiClient } from '../client';

export const analyticsService = {
  marketingRoi(period?: string) {
    const params: any = {};
    if (period) params.period = period;
    return apiClient.get('/api/analytics/marketing/roi', { params } as any);
  },
  teamSummary(period?: string) {
    const params: any = {};
    if (period) params.period = period;
    return apiClient.get('/api/analytics/team/summary', { params } as any);
  },
  leaderboard(period?: string, metric: 'amount' | 'orders' = 'amount', dimension: 'user' | 'channel' | 'product' = 'user') {
    const params: any = { metric, dimension };
    if (period) params.period = period;
    return apiClient.get('/api/analytics/leaderboard', { params } as any);
  },
  kpiBoard(period?: string, scope: 'self' | 'team' = 'self') {
    const params: any = { scope };
    if (period) params.period = period;
    return apiClient.get('/api/analytics/kpi-board', { params } as any);
  },
  marketingBudget(period?: string) {
    const params: any = {};
    if (period) params.period = period;
    return apiClient.get('/api/analytics/marketing/budget', { params } as any);
  },
}; 