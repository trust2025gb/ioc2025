/**
 * 理赔支付页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { 
  Text, Button, Card, TextInput, RadioButton, HelperText,
  Banner, Divider, Checkbox, Portal, Dialog, ActivityIndicator
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, ClaimPaymentMethod, Claim } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔支付页面组件
 */
const ClaimPaymentScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.PAYMENT>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [isConfirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [paymentFormValues, setPaymentFormValues] = useState<{
    payment_method: ClaimPaymentMethod;
    payment_details: string;
    amount: number;
  } | null>(null);
  
  // 获取理赔详情
  const {
    data: claim,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimService.getClaim(id),
  });

  // 申请理赔支付
  const requestPaymentMutation = useMutation({
    mutationFn: ({
      payment_method,
      payment_details,
      amount,
    }: {
      payment_method: ClaimPaymentMethod;
      payment_details: string;
      amount: number;
    }) => {
      return claimService.requestClaimPayment(
        id,
        payment_method,
        payment_details,
        amount
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      queryClient.invalidateQueries({ queryKey: ['claim-detail', id] });
      
      Alert.alert(
        '申请成功',
        '您的赔付申请已提交，工作人员将尽快处理',
        [
          {
            text: '返回详情',
            onPress: () => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id }),
          },
        ]
      );
    },
    onError: (error) => {
      console.error('申请理赔支付失败:', error);
      Alert.alert('错误', '申请理赔支付失败，请重试', [{ text: '确定' }]);
      setConfirmDialogVisible(false);
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示确认对话框
  const showConfirmDialog = (values: any) => {
    setPaymentFormValues(values);
    setConfirmDialogVisible(true);
  };

  // 隐藏确认对话框
  const hideConfirmDialog = () => {
    setConfirmDialogVisible(false);
  };

  // 确认提交支付申请
  const confirmPaymentRequest = () => {
    if (paymentFormValues) {
      requestPaymentMutation.mutate(paymentFormValues);
    }
  };

  // 获取支付方式名称
  const getPaymentMethodName = (method: ClaimPaymentMethod) => {
    switch (method) {
      case ClaimPaymentMethod.BANK_TRANSFER:
        return '银行转账';
      case ClaimPaymentMethod.CHECK:
        return '支票';
      case ClaimPaymentMethod.DIGITAL_WALLET:
        return '数字钱包';
      case ClaimPaymentMethod.CREDIT_TO_ACCOUNT:
        return '账户贷记';
      case ClaimPaymentMethod.CASH:
        return '现金';
      case ClaimPaymentMethod.OTHER:
        return '其他';
      default:
        return '未知';
    }
  };

  // 获取支付方式图标
  const getPaymentMethodIcon = (method: ClaimPaymentMethod) => {
    switch (method) {
      case ClaimPaymentMethod.BANK_TRANSFER:
        return 'bank';
      case ClaimPaymentMethod.CHECK:
        return 'file-document-outline';
      case ClaimPaymentMethod.DIGITAL_WALLET:
        return 'wallet';
      case ClaimPaymentMethod.CREDIT_TO_ACCOUNT:
        return 'credit-card';
      case ClaimPaymentMethod.CASH:
        return 'cash';
      case ClaimPaymentMethod.OTHER:
        return 'dots-horizontal';
      default:
        return 'help-circle';
    }
  };

  // 格式化货币
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '¥0.00';
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 支付表单验证模式
  const validationSchema = Yup.object().shape({
    payment_method: Yup.string().required('请选择支付方式'),
    payment_details: Yup.string().required('请填写支付信息'),
    amount: Yup.number()
      .required('请填写支付金额')
      .positive('金额必须大于0')
      .test(
        'amount-check',
        '金额不能超过批准金额',
        function(value) {
          if (!claim || !claim.approved_amount) return true;
          return value <= claim.approved_amount;
        }
      ),
    agree_terms: Yup.boolean()
      .oneOf([true], '请阅读并同意赔付条款')
      .required('请阅读并同意赔付条款'),
  });

  // 渲染支付表单
  const renderPaymentForm = () => {
    if (!claim) return null;

    // 检查是否可以申请支付
    const canRequestPayment = claim.approved_amount && claim.approved_amount > 0;
    if (!canRequestPayment) {
      return (
        <EmptyState
          title="无法申请赔付"
          message="该理赔尚未获得批准或批准金额为零"
          icon="cash-remove"
          buttonText="返回详情"
          onButtonPress={() => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id })}
        />
      );
    }

    // 检查是否已赔付
    if (claim.paid_amount && claim.approved_amount && claim.paid_amount >= claim.approved_amount) {
      return (
        <Card style={styles.completeCard}>
          <Card.Content>
            <View style={styles.completeContent}>
              <Icon name="check-circle" size={48} color={colors.success} />
              <Text style={styles.completeTitle}>理赔已完成赔付</Text>
              <Text style={styles.completeAmount}>{formatCurrency(claim.paid_amount)}</Text>
              <Text style={styles.completeDescription}>
                该理赔已完成全部赔付，无需再次申请
              </Text>
            </View>
          </Card.Content>
          <Card.Actions style={styles.completeActions}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id })}
            >
              返回详情
            </Button>
          </Card.Actions>
        </Card>
      );
    }

    // 计算剩余可申请金额
    const remainingAmount = (claim.approved_amount || 0) - (claim.paid_amount || 0);

    return (
      <Formik
        initialValues={{
          payment_method: ClaimPaymentMethod.BANK_TRANSFER,
          payment_details: '',
          amount: remainingAmount,
          agree_terms: false,
        }}
        validationSchema={validationSchema}
        onSubmit={showConfirmDialog}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Card style={styles.amountInfoCard}>
              <Card.Content>
                <Text style={styles.amountInfoTitle}>赔付金额信息</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>批准金额</Text>
                  <Text style={styles.approvedAmount}>
                    {formatCurrency(claim.approved_amount)}
                  </Text>
                </View>
                
                {claim.paid_amount ? (
                  <>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>已赔付金额</Text>
                      <Text style={styles.paidAmount}>
                        {formatCurrency(claim.paid_amount)}
                      </Text>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>剩余可申请金额</Text>
                      <Text style={styles.remainingAmount}>
                        {formatCurrency(remainingAmount)}
                      </Text>
                    </View>
                  </>
                ) : null}
              </Card.Content>
            </Card>

            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.formTitle}>支付方式</Text>
                <RadioButton.Group
                  onValueChange={(value) => setFieldValue('payment_method', value)}
                  value={values.payment_method}
                >
                  <View style={styles.paymentMethodContainer}>
                    {Object.values(ClaimPaymentMethod).map((method) => (
                      <View key={method} style={styles.paymentMethodItem}>
                        <RadioButton.Item
                          label={getPaymentMethodName(method)}
                          value={method}
                          style={styles.radioItem}
                          labelStyle={styles.radioLabel}
                          position="leading"
                          uncheckedColor={colors.grey400}
                          status={values.payment_method === method ? 'checked' : 'unchecked'}
                        />
                        <Icon
                          name={getPaymentMethodIcon(method)}
                          size={24}
                          color={values.payment_method === method ? colors.primary : colors.grey600}
                          style={styles.paymentMethodIcon}
                        />
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>

                <TextInput
                  label="支付信息详情 *"
                  value={values.payment_details}
                  onChangeText={handleChange('payment_details')}
                  onBlur={handleBlur('payment_details')}
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  error={!!errors.payment_details && touched.payment_details}
                  placeholder={
                    values.payment_method === ClaimPaymentMethod.BANK_TRANSFER
                      ? '请输入银行账号、开户行、账户名称等信息'
                      : values.payment_method === ClaimPaymentMethod.DIGITAL_WALLET
                      ? '请输入支付宝/微信账号等信息'
                      : '请输入相关支付信息'
                  }
                />
                {errors.payment_details && touched.payment_details && (
                  <HelperText type="error">{errors.payment_details}</HelperText>
                )}

                <TextInput
                  label="申请金额 *"
                  value={values.amount.toString()}
                  onChangeText={(text) => {
                    const numValue = text === '' ? 0 : parseFloat(text);
                    setFieldValue('amount', numValue);
                  }}
                  onBlur={handleBlur('amount')}
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.amount && touched.amount}
                  left={<TextInput.Icon icon="currency-cny" />}
                />
                {errors.amount && touched.amount && (
                  <HelperText type="error">{errors.amount}</HelperText>
                )}

                <View style={styles.checkboxContainer}>
                  <Checkbox.Item
                    label="我确认所提供的信息准确无误，并同意赔付条款"
                    status={values.agree_terms ? 'checked' : 'unchecked'}
                    onPress={() => setFieldValue('agree_terms', !values.agree_terms)}
                    style={styles.checkbox}
                    labelStyle={styles.checkboxLabel}
                    position="leading"
                  />
                </View>
                {errors.agree_terms && touched.agree_terms && (
                  <HelperText type="error">{errors.agree_terms}</HelperText>
                )}
              </Card.Content>
            </Card>

            <Banner
              visible={true}
              icon={({ size }) => (
                <Icon
                  name="information"
                  size={size}
                  color={colors.info}
                />
              )}
              style={styles.banner}
            >
              赔付申请提交后，将由工作人员进行审核，请耐心等待。赔付到账时间通常为3-5个工作日。
            </Banner>

            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              style={styles.submitButton}
              disabled={requestPaymentMutation.isPending}
            >
              提交赔付申请
            </Button>
          </View>
        )}
      </Formik>
    );
  };

  if (isLoading) {
    return <Loading loading={true} message="加载理赔信息..." />;
  }

  if (error || !claim) {
    return (
      <EmptyState
        title="加载失败"
        message="无法加载理赔数据，请稍后重试"
        icon="alert-circle"
        buttonText="重试"
        onButtonPress={refetch}
      />
    );
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="申请理赔赔付"
        showBackButton={true}
        onBackPress={handleBack}
      />

      <ScrollView style={styles.scrollContent}>
        {renderPaymentForm()}
      </ScrollView>

      <Portal>
        <Dialog visible={isConfirmDialogVisible} onDismiss={hideConfirmDialog}>
          <Dialog.Title>确认赔付申请</Dialog.Title>
          <Dialog.Content>
            {paymentFormValues && (
              <>
                <Text>您即将提交以下赔付申请:</Text>
                <View style={styles.confirmItem}>
                  <Text style={styles.confirmLabel}>申请金额:</Text>
                  <Text style={styles.confirmValue}>
                    {formatCurrency(paymentFormValues.amount)}
                  </Text>
                </View>
                <View style={styles.confirmItem}>
                  <Text style={styles.confirmLabel}>支付方式:</Text>
                  <Text style={styles.confirmValue}>
                    {getPaymentMethodName(paymentFormValues.payment_method)}
                  </Text>
                </View>
                <Text style={styles.confirmDetails}>
                  支付详情: {paymentFormValues.payment_details}
                </Text>
              </>
            )}
            <Text style={styles.confirmNote}>
              提交后将无法更改支付信息，请确认无误
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideConfirmDialog}>取消</Button>
            <Button
              onPress={confirmPaymentRequest}
              loading={requestPaymentMutation.isPending}
              disabled={requestPaymentMutation.isPending}
            >
              确认提交
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  amountInfoCard: {
    marginBottom: spacing.medium,
  },
  amountInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  amountLabel: {
    color: colors.textSecondary,
  },
  approvedAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.success,
  },
  paidAmount: {
    color: colors.primary,
  },
  remainingAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.warning,
  },
  formCard: {
    marginBottom: spacing.medium,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  paymentMethodContainer: {
    marginBottom: spacing.medium,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioItem: {
    flex: 1,
    paddingLeft: 0,
  },
  radioLabel: {
    fontSize: 14,
  },
  paymentMethodIcon: {
    marginRight: spacing.medium,
  },
  input: {
    marginBottom: spacing.medium,
    backgroundColor: colors.grey100,
  },
  checkboxContainer: {
    marginBottom: spacing.small,
  },
  checkbox: {
    paddingLeft: 0,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  banner: {
    marginBottom: spacing.medium,
  },
  submitButton: {
    marginBottom: spacing.large,
  },
  divider: {
    marginVertical: spacing.small,
  },
  confirmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.small,
  },
  confirmLabel: {
    color: colors.textSecondary,
  },
  confirmValue: {
    fontWeight: 'bold',
  },
  confirmDetails: {
    marginTop: spacing.small,
    marginBottom: spacing.medium,
  },
  confirmNote: {
    fontStyle: 'italic',
    color: colors.warning,
    marginTop: spacing.medium,
  },
  completeCard: {
    margin: spacing.medium,
  },
  completeContent: {
    alignItems: 'center',
    padding: spacing.medium,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  completeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.medium,
  },
  completeDescription: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  completeActions: {
    justifyContent: 'center',
    marginTop: spacing.small,
  },
});

export default ClaimPaymentScreen; 