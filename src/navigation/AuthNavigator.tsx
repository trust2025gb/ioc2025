/**
 * 认证导航
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 导入认证相关屏幕
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// 导入常量和类型
import { ROUTES } from '../constants/routes';
import { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * 认证导航器组件
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.AUTH.LOGIN}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.AUTH.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.AUTH.RESET_PASSWORD} component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 