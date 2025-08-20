/**
 * 仪表盘服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';

// 仪表盘摘要接口
export interface DashboardSummary {
  total_orders: number;
  total_amount: number;
  total_leads: number;
  conversion_rate: number;
  recent_activities: Array<{
    id: string;
    type: 'order' | 'lead' | 'claim' | 'contract';
    title: string;
    description: string;
    created_at: string;
    user_id: string;
    user_name: string;
  }>;
}

// 仪表盘统计接口
export interface DashboardStatistics {
  orders: {
    total_orders: number;
    total_amount: number;
    by_status: Record<string, number>;
    by_payment_status: Record<string, number>;
    average_amount: number;
    monthly_data: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  };
  leads: {
    total_leads: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    conversion_rate: number;
    average_score: number;
  };
  claims: {
    total_claims: number;
    by_status: Record<string, number>;
    average_processing_time: number;
  };
  contracts: {
    total_contracts: number;
    by_status: Record<string, number>;
    total_value: number;
  };
}

// 活动记录接口
export interface Activity {
  id: string;
  type: 'order' | 'lead' | 'claim' | 'contract' | 'login' | 'profile_update';
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  user_name: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, any>;
}

// 活动记录列表响应接口
export interface ActivityListResponse {
  data: Activity[];
  pagination: {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

// 活动记录查询参数接口
export interface ActivityQueryParams {
  type?: string;
  user_id?: string;
  entity_id?: string;
  entity_type?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}

// 订单简要信息接口
export interface OrderSummary {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  product: {
    id: string;
    name: string;
  } | null;
  customer: {
    id: string;
    name: string;
  } | null;
}

// 线索简要信息接口
export interface LeadSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  source: string;
  created_at: string;
}

// 仪表盘综合数据接口
export interface DashboardData {
  summary: {
    total_orders: number;
    total_amount: number;
    total_leads: number;
    conversion_rate: number;
  };
  statistics: DashboardStatistics;
  recent_orders: OrderSummary[];
  recent_leads: LeadSummary[];
  recent_activities: Activity[];
}

export const dashboardService = {
  async getDashboardData(): Promise<any> {
    return apiClient.get('/api/dashboard/data');
  },
  async getSalesMetrics(period?: string, scope: 'self' | 'team' = 'self') {
    const params: any = { scope };
    if (period) params.period = period;
    return apiClient.get('/api/sales/metrics', { params } as any);
  },
  async getSalesQuota(period?: string) {
    const params: any = {};
    if (period) params.period = period;
    return apiClient.get('/api/sales/quotas', { params } as any);
  },
  async updateSalesQuota(payload: { period: string; target_amount?: number; target_orders?: number }) {
    return apiClient.put('/api/sales/quotas', payload);
  },
  async getReceivablesSummary(period?: string, scope: 'self' | 'team' = 'self') {
    const params: any = { scope };
    if (period) params.period = period;
    return apiClient.get('/api/finance/receivables/summary', { params } as any);
  },
  async getCommissionSummary(period?: string, scope: 'self' | 'team' = 'self') {
    const params: any = { scope };
    if (period) params.period = period;
    return apiClient.get('/api/finance/commission/summary', { params } as any);
  }
}; 