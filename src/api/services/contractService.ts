/**
 * 合同服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';
import { PaginatedResponse, QueryParams } from '../types';

// 合同状态枚举
export enum ContractStatus {
  DRAFT = 'draft', // 草稿
  PENDING = 'pending', // 待签署
  ACTIVE = 'active', // 有效
  EXPIRED = 'expired', // 已过期
  TERMINATED = 'terminated', // 已终止
  RENEWED = 'renewed', // 已续约
}

// 合同类型枚举
export enum ContractType {
  INSURANCE = 'insurance', // 保险合同
  ENDORSEMENT = 'endorsement', // 批单
  RIDER = 'rider', // 附加险
  AMENDMENT = 'amendment', // 合同修改
}

// 文档类型枚举
export enum DocumentType {
  CONTRACT = 'contract', // 合同文件
  ATTACHMENT = 'attachment', // 附件
  SIGNATURE = 'signature', // 签名文件
  RECEIPT = 'receipt', // 收据
  OTHER = 'other', // 其他
}

// 签名类型枚举
export enum SignatureType {
  ELECTRONIC = 'electronic', // 电子签名
  HANDWRITTEN = 'handwritten', // 手写签名
  DIGITAL = 'digital', // 数字证书
}

// 合同接口
export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  status: ContractStatus;
  type: ContractType;
  customer_id: string;
  customer_name: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  signed_at?: string;
  total_value?: number;
  payment_terms?: string;
  renewal_terms?: string;
  has_electronic_signature: boolean;
  documents_count?: number;
  is_renewable?: boolean;
  auto_renewal?: boolean;
  signature_info?: SignatureInfo;
}

// 合同文档接口
export interface ContractDocument {
  id: string;
  contract_id: string;
  name: string;
  description?: string;
  type: DocumentType;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by?: string;
  is_signed: boolean;
}

// 签名信息接口
export interface SignatureInfo {
  signature_required: boolean;
  signature_status: 'not_signed' | 'partially_signed' | 'fully_signed';
  signature_method?: SignatureType;
  signatory_name?: string;
  signatory_title?: string;
  signatory_id_number?: string;
  signature_date?: string;
  signature_location?: string;
  signature_image_url?: string;
}

// 签署请求接口
export interface SignatureRequest {
  signature_method: SignatureType;
  signatory_name: string;
  signatory_title?: string;
  signatory_id_number?: string;
  signature_location?: string;
  signature_image?: File; // Base64编码的图像数据或文件对象
}

// 合同列表响应接口
export interface ContractListResponse extends PaginatedResponse<Contract> {}

// 合同查询参数接口
export interface ContractQueryParams extends QueryParams {
  status?: ContractStatus;
  type?: ContractType;
  customer_id?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  product_id?: string;
  is_signed?: boolean;
}

// 创建合同请求接口
export interface CreateContractRequest {
  title: string;
  description?: string;
  type: ContractType;
  customer_id: string;
  order_id?: string;
  product_id?: string;
  start_date?: string;
  end_date?: string;
  total_value?: number;
  payment_terms?: string;
  renewal_terms?: string;
  has_electronic_signature?: boolean;
  is_renewable?: boolean;
  auto_renewal?: boolean;
  documents?: File[]; // 合同相关文档
}

// 更新合同请求接口
export interface UpdateContractRequest {
  title?: string;
  description?: string;
  type?: ContractType;
  status?: ContractStatus;
  start_date?: string;
  end_date?: string;
  total_value?: number;
  payment_terms?: string;
  renewal_terms?: string;
  has_electronic_signature?: boolean;
  is_renewable?: boolean;
  auto_renewal?: boolean;
}

/**
 * 合同服务类
 */
class ContractService {
  /**
   * 获取合同列表
   * @param params 查询参数
   * @returns 合同列表响应
   */
  async getContracts(params?: ContractQueryParams): Promise<ContractListResponse> {
    return await apiClient.get<ContractListResponse>(API_ENDPOINTS.CONTRACTS.BASE, params);
  }
  
  /**
   * 获取合同详情
   * @param id 合同ID
   * @returns 合同详情
   */
  async getContract(id: string): Promise<Contract> {
    return await apiClient.get<Contract>(API_ENDPOINTS.CONTRACTS.DETAIL(id));
  }
  
  /**
   * 创建合同
   * @param contractData 合同数据
   * @returns 创建的合同
   */
  async createContract(contractData: CreateContractRequest): Promise<Contract> {
    // 如果包含文档，需要使用FormData
    if (contractData.documents && contractData.documents.length > 0) {
      const formData = new FormData();
      
      // 添加文本字段
      Object.keys(contractData as Record<string, any>).forEach(key => {
        if (key !== 'documents' && (contractData as any)[key] !== undefined) {
          const value = (contractData as any)[key];
          formData.append(key, typeof value === 'object' 
            ? JSON.stringify(value) 
            : (value as any)
          );
        }
      });
      
      // 添加文档文件
      contractData.documents.forEach((document, index) => {
        formData.append(`documents[${index}]`, document as any);
      });
      
      return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.BASE, formData);
    }
    
    return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.BASE, contractData);
  }
  
  /**
   * 更新合同
   * @param id 合同ID
   * @param contractData 合同数据
   * @returns 更新的合同
   */
  async updateContract(id: string, contractData: UpdateContractRequest): Promise<Contract> {
    return await apiClient.put<Contract>(API_ENDPOINTS.CONTRACTS.DETAIL(id), contractData);
  }
  
  /**
   * 删除合同
   * @param id 合同ID
   * @returns 删除结果
   */
  async deleteContract(id: string): Promise<{ success: boolean }> {
    return await apiClient.delete<{ success: boolean }>(API_ENDPOINTS.CONTRACTS.DETAIL(id));
  }
  
  /**
   * 获取合同文档列表
   * @param id 合同ID
   * @returns 文档列表
   */
  async getContractDocuments(id: string): Promise<ContractDocument[]> {
    return await apiClient.get<ContractDocument[]>(API_ENDPOINTS.CONTRACTS.DOCUMENTS(id));
  }
  
  /**
   * 添加合同文档
   * @param id 合同ID
   * @param document 文档文件
   * @param documentType 文档类型
   * @param description 文档描述
   * @returns 添加的文档
   */
  async addContractDocument(
    id: string, 
    document: File,
    documentType: DocumentType = DocumentType.ATTACHMENT,
    description?: string
  ): Promise<ContractDocument> {
    const formData = new FormData();
    formData.append('document', document as any);
    formData.append('type', documentType);
    if (description) {
      formData.append('description', description);
    }
    
    return await apiClient.post<ContractDocument>(
      API_ENDPOINTS.CONTRACTS.DOCUMENTS(id),
      formData
    );
  }
  
  /**
   * 删除合同文档
   * @param contractId 合同ID
   * @param documentId 文档ID
   * @returns 删除结果
   */
  async deleteContractDocument(
    contractId: string,
    documentId: string
  ): Promise<{ success: boolean }> {
    return await apiClient.delete<{ success: boolean }>(
      `${API_ENDPOINTS.CONTRACTS.DOCUMENTS(contractId)}/${documentId}`
    );
  }
  
  /**
   * 签署合同
   * @param id 合同ID
   * @param signatureData 签署数据
   * @returns 签署结果
   */
  async signContract(id: string, signatureData: SignatureRequest): Promise<Contract> {
    // 如果包含签名图像，需要使用FormData
    if (signatureData.signature_image) {
      const formData = new FormData();
      
      // 添加文本字段
      Object.keys(signatureData as Record<string, any>).forEach(key => {
        if (key !== 'signature_image' && (signatureData as any)[key] !== undefined) {
          formData.append(key, (signatureData as any)[key] as any);
        }
      });
      
      // 添加签名图像
      formData.append('signature_image', signatureData.signature_image as any);
      
      return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.SIGN(id), formData);
    }
    
    return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.SIGN(id), signatureData);
  }
  
  /**
   * 终止合同
   * @param id 合同ID
   * @param reason 终止原因
   * @returns 终止结果
   */
  async terminateContract(id: string, reason: string): Promise<Contract> {
    return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.TERMINATE(id), { reason });
  }
  
  /**
   * 续约合同
   * @param id 合同ID
   * @param renewalData 续约数据
   * @returns 续约结果
   */
  async renewContract(
    id: string, 
    renewalData: { start_date: string; end_date: string; description?: string }
  ): Promise<Contract> {
    return await apiClient.post<Contract>(API_ENDPOINTS.CONTRACTS.RENEW(id), renewalData);
  }
  
  /**
   * 按状态获取合同
   * @param status 合同状态
   * @param params 其他查询参数
   * @returns 合同列表响应
   */
  async getContractsByStatus(
    status: ContractStatus, 
    params?: Omit<ContractQueryParams, 'status'>
  ): Promise<ContractListResponse> {
    return await this.getContracts({ ...params, status });
  }
  
  /**
   * 按客户ID获取合同
   * @param customerId 客户ID
   * @param params 其他查询参数
   * @returns 合同列表响应
   */
  async getContractsByCustomer(
    customerId: string, 
    params?: Omit<ContractQueryParams, 'customer_id'>
  ): Promise<ContractListResponse> {
    return await this.getContracts({ ...params, customer_id: customerId });
  }
  
  /**
   * 按合同类型获取合同
   * @param type 合同类型
   * @param params 其他查询参数
   * @returns 合同列表响应
   */
  async getContractsByType(
    type: ContractType, 
    params?: Omit<ContractQueryParams, 'type'>
  ): Promise<ContractListResponse> {
    return await this.getContracts({ ...params, type });
  }
  
  /**
   * 搜索合同
   * @param searchTerm 搜索词
   * @param params 其他查询参数
   * @returns 合同列表响应
   */
  async searchContracts(
    searchTerm: string, 
    params?: Omit<ContractQueryParams, 'search'>
  ): Promise<ContractListResponse> {
    return await this.getContracts({ ...params, search: searchTerm });
  }
}

// 导出合同服务实例
export const contractService = new ContractService(); 