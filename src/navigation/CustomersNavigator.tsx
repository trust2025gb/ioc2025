/**
 * 客户导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { CustomersStackParamList } from './types';

// 导入客户相关页面
// 注意：这些页面将在后续步骤中实现
import {
  CustomerListScreen,
  CustomerDetailScreen,
  CustomerCreateScreen,
  CustomerEditScreen,
  CustomerPoliciesScreen,
  CustomerClaimsScreen,
} from '../screens/customers';

// 创建堆栈导航器
const Stack = createStackNavigator<CustomersStackParamList>();

/**
 * 客户导航栈组件
 * 管理客户相关页面
 */
const CustomersNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CUSTOMERS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.CUSTOMERS.LIST} component={CustomerListScreen} />
      <Stack.Screen name={ROUTES.CUSTOMERS.DETAIL} component={CustomerDetailScreen} />
      <Stack.Screen name={ROUTES.CUSTOMERS.CREATE} component={CustomerCreateScreen} />
      <Stack.Screen name={ROUTES.CUSTOMERS.EDIT} component={CustomerEditScreen} />
      <Stack.Screen name={ROUTES.CUSTOMERS.POLICIES} component={CustomerPoliciesScreen} />
      <Stack.Screen name={ROUTES.CUSTOMERS.CLAIMS} component={CustomerClaimsScreen} />
    </Stack.Navigator>
  );
};

export default CustomersNavigator; 