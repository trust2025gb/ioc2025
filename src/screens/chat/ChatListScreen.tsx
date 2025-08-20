/**
 * 聊天列表页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image } from 'react-native';
import {
  Text, Searchbar, FAB, Chip, Menu, Divider, Avatar, Badge,
  List, ActivityIndicator, SegmentedButtons, IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import {
  chatService,
  ChatConversation,
  ChatConversationType,
  UserStatus,
  MessageType
} from '../../api/services/chatService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ChatStackParamList } from '../../navigation/types';
import { StorageUtils, STORAGE_KEYS } from '../../utils/storage';

/**
 * 聊天列表页面组件
 */
const ChatListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  const queryClient = useQueryClient();

  // 状态
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [conversationMenuVisible, setConversationMenuVisible] = useState(false);

  // 获取聊天会话列表
  const {
    data: conversationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations', { search: searchQuery, type: selectedTab === 'all' ? undefined : selectedTab }],
    queryFn: () => chatService.getConversations({
      search: searchQuery || undefined,
      type: selectedTab === 'all' ? undefined : selectedTab as ChatConversationType,
      is_archived: false,
    }),
  });

  // 更新会话状态（置顶、静音）
  const updateConversationStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: { is_pinned?: boolean; is_muted?: boolean; is_archived?: boolean } }) => 
      chatService.updateConversationStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 将会话标记为已读
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => chatService.markConversationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 显示/隐藏会话菜单
  const toggleConversationMenu = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setConversationMenuVisible(!conversationMenuVisible);
  };

  // 导航到聊天会话
  const navigateToConversation = (conversation: ChatConversation) => {
    // 如果有未读消息，按设置决定是否标记为已读
    const maybeMarkRead = async () => {
      const settings = await StorageUtils.getItem<any>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      const readReceiptsEnabled = settings ? settings.readReceiptsEnabled !== false : true;
      if (readReceiptsEnabled && conversation.unread_count > 0) {
        markAsReadMutation.mutate(conversation.id);
      }
    };
    maybeMarkRead();
    navigation.navigate(ROUTES.CHAT.CONVERSATION, {
      id: conversation.id,
    });
  };

  // 导航到创建聊天
  const navigateToCreateChat = () => {
    navigation.navigate(ROUTES.CHAT.CREATE);
  };

  // 导航到客服支持
  const navigateToSupport = async () => {
    try {
      const supportConversation = await chatService.getSupportConversation();
      navigateToConversation(supportConversation);
    } catch (error) {
      console.error('获取客服支持会话失败:', error);
    }
  };

  // 导航到归档聊天
  const navigateToArchived = () => {
    navigation.navigate(ROUTES.CHAT.ARCHIVED);
  };

  // 导航到设置
  const navigateToSettings = () => {
    navigation.navigate(ROUTES.CHAT.SETTINGS);
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理置顶/取消置顶
  const handleTogglePin = () => {
    if (selectedConversation) {
      updateConversationStatusMutation.mutate({
        id: selectedConversation.id,
        data: { is_pinned: !selectedConversation.is_pinned }
      });
      setConversationMenuVisible(false);
    }
  };

  // 处理静音/取消静音
  const handleToggleMute = () => {
    if (selectedConversation) {
      updateConversationStatusMutation.mutate({
        id: selectedConversation.id,
        data: { is_muted: !selectedConversation.is_muted }
      });
      setConversationMenuVisible(false);
    }
  };

  // 处理归档
  const handleArchive = () => {
    if (selectedConversation) {
      updateConversationStatusMutation.mutate({
        id: selectedConversation.id,
        data: { is_archived: true }
      });
      setConversationMenuVisible(false);
    }
  };

  // 格式化最后消息时间
  const formatLastMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // 同一天，显示时间
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 本周内，显示星期
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[messageDate.getDay()];
    }
    
    // 本年内，显示月日
    if (messageDate.getFullYear() === now.getFullYear()) {
      return `${messageDate.getMonth() + 1}月${messageDate.getDate()}日`;
    }
    
    // 不在本年，显示年月日
    return `${messageDate.getFullYear()}/${messageDate.getMonth() + 1}/${messageDate.getDate()}`;
  };

  // 获取会话类型图标
  const getConversationTypeIcon = (type: ChatConversationType) => {
    switch (type) {
      case ChatConversationType.PRIVATE:
        return 'account';
      case ChatConversationType.GROUP:
        return 'account-group';
      case ChatConversationType.SUPPORT:
        return 'headset';
      case ChatConversationType.AI:
        return 'robot';
      default:
        return 'chat';
    }
  };

  // 获取会话类型名称
  const getConversationTypeName = (type: ChatConversationType) => {
    switch (type) {
      case ChatConversationType.PRIVATE:
        return '私聊';
      case ChatConversationType.GROUP:
        return '群聊';
      case ChatConversationType.SUPPORT:
        return '客服';
      case ChatConversationType.AI:
        return 'AI助手';
      default:
        return '聊天';
    }
  };

  // 渲染会话列表项
  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    // 最后消息内容显示
    const renderLastMessageContent = () => {
      if (!item.last_message) {
        return <Text style={styles.noMessageText}>暂无消息</Text>;
      }

      let content = '';
      switch (item.last_message.type) {
        case MessageType.TEXT:
          content = item.last_message.content;
          break;
        case MessageType.IMAGE:
          content = '[图片]';
          break;
        case MessageType.FILE:
          content = '[文件]';
          break;
        case MessageType.AUDIO:
          content = '[语音]';
          break;
        case MessageType.VIDEO:
          content = '[视频]';
          break;
        case MessageType.LOCATION:
          content = '[位置]';
          break;
        case MessageType.SYSTEM:
          content = '[系统消息]';
          break;
        case MessageType.NOTIFICATION:
          content = '[通知]';
          break;
        default:
          content = item.last_message.content || '暂无消息';
      }

      // 如果是群聊且不是系统消息，显示发送者名称
      if (item.type === ChatConversationType.GROUP && 
          item.last_message.type !== MessageType.SYSTEM && 
          item.last_message.type !== MessageType.NOTIFICATION) {
        const sender = item.last_message.sender_name || '匿名';
        content = `${sender}: ${content}`;
      }

      return (
        <Text 
          numberOfLines={1} 
          style={[
            styles.lastMessageText, 
            item.unread_count > 0 ? styles.unreadMessageText : {}
          ]}
        >
          {content}
        </Text>
      );
    };

    // 渲染会话图标
    const renderConversationAvatar = () => {
      // 如果有自定义头像
      if (item.avatar) {
        return (
          <Avatar.Image
            size={56}
            source={{ uri: item.avatar }}
            style={styles.avatar}
          />
        );
      }

      // 根据类型使用不同的默认图标
      const iconName = getConversationTypeIcon(item.type);
      let color = colors.primary;
      
      // 特殊类型使用不同颜色
      if (item.type === ChatConversationType.SUPPORT) {
        color = colors.success;
      } else if (item.type === ChatConversationType.AI) {
        color = colors.info;
      }

      return (
        <Avatar.Icon
          size={56}
          icon={iconName}
          color={colors.white}
          style={[styles.avatar, { backgroundColor: color }]}
        />
      );
    };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          item.is_pinned && styles.pinnedConversation
        ]}
        onPress={() => navigateToConversation(item)}
        onLongPress={() => toggleConversationMenu(item)}
      >
        <View style={styles.avatarContainer}>
          {renderConversationAvatar()}
          {/* 在线状态指示器(仅私聊显示) */}
          {item.type === ChatConversationType.PRIVATE && 
           item.participants.length > 0 && 
           item.participants[0].status === UserStatus.ONLINE && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text 
              style={[
                styles.conversationName,
                item.unread_count > 0 ? styles.unreadName : {}
              ]}
              numberOfLines={1}
            >
              {item.name || getConversationTypeName(item.type)}
              {item.is_muted && ' 🔇'}
            </Text>
            <View style={styles.timeContainer}>
              {item.is_pinned && (
                <Icon name="pin" size={12} color={colors.primary} style={styles.pinIcon} />
              )}
              {item.last_message && (
                <Text style={styles.timeText}>
                  {formatLastMessageTime(item.last_message.timestamp)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.bottomRow}>
            {renderLastMessageContent()}
            {item.unread_count > 0 && (
              <Badge style={styles.unreadBadge}>{item.unread_count}</Badge>
            )}
          </View>
        </View>

        <IconButton
          icon="dots-vertical"
          size={20}
          onPress={() => toggleConversationMenu(item)}
          style={styles.moreButton}
        />
      </TouchableOpacity>
    );
  };

  // 对会话列表进行排序：先置顶，再按最后消息时间
  const sortedConversations = () => {
    if (!conversationsResponse?.data) return [];
    
    return [...conversationsResponse.data].sort((a, b) => {
      // 置顶的会话放在前面
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // 如果都是置顶或都不是置顶，按最后消息时间排序
      const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.updated_at).getTime();
      const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.updated_at).getTime();
      
      return bTime - aTime; // 降序，最新的在前面
    });
  };

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="消息"
        showBackButton={false}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      {/* 主菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={toggleMenu}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToSupport();
          }}
          title="联系客服"
          leadingIcon="headset"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToArchived();
          }}
          title="已归档会话"
          leadingIcon="archive"
        />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToSettings();
          }}
          title="聊天设置"
          leadingIcon="cog"
        />
      </Menu>

      {/* 会话操作菜单 */}
      <Menu
        visible={conversationMenuVisible}
        onDismiss={() => setConversationMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.conversationMenu}
      >
        <Menu.Item
          onPress={handleTogglePin}
          title={selectedConversation?.is_pinned ? "取消置顶" : "置顶"}
          leadingIcon={selectedConversation?.is_pinned ? "pin-off" : "pin"}
        />
        <Menu.Item
          onPress={handleToggleMute}
          title={selectedConversation?.is_muted ? "取消静音" : "静音"}
          leadingIcon={selectedConversation?.is_muted ? "volume-high" : "volume-off"}
        />
        <Menu.Item
          onPress={handleArchive}
          title="归档"
          leadingIcon="archive"
        />
        {selectedConversation?.type === ChatConversationType.GROUP && (
          <Menu.Item
            onPress={() => {
              setConversationMenuVisible(false);
              if (selectedConversation) {
                navigation.navigate(ROUTES.CHAT.GROUP_INFO, {
                  id: selectedConversation.id,
                  
                });
              }
            }}
            title="群组信息"
            leadingIcon="account-group"
          />
        )}
      </Menu>

      <View style={styles.container}>
        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索消息"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 标签筛选器 */}
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          style={styles.segmentedButtons}
          buttons={[
            { value: 'all', label: '全部' },
            { value: 'private', label: '私聊' },
            { value: 'group', label: '群聊' },
          ]}
        />

        {/* 会话列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载聊天列表，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : conversationsResponse && sortedConversations().length > 0 ? (
          <FlatList
            data={sortedConversations()}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.conversationList}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : (
          <EmptyState
            title="暂无会话"
            message={searchQuery ? "没有找到匹配的会话" : "开始一段新的对话吧"}
            icon="chat-outline"
            buttonText="创建聊天"
            onButtonPress={navigateToCreateChat}
          />
        )}

        {/* 创建按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToCreateChat}
          color={colors.white}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: spacing.medium,
    elevation: 0,
  },
  segmentedButtons: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  conversationList: {
    paddingBottom: spacing.extraLarge,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  pinnedConversation: {
    backgroundColor: colors.grey100,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.medium,
  },
  avatar: {
    backgroundColor: colors.grey300,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pinIcon: {
    marginRight: spacing.tiny,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadMessageText: {
    color: colors.text,
  },
  noMessageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.grey500,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    marginLeft: spacing.small,
  },
  moreButton: {
    margin: 0,
  },
  fab: {
    position: 'absolute',
    right: spacing.medium,
    bottom: spacing.medium,
    backgroundColor: colors.primary,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  conversationMenu: {
    position: 'absolute',
    top: 50,
    right: 10,
  },
});

export default ChatListScreen; 