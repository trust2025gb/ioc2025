/**
 * 客户创建页面
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, HelperText, Divider, RadioButton, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header } from '../../components';

// 导入API服务
import { customerService, CustomerStatus, CustomerType } from '../../api/services/customerService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { CustomersStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

// 验证模式
const validationSchema = Yup.object().shape({
  name: Yup.string().required('姓名/公司名为必填项'),
  phone: Yup.string().required('电话为必填项'),
  email: Yup.string().email('请输入有效的邮箱地址'),
  type: Yup.string().required('客户类型为必填项'),
  identification_number: Yup.string(),
  identification_type: Yup.string(),
  annual_income: Yup.number().positive('年收入必须为正数').typeError('请输入有效的数字'),
  occupation: Yup.string(),
  company: Yup.string(),
  address: Yup.string(),
  birth_date: Yup.date().nullable().typeError('请输入有效的日期格式 (YYYY-MM-DD)'),
  notes: Yup.string(),
});

/**
 * 客户创建页面组件
 */
const CustomerCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<any>();
  const prefill: any = route.params?.prefill || {};
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  // 创建客户
  const createCustomerMutation = useMutation({
    mutationFn: (customerData: any) => {
      return customerService.createCustomer(customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigation.navigate(ROUTES.CUSTOMERS.LIST);
    },
    onError: (error: any) => {
      console.error('创建客户失败:', error);
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  // 表单处理
  const formik = useFormik({
    initialValues: {
      name: prefill.name || '',
      phone: prefill.phone || '',
      email: prefill.email || '',
      type: CustomerType.INDIVIDUAL,
      status: CustomerStatus.POTENTIAL,
      identification_number: prefill.identification_number || '',
      identification_type: '',
      annual_income: prefill.annual_income || '',
      occupation: prefill.occupation || '',
      company: prefill.company || '',
      address: prefill.address || '',
      birth_date: prefill.birth_date || '',
      notes: prefill.notes || '',
    },
    validationSchema,
    onSubmit: (values) => {
      setLoading(true);
      
      const customerData = {
        ...values,
        annual_income: values.annual_income ? Number(values.annual_income) : undefined,
      };

      createCustomerMutation.mutate(customerData);
    },
  });

  // 选择头像
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('需要相册权限才能上传头像');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      // 在实际提交时，需要将图像转换为File或Blob并添加到表单数据中
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: CustomerType) => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return 'account';
      case CustomerType.COMPANY:
        return 'domain';
      case CustomerType.FAMILY:
        return 'home-account';
      default:
        return 'account-question';
    }
  };

  return (
    <Container>
      <Header
        title="创建客户"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 头像选择 */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {avatar ? (
                <Avatar.Image size={100} source={{ uri: avatar }} />
              ) : (
                <Avatar.Icon 
                  size={100} 
                  icon={getTypeIcon(formik.values.type as CustomerType)}
                  color={colors.white}
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              <View style={styles.editIconContainer}>
                <Icon name="camera" size={20} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>点击上传头像</Text>
          </View>

          {/* 基本信息 */}
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          {/* 客户类型 */}
          <Text style={styles.inputLabel}>客户类型</Text>
          <RadioButton.Group
            onValueChange={(value) => formik.setFieldValue('type', value)}
            value={formik.values.type}
          >
            <View style={styles.radioGroup}>
              <View style={styles.radioButton}>
                <RadioButton value={CustomerType.INDIVIDUAL} />
                <Text>个人</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton value={CustomerType.COMPANY} />
                <Text>企业</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton value={CustomerType.FAMILY} />
                <Text>家庭</Text>
              </View>
            </View>
          </RadioButton.Group>

          {/* 姓名/公司名 */}
          <TextInput
            label={formik.values.type === CustomerType.COMPANY ? "公司名称" : "姓名"}
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.touched.name && !!formik.errors.name}
            style={styles.input}
          />
          {formik.touched.name && formik.errors.name && (
            <HelperText type="error">{String(formik.errors.name || '')}</HelperText>
          )}
          
          {/* 电话 */}
          <TextInput
            label="电话"
            value={formik.values.phone}
            onChangeText={formik.handleChange('phone')}
            onBlur={formik.handleBlur('phone')}
            error={formik.touched.phone && !!formik.errors.phone}
            keyboardType="phone-pad"
            style={styles.input}
          />
          {formik.touched.phone && formik.errors.phone && (
            <HelperText type="error">{String(formik.errors.phone || '')}</HelperText>
          )}
          
          {/* 邮箱 */}
          <TextInput
            label="邮箱"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            error={formik.touched.email && !!formik.errors.email}
            keyboardType="email-address"
            style={styles.input}
          />
          {formik.touched.email && formik.errors.email && (
            <HelperText type="error">{String(formik.errors.email || '')}</HelperText>
          )}

          {/* 地址 */}
          <TextInput
            label="地址"
            value={formik.values.address}
            onChangeText={formik.handleChange('address')}
            onBlur={formik.handleBlur('address')}
            error={formik.touched.address && !!formik.errors.address}
            style={styles.input}
          />
          {formik.touched.address && formik.errors.address && (
            <HelperText type="error">{String(formik.errors.address || '')}</HelperText>
          )}

          <Divider style={styles.divider} />

          {/* 详细信息 */}
          <Text style={styles.sectionTitle}>详细信息</Text>

          {/* 证件类型 */}
          <TextInput
            label="证件类型"
            value={formik.values.identification_type}
            onChangeText={formik.handleChange('identification_type')}
            onBlur={formik.handleBlur('identification_type')}
            error={formik.touched.identification_type && !!formik.errors.identification_type}
            style={styles.input}
          />
          {formik.touched.identification_type && formik.errors.identification_type && (
            <HelperText type="error">{String(formik.errors.identification_type || '')}</HelperText>
          )}

          {/* 证件号码 */}
          <TextInput
            label="证件号码"
            value={formik.values.identification_number}
            onChangeText={formik.handleChange('identification_number')}
            onBlur={formik.handleBlur('identification_number')}
            error={formik.touched.identification_number && !!formik.errors.identification_number}
            style={styles.input}
          />
          {formik.touched.identification_number && formik.errors.identification_number && (
            <HelperText type="error">{String(formik.errors.identification_number || '')}</HelperText>
          )}

          {formik.values.type === CustomerType.INDIVIDUAL && (
            <>
              {/* 出生日期 */}
              <TextInput
                label="出生日期 (YYYY-MM-DD)"
                value={formik.values.birth_date}
                onChangeText={formik.handleChange('birth_date')}
                onBlur={formik.handleBlur('birth_date')}
                error={formik.touched.birth_date && !!formik.errors.birth_date}
                style={styles.input}
                placeholder="例如：1990-01-01"
              />
              {formik.touched.birth_date && formik.errors.birth_date && (
                <HelperText type="error">{String(formik.errors.birth_date || '')}</HelperText>
              )}

              {/* 职业 */}
              <TextInput
                label="职业"
                value={formik.values.occupation}
                onChangeText={formik.handleChange('occupation')}
                onBlur={formik.handleBlur('occupation')}
                error={formik.touched.occupation && !!formik.errors.occupation}
                style={styles.input}
              />
              {formik.touched.occupation && formik.errors.occupation && (
                <HelperText type="error">{String(formik.errors.occupation || '')}</HelperText>
              )}
            </>
          )}

          {/* 年收入 */}
          <TextInput
            label="年收入"
            value={formik.values.annual_income}
            onChangeText={formik.handleChange('annual_income')}
            onBlur={formik.handleBlur('annual_income')}
            error={formik.touched.annual_income && !!formik.errors.annual_income}
            keyboardType="numeric"
            style={styles.input}
          />
          {formik.touched.annual_income && formik.errors.annual_income && (
            <HelperText type="error">{String(formik.errors.annual_income || '')}</HelperText>
          )}

          {formik.values.type !== CustomerType.COMPANY && (
            <>
              {/* 公司 */}
              <TextInput
                label="公司"
                value={formik.values.company}
                onChangeText={formik.handleChange('company')}
                onBlur={formik.handleBlur('company')}
                error={formik.touched.company && !!formik.errors.company}
                style={styles.input}
              />
              {formik.touched.company && formik.errors.company && (
                <HelperText type="error">{String(formik.errors.company || '')}</HelperText>
              )}
            </>
          )}

          <Divider style={styles.divider} />

          {/* 备注 */}
          <Text style={styles.sectionTitle}>备注</Text>
          <TextInput
            label="备注信息"
            value={formik.values.notes}
            onChangeText={formik.handleChange('notes')}
            onBlur={formik.handleBlur('notes')}
            error={formik.touched.notes && !!formik.errors.notes}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          {formik.touched.notes && formik.errors.notes && (
            <HelperText type="error">{String(formik.errors.notes || '')}</HelperText>
          )}

          {/* 提交按钮 */}
          <Button
            mode="contained"
            onPress={() => formik.handleSubmit()}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            创建客户
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.small,
    color: colors.primary,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: spacing.tiny,
    color: colors.grey700,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.grey100,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  submitButton: {
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.medium,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    marginTop: spacing.small,
    color: colors.grey700,
  },
});

export default CustomerCreateScreen; 