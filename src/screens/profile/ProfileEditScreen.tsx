/**
 * 个人资料编辑页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

// 导入组件
import { Container, Header, Loading } from '../../components';

// 导入API服务
import { authService } from '../../api/services/authService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ProfileTabParamList } from '../../navigation/types';

// 表单验证模式
const profileSchema = Yup.object().shape({
  name: Yup.string().required('姓名为必填项'),
  email: Yup.string().email('请输入有效的邮箱地址').required('邮箱为必填项'),
  phone: Yup.string().matches(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  address: Yup.string(),
  department: Yup.string(),
  position: Yup.string(),
});

/**
 * 个人资料编辑页面组件
 */
const ProfileEditScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProfileTabParamList>>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // 获取用户信息
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
  });
  
  // 更新用户信息mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => authService.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      Alert.alert('成功', '个人资料已更新');
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('错误', `更新个人资料失败: ${error.message || '未知错误'}`);
    },
  });
  
  // 处理选择头像
  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相册权限来更改头像');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatar(asset.uri);
        // 立即上传，获取线上URL
        const form = new FormData();
        const fileName = (asset as any).fileName || `avatar_${Date.now()}.jpg`;
        const mime = (asset as any).mimeType || 'image/jpeg';
        if (Platform.OS === 'web') {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: mime });
          form.append('avatar', file);
        } else {
          form.append('avatar', {
            uri: asset.uri,
            name: fileName,
            type: mime,
          } as any);
        }
        try {
          const res = await authService.uploadAvatar(form);
          const url = (res as any).avatar_url || (res as any).avatar;
          if (url) setAvatar(url);
        } catch (e: any) {
          Alert.alert('头像上传失败', e.message || '请稍后再试');
        }
      }
    } catch (error) {
      Alert.alert('错误', '选择头像时出错');
    }
  };
  
  // 处理表单提交
  const handleSubmit = (values: any) => {
    // 在实际应用中，这里应该上传头像并获取URL
    const profileData = {
      ...values,
      avatar: avatar || userData?.avatar,
    };
    
    updateProfileMutation.mutate(profileData);
  };
  
  if (isLoading) {
    return <Loading loading={true} message="加载中..." />;
  }
  
  if (error) {
    return (
      <Container safeArea>
        <Header
          title="编辑资料"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>加载个人资料失败</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>返回</Button>
        </View>
      </Container>
    );
  }
  
  return (
    <Container safeArea>
      <Header
        title="编辑资料"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <Formik
        initialValues={{
          name: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          address: userData?.address || '',
          department: userData?.department || '',
          position: userData?.position || '',
        }}
        validationSchema={profileSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            {/* 头像选择 */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handleSelectAvatar}>
                {avatar ? (
                  <Avatar.Image
                    size={100}
                    source={{ uri: avatar }}
                  />
                ) : userData?.avatar ? (
                  <Avatar.Image
                    size={100}
                    source={{ uri: userData.avatar }}
                  />
                ) : (
                  <Avatar.Text
                    size={100}
                    label={values.name ? values.name.substring(0, 2).toUpperCase() : '??'}
                    color={theme.colors.onPrimary}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
                <View style={styles.avatarEditBadge}>
                  <Icon name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>点击更换头像</Text>
            </View>
            
            {/* 基本信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>基本信息</Text>
              
              <TextInput
                label="姓名"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                style={styles.input}
                error={touched.name && !!errors.name}
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
              
              <TextInput
                label="电子邮箱"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                keyboardType="email-address"
                style={styles.input}
                error={touched.email && !!errors.email}
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              
              <TextInput
                label="手机号码"
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                keyboardType="phone-pad"
                style={styles.input}
                error={touched.phone && !!errors.phone}
              />
              {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>
            
            {/* 工作信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>工作信息</Text>
              
              <TextInput
                label="部门"
                value={values.department}
                onChangeText={handleChange('department')}
                onBlur={handleBlur('department')}
                style={styles.input}
              />
              
              <TextInput
                label="职位"
                value={values.position}
                onChangeText={handleChange('position')}
                onBlur={handleBlur('position')}
                style={styles.input}
              />
              
              <TextInput
                label="办公地址"
                value={values.address}
                onChangeText={handleChange('address')}
                onBlur={handleBlur('address')}
                style={styles.input}
              />
            </View>
            
            {/* 提交按钮 */}
            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              style={styles.submitButton}
              loading={updateProfileMutation.isPending}
              disabled={updateProfileMutation.isPending}
            >
              保存修改
            </Button>
          </ScrollView>
        )}
      </Formik>
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.medium,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarHint: {
    marginTop: spacing.small,
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: -spacing.small,
    marginBottom: spacing.small,
    marginLeft: spacing.small,
  },
  submitButton: {
    marginVertical: spacing.large,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
});

export default ProfileEditScreen; 