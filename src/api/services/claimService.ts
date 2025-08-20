/**
 * 理赔服务
 * 处理理赔相关的API请求
 */

import { apiClient } from '../client';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * 理赔状态枚举
 */
export enum ClaimStatus {
  SUBMITTED = 'submitted',       // 已提交
  REVIEWING = 'reviewing',       // 审核中
  PENDING_DOCUMENTS = 'pending_documents', // 等待文档
  APPROVED = 'approved',         // 已批准
  PARTIALLY_APPROVED = 'partially_approved', // 部分批准
  REJECTED = 'rejected',         // 已拒绝
  PAID = 'paid',                 // 已赔付
  CLOSED = 'closed',             // 已关闭
  APPEALING = 'appealing'        // 申诉中
}

/**
 * 理赔类型枚举
 */
export enum ClaimType {
  MEDICAL = 'medical',           // 医疗理赔
  PROPERTY = 'property',         // 财产理赔
  AUTO = 'auto',                 // 车辆理赔
  LIFE = 'life',                 // 人寿理赔
  LIABILITY = 'liability',       // 责任理赔
  BUSINESS = 'business',         // 商业理赔
  TRAVEL = 'travel',             // 旅行理赔
  OTHER = 'other'                // 其他
}

/**
 * 文档类型枚举
 */
export enum ClaimDocumentType {
  EVIDENCE = 'evidence',         // 证据材料
  MEDICAL_REPORT = 'medical_report', // 医疗报告
  POLICE_REPORT = 'police_report', // 警方报告
  RECEIPT = 'receipt',           // 收据/发票
  PHOTO = 'photo',               // 照片
  ASSESSMENT = 'assessment',     // 评估报告
  IDENTIFICATION = 'identification', // 身份证明
  OTHER = 'other'                // 其他
}

/**
 * 理赔支付方式枚举
 */
export enum ClaimPaymentMethod {
  BANK_TRANSFER = 'bank_transfer', // 银行转账
  CHECK = 'check',               // 支票
  DIGITAL_WALLET = 'digital_wallet', // 数字钱包
  CREDIT_TO_ACCOUNT = 'credit_to_account', // 账户贷记
  CASH = 'cash',                 // 现金
  OTHER = 'other'                // 其他
}

/**
 * 理赔接口
 */
export interface Claim {
  id: string;
  claim_number: string;
  title: string;
  description?: string;
  status: ClaimStatus;
  type: ClaimType;
  customer_id: string;
  customer_name: string;
  policy_id?: string;
  policy_number?: string;
  created_at: string;
  updated_at: string;
  incident_date?: string;
  reported_date: string;
  settlement_date?: string;
  claim_amount?: number;
  approved_amount?: number;
  paid_amount?: number;
  deductible_amount?: number;
  currency?: string;
  payment_method?: ClaimPaymentMethod;
  payment_details?: string;
  documents_count?: number;
  handler_name?: string;
  handler_notes?: string;
  rejection_reason?: string;
  settlement_notes?: string;
  is_emergency?: boolean;
  priority?: number; // 1-5, 5最高优先级
  location?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * 理赔文档接口
 */
export interface ClaimDocument {
  id: string;
  claim_id: string;
  name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  type: ClaimDocumentType;
  description?: string;
  uploaded_at: string;
  uploaded_by?: string;
  is_verified: boolean;
  verification_date?: string;
  verification_notes?: string;
}

/**
 * 理赔详细信息接口
 */
export interface ClaimDetail extends Claim {
  timeline: ClaimTimelineEvent[];
  related_claims?: RelatedClaim[];
}

/**
 * 理赔时间线事件接口
 */
export interface ClaimTimelineEvent {
  id: string;
  claim_id: string;
  event_type: string;
  description: string;
  created_at: string;
  created_by?: string;
  status_change?: {
    from: ClaimStatus;
    to: ClaimStatus;
  };
  notes?: string;
}

/**
 * 相关理赔接口
 */
export interface RelatedClaim {
  id: string;
  claim_number: string;
  title: string;
  status: ClaimStatus;
  relationship_type: string; // 例如："parent", "child", "associated"
}

/**
 * 理赔统计接口
 */
export interface ClaimStatistics {
  total_claims: number;
  total_claim_amount: number;
  total_approved_amount: number;
  total_paid_amount: number;
  by_status: Record<ClaimStatus, number>;
  by_type: Record<ClaimType, number>;
}

/**
 * 理赔创建请求接口
 */
export interface ClaimCreateRequest {
  title: string;
  description?: string;
  type: ClaimType;
  customer_id: string;
  policy_id?: string;
  incident_date: string;
  claim_amount?: number;
  currency?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  is_emergency?: boolean;
  handler_notes?: string;
}

/**
 * 理赔服务类
 */
class ClaimService {
  /**
   * 获取理赔列表
   * @param params 查询参数
   */
  async getClaims(params?: {
    status?: ClaimStatus;
    type?: ClaimType;
    customer_id?: string;
    policy_id?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    is_emergency?: boolean;
  } & QueryParams): Promise<PaginatedResponse<Claim>> {
    const response = await apiClient.get<PaginatedResponse<Claim>>('/api/claims', params);
    return response;
  }

  /**
   * 获取理赔详情
   * @param id 理赔ID
   */
  async getClaim(id: string): Promise<Claim> {
    const response = await apiClient.get<Claim>(`/api/claims/${id}`);
    return response;
  }

  /**
   * 获取理赔详细信息（包括时间线和相关理赔）
   * @param id 理赔ID
   */
  async getClaimDetail(id: string): Promise<ClaimDetail> {
    const response = await apiClient.get<ClaimDetail>(`/api/claims/${id}/detail`);
    return response;
  }

  /**
   * 创建理赔
   * @param claimData 理赔数据
   */
  async createClaim(claimData: ClaimCreateRequest): Promise<Claim> {
    const response = await apiClient.post<Claim>('/api/claims', claimData);
    return response;
  }

  /**
   * 更新理赔
   * @param id 理赔ID
   * @param claimData 理赔数据
   */
  async updateClaim(id: string, claimData: Partial<Claim>): Promise<Claim> {
    const response = await apiClient.put<Claim>(`/api/claims/${id}`, claimData);
    return response;
  }

  /**
   * 取消理赔
   * @param id 理赔ID
   * @param reason 取消原因
   */
  async cancelClaim(id: string, reason: string): Promise<Claim> {
    const response = await apiClient.post<Claim>(`/api/claims/${id}/cancel`, { reason });
    return response;
  }

  /**
   * 获取理赔文档列表
   * @param claimId 理赔ID
   */
  async getClaimDocuments(claimId: string): Promise<ClaimDocument[]> {
    const response = await apiClient.get<ClaimDocument[]>(`/api/claims/${claimId}/documents`);
    return response;
  }

  /**
   * 添加理赔文档
   * @param claimId 理赔ID
   * @param document 文档文件
   * @param type 文档类型
   * @param description 文档描述
   */
  async addClaimDocument(
    claimId: string,
    document: any,
    type: ClaimDocumentType,
    description?: string
  ): Promise<ClaimDocument> {
    // 创建FormData
    const formData = new FormData();
    formData.append('document', document);
    formData.append('type', type);
    
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post<ClaimDocument>(
      `/api/claims/${claimId}/documents`,
      formData
    );

    return response;
  }

  /**
   * 删除理赔文档
   * @param claimId 理赔ID
   * @param documentId 文档ID
   */
  async deleteClaimDocument(claimId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/claims/${claimId}/documents/${documentId}`);
  }

  /**
   * 验证理赔文档
   * @param claimId 理赔ID
   * @param documentId 文档ID
   * @param notes 验证备注
   */
  async verifyClaimDocument(claimId: string, documentId: string, notes?: string): Promise<ClaimDocument> {
    const response = await apiClient.post<ClaimDocument>(
      `/api/claims/${claimId}/documents/${documentId}/verify`,
      { notes }
    );
    return response;
  }

  /**
   * 添加理赔时间线事件
   * @param claimId 理赔ID
   * @param eventType 事件类型
   * @param description 事件描述
   * @param notes 备注
   */
  async addClaimTimelineEvent(
    claimId: string,
    eventType: string,
    description: string,
    notes?: string
  ): Promise<ClaimTimelineEvent> {
    const response = await apiClient.post<ClaimTimelineEvent>(
      `/api/claims/${claimId}/timeline`,
      {
        event_type: eventType,
        description,
        notes
      }
    );
    return response;
  }

  /**
   * 获取理赔统计信息
   */
  async getClaimStatistics(): Promise<ClaimStatistics> {
    const response = await apiClient.get<ClaimStatistics>('/api/claims/statistics');
    return response;
  }

  /**
   * 获取客户的理赔列表
   * @param customerId 客户ID
   * @param params 查询参数
   */
  async getCustomerClaims(
    customerId: string,
    params?: { status?: ClaimStatus; type?: ClaimType } & QueryParams
  ): Promise<PaginatedResponse<Claim>> {
    const response = await apiClient.get<PaginatedResponse<Claim>>(`/api/customers/${customerId}/claims`, params);
    return response;
  }

  /**
   * 获取保单的理赔列表
   * @param policyId 保单ID
   * @param params 查询参数
   */
  async getPolicyClaims(
    policyId: string,
    params?: { status?: ClaimStatus; type?: ClaimType } & QueryParams
  ): Promise<PaginatedResponse<Claim>> {
    const response = await apiClient.get<PaginatedResponse<Claim>>(`/api/policies/${policyId}/claims`, params);
    return response;
  }

  /**
   * 申请理赔支付
   * @param claimId 理赔ID
   * @param paymentMethod 支付方式
   * @param paymentDetails 支付详情
   * @param amount 支付金额
   */
  async requestClaimPayment(
    claimId: string,
    paymentMethod: ClaimPaymentMethod,
    paymentDetails: string,
    amount: number
  ): Promise<Claim> {
    const response = await apiClient.post<Claim>(
      `/api/claims/${claimId}/payment`,
      {
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        amount
      }
    );
    return response;
  }

  /**
   * 提交理赔申诉
   * @param claimId 理赔ID
   * @param reason 申诉原因
   * @param additionalInformation 额外信息
   */
  async appealClaim(
    claimId: string,
    reason: string,
    additionalInformation?: string
  ): Promise<Claim> {
    const response = await apiClient.post<Claim>(
      `/api/claims/${claimId}/appeal`,
      {
        reason,
        additional_information: additionalInformation
      }
    );
    return response;
  }
}

export const claimService = new ClaimService(); 