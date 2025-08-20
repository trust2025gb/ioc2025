// 抑制 React Native Web 相关警告
// 这段代码必须放在文件最顶部，确保在导入之前运行
if (typeof window !== 'undefined' && typeof console !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0].toLowerCase();
      // 过滤低价值的RN Web噪声（错误通道里偶发）
      if (
        msg.includes('usenativedriver') && msg.includes('not supported') ||
        (msg.includes('shadow') && msg.includes('boxshadow')) ||
        msg.includes('download the react devtools') ||
        // RN Web 在开发环境下的 DOM 嵌套/文本节点类提示
        msg.includes('validatedomnesting') ||
        msg.includes('unexpected text node')
      ) {
        return;
      }
    }
    // 忽略所有React Native特有的事件处理程序警告
    if (
      typeof args[0] === 'string' && 
      (
        args[0].includes('Unknown event handler property') ||
        args[0].includes('onStartShouldSetResponder') ||
        args[0].includes('onMoveShouldSetResponder') ||
        args[0].includes('onResponderGrant') ||
        args[0].includes('onResponderMove') ||
        args[0].includes('onResponderRelease') ||
        args[0].includes('onResponderTerminate') ||
        args[0].includes('onResponderTerminationRequest') ||
        args[0].includes('onPress') ||
        args[0].includes('onLongPress') ||
        args[0].includes('onPressIn') ||
        args[0].includes('onPressOut')
      )
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0].toLowerCase();
      // 统一用关键词匹配，避免引号/格式差异导致未命中
      if (
        // useNativeDriver 在 Web 上不支持的提示
        (msg.includes('usenativedriver') && msg.includes('not supported')) ||
        msg.includes('rctanimation module is missing') ||
        // shadow* -> boxShadow 的提示
        (msg.includes('shadow') && msg.includes('boxshadow')) ||
        // 字体加载回退/网络慢的提示
        msg.includes('fallback font will be used while loading') ||
        msg.includes('fontfaceobserver') ||
        // DevTools 提示
        msg.includes('download the react devtools') ||
        // RN Web 开发环境下的文本/嵌套提示
        msg.includes('validatedomnesting') ||
        msg.includes('unexpected text node')
      ) {
        return;
      }
    }
    originalConsoleWarn(...args);
  };
}

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// 导入状态管理
import { store, persistor, RootState, AppDispatch } from './src/store';
import { resetAuthState } from './src/store/slices/authSlice';

// 导入主题
import { theme, darkTheme } from './src/theme';

// 导航
import { AppNavigator } from './src/navigation';
// expo-notifications 改为按需动态加载，避免 Web/未安装时报打包错误
// import * as Notifications from 'expo-notifications';
import { apiClient } from './src/api/client';
import { NotificationsApi } from './src/api/notifications';
import { registerPush } from './src/utils/notifications';

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 30 * 60 * 1000, // 30分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 修复Web平台输入框问题
if (Platform.OS === 'web') {
  // 在Web环境下，添加全局样式以修复输入框问题
  const style = document.createElement('style');
  style.textContent = `
    input, textarea {
      outline: none !important;
      border: none;
      font-size: 16px;
      box-sizing: border-box;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
    
    /* 修复React Native Web输入框问题 */
    [role="textbox"], [role="button"] {
      cursor: text;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    
    /* 禁用文本选择限制 */
    * {
      -webkit-user-select: auto !important;
      user-select: auto !important;
    }
    
    /* 确保输入框可以接收焦点和输入 */
    input:focus {
      outline: none !important;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);
  
  const disableDefaultBehavior = () => {
    (document.documentElement as any).style.webkitUserSelect = 'auto';
    document.documentElement.style.userSelect = 'auto';

    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        e.stopPropagation();
      }
    }, true);
  };

  if (document.readyState === 'complete') {
    disableDefaultBehavior();
  } else {
    window.addEventListener('load', disableDefaultBehavior);
  }
}

function AppContent() {
  // 预加载图标字体，避免Web端回退字体警告与闪烁
  const [fontsLoaded] = useFonts({
    ...(MaterialCommunityIcons as any).font,
  });

  // 读取主题设置
  const uiTheme = useSelector((state: RootState) => state.ui.theme);
  const resolvedTheme = uiTheme === 'dark' ? darkTheme : theme;
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // 监听全局未授权事件
    const handler = () => {
      try { dispatch(resetAuthState()); } catch (_) {}
    };
    if (typeof window !== 'undefined') {
      (window as any).addEventListener?.('APP_UNAUTHORIZED', handler);
      return () => (window as any).removeEventListener?.('APP_UNAUTHORIZED', handler);
    }
    return () => {};
  }, [dispatch]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fixInputs = () => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.addEventListener('click', (e) => {
            e.stopPropagation();
          });
          input.addEventListener('focus', (e) => {
            e.stopPropagation();
          });
          input.addEventListener('keydown', (e) => {
            e.stopPropagation();
          });
        });
      };
      fixInputs();
      const observer = new MutationObserver(fixInputs);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={resolvedTheme}>
      <StatusBar style="auto" />
      <AppNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <AppContent />
            </QueryClientProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
