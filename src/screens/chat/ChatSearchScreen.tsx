import React, { useMemo, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text, Searchbar, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ROUTES } from '../../constants/routes';
import { ChatStackParamList } from '../../navigation/types';
import { Container, Header, Loading, EmptyState } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { chatService, Message, MessageType } from '../../api/services/chatService';

const highlight = (text: string, q: string) => {
  if (!q) return <Text>{text}</Text>;
  const parts = text.split(new RegExp(`(${q})`, 'gi'));
  return (
    <Text>
      {parts.map((p, i) => (
        <Text key={i} style={p.toLowerCase() === q.toLowerCase() ? styles.hl : undefined}>{p}</Text>
      ))}
    </Text>
  );
};

const ChatSearchScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList>>();
  const route = useRoute<any>();
  const conversationId = route.params?.id as string | undefined;
  const [query, setQuery] = useState<string>(route.params?.initialQuery || '');

  const { data, isLoading, error, refetch } = useQuery({
    enabled: !!conversationId,
    queryKey: ['chat-search', conversationId],
    queryFn: () => chatService.getMessages(conversationId!, { limit: 200 }),
  });

  const results = useMemo(() => {
    if (!query) return [] as Message[];
    const msgs = data?.data || [];
    return msgs.filter((m) => {
      if (m.type === MessageType.TEXT && m.content) {
        return m.content.toLowerCase().includes(query.toLowerCase());
      }
      // 可扩展到文件名、图片描述等
      return false;
    });
  }, [data, query]);

  const renderItem = ({ item }: { item: Message }) => (
    <View style={styles.resultItem}>
      {highlight(item.content, query)}
      <Text style={styles.resultMeta}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header title="搜索消息" showBackButton={true} onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Searchbar
          placeholder="输入关键字..."
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        {conversationId && isLoading ? (
          <Loading loading={true} message="加载消息..." />
        ) : error ? (
          <EmptyState title="加载失败" message="无法获取会话消息" icon="alert-circle" buttonText="重试" onButtonPress={() => refetch()} />
        ) : results.length === 0 && query ? (
          <EmptyState title="未找到结果" message="换个关键字试试" icon="magnify" />
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            ItemSeparatorComponent={Divider}
            keyExtractor={(m) => m.id}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1 },
  search: { margin: 16, marginBottom: 8 },
  hl: { backgroundColor: '#ffe58f' },
  resultItem: { paddingHorizontal: 16, paddingVertical: 12 },
  resultMeta: { color: '#888', fontSize: 12, marginTop: 4 },
});

export default ChatSearchScreen; 