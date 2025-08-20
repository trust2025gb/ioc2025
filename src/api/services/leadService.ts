/**
 * 线索服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';
import { User } from './authService';

// 线索状态枚举
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

// 线索来源枚举
export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  PHONE_INQUIRY = 'phone_inquiry',
  EVENT = 'event',
  OTHER = 'other',
}

// 线索接口
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource | string;
  status: LeadStatus | string;
  assigned_to?: string;
  assigned_user?: User;
  notes?: string;
  score?: number;
  requirements?: string;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string;
  follow_up_at?: string;
  // 扩展字段
  wechat?: string;
  gender?: string;
  birth_date?: string;
  occupation?: string;
  annual_income?: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  postal_code?: string;
  priority?: string;
  quality_grade?: string;
  value_grade?: string;
  urgency_grade?: string;
}

// 线索列表响应接口
export interface LeadListResponse {
  data: Lead[];
  pagination: {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

// 线索查询参数接口
export interface LeadQueryParams {
  status?: LeadStatus;
  source?: LeadSource;
  assigned_to?: string;
  search?: string;
  min_score?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}

// 创建线索请求接口
export interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status?: LeadStatus;
  assigned_to?: string;
  notes?: string;
  requirements?: string;
  follow_up_at?: string;
}

// 更新线索请求接口
export interface UpdateLeadRequest {
  name?: string;
  phone?: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  assigned_to?: string;
  notes?: string;
  requirements?: string;
  follow_up_at?: string;
}

// 线索分配请求接口
export interface AssignLeadRequest {
  assigned_to: string;
}

// 线索统计接口
export interface LeadStatistics {
  total: number;
  by_status: Record<LeadStatus, number>;
  by_source: Record<LeadSource, number>;
  conversion_rate: number;
  average_score: number;
}

class LeadService {
  /**
   * 获取线索列表
   * @param params 查询参数
   * @returns 线索列表响应
   */
  async getLeads(params?: LeadQueryParams): Promise<LeadListResponse> {
    return await apiClient.getPaginated<Lead>(API_ENDPOINTS.LEADS.BASE, params);
  }
  
  /**
   * 获取线索详情
   * @param id 线索ID
   * @returns 线索详情
   */
  async getLead(id: string): Promise<Lead> {
    const res: any = await apiClient.get<any>(API_ENDPOINTS.LEADS.DETAIL(id));
    return (res && typeof res === 'object' && 'data' in res) ? (res.data as Lead) : (res as Lead);
  }
  
  /**
   * 创建线索
   * @param leadData 线索数据
   * @returns 创建的线索
   */
  async createLead(leadData: CreateLeadRequest): Promise<Lead> {
    return await apiClient.post<Lead>(API_ENDPOINTS.LEADS.BASE, leadData);
  }
  
  /**
   * 更新线索
   * @param id 线索ID
   * @param leadData 线索数据
   * @returns 更新的线索
   */
  async updateLead(id: string, leadData: UpdateLeadRequest): Promise<Lead> {
    const res: any = await apiClient.put<any>(API_ENDPOINTS.LEADS.DETAIL(id), leadData);
    return (res && typeof res === 'object' && 'data' in res) ? (res.data as Lead) : (res as Lead);
  }
  
  /**
   * 分配线索
   * @param id 线索ID
   * @param assignData 分配数据
   * @returns 更新的线索
   */
  async assignLead(id: string, assignData: AssignLeadRequest): Promise<Lead> {
    const payload: any = { user_id: (assignData as any).user_id || assignData.assigned_to };
    const res: any = await apiClient.post<any>(API_ENDPOINTS.LEADS.ASSIGN(id), payload);
    return (res && typeof res === 'object' && 'data' in res) ? (res.data as Lead) : (res as Lead);
  }
  
  /**
   * 转换线索为需求
   * @param id 线索ID
   * @returns 转换结果
   */
  async convertLead(id: string): Promise<{ success: boolean; requirement_id: string }> {
    return await apiClient.post<{ success: boolean; requirement_id: string }>(API_ENDPOINTS.LEADS.CONVERT(id));
  }
  
  /**
   * 获取最近线索
   * @param limit 限制数量
   * @returns 线索数组
   */
  async getRecentLeads(limit: number = 5): Promise<Lead[]> {
    return await apiClient.get<Lead[]>(API_ENDPOINTS.LEADS.RECENT, { params: { limit } });
  }
  
  /**
   * 获取线索统计数据
   * @returns 线索统计
   */
  async getLeadStatistics(): Promise<LeadStatistics> {
    return await apiClient.get<LeadStatistics>(API_ENDPOINTS.LEADS.STATISTICS);
  }
  
  /**
   * 按状态获取线索
   * @param status 线索状态
   * @param params 其他查询参数
   * @returns 线索列表响应
   */
  async getLeadsByStatus(status: LeadStatus, params?: Omit<LeadQueryParams, 'status'>): Promise<LeadListResponse> {
    return await this.getLeads({ ...params, status });
  }
  
  /**
   * 获取我的线索
   * @param userId 用户ID
   * @param params 其他查询参数
   * @returns 线索列表响应
   */
  async getMyLeads(userId: string, params?: Omit<LeadQueryParams, 'assigned_to'>): Promise<LeadListResponse> {
    return await this.getLeads({ ...params, assigned_to: userId });
  }
}

// 导出线索服务实例
export const leadService = new LeadService(); 