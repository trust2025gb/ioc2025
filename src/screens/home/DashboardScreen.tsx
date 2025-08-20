/**
 * 仪表盘页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Image, Platform, Animated, Easing } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, Divider, useTheme, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

// 导入组件
import { Container, Header, Loading } from '../../components';
import { useNavigation as useNav } from '@react-navigation/native';

// 导入API服务
import { orderService, OrderStatus } from '../../api/services/orderService';
import { leadService } from '../../api/services/leadService';
import { authService } from '../../api/services/authService';
import { dashboardService } from '../../api/services/dashboardService';
import { homeService } from '../../api/services/homeService';
import { analyticsService } from '../../api/services/analyticsService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { HomeTabParamList } from '../../navigation/types';

// 仪表盘展示开关（需要隐藏的模块设为 false）
const SHOW_ORDER_STATUS_DISTRIBUTION = false;
const SHOW_LEAD_CONVERSION = false;
const SHOW_MONTHLY_ORDER_TREND = false;
const SHOW_RECENT_ORDERS = false;
const SHOW_RECENT_LEADS = false;
const SHOW_RECENT_ACTIVITIES = false;
const SHOW_STAT_CARDS = false;
const SHOW_WELCOME = false; // 保持关闭欢迎区域

// 获取屏幕宽度
const screenWidth = Dimensions.get('window').width;

/**
 * 仪表盘页面组件
 */
const DashboardScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // 获取用户信息
  const {
    data: userData,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // 获取仪表盘完整数据（使用组合端点）
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    enabled: !isLoadingUser, // Wait for user data to load first
  });

  const { data: homeContent } = useQuery({
    queryKey: ['homeContent'],
    queryFn: () => homeService.getHomeContent(),
    staleTime: 5 * 60 * 1000,
  });
  const [homeConfig] = [undefined as any]; // placeholder keep existing later usage
  // 添加首页搜索相关状态
  const [globalSearchText, setGlobalSearchText] = useState('');
  const handleGlobalSearchSubmit = () => {
    const q = globalSearchText.trim();
    if (!q) {
      (navigation as any).navigate(ROUTES.HOME.SEARCH);
      return;
    }
    (navigation as any).navigate(ROUTES.HOME.SEARCH as any, { preset: q });
  };

  // 轮播相关状态（按条目轮播：标题+图片+文字 同时轮播）
  const carouselRef = useRef<ScrollView>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const slides = homeContent || [];
  const carouselItemWidth = screenWidth;
  const prevIndexRef = useRef(0);
  const currX = useRef(new Animated.Value(0)).current;
  const prevOpacity = useRef(new Animated.Value(0)).current;
  const [prevSlide, setPrevSlide] = useState<any | null>(null);
  const prevX = useRef(new Animated.Value(0)).current;
  const prevY = useRef(new Animated.Value(0)).current;
  const currY = useRef(new Animated.Value(0)).current;
  const currOpacity = useRef(new Animated.Value(1)).current;
  const maskW = useRef(new Animated.Value(0)).current;
  const maskH = useRef(new Animated.Value(0)).current;

  const intervalMs = (homeConfig as any)?.interval_ms ?? 3500;
  const durationMs = (homeConfig as any)?.duration_ms ?? 500;
  const animationType = ((homeConfig as any)?.animation as any) ?? 'slide-left';

  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % slides.length;
        if (carouselRef.current) {
          carouselRef.current.scrollTo({ x: next * carouselItemWidth, animated: true });
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, carouselItemWidth, intervalMs]);

  useEffect(() => {
    if (Platform.OS === 'web' && slides.length) {
      const goingForward = ((prevIndexRef.current + 1) % slides.length) === carouselIndex;
      setPrevSlide(slides[prevIndexRef.current] || null);

      // Reset animated values per type
      currX.setValue(0);
      prevX.setValue(0);
      currY.setValue(0);
      prevY.setValue(0);
      prevOpacity.setValue(1);
      currOpacity.setValue(1);
      maskW.setValue(0);
      maskH.setValue(0);

      const run = (anims: any[]) => Animated.parallel(anims).start(() => setPrevSlide(null));

      if (animationType === 'slide-left') {
        currX.setValue(goingForward ? carouselItemWidth : -carouselItemWidth);
        run([
          Animated.timing(currX, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
        ]);
        prevIndexRef.current = carouselIndex;
        return;
      }

      if (animationType === 'fade' || animationType === 'dissolve') {
        currOpacity.setValue(0);
        run([
          Animated.timing(prevOpacity, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(currOpacity, { toValue: 1, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
        ]);
        prevIndexRef.current = carouselIndex;
        return;
      }

      if (animationType.startsWith('push-')) {
        const dir = animationType.replace('push-','');
        if (dir === 'left') {
          currX.setValue(carouselItemWidth);
          prevX.setValue(0);
          run([
            Animated.timing(currX, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(prevX, { toValue: -carouselItemWidth, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        } else if (dir === 'right') {
          currX.setValue(-carouselItemWidth);
          prevX.setValue(0);
          run([
            Animated.timing(currX, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(prevX, { toValue: carouselItemWidth, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        } else if (dir === 'up') {
          const h = 280; // 近似内容高度
          currY.setValue(h);
          prevY.setValue(0);
          run([
            Animated.timing(currY, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(prevY, { toValue: -h, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        } else if (dir === 'down') {
          const h = 280;
          currY.setValue(-h);
          prevY.setValue(0);
          run([
            Animated.timing(currY, { toValue: 0, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(prevY, { toValue: h, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        }
        prevIndexRef.current = carouselIndex;
        return;
      }

      if (animationType.startsWith('wipe-')) {
        const dir = animationType.replace('wipe-','');
        if (dir === 'left' || dir === 'right') {
          maskW.setValue(0);
          run([
            Animated.timing(maskW, { toValue: carouselItemWidth, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        } else if (dir === 'up' || dir === 'down') {
          const h = 280;
          maskH.setValue(0);
          run([
            Animated.timing(maskH, { toValue: h, duration: durationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
          ]);
        }
        prevIndexRef.current = carouselIndex;
        return;
      }

      // none or unknown
      setPrevSlide(null);
      prevIndexRef.current = carouselIndex;
    }
  }, [carouselIndex, carouselItemWidth, slides.length, durationMs, animationType]);

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // 按顺序刷新数据，避免同时发起多个请求
      await refetchUser();
      await refetchDashboard();
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
    
    setRefreshing(false);
  };

  // 导航到通知页面
  const navigateToNotifications = () => {
    navigation.navigate(ROUTES.HOME.NOTIFICATIONS);
  };

  // 导航到活动页面
  const navigateToActivities = () => {
    navigation.navigate(ROUTES.HOME.ACTIVITIES);
  };

  // 导航到订单详情页面
  const navigateToOrderDetail = (orderId: string) => {
    navigation.navigate('OrdersTab' as any, {
      screen: ROUTES.ORDERS.DETAIL,
      params: { id: orderId },
    });
  };

  // 导航到线索详情页面
  const navigateToLeadDetail = (leadId: string) => {
    navigation.navigate('LeadsTab' as any, {
      screen: ROUTES.LEADS.DETAIL,
      params: { id: leadId },
    });
  };

  // 订单状态饼图数据
  const orderStatusChartData = dashboardData?.statistics.orders.by_status
    ? Object.entries(dashboardData.statistics.orders.by_status).map(([status, count]) => {
        const statusColor = {
          [OrderStatus.PENDING]: colors.warning,
          [OrderStatus.PROCESSING]: colors.info,
          [OrderStatus.COMPLETED]: colors.success,
          [OrderStatus.CANCELLED]: colors.error,
          [OrderStatus.REFUNDED]: colors.secondary,
        }[status as OrderStatus] || colors.grey500 as string;

        return {
          name: status,
          count,
          color: statusColor,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        };
      })
    : [];

  // 线索转化率数据
  const leadConversionData = {
    labels: ['已转化', '未转化'],
    datasets: [
      {
        data: dashboardData?.statistics.leads
          ? [
              dashboardData.statistics.leads.conversion_rate,
              100 - dashboardData.statistics.leads.conversion_rate,
            ]
          : [0, 0],
        color: (opacity = 1) => `${colors.success}${Math.round(opacity * 255).toString(16)}`,
        strokeWidth: 2,
      },
    ],
  };

  // 月度订单数据
  const monthlyOrderData = {
    labels: dashboardData?.statistics.orders.monthly_data
      ? dashboardData.statistics.orders.monthly_data.map(item => item.month)
      : ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        data: dashboardData?.statistics.orders.monthly_data
          ? dashboardData.statistics.orders.monthly_data.map(item => item.count)
          : [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `${colors.primary}${Math.round(opacity * 255).toString(16)}`,
        strokeWidth: 2,
      },
    ],
  };

  // 图表配置
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  // 渲染统计卡片
  const renderStatCards = () => (
    <View style={styles.statCardsContainer}>
      <Card style={styles.statCard}>
        <Card.Content>
          <Title style={styles.statTitle}>{dashboardData?.summary.total_orders || 0}</Title>
          <Paragraph style={styles.statLabel}>总订单数</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <Title style={styles.statTitle}>¥{dashboardData?.summary.total_amount.toFixed(2) || '0.00'}</Title>
          <Paragraph style={styles.statLabel}>总金额</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <Title style={styles.statTitle}>{dashboardData?.summary.total_leads || 0}</Title>
          <Paragraph style={styles.statLabel}>总线索数</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <Title style={styles.statTitle}>{dashboardData?.summary.conversion_rate || 0}%</Title>
          <Paragraph style={styles.statLabel}>转化率</Paragraph>
        </Card.Content>
      </Card>
    </View>
  );

  // 渲染图表区域
  const renderCharts = () => (
    <View style={styles.chartsContainer}>
      {SHOW_ORDER_STATUS_DISTRIBUTION && (
        <Card style={styles.chartCard}>
          <Card.Title title="订单状态分布" />
          <Card.Content style={styles.chartContent}>
            {isLoadingDashboard ? (
              <Loading loading={true} size="small" />
            ) : dashboardData?.statistics.orders.by_status && 
                 Object.keys(dashboardData.statistics.orders.by_status).length > 0 ? (
              <PieChart
                data={orderStatusChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.emptyText}>暂无订单状态数据</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {SHOW_LEAD_CONVERSION && (
        <Card style={styles.chartCard}>
          <Card.Title title="线索转化率" />
          <Card.Content style={styles.chartContent}>
            {isLoadingDashboard ? (
              <Loading loading={true} size="small" />
            ) : dashboardData?.statistics.leads ? (
              <BarChart
                data={leadConversionData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                yAxisLabel=""
                yAxisSuffix="%"
              />
            ) : (
              <Text style={styles.emptyText}>暂无线索转化率数据</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {SHOW_MONTHLY_ORDER_TREND && (
        <Card style={styles.chartCard}>
          <Card.Title title="月度订单趋势" />
          <Card.Content style={styles.chartContent}>
            {isLoadingDashboard ? (
              <Loading loading={true} size="small" />
            ) : dashboardData?.statistics.orders.monthly_data && 
                 dashboardData.statistics.orders.monthly_data.length > 0 ? (
              <LineChart
                data={monthlyOrderData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
              />
            ) : (
              <Text style={styles.emptyText}>暂无月度订单趋势数据</Text>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );

  // 渲染最近订单
  const renderRecentOrders = () => (
    <Card style={styles.sectionCard}>
      <Card.Title
        title="最近订单"
        right={(props) => (
          <Button
            {...props}
            onPress={() => navigation.navigate('OrdersTab' as any)}
            labelStyle={styles.viewAllLabel}
          >
            查看全部
          </Button>
        )}
      />
      <Card.Content>
        {isLoadingDashboard ? (
          <Loading loading={true} size="small" />
        ) : dashboardData?.recent_orders && dashboardData.recent_orders.length > 0 ? (
          dashboardData.recent_orders.map((order, index) => (
            <React.Fragment key={order.id}>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigateToOrderDetail(order.id)}
              >
                <View style={styles.listItemContent}>
                  <View>
                    <Text style={styles.listItemTitle}>订单 #{order.id.substring(0, 8)}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {order.product?.name || '未知产品'}
                    </Text>
                  </View>
                  <Text style={styles.listItemAmount}>¥{order.amount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
              {index < dashboardData.recent_orders.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Text style={styles.emptyText}>暂无订单数据</Text>
        )}
      </Card.Content>
    </Card>
  );

  // 渲染最近线索
  const renderRecentLeads = () => (
    <Card style={styles.sectionCard}>
      <Card.Title
        title="最近线索"
        right={(props) => (
          <Button
            {...props}
            onPress={() => navigation.navigate('LeadsTab' as any)}
            labelStyle={styles.viewAllLabel}
          >
            查看全部
          </Button>
        )}
      />
      <Card.Content>
        {isLoadingDashboard ? (
          <Loading loading={true} size="small" />
        ) : dashboardData?.recent_leads && dashboardData.recent_leads.length > 0 ? (
          dashboardData.recent_leads.map((lead, index) => (
            <React.Fragment key={lead.id}>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => navigateToLeadDetail(lead.id)}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.leadInfo}>
                    <Avatar.Text
                      size={36}
                      label={lead.name ? lead.name.substring(0, 2).toUpperCase() : '??'}
                      color={theme.colors.onPrimary}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <View style={styles.leadTextContainer}>
                      <Text style={styles.listItemTitle}>{lead.name}</Text>
                      <Text style={styles.listItemSubtitle}>{lead.phone || lead.email || '无联系方式'}</Text>
                    </View>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={24}
                    color={theme.colors.backdrop}
                  />
                </View>
              </TouchableOpacity>
              {index < dashboardData.recent_leads.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Text style={styles.emptyText}>暂无线索数据</Text>
        )}
      </Card.Content>
    </Card>
  );

  // 渲染最近活动
  const renderRecentActivities = () => (
    <Card style={styles.sectionCard}>
      <Card.Title
        title="最近活动"
        right={(props) => (
          <Button
            {...props}
            onPress={navigateToActivities}
            labelStyle={styles.viewAllLabel}
          >
            查看全部
          </Button>
        )}
      />
      <Card.Content>
        {isLoadingDashboard ? (
          <Loading loading={true} size="small" />
        ) : dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
          dashboardData.recent_activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <View style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <View style={styles.leadInfo}>
                    <Avatar.Text
                      size={36}
                      label={activity.user_name ? activity.user_name.substring(0, 2).toUpperCase() : '??'}
                      color={theme.colors.onPrimary}
                      style={{ backgroundColor: getActivityColor(activity.type) }}
                    />
                    <View style={styles.leadTextContainer}>
                      <Text style={styles.listItemTitle}>{activity.title}</Text>
                      <Text style={styles.listItemSubtitle}>{activity.description}</Text>
                    </View>
                  </View>
                  <Text style={styles.listItemTime}>{formatActivityTime(activity.created_at)}</Text>
                </View>
              </View>
              {index < dashboardData.recent_activities.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Text style={styles.emptyText}>暂无活动数据</Text>
        )}
      </Card.Content>
    </Card>
  );

  // 获取活动类型颜色
  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'order':
        return colors.primary;
      case 'lead':
        return colors.secondary;
      case 'claim':
        return colors.warning;
      case 'contract':
        return colors.success;
      case 'login':
        return colors.info;
      case 'profile_update':
        return colors.accent;
      default:
        return colors.grey500;
    }
  };

  // 格式化活动时间
  const formatActivityTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHrs < 24) {
      return `${diffHrs}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  };

  // 渲染快速操作
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate(ROUTES.HOME.PRODUCTS_NAV as any)}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}> 
          <Icon name="package-variant" size={24} color="#fff" />
        </View>
        <Text style={styles.quickActionText}>产品</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate(ROUTES.HOME.ORDERS_NAV as any)}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary }]}> 
          <Icon name="cart" size={24} color="#fff" />
        </View>
        <Text style={styles.quickActionText}>订单</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate(ROUTES.HOME.CONTRACTS_NAV as any)}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}> 
          <Icon name="file-document-outline" size={24} color="#fff" />
        </View>
        <Text style={styles.quickActionText}>合同</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate(ROUTES.HOME.CLAIMS_NAV as any)}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}> 
          <Icon name="clipboard-check-outline" size={24} color="#fff" />
        </View>
        <Text style={styles.quickActionText}>理赔</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染用户欢迎区域
  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <Card.Content style={styles.welcomeContent}>
        <View>
          <Text style={styles.welcomeText}>欢迎回来，</Text>
          <Text style={styles.userName}>{userData?.name || userData?.username || '用户'}</Text>
        </View>
        <Avatar.Text
          size={48}
          label={(userData?.name || userData?.username ? (userData?.name || userData?.username).substring(0, 2).toUpperCase() : '??')}
          color={theme.colors.onPrimary}
          style={{ backgroundColor: theme.colors.primary }}
        />
      </Card.Content>
    </Card>
  );

  // 新增：销售指标
  const { data: salesMetrics } = useQuery({
    queryKey: ['salesMetrics', 'self'],
    queryFn: () => dashboardService.getSalesMetrics(undefined, 'self'),
    staleTime: 60 * 1000,
  });
  const { data: recvSummary } = useQuery({
    queryKey: ['receivablesSummary','self'],
    queryFn: () => dashboardService.getReceivablesSummary(undefined, 'self'),
    staleTime: 60 * 1000,
  });
  const { data: commissionSummary } = useQuery({
    queryKey: ['commissionSummary','self'],
    queryFn: () => dashboardService.getCommissionSummary(undefined, 'self'),
    staleTime: 60 * 1000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard','amount'],
    queryFn: () => analyticsService.leaderboard(undefined, 'amount'),
    staleTime: 60 * 1000,
  });

  const [kpiScope, setKpiScope] = React.useState<'self'|'team'>('self');
  const { data: kpiBoard } = useQuery({
    queryKey: ['kpiBoard', kpiScope],
    queryFn: () => analyticsService.kpiBoard(undefined, kpiScope),
    staleTime: 60 * 1000,
  });
  const { data: marketingBudget } = useQuery({
    queryKey: ['marketingBudget'],
    queryFn: () => analyticsService.marketingBudget(),
    staleTime: 60 * 1000,
  });

  // 判断是否正在加载主要数据
  const isLoading = isLoadingUser || isLoadingDashboard;
  const SHOW_MARKETING_ON_HOME = false;

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title={userData?.name || userData?.username || '用户'}
        showBackButton={false}
        rightIcon="bell"
        onRightIconPress={navigateToNotifications}
      />

      {isLoading ? (
        <Loading loading={true} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* 快捷入口（营销入口已移至“我的”） */}
          {SHOW_MARKETING_ON_HOME && (
            <View style={{ flexDirection:'row', justifyContent:'space-around', margin: spacing.medium }}>
              <Button mode="outlined" onPress={() => (navigation as any).navigate(ROUTES.HOME.TEAM_PERFORMANCE)}>团队绩效</Button>
              <Button mode="outlined" onPress={() => (navigation as any).navigate(ROUTES.HOME.MARKETING_ROI)}>ROI 报表</Button>
            </View>
          )}
          {/* 销售指标卡片（移动至“我的 > 营销管理”） */}
          {SHOW_MARKETING_ON_HOME && (
            <Card style={{ margin: spacing.medium }}>
              <Card.Title title="本月销售指标" left={(props) => <Avatar.Icon {...props} icon="chart-line" />} />
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text>金额(¥)</Text>
                    <Title>{(salesMetrics as any)?.amount ?? 0}</Title>
                  </View>
                  <View>
                    <Text>订单数</Text>
                    <Title>{(salesMetrics as any)?.orders ?? 0}</Title>
                  </View>
                  <View>
                    <Text>客单价</Text>
                    <Title>{(salesMetrics as any)?.avgOrderValue ?? 0}</Title>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => (navigation as any).navigate('Settings' as any)}>去我的目标</Button>
              </Card.Actions>
            </Card>
          )}

          {/* 以下营销相关内容已移至“我的 > 营销管理”，此处不再展示 */}
          {false && (
            <>
              {/* 回款概览卡片 */}
              <Card style={{ marginHorizontal: spacing.medium, marginBottom: spacing.medium }}>
                <Card.Title title="回款概览" left={(props) => <Avatar.Icon {...props} icon="cash" />} />
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text>应收(¥)</Text>
                      <Title>{(recvSummary as any)?.total_due ?? 0}</Title>
                    </View>
                    <View>
                      <Text>已回(¥)</Text>
                      <Title>{(recvSummary as any)?.paid ?? 0}</Title>
                    </View>
                    <View>
                      <Text>逾期(¥)</Text>
                      <Title>{(recvSummary as any)?.overdue ?? 0}</Title>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* 佣金概览卡片 */}
              <Card style={{ marginHorizontal: spacing.medium, marginBottom: spacing.medium }}>
                <Card.Title title="佣金概览" left={(props) => <Avatar.Icon {...props} icon="wallet" />} />
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text>预计(¥)</Text>
                      <Title>{(commissionSummary as any)?.pending ?? 0}</Title>
                    </View>
                    <View>
                      <Text>已结算(¥)</Text>
                      <Title>{(commissionSummary as any)?.settled ?? 0}</Title>
                    </View>
                    <View>
                      <Text>合计(¥)</Text>
                      <Title>{(commissionSummary as any)?.total ?? 0}</Title>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* 团队Top3 */}
              <Card style={{ marginHorizontal: spacing.medium, marginBottom: spacing.medium }}>
                <Card.Title title="团队Top3（金额）" left={(props) => <Avatar.Icon {...props} icon="account-group" />} />
                <Card.Content>
                  {(leaderboard as any)?.items?.slice(0,3)?.map((it:any, idx:number) => (
                    <View key={it.id} style={{ flexDirection:'row', justifyContent:'space-between', marginVertical: 4 }}>
                      <Text>{idx+1}. {it.name}</Text>
                      <Text>¥{it.amount}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>

              {/* KPI 看板 */}
              <Card style={{ marginHorizontal: spacing.medium, marginBottom: spacing.medium }}>
                <Card.Title title="KPI 看板" left={(props) => <Avatar.Icon {...props} icon="view-dashboard" />} />
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent:'flex-end', marginBottom: 8 }}>
                    <Button mode={kpiScope==='self'?'contained':'outlined'} compact onPress={() => setKpiScope('self')}>个人</Button>
                    <View style={{ width: 8 }} />
                    <Button mode={kpiScope==='team'?'contained':'outlined'} compact onPress={() => setKpiScope('team')}>团队</Button>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text>销售金额(¥)</Text>
                      <Title>{(kpiBoard as any)?.sales?.amount ?? (salesMetrics as any)?.amount ?? 0}</Title>
                    </View>
                    <View>
                      <Text>订单数</Text>
                      <Title>{(kpiBoard as any)?.sales?.orders ?? (salesMetrics as any)?.orders ?? 0}</Title>
                    </View>
                    <View>
                      <Text>客单价</Text>
                      <Title>{(kpiBoard as any)?.sales?.avgOrderValue ?? (salesMetrics as any)?.avgOrderValue ?? 0}</Title>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <View>
                      <Text>回款(¥)</Text>
                      <Title>{(kpiBoard as any)?.receivables?.paid ?? (recvSummary as any)?.paid ?? 0}</Title>
                    </View>
                    <View>
                      <Text>逾期(¥)</Text>
                      <Title>{(kpiBoard as any)?.receivables?.overdue ?? (recvSummary as any)?.overdue ?? 0}</Title>
                    </View>
                    <View>
                      <Text>佣金(¥)</Text>
                      <Title>{(kpiBoard as any)?.commission?.total ?? (commissionSummary as any)?.total ?? 0}</Title>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* 营销预算 vs 消耗 */}
              <Card style={{ marginHorizontal: spacing.medium, marginBottom: spacing.medium }}>
                <Card.Title title="营销预算 vs 消耗（本月）" left={(props) => <Avatar.Icon {...props} icon="chart-donut" />} />
                <Card.Content>
                  {(marketingBudget as any)?.items?.slice(0,5)?.map((it:any, idx:number) => (
                    <View key={it.channel + '_' + idx} style={{ flexDirection:'row', justifyContent:'space-between', marginVertical: 4 }}>
                      <Text>{it.channel}</Text>
                      <Text>预算 ¥{it.budget} | 消耗 ¥{it.spend} | 差额 ¥{it.variance}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            </>
          )}

          {/* 欢迎区域 */}
          {SHOW_WELCOME && renderWelcomeSection()}

          {/* 快速操作 */}
          {renderQuickActions()}

          {/* 内容轮播：每一页包含 标题 + 图片 + 文字 */}
          {slides.length > 0 ? (
            <Card style={{ marginHorizontal: -spacing.medium, marginTop: spacing.medium, borderRadius: 0, overflow: 'hidden' }} >
              {Platform.OS === 'web' ? (
                <View style={{ width: carouselItemWidth, overflow: 'hidden', position: 'relative', alignSelf: 'stretch' }}>
                  {prevSlide ? (
                    <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: carouselItemWidth, opacity: animationType === 'fade' || animationType === 'dissolve' ? prevOpacity : 1, transform: [
                      { translateX: animationType.startsWith('push-') ? prevX : 0 },
                      { translateY: animationType.startsWith('push-') ? prevY : 0 }
                    ] }}>
                      <View style={{ width: carouselItemWidth, paddingBottom: 8 }}>
                        {prevSlide?.title ? (
                          <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                            <Title>{prevSlide.title}</Title>
                          </View>
                        ) : null}
                                                 {prevSlide?.image_url ? (
                           <View style={styles.imageWrap}>
                             <Image source={{ uri: prevSlide.image_url }} style={styles.cardImage} resizeMode="contain" />
                           </View>
                         ) : null}
                        {prevSlide?.content ? (
                          <Card.Content style={{ minHeight: 60 }}>
                            <Paragraph>{prevSlide.content.replace(/<[^>]+>/g, '')}</Paragraph>
                          </Card.Content>
                        ) : null}
                      </View>
                    </Animated.View>
                  ) : null}
                  {(() => {
                    const current = slides[carouselIndex];
                    const isWipe = animationType.startsWith('wipe-');
                    const wipeDir = animationType.replace('wipe-','');
                    const maskStyle: any = { position: 'absolute', top: 0, left: 0, overflow: 'hidden' };
                    if (wipeDir === 'right') { maskStyle.left = undefined; maskStyle.right = 0; }
                    if (wipeDir === 'down') { maskStyle.top = undefined; maskStyle.bottom = 0; }
                    if (wipeDir === 'left' || wipeDir === 'right') { maskStyle.width = maskW; }
                    if (wipeDir === 'up' || wipeDir === 'down') { maskStyle.height = maskH; maskStyle.width = carouselItemWidth; }
                    return (
                      <>
                        {isWipe ? (
                          <Animated.View style={maskStyle}>
                            <View style={{ width: carouselItemWidth, paddingBottom: 8, opacity: currOpacity }}>
                              {current?.title ? (
                                <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                                  <Title>{current.title}</Title>
                                </View>
                              ) : null}
                              {current?.image_url ? (
                                <View style={styles.imageWrap}>
                                  <Image source={{ uri: current.image_url }} style={styles.cardImage} resizeMode="contain" />
                                </View>
                              ) : null}
                              {current?.content ? (
                                <Card.Content style={{ minHeight: 60 }}>
                                  <Paragraph>{current.content.replace(/<[^>]+>/g, '')}</Paragraph>
                                </Card.Content>
                              ) : null}
                            </View>
                          </Animated.View>
                        ) : (
                          <Animated.View style={{ opacity: animationType === 'fade' || animationType === 'dissolve' ? currOpacity : 1, transform: [
                            { translateX: animationType === 'slide-left' || animationType.startsWith('push-') ? currX : 0 },
                            { translateY: animationType.startsWith('push-') ? currY : 0 }
                          ] }}>
                            <View style={{ width: carouselItemWidth, paddingBottom: 8 }}>
                              {current?.title ? (
                                <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                                  <Title>{current.title}</Title>
                                </View>
                              ) : null}
                              {current?.image_url ? (
                                <View style={styles.imageWrap}>
                                  <Image source={{ uri: current.image_url }} style={styles.cardImage} resizeMode="contain" />
                                </View>
                              ) : null}
                              {current?.content ? (
                                <Card.Content style={{ minHeight: 60 }}>
                                  <Paragraph>{current.content.replace(/<[^>]+>/g, '')}</Paragraph>
                                </Card.Content>
                              ) : null}
                            </View>
                          </Animated.View>
                        )}
                      </>
                    );
                  })()}
                </View>
              ) : (
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={{ width: carouselItemWidth }}
                  contentContainerStyle={{ paddingHorizontal: spacing.medium }}
                  decelerationRate="fast"
                  snapToInterval={carouselItemWidth}
                  snapToAlignment="start"
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / carouselItemWidth);
                    setCarouselIndex(idx);
                  }}
                >
                  {slides.map((item) => (
                    <View key={String(item.id)} style={{ width: screenWidth - spacing.medium * 2, alignSelf: 'center', paddingBottom: 8 }}>
                      {item.title ? (
                        <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                          <Title>{item.title}</Title>
                        </View>
                      ) : null}
                      {item.image_url ? (
                         <View style={styles.imageWrap}>
                           <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="contain" />
                         </View>
                       ) : null}
                      {item.content ? (
                        <Card.Content style={{ minHeight: 60 }}>
                          <WebView
                            originWhitelist={["*"]}
                            source={{ html: `<html><meta name='viewport' content='width=device-width, initial-scale=1'>${item.content}</html>` }}
                            style={{ backgroundColor: 'transparent', height: 200 }}
                          />
                        </Card.Content>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              )}
              {/* 指示点 */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 }}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      marginHorizontal: 4,
                      backgroundColor: i === carouselIndex ? '#666' : '#ccc'
                    }}
                  />
                ))}
              </View>
            </Card>
          ) : null}

          {/* 统计卡片 */}
          {SHOW_STAT_CARDS && renderStatCards()}

          {/* 隐藏图表区域 */}
          {false && renderCharts()}

          {/* 最近订单 */}
          {SHOW_RECENT_ORDERS && renderRecentOrders()}

          {/* 最近线索 */}
          {SHOW_RECENT_LEADS && renderRecentLeads()}

          {/* 最近活动 */}
          {SHOW_RECENT_ACTIVITIES && renderRecentActivities()}

          {/* 全站搜索入口（底部） */}
          <View style={{ marginHorizontal: spacing.medium, marginTop: spacing.xlarge, marginBottom: spacing.xxlarge }}>
            <TextInput
              mode="outlined"
              value={globalSearchText}
              onChangeText={setGlobalSearchText}
              onSubmitEditing={handleGlobalSearchSubmit}
              placeholder="请输入关键字"
              placeholderTextColor={colors.grey400 as any}
              outlineColor={colors.primaryLight}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary as any}
              right={<TextInput.Icon icon="magnify" onPress={handleGlobalSearchSubmit} color={colors.accent} />}
              // 占位符颜色已调整为偏淡的灰色
            />
          </View>
        </ScrollView>
      )}
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
  welcomeCard: {
    marginBottom: spacing.medium,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  quickActionButton: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  statCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.small,
  },
  statTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chartsContainer: {
    marginBottom: spacing.medium,
  },
  chartCard: {
    marginBottom: spacing.medium,
  },
  chartContent: {
    alignItems: 'center',
    paddingVertical: spacing.small,
  },
  sectionCard: {
    marginBottom: spacing.medium,
  },
  viewAllLabel: {
    fontSize: 12,
  },
  listItem: {
    paddingVertical: spacing.small,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  listItemTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: spacing.medium,
  },
  leadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadTextContainer: {
    marginLeft: spacing.small,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    borderRadius: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});

export default DashboardScreen; 