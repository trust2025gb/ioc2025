/**
 * 登录页面
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { TextInput, Button, Text, Switch } from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch } from '../../store/hooks';
import { login, resetAuthState, loginWithSms } from '../../store/slices/authSlice';
import { colors } from '../../theme';
import { authService } from '../../api/services/authService';

const LoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSmsLogin, setIsSmsLogin] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 组件加载时重置认证状态
  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);

  const validationSchema = React.useMemo(() => (
    Yup.object().shape({
      username: Yup.string().when([], {
        is: () => !isSmsLogin,
        then: (s) => s.required('请输入用户名'),
        otherwise: (s) => s.optional(),
      }),
      password: Yup.string().when([], {
        is: () => !isSmsLogin,
        then: (s) => s.required('请输入密码'),
        otherwise: (s) => s.optional(),
      }),
      phone: Yup.string().when([], {
        is: () => isSmsLogin,
        then: (s) => s.required('请输入手机号'),
        otherwise: (s) => s.optional(),
      }),
      code: Yup.string().when([], {
        is: () => isSmsLogin,
        then: (s) => s.required('请输入验证码').length(6, '验证码为6位'),
        otherwise: (s) => s.optional(),
      }),
    })
  ), [isSmsLogin]);

  const formik = useFormik({
    initialValues: {
      username: 'admin',
      password: 'admin123',
      phone: '',
      code: '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        if (isSmsLogin) {
          const result = await dispatch(loginWithSms({ phone: values.phone, code: values.code })).unwrap();
          console.log('短信登录成功:', result);
        } else {
          const resultAction = await dispatch(login({ username: values.username, password: values.password })).unwrap();
          console.log('密码登录成功:', resultAction);
        }
      } catch (error: any) {
        console.error('登录失败:', error);
        Alert.alert('登录失败', error.message || '请重试', [{ text: '确定' }]);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleSendCode = async () => {
    try {
      if (!formik.values.phone) {
        Alert.alert('提示', '请先输入手机号');
        return;
      }
      if (countdown > 0 || sendingCode) return;
      try {
        setSendingCode(true);
        const resp = await authService.sendSmsCode(formik.values.phone, 'login');
        Alert.alert('短信', resp.message || '验证码已发送');
        setCountdown(60);
      } catch (e: any) {
        const msg = e?.message || '发送验证码失败，请稍后重试';
        Alert.alert('短信发送失败', msg);
      } finally {
        setSendingCode(false);
      }
    } catch (e: any) {
      Alert.alert('错误', e.message || '发送失败');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>业务协作系统</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.loginTitle}>账号登录</Text>

        {/* 登录方式切换（整行可点击） */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsSmsLogin((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <Text style={{ color: colors.text, marginRight: 8 }}>短信验证码登录</Text>
          <Switch value={isSmsLogin} onValueChange={(v) => setIsSmsLogin(v)} />
        </TouchableOpacity>

        {!isSmsLogin && (
          <>
            <TextInput
              label="用户名"
              value={formik.values.username}
              onChangeText={formik.handleChange('username')}
              onBlur={formik.handleBlur('username')}
              error={formik.touched.username && Boolean(formik.errors.username)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />
            {formik.touched.username && formik.errors.username && (
              <Text style={styles.errorText}>{formik.errors.username}</Text>
            )}

            <TextInput
              label="密码"
              value={formik.values.password}
              onChangeText={formik.handleChange('password')}
              onBlur={formik.handleBlur('password')}
              error={formik.touched.password && Boolean(formik.errors.password)}
              secureTextEntry={!passwordVisible}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="lock" />}
              right={<TextInput.Icon icon={passwordVisible ? 'eye-off' : 'eye'} onPress={() => setPasswordVisible(!passwordVisible)} />}
            />
            {formik.touched.password && formik.errors.password && (
              <Text style={styles.errorText}>{formik.errors.password}</Text>
            )}
          </>
        )}

        {isSmsLogin && (
          <>
            <TextInput
              label="手机号"
              value={formik.values.phone}
              onChangeText={formik.handleChange('phone')}
              onBlur={formik.handleBlur('phone')}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="phone" />}
              keyboardType="phone-pad"
            />
            {formik.touched.phone && formik.errors.phone && (
              <Text style={styles.errorText}>{formik.errors.phone}</Text>
            )}

            <TextInput
              label="验证码"
              value={formik.values.code}
              onChangeText={formik.handleChange('code')}
              onBlur={formik.handleBlur('code')}
              error={formik.touched.code && Boolean(formik.errors.code)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="shield-key" />}
              right={<TextInput.Icon icon={sendingCode ? 'progress-clock' : (countdown > 0 ? 'timer' : 'send')} disabled={countdown > 0 || sendingCode} onPress={handleSendCode} />}
            />
            <Text style={{ color: colors.text, fontSize: 12, marginLeft: 5, marginBottom: 6 }}>
              {sendingCode ? '验证码获取中，请稍等…' : (countdown > 0 ? `${countdown}s后可重新发送` : '获取不到短信？请检查手机号或稍后再试')}
            </Text>
          </>
        )}

        <Button mode="contained" onPress={() => formik.handleSubmit()} style={styles.button} loading={isLoading} disabled={isLoading}>
          登录
        </Button>

        {/* 第三方登录 */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, marginBottom: 8 }}>其他登录方式</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button mode="outlined" icon="wechat" onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  const resp = await fetch('/api/wechat/login-url');
                  const data = await resp.json();
                  if (data?.login_url) {
                    window.open(data.login_url, '_blank');
                  }
                } else {
                  Alert.alert('提示', '请在微信中打开或集成微信SDK后再使用');
                }
              } catch (e) {
                Alert.alert('错误', '获取微信登录链接失败');
              }
            }}>微信登录</Button>

            <Button mode="outlined" icon="briefcase" onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  const resp = await fetch('/api/wecom/login-url');
                  const data = await resp.json();
                  if (data?.login_url) {
                    window.open(data.login_url, '_blank');
                  }
                } else {
                  Alert.alert('提示', '请在企业微信中打开或集成SDK后再使用');
                }
              } catch (e) {
                Alert.alert('错误', '获取企业微信登录链接失败');
              }
            }}>企业微信登录</Button>
          </View>
        </View>

        {!isSmsLogin && (
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>忘记密码?</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          还没有账号? <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>立即注册</Text>
        </Text>
        {Platform.OS === 'web' && (
          <Text style={{ color: colors.text, marginTop: 6, fontSize: 12 }}>
            如果完成扫码，后端回调会在当前站点完成登录；移动端H5可通过code调用 /api/auth/wechat/login 或 /api/auth/wecom/login 换取token。
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 5 },
  subtitle: { fontSize: 16, color: colors.text },
  formContainer: { marginBottom: 20 },
  loginTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.text },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  errorText: { color: colors.error, marginBottom: 10, marginLeft: 5, fontSize: 12 },
  button: { marginTop: 10, paddingVertical: 6 },
  forgotPassword: { alignItems: 'flex-end', marginTop: 15 },
  forgotPasswordText: { color: colors.primary },
  footer: { marginTop: 'auto', alignItems: 'center', padding: 20 },
  footerText: { color: colors.text },
  registerText: { color: colors.primary, fontWeight: 'bold' },
});

export default LoginScreen; 