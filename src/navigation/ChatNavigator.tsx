/**
 * 聊天导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { ChatStackParamList } from './types';

// 在实现聊天页面时导入
import {
  ChatListScreen,
  ChatConversationScreen,
  ChatCreateScreen,
  ChatGroupInfoScreen,
  // 以下组件暂未实现，先注释掉避免编译错误
  ChatSearchScreen,
  // ChatParticipantsScreen,
  ChatAttachmentsScreen,
  // ChatSupportScreen,
  // ChatAiAssistantScreen,
  ChatSettingsScreen,
  ChatArchivedScreen,
} from '../screens/chat';

const Stack = createStackNavigator<ChatStackParamList>();

/**
 * 聊天导航器组件
 */
const ChatNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CHAT.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.CHAT.LIST} component={ChatListScreen} />
      <Stack.Screen name={ROUTES.CHAT.CONVERSATION} component={ChatConversationScreen} />
      <Stack.Screen name={ROUTES.CHAT.CREATE} component={ChatCreateScreen} />
      <Stack.Screen name={ROUTES.CHAT.GROUP_INFO} component={ChatGroupInfoScreen} />
      {/* 以下屏幕暂未实现，先注释掉避免编译错误 */}
      <Stack.Screen name={ROUTES.CHAT.SEARCH} component={ChatSearchScreen} />
      {/* <Stack.Screen name={ROUTES.CHAT.PARTICIPANTS} component={ChatParticipantsScreen} /> */}
      <Stack.Screen name={ROUTES.CHAT.ATTACHMENTS} component={ChatAttachmentsScreen} />
      {/* <Stack.Screen name={ROUTES.CHAT.SUPPORT} component={ChatSupportScreen} /> */}
      {/* <Stack.Screen name={ROUTES.CHAT.AI_ASSISTANT} component={ChatAiAssistantScreen} /> */}
      <Stack.Screen name={ROUTES.CHAT.SETTINGS} component={ChatSettingsScreen} />
      <Stack.Screen name={ROUTES.CHAT.ARCHIVED} component={ChatArchivedScreen} />
    </Stack.Navigator>
  );
};

export default ChatNavigator; 