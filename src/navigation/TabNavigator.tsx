/**
 * 底部标签导航
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { ROUTES } from '../constants/routes';
import { MainTabParamList } from './types';
import HomeNavigator from './HomeNavigator';
import LeadsNavigator from './LeadsNavigator';
import ProfileNavigator from './ProfileNavigator';
import CustomersNavigator from './CustomersNavigator';
import ChatNavigator from './ChatNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * 底部标签导航组件
 */
const TabNavigator = () => {
  const { colors } = useTheme();

  const inactiveColor = (colors as any).grey600 || (colors as any).onSurfaceDisabled || '#9E9E9E';
  const tabActiveColors = {
    [ROUTES.TABS.HOME_TAB]: colors.primary,
    [ROUTES.TABS.LEADS_TAB]: (colors as any).secondary || colors.primary,
    [ROUTES.TABS.CHAT_TAB]: (colors as any).accent || colors.primary,
    [ROUTES.TABS.CUSTOMERS_TAB]: (colors as any).success || colors.primary,
    [ROUTES.TABS.PROFILE_TAB]: (colors as any).info || colors.primary,
  } as const;

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.TABS.HOME_TAB}
      screenOptions={{
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: (colors as any).grey300 || colors.backdrop,
        },
      }}
    >
      <Tab.Screen
        name={ROUTES.TABS.HOME_TAB}
        component={HomeNavigator}
        options={{
          tabBarLabel: '首页',
          tabBarActiveTintColor: tabActiveColors[ROUTES.TABS.HOME_TAB],
          tabBarIcon: ({ focused, size }) => (
            <Icon name="home" color={focused ? tabActiveColors[ROUTES.TABS.HOME_TAB] : inactiveColor} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.TABS.LEADS_TAB}
        component={LeadsNavigator}
        options={{
          tabBarLabel: '线索',
          tabBarActiveTintColor: tabActiveColors[ROUTES.TABS.LEADS_TAB],
          tabBarIcon: ({ focused, size }) => (
            <Icon name="account-search" color={focused ? tabActiveColors[ROUTES.TABS.LEADS_TAB] : inactiveColor} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.TABS.CHAT_TAB}
        component={ChatNavigator}
        options={{
          tabBarLabel: '聊天',
          tabBarActiveTintColor: tabActiveColors[ROUTES.TABS.CHAT_TAB],
          tabBarIcon: ({ focused, size }) => (
            <Icon name="chat" color={focused ? tabActiveColors[ROUTES.TABS.CHAT_TAB] : inactiveColor} size={size} />
          ),
          // 可在后续接入全局未读计数后通过 tabBarBadge 动态设置
        }}
      />

      <Tab.Screen
        name={ROUTES.TABS.CUSTOMERS_TAB}
        component={CustomersNavigator}
        options={{
          tabBarLabel: '客户',
          tabBarActiveTintColor: tabActiveColors[ROUTES.TABS.CUSTOMERS_TAB],
          tabBarIcon: ({ focused, size }) => (
            <Icon name="account-group" color={focused ? tabActiveColors[ROUTES.TABS.CUSTOMERS_TAB] : inactiveColor} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.TABS.PROFILE_TAB}
        component={ProfileNavigator}
        options={{
          tabBarLabel: '我的',
          tabBarActiveTintColor: tabActiveColors[ROUTES.TABS.PROFILE_TAB],
          tabBarIcon: ({ focused, size }) => (
            <Icon name="account-circle" color={focused ? tabActiveColors[ROUTES.TABS.PROFILE_TAB] : inactiveColor} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 