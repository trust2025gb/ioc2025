/**
 * API客户端
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import { normalizeUrlsDeep } from '../utils/url';
import { resetToAuth } from '../navigation/RootNavigation';

// 触发未授权全局事件（避免直接依赖 Redux，规避循环依赖）
const emitUnauthorized = () => {
	try {
		if (typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function') {
			(window as any).dispatchEvent(new CustomEvent('APP_UNAUTHORIZED'));
		}
	} catch (_) {}
};

/**
 * API客户端类
 */
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];
  private requestCache: Map<string, { promise: Promise<any>, timestamp: number }> = new Map();
  private cacheDuration = 2000; // 默认请求去重时间：2秒

  constructor() {
    // 创建Axios实例
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: true, // 支持跨域请求时发送Cookie
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config) => {
        if (__DEV__) {
          // 精简请求日志，避免控制台噪声
          console.debug(`API ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        // 从本地存储获取令牌
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        // 如果有令牌，添加到请求头
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            console.debug('Auth header attached');
          }
        }
        
        // 当发送 FormData 时，移除默认的 JSON Content-Type，让浏览器/原生自动设置 multipart 边界
        if (config.data instanceof FormData && config.headers) {
          delete (config.headers as any)['Content-Type'];
        }
        
        return config;
      },
      (error) => {
        console.error('API请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 规范化任何返回的资源URL，兼容生产/开发域名
        try {
          return normalizeUrlsDeep(response.data);
        } catch (_) {
          return response.data;
        }
      },
      async (error) => {
        const originalRequest = error.config;

        // 如果是刷新令牌接口本身返回401，避免再次触发刷新逻辑导致循环
        if (error.response?.status === 401) {
          const reqUrl: string = originalRequest?.url || '';
          if (reqUrl.includes('/api/auth/refresh-token')) {
            this.clearAuthToken();
            return Promise.reject(error);
          }
        }

        // 处理CSRF令牌过期 (419错误)
        if (error.response?.status === 419) {
          try {
            await this.getCsrfToken();
            return this.instance(originalRequest);
          } catch (csrfError) {
            return Promise.reject(csrfError);
          }
        }

        // 处理令牌过期 (401错误)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // 如果已经在刷新令牌，将请求添加到队列
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // 获取刷新令牌
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (!refreshToken) {
              // 无刷新令牌，直接清理并跳回登录
              this.clearAuthToken();
              emitUnauthorized();
              resetToAuth();
              throw new Error('刷新令牌不存在');
            }

            // 尝试刷新令牌
            const response = await this.post('/api/auth/refresh-token', { refreshToken });
            
            // 保存新令牌
            if (response.token) {
              await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
              
              if (response.refreshToken) {
                await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
              }
              
              // 更新请求头
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${response.token}`;
              }
              
              // 处理队列中的请求
              this.processQueue(null, response.token);
              
              // 重试原始请求
              return this.instance(originalRequest);
            } else {
              throw new Error('刷新令牌失败');
            }
          } catch (refreshError) {
            // 处理队列中的请求
            this.processQueue(refreshError, null);
            
            // 清除令牌
            this.clearAuthToken();
            
            emitUnauthorized();
            resetToAuth();

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // 处理其他错误
        return Promise.reject(error);
      }
    );
  }

  /**
   * 处理队列中的请求
   */
  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject, originalRequest }) => {
      if (error) {
        reject(error);
      } else if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(this.instance(originalRequest));
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * 获取CSRF令牌
   */
  public async getCsrfToken() {
    try {
      await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });
    } catch (error) {
      console.error('获取CSRF令牌失败:', error);
      throw error;
    }
  }

  /**
   * 设置认证令牌
   */
  public setAuthToken(token: string) {
    if (token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }

  /**
   * 清除认证令牌
   */
  public clearAuthToken() {
    delete this.instance.defaults.headers.common.Authorization;
    AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    // 清除持久化的 Redux 根（下次重启完全回到未登录）
    AsyncStorage.removeItem('persist:root');
  }

  /**
   * 生成请求缓存键
   */
  private generateCacheKey(method: string, url: string, params?: any, data?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  }
  
  /**
   * 执行去重请求
   * 如果短时间内有相同的请求，则返回上一次的请求结果
   */
  private async executeWithDebounce<T>(
    method: string, 
    url: string, 
    params?: any, 
    data?: any
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(method, url, params, data);
    const now = Date.now();
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp < this.cacheDuration)) {
      // 如果已经有一个相同的请求正在进行中，并且在缓存时间内，返回相同的Promise
      if (__DEV__) {
        console.debug(`Using cached request: ${method} ${url}`);
      }
      return cached.promise;
    }
    
    // 创建新请求
    let promise: Promise<T>;
    
    if (method === 'get') {
      promise = this.instance.get(url, { params }) as Promise<T>;
    } else if (method === 'post') {
      promise = this.instance.post(url, data) as Promise<T>;
    } else if (method === 'put') {
      promise = this.instance.put(url, data) as Promise<T>;
    } else if (method === 'patch') {
      promise = this.instance.patch(url, data) as Promise<T>;
    } else if (method === 'delete') {
      promise = this.instance.delete(url, { params }) as Promise<T>;
    } else {
      throw new Error(`不支持的请求方法: ${method}`);
    }
    
    // 存储到缓存中
    this.requestCache.set(cacheKey, { promise, timestamp: now });
    
    // 请求完成后，确保在下一个事件循环中清理缓存
    promise.finally(() => {
      setTimeout(() => {
        // 只有在没有新缓存的情况下才清理
        const current = this.requestCache.get(cacheKey);
        if (current && current.timestamp === now) {
          this.requestCache.delete(cacheKey);
        }
      }, this.cacheDuration);
    });
    
    return promise;
  }

  /**
   * GET请求
   */
  public async get<T = any>(url: string, params?: any): Promise<T> {
    return this.executeWithDebounce<T>('get', url, params);
  }

  /**
   * 获取分页数据
   */
  public async getPaginated<T = any>(url: string, params?: any): Promise<{
    data: T[];
    pagination: {
      total: number;
      count: number;
      perPage: number;
      currentPage: number;
      totalPages: number;
    };
  }> {
    return this.executeWithDebounce('get', url, params);
  }

  /**
   * POST请求
   */
  public async post<T = any>(url: string, data?: any): Promise<T> {
    return this.executeWithDebounce<T>('post', url, undefined, data);
  }

  /**
   * PUT请求
   */
  public async put<T = any>(url: string, data?: any): Promise<T> {
    return this.executeWithDebounce<T>('put', url, undefined, data);
  }

  /**
   * PATCH请求
   */
  public async patch<T = any>(url: string, data?: any): Promise<T> {
    return this.executeWithDebounce<T>('patch', url, undefined, data);
  }

  /**
   * DELETE请求
   */
  public async delete<T = any>(url: string, params?: any): Promise<T> {
    return this.executeWithDebounce<T>('delete', url, params);
  }
}

// 导出API客户端实例
export const apiClient = new ApiClient(); 