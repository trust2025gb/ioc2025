/**
 * 聊天服务
 * 处理聊天相关的API请求
 */

import { apiClient } from '../client';
import { Platform } from 'react-native';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * 聊天会话类型枚举
 */
export enum ChatConversationType {
  PRIVATE = 'private',    // 私聊
  GROUP = 'group',        // 群聊
  SUPPORT = 'support',    // 客服支持
  AI = 'ai'               // AI助手
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',          // 文本消息
  IMAGE = 'image',        // 图片消息
  FILE = 'file',          // 文件消息
  AUDIO = 'audio',        // 语音消息
  VIDEO = 'video',        // 视频消息
  LOCATION = 'location',  // 位置消息
  SYSTEM = 'system',      // 系统消息
  NOTIFICATION = 'notification' // 通知消息
}

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  SENDING = 'sending',    // 发送中
  SENT = 'sent',          // 已发送
  DELIVERED = 'delivered',// 已送达
  READ = 'read',          // 已读
  FAILED = 'failed'       // 发送失败
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ONLINE = 'online',      // 在线
  OFFLINE = 'offline',    // 离线
  AWAY = 'away',          // 离开
  BUSY = 'busy',          // 忙碌
  DO_NOT_DISTURB = 'do_not_disturb' // 勿扰
}

/**
 * 聊天会话接口
 */
export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  name?: string;
  avatar?: string;
  last_message?: Message;
  unread_count: number;
  participants: ChatParticipant[];
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
  metadata?: Record<string, any>;
}

/**
 * 聊天参与者接口
 */
export interface ChatParticipant {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: UserStatus;
  last_active?: string;
  is_typing?: boolean;
}

/**
 * 消息接口
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  type: MessageType;
  content: string;
  timestamp: string;
  status: MessageStatus;
  is_edited: boolean;
  reply_to?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

/**
 * 消息附件接口
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
}

/**
 * 创建群组请求接口
 */
export interface CreateGroupRequest {
  name: string;
  participants: string[]; // 用户ID数组
  avatar?: any; // FormData形式的文件
  description?: string;
}

/**
 * 发送消息请求接口
 */
export interface SendMessageRequest {
  conversation_id: string;
  type: MessageType;
  content: string;
  reply_to?: string;
  attachments?: any[]; // FormData形式的文件数组
  metadata?: Record<string, any>;
}

/**
 * 聊天服务类
 */
class ChatService {
  /**
   * 获取聊天会话列表
   */
  async getConversations(params?: { 
    type?: ChatConversationType;
    search?: string;
    is_archived?: boolean;
  } & QueryParams): Promise<PaginatedResponse<ChatConversation>> {
    const response = await apiClient.get<PaginatedResponse<ChatConversation>>('/api/chat/conversations', params);
    return response;
  }

  /**
   * 获取（或创建）AI 助手会话
   */
  async getAiAssistantConversation(): Promise<ChatConversation> {
    const response = await apiClient.get<ChatConversation>('/api/chat/conversations/ai-assistant');
    return response;
  }

  /**
   * 获取单个聊天会话详情
   */
  async getConversation(id: string): Promise<ChatConversation> {
    const response = await apiClient.get<ChatConversation>(`/api/chat/conversations/${id}`);
    return response;
  }

  /**
   * 创建新的私聊会话
   */
  async createPrivateConversation(userId: string): Promise<ChatConversation> {
    const response = await apiClient.post<ChatConversation>('/api/chat/conversations/private', {
      participant_id: userId
    });
    return response;
  }

  /**
   * 创建新的群聊会话
   */
  async createGroupConversation(data: CreateGroupRequest): Promise<ChatConversation> {
    // 创建FormData
    const formData = new FormData();
    formData.append('name', data.name);
    data.participants.forEach(userId => {
      formData.append('participants[]', userId);
    });
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await apiClient.post<ChatConversation>(
      '/api/chat/conversations/group',
      formData
    );
    
    return response;
  }

  /**
   * 获取聊天会话消息
   */
  async getMessages(conversationId: string, params?: {
    before?: string; // 时间戳，获取此时间戳之前的消息
    limit?: number;
  } & QueryParams): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      `/api/chat/conversations/${conversationId}/messages`,
      params
    );
    return response;
  }

  /**
   * 发送消息
   */
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    // 如果有附件，使用FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('conversation_id', data.conversation_id);
      formData.append('type', data.type);
      formData.append('content', data.content);

      if (data.reply_to) {
        formData.append('reply_to', data.reply_to);
      }

      // 逐个处理附件：Web 端将 uri 转为 Blob/File；原生直接 { uri, name, type }
      for (const attachment of data.attachments) {
        const name = (attachment as any).name || `file_${Date.now()}`;
        const type = (attachment as any).type || 'application/octet-stream';
        const uri = (attachment as any).uri || (attachment as any).url;
        if (Platform.OS === 'web' && uri) {
          const res = await fetch(uri);
          const blob = await res.blob();
          const file = new File([blob], name, { type: type || blob.type });
          formData.append('attachments[]', file as any);
        } else if (uri) {
          formData.append('attachments[]', { uri, name, type } as any);
        } else {
          // 已是 File/Blob 的情况
          formData.append('attachments[]', attachment as any);
        }
      }

      if (data.metadata) {
        formData.append('metadata', JSON.stringify(data.metadata));
      }

      const response = await apiClient.post<Message>('/api/chat/messages', formData);
       
      return response;
    } else {
      // 无附件，使用JSON
      const response = await apiClient.post<Message>('/api/chat/messages', data);
      return response;
    }
  }

  /**
   * 更新消息状态（已读、已送达等）
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message> {
    const response = await apiClient.put<Message>(`/api/chat/messages/${messageId}/status`, {
      status
    });
    return response;
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/api/chat/messages/${messageId}`);
  }

  /**
   * 编辑消息
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await apiClient.put<Message>(`/api/chat/messages/${messageId}`, {
      content
    });
    return response;
  }

  /**
   * 获取聊天参与者列表
   */
  async getParticipants(conversationId: string): Promise<ChatParticipant[]> {
    const response = await apiClient.get<ChatParticipant[]>(
      `/api/chat/conversations/${conversationId}/participants`
    );
    return response;
  }

  /**
   * 添加参与者到群聊
   */
  async addParticipants(conversationId: string, userIds: string[]): Promise<ChatParticipant[]> {
    const response = await apiClient.post<ChatParticipant[]>(
      `/api/chat/conversations/${conversationId}/participants`,
      { user_ids: userIds }
    );
    return response;
  }

  /**
   * 移除群聊参与者
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}/participants/${userId}`);
  }

  /**
   * 更新群聊信息
   */
  async updateGroup(conversationId: string, data: {
    name?: string;
    avatar?: any; // FormData形式的文件
    description?: string;
  }): Promise<ChatConversation> {
    // 使用FormData处理文件上传；否则发送JSON
    let payload: any = data;
    if (data.avatar) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('avatar', data.avatar as any);
      payload = formData;
    }

    const response = await apiClient.put<ChatConversation>(
      `/api/chat/conversations/${conversationId}`,
      payload
    );
     
    return response;
  }

  /**
   * 将会话标记为已读
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    await apiClient.put(`/api/chat/conversations/${conversationId}/read`);
  }

  /**
   * 更新会话状态（置顶、静音、归档）
   */
  async updateConversationStatus(conversationId: string, data: {
    is_pinned?: boolean;
    is_muted?: boolean;
    is_archived?: boolean;
  }): Promise<ChatConversation> {
    const response = await apiClient.put<ChatConversation>(
      `/api/chat/conversations/${conversationId}/status`,
      data
    );
    return response;
  }

  /**
   * 离开群聊
   */
  async leaveGroup(conversationId: string): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}/leave`);
  }

  /**
   * 解散群聊
   */
  async dissolveGroup(conversationId: string): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}`);
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(status: UserStatus): Promise<void> {
    await apiClient.put('/api/chat/user/status', { status });
  }

  /**
   * 获取用户在线状态
   */
  async getUserStatus(userId: string): Promise<UserStatus> {
    const response = await apiClient.get<{ status: UserStatus }>(
      `/api/chat/user/${userId}/status`
    );
    return response.status;
  }

  /**
   * 发送正在输入状态
   */
  async sendTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    await apiClient.put(`/api/chat/conversations/${conversationId}/typing`, {
      is_typing: isTyping
    });
  }

  /**
   * 获取客服支持会话
   */
  async getSupportConversation(): Promise<ChatConversation> {
    const response = await apiClient.get<ChatConversation>('/api/chat/conversations/support');
    return response;
  }

  async uploadAudio(conversationId: string, audioFile: any, duration?: number): Promise<Message> {
    const form = new FormData();
    form.append('audio', audioFile as any);
    if (duration !== undefined) form.append('duration', String(duration));
    const response = await apiClient.post<Message>(`/api/chat/conversations/${conversationId}/audio`, form);
    return response;
  }

  async requestAiReply(conversationId: string, message: string): Promise<Message> {
    const response = await apiClient.post<Message>(`/api/chat/conversations/${conversationId}/ai-reply`, { message });
    return response;
  }
}

export const chatService = new ChatService(); 