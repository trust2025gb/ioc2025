/**
 * 产品服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';

// 产品分类接口
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  order?: number;
  created_at: string;
  updated_at: string;
}

// 产品接口
export interface Product {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  category_id: string;
  category?: ProductCategory;
  price?: number;
  min_price?: number;
  max_price?: number;
  features?: ProductFeature[] | any;
  images?: string[];
  thumbnail?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  intro_html?: string;
  documents?: { title: string; url: string }[];
  benefits?: Array<{ year: number; annual: number; cumulative: number; cash: number }>;
  faqs?: Array<{ q: string; a: string }>;
  claims_process?: Array<{ title: string; desc: string; icon?: string }>;
  withdraw_policy?: string;
}

// 产品特性接口
export interface ProductFeature {
  id: string;
  name: string;
  value: string;
  icon?: string;
}

// 产品列表响应接口
export interface ProductListResponse {
  data: Product[];
  pagination: {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

// 产品查询参数接口
export interface ProductQueryParams {
  category_id?: string;
  search?: string;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

class ProductService {
  /**
   * 获取产品列表
   * @param params 查询参数
   * @returns 产品列表响应
   */
  async getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
    return await apiClient.getPaginated<Product>(API_ENDPOINTS.PRODUCTS.BASE, params);
  }
  
  /**
   * 获取产品详情
   * @param id 产品ID
   * @returns 产品详情
   */
  async getProduct(id: string): Promise<Product> {
    return await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(id));
  }
  
  /**
   * 获取产品分类列表
   * @returns 产品分类列表
   */
  async getCategories(): Promise<ProductCategory[]> {
    return await apiClient.get<ProductCategory[]>(API_ENDPOINTS.PRODUCTS.CATEGORIES);
  }
  
  /**
   * 获取特色产品
   * @param limit 限制数量
   * @returns 特色产品列表
   */
  async getFeaturedProducts(limit: number = 5): Promise<Product[]> {
    const params = { is_featured: true, per_page: limit };
    const response = await this.getProducts(params);
    return response.data;
  }
  
  /**
   * 比较多个产品
   * @param productIds 产品ID数组
   * @returns 产品数组
   */
  async compareProducts(productIds: string[]): Promise<Product[]> {
    return await apiClient.post<Product[]>(API_ENDPOINTS.PRODUCTS.COMPARE, { productIds });
  }
  
  /**
   * 搜索产品
   * @param keyword 搜索关键词
   * @param params 其他查询参数
   * @returns 产品列表响应
   */
  async searchProducts(keyword: string, params?: Omit<ProductQueryParams, 'search'>): Promise<ProductListResponse> {
    return await this.getProducts({ ...params, search: keyword });
  }
  
  /**
   * 按分类获取产品
   * @param categoryId 分类ID
   * @param params 其他查询参数
   * @returns 产品列表响应
   */
  async getProductsByCategory(categoryId: string, params?: Omit<ProductQueryParams, 'category_id'>): Promise<ProductListResponse> {
    return await this.getProducts({ ...params, category_id: categoryId });
  }
}

// 导出产品服务实例
export const productService = new ProductService(); 