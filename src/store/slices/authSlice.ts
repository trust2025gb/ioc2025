/**
 * 认证状态切片
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, User } from '../../api/services/authService';
import { ApiError } from '../../api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';

// 认证状态接口
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// 登录凭证接口
interface LoginCredentials {
  username: string;
  password: string;
}

// 注册数据接口
interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

// 登录异步操作
export const login = createAsyncThunk<
  { user: User; token: string; refreshToken: string },
  { username: string; password: string },
  { rejectValue: ApiError }
>('auth/login', async (credentials, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: AuthState };
    console.log('当前认证状态:', { 
      isAuthenticated: auth.isAuthenticated, 
      isLoading: auth.isLoading,
      hasToken: !!auth.token
    });
    console.log('执行登录操作...');
    const response = await authService.login(credentials.username, credentials.password);
    console.log('登录操作完成，准备更新状态');
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    console.log('认证信息已保存到本地存储');
    return response;
  } catch (error: any) {
    console.error('登录操作失败:', error);
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '登录失败',
    });
  }
});

// 新增：短信验证码登录
export const loginWithSms = createAsyncThunk<
  { user: User; token: string; refreshToken: string },
  { phone: string; code: string },
  { rejectValue: ApiError }
>('auth/loginWithSms', async ({ phone, code }, { rejectWithValue }) => {
  try {
    const response = await authService.loginWithSms(phone, code);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    return response;
  } catch (error: any) {
    return rejectWithValue({ status: error.status || 500, message: error.message || '短信登录失败' });
  }
});

// 注册异步操作
export const register = createAsyncThunk<
  { user: User; token: string; refreshToken: string },
  RegisterData,
  { rejectValue: ApiError }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authService.register(
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.username
    );
    return response;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '注册失败',
    });
  }
});

// 获取当前用户信息异步操作
export const getCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: ApiError }
>('auth/getCurrentUser', async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.token) {
      throw new Error('未登录');
    }
    const user = await authService.getCurrentUser();
    return user;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 401,
      message: error.message || '获取用户信息失败',
    });
  }
});

// 刷新令牌异步操作
export const refreshToken = createAsyncThunk<
  { token: string; refreshToken: string },
  void,
  { rejectValue: ApiError }
>('auth/refreshToken', async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.refreshToken) {
      throw new Error('无刷新令牌');
    }
    const tokens = await authService.refreshToken(auth.refreshToken);
    return tokens;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 401,
      message: error.message || '刷新令牌失败',
    });
  }
});

// 退出登录异步操作
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await authService.logout();
    return true;
  } catch (error) {
    console.error('退出登录失败:', error);
    return true; // 即使API调用失败，也清除本地状态
  }
});

// 忘记密码异步操作
export const forgotPassword = createAsyncThunk<
  boolean,
  string,
  { rejectValue: ApiError }
>('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    await authService.forgotPassword(email);
    return true;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '发送重置密码邮件失败',
    });
  }
});

// 重置密码异步操作
export const resetPassword = createAsyncThunk<
  boolean,
  { token: string; password: string },
  { rejectValue: ApiError }
>('auth/resetPassword', async ({ token, password }, { rejectWithValue }) => {
  try {
    await authService.resetPassword(token, password);
    return true;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '重置密码失败',
    });
  }
});

// 更新用户信息异步操作
export const updateProfile = createAsyncThunk<
  User,
  Partial<User>,
  { rejectValue: ApiError }
>('auth/updateProfile', async (userData, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.user || !auth.token) {
      throw new Error('未登录');
    }
    const updatedUser = await authService.updateProfile(userData);
    return updatedUser;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '更新个人资料失败',
    });
  }
});

// 修改密码异步操作
export const changePassword = createAsyncThunk<
  boolean,
  { currentPassword: string; newPassword: string },
  { rejectValue: ApiError }
>('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await authService.changePassword(currentPassword, newPassword);
    return true;
  } catch (error: any) {
    return rejectWithValue({
      status: error.status || 500,
      message: error.message || '修改密码失败',
    });
  }
});

// 第三方登录：微信
export const loginWithWeChat = createAsyncThunk<
  { user: User; token: string; refreshToken: string },
  { code: string },
  { rejectValue: ApiError }
>('auth/loginWithWeChat', async ({ code }, { rejectWithValue }) => {
  try {
    const response = await authService.loginWithWeChat(code);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    return response;
  } catch (error: any) {
    return rejectWithValue({ status: error.status || 500, message: error.message || '微信登录失败' });
  }
});

// 第三方登录：企业微信
export const loginWithWecom = createAsyncThunk<
  { user: User; token: string; refreshToken: string },
  { code: string },
  { rejectValue: ApiError }
>('auth/loginWithWecom', async ({ code }, { rejectWithValue }) => {
  try {
    const response = await authService.loginWithWecom(code);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    return response;
  } catch (error: any) {
    return rejectWithValue({ status: error.status || 500, message: error.message || '企业微信登录失败' });
  }
});

// 认证切片
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 登录
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload?.message || '登录失败';
    });

    // 新增：短信登录 reducers
    builder.addCase(loginWithSms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginWithSms.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(loginWithSms.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload?.message || '短信登录失败';
    });

    // 注册
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message || '注册失败';
    });

    // 获取当前用户信息
    builder.addCase(getCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(getCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload?.message || '获取用户信息失败';
    });

    // 刷新令牌
    builder.addCase(refreshToken.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload?.message || '刷新令牌失败';
    });

    // 退出登录
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
    });

    // 更新用户信息
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message || '更新个人资料失败';
    });

    // 修改密码
    builder.addCase(changePassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload?.message || '修改密码失败';
    });

    // 第三方登录 reducers
    builder.addCase(loginWithWeChat.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(loginWithWeChat.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    });
    builder.addCase(loginWithWeChat.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload?.message || '微信登录失败';
    });

    builder.addCase(loginWithWecom.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(loginWithWecom.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    });
    builder.addCase(loginWithWecom.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload?.message || '企业微信登录失败';
    });
  },
});

export const { clearError, setCredentials, resetAuthState } = authSlice.actions;
export default authSlice.reducer; 