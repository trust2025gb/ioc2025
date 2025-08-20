/**
 * 用户接口
 */
import { apiClient } from '../client';
import { ApiError } from '../types';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string;
  avatar?: string;
  role: string;
  department?: string;
  position?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 认证服务
 */
class AuthService {
  /**
   * 登录
   * @param username 用户名
   * @param password 密码
   */
  async login(username: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      console.log('开始登录请求:', { username, password: '******' });
      
      // 发送登录请求
      const response = await apiClient.post('/api/auth/login', { username, password });
      console.log('登录原始响应:', JSON.stringify(response, null, 2));
      
      // 检查响应格式
      if (!response || response.success === false) {
        const errorMsg = response?.message || '登录失败，服务器返回未知错误';
        console.error('登录失败:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // 检查必要字段
      if (!response.token) {
        console.error('登录响应缺少token字段:', response);
        throw new Error('登录成功但返回数据格式错误: 缺少token');
      }
      
      if (!response.user) {
        console.error('登录响应缺少user字段:', response);
        throw new Error('登录成功但返回数据格式错误: 缺少user');
      }
      
      console.log('登录成功，用户信息:', response.user);
      
      // 保存令牌到客户端
      apiClient.setAuthToken(response.token);
      
      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      console.error('登录异常:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 发送短信验证码（默认场景：login）
   */
  async sendSmsCode(phone: string, scene: 'login'|'register' = 'login'): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/api/auth/send-sms-code', { phone, scene });
      return { message: response.message || '验证码已发送' };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 短信验证码登录
   */
  async loginWithSms(phone: string, code: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiClient.post('/api/auth/login-sms', { phone, code });
      if (!response || response.success === false) {
        throw new Error(response?.message || '短信登录失败');
      }
      apiClient.setAuthToken(response.token);
      return { user: response.user, token: response.token, refreshToken: response.refreshToken };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 注册
   * @param name 姓名
   * @param email 邮箱
   * @param phone 手机号
   * @param password 密码
   */
  async register(name: string, email: string, phone: string, password: string, username?: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const payload: any = { name, email, phone, password, password_confirmation: password };
      if (username) payload.username = username;
      const response = await apiClient.post('/api/auth/register', payload);
      
      // 保存令牌到客户端
      apiClient.setAuthToken(response.token);
      
      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 退出登录
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
      
      // 清除令牌
      apiClient.clearAuthToken();
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/api/auth/profile');
      // 检查响应格式，处理嵌套的user对象
      if (response.user) {
        return response.user;
      } else if (response.data && response.data.user) {
        return response.data.user;
      } else {
        throw new Error('用户数据格式不正确');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await apiClient.post('/api/auth/refresh-token', { refreshToken });
      
      // 更新令牌
      apiClient.setAuthToken(response.token);
      
      return {
        token: response.token,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 忘记密码
   * @param email 邮箱
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 重置密码
   * @param token 重置令牌
   * @param password 新密码
   */
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/reset-password', {
        token,
        password,
        password_confirmation: password,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 更新用户资料
   * @param userData 用户数据
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put('/api/auth/profile', userData);
      return response.user ?? response.data?.user ?? response; // 兼容不同返回结构
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 修改密码
   * @param currentPassword 当前密码
   * @param newPassword 新密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 上传头像
   * @param file 头像文件
   */
  async uploadAvatar(file: FormData): Promise<{ avatar_url: string; avatar?: string; user?: User }> {
    try {
      const response = await apiClient.post('/api/auth/avatar', file);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 微信登录（通过code换token）
   */
  async loginWithWeChat(code: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiClient.post('/api/auth/wechat/login', { code });
      apiClient.setAuthToken(response.token);
      return { user: response.user, token: response.token, refreshToken: response.refreshToken };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * 企业微信登录（通过code换token）
   */
  async loginWithWecom(code: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiClient.post('/api/auth/wecom/login', { code });
      apiClient.setAuthToken(response.token);
      return { user: response.user, token: response.token, refreshToken: response.refreshToken };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /** 获取企业微信绑定URL */
  async getWecomBindUrl(): Promise<string> {
    const res = await apiClient.get('/api/wecom/bind-url');
    return res.bind_url || res.url || '';
  }

  /** 解绑企业微信 */
  async unbindWecom(): Promise<void> {
    await apiClient.post('/api/wecom/unbind', {});
  }

  /**
   * 处理API错误
   * @param error 错误对象
   */
  private handleError(error: any): ApiError {
    const status = error.response?.status || 500;
    let message = '服务器错误，请稍后再试';

    if (error.response) {
      // 服务器响应错误
      if (status === 401) {
        message = '未授权，请重新登录';
      } else if (status === 403) {
        message = '无权限执行此操作';
      } else if (status === 404) {
        message = '请求的资源不存在';
      } else if (status === 422) {
        // 表单验证错误
        const errors = error.response.data.errors;
        if (errors) {
          const firstError = Object.values(errors)[0] as string[];
          message = firstError[0] || '表单验证失败';
        } else {
          message = error.response.data.message || '表单验证失败';
        }
      } else {
        message = error.response.data.message || '请求失败';
      }
    } else if (error.request) {
      // 请求发送但未收到响应
      message = '无法连接到服务器，请检查网络连接';
    } else {
      // 请求设置时出错
      message = error.message || '请求错误';
    }

    return {
      status,
      message,
    };
  }
}

export const authService = new AuthService(); 