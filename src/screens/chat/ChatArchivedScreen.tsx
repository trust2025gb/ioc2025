import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatService, ChatConversation } from '../../api/services/chatService';
import { useQuery } from '@tanstack/react-query';

const ChatArchivedScreen = () => {
  const navigation = useNavigation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations-archived'],
    queryFn: () => chatService.getConversations({ is_archived: true }),
  });

  const conversations: ChatConversation[] = data?.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>返回</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' }}>已归档会话</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>刷新</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={{ fontSize: 16 }}>{item.name || '未命名会话'}</Text>
              <Text style={{ color: '#999', marginTop: 4 }}>类型：{item.type}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 24 }}>暂无归档会话</Text>}
        />
      )}
    </View>
  );
};

export default ChatArchivedScreen; 