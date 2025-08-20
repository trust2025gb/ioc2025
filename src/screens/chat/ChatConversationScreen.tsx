/**
 * 聊天会话页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TextInput as RNTextInput,
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  Text,
  Avatar,
  IconButton,
  Menu,
  Divider,
  Button,
  Portal,
  Dialog,
  Badge,
  Chip,
  Snackbar
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
// 避免 Web 端引入 expo-av 导致构建失败
// @ts-ignore
const Audio = (typeof navigator !== 'undefined' && /web/i.test(navigator.userAgent)) ? {} : require('expo-av');
import { useAppSelector } from '../../store/hooks';
import { StorageUtils, STORAGE_KEYS } from '../../utils/storage';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import {
  chatService,
  ChatConversation,
  Message,
  MessageType,
  MessageStatus,
  ChatConversationType,
  MessageAttachment,
  UserStatus
} from '../../api/services/chatService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ChatStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from 'react-native';

// 消息组件props接口
interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  onMessagePress: (message: Message) => void;
  onAttachmentPress: (attachment: MessageAttachment) => void;
  isAi?: boolean;
  onLongPressMessage?: (message: Message) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
}

/**
 * 消息项组件
 * 显示单条消息内容
 */
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  onMessagePress,
  onAttachmentPress,
  isAi,
  onLongPressMessage,
  selectionMode,
  isSelected,
}) => {
  // 处理长按消息
  const handlePress = () => {
    onMessagePress(message);
  };
  const handleLongPress = () => {
    if (onLongPressMessage) onLongPressMessage(message);
    else onMessagePress(message);
  };
  
  // 渲染消息状态图标
  const renderStatusIcon = () => {
    if (!isCurrentUser) return null;
    
    switch (message.status) {
      case MessageStatus.SENDING:
        return <ActivityIndicator size="small" color={colors.grey500} style={styles.statusIcon} />;
      case MessageStatus.SENT:
        return <Icon name="check" size={14} color={colors.grey500} style={styles.statusIcon} />;
      case MessageStatus.DELIVERED:
        return <Icon name="check-all" size={14} color={colors.grey500} style={styles.statusIcon} />;
      case MessageStatus.READ:
        return <Icon name="check-all" size={14} color={colors.primary} style={styles.statusIcon} />;
      case MessageStatus.FAILED:
        return <Icon name="alert-circle" size={14} color={colors.error} style={styles.statusIcon} />;
      default:
        return null;
    }
  };
  
  // 渲染引用消息
  const renderReplyTo = () => {
    if (!message.reply_to) return null;
    
    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyLine} />
        <Text style={styles.replyText} numberOfLines={1}>
          {message.reply_to}
        </Text>
      </View>
    );
  };
  
  // 渲染文本消息
  const renderTextContent = () => {
    return (
      <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
        {message.content}
        {message.is_edited && (
          <Text style={styles.editedText}> (已编辑)</Text>
        )}
      </Text>
    );
  };
  
  // 渲染图片消息
  const renderImageContent = () => {
    if (!message.attachments || message.attachments.length === 0) {
      return renderTextContent();
    }
    
    return (
      <View style={styles.imagesContainer}>
        {message.attachments.map((attachment, index) => (
          <TouchableOpacity
            key={attachment.id || `att-${index}`}
            onPress={() => onAttachmentPress(attachment)}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: (attachment as any).url || (attachment as any).uri }}
              style={styles.imageAttachment}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
        {message.content && (
          <Text style={[
            styles.messageText, 
            styles.imageCaption, 
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        )}
      </View>
    );
  };
  
  // 渲染文件消息
  const renderFileContent = () => {
    if (!message.attachments || message.attachments.length === 0) {
      return renderTextContent();
    }
    
    return (
      <View>
        {message.attachments.map((attachment, index) => (
          <TouchableOpacity
            key={attachment.id || `file-${index}`}
            onPress={() => onAttachmentPress(attachment)}
            style={[
              styles.fileContainer,
              isCurrentUser ? styles.currentUserFile : styles.otherUserFile
            ]}
          >
            <Icon
              name="file-document-outline"
              size={24}
              color={isCurrentUser ? colors.white : colors.primary}
              style={styles.fileIcon}
            />
            <View style={styles.fileInfo}>
              <Text 
                style={[
                  styles.fileName, 
                  isCurrentUser ? styles.currentUserText : styles.otherUserText
                ]}
                numberOfLines={1}
              >
                {attachment.name}
              </Text>
              <Text 
                style={[
                  styles.fileSize, 
                  isCurrentUser ? styles.currentUserFileSize : styles.otherUserFileSize
                ]}
              >
                {formatFileSize(attachment.size)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {message.content && message.content !== '[文件]' && (
          <Text style={[
            styles.messageText, 
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        )}
      </View>
    );
  };

  // 渲染音频消息
  const renderAudioContent = () => {
    // 后端当前将 <audio controls src="..."> 放在 content 中，这里解析 src 简单提取并用 HTML5 audio 播放
    const html = message.content || '';
    const match = html.match(/src\s*=\s*"([^"]+)"/i);
    const src = match ? match[1] : undefined;
    const audioUrl = src || message.attachments?.[0]?.url;

    return (
      <View style={{ maxWidth: '80%' }}>
        {message.content && (
          <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
            {/* 显示时长等文本，去掉HTML标签 */}
            {message.content.replace(/<[^>]+>/g, '')}
          </Text>
        )}
        {audioUrl ? (
          // 在 Web 端可直接使用 audio 标签
          <View style={{ marginTop: 4 }}>
            <Text accessibilityRole="button">
              {/* @ts-ignore: react-native-web 支持 */}
              <audio controls src={audioUrl} style={{ width: 220 }} />
            </Text>
          </View>
        ) : (
          <Text style={styles.messageText}>[音频]</Text>
        )}
      </View>
    );
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // 渲染消息内容
  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return renderImageContent();
      case MessageType.FILE:
        return renderFileContent();
      case MessageType.AUDIO:
        return renderAudioContent();
      case MessageType.SYSTEM:
      case MessageType.NOTIFICATION:
        return (
          <Text style={styles.systemMessage}>
            {message.content}
          </Text>
        );
      default:
        return renderTextContent();
    }
  };

  // 系统消息使用不同的样式
  if (message.type === MessageType.SYSTEM || message.type === MessageType.NOTIFICATION) {
    return (
      <View style={styles.systemMessageContainer}>
        {renderMessageContent()}
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
    >
      {selectionMode && (
        <View style={[styles.selectBadge, isCurrentUser ? { right: 4 } : { left: 4 }]}> 
          <Icon name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={18} color={isSelected ? colors.primary : colors.grey500} />
        </View>
      )}
      {!isCurrentUser && (showAvatar || isAi) && (
        isAi ? (
          <Avatar.Icon
            size={36}
            icon="robot"
            style={[styles.avatar, { backgroundColor: colors.accent }]}
            color={colors.white}
          />
        ) : (
          <Avatar.Image
            size={36}
            source={{ uri: message.sender_avatar || undefined }}
            style={styles.avatar}
          />
        )
      )}
      {!isCurrentUser && !showAvatar && !isAi && <View style={styles.avatarPlaceholder} />}
      
      <View style={[
        styles.messageBubble, 
        isCurrentUser ? styles.currentUserBubble : (isAi ? styles.aiBubble : styles.otherUserBubble)
      ]}>
        {isAi && <Icon name="robot" size={14} color={colors.accent} style={styles.aiBadge} />}
        {message.sender_name ? <Text style={styles.senderName}>{message.sender_name}</Text> : null}
        {renderReplyTo()}
        {renderMessageContent()}
        
        <View style={[styles.messageFooter, isCurrentUser ? { alignSelf: 'flex-end' } : null]}>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isCurrentUser ? renderStatusIcon() : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 格式化日期为YYYY年MM月DD日格式
const formatDateHeader = (timestamp: string) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

/**
 * 日期分割线组件
 */
const DateSeparator: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLineLeft} />
      <Text style={styles.dateText}>{formatDateHeader(timestamp)}</Text>
      <View style={styles.dateLineRight} />
    </View>
  );
};

/**
 * 聊天会话页面组件
 */
const ChatConversationScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  const route = useRoute<RouteProp<ChatStackParamList, typeof ROUTES.CHAT.CONVERSATION>>();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const initialConversation = undefined as any;

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [messageInputText, setMessageInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);
  const [editMessageDialogVisible, setEditMessageDialogVisible] = useState(false);
  const [editedMessageText, setEditedMessageText] = useState('');
  const [deleteMessageDialogVisible, setDeleteMessageDialogVisible] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  // @ts-ignore
const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiRequesting, setAiRequesting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');
  const lastMessageIdRef = useRef<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // 引用消息
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateJson, setTemplateJson] = useState('');

  // refs
  const flatListRef = useRef<FlatList>(null);
  const messageInputRef = useRef<RNTextInput>(null);
  
  // 当前用户ID - 从认证状态获取，回退到固定值
  const authUser = useAppSelector(state => (state as any).auth?.user);
  const currentUserId = String(authUser?.id ?? 'current-user-id');

  // 获取会话详情
  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => chatService.getConversation(id),
    initialData: initialConversation,
  });

  // 获取消息列表
  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => chatService.getMessages(id, { limit: 20 }),
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // 每5秒自动刷新一次
  });

  // 发送消息
  const sendMessageMutation = useMutation({
    mutationFn: (data: {
      content: string;
      type: MessageType;
      replyToId?: string;
      attachments?: any[];
    }) => {
      return chatService.sendMessage({
        conversation_id: id,
        type: data.type,
        content: data.content,
        reply_to: data.replyToId,
        attachments: data.attachments,
      });
    },
    onMutate: async (newMessage) => {
      // 取消任何正在进行的重新获取
      await queryClient.cancelQueries({ queryKey: ['messages', id] });

      // 添加乐观更新
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: id,
        sender_id: currentUserId,
        sender_name: '我',
        type: newMessage.type,
        content: newMessage.content,
        timestamp: new Date().toISOString(),
        status: MessageStatus.SENDING,
        is_edited: false,
        attachments: newMessage.attachments ? 
          newMessage.attachments.map((attachment, index) => ({
            id: `temp-attachment-${index}`,
            name: attachment.name || `附件${index+1}`,
            type: attachment.type || 'application/octet-stream',
            size: attachment.size || 0,
            url: (attachment as any).url || (attachment as any).uri || '' ,
          })) : 
          undefined,
        reply_to: newMessage.replyToId,
      };

      // 乐观地将消息添加到查询缓存
      queryClient.setQueryData(['messages', id], (old: any) => {
        if (!old) return { data: [optimisticMessage], pagination: { total: 1 } };
        return {
          ...old,
          data: [optimisticMessage, ...old.data],
        };
      });
      
      return { optimisticMessage };
    },
    onSuccess: (result, variables, context) => {
      // 发送成功后更新缓存
      if (context?.optimisticMessage) {
        queryClient.setQueryData(['messages', id], (old: any) => {
          if (!old) return { data: [result], pagination: { total: 1 } };
          return {
            ...old,
            data: old.data.map((message: Message) => 
              message.id === context.optimisticMessage.id ? result : message
            ),
          };
        });
        // 滚动到底部
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      }
    },
    onError: (error, variables, context) => {
      console.error('发送消息失败:', error);
      
      // 如果有乐观更新，将其标记为发送失败
      if (context?.optimisticMessage) {
        queryClient.setQueryData(['messages', id], (old: any) => {
          if (!old) return { data: [], pagination: { total: 0 } };
          return {
            ...old,
            data: old.data.map((message: Message) => 
              message.id === context.optimisticMessage.id 
                ? { ...message, status: MessageStatus.FAILED } 
                : message
            ),
          };
        });
      }
    },
    onSettled: () => {
      setSendingMessage(false);
    },
  });

  // 编辑消息
  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) => {
      return chatService.editMessage(messageId, content);
    },
    onSuccess: (updatedMessage) => {
      // 更新缓存中的消息
      queryClient.setQueryData(['messages', id], (old: any) => {
        if (!old) return { data: [], pagination: { total: 0 } };
        return {
          ...old,
          data: old.data.map((message: Message) => 
            message.id === updatedMessage.id ? updatedMessage : message
          ),
        };
      });
      
      setEditMessageDialogVisible(false);
      setSelectedMessage(null);
    },
    onError: (error) => {
      console.error('编辑消息失败:', error);
    },
  });

  // 删除消息
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => {
      return chatService.deleteMessage(messageId);
    },
    onSuccess: () => {
      // 从缓存中删除消息
      queryClient.setQueryData(['messages', id], (old: any) => {
        if (!old) return { data: [], pagination: { total: 0 } };
        return {
          ...old,
          data: old.data.filter((message: Message) => message.id !== selectedMessage?.id),
        };
      });
      
      setDeleteMessageDialogVisible(false);
      setSelectedMessage(null);
    },
    onError: (error) => {
      console.error('删除消息失败:', error);
    },
  });

  // 发送正在输入状态
  const sendTypingStatusMutation = useMutation({
    mutationFn: (isTyping: boolean) => chatService.sendTypingStatus(id, isTyping),
  });

  // 处理页面加载完成后的操作
  useEffect(() => {
    // 标记会话为已读（尊重设置）
    const maybeMarkRead = async () => {
      const settings = await StorageUtils.getItem<any>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      const readReceiptsEnabled = settings ? settings.readReceiptsEnabled !== false : true;
      if (readReceiptsEnabled && conversation && conversation.unread_count > 0) {
        chatService.markConversationAsRead(id).catch(error => {
          console.error('标记会话为已读失败:', error);
        });
      }
    };
    maybeMarkRead();
    // 组件卸载时清除正在输入状态
    return () => {
      sendTypingStatusMutation.mutate(false);
    };
  }, [id, conversation]);

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 导航到群组信息页面
  const navigateToGroupInfo = () => {
    if (conversation && conversation.type === ChatConversationType.GROUP) {
      navigation.navigate(ROUTES.CHAT.GROUP_INFO, {
        id: conversation.id,
      });
    }
  };

  // 导航到附件页面
  const navigateToAttachments = () => {
    navigation.navigate(ROUTES.CHAT.ATTACHMENTS, { id });
  };

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchConversation(), refetchMessages()]);
    setRefreshing(false);
  };

  // 处理消息输入
  const handleMessageInput = (text: string) => {
    setMessageInputText(text);
    
    // 发送正在输入状态
    if (text && !isTyping) {
      setIsTyping(true);
      sendTypingStatusMutation.mutate(true);
    } else if (!text && isTyping) {
      setIsTyping(false);
      sendTypingStatusMutation.mutate(false);
    }
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (sendingMessage) return;
    
    if (!messageInputText.trim() && attachments.length === 0) return;

    setSendingMessage(true);
    
    // 清除输入内容
    const messageContent = messageInputText;
    setMessageInputText('');
    
    // 清除附件
    const currentAttachments = [...attachments];
    setAttachments([]);
    
    // 清除引用消息
    const replyTo = replyToMessage?.id;
    setReplyToMessage(null);
    
    // 清除正在输入状态
    setIsTyping(false);
    sendTypingStatusMutation.mutate(false);
    
    // 确定消息类型
    let messageType = MessageType.TEXT;
    if (currentAttachments.length > 0) {
      if (currentAttachments.every(att => att.type?.startsWith('image/'))) {
        messageType = MessageType.IMAGE;
      } else {
        messageType = MessageType.FILE;
      }
    }
    
    // 发送消息
    sendMessageMutation.mutate({
      content: messageContent || (messageType === MessageType.IMAGE ? '[图片]' : '[文件]'),
      type: messageType,
      replyToId: replyTo,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    });
    
    // 滚动到列表底部
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // 处理选择图片
  const handlePickImage = async () => {
    setShowAttachmentOptions(false);
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要访问相册权限', [{ text: '确定' }]);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        }));
        
        setAttachments(prevAttachments => [...prevAttachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('选择图片出错:', error);
    }
  };

  // 处理拍照
  const handleTakePhoto = async () => {
    setShowAttachmentOptions(false);
    
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要访问相机权限', [{ text: '确定' }]);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAttachment = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        
        setAttachments(prevAttachments => [...prevAttachments, newAttachment]);
      }
    } catch (error) {
      console.error('拍照出错:', error);
    }
  };

  // 处理选择文件
  const handlePickDocument = async () => {
    setShowAttachmentOptions(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name || `file_${Date.now()}`,
          size: asset.size || 0,
        }));
        
        setAttachments(prevAttachments => [...prevAttachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('选择文件出错:', error);
    }
  };

  // 处理移除附件
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prevAttachments => prevAttachments.filter((_, i) => i !== index));
  };

  // 处理消息长按
  const handleMessagePress = (message: Message) => {
    if (selectionMode) {
      setSelectedIds(prev => prev.includes(message.id) ? prev.filter(id => id !== message.id) : [...prev, message.id]);
    } else {
      setSelectedMessage(message);
      setMessageMenuVisible(true);
    }
  };

  const startSelectMessage = (message: Message) => {
    setSelectionMode(true);
    setSelectedIds(prev => prev.includes(message.id) ? prev : [...prev, message.id]);
    setMessageMenuVisible(false);
  };

  const cancelSelection = () => { setSelectionMode(false); setSelectedIds([]); };

  const addSelectedTo = (target: 'lead' | 'customer') => {
    const all = (messagesResponse?.data || []).filter(m => selectedIds.includes(m.id) && m.type === MessageType.TEXT);
    const text = all.map(m => m.content).join('\n');
    const prefill = parseTextToData(text);
    cancelSelection();
    if (target === 'lead') {
      navigation.navigate('LeadsTab' as any, { screen: ROUTES.LEADS.CREATE, params: { prefill } });
    } else {
      navigation.navigate('CustomersTab' as any, { screen: ROUTES.CUSTOMERS.CREATE, params: { prefill } });
    }
  };

  // 解析消息文本为结构化信息（简单规则版）
  const parseTextToData = (text: string) => {
    const data: Record<string, any> = {};

    // 原始文本（保留换行用于行级启发）
    const raw = String(text || '');
    // 标准化文本（用于带标签的正则匹配，不破坏换行逻辑）
    const t = raw.replace(/[\t ]+/g, ' ').trim();

    // 读取模板（可覆盖默认正则）。结构：{ name:[regex,...], phone:[regex,...], ... }
    let tpl: any = null;
    try { tpl = (globalThis as any).__parseTemplates || null; } catch {}

    const matchBy = (key: string, fallbacks: RegExp[]) => {
      const regs = Array.isArray(tpl?.[key]) ? tpl[key].map((s: string) => new RegExp(s, 'i')) : fallbacks;
      for (const r of regs) { const m = t.match(r); if (m) return m; }
      return null;
    };

    // 姓名
    const nameMatch = matchBy('name', [/(姓名|联系人|客户名)[:：]\s*([\u4e00-\u9fa5A-Za-z ]{1,30})/]);
    if (nameMatch) data.name = nameMatch[2].trim();

    // 手机
    const phoneMatch = matchBy('phone', [/(手机|电话|手机号|联系电话)[:：]?\s*(1[3-9]\d{9})/]);
    if (phoneMatch) data.phone = phoneMatch[2];

    // 性别
    const genderMatch = matchBy('gender', [/性别[:：]\s*(男|女|未知|不详)/]);
    if (genderMatch) data.gender = genderMatch[1] === '男' ? 'male' : (genderMatch[1] === '女' ? 'female' : 'unknown');

    // 邮箱
    const emailMatch = matchBy('email', [/(邮箱|电子邮箱|email|e-mail)[:：]?\s*([\w.-]+@[\w.-]+\.[A-Za-z]{2,})/i]);
    if (emailMatch) data.email = emailMatch[2];

    // 微信
    const wechatMatch = matchBy('wechat', [/(微信|微信号|wechat)[:：]?\s*([a-zA-Z][a-zA-Z0-9_-]{5,})/i]);
    if (wechatMatch) data.wechat = wechatMatch[2];

    // 年收入/薪资（统一填入“万元”）
    const incomeMatch = matchBy('annual_income', [/(年收入|年薪|薪资|收入)[:：]?\s*([\d.,]+)\s*([万wWkK千元]?)/]);
    if (incomeMatch) {
      const raw = incomeMatch[2].replace(/,/g, '');
      const num = parseFloat(raw);
      const unit = (incomeMatch[3] || '').toLowerCase();
      if (!isNaN(num)) {
        let wan = num;
        if (unit === '元' || unit === '') { wan = num >= 10000 ? num / 10000 : num / 10000; }
        else if (unit === 'k') { wan = num / 10; }
        else if (unit === '千') { wan = num / 10; }
        else if (unit === 'w' || unit === '万') { wan = num; }
        data.annual_income = String(Math.round(wan * 100) / 100);
      }
    }

    // 身份证/证件
    const idMatch = matchBy('identification_number', [/(身份证|证件号|证件号码)[:：]\s*([0-9A-Za-z]{8,20})/]);
    if (idMatch) data.identification_number = idMatch[2];

    // 出生日期
    const birthMatch = matchBy('birth_date', [/(?:(出生日期|生日)[:：]\s*)?(\d{4})[年\/-](\d{1,2})[月\/-](\d{1,2})日?/]);
    if (birthMatch) {
      const y = birthMatch[2].padStart(4, '0');
      const m = birthMatch[3].padStart(2, '0');
      const d2 = birthMatch[4].padStart(2, '0');
      data.birth_date = `${y}-${m}-${d2}`;
    }

    // 跟进时间
    const followMatch = matchBy('follow_up_date', [/(跟进|下次跟进)(日期|时间)?[:：]\s*(\d{4}[年\/-]\d{1,2}[月\/-]\d{1,2}日?)/]);
    if (followMatch) {
      const dm = followMatch[3].match(/(\d{4})[年\/-](\d{1,2})[月\/-](\d{1,2})/);
      if (dm) data.follow_up_date = `${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}`;
    }

    // 公司
    const companyMatch = matchBy('company', [/(公司|单位|企业)[:：]\s*([^，。\n]{2,})/]);
    if (companyMatch) data.company = companyMatch[2].trim();

    // 职业/职位
    const occMatch = matchBy('occupation', [/(职业|岗位|职位)[:：]\s*([^，。\n]{2,})/]);
    if (occMatch) data.occupation = occMatch[2].trim();

    // 来源/渠道
    const srcMatch = matchBy('source', [/(来源|渠道)[:：]\s*([^，。\n]{1,})/]);
    if (srcMatch) data.source = srcMatch[2].trim();

    // 邮编
    const zipMatch = matchBy('postal_code', [/(邮编|邮政编码)[:：]?\s*(\d{6})/]);
    if (zipMatch) data.postal_code = zipMatch[2];

    // 地址
    const addrMatch = matchBy('address', [/地址[:：]\s*([^\n。]*)/]);
    if (addrMatch) {
      const addr = addrMatch[1].trim();
      data.address = addr;
      let m = addr.match(/(?:(.+?)省)?(?:(.+?)市)?(?:(.+?)(?:区|县))?(.*)/);
      if (m) {
        if (m[1]) data.province = m[1];
        if (m[2]) data.city = m[2];
        if (m[3]) data.district = m[3];
      }
      // 若仍未识别出省/市/区，尝试“山东济南历城区”无助词格式
      if (!data.province && !data.city && !data.district) {
        const m2 = addr.match(/^([\u4e00-\u9fa5]{2,})?([\u4e00-\u9fa5]{2,})?([\u4e00-\u9fa5]{2,})(?:区|县)$/);
        if (m2) {
          if (m2[1]) data.province = m2[1];
          if (m2[2]) data.city = m2[2];
          if (m2[3]) data.district = m2[3];
        }
      }
    }

    // === 无标签时的行级启发式解析 ===
    const lines = raw.split(/[\n\r]+/).map(s => s.trim()).filter(Boolean);
    for (const line of lines) {
      if (!data.phone && /^1[3-9]\d{9}$/.test(line)) { data.phone = line; continue; }
      if (!data.gender && /^(男|女)$/.test(line)) { data.gender = line === '男' ? 'male' : 'female'; continue; }
      if (!data.annual_income) {
        const m = line.match(/([\d.]+)\s*万/); if (m) { data.annual_income = m[1]; continue; }
      }
      if (!data.birth_date) {
        const m = line.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/); if (m) { data.birth_date = `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`; continue; }
      }
      if (!data.quality_grade) {
        const m = line.match(/([ABCD])级/i); if (m) { data.quality_grade = m[1].toUpperCase(); continue; }
      }
      if (!data.priority) {
        if (line === '高') data.priority = 'high';
        else if (line === '中') data.priority = 'medium';
        else if (line === '低') data.priority = 'low';
      }
      if (!data.value_grade) {
        if (line === '高') data.value_grade = 'high';
        else if (line === '中') data.value_grade = 'medium';
        else if (line === '低') data.value_grade = 'low';
      }
      if (!data.address && /[省市区县]$/.test(line) || /[区县]/.test(line)) {
        // 例如：山东济南历城区
        data.address = line;
        const dm = line.match(/(?:(.+?)省)?(?:(.+?)市)?(?:(.+?)(?:区|县))?/);
        if (dm) { if (dm[1]) data.province = dm[1]; if (dm[2]) data.city = dm[2]; if (dm[3]) data.district = dm[3]; }
        continue;
      }
      if (!data.name && /^[\u4e00-\u9fa5]{2,6}$/.test(line)) { data.name = line; continue; }
      if (!data.occupation && /^[\u4e00-\u9fa5A-Za-z]{2,10}$/.test(line) && !/[省市区县]/.test(line)) { data.occupation = line; continue; }
    }

    return data;
  };

  // 导出模板
  const exportTemplates = async () => {
    const tpl = (globalThis as any).__parseTemplates || {};
    const json = JSON.stringify(tpl, null, 2);
    setTemplateJson(json);
    setTemplateModalVisible(true);
  };

  // 导入模板
  const importTemplates = async () => {
    try {
      const obj = JSON.parse(templateJson || '{}');
      // 简单校验：对象的每个值应为字符串数组
      Object.keys(obj).forEach(k => { if (!Array.isArray(obj[k])) throw new Error('模板格式需为 { key: [regexString...] }'); });
      // 存入全局（会话级）
      (globalThis as any).__parseTemplates = obj;
      setTemplateModalVisible(false);
      Alert.alert('模板已导入', '新的解析规则已生效');
    } catch (e:any) {
      Alert.alert('导入失败', String(e?.message || e));
    }
  };

  const addToLead = () => {
    if (!selectedMessage) return;
    setMessageMenuVisible(false);
    const prefill = parseTextToData(selectedMessage.content || '');
    // 预览调试（可去掉）
    // Alert.alert('将要预填的字段', JSON.stringify(prefill, null, 2));
    navigation.navigate('LeadsTab' as any, {
      screen: ROUTES.LEADS.CREATE,
      params: { prefill }
    });
  };

  const addToCustomer = () => {
    if (!selectedMessage) return;
    setMessageMenuVisible(false);
    const prefill = parseTextToData(selectedMessage.content || '');
    // Alert.alert('将要预填的字段', JSON.stringify(prefill, null, 2));
    navigation.navigate('CustomersTab' as any, {
      screen: ROUTES.CUSTOMERS.CREATE,
      params: { prefill }
    });
  };

  // 处理编辑消息
  const handleEditMessage = () => {
    setMessageMenuVisible(false);
    
    if (selectedMessage) {
      setEditedMessageText(selectedMessage.content);
      setEditMessageDialogVisible(true);
    }
  };

  // 处理删除消息
  const handleDeleteMessage = () => {
    setMessageMenuVisible(false);
    setDeleteMessageDialogVisible(true);
  };

  // 处理回复消息
  const handleReplyMessage = () => {
    setMessageMenuVisible(false);
    
    if (selectedMessage) {
      setReplyToMessage(selectedMessage);
      messageInputRef.current?.focus();
    }
  };

  // 处理取消回复
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // 处理附件点击
  const handleAttachmentPress = (attachment: MessageAttachment) => {
    // 打开附件
    const openUrl = (attachment as any).url || (attachment as any).uri;
    if (openUrl) {
      WebBrowser.openBrowserAsync(openUrl);
    }
  };

  // 格式化消息时间
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 确定是否显示消息日期分割线
  const shouldShowDateSeparator = (message: Message, index: number, messages: Message[]) => {
    // 按时间正序渲染：在当天第一条消息前显示日期
    if (index === 0) return true;
    const currentDate = new Date(message.timestamp);
    const prevDate = new Date(messages[index - 1].timestamp);
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  // 确定是否显示头像
  const shouldShowAvatar = (message: Message, index: number, messages: Message[]) => {
    if (index === 0) return true;
    
    const currentSender = message.sender_id;
    const prevSender = messages[index - 1].sender_id;
    
    return currentSender !== prevSender;
  };

  // 在 Web 平台禁用录音相关逻辑，避免类型与 API 不兼容导致编译失败
  // @ts-ignore
  const isWeb = Platform.OS === 'web';

  // @ts-ignore
const startRecording = async () => {
    try {
      if (isWeb) {
        Alert.alert('提示', 'Web 端录音暂未接入原生麦克风，请使用附件中的“相机/文件”发送音频');
        return;
      }
      const permission = await (Audio as any).requestPermissionsAsync();
      if (!permission.granted) { Alert.alert('提示','需要麦克风权限'); return; }
      await (Audio as any).setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new (Audio as any).Recording();
      await rec.prepareToRecordAsync(((Audio as any).RecordingOptionsPresets?.HIGH_QUALITY) as any);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      setIsRecording(false); setRecording(null);
      Alert.alert('录音失败', String(e));
    }
  };

  // @ts-ignore
const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setIsRecording(false); setRecording(null);
        if (!uri) return;
        // 读取文件并上传
        const info = await FileSystem.getInfoAsync(uri);
        const file: any = { uri, name: uri.split('/').pop() || 'audio.m4a', type: 'audio/m4a' };
        let duration = 0;
        try { const s = await recording.getStatusAsync(); duration = Math.floor((s.durationMillis||0)/1000); } catch {}
        const msg = await chatService.uploadAudio(id, file, duration);
        // 刷新消息
        refetchMessages();
      }
    } catch (e) {
      Alert.alert('上传失败', String(e));
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording(); else startRecording();
  };

  const sendToAi = async () => {
    try {
      const text = messageInputText.trim();
      if (!text) { Alert.alert('提示','请输入要咨询的问题'); return; }
      setAiRequesting(true);
      const aiMsg = await chatService.requestAiReply(id, text);
      setMessageInputText('');
      refetchMessages();
    } catch (e) {
      Alert.alert('AI助手','请求失败，请稍后再试');
    } finally { setAiRequesting(false); }
  };

  // 当消息数据变化，检测是否有新消息
  useEffect(() => {
    const list = messagesResponse?.data || [];
    if (list.length === 0) return;
    const latest = list[list.length - 1];
    if (lastMessageIdRef.current && latest.id !== lastMessageIdRef.current) {
      const isIncoming = String(latest.sender_id) !== currentUserId;
      if (isIncoming && notificationsEnabled) {
        setSnackbarText('收到新消息');
        setSnackbarVisible(true);
      }
    }
    lastMessageIdRef.current = latest.id;
  }, [messagesResponse, notificationsEnabled]);

  // 组件剩余部分将在后续添加

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      {/* 头部 */}
      <Header
        title={conversation?.name || '聊天会话'}
        subtitle={
          conversation?.type === ChatConversationType.GROUP ? 
          `${conversation?.participants?.length || 0} 名成员` : 
          conversation?.participants?.length ? 
            conversation.participants[0].status === UserStatus.ONLINE ? '在线' : '离线' 
            : ''
        }
        showBackButton={true}
        onBackPress={handleBack}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      {/* 头部菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={toggleMenu}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        {conversation?.type === ChatConversationType.GROUP && (
          <Menu.Item
            onPress={() => {
              toggleMenu();
              navigateToGroupInfo();
            }}
            title="群组信息"
            leadingIcon="account-group"
          />
        )}
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToAttachments();
          }}
          title="浏览附件"
          leadingIcon="file-document-multiple"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            // 搜索会话实现
            navigation.navigate(ROUTES.CHAT.SEARCH, { initialQuery: conversation?.name });
          }}
          title="搜索消息"
          leadingIcon="magnify"
        />
      </Menu>

      {/* 加载提示 */}
      {(isLoadingConversation || isLoadingMessages) && !refreshing ? (
        <Loading loading={true} message="加载消息..." />
      ) : conversationError || messagesError ? (
        <EmptyState
          title="加载失败"
          message="无法加载消息，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={() => {
            refetchConversation();
            refetchMessages();
          }}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* 消息列表 */}
          {messagesResponse && messagesResponse.data.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={[...messagesResponse.data].reverse()} // 正序显示：最旧在上，最新在底部
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              // inverted={true} // 去除反转，避免文本倒置
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onEndReached={() => {}}
              onEndReachedThreshold={0.3}
              ListFooterComponent={null}
              renderItem={({ item: message, index }) => {
                const messagesArr = [...messagesResponse.data].reverse();
                const showDate = shouldShowDateSeparator(
                  message,
                  index,
                  messagesArr
                );
                const showAvatar = shouldShowAvatar(
                  message,
                  index,
                  messagesArr
                );
                // 更稳健的 AI 消息识别：后端 metadata 标记 / 固定 sender_id / 名称关键词
                const isAi = !!(message.metadata?.is_ai || message.sender_id === 'ai' || /助手|AI|智能/i.test(message.sender_name || ''));
                const isCurrentUser = isAi ? false : (String(message.sender_id) === String(currentUserId));
                const isSelected = selectedIds.includes(message.id);
                return (
                  <View>
                    {showDate && <DateSeparator timestamp={message.timestamp} />}
                    <MessageItem
                      message={message}
                      isCurrentUser={isCurrentUser}
                      showAvatar={showAvatar}
                      onMessagePress={handleMessagePress}
                      onLongPressMessage={startSelectMessage}
                      onAttachmentPress={handleAttachmentPress}
                      isAi={isAi}
                      selectionMode={selectionMode}
                      isSelected={isSelected}
                    />
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>没有消息</Text>
              <Text style={styles.emptySuggestion}>发送第一条消息开始对话吧</Text>
            </View>
          )}

          {/* 正在输入提示 */}
          {conversation?.typing_users?.length > 0 && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>
                {conversation.typing_users.join(', ')} 正在输入...
              </Text>
            </View>
          )}

          {/* 回复预览 */}
          {replyToMessage && (
            <View style={styles.replyPreviewContainer}>
              <View style={styles.replyPreviewContent}>
                <Icon name="reply" size={16} color={colors.primary} style={styles.replyPreviewIcon} />
                <View style={styles.replyPreviewTextContainer}>
                  <Text style={styles.replyPreviewTitle}>
                    回复 {replyToMessage.sender_id === currentUserId ? '自己' : replyToMessage.sender_name}
                  </Text>
                  <Text style={styles.replyPreviewMessage} numberOfLines={1}>
                    {replyToMessage.content}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={16}
                onPress={handleCancelReply}
                style={styles.replyPreviewClose}
              />
            </View>
          )}

          {/* 附件预览 */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsPreviewContainer}>
              <FlatList
                horizontal
                                 data={attachments}
                 keyExtractor={(item, index) => (item.name ? `${item.name}-${index}` : `attachment-${index}`)}
                 renderItem={({ item, index }) => (
                  <View style={styles.attachmentPreviewItem}>
                    {item.type?.startsWith('image/') ? (
                      <Image source={{ uri: item.uri }} style={styles.attachmentPreviewImage} />
                    ) : (
                      <View style={styles.attachmentPreviewFile}>
                        <Icon name="file-document-outline" size={24} color={colors.primary} />
                        <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    )}
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => handleRemoveAttachment(index)}
                      style={styles.attachmentPreviewRemove}
                    />
                  </View>
                )}
              />
            </View>
          )}

          {/* 输入区域 */}
          <View style={styles.inputContainer}>
            <View style={styles.sideControls}>
              <IconButton
                icon={showAttachmentOptions ? "close" : "plus"}
                style={styles.attachButton}
                iconColor={colors.primary}
                onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
              />
              <IconButton
                icon={isRecording ? "stop" : "microphone"}
                iconColor={isRecording ? colors.error : colors.secondary}
                onPress={toggleRecording}
                disabled={sendingMessage}
              />
            </View>
            <RNTextInput
              ref={messageInputRef}
              style={[styles.textInput]}
              placeholder="输入消息..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={messageInputText}
              onChangeText={handleMessageInput}
              onFocus={() => setShowAttachmentOptions(false)}
            />
            <View style={styles.sideControls}>
              <IconButton
                icon="send"
                iconColor={colors.primary}
                onPress={handleSendMessage}
                disabled={!messageInputText.trim() && attachments.length === 0 || sendingMessage}
              />
              <IconButton
                icon={aiRequesting ? "robot" : "robot-outline"}
                iconColor={aiRequesting ? colors.info : colors.accent}
                onPress={sendToAi}
                disabled={aiRequesting}
              />
            </View>
          </View>

          {/* 附件选项 */}
          {showAttachmentOptions && (
            <View style={styles.attachmentOptions}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickImage}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: colors.primary }]}>
                  <Icon name="image" size={20} color={colors.white} />
                </View>
                <Text style={styles.attachmentOptionText}>图片</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleTakePhoto}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: colors.secondary }]}>
                  <Icon name="camera" size={20} color={colors.white} />
                </View>
                <Text style={styles.attachmentOptionText}>相机</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePickDocument}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: colors.error }]}>
                  <Icon name="file-document" size={20} color={colors.white} />
                </View>
                <Text style={styles.attachmentOptionText}>文件</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* 多选操作栏 */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={{ marginRight: 12 }}>已选 {selectedIds.length} 条</Text>
          <Button mode="contained" compact onPress={() => addSelectedTo('lead')} style={{ marginRight: 8 }}>添加到线索</Button>
          <Button mode="contained-tonal" compact onPress={() => addSelectedTo('customer')} style={{ marginRight: 8 }}>添加到客户</Button>
          <Button onPress={cancelSelection}>取消</Button>
        </View>
      )}

      {/* 消息操作菜单 */}
      <Menu
        visible={messageMenuVisible}
        onDismiss={() => setMessageMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.messageMenu}
      >
        <Menu.Item
          onPress={handleReplyMessage}
          title="回复"
          leadingIcon="reply"
        />
        <Menu.Item onPress={exportTemplates} title="导出解析模板" leadingIcon="export" />
        <Divider />
        <Menu.Item
          onPress={addToLead}
          title="添加到线索"
          leadingIcon="account-plus"
        />
        <Menu.Item
          onPress={addToCustomer}
          title="添加到客户"
          leadingIcon="account"
        />
        {selectedMessage?.sender_id === currentUserId && 
         selectedMessage?.type === MessageType.TEXT && (
          <>
            <Menu.Item
              onPress={handleEditMessage}
              title="编辑"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={handleDeleteMessage}
              title="删除"
              leadingIcon="delete"
            />
          </>
        )}
      </Menu>

      {/* 编辑消息对话框 */}
      <Portal>
        <Dialog visible={editMessageDialogVisible} onDismiss={() => setEditMessageDialogVisible(false)}>
          <Dialog.Title>编辑消息</Dialog.Title>
          <Dialog.Content>
            <RNTextInput
              value={editedMessageText}
              onChangeText={setEditedMessageText}
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditMessageDialogVisible(false)}>取消</Button>
            <Button
              onPress={() => {
                if (selectedMessage && editedMessageText.trim()) {
                  editMessageMutation.mutate({
                    messageId: selectedMessage.id,
                    content: editedMessageText.trim()
                  });
                }
              }}
              disabled={!editedMessageText.trim()}
            >
              保存
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 删除消息确认对话框 */}
      <Portal>
        <Dialog visible={deleteMessageDialogVisible} onDismiss={() => setDeleteMessageDialogVisible(false)}>
          <Dialog.Title>删除消息</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除这条消息吗？此操作不可撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteMessageDialogVisible(false)}>取消</Button>
            <Button
              onPress={() => {
                if (selectedMessage) {
                  deleteMessageMutation.mutate(selectedMessage.id);
                }
              }}
              color={colors.error}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 新消息提示 */}
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
        {snackbarText}
      </Snackbar>

      {/* 模板导入/导出弹窗（简单文本） */}
      <Portal>
        <Dialog visible={templateModalVisible} onDismiss={() => setTemplateModalVisible(false)}>
          <Dialog.Title>解析模板（JSON）</Dialog.Title>
          <Dialog.Content>
            <RNTextInput
              style={{ minHeight: 200 }}
              multiline
              value={templateJson}
              onChangeText={setTemplateJson}
            />
            <Text style={{ marginTop: 8 }}>格式示例: {`{"phone": ["(手机|电话)[:：]?\\s*(1[3-9]\\d{9})"]}`}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTemplateModalVisible(false)}>关闭</Button>
            <Button onPress={importTemplates}>导入</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

export default ChatConversationScreen; 

const styles = StyleSheet.create({
  statusIcon: { marginLeft: 4 },
  replyContainer: { marginBottom: 4 },
  replyLine: { width: 2, backgroundColor: colors.grey300, marginRight: 6 },
  replyText: { color: colors.textSecondary, fontSize: 12 },
  messageText: { fontSize: 14 },
  editedText: { fontSize: 10, color: colors.textTertiary },
  imagesContainer: { flexDirection: 'row', gap: 8 },
  imageWrapper: { marginRight: 8 },
  imageAttachment: { width: 120, height: 90, borderRadius: 8 },
  imageCaption: { fontSize: 12 },
  fileContainer: { flexDirection: 'row', alignItems: 'center' },
  currentUserFile: {},
  otherUserFile: {},
  fileIcon: { marginRight: 8 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 12 },
  fileSize: { fontSize: 12 },
  systemMessage: { textAlign: 'center', color: colors.textSecondary },
  systemMessageContainer: { paddingVertical: 8 },
  messageContainer: { flexDirection: 'row', paddingHorizontal: 12, width: '100%', marginVertical: 8 }, 
  currentUserContainer: { justifyContent: 'flex-end', alignSelf: 'flex-end' },
  otherUserContainer: { justifyContent: 'flex-start', alignSelf: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32 },
  messageBubble: { padding: 12, borderRadius: 14, maxWidth: '86%', shadowColor: '#00000022', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  currentUserBubble: { alignSelf: 'flex-end', backgroundColor: colors.successLight },
  otherUserBubble: { alignSelf: 'flex-start', backgroundColor: colors.grey50, borderWidth: 0 }, 

  aiBubble: { backgroundColor: '#FDE7EF' },
  aiBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.white, borderRadius: 10, padding: 2, elevation: 1 },
  senderName: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  messageTime: { fontSize: 10, color: colors.textTertiary },
  currentUserTime: {},
  otherUserTime: {},
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dateLineLeft: { flex: 1, height: 1, backgroundColor: colors.divider },
  dateText: { fontSize: 12, color: colors.textSecondary, marginHorizontal: 8 },
  dateLineRight: { flex: 1, height: 1, backgroundColor: colors.divider },
  menu: { marginTop: 8 },
  keyboardAvoidingContainer: { flex: 1 },
  messageList: { padding: 12, paddingTop: 8, paddingBottom: 16 },
  loadingMore: { marginVertical: 8 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  emptySuggestion: { fontSize: 12, color: colors.textTertiary },
  typingContainer: { paddingHorizontal: 12 },
  typingText: { fontSize: 12, color: colors.textSecondary },
  replyPreviewContainer: { paddingHorizontal: 12 },
  replyPreviewContent: { flexDirection: 'row', alignItems: 'center' },
  replyPreviewIcon: { marginRight: 6 },
  replyPreviewTextContainer: { flex: 1 },
  replyPreviewTitle: { fontSize: 12, color: colors.textSecondary },
  replyPreviewMessage: { fontSize: 12, color: colors.textTertiary },
  replyPreviewClose: { position: 'absolute', right: 0 },
  attachmentsPreviewContainer: { paddingHorizontal: 12 },
  attachmentPreviewItem: { marginRight: 8 },
  attachmentPreviewImage: { width: 60, height: 60, borderRadius: 8 },
  attachmentPreviewFile: { width: 60, height: 60, borderRadius: 8, backgroundColor: colors.grey200, alignItems: 'center', justifyContent: 'center' },
  attachmentPreviewName: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  attachmentPreviewRemove: { position: 'absolute', top: -6, right: -6 },
  inputContainer: { flexDirection: 'row', alignItems: 'stretch', padding: 8 },
  sideControls: { width: 44, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  attachButton: { marginRight: 0 },
  textInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 8, paddingBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, backgroundColor: colors.surface, marginHorizontal: 8 },
  sendButton: { marginLeft: 0 },
  attachmentOptions: { flexDirection: 'row', padding: 12 },
  attachmentOption: { alignItems: 'center', marginRight: 16 },
  attachmentOptionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  attachmentOptionText: { fontSize: 12 },
  messageMenu: { marginTop: 8 },
  dialogInput: { minHeight: 80 },
  currentUserText: { color: colors.textPrimary },
  otherUserText: { color: colors.textPrimary },
  currentUserFileSize: { color: colors.textTertiary, fontSize: 10 },
  otherUserFileSize: { color: colors.textTertiary, fontSize: 10 },
  selectBadge: { position: 'absolute', top: -6, zIndex: 2, backgroundColor: 'transparent' },
  selectionBar: { position: 'absolute', top: 48, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, elevation: 2 },
}); 