import React, { useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { Container, Header, Loading, EmptyState } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { chatService, Message, MessageType } from '../../api/services/chatService';

const isAttachmentMessage = (m: Message) => {
  if (m.attachments && m.attachments.length > 0) return true;
  return [MessageType.IMAGE, MessageType.FILE, MessageType.AUDIO, MessageType.VIDEO].includes(m.type);
};

const ChatAttachmentsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  const route = useRoute<any>();
  const id = route.params?.id as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['chat-attachments', id],
    queryFn: () => chatService.getMessages(id, { limit: 200 }),
  });

  const items = useMemo(() => {
    const msgs = data?.data || [];
    return msgs.filter(isAttachmentMessage).flatMap((m) => {
      if (!m.attachments || m.attachments.length === 0) {
        return [{
          key: m.id,
          title: m.type.toUpperCase(),
          subtitle: new Date(m.timestamp).toLocaleString(),
          url: m.content,
          thumbnail: m.type === MessageType.IMAGE ? m.content : undefined,
        }];
      }
      return m.attachments.map((a) => ({
        key: `${m.id}-${a.id}`,
        title: a.name || a.type,
        subtitle: new Date(m.timestamp).toLocaleString(),
        url: a.url,
        thumbnail: a.thumbnail_url || (a.type.startsWith('image') ? a.url : undefined),
      }));
    });
  }, [data]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => Linking.openURL(item.url)}>
      <Avatar.Image size={40} source={item.thumbnail ? { uri: item.thumbnail } : require('../../assets/logo.png')} />
      <View style={styles.itemText}>
        <Text numberOfLines={1}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <Loading loading={true} message="加载附件..." />;
  if (error) return (
    <EmptyState title="加载失败" message="无法获取附件" icon="alert-circle" buttonText="重试" onButtonPress={() => refetch()} />
  );

  return (
    <Container safeArea>
      <Header title="会话附件" showBackButton={true} onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        {items.length === 0 ? (
          <EmptyState title="暂无附件" message="该会话还没有可浏览的附件" icon="file-document-outline" />
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(it) => it.key}
            ItemSeparatorComponent={Divider}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  subtitle: { color: '#888', fontSize: 12 },
});

export default ChatAttachmentsScreen; 