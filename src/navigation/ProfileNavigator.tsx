/**
 * 个人资料导航
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import ProfileDetailsScreen from '../screens/profile/ProfileDetailsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import CmsPageScreen from '../screens/profile/CmsPageScreen';
import GoalsScreen from '../screens/profile/GoalsScreen';
import TeamPerformanceScreen from '../screens/home/TeamPerformanceScreen';
import MarketingRoiScreen from '../screens/home/MarketingRoiScreen';
import LogoutConfirmScreen from '../screens/profile/LogoutConfirmScreen';
import ProfileEditScreen from '../screens/profile/ProfileEditScreen';

const Stack = createStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.PROFILE.DETAILS} component={ProfileDetailsScreen} />
      <Stack.Screen name={ROUTES.PROFILE.EDIT} component={ProfileEditScreen} />
      <Stack.Screen name={ROUTES.PROFILE.SETTINGS} component={SettingsScreen} />
      <Stack.Screen name={ROUTES.PROFILE.CHANGE_PASSWORD} component={ChangePasswordScreen} />
      <Stack.Screen name="CmsPage" component={CmsPageScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="TeamPerformance" component={TeamPerformanceScreen} />
      <Stack.Screen name="MarketingRoi" component={MarketingRoiScreen} />
      <Stack.Screen name={ROUTES.PROFILE.LOGOUT_CONFIRM} component={LogoutConfirmScreen} />
    </Stack.Navigator>
  );
} 