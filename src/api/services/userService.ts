import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../constants/api';
import { PaginatedResponse, QueryParams } from '../types';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  status?: string;
}

export interface UserQueryParams extends QueryParams {}

const FALLBACK_USER_PATH = '/admin/users'; // 若 /api/users 不存在，可尝试 /api/admin/users

class UserService {
  private async getFrom(path: string, params?: any) {
    return apiClient.get<PaginatedResponse<any>>(path, params);
  }

  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<AppUser>> {
    try {
      return await apiClient.get<PaginatedResponse<AppUser>>(API_ENDPOINTS.USERS.BASE, params);
    } catch (e: any) {
      // 尝试 /api/admin/users
      if (e?.response?.status === 404) {
        try {
          const resAdmin = await this.getFrom(`/api${FALLBACK_USER_PATH}`, params);
          return {
            data: (resAdmin.data || []).map((u: any) => ({
              id: String(u.id),
              username: u.username,
              name: u.name,
              email: u.email,
              phone: u.phone,
              avatar: u.avatar,
              role: u.role?.name || u.role?.code,
              status: u.status,
            })),
            pagination: resAdmin.pagination,
          } as PaginatedResponse<AppUser>;
        } catch (e2: any) {
          // 最后回退到 customers
          const res = await apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.CUSTOMERS.BASE, params);
          return {
            data: (res.data || []).map((c: any) => ({
              id: String(c.id),
              username: c.email || c.phone || c.name,
              name: c.name,
              email: c.email,
              phone: c.phone,
              avatar: c.avatar,
            })),
            pagination: res.pagination,
          } as PaginatedResponse<AppUser>;
        }
      }
      throw e;
    }
  }

  async getUser(id: string): Promise<AppUser> {
    try {
      return await apiClient.get<AppUser>(API_ENDPOINTS.USERS.DETAIL(id));
    } catch (e: any) {
      if (e?.response?.status === 404) {
        try {
          const u = await apiClient.get<any>(`/api${FALLBACK_USER_PATH}/${id}`);
          return {
            id: String(u.id),
            username: u.username,
            name: u.name,
            email: u.email,
            phone: u.phone,
            avatar: u.avatar,
            role: u.role?.name || u.role?.code,
            status: u.status,
          } as AppUser;
        } catch (e2: any) {
          const c = await apiClient.get<any>(API_ENDPOINTS.CUSTOMERS.DETAIL(id));
          return {
            id: String(c.id),
            username: c.email || c.phone || c.name,
            name: c.name,
            email: c.email,
            phone: c.phone,
            avatar: c.avatar,
          } as AppUser;
        }
      }
      throw e;
    }
  }
}

export const userService = new UserService(); 