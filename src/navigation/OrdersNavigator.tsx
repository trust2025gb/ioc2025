/**
 * 订单管理导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 导入订单相关屏幕
import OrderListScreen from '../screens/orders/OrderListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrderCreateScreen from '../screens/orders/OrderCreateScreen';

// 导入常量和类型
import { ROUTES } from '../constants/routes';
import { OrdersStackParamList } from './types';

const Stack = createStackNavigator<OrdersStackParamList>();

/**
 * 订单管理导航器组件
 */
const OrdersNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.ORDERS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.ORDERS.LIST} component={OrderListScreen} />
      <Stack.Screen name={ROUTES.ORDERS.DETAIL} component={OrderDetailScreen} />
      <Stack.Screen name={ROUTES.ORDERS.CREATE} component={OrderCreateScreen} />
    </Stack.Navigator>
  );
};

export default OrdersNavigator; 