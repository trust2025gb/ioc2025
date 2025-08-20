/**
 * 合同导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { ContractsStackParamList } from './types';

// 导入合同相关页面
// 注意：这些页面将在后续步骤中实现
import {
  ContractListScreen,
  ContractDetailScreen,
  ContractSignScreen,
  ContractDocumentsScreen,
  ContractCreateScreen,
} from '../screens/contracts';

// 创建堆栈导航器
const Stack = createStackNavigator<ContractsStackParamList>();

/**
 * 合同导航栈组件
 * 管理合同相关页面
 */
const ContractsNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CONTRACTS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.CONTRACTS.LIST} component={ContractListScreen} />
      <Stack.Screen name={ROUTES.CONTRACTS.DETAIL} component={ContractDetailScreen} />
      <Stack.Screen name={ROUTES.CONTRACTS.SIGN} component={ContractSignScreen} />
      <Stack.Screen name={ROUTES.CONTRACTS.DOCUMENTS} component={ContractDocumentsScreen} />
      <Stack.Screen name={ROUTES.CONTRACTS.CREATE} component={ContractCreateScreen} />
      {/* 可以根据需要添加更多页面 */}
    </Stack.Navigator>
  );
};

export default ContractsNavigator; 