/**
 * 线索导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { LeadsTabParamList } from './types';

// 导入线索相关页面
import {
  LeadListScreen,
  LeadDetailScreen,
  LeadCreateScreen,
  LeadStatisticsScreen,
} from '../screens/leads';
import LeadEditScreen from '../screens/leads/LeadEditScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<LeadsTabParamList>();

/**
 * 线索导航栈组件
 * 管理线索相关页面
 */
const LeadsNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LEADS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.LEADS.LIST} component={LeadListScreen} />
      <Stack.Screen name={ROUTES.LEADS.DETAIL} component={LeadDetailScreen} />
      <Stack.Screen name={ROUTES.LEADS.CREATE} component={LeadCreateScreen} />
      <Stack.Screen name={ROUTES.LEADS.EDIT} component={LeadEditScreen} />
      <Stack.Screen name={ROUTES.LEADS.STATISTICS} component={LeadStatisticsScreen} />
      {/* 注意：编辑和分配页面尚未实现 */}
      {/* <Stack.Screen name={ROUTES.LEADS.ASSIGN} component={LeadAssignScreen} /> */}
      {/* <Stack.Screen name={ROUTES.LEADS.CONVERT} component={LeadConvertScreen} /> */}
    </Stack.Navigator>
  );
};

export default LeadsNavigator; 