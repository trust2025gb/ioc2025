/**
 * 订单服务
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';
import { User } from './authService';
import { Product } from './productService';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// 支付方式枚举
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
}

// 订单接口
export interface Order {
  id: string | number;
  order_number?: string;
  customer_id?: string;
  user_id?: string;
  customer?: User;
  user?: User;
  product_id: string;
  product?: Product;
  plan_id?: string;
  amount?: number;
  total?: number;
  status: OrderStatus | string;
  payment_status: PaymentStatus | string;
  payment_method?: PaymentMethod | string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
}

// 订单列表响应接口
export interface OrderListResponse {
  data: Order[];
  pagination: {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

// 订单查询参数接口
export interface OrderQueryParams {
  customer_id?: string;
  product_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  search?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}

// 创建订单请求接口
export interface CreateOrderRequest {
  customer_id: string;
  product_id: string;
  plan_id?: string;
  amount: number;
  payment_method?: PaymentMethod;
  notes?: string;
}

// 更新订单请求接口
export interface UpdateOrderRequest {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_date?: string;
  notes?: string;
}

// 支付订单请求接口
export interface PayOrderRequest {
  payment_method: PaymentMethod;
  payment_details?: Record<string, any>;
}

// 订单统计接口
export interface OrderStatistics {
  total_orders: number;
  total_amount: number;
  by_status: Record<OrderStatus, number>;
  by_payment_status: Record<PaymentStatus, number>;
  average_amount: number;
}

class OrderService {
  /**
   * 获取订单列表
   * @param params 查询参数
   * @returns 订单列表响应
   */
  async getOrders(params?: OrderQueryParams): Promise<OrderListResponse> {
    return await apiClient.getPaginated<Order>(API_ENDPOINTS.ORDERS.BASE, params);
  }
  
  /**
   * 获取订单详情
   * @param id 订单ID或订单号
   * @returns 订单详情
   */
  async getOrder(id: string): Promise<Order> {
    const isOrderNumber = typeof id === 'string' && id.toUpperCase().startsWith('ORD-');
    const url = isOrderNumber ? `/api/orders/number/${id}` : API_ENDPOINTS.ORDERS.DETAIL(id);
    return await apiClient.get<Order>(url);
  }
  
  /**
   * 创建订单
   * @param orderData 订单数据
   * @returns 创建的订单
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return await apiClient.post<Order>(API_ENDPOINTS.ORDERS.BASE, orderData);
  }
  
  /**
   * 更新订单
   * @param id 订单ID
   * @param orderData 订单数据
   * @returns 更新的订单
   */
  async updateOrder(id: string, orderData: UpdateOrderRequest): Promise<Order> {
    return await apiClient.put<Order>(API_ENDPOINTS.ORDERS.DETAIL(id), orderData);
  }
  
  /**
   * 更新订单状态（与后端 mark-as-* 接口对齐）
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    if (status === OrderStatus.CANCELLED) {
      return await apiClient.post<Order>(`/api/orders/${id}/mark-as-cancelled`, {});
    }
    if (status === OrderStatus.PROCESSING) {
      return await apiClient.post<Order>(`/api/orders/${id}/mark-as-processing`, {});
    }
    if (status === OrderStatus.COMPLETED) {
      return await this.updateOrder(id, { status });
    }
    return await this.updateOrder(id, { status });
  }
  
  /**
   * 支付订单（与后端 mark-as-paid 对齐）
   */
  async payOrder(id: string, paymentData: PayOrderRequest): Promise<{ success: boolean; order?: Order }> {
    return await apiClient.post<{ success: boolean; order?: Order }>(`/api/orders/${id}/mark-as-paid`, paymentData);
  }
  
  /**
   * 获取订单统计数据
   * @returns 订单统计
   */
  async getOrderStatistics(): Promise<OrderStatistics> {
    return await apiClient.get<OrderStatistics>(API_ENDPOINTS.ORDERS.STATISTICS);
  }
  
  /**
   * 获取我的订单
   */
  async getMyOrders(userId: string, params?: Omit<OrderQueryParams, 'customer_id'>): Promise<OrderListResponse> {
    return await this.getOrders({ ...params, customer_id: userId });
  }
  
  /**
   * 按状态获取订单
   */
  async getOrdersByStatus(status: OrderStatus, params?: Omit<OrderQueryParams, 'status'>): Promise<OrderListResponse> {
    return await this.getOrders({ ...params, status });
  }
  
  /**
   * 取消订单
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    return await this.updateOrder(id, { 
      status: OrderStatus.CANCELLED,
      notes: reason ? `订单取消原因: ${reason}` : undefined
    });
  }
}

// 导出订单服务实例
export const orderService = new OrderService(); 