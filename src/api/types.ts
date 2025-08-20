/**
 * API错误接口
 */
export interface ApiError {
  status: number;
  message: string;
}

/**
 * 分页元数据接口
 */
export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    count: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

/**
 * 查询参数接口
 */
export interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * 过滤器接口
 */
export interface Filters {
  [key: string]: string | number | boolean | string[] | number[] | null;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data: T;
}

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse {
  url: string;
  path: string;
  filename: string;
  mime_type: string;
  size: number;
}

/**
 * 通用选项接口
 */
export interface SelectOption {
  value: string | number;
  label: string;
} 