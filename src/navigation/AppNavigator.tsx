/**
 * 应用导航
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';

// 导入导航器
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

// 导入状态
import { RootState, AppDispatch } from '../store';
import { getCurrentUser, setCredentials } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../constants/config';
import { registerPush } from '../utils/notifications';

// 导入类型
import { RootStackParamList } from './types';
import { colors } from '../theme';
import { navigationRef } from './RootNavigation';

// 创建应用堆栈导航器
const Stack = createStackNavigator<RootStackParamList>();

/**
 * 加载屏幕组件
 */
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={{ marginTop: 20, color: colors.text }}>正在加载...</Text>
  </View>
);

/**
 * 应用导航器
 * 根据认证状态显示认证导航器或主导航器
 */
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [initializing, setInitializing] = useState(true);

  // 登录成功后再注册推送
  useEffect(() => {
    if (isAuthenticated) {
      registerPush();
    }
  }, [isAuthenticated]);

  // 检查本地存储中的令牌并尝试恢复认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 从本地存储获取令牌
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (token && refreshToken) {
          // 设置令牌到状态
          dispatch(setCredentials({ token, refreshToken }));
          
          // 获取当前用户信息（仅在存在token时尝试）
          dispatch(getCurrentUser());
        }
      } catch (error) {
        // 忽略错误，直接进入未登录态
      } finally {
        // 初始化完成
        setInitializing(false);
      }
    };
    
    checkAuth();
  }, [dispatch]);

  // 如果正在初始化，显示加载指示器；避免未登录时因 getCurrentUser.pending 造成长时间白屏
  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ animationEnabled: true }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
            options={{ animationEnabled: true }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 

export default AppNavigator; 