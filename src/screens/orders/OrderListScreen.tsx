/**
 * 订单列表页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, FAB, Menu, Divider, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Card, Loading, EmptyState } from '../../components';

// 导入API服务
import { orderService, Order, OrderStatus, PaymentStatus } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { OrdersTabParamList } from '../../navigation/types';

/**
 * 订单列表页面组件
 */
const OrderListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<OrdersTabParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // 获取订单列表
  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', selectedStatus, searchQuery],
    queryFn: () => orderService.getOrders({
      status: selectedStatus || undefined,
      search: searchQuery || undefined,
      page: page,
      per_page: perPage,
    }),
  });

  // 分页状态
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const totalPages = ordersResponse?.pagination?.totalPages ?? 1;

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // 处理状态选择
  const handleStatusSelect = (status: OrderStatus) => {
    setSelectedStatus(status === selectedStatus ? null : status);
  };

  // 导航到订单详情页面
  const navigateToOrderDetail = (orderId: string, orderNumber?: string) => {
    navigation.navigate(ROUTES.ORDERS.DETAIL, { id: orderId, orderNumber });
  };

  // 导航到订单创建页面
  const navigateToCreateOrder = () => {
    navigation.navigate(ROUTES.ORDERS.CREATE as any);
  };

  // 导航到订单历史页面
  const navigateToOrderHistory = () => {
    navigation.navigate(ROUTES.ORDERS.LIST);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
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

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 渲染订单项
  const renderOrderItem = ({ item }: { item: Order }) => (
    <Card
      title={item.order_number ? String(item.order_number) : `订单 #${String(item.id)}`}
      subtitle={`${item.customer?.name ?? item.user?.name ?? '未知客户'} · ${item.product?.name ?? '未知产品'}`}
      type="outlined"
      onPress={() => navigateToOrderDetail(String(item.id), item.order_number ? String(item.order_number) : undefined)}
      style={styles.orderCard}
    >
      <View style={styles.orderContent}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderAmount}>{formatAmount(item.amount ?? (item as any).total ?? 0)}</Text>
          <View style={styles.orderStatusContainer}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status as any) }]}
              textStyle={styles.statusChipText}
            >
              {getStatusName(item.status as any)}
            </Chip>
            <Chip
              style={[styles.statusChip, { backgroundColor: getPaymentStatusColor(item.payment_status as any) }]}
              textStyle={styles.statusChipText}
            >
              {getPaymentStatusName(item.payment_status as any)}
            </Chip>
          </View>
        </View>
        <Text style={styles.orderDate}>
          <Icon name="calendar" size={14} color={colors.grey600} /> 创建: {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </Card>
  );

  // 渲染状态筛选器
  const renderStatusFilters = () => (
    <View style={styles.statusFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(Object.values(OrderStatus) as any).map((status: any) => (
          <Chip
            key={status}
            mode="outlined"
            selected={selectedStatus === status}
            onPress={() => handleStatusSelect(status)}
            style={styles.statusFilterChip}
            selectedColor={getStatusColor(status)}
          >
            {getStatusName(status)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Container
      safeArea
      scrollable={false}
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="订单列表"
        showBackButton={false}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      <View style={styles.container}>
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
              navigateToOrderHistory();
            }}
            title="订单历史"
            leadingIcon="history"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              toggleMenu();
              refetch();
            }}
            title="刷新列表"
            leadingIcon="refresh"
          />
        </Menu>

        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索订单"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 状态筛选器 */}
        {renderStatusFilters()}

        {/* 订单列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载订单数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : ordersResponse && ordersResponse.data.length > 0 ? (
          <>
            {/* 订单列表 */}
            <FlatList
              data={ordersResponse?.data || []}
              renderItem={renderOrderItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.ordersList}
              style={styles.ordersFlatList}
              showsVerticalScrollIndicator={false}
              onRefresh={refetch}
              refreshing={isLoading}
              ListFooterComponent={
                <View style={styles.paginationBar}>
                  <Text style={styles.totalText}>共 {ordersResponse?.pagination?.total ?? 0} 条</Text>
                  <View style={styles.pageControls}>
                    <TouchableOpacity onPress={handlePrev} disabled={page <= 1} style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}>
                      <Text style={styles.pageButtonText}>上一页</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>第 {page} / {totalPages} 页</Text>
                    <TouchableOpacity onPress={handleNext} disabled={page >= totalPages} style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}>
                      <Text style={styles.pageButtonText}>下一页</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.perPageGroup}>
                    {[10,15,20,50].map(n => (
                      <TouchableOpacity key={n} onPress={() => { setPerPage(n); setPage(1); }} style={[styles.perPageBtn, perPage===n && styles.perPageBtnActive]}>
                        <Text style={[styles.perPageText, perPage===n && styles.perPageTextActive]}>{n}/页</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              }
            />

            {/* 悬浮按钮：创建订单 */}
            <TouchableOpacity style={styles.fab} onPress={navigateToCreateOrder}>
              <Icon name="plus" size={24} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <EmptyState
            title="暂无订单"
            message="没有找到符合条件的订单"
            icon="file-document-outline"
            buttonText="创建订单"
            onButtonPress={navigateToCreateOrder}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },
  searchBar: {
    marginVertical: spacing.small,
    elevation: 0,
    backgroundColor: colors.grey100,
  },
  statusFiltersContainer: {
    marginBottom: spacing.small,
  },
  statusFilterChip: {
    marginRight: spacing.small,
  },
  ordersList: {
    paddingVertical: spacing.small,
  },
  orderCard: {
    marginBottom: spacing.medium,
  },
  orderContent: {
    marginTop: spacing.small,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderStatusContainer: {
    flexDirection: 'row',
  },
  statusChip: {
    height: 24,
    marginLeft: spacing.tiny,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  orderCustomer: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.large,
    right: spacing.large,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  ordersFlatList: {
    flex: 1,
  },
  paginationBar: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    gap: spacing.small,
  },
  pageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: radius.large,
  },
  pageButtonDisabled: {
    backgroundColor: colors.grey300,
  },
  pageButtonText: {
    color: 'white',
  },
  pageInfo: {
    color: colors.textSecondary,
  },
  totalText: {
    color: colors.textSecondary,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  perPageGroup: {
    flexDirection: 'row',
    gap: spacing.tiny,
  },
  perPageBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.large,
    paddingHorizontal: spacing.small,
    paddingVertical: 6,
  },
  perPageBtnActive: {
    backgroundColor: colors.primary,
  },
  perPageText: {
    color: colors.primary,
  },
  perPageTextActive: {
    color: 'white',
  },
});

export default OrderListScreen; 