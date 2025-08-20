/**
 * 订单创建页面
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, TextInput, HelperText, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 导入组件
import { Container, Header } from '../../components';

// 导入服务
import { orderService, CreateOrderRequest, PaymentMethod } from '../../api/services/orderService';
import { productService } from '../../api/services/productService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { OrdersStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

// 验证模式
const validationSchema = Yup.object().shape({
  productId: Yup.string().required('请选择产品'),
  customerId: Yup.string().required('请选择客户'),
  amount: Yup.number().required('请输入金额').positive('金额必须为正数'),
  paymentMethod: Yup.string().required('请选择支付方式'),
  notes: Yup.string(),
});

/**
 * 订单创建页面组件
 */
const OrderCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<OrdersStackParamList>>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // 获取产品列表
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  });

  // 获取客户列表 - 模拟数据
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => Promise.resolve([
      { id: '1', name: '张三', phone: '13800138000' },
      { id: '2', name: '李四', phone: '13900139000' },
      { id: '3', name: '王五', phone: '13700137000' },
    ]),
  });

  // 创建订单
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderService.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('成功', '订单创建成功');
      navigation.navigate(ROUTES.ORDERS.LIST);
    },
    onError: (error: any) => {
      Alert.alert('错误', error.message || '创建订单失败');
    },
  });

  // 表单处理
  const formik = useFormik({
    initialValues: {
      productId: '',
      customerId: '',
      amount: '',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      setLoading(true);
      createOrderMutation.mutate({
        product_id: values.productId,
        customer_id: values.customerId,
        amount: parseFloat(values.amount),
        payment_method: values.paymentMethod as PaymentMethod,
        notes: values.notes,
      });
    },
  });

  return (
    <Container>
      <Header
        title="创建订单"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          
          {/* 产品选择 */}
          <TextInput
            label="产品"
            value={formik.values.productId}
            onChangeText={formik.handleChange('productId')}
            onBlur={formik.handleBlur('productId')}
            error={formik.touched.productId && !!formik.errors.productId}
            style={styles.input}
            disabled={isLoadingProducts}
          />
          {formik.touched.productId && formik.errors.productId && (
            <HelperText type="error">{String(formik.errors.productId || '')}</HelperText>
          )}
          
          {/* 客户选择 */}
          <TextInput
            label="客户"
            value={formik.values.customerId}
            onChangeText={formik.handleChange('customerId')}
            onBlur={formik.handleBlur('customerId')}
            error={formik.touched.customerId && !!formik.errors.customerId}
            style={styles.input}
            disabled={isLoadingCustomers}
          />
          {formik.touched.customerId && formik.errors.customerId && (
            <HelperText type="error">{String(formik.errors.customerId || '')}</HelperText>
          )}
          
          {/* 金额 */}
          <TextInput
            label="金额"
            value={formik.values.amount}
            onChangeText={formik.handleChange('amount')}
            onBlur={formik.handleBlur('amount')}
            error={formik.touched.amount && !!formik.errors.amount}
            style={styles.input}
            keyboardType="numeric"
          />
          {formik.touched.amount && formik.errors.amount && (
            <HelperText type="error">{String(formik.errors.amount || '')}</HelperText>
          )}
          
          {/* 支付方式 */}
          <TextInput
            label="支付方式"
            value={formik.values.paymentMethod}
            onChangeText={formik.handleChange('paymentMethod')}
            onBlur={formik.handleBlur('paymentMethod')}
            error={formik.touched.paymentMethod && !!formik.errors.paymentMethod}
            style={styles.input}
          />
          {formik.touched.paymentMethod && formik.errors.paymentMethod && (
            <HelperText type="error">{String(formik.errors.paymentMethod || '')}</HelperText>
          )}
          
          <Divider style={styles.divider} />
          
          {/* 备注 */}
          <TextInput
            label="备注"
            value={formik.values.notes}
            onChangeText={formik.handleChange('notes')}
            onBlur={formik.handleBlur('notes')}
            error={formik.touched.notes && !!formik.errors.notes}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          {formik.touched.notes && formik.errors.notes && (
            <HelperText type="error">{String(formik.errors.notes || '')}</HelperText>
          )}
          
          {/* 提交按钮 */}
          <Button
            mode="contained"
            onPress={() => formik.handleSubmit()}
            style={styles.submitButton}
            loading={loading || createOrderMutation.isPending}
            disabled={loading || createOrderMutation.isPending}
          >
            创建订单
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
    marginBottom: spacing.medium,
    color: colors.textPrimary,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.surface,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  submitButton: {
    marginTop: spacing.large,
    paddingVertical: 6,
  },
});

export default OrderCreateScreen; 