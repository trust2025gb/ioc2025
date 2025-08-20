/**
 * 通知页面
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Avatar, Badge, Divider, IconButton, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { HomeTabParamList } from '../../navigation/types';
import { NotificationsApi } from '../../api/notifications';

// 通知类型接口（页面内部显示用）
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  important?: boolean;
  urgent?: boolean;
  created_at: string;
  raw: any;
}

const CATEGORY_LABELS: Record<string, string> = {
  system: '系统消息',
  lead: '线索消息',
  claim: '理赔消息',
  contract: '合同消息',
  customer: '客户消息',
  order: '订单消息',
  points: '积分消息',
};

/**
 * 通知页面组件
 */
const NotificationsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<HomeTabParamList>>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [status, setStatus] = useState<'all' | 'unread'>('all');
  const [flagsMap, setFlagsMap] = useState<Record<string, { important?: boolean; urgent?: boolean }>>({});

  React.useEffect(() => {
    (async () => {
      const saved = await import('../../utils/storage').then(m => m.StorageUtils.getItem<any>(m.STORAGE_KEYS.NOTIFICATION_FLAGS));
      if (saved) setFlagsMap(saved as any);
    })();
  }, []);

  const saveFlags = async (next: Record<string, { important?: boolean; urgent?: boolean }>) => {
    const { StorageUtils, STORAGE_KEYS } = await import('../../utils/storage');
    setFlagsMap(next);
    StorageUtils.setItem(STORAGE_KEYS.NOTIFICATION_FLAGS, next).catch(() => {});
  };

  // 获取通知列表（分页）
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', status],
    queryFn: async ({ pageParam = 1 }) => {
      const res: any = await NotificationsApi.list({ status, page: pageParam, limit: 20 });
      return res; // Laravel 分页对象：{ data: [...], current_page, last_page, ... }
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage) return undefined;
      return lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const flatData: NotificationItem[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const all = pages.flatMap((p: any) => p?.data ?? []);
    return all.map((n: any) => {
      const category = n.data?.category ?? 'system';
      const fid = String(n.id);
      const flag = flagsMap[fid] || {};
      return {
        id: n.id,
        title: CATEGORY_LABELS[category] ?? (n.data?.title ?? '通知'),
        message: n.data?.body ?? '',
        type: category,
        read: !!n.read_at,
        important: !!flag.important,
        urgent: !!flag.urgent,
        created_at: n.created_at,
        raw: n,
      };
    });
  }, [data, flagsMap]);

  // 标记为已读
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => NotificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // 标记所有为已读
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 处理通知点击
  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    const d = notification.raw?.data ?? {};
    if (d.routeName) {
      try {
        navigation.navigate(d.routeName as any, d.routeParams || {});
        return;
      } catch (_) {}
    }
    // fallback: 根据类别与 resourceId 跳转
    const id = d.resourceId || d.id;
    switch (notification.type) {
      case 'order':
        if (id) navigation.navigate('OrdersTab' as any, { screen: ROUTES.ORDERS.DETAIL, params: { id: String(id) } });
        break;
      case 'lead':
        if (id) navigation.navigate('LeadsTab' as any, { screen: ROUTES.LEADS.DETAIL, params: { id: String(id) } });
        else navigation.navigate('LeadsTab' as any, { screen: ROUTES.LEADS.LIST });
        break;
      case 'claim':
        if (id) navigation.navigate('ClaimsTab' as any, { screen: ROUTES.CLAIMS.DETAIL, params: { id: String(id) } });
        else navigation.navigate('ClaimsTab' as any, { screen: ROUTES.CLAIMS.LIST });
        break;
      case 'contract':
        if (id) navigation.navigate('ContractsTab' as any, { screen: ROUTES.CONTRACTS.DETAIL, params: { id: String(id) } });
        else navigation.navigate('ContractsTab' as any, { screen: ROUTES.CONTRACTS.LIST });
        break;
      case 'customer':
        if (id) navigation.navigate('CustomersTab' as any, { screen: ROUTES.CUSTOMERS.DETAIL, params: { id: String(id) } });
        else navigation.navigate('CustomersTab' as any, { screen: ROUTES.CUSTOMERS.LIST });
        break;
      default:
        break;
    }
  };

  // 处理长按通知
  const handleNotificationLongPress = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setMenuVisible(true);
  };

  const toggleImportant = async () => {
    if (!selectedNotification) return;
    const id = String(selectedNotification.id);
    const next = { ...flagsMap, [id]: { ...(flagsMap[id] || {}), important: !flagsMap[id]?.important } };
    await saveFlags(next);
    setMenuVisible(false);
  };

  const toggleUrgent = async () => {
    if (!selectedNotification) return;
    const id = String(selectedNotification.id);
    const next = { ...flagsMap, [id]: { ...(flagsMap[id] || {}), urgent: !flagsMap[id]?.urgent } };
    await saveFlags(next);
    setMenuVisible(false);
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'file-document-outline';
      case 'lead':
        return 'account-multiple';
      case 'payment':
        return 'credit-card';
      case 'system':
        return 'cog';
      case 'performance':
        return 'chart-line';
      case 'claim':
        return 'file-cabinet';
      case 'contract':
        return 'file-sign';
      case 'customer':
        return 'account-circle';
      default:
        return 'bell';
    }
  };

  // 获取通知图标背景色
  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'order':
        return colors.primary;
      case 'lead':
        return colors.secondary;
      case 'payment':
        return colors.success;
      case 'system':
        return colors.warning;
      case 'performance':
        return colors.info;
      case 'claim':
        return colors.secondary;
      case 'contract':
        return colors.primary;
      case 'customer':
        return colors.info;
      default:
        return colors.grey500;
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return '今天';
    } else if (diffInDays === 1) {
      return '昨天';
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 渲染通知项
  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.notificationRead : styles.notificationUnread]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleNotificationLongPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationIconBg(item.type) }]}>
          <Icon name={getNotificationIcon(item.type)} size={24} color="#fff" />
        </View>
        <View style={styles.notificationTextContainer}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {!item.read && <Badge size={8} style={styles.unreadBadge} />}
            {item.important && <Badge style={[styles.flagBadge, { backgroundColor: colors.warning }]} size={14}>重要</Badge>}
            {item.urgent && <Badge style={[styles.flagBadge, { backgroundColor: colors.error }]} size={14}>紧急</Badge>}
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 渲染分隔线
  const renderSeparator = () => <Divider style={styles.separator} />;

  return (
    <Container safeArea>
      <Header
        title="通知"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon="check-all"
        onRightIconPress={() => markAllAsReadMutation.mutate()}
      />

      {/* 顶部筛选（全部/未读） */}
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.medium, paddingBottom: spacing.small }}>
        <TouchableOpacity onPress={() => setStatus('all')} style={{ marginRight: spacing.small }}>
          <Text style={{ color: status === 'all' ? colors.primary : colors.textSecondary }}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStatus('unread')}>
          <Text style={{ color: status === 'unread' ? colors.primary : colors.textSecondary }}>未读</Text>
        </TouchableOpacity>
      </View>

      {/* 通知列表 */}
      {isLoading ? (
        <Loading loading={true} message="加载中..." />
      ) : error ? (
        <EmptyState
          title="加载失败"
          message="无法加载通知数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      ) : flatData.length > 0 ? (
        <FlatList
          data={flatData}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.2}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={() => (
            isFetchingNextPage ? <Loading loading={true} message="加载更多..." /> : null
          )}
        />
      ) : (
        <EmptyState
          title="暂无通知"
          message="您目前没有任何通知"
          icon="bell-off"
        />
      )}

      {/* 通知操作菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            if (selectedNotification && !selectedNotification.read) {
              markAsReadMutation.mutate(selectedNotification.id);
            }
            setMenuVisible(false);
          }}
          title={selectedNotification?.read ? '已读' : '标记为已读'}
          leadingIcon="check-circle"
        />
        <Menu.Item
          onPress={toggleImportant}
          title={selectedNotification?.important ? '取消重要' : '标记为重要'}
          leadingIcon="star"
        />
        <Menu.Item
          onPress={toggleUrgent}
          title={selectedNotification?.urgent ? '取消紧急' : '标记为紧急'}
          leadingIcon="alert"
        />
      </Menu>
    </Container>
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    padding: spacing.medium,
  },
  notificationUnread: {
    backgroundColor: colors.grey100,
  },
  notificationRead: {
    backgroundColor: colors.background,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.small,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
  },
  flagBadge: {
    marginLeft: spacing.tiny,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.grey200,
  },
  menu: {
    marginTop: 50,
  },
});

export default NotificationsScreen; 