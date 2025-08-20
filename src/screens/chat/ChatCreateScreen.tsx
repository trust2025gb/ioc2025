/**
 * 聊天创建页面
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image } from 'react-native';
import {
  Text,
  TextInput,
  Avatar,
  Button,
  Chip,
  RadioButton,
  ActivityIndicator,
  Divider,
  Searchbar,
  List,
  FAB
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import {
  chatService,
  ChatConversationType
} from '../../api/services/chatService';
import { AppUser, userService } from '../../api/services/userService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ChatStackParamList } from '../../navigation/types';

// 聊天创建类型
type ChatCreateType = 'private' | 'group';

/**
 * 聊天创建页面组件
 */
const ChatCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  
  // 状态
  const [createType, setCreateType] = useState<ChatCreateType>('private');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
  const [groupAvatar, setGroupAvatar] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // 群聊人数规则
  const MIN_GROUP_MEMBERS = 2;
  const MAX_GROUP_MEMBERS = 50;
  
  // 获取用户列表
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users', { search: searchQuery }],
    queryFn: () => userService.getUsers({ per_page: 20, search: searchQuery || undefined }),
  });
  
  // 创建私聊
  const createPrivateChatMutation = useMutation({
    mutationFn: (userId: string) => {
      return chatService.createPrivateConversation(userId);
    },
    onSuccess: (conversation) => {
      navigation.replace(ROUTES.CHAT.CONVERSATION, {
        id: conversation.id,
      });
    },
    onError: (error) => {
      console.error('创建私聊失败:', error);
      setIsCreating(false);
    }
  });
  
  // 创建群聊
  const createGroupChatMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      participant_ids: string[];
      avatar?: any;
    }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      data.participant_ids.forEach(id => {
        formData.append('participant_ids[]', id);
      });
      if (data.avatar) {
        formData.append('avatar', {
          uri: data.avatar.uri,
          name: data.avatar.fileName || 'group_avatar.jpg',
          type: data.avatar.type || 'image/jpeg',
        } as any);
      }
      return chatService.createGroupConversation({
        name: data.name,
        description: data.description,
        participants: data.participant_ids,
        avatar: data.avatar,
      });
    },
    onSuccess: async (conversation) => {
      // 自动发送欢迎消息
      try {
        await chatService.sendMessage({
          conversation_id: conversation.id,
          type: 'text' as any,
          content: '欢迎加入群聊！',
        } as any);
      } catch {}
      navigation.replace(ROUTES.CHAT.CONVERSATION, {
        id: conversation.id,
      });
    },
    onError: (error) => {
      console.error('创建群聊失败:', error);
      setIsCreating(false);
    }
  });
  
  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };
  
  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // 处理选择用户
  const handleSelectUser = (user: AppUser) => {
    // 如果是私聊模式并且已选择了用户，直接替换
    if (createType === 'private') {
      setSelectedUsers([user]);
    } else {
      // 群聊模式，添加或移除用户
      const isAlreadySelected = selectedUsers.some(selected => selected.id === user.id);
      if (isAlreadySelected) {
        setSelectedUsers(selectedUsers.filter(selected => selected.id !== user.id));
      } else {
        if (selectedUsers.length >= MAX_GROUP_MEMBERS) {
          alert(`群聊最多选择 ${MAX_GROUP_MEMBERS} 人`);
          return;
        }
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };
  
  // 处理移除已选择的用户
  const handleRemoveSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };
  
  // 处理选择群组头像
  const handlePickGroupAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('需要访问相册权限');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('选择头像出错:', error);
    }
  };
  
  // 处理创建聊天
  const handleCreateChat = () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    if (createType === 'private') {
      if (selectedUsers.length === 0) {
        alert('请选择一个联系人');
        setIsCreating(false);
        return;
      }
      
      createPrivateChatMutation.mutate(selectedUsers[0].id);
    } else {
      // 创建群聊
      if (selectedUsers.length === 0) {
        alert('请至少选择一个群组成员');
        setIsCreating(false);
        return;
      }
      
      // 群名为空时，按成员姓名自动生成，如：张三、李四、王五 等N人
      const autoName = selectedUsers
        .map(u => u.name || (u as any).username || '')
        .filter(Boolean)
        .slice(0, 3)
        .join('、');
      const finalName = (groupName || '').trim() || `${autoName}${selectedUsers.length > 3 ? ` 等${selectedUsers.length}人` : ''}`;
      
      createGroupChatMutation.mutate({
        name: finalName,
        description: groupDescription.trim() || undefined,
        participant_ids: selectedUsers.map(user => user.id),
        avatar: groupAvatar,
      });
    }
  };
  
  // 检查是否可以创建聊天
  const canCreateChat = () => {
    if (createType === 'private') {
      return selectedUsers.length === 1;
    } else {
      return selectedUsers.length >= MIN_GROUP_MEMBERS && selectedUsers.length <= MAX_GROUP_MEMBERS;
    }
  };

  // 渲染用户列表项
  const renderUserItem = ({ item }: { item: AppUser }) => {
    const isSelected = selectedUsers.some(user => user.id === item.id);
    
    return (
      <TouchableOpacity onPress={() => handleSelectUser(item)}>
        <List.Item
          title={item.name || item.username}
          description={item.email || item.phone || '没有联系信息'}
                     left={() => (
            <Avatar.Image
              size={40}
              source={item.avatar ? { uri: item.avatar } : require('../../assets/logo.png')}
              style={styles.avatar}
            />
          )}
          descriptionNumberOfLines={1}
          right={() => (
            isSelected ? <Icon name="check-circle" size={24} color={colors.primary} /> : null
          )}
          style={isSelected ? styles.selectedItem : undefined}
        />
      </TouchableOpacity>
    );
  };
  
  // 渲染已选择的用户
  const renderSelectedUsers = () => {
    if (selectedUsers.length === 0) return null;
    
    return (
      <View style={styles.selectedUsersContainer}>
        <Text style={styles.selectedUsersTitle}>
          已选择 ({selectedUsers.length})
        </Text>
        <FlatList
          data={selectedUsers}
          keyExtractor={item => item.id}
          horizontal={false}
          numColumns={3}
          renderItem={({ item }) => (
            <Chip
              mode="outlined"
              avatar={
                <Avatar.Image
                  size={24}
                  source={item.avatar ? { uri: item.avatar } : require('../../assets/logo.png')}
                />
              }
              onClose={() => handleRemoveSelectedUser(item.id)}
              style={styles.selectedUserChip}
            >
              {item.name}
            </Chip>
          )}
          contentContainerStyle={styles.selectedUsersList}
        />
      </View>
    );
  };
  
  // 渲染群组设置
  const renderGroupSettings = () => {
    if (createType !== 'group') return null;
    
    return (
      <View style={styles.groupSettingsContainer}>
        <Text style={styles.sectionTitle}>群组设置</Text>
        <TouchableOpacity onPress={() => setShowGroupSettings(!showGroupSettings)}>
          <Chip icon={showGroupSettings ? 'chevron-up' : 'chevron-down'} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
            {showGroupSettings ? '收起群信息' : '编辑群信息（可选）'}
          </Chip>
        </TouchableOpacity>
        {showGroupSettings && (
        <>
        <View style={styles.groupAvatarContainer}>
          <TouchableOpacity onPress={handlePickGroupAvatar}>
            {groupAvatar ? (
              <Avatar.Image
                size={64}
                source={{ uri: groupAvatar.uri }}
                style={styles.groupAvatar}
              />
            ) : (
              <Avatar.Icon
                size={64}
                icon="account-group"
                style={styles.groupAvatar}
              />
            )}
            <View style={styles.groupAvatarEditBadge}>
              <Icon name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
        
        <TextInput
          label="群组名称"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.groupNameInput}
        />
        
        <TextInput
          label="群组描述 (可选)"
          value={groupDescription}
          onChangeText={setGroupDescription}
          multiline
          numberOfLines={3}
          style={styles.groupDescriptionInput}
        />
        </>
        )}
      </View>
    );
  };

  return (
    <Container safeArea scrollable={false}>
      <Header title="新建聊天" showBackButton onBackPress={handleBack} />
      <FlatList
        data={usersResponse?.data ?? []}
        keyExtractor={item => String(item.id)}
        renderItem={renderUserItem}
        contentContainerStyle={styles.usersList}
        onRefresh={refetchUsers}
        refreshing={isLoadingUsers}
        ListHeaderComponent={
          <View>
            <View style={styles.typeSelectionContainer}>
              <RadioButton.Group
                onValueChange={value => setCreateType(value as ChatCreateType)}
                value={createType}
              >
                <View style={styles.typeSelectionRow}>
                  <View style={styles.typeOption}>
                    <RadioButton value="private" color={colors.primary} />
                    <Text style={styles.typeLabel}>私聊</Text>
                  </View>
                  <View style={styles.typeOption}>
                    <RadioButton value="group" color={colors.primary} />
                    <Text style={styles.typeLabel}>群聊</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>
            {renderGroupSettings()}
            <Searchbar
              placeholder="搜索联系人"
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
            {renderSelectedUsers()}
            <Divider style={styles.divider} />
            {createType === 'group' && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                需选择 {MIN_GROUP_MEMBERS}-{MAX_GROUP_MEMBERS} 人（已选 {selectedUsers.length} 人）
              </Text>
            )}
            {usersError ? (
              <EmptyState
                title="加载失败"
                message="无法加载联系人信息"
                icon="alert-circle"
                buttonText="重试"
                onButtonPress={refetchUsers}
              />
            ) : (!isLoadingUsers && (usersResponse?.data?.length ?? 0) === 0) ? (
              (searchQuery?.length ?? 0) > 0 ? (
                <EmptyState title="没有找到联系人" message="尝试其他搜索关键词" icon="account-search" />
              ) : (
                <EmptyState title="联系人" message="输入姓名、邮箱或电话进行搜索，或下拉刷新加载" icon="account-search" />
              )
            ) : null}
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
      <FAB
        style={styles.createButton}
        icon="check"
        label={isCreating ? "创建中..." : "创建聊天"}
        onPress={handleCreateChat}
        disabled={!canCreateChat() || isCreating}
        loading={isCreating}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  typeSelectionContainer: {
    marginVertical: spacing.small,
  },
  typeSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    marginLeft: spacing.small,
    fontSize: 16,
  },
  searchBar: {
    marginBottom: spacing.medium,
    elevation: 0,
  },
  usersList: {
    paddingBottom: 80,
    paddingTop: spacing.small,
  },
  selectedUsersContainer: {
    marginBottom: spacing.small,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey800,
    marginBottom: spacing.small,
    marginHorizontal: spacing.small,
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  selectedUserChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
    maxWidth: '30%',
  },
  selectedItem: {
    backgroundColor: colors.primaryLight,
  },
  userItem: {
    paddingVertical: 4,
  },
  avatar: {
    backgroundColor: colors.grey300,
  },
  divider: {
    marginVertical: spacing.small,
  },
  createButton: {
    position: 'absolute',
    margin: spacing.medium,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  groupSettingsContainer: {
    marginBottom: spacing.small,
    paddingHorizontal: spacing.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.grey800,
    marginBottom: spacing.medium,
  },
  groupAvatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  groupAvatar: {
    backgroundColor: colors.primary,
  },
  groupAvatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  groupNameInput: {
    backgroundColor: 'transparent',
    marginBottom: spacing.small,
  },
  groupDescriptionInput: {
    backgroundColor: 'transparent',
  },
});

export default ChatCreateScreen; 