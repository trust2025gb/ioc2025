/**
 * 修改密码页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header } from '../../components';

// 导入API服务
import { authService } from '../../api/services/authService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ProfileTabParamList } from '../../navigation/types';

// 表单验证模式
const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('当前密码为必填项'),
  newPassword: Yup.string()
    .required('新密码为必填项')
    .min(8, '密码长度至少为8个字符')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '密码必须包含大小写字母、数字和特殊字符'
    ),
  confirmPassword: Yup.string()
    .required('确认密码为必填项')
    .oneOf([Yup.ref('newPassword')], '两次输入的密码不一致'),
});

/**
 * 修改密码页面组件
 */
const ChangePasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProfileTabParamList>>();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 修改密码mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      Alert.alert('成功', '密码已成功修改', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('错误', error.message || '修改密码失败，请重试');
    },
  });
  
  // 处理表单提交
  const handleSubmit = (values: any) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };
  
  return (
    <Container safeArea>
      <Header
        title="修改密码"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.infoContainer}>
          <Icon name="shield-lock" size={36} color={colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            请输入您的当前密码和新密码。新密码必须包含大小写字母、数字和特殊字符，长度至少为8个字符。
          </Text>
        </View>
        
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }}
          validationSchema={passwordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="当前密码"
                value={values.currentPassword}
                onChangeText={handleChange('currentPassword')}
                onBlur={handleBlur('currentPassword')}
                secureTextEntry={!showCurrentPassword}
                style={styles.input}
                error={touched.currentPassword && !!errors.currentPassword}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
              />
              {touched.currentPassword && errors.currentPassword && (
                <HelperText type="error">{errors.currentPassword}</HelperText>
              )}
              
              <TextInput
                label="新密码"
                value={values.newPassword}
                onChangeText={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                secureTextEntry={!showNewPassword}
                style={styles.input}
                error={touched.newPassword && !!errors.newPassword}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />
              {touched.newPassword && errors.newPassword && (
                <HelperText type="error">{errors.newPassword}</HelperText>
              )}
              
              <TextInput
                label="确认新密码"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                error={touched.confirmPassword && !!errors.confirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <HelperText type="error">{errors.confirmPassword}</HelperText>
              )}
              
              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                style={styles.submitButton}
                loading={changePasswordMutation.isPending}
                disabled={changePasswordMutation.isPending}
              >
                修改密码
              </Button>
              
              <Button
                mode="text"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              >
                取消
              </Button>
            </View>
          )}
        </Formik>
        
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>密码安全提示：</Text>
          <Text style={styles.tipText}>• 使用至少8个字符的密码</Text>
          <Text style={styles.tipText}>• 包含大写和小写字母</Text>
          <Text style={styles.tipText}>• 包含数字和特殊字符</Text>
          <Text style={styles.tipText}>• 避免使用容易猜测的信息，如生日、姓名等</Text>
          <Text style={styles.tipText}>• 不要在多个网站使用相同的密码</Text>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.medium,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.grey100,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.large,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: spacing.medium,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  formContainer: {
    marginBottom: spacing.large,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.background,
  },
  submitButton: {
    marginTop: spacing.medium,
  },
  cancelButton: {
    marginTop: spacing.small,
  },
  tipContainer: {
    backgroundColor: colors.grey100,
    borderRadius: 8,
    padding: spacing.medium,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
});

export default ChangePasswordScreen; 