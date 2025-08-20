/**
 * 重置密码页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Formik } from 'formik';
import * as Yup from 'yup';

// 导入组件
import { Container, Button, Input, Header } from '../../components';

// 导入API服务
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../constants/api';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

// 重置密码表单验证模式
const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('请输入新密码')
    .min(6, '密码至少6个字符')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
      '密码必须包含大小写字母和数字'
    ),
  password_confirmation: Yup.string()
    .required('请确认新密码')
    .oneOf([Yup.ref('password')], '两次输入的密码不一致'),
});

// 重置密码表单初始值
const initialValues = {
  password: '',
  password_confirmation: '',
};

/**
 * 重置密码页面组件
 */
const ResetPasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.AUTH.RESET_PASSWORD>>();
  const { token } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 处理重置密码提交
  const handleSubmit = async (values: typeof initialValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // 调用重置密码API
      await apiClient.post('/auth/reset-password', {
        ...values,
        token,
      });

      // 设置成功消息
      setSuccess('密码重置成功');
      
      // 3秒后导航到登录页面
      setTimeout(() => {
        navigation.navigate(ROUTES.AUTH.LOGIN);
      }, 3000);
    } catch (error: any) {
      // 设置错误消息
      setError(error.message || '重置密码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 导航到登录页面
  const navigateToLogin = () => {
    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <Container
      safeArea
      scrollable
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="重置密码"
        showBackButton={true}
        onBackPress={navigateToLogin}
      />

      <View style={styles.container}>
        <Text style={styles.description}>
          请输入您的新密码，密码必须包含大小写字母和数字，且至少6个字符。
        </Text>

        {/* 错误提示 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 成功提示 */}
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* 重置密码表单 */}
        <Formik
          initialValues={initialValues}
          validationSchema={resetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <Input
                label="新密码"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                touched={touched.password}
                leftIcon="lock"
                type="password"
                required
              />

              <Input
                label="确认新密码"
                value={values.password_confirmation}
                onChangeText={handleChange('password_confirmation')}
                onBlur={handleBlur('password_confirmation')}
                error={errors.password_confirmation}
                touched={touched.password_confirmation}
                leftIcon="lock-check"
                type="password"
                required
              />

              <Button
                title="重置密码"
                onPress={handleSubmit}
                type="primary"
                size="large"
                loading={isLoading}
                disabled={isLoading || !!success}
                fullWidth
                style={styles.submitButton}
              />
            </View>
          )}
        </Formik>

        {/* 登录链接 */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>记起密码了？</Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>立即登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: spacing.large,
  },
  submitButton: {
    marginTop: spacing.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: spacing.tiny,
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: spacing.medium,
    borderRadius: radius.regular,
    marginBottom: spacing.medium,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: colors.success,
    padding: spacing.medium,
    borderRadius: radius.regular,
    marginBottom: spacing.medium,
  },
  successText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default ResetPasswordScreen; 