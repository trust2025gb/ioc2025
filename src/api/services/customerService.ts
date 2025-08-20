/**
 * 客户服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';
import { PaginatedResponse, QueryParams } from '../types';

// 客户状态枚举
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  POTENTIAL = 'potential',
  VIP = 'vip',
}

// 客户类型枚举
export enum CustomerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  FAMILY = 'family',
}

// 客户接口
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: CustomerStatus;
  type: CustomerType;
  identification_number?: string;
  identification_type?: string;
  annual_income?: number;
  occupation?: string;
  company?: string;
  notes?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
  avatar?: string;
  policies_count?: number;
  claims_count?: number;
  orders_count?: number;
  total_premium?: number;
}

// 客户列表响应接口
export interface CustomerListResponse extends PaginatedResponse<Customer> {}

// 客户查询参数接口
export interface CustomerQueryParams extends QueryParams {
  status?: CustomerStatus;
  type?: CustomerType;
  search?: string;
  min_annual_income?: number;
  max_annual_income?: number;
  has_active_policies?: boolean;
  has_pending_claims?: boolean;
}

// 创建客户请求接口
export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status?: CustomerStatus;
  type: CustomerType;
  identification_number?: string;
  identification_type?: string;
  annual_income?: number;
  occupation?: string;
  company?: string;
  notes?: string;
  birth_date?: string;
  avatar?: File;
}

// 更新客户请求接口
export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: CustomerStatus;
  type?: CustomerType;
  identification_number?: string;
  identification_type?: string;
  annual_income?: number;
  occupation?: string;
  company?: string;
  notes?: string;
  birth_date?: string;
  avatar?: File;
}

// 客户统计接口
export interface CustomerStatistics {
  total: number;
  active: number;
  inactive: number;
  potential: number;
  vip: number;
  individual: number;
  company: number;
  family: number;
  average_premium: number;
  total_premium: number;
}

// 保单摘要接口
export interface PolicySummary {
  id: string;
  policy_number: string;
  product_name: string;
  start_date: string;
  end_date: string;
  status: string;
  premium: number;
  coverage_amount: number;
}

// 理赔摘要接口
export interface ClaimSummary {
  id: string;
  claim_number: string;
  policy_number: string;
  submission_date: string;
  status: string;
  amount: number;
  description: string;
}

/**
 * 客户服务类
 */
class CustomerService {
  /**
   * 获取客户列表
   * @param params 查询参数
   * @returns 客户列表响应
   */
  async getCustomers(params?: CustomerQueryParams): Promise<CustomerListResponse> {
    return await apiClient.get<CustomerListResponse>(API_ENDPOINTS.CUSTOMERS.BASE, params);
  }
  
  /**
   * 获取客户详情
   * @param id 客户ID
   * @returns 客户详情
   */
  async getCustomer(id: string): Promise<Customer> {
    return await apiClient.get<Customer>(API_ENDPOINTS.CUSTOMERS.DETAIL(id));
  }
  
  /**
   * 创建客户
   * @param customerData 客户数据
   * @returns 创建的客户
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    // 如果包含头像，需要使用FormData
    if (customerData.avatar) {
      const formData = new FormData();
      
      // 添加文本字段
      Object.keys(customerData as Record<string, any>).forEach(key => {
        if (key !== 'avatar' && (customerData as any)[key] !== undefined) {
          formData.append(key, (customerData as any)[key] as any);
        }
      });
      
      // 添加头像文件
      formData.append('avatar', customerData.avatar);
      
      return await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.BASE, formData);
    }
    
    return await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.BASE, customerData);
  }
  
  /**
   * 更新客户
   * @param id 客户ID
   * @param customerData 客户数据
   * @returns 更新的客户
   */
  async updateCustomer(id: string, customerData: UpdateCustomerRequest): Promise<Customer> {
    // 如果包含头像，需要使用FormData
    if (customerData.avatar) {
      const formData = new FormData();
      
      // 添加文本字段
      Object.keys(customerData as Record<string, any>).forEach(key => {
        if (key !== 'avatar' && (customerData as any)[key] !== undefined) {
          formData.append(key, (customerData as any)[key] as any);
        }
      });
      
      // 添加头像文件
      formData.append('avatar', customerData.avatar);
      
      return await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), formData);
    }
    
    return await apiClient.put<Customer>(API_ENDPOINTS.CUSTOMERS.DETAIL(id), customerData);
  }
  
  /**
   * 删除客户
   * @param id 客户ID
   * @returns 删除结果
   */
  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return await apiClient.delete<{ success: boolean }>(API_ENDPOINTS.CUSTOMERS.DETAIL(id));
  }
  
  /**
   * 获取客户保单
   * @param id 客户ID
   * @returns 保单摘要列表
   */
  async getCustomerPolicies(id: string): Promise<PolicySummary[]> {
    return await apiClient.get<PolicySummary[]>(API_ENDPOINTS.CUSTOMERS.POLICIES(id));
  }
  
  /**
   * 获取客户理赔
   * @param id 客户ID
   * @returns 理赔摘要列表
   */
  async getCustomerClaims(id: string): Promise<ClaimSummary[]> {
    return await apiClient.get<ClaimSummary[]>(API_ENDPOINTS.CUSTOMERS.CLAIMS(id));
  }
  
  /**
   * 获取客户统计数据
   * @returns 客户统计
   */
  async getCustomerStatistics(): Promise<CustomerStatistics> {
    return await apiClient.get<CustomerStatistics>(API_ENDPOINTS.CUSTOMERS.STATISTICS);
  }
  
  /**
   * 按状态获取客户
   * @param status 客户状态
   * @param params 其他查询参数
   * @returns 客户列表响应
   */
  async getCustomersByStatus(status: CustomerStatus, params?: Omit<CustomerQueryParams, 'status'>): Promise<CustomerListResponse> {
    return await this.getCustomers({ ...params, status });
  }
  
  /**
   * 按类型获取客户
   * @param type 客户类型
   * @param params 其他查询参数
   * @returns 客户列表响应
   */
  async getCustomersByType(type: CustomerType, params?: Omit<CustomerQueryParams, 'type'>): Promise<CustomerListResponse> {
    return await this.getCustomers({ ...params, type });
  }
  
  /**
   * 搜索客户
   * @param searchTerm 搜索词
   * @param params 其他查询参数
   * @returns 客户列表响应
   */
  async searchCustomers(searchTerm: string, params?: Omit<CustomerQueryParams, 'search'>): Promise<CustomerListResponse> {
    return await this.getCustomers({ ...params, search: searchTerm });
  }
}

// 导出客户服务实例
export const customerService = new CustomerService(); 