/**
 * UI状态切片
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI状态接口
interface UiState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  isLoading: boolean;
  loadingText: string | null;
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
  };
  modal: {
    visible: boolean;
    type: string | null;
    data: any;
  };
  networkStatus: {
    isConnected: boolean;
    type: string | null;
  };
  appState: {
    isForeground: boolean;
    lastActive: number | null;
  };
}

// 初始状态
const initialState: UiState = {
  theme: 'system',
  language: 'zh-CN',
  isLoading: false,
  loadingText: null,
  toast: {
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  },
  modal: {
    visible: false,
    type: null,
    data: null,
  },
  networkStatus: {
    isConnected: true,
    type: null,
  },
  appState: {
    isForeground: true,
    lastActive: null,
  },
};

// UI切片
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 设置主题
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    // 设置语言
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    
    // 显示加载
    showLoading: (state, action: PayloadAction<string | null>) => {
      state.isLoading = true;
      state.loadingText = action.payload;
    },
    
    // 隐藏加载
    hideLoading: (state) => {
      state.isLoading = false;
      state.loadingText = null;
    },
    
    // 显示提示
    showToast: (state, action: PayloadAction<{
      message: string;
      type?: 'success' | 'error' | 'info' | 'warning';
      duration?: number;
    }>) => {
      state.toast.visible = true;
      state.toast.message = action.payload.message;
      state.toast.type = action.payload.type || 'info';
      state.toast.duration = action.payload.duration || 3000;
    },
    
    // 隐藏提示
    hideToast: (state) => {
      state.toast.visible = false;
    },
    
    // 显示模态框
    showModal: (state, action: PayloadAction<{
      type: string;
      data?: any;
    }>) => {
      state.modal.visible = true;
      state.modal.type = action.payload.type;
      state.modal.data = action.payload.data || null;
    },
    
    // 隐藏模态框
    hideModal: (state) => {
      state.modal.visible = false;
      state.modal.type = null;
      state.modal.data = null;
    },
    
    // 设置网络状态
    setNetworkStatus: (state, action: PayloadAction<{
      isConnected: boolean;
      type: string | null;
    }>) => {
      state.networkStatus.isConnected = action.payload.isConnected;
      state.networkStatus.type = action.payload.type;
    },
    
    // 设置应用状态
    setAppState: (state, action: PayloadAction<{
      isForeground: boolean;
      lastActive?: number;
    }>) => {
      state.appState.isForeground = action.payload.isForeground;
      if (action.payload.lastActive) {
        state.appState.lastActive = action.payload.lastActive;
      }
    },
  },
});

export const {
  setTheme,
  setLanguage,
  showLoading,
  hideLoading,
  showToast,
  hideToast,
  showModal,
  hideModal,
  setNetworkStatus,
  setAppState,
} = uiSlice.actions;

export default uiSlice.reducer; 