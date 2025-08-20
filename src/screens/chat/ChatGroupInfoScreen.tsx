/**
 * 群组信息页面
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Avatar,
  Button,
  List,
  IconButton,
  Switch,
  Divider,
  Dialog,
  Portal,
  FAB
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import {
  chatService,
  ChatConversation,
  ChatParticipant,
  ChatConversationType
} from '../../api/services/chatService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ChatStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';

/**
 * 群组信息页面组件
 */
const ChatGroupInfoScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  const route = useRoute<RouteProp<ChatStackParamList, typeof ROUTES.CHAT.GROUP_INFO>>();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const initialConversation = undefined as any;
  // 从认证状态获取当前用户ID
  const authUserId = useAppSelector(state => state.auth.user?.id);
  
  // 状态
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isParticipantsDialogVisible, setIsParticipantsDialogVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ChatParticipant | null>(null);
  const [isLeaveDialogVisible, setIsLeaveDialogVisible] = useState(false);
  const [isDissolveDialogVisible, setIsDissolveDialogVisible] = useState(false);
  
  // 当前用户ID（字符串形式，参与者数据也是字符串）
  const currentUserId = authUserId ? String(authUserId) : '';
  
  // 获取群组详情
  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => chatService.getConversation(id),
    initialData: initialConversation,
  });
  
  // 获取群组成员
  const {
    data: participantsResponse,
    isLoading: isLoadingParticipants,
    error: participantsError,
    refetch: refetchParticipants,
  } = useQuery({
    queryKey: ['participants', id],
    queryFn: () => chatService.getParticipants(id),
  });
  
  // 更新群组信息
  const updateGroupMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      avatar?: any;
    }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.avatar) {
        formData.append('avatar', {
          uri: data.avatar.uri,
          name: data.avatar.fileName || 'group_avatar.jpg',
          type: data.avatar.type || 'image/jpeg',
        } as any);
      }
      return chatService.updateGroup(id, {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
      });
    },
    onSuccess: (updatedConversation) => {
      // 更新缓存
      queryClient.setQueryData(['conversation', id], updatedConversation);
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('更新群组失败:', error);
      Alert.alert('更新失败', '无法更新群组信息，请稍后重试');
    }
  });
  
  // 更新会话状态（静音）
  const updateConversationStatusMutation = useMutation({
    mutationFn: (data: { is_muted: boolean }) => chatService.updateConversationStatus(id, data),
    onSuccess: (updatedConversation) => {
      // 更新缓存
      queryClient.setQueryData(['conversation', id], updatedConversation);
    },
    onError: (error) => {
      console.error('更新会话状态失败:', error);
      setIsMuted(!isMuted); // 恢复开关状态
    }
  });
  
  // 添加成员
  const addParticipantsMutation = useMutation({
    mutationFn: (participantIds: string[]) => chatService.addParticipants(id, participantIds),
    onSuccess: () => {
      refetchParticipants();
    },
    onError: (error) => {
      console.error('添加成员失败:', error);
    }
  });
  
  // 移除成员
  const removeParticipantMutation = useMutation({
    mutationFn: (participantId: string) => chatService.removeParticipant(id, participantId),
    onSuccess: () => {
      refetchParticipants();
      setSelectedParticipant(null);
      setIsParticipantsDialogVisible(false);
    },
    onError: (error) => {
      console.error('移除成员失败:', error);
    }
  });
  
  // 离开群组
  const leaveGroupMutation = useMutation({
    mutationFn: () => chatService.leaveGroup(id),
    onSuccess: () => {
      navigation.replace(ROUTES.CHAT.LIST);
    },
    onError: (error) => {
      console.error('离开群组失败:', error);
      setIsLeaveDialogVisible(false);
    }
  });
  
  // 解散群组
  const dissolveGroupMutation = useMutation({
    mutationFn: () => chatService.dissolveGroup(id),
    onSuccess: () => {
      navigation.replace(ROUTES.CHAT.LIST);
    },
    onError: (error) => {
      console.error('解散群组失败:', error);
      setIsDissolveDialogVisible(false);
    }
  });
  
  // 初始化表单数据
  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.name || '');
      setGroupDescription(conversation.description || '');
      setIsMuted(conversation.is_muted || false);
    }
  }, [conversation]);
  
  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };
  
  // 处理编辑模式切换
  const toggleEditMode = () => {
    if (isEditing) {
      // 取消编辑，恢复原始数据
      setGroupName(conversation?.name || '');
      setGroupDescription(conversation?.description || '');
      setGroupAvatar(null);
    }
    setIsEditing(!isEditing);
  };
  
  // 处理保存群组信息
  const handleSaveGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('错误', '群组名称不能为空');
      return;
    }
    
    updateGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      avatar: groupAvatar,
    });
  };
  
  // 处理选择群组头像
  const handlePickGroupAvatar = async () => {
    if (!isEditing) return;
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要访问相册权限', [{ text: '确定' }]);
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
  
  // 处理静音切换
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    updateConversationStatusMutation.mutate({ is_muted: newMuteState });
  };
  
  // 处理添加成员
  const handleAddParticipants = () => {
    // 导航到添加成员页面
    navigation.navigate(ROUTES.CHAT.PARTICIPANTS, {
      id,
    });
  };
  
  // 处理成员长按
  const handleParticipantPress = (participant: ChatParticipant) => {
    setSelectedParticipant(participant);
    setIsParticipantsDialogVisible(true);
  };
  
  // 检查当前用户是否是群主
  const isCurrentUserAdmin = () => {
    if (!participantsResponse) return false;
    
    const currentUserParticipant = (participantsResponse || []).find(
      participant => participant.user_id === currentUserId
    );
    
    return currentUserParticipant?.role === 'admin' || currentUserParticipant?.role === 'owner';
  };
  
  // 渲染群组基本信息
  const renderGroupInfo = () => {
    return (
      <View style={styles.groupInfoSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickGroupAvatar}
          disabled={!isEditing}
        >
          {groupAvatar ? (
            <Avatar.Image
              size={80}
              source={{ uri: groupAvatar.uri }}
              style={styles.avatar}
            />
          ) : conversation?.avatar ? (
            <Avatar.Image
              size={80}
              source={{ uri: conversation.avatar }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon
              size={80}
              icon="account-group"
              style={styles.avatar}
            />
          )}
          {isEditing && (
            <View style={styles.editBadge}>
              <IconButton
                icon="camera"
                size={16}
                iconColor={colors.white}
                style={styles.editBadgeButton}
              />
            </View>
          )}
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              label="群组名称"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.textInput}
            />
            <TextInput
              label="群组描述 (可选)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <Text style={styles.groupName}>{conversation?.name}</Text>
            {conversation?.description && (
              <Text style={styles.groupDescription}>{conversation.description}</Text>
            )}
            <Text style={styles.groupMeta}>
              {conversation?.participants?.length || 0}个成员
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // 渲染群组成员
  const renderParticipants = () => {
    if (isLoadingParticipants) {
      return <Loading loading={true} message="加载成员中..." />;
    }
    
    if (participantsError) {
      return (
        <EmptyState
          title="加载失败"
          message="无法加载群组成员，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchParticipants}
        />
      );
    }
    
    if (!participantsResponse || participantsResponse.length === 0) {
      return (
        <EmptyState
          title="暂无成员"
          message="该群组尚未添加成员"
          icon="account-off"
        />
      );
    }
    
    return (
      <View style={styles.participantsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>群组成员</Text>
          {isCurrentUserAdmin() && (
            <Button
              mode="text"
              onPress={handleAddParticipants}
              icon="account-plus"
              compact
            >
              添加成员
            </Button>
          )}
        </View>
        <FlatList
          data={participantsResponse}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => isCurrentUserAdmin() && handleParticipantPress(item)}
              disabled={item.user_id === currentUserId}
            >
              <List.Item
                title={item.name}
                description={item.role === 'owner' ? '群主' : item.role === 'admin' ? '管理员' : '成员'}
                left={() => (
                  <Avatar.Image
                    size={40}
                    source={item.avatar ? { uri: item.avatar } : require('../../assets/logo.png')}
                    style={styles.participantAvatar}
                  />
                )}
                right={() => (item.role === 'owner' || item.role === 'admin') && (
                  <IconButton
                    icon="crown"
                    size={16}
                    iconColor={colors.warning}
                    style={styles.adminBadge}
                  />
                )}
              />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider />}
        />
      </View>
    );
  };
  
  // 渲染设置选项
  const renderSettings = () => {
    return (
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>设置</Text>
        <List.Item
          title="静音通知"
          description="关闭此群组的新消息通知"
          left={() => <List.Icon icon="bell-off" />}
          right={() => (
            <Switch
              value={isMuted}
              onValueChange={handleMuteToggle}
              color={colors.primary}
            />
          )}
        />
        <Divider />
        <List.Item
          title="查看媒体文件"
          description="查看此群组共享的所有媒体文件"
          left={() => <List.Icon icon="file-multiple" />}
          onPress={() => navigation.navigate(ROUTES.CHAT.ATTACHMENTS, { id })}
          right={() => <List.Icon icon="chevron-right" />}
        />
      </View>
    );
  };
  
  // 渲染群组操作
  const renderActions = () => {
    return (
      <View style={styles.actionsSection}>
        <Button
          mode="outlined"
          icon="exit-to-app"
          onPress={() => setIsLeaveDialogVisible(true)}
          style={styles.actionButton}
          textColor={colors.error}
        >
          退出群组
        </Button>
        
        {isCurrentUserAdmin() && (
          <Button
            mode="outlined"
            icon="delete"
            onPress={() => setIsDissolveDialogVisible(true)}
            style={[styles.actionButton, styles.dissolveButton]}
            textColor={colors.error}
          >
            解散群组
          </Button>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <Loading loading={true} message="加载群组信息..." />;
  }
  
  if (error || !conversation) {
    return (
      <EmptyState
        title="加载失败"
        message="无法加载群组信息，请稍后重试"
        icon="alert-circle"
        buttonText="重试"
        onButtonPress={refetch}
      />
    );
  }
  
  return (
    <Container safeArea>
      <Header
        title={isEditing ? "编辑群组" : "群组信息"}
        showBackButton
        onBackPress={handleBack}
        rightIcon={isCurrentUserAdmin() ? (isEditing ? "check" : "pencil") : undefined}
        onRightIconPress={isEditing ? handleSaveGroup : toggleEditMode}
      />
      
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View style={styles.container}>
            {renderGroupInfo()}
            <Divider />
            {renderParticipants()}
            <Divider />
            {renderSettings()}
            <Divider />
            {renderActions()}
          </View>
        )}
        keyExtractor={item => item.key}
      />
      
      {isEditing && (
        <FAB
          icon="check"
          style={styles.saveFab}
          onPress={handleSaveGroup}
          label="保存"
        />
      )}
      
      {/* 成员操作对话框 */}
      <Portal>
        <Dialog visible={isParticipantsDialogVisible} onDismiss={() => setIsParticipantsDialogVisible(false)}>
          <Dialog.Title>{selectedParticipant?.name || '成员'}</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="移出群组"
              left={() => <List.Icon icon="account-remove" color={colors.error} />}
              onPress={() => {
                setIsParticipantsDialogVisible(false);
                if (selectedParticipant) {
                  Alert.alert(
                    '移出成员',
                    `确定要将 ${selectedParticipant.name} 移出群组吗？`,
                    [
                      { text: '取消', style: 'cancel' },
                      { 
                        text: '确定', 
                        onPress: () => selectedParticipant && removeParticipantMutation.mutate(selectedParticipant.id),
                        style: 'destructive'
                      },
                    ]
                  );
                }
              }}
            />
            <List.Item
              title="设为群主"
              left={() => <List.Icon icon="crown" color={colors.warning} />}
              onPress={() => {
                setIsParticipantsDialogVisible(false);
                // 设置新群主的逻辑实现
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsParticipantsDialogVisible(false)}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* 退出群组确认对话框 */}
      <Portal>
        <Dialog visible={isLeaveDialogVisible} onDismiss={() => setIsLeaveDialogVisible(false)}>
          <Dialog.Title>退出群组</Dialog.Title>
          <Dialog.Content>
            <Text>确定要退出此群组吗？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsLeaveDialogVisible(false)}>取消</Button>
            <Button onPress={() => leaveGroupMutation.mutate()} textColor={colors.error}>退出</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* 解散群组确认对话框 */}
      <Portal>
        <Dialog visible={isDissolveDialogVisible} onDismiss={() => setIsDissolveDialogVisible(false)}>
          <Dialog.Title>解散群组</Dialog.Title>
          <Dialog.Content>
            <Text>确定要解散此群组吗？此操作不可撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDissolveDialogVisible(false)}>取消</Button>
            <Button onPress={() => dissolveGroupMutation.mutate()} textColor={colors.error}>解散</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupInfoSection: {
    padding: spacing.medium,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.medium,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  editBadgeButton: {
    margin: 0,
    padding: 0,
  },
  editForm: {
    width: '100%',
  },
  textInput: {
    backgroundColor: 'transparent',
    marginBottom: spacing.medium,
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.grey700,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.grey600,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.grey800,
  },
  participantsSection: {
    backgroundColor: colors.surface,
    marginTop: spacing.small,
  },
  participantAvatar: {
    backgroundColor: colors.grey300,
  },
  adminBadge: {
    margin: 0,
  },
  settingsSection: {
    backgroundColor: colors.surface,
    marginTop: spacing.small,
    paddingVertical: spacing.small,
  },
  actionsSection: {
    padding: spacing.medium,
    marginTop: spacing.small,
    backgroundColor: colors.surface,
  },
  actionButton: {
    marginBottom: spacing.small,
    borderColor: colors.error,
  },
  dissolveButton: {
    backgroundColor: colors.errorLight,
  },
  saveFab: {
    position: 'absolute',
    margin: spacing.medium,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default ChatGroupInfoScreen; 