/**
 * 首页/仪表盘导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 导入首页相关屏幕
import DashboardScreen from '../screens/home/DashboardScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import ActivitiesScreen from '../screens/home/ActivitiesScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ExpertDetailScreen from '../screens/users/ExpertDetailScreen';
import MyTasksScreen from '../screens/tasks/MyTasksScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import TeamPerformanceScreen from '../screens/home/TeamPerformanceScreen';
import MarketingRoiScreen from '../screens/home/MarketingRoiScreen';
 
// 导入其他子导航器（用于在首页内跳转）
import ProductsNavigator from './ProductsNavigator';
import OrdersNavigator from './OrdersNavigator';
import ContractsNavigator from './ContractsNavigator';
import ClaimsNavigator from './ClaimsNavigator';

// 导入常量和类型
import { ROUTES } from '../constants/routes';
import { HomeStackParamList } from './types';

const Stack = createStackNavigator<HomeStackParamList>();

/**
 * 首页/仪表盘导航器组件
 */
const HomeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.HOME.DASHBOARD}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.HOME.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen name={ROUTES.HOME.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.HOME.ACTIVITIES} component={ActivitiesScreen} />
      <Stack.Screen name={ROUTES.HOME.SEARCH} component={SearchScreen} />
      <Stack.Screen name={ROUTES.EXPERTS.DETAIL as any} component={ExpertDetailScreen} />
      <Stack.Screen name={ROUTES.TASKS.MY as any} component={MyTasksScreen} />
      <Stack.Screen name={'TaskDetail' as any} component={TaskDetailScreen} />
      {/* 新增 P2 视图 */}
      <Stack.Screen name={ROUTES.HOME.TEAM_PERFORMANCE} component={TeamPerformanceScreen} />
      <Stack.Screen name={ROUTES.HOME.MARKETING_ROI} component={MarketingRoiScreen} />
      {/* 将移除的四个模块作为子导航挂入首页栈，便于快捷入口跳转 */}
      <Stack.Screen name={ROUTES.HOME.PRODUCTS_NAV} component={ProductsNavigator} />
      <Stack.Screen name={ROUTES.HOME.ORDERS_NAV} component={OrdersNavigator} />
      <Stack.Screen name={ROUTES.HOME.CONTRACTS_NAV} component={ContractsNavigator} />
      <Stack.Screen name={ROUTES.HOME.CLAIMS_NAV} component={ClaimsNavigator} />
    </Stack.Navigator>
  );
};

export default HomeNavigator; 