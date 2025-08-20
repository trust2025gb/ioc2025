/**
 * 理赔申请页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { 
  Text, Button, Card, TextInput, Divider, RadioButton, 
  Switch, Chip, ActivityIndicator, HelperText, Checkbox
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// 导入组件
import { Container, Header } from '../../components';

// 导入API服务
import { claimService, ClaimType, ClaimCreateRequest } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔申请页面组件
 */
const ClaimCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.CREATE>>();
  const queryClient = useQueryClient();
  
  const { customerId, policyId } = route.params || {};
  
  // 日期选择状态
  const [isIncidentDatePickerVisible, setIncidentDatePickerVisible] = useState(false);
  
  // 创建理赔表单验证模式
  const validationSchema = Yup.object().shape({
    title: Yup.string().required('标题为必填项'),
    type: Yup.string().required('类型为必填项'),
    customer_id: Yup.string().required('客户ID为必填项'),
    incident_date: Yup.date().required('事故日期为必填项').max(new Date(), '事故日期不能超过当前日期'),
    description: Yup.string().required('描述为必填项'),
    claim_amount: Yup.number().positive('金额必须大于0').nullable(),
  });
  
  // 创建理赔
  const createClaimMutation = useMutation({
    mutationFn: (claimData: ClaimCreateRequest) => claimService.createClaim(claimData),
    onSuccess: (data) => {
      // 刷新理赔列表
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      
      // 导航到理赔详情页面
      navigation.replace(ROUTES.CLAIMS.DETAIL, { id: data.id });
      
      // 显示成功提示
      Alert.alert('成功', '理赔申请已创建', [{ text: '确定' }]);
    },
    onError: (error) => {
      console.error('创建理赔失败:', error);
      Alert.alert('失败', '创建理赔申请失败，请重试', [{ text: '确定' }]);
    },
  });
  
  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };
  
  // 处理提交
  const handleSubmit = (values: ClaimCreateRequest) => {
    createClaimMutation.mutate(values);
  };
  
  // 获取理赔类型选项
  const getClaimTypeOptions = () => {
    return Object.values(ClaimType).map((type) => ({
      value: type,
      label: getTypeName(type),
      icon: getTypeIcon(type),
    }));
  };
  
  // 获取理赔类型名称
  const getTypeName = (type: ClaimType) => {
    switch (type) {
      case ClaimType.MEDICAL:
        return '医疗理赔';
      case ClaimType.PROPERTY:
        return '财产理赔';
      case ClaimType.AUTO:
        return '车辆理赔';
      case ClaimType.LIFE:
        return '人寿理赔';
      case ClaimType.LIABILITY:
        return '责任理赔';
      case ClaimType.BUSINESS:
        return '商业理赔';
      case ClaimType.TRAVEL:
        return '旅行理赔';
      case ClaimType.OTHER:
        return '其他';
      default:
        return '未知';
    }
  };
  
  // 获取理赔类型图标
  const getTypeIcon = (type: ClaimType) => {
    switch (type) {
      case ClaimType.MEDICAL:
        return 'medical-bag';
      case ClaimType.PROPERTY:
        return 'home';
      case ClaimType.AUTO:
        return 'car';
      case ClaimType.LIFE:
        return 'heart-pulse';
      case ClaimType.LIABILITY:
        return 'gavel';
      case ClaimType.BUSINESS:
        return 'office-building';
      case ClaimType.TRAVEL:
        return 'airplane';
      case ClaimType.OTHER:
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };
  
  // 格式化日期
  const formatDate = (date?: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };
  
  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="申请理赔"
        showBackButton={true}
        onBackPress={handleBack}
      />
      
      <Formik
        initialValues={{
          title: '',
          type: ClaimType.OTHER,
          customer_id: customerId || '',
          policy_id: policyId || '',
          incident_date: new Date().toISOString(),
          description: '',
          claim_amount: undefined,
          currency: 'CNY',
          location: '',
          contact_phone: '',
          contact_email: '',
          is_emergency: false,
          handler_notes: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.formContainer}>
              <Card style={styles.formCard}>
                <Card.Title title="基本信息" />
                <Card.Content>
                  <TextInput
                    label="理赔标题 *"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    style={styles.input}
                    error={!!errors.title && touched.title}
                  />
                  {errors.title && touched.title && (
                    <HelperText type="error">{errors.title}</HelperText>
                  )}
                  
                  <TextInput
                    label="客户ID *"
                    value={values.customer_id}
                    onChangeText={handleChange('customer_id')}
                    onBlur={handleBlur('customer_id')}
                    style={styles.input}
                    disabled={!!customerId}
                    error={!!errors.customer_id && touched.customer_id}
                  />
                  {errors.customer_id && touched.customer_id && (
                    <HelperText type="error">{errors.customer_id}</HelperText>
                  )}
                  
                  <TextInput
                    label="保单ID (可选)"
                    value={values.policy_id}
                    onChangeText={handleChange('policy_id')}
                    onBlur={handleBlur('policy_id')}
                    style={styles.input}
                    disabled={!!policyId}
                  />
                  
                  <Text style={styles.inputLabel}>理赔类型 *</Text>
                  <RadioButton.Group
                    onValueChange={(value) => setFieldValue('type', value)}
                    value={values.type}
                  >
                    <View style={styles.typeContainer}>
                      {getClaimTypeOptions().map((option) => (
                        <View key={option.value} style={styles.typeOption}>
                          <RadioButton.Item
                            label={option.label}
                            value={option.value}
                            style={styles.radioItem}
                            labelStyle={styles.radioLabel}
                            position="leading"
                            uncheckedColor={colors.grey400}
                          />
                          <Icon
                            name={option.icon}
                            size={20}
                            color={values.type === option.value ? colors.primary : colors.grey600}
                            style={styles.typeIcon}
                          />
                        </View>
                      ))}
                    </View>
                  </RadioButton.Group>
                  {errors.type && touched.type && (
                    <HelperText type="error">{errors.type}</HelperText>
                  )}
                </Card.Content>
              </Card>
              
              <Card style={styles.formCard}>
                <Card.Title title="事故信息" />
                <Card.Content>
                  <View style={styles.datePickerContainer}>
                    <Text style={styles.inputLabel}>事故日期 *</Text>
                    <Button
                      mode="outlined"
                      icon="calendar"
                      onPress={() => setIncidentDatePickerVisible(true)}
                      style={styles.dateButton}
                      labelStyle={errors.incident_date && touched.incident_date ? styles.dateButtonErrorText : {}}
                    >
                      {formatDate(new Date(values.incident_date))}
                    </Button>
                    <DateTimePickerModal
                      isVisible={isIncidentDatePickerVisible}
                      mode="date"
                      onConfirm={(date) => {
                        setFieldValue('incident_date', date.toISOString());
                        setIncidentDatePickerVisible(false);
                      }}
                      onCancel={() => setIncidentDatePickerVisible(false)}
                      maximumDate={new Date()}
                    />
                  </View>
                  {errors.incident_date && touched.incident_date && (
                    <HelperText type="error">{errors.incident_date}</HelperText>
                  )}
                  
                  <TextInput
                    label="事故地点 (可选)"
                    value={values.location}
                    onChangeText={handleChange('location')}
                    style={styles.input}
                  />
                  
                  <TextInput
                    label="理赔描述 *"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    style={styles.input}
                    multiline
                    numberOfLines={4}
                    error={!!errors.description && touched.description}
                  />
                  {errors.description && touched.description && (
                    <HelperText type="error">{errors.description}</HelperText>
                  )}
                </Card.Content>
              </Card>
              
              <Card style={styles.formCard}>
                <Card.Title title="理赔金额" />
                <Card.Content>
                  <View style={styles.amountContainer}>
                    <TextInput
                      label="申请金额 (可选)"
                      value={typeof values.claim_amount === 'number' ? String(values.claim_amount) : ''}
                      onChangeText={(text) => {
                        const numValue = text === '' ? undefined : parseFloat(text);
                        setFieldValue('claim_amount', numValue);
                      }}
                      keyboardType="numeric"
                      style={styles.amountInput}
                      error={!!errors.claim_amount && touched.claim_amount}
                      left={<TextInput.Icon icon="currency-cny" />}
                    />
                    <View style={styles.currencyContainer}>
                      <Text style={styles.inputLabel}>货币</Text>
                      <Chip 
                        selected 
                        selectedColor={colors.primary}
                        style={styles.currencyChip}
                      >
                        {values.currency}
                      </Chip>
                    </View>
                  </View>
                  {errors.claim_amount && touched.claim_amount && (
                    <HelperText type="error">{errors.claim_amount}</HelperText>
                  )}
                </Card.Content>
              </Card>
              
              <Card style={styles.formCard}>
                <Card.Title title="联系信息" />
                <Card.Content>
                  <TextInput
                    label="联系电话 (可选)"
                    value={values.contact_phone}
                    onChangeText={handleChange('contact_phone')}
                    style={styles.input}
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon="phone" />}
                  />
                  
                  <TextInput
                    label="联系邮箱 (可选)"
                    value={values.contact_email}
                    onChangeText={handleChange('contact_email')}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email" />}
                  />
                </Card.Content>
              </Card>
              
              <Card style={styles.formCard}>
                <Card.Title title="其他信息" />
                <Card.Content>
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>紧急理赔</Text>
                    <Switch
                      onValueChange={(value) => { setFieldValue('is_emergency', value); }}
                      value={values.is_emergency}
                      color={colors.error}
                    />
                  </View>
                  {values.is_emergency && (
                    <Text style={styles.emergencyNote}>
                      紧急理赔将优先处理，但请确保您的理赔情况确实紧急
                    </Text>
                  )}
                  
                  <TextInput
                    label="其他备注 (可选)"
                    value={values.handler_notes}
                    onChangeText={handleChange('handler_notes')}
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                  />
                </Card.Content>
              </Card>
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  提交理赔表示您同意我们的理赔处理条款，您提供的所有信息必须真实有效。
                </Text>
              </View>
              
              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                style={styles.submitButton}
                disabled={createClaimMutation.isPending}
                loading={createClaimMutation.isPending}
              >
                提交理赔申请
              </Button>
            </View>
          </ScrollView>
        )}
      </Formik>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  formContainer: {
    padding: spacing.medium,
  },
  formCard: {
    marginBottom: spacing.medium,
  },
  input: {
    marginBottom: spacing.medium,
    backgroundColor: colors.grey100,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  typeContainer: {
    marginBottom: spacing.medium,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioItem: {
    paddingLeft: 0,
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
  },
  typeIcon: {
    marginRight: spacing.small,
  },
  datePickerContainer: {
    marginBottom: spacing.medium,
  },
  dateButton: {
    marginTop: spacing.tiny,
  },
  dateButtonErrorText: {
    color: colors.error,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.medium,
  },
  amountInput: {
    flex: 2,
    marginRight: spacing.medium,
    backgroundColor: colors.grey100,
  },
  currencyContainer: {
    flex: 1,
  },
  currencyChip: {
    marginTop: spacing.tiny,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  switchLabel: {
    fontSize: 16,
  },
  emergencyNote: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.medium,
    fontStyle: 'italic',
  },
  termsContainer: {
    marginBottom: spacing.medium,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: spacing.large,
  },
});

export default ClaimCreateScreen; 