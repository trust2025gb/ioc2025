/**
 * 注册页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Formik } from 'formik';
import * as Yup from 'yup';

// 导入组件
import { Container, Button, Input, Header } from '../../components';

// 导入状态管理
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register, clearError } from '../../store/slices/authSlice';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../api/services/authService';

// 注册表单验证模式
const passwordSchema = Yup.object().shape({
  username: Yup.string().required('请输入登录账号').min(3, '登录账号至少3个字符'),
  name: Yup.string().required('请输入真实姓名'),
  password: Yup.string()
    .required('请输入密码')
    .min(6, '密码至少6个字符')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
      '密码必须包含大小写字母和数字'
    ),
  password_confirmation: Yup.string()
    .required('请确认密码')
    .oneOf([Yup.ref('password')], '两次输入的密码不一致'),
  phone: Yup.string().matches(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
});

const smsSchema = Yup.object().shape({
  username: Yup.string().required('请输入登录账号').min(3, '登录账号至少3个字符'),
  name: Yup.string().required('请输入真实姓名'),
  phone: Yup.string()
    .required('请输入手机号')
    .matches(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  smsCode: Yup.string().required('请输入短信验证码').length(6, '验证码为6位数字'),
});

// 注册表单初始值
const initialValues = {
  username: '',
  name: '',
  password: '',
  password_confirmation: '',
  phone: '',
  smsCode: '',
};

/**
 * 注册页面组件
 */
const RegisterScreen = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showError, setShowError] = useState(false);
  const [useSms, setUseSms] = useState(false); // 短信验证码注册开关
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // 监听错误状态
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendCode = async (phone: string) => {
    if (!phone || !/^1[3-9]\d{9}$/.test((phone || '').trim())) {
      // 轻提示：直接在输入框下方会出现Yup错误，此外这里直接返回
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (countdown > 0 || sendingCode) return;
    try {
      setSendingCode(true);
      const resp = await authService.sendSmsCode(phone.trim(), 'register');
      Alert.alert('短信', resp.message || '验证码已发送');
      setCountdown(60);
    } catch (e: any) {
      const msg = e?.message || '发送验证码失败，请稍后重试';
      Alert.alert('短信发送失败', msg);
    } finally {
      setSendingCode(false);
    }
  };

  // 处理注册提交
  const handleSubmit = (values: typeof initialValues) => {
    if (useSms) {
      if (!values.smsCode) { Alert.alert('提示','请输入短信验证码'); return; }
      // 目前后端未提供短信注册端点，先退化为密码注册：生成一次性密码
      const tempPassword = 'Aa' + (values.smsCode || '123456');
      dispatch(
        register({
          name: values.name,
          email: '',
          phone: values.phone,
          password: tempPassword,
          confirmPassword: tempPassword,
          username: values.username,
        })
      );
      return;
    }
    dispatch(
      register({
        name: values.name,
        email: '',
        phone: values.phone,
        password: values.password,
        confirmPassword: values.password_confirmation,
        username: values.username,
      })
    );
  };

  // 导航到登录页面
  const navigateToLogin = () => {
    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <Container safeArea scrollable backgroundColor={colors.background} paddingHorizontal={0} paddingVertical={0}>
      <Header title="注册账号" showBackButton={true} onBackPress={navigateToLogin} />

      <View style={styles.container}>
        {/* 错误提示 */}
        {showError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 注册方式切换（整行可点击，提升Web端可用性） */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setUseSms(v => !v)}>
            <Text style={{ color: colors.text, fontSize: 16 }}>{useSms ? '短信验证码注册' : '密码注册'}</Text>
          </TouchableOpacity>
          <Switch value={useSms} onValueChange={(v) => setUseSms(v)} />
        </View>

        {/* 注册表单 */}
        <Formik initialValues={initialValues} validationSchema={useSms ? smsSchema : passwordSchema} onSubmit={handleSubmit}>
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <Input
                label="登录账号"
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                error={errors.username}
                touched={touched.username}
                leftIcon="account"
                autoCapitalize="none"
                required
              />

              <Input
                label="真实姓名"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={errors.name}
                touched={touched.name}
                leftIcon="account-card"
                required
              />

              <Input
                label="手机号"
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={errors.phone}
                touched={touched.phone}
                leftIcon="phone"
                keyboardType="phone-pad"
                required={useSms}
              />

              {useSms ? (
                <Input
                  label="短信验证码"
                  value={values.smsCode}
                  onChangeText={handleChange('smsCode')}
                  onBlur={handleBlur('smsCode')}
                  error={errors.smsCode}
                  touched={touched.smsCode}
                  leftIcon="shield-key"
                  keyboardType="number-pad"
                  required
                  rightElement={
                    <TouchableOpacity onPress={() => sendCode(values.phone)} disabled={countdown>0 || sendingCode}>
                      <Text style={{ color: countdown>0 || sendingCode ? colors.textSecondary : colors.primary }}>
                        {sendingCode ? '发送中…' : (countdown>0 ? `${countdown}s` : '获取验证码')}
                      </Text>
                    </TouchableOpacity>
                  }
                />
              ) : (
                <>
                  <Input
                    label="密码"
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
                    label="确认密码"
                    value={values.password_confirmation}
                    onChangeText={handleChange('password_confirmation')}
                    onBlur={handleBlur('password_confirmation')}
                    error={errors.password_confirmation}
                    touched={touched.password_confirmation}
                    leftIcon="lock-check"
                    type="password"
                    required
                  />
                </>
              )}

              <Button
                title="注册"
                onPress={handleSubmit}
                type="primary"
                size="large"
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                style={styles.registerButton}
              />
            </View>
          )}
        </Formik>

        {/* 登录链接 */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>已有账号？</Text>
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
  formContainer: {
    marginBottom: spacing.large,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  switchLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: spacing.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
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
});

export default RegisterScreen; 