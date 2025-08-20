/**
 * API基础URL
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const deriveLanHostFromExpo = (): string | null => {
  try {
    const anyConst: any = Constants || {};
    const hostUri: string | undefined = anyConst.expoConfig?.hostUri || anyConst.expoGoConfig?.hostUri || anyConst.manifest?.debuggerHost;
    if (typeof hostUri === 'string' && hostUri.length > 0) {
      // 样例："192.168.1.88:19000" / "192.168.1.88:19006"
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000`;
      }
    }
  } catch (_) {}
  return null;
};

const safeGetPublicApiFromEnv = (): string => {
  try {
    // 在浏览器构建里，process 可能未定义
    if (typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_API_BASE_URL) {
      return String((process as any).env.EXPO_PUBLIC_API_BASE_URL || '').trim();
    }
  } catch (_) {}
  return '';
};

const deriveApiBaseUrl = (): string => {
  const candidate = safeGetPublicApiFromEnv();
  if (candidate) return candidate.replace(/\/$/, '');
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (typeof process !== 'undefined' ? (process as any)?.env?.NODE_ENV !== 'production' : true);

  // 开发环境下的合理默认：
  if (isDev) {
    // 1) 优先尝试通过 Expo 提供的 hostUri 自动识别局域网宿主机 IP
    const lan = deriveLanHostFromExpo();
    if (lan) return lan;
    // Web：本地后端常用 8000 端口
    if (Platform.OS === 'web') {
      return 'http://localhost:8000';
    }
    // Android 模拟器通过 10.0.2.2 访问宿主机的 localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    // iOS 模拟器与真机调试（同一网段可改为局域网IP）
    return 'http://localhost:8000';
  }

  // 生产环境优先使用当前域名
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  // 构建/SSR或无法获取window时的安全默认值（生产域名）
  return 'https://okcrm.sdbaoyi.cn';
};

export const API_BASE_URL = deriveApiBaseUrl();

/**
 * 本地存储键
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@ioc3:auth_token',
  REFRESH_TOKEN: '@ioc3:refresh_token',
  USER_DATA: '@ioc3:user_data',
  SETTINGS: '@ioc3:settings',
  LANGUAGE: '@ioc3:language',
  THEME: '@ioc3:theme',
  BIOMETRIC_ENABLED: '@ioc3:biometric_enabled',
  NOTIFICATION_SETTINGS: '@ioc3:notification_settings',
};

/**
 * 超时设置（毫秒）
 */
export const TIMEOUT = {
  API_REQUEST: 30000, // 30秒
  TOAST: 3000, // 3秒
  DEBOUNCE: 300, // 300毫秒
  THROTTLE: 500, // 500毫秒
};

/**
 * 分页设置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 20, 50, 100],
};

/**
 * 文件上传设置
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
};

/**
 * 缓存设置
 */
export const CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5分钟
  CACHE_TIME: 30 * 60 * 1000, // 30分钟
};

/**
 * 应用设置
 */
export const APP_CONFIG = {
  VERSION: '1.0.0',
  BUILD: '1',
  COPYRIGHT: '© 2025 保险业务协作系统',
  CONTACT_EMAIL: 'support@ioc3.com',
  PRIVACY_POLICY_URL: 'https://ioc3.com/privacy',
  TERMS_URL: 'https://ioc3.com/terms',
};

/**
 * 环境设置
 */
export const ENV = {
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
}; 