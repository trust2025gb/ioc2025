/**
 * 存储相关工具
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  NOTIFICATION_FLAGS: '@ioc3:notification_flags',
};

/**
 * 存储工具类
 */
export class StorageUtils {
  /**
   * 保存数据到存储
   * @param key 键
   * @param value 值
   */
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`保存数据到存储失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 从存储获取数据
   * @param key 键
   * @param parse 是否解析JSON
   */
  static async getItem<T = any>(key: string, parse = true): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return null;
      }
      return parse ? JSON.parse(value) : value as unknown as T;
    } catch (error) {
      console.error(`从存储获取数据失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 从存储删除数据
   * @param key 键
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`从存储删除数据失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 清除所有存储
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('清除所有存储失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有存储键
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('获取所有存储键失败:', error);
      return [];
    }
  }

  /**
   * 保存认证信息
   * @param token 令牌
   * @param refreshToken 刷新令牌
   * @param userData 用户数据
   */
  static async saveAuthInfo(token: string, refreshToken: string, userData: any): Promise<void> {
    try {
      const promises = [
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
      ];
      await Promise.all(promises);
      console.log('认证信息已保存到本地存储');
    } catch (error) {
      console.error('保存认证信息失败:', error);
      throw error;
    }
  }

  /**
   * 清除认证信息
   */
  static async clearAuthInfo(): Promise<void> {
    try {
      const promises = [
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ];
      await Promise.all(promises);
      console.log('认证信息已从本地存储清除');
    } catch (error) {
      console.error('清除认证信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取认证信息
   */
  static async getAuthInfo(): Promise<{ token: string | null; refreshToken: string | null; userData: any | null }> {
    try {
      const [token, refreshToken, userDataString] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      let userData = null;
      if (userDataString) {
        try {
          userData = JSON.parse(userDataString);
        } catch (e) {
          console.error('解析用户数据失败:', e);
        }
      }

      return { token, refreshToken, userData };
    } catch (error) {
      console.error('获取认证信息失败:', error);
      return { token: null, refreshToken: null, userData: null };
    }
  }
} 