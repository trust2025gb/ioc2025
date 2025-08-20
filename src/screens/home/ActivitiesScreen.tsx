/**
 * 活动页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, Chip, Divider, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { HomeTabParamList } from '../../navigation/types';

// 活动类型枚举
enum ActivityType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_COMPLETED = 'order_completed',
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_CONVERTED = 'lead_converted',
  PAYMENT_RECEIVED = 'payment_received',
  CONTRACT_SIGNED = 'contract_signed',
  CLAIM_FILED = 'claim_filed',
  USER_LOGIN = 'user_login',
}

// 活动接口
interface Activity {
  id: string;
  type: ActivityType;
  user_id: string;
  user_name: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

// 模拟活动服务
const activityService = {
  getActivities: async (params?: { type?: ActivityType; from_date?: string; to_date?: string }) => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 返回模拟数据
    return {
      data: [
        {
          id: '1',
          type: ActivityType.ORDER_CREATED,
          user_id: '101',
          user_name: '张三',
          description: '创建了新订单 #12345',
          metadata: { order_id: '12345', product_name: '家庭保险计划' },
          created_at: '2023-09-15T10:30:00Z',
        },
        {
          id: '2',
          type: ActivityType.LEAD_CONVERTED,
          user_id: '102',
          user_name: '李四',
          description: '将线索转化为客户',
          metadata: { lead_id: '678', customer_id: '901' },
          created_at: '2023-09-14T15:45:00Z',
        },
        {
          id: '3',
          type: ActivityType.PAYMENT_RECEIVED,
          user_id: '103',
          user_name: '王五',
          description: '收到订单 #10987 的付款',
          metadata: { order_id: '10987', amount: 1299.00, payment_method: 'alipay' },
          created_at: '2023-09-13T09:20:00Z',
        },
        {
          id: '4',
          type: ActivityType.CONTRACT_SIGNED,
          user_id: '104',
          user_name: '赵六',
          description: '签署了合同 #5678',
          metadata: { contract_id: '5678', customer_id: '234' },
          created_at: '2023-09-12T18:00:00Z',
        },
        {
          id: '5',
          type: ActivityType.LEAD_CREATED,
          user_id: '101',
          user_name: '张三',
          description: '创建了新线索',
          metadata: { lead_id: '789', lead_name: '陈七' },
          created_at: '2023-09-11T11:15:00Z',
        },
        {
          id: '6',
          type: ActivityType.CLAIM_FILED,
          user_id: '105',
          user_name: '孙八',
          description: '提交了理赔申请 #4321',
          metadata: { claim_id: '4321', contract_id: '1234' },
          created_at: '2023-09-10T14:30:00Z',
        },
        {
          id: '7',
          type: ActivityType.ORDER_COMPLETED,
          user_id: '102',
          user_name: '李四',
          description: '完成了订单 #6789',
          metadata: { order_id: '6789', product_name: '意外保险' },
          created_at: '2023-09-09T16:45:00Z',
        },
      ],
      pagination: {
        total: 28,
        count: 7,
        perPage: 7,
        currentPage: 1,
        totalPages: 4
      }
    };
  }
};

/**
 * 活动页面组件
 */
const ActivitiesScreen = () => {
  const navigation = useNavigation<StackNavigationProp<HomeTabParamList>>();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  
  // 获取活动列表
  const {
    data: activitiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activities', selectedType],
    queryFn: () => activityService.getActivities(
      selectedType ? { type: selectedType } : undefined
    ),
  });
  
  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  // 处理类型选择
  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type === selectedType ? null : type);
  };
  
  // 获取活动图标
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.ORDER_CREATED:
        return 'file-plus';
      case ActivityType.ORDER_UPDATED:
        return 'file-edit';
      case ActivityType.ORDER_COMPLETED:
        return 'file-check';
      case ActivityType.LEAD_CREATED:
        return 'account-plus';
      case ActivityType.LEAD_UPDATED:
        return 'account-edit';
      case ActivityType.LEAD_CONVERTED:
        return 'account-convert';
      case ActivityType.PAYMENT_RECEIVED:
        return 'credit-card-check';
      case ActivityType.CONTRACT_SIGNED:
        return 'file-sign';
      case ActivityType.CLAIM_FILED:
        return 'file-document-edit';
      case ActivityType.USER_LOGIN:
        return 'login';
      default:
        return 'information';
    }
  };
  
  // 获取活动图标背景色
  const getActivityIconBg = (type: ActivityType) => {
    switch (type) {
      case ActivityType.ORDER_CREATED:
      case ActivityType.ORDER_UPDATED:
      case ActivityType.ORDER_COMPLETED:
        return colors.primary;
      case ActivityType.LEAD_CREATED:
      case ActivityType.LEAD_UPDATED:
      case ActivityType.LEAD_CONVERTED:
        return colors.secondary;
      case ActivityType.PAYMENT_RECEIVED:
        return colors.success;
      case ActivityType.CONTRACT_SIGNED:
        return colors.info;
      case ActivityType.CLAIM_FILED:
        return colors.warning;
      case ActivityType.USER_LOGIN:
        return colors.grey500;
      default:
        return colors.grey500;
    }
  };
  
  // 获取活动类型名称
  const getActivityTypeName = (type: ActivityType) => {
    switch (type) {
      case ActivityType.ORDER_CREATED:
        return '创建订单';
      case ActivityType.ORDER_UPDATED:
        return '更新订单';
      case ActivityType.ORDER_COMPLETED:
        return '完成订单';
      case ActivityType.LEAD_CREATED:
        return '创建线索';
      case ActivityType.LEAD_UPDATED:
        return '更新线索';
      case ActivityType.LEAD_CONVERTED:
        return '转化线索';
      case ActivityType.PAYMENT_RECEIVED:
        return '收到付款';
      case ActivityType.CONTRACT_SIGNED:
        return '签署合同';
      case ActivityType.CLAIM_FILED:
        return '提交理赔';
      case ActivityType.USER_LOGIN:
        return '用户登录';
      default:
        return '未知活动';
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return '今天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return '昨天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return `${diffInDays}天前 ` + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  // 渲染类型筛选器
  const renderTypeFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>筛选活动类型:</Text>
      <FlatList
        horizontal
        data={Object.values(ActivityType)}
        renderItem={({ item }) => (
          <Chip
            mode="outlined"
            selected={selectedType === item}
            onPress={() => handleTypeSelect(item)}
            style={styles.filterChip}
            selectedColor={getActivityIconBg(item)}
          >
            {getActivityTypeName(item)}
          </Chip>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      />
    </View>
  );
  
  // 渲染活动项
  const renderActivityItem = ({ item, index }: { item: Activity; index: number }) => {
    const isFirst = index === 0;
    const isLast = activitiesResponse && index === activitiesResponse.data.length - 1;
    
    return (
      <View style={styles.activityItemContainer}>
        {/* 时间线 */}
        <View style={styles.timelineContainer}>
          <View style={[
            styles.timelineLine,
            isFirst ? styles.timelineLineFirst : null,
            isLast ? styles.timelineLineLast : null,
          ]} />
          <View style={[styles.timelineDot, { backgroundColor: getActivityIconBg(item.type) }]}>
            <Icon name={getActivityIcon(item.type)} size={16} color="#fff" />
          </View>
        </View>
        
        {/* 活动内容 */}
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
            <Chip style={styles.activityTypeChip}>
              {getActivityTypeName(item.type)}
            </Chip>
          </View>
          
          <View style={styles.activityBody}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={24}
                label={item.user_name.substring(0, 1)}
                color={theme.colors.onPrimary}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <Text style={styles.userName}>{item.user_name}</Text>
            </View>
            <Text style={styles.activityDescription}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // 渲染分隔线
  const renderSeparator = () => <Divider style={styles.separator} />;
  
  return (
    <Container safeArea>
      <Header
        title="活动记录"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {/* 类型筛选器 */}
      {renderTypeFilters()}
      
      {/* 活动列表 */}
      {isLoading ? (
        <Loading loading={true} message="加载中..." />
      ) : error ? (
        <EmptyState
          title="加载失败"
          message="无法加载活动数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      ) : activitiesResponse && activitiesResponse.data.length > 0 ? (
        <FlatList
          data={activitiesResponse.data}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          title="暂无活动"
          message="没有找到符合条件的活动记录"
          icon="timeline-text"
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    padding: spacing.medium,
    backgroundColor: colors.background,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  filtersContent: {
    paddingRight: spacing.medium,
  },
  filterChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.large,
  },
  activityItemContainer: {
    flexDirection: 'row',
    padding: spacing.medium,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.grey300,
    left: 20,
  },
  timelineLineFirst: {
    top: 20,
  },
  timelineLineLast: {
    bottom: '100%',
    height: 20,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: spacing.small,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityTypeChip: {
    height: 24,
  },
  activityBody: {
    backgroundColor: colors.grey100,
    borderRadius: 8,
    padding: spacing.medium,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: spacing.small,
  },
  activityDescription: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: colors.grey200,
  },
});

export default ActivitiesScreen; 