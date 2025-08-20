/**
 * 理赔导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { ClaimsStackParamList } from './types';

// 在实现理赔页面时导入
import {
  ClaimListScreen,
  ClaimDetailScreen,
  ClaimCreateScreen,
  ClaimDocumentsScreen,
  ClaimTimelineScreen,
  ClaimPaymentScreen,
  ClaimAppealScreen,
} from '../screens/claims';

const Stack = createStackNavigator<ClaimsStackParamList>();

/**
 * 理赔导航器组件
 */
const ClaimsNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CLAIMS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.CLAIMS.LIST} component={ClaimListScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.DETAIL} component={ClaimDetailScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.CREATE} component={ClaimCreateScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.DOCUMENTS} component={ClaimDocumentsScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.TIMELINE} component={ClaimTimelineScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.PAYMENT} component={ClaimPaymentScreen} />
      <Stack.Screen name={ROUTES.CLAIMS.APPEAL} component={ClaimAppealScreen} />
    </Stack.Navigator>
  );
};

export default ClaimsNavigator; 