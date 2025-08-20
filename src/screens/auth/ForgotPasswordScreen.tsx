/**
 * 忘记密码页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
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

// 忘记密码表单验证模式
const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('请输入有效的邮箱').required('请输入邮箱'),
});

// 忘记密码表单初始值
const initialValues = {
  email: '',
};

/**
 * 忘记密码页面组件
 */
const ForgotPasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 处理忘记密码提交
  const handleSubmit = async (values: typeof initialValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // 调用忘记密码API
      await apiClient.post('/auth/forgot-password', values);

      // 设置成功消息
      setSuccess('重置密码链接已发送到您的邮箱，请查收');
    } catch (error: any) {
      // 设置错误消息
      setError(error.message || '发送重置密码链接失败，请稍后重试');
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
        title="忘记密码"
        showBackButton={true}
        onBackPress={navigateToLogin}
      />

      <View style={styles.container}>
        <Text style={styles.description}>
          请输入您的注册邮箱，我们将发送重置密码链接到您的邮箱。
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

        {/* 忘记密码表单 */}
        <Formik
          initialValues={initialValues}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <Input
                label="邮箱"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                touched={touched.email}
                leftIcon="email"
                autoCapitalize="none"
                keyboardType="email-address"
                required
              />

              <Button
                title="发送重置链接"
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

export default ForgotPasswordScreen; 