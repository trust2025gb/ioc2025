/**
 * 订单详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Divider, List, Chip, Menu, Dialog, Portal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { orderService, Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { OrdersTabParamList } from '../../navigation/types';

/**
 * 订单详情页面组件
 */
const OrderDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<OrdersTabParamList>>();
  const route = useRoute<RouteProp<OrdersTabParamList, typeof ROUTES.ORDERS.DETAIL>>();
  const { id, orderNumber } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // 获取订单详情
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', id, orderNumber],
    queryFn: async () => {
      // 先按 id 查，失败再按订单号
      try {
        return await orderService.getOrder(id);
      } catch (e) {
        if (orderNumber) {
          return await orderService.getOrder(orderNumber);
        }
        throw e;
      }
    },
  });

  // 更新订单状态
  const updateOrderStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => 
      orderService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  // 支付订单
  const payOrderMutation = useMutation({
    mutationFn: (paymentMethod: PaymentMethod) => 
      orderService.payOrder(id, { payment_method: paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 显示/隐藏状态对话框
  const toggleStatusDialog = () => {
    setStatusDialogVisible(!statusDialogVisible);
  };

  // 显示/隐藏支付对话框
  const togglePaymentDialog = () => {
    setPaymentDialogVisible(!paymentDialogVisible);
  };

  // 导航到编辑页面
  const navigateToEdit = () => {
    // 编辑页面未实现，暂不跳转
  };

  // 导航到支付页面
  const navigateToPayment = () => {
    navigation.navigate(ROUTES.ORDERS.PAYMENT, { id, amount: order?.amount || 0 });
  };

  // 处理状态更新
  const handleStatusUpdate = (status: OrderStatus) => {
    updateOrderStatusMutation.mutate(status);
    setStatusDialogVisible(false);
  };

  // 处理支付
  const handlePayment = () => {
    if (selectedPaymentMethod) {
      payOrderMutation.mutate(selectedPaymentMethod);
      setPaymentDialogVisible(false);
    }
  };

  // 处理取消订单
  const handleCancelOrder = () => {
    updateOrderStatusMutation.mutate(OrderStatus.CANCELLED);
    toggleMenu();
  };

  // 获取状态标签颜色
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return colors.warning;
      case OrderStatus.PROCESSING:
        return colors.info;
      case OrderStatus.COMPLETED:
        return colors.success;
      case OrderStatus.CANCELLED:
        return colors.error;
      case OrderStatus.REFUNDED:
        return colors.secondary;
      default:
        return colors.grey500;
    }
  };

  // 获取支付状态标签颜色
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return colors.warning;
      case PaymentStatus.PAID:
        return colors.success;
      case PaymentStatus.FAILED:
        return colors.error;
      case PaymentStatus.REFUNDED:
        return colors.secondary;
      default:
        return colors.grey500;
    }
  };

  // 获取状态显示名称
  const getStatusName = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return '待处理';
      case OrderStatus.PROCESSING:
        return '处理中';
      case OrderStatus.COMPLETED:
        return '已完成';
      case OrderStatus.CANCELLED:
        return '已取消';
      case OrderStatus.REFUNDED:
        return '已退款';
      default:
        return '未知';
    }
  };

  // 获取支付状态显示名称
  const getPaymentStatusName = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return '待支付';
      case PaymentStatus.PAID:
        return '已支付';
      case PaymentStatus.FAILED:
        return '支付失败';
      case PaymentStatus.REFUNDED:
        return '已退款';
      default:
        return '未知';
    }
  };

  // 获取支付方式显示名称
  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return '现金';
      case PaymentMethod.BANK_TRANSFER:
        return '银行转账';
      case PaymentMethod.CREDIT_CARD:
        return '信用卡';
      case PaymentMethod.ALIPAY:
        return '支付宝';
      case PaymentMethod.WECHAT:
        return '微信支付';
      default:
        return '未知';
    }
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 如果正在加载
  if (isLoading) {
    return (
      <Container safeArea>
        <Header title="订单详情" showBackButton onBackPress={handleBack} />
        <Loading loading={true} message="加载中..." />
      </Container>
    );
  }

  // 如果加载失败
  if (error || !order) {
    return (
      <Container safeArea>
        <Header title="订单详情" showBackButton onBackPress={handleBack} />
        <EmptyState
          title="加载失败"
          message="无法加载订单详情，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      </Container>
    );
  }

  return (
    <Container
      safeArea
      scrollable
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="订单详情"
        subtitle={`订单 #${(order.order_number ?? String(order.id)).toString().substring(0, 12)}` }
        showBackButton
        onBackPress={handleBack}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      {/* 菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={toggleMenu}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToEdit();
          }}
          title="编辑订单"
          leadingIcon="pencil"
          disabled={order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED}
        />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            toggleStatusDialog();
          }}
          title="更新状态"
          leadingIcon="tag"
        />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            togglePaymentDialog();
          }}
          title="支付订单"
          leadingIcon="credit-card"
          disabled={order.payment_status !== PaymentStatus.PENDING}
        />
        <Divider />
        <Menu.Item
          onPress={handleCancelOrder}
          title="取消订单"
          leadingIcon="cancel"
          disabled={
            order.status === OrderStatus.COMPLETED ||
            order.status === OrderStatus.CANCELLED ||
            order.status === OrderStatus.REFUNDED
          }
        />
      </Menu>

      {/* 状态对话框 */}
      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={toggleStatusDialog}>
          <Dialog.Title>更新订单状态</Dialog.Title>
          <Dialog.Content>
            <View style={styles.statusOptions}>
              {(Object.values(OrderStatus) as any).map((status: any) => (
                <Chip
                  key={status}
                  mode="flat"
                  selected={order.status === status}
                  onPress={() => handleStatusUpdate(status)}
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(status) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {getStatusName(status)}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={toggleStatusDialog}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 支付对话框 */}
      <Portal>
        <Dialog visible={paymentDialogVisible} onDismiss={togglePaymentDialog}>
          <Dialog.Title>选择支付方式</Dialog.Title>
          <Dialog.Content>
            <View style={styles.paymentOptions}>
              {(Object.values(PaymentMethod) as any).map((method: any) => (
                <Chip
                  key={method}
                  mode="outlined"
                  selected={selectedPaymentMethod === method}
                  onPress={() => setSelectedPaymentMethod(method)}
                  style={styles.paymentChip}
                >
                  {getPaymentMethodName(method)}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={togglePaymentDialog}>取消</Button>
            <Button
              onPress={handlePayment}
              disabled={!selectedPaymentMethod || payOrderMutation.isPending}
            >
              确认支付
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 状态信息 */}
        <View style={styles.statusContainer}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(order.status as any) },
            ]}
            textStyle={styles.statusChipText}
          >
            {getStatusName(order.status as any)}
          </Chip>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getPaymentStatusColor(order.payment_status as any) },
            ]}
            textStyle={styles.statusChipText}
          >
            {getPaymentStatusName(order.payment_status as any)}
          </Chip>
        </View>

        {/* 订单金额 */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>订单金额</Text>
          <Text style={styles.amountValue}>{formatAmount((order.amount ?? 0) as number)}</Text>
        </View>

        {/* 产品信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>产品信息</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="产品名称"
            description={order.product?.name || '未知产品'}
            left={(props) => <List.Icon {...props} icon="package-variant-closed" />}
          />
          {order.plan_id && (
            <List.Item
              title="方案ID"
              description={order.plan_id}
              left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            />
          )}
        </View>

        {/* 客户信息 */}
        {order.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>客户信息</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="客户姓名"
              description={order.customer.name}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            {order.customer.email && (
              <List.Item
                title="电子邮箱"
                description={order.customer.email}
                left={(props) => <List.Icon {...props} icon="email" />}
              />
            )}
            {order.customer.phone && (
              <List.Item
                title="联系电话"
                description={order.customer.phone}
                left={(props) => <List.Icon {...props} icon="phone" />}
              />
            )}
          </View>
        )}

        {/* 支付信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支付信息</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="支付状态"
            description={getPaymentStatusName(order.payment_status as any)}
            left={(props) => <List.Icon {...props} icon="cash-multiple" />}
          />
          {order.payment_method && (
            <List.Item
              title="支付方式"
              description={getPaymentMethodName(order.payment_method as any)}
              left={(props) => <List.Icon {...props} icon="credit-card" />}
            />
          )}
          {order.payment_date && (
            <List.Item
              title="支付时间"
              description={new Date(order.payment_date).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="calendar-check" />}
            />
          )}
        </View>

        {/* 时间信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>时间信息</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="创建时间"
            description={new Date(order.created_at).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-plus" />}
          />
          <List.Item
            title="更新时间"
            description={new Date(order.updated_at).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-edit" />}
          />
          {order.completed_at && (
            <List.Item
              title="完成时间"
              description={new Date(order.completed_at).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="calendar-check" />}
            />
          )}
          {order.cancelled_at && (
            <List.Item
              title="取消时间"
              description={new Date(order.cancelled_at).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="calendar-remove" />}
            />
          )}
        </View>

        {/* 备注信息 */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Divider style={styles.divider} />
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          {order.payment_status === PaymentStatus.PENDING && (
            <Button
              mode="contained"
              onPress={togglePaymentDialog}
              style={[styles.actionButton, styles.payButton]}
              icon="credit-card-outline"
              loading={payOrderMutation.isPending}
              disabled={payOrderMutation.isPending}
            >
              支付订单
            </Button>
          )}
          {order.status !== OrderStatus.CANCELLED && 
           order.status !== OrderStatus.COMPLETED && 
           order.status !== OrderStatus.REFUNDED && (
            <Button
              mode="outlined"
              onPress={handleCancelOrder}
              style={styles.actionButton}
              icon="cancel"
              loading={updateOrderStatusMutation.isPending}
              disabled={updateOrderStatusMutation.isPending}
            >
              取消订单
            </Button>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  statusChip: {
    marginRight: spacing.small,
  },
  statusChipText: {
    color: 'white',
  },
  amountContainer: {
    backgroundColor: colors.primary,
    borderRadius: radius.regular,
    padding: spacing.medium,
    marginBottom: spacing.large,
    alignItems: 'center',
  },
  amountLabel: {
    color: colors.grey200,
    fontSize: 14,
    marginBottom: spacing.tiny,
  },
  amountValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  divider: {
    marginVertical: spacing.small,
  },
  notes: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.medium,
    marginBottom: spacing.xlarge,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  },
  payButton: {
    backgroundColor: colors.success,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  paymentChip: {
    margin: spacing.tiny,
  },
});

export default OrderDetailScreen; 