import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, Searchbar, List, Divider, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { searchService, GlobalSearchItem } from '../../api/services/searchService';
import { ROUTES } from '../../constants/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatService } from '../../api/services/chatService';

const ENTITY_LABEL: Record<string, string> = {
  customer: '客户',
  order: '订单',
  contract: '合同',
  claim: '理赔',
  product: '产品',
  chat: '聊天',
};

const RECENT_KEY = '@ioc3:search_recent_ids';
const CLICK_COUNT_KEY = '@ioc3:search_click_counts';

const TYPE_BG: Record<string, string> = {
  product: 'rgba(255, 245, 233, 1)',   // 卡片淡橙
  order: 'rgba(235, 248, 240, 1)',     // 卡片淡绿
  contract: 'rgba(236, 244, 255, 1)',  // 卡片淡蓝
  claim: 'rgba(255, 240, 240, 1)',     // 卡片淡红
  customer: 'rgba(244, 244, 255, 1)',  // 卡片淡紫
  chat: 'rgba(245, 245, 250, 1)',      // 卡片淡灰
};

// 标题前置标签底色（稍深一点）与文字色
const TYPE_TITLE_BG: Record<string, string> = {
  product: '#FFD8B0',
  order: '#BEEBD1',
  contract: '#BED9FF',
  claim: '#FFC5C5',
  customer: '#D6D6FF',
  chat: '#E6E6EE',
};
const TYPE_TITLE_TEXT: Record<string, string> = {
  product: '#8A4B08',
  order: '#165B33',
  contract: '#0F4C81',
  claim: '#7A1E1E',
  customer: '#3C2F80',
  chat: '#444',
};

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<GlobalSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiConvId, setAiConvId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_KEY);
        if (raw) setRecentIds(new Set(JSON.parse(raw)));
      } catch {}
      try {
        const raw2 = await AsyncStorage.getItem(CLICK_COUNT_KEY);
        if (raw2) setClickCounts(JSON.parse(raw2) || {});
      } catch {}
    })();
  }, []);

  const pushRecent = async (key: string) => {
    try {
      const next = new Set(recentIds);
      next.add(key);
      setRecentIds(next);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(Array.from(next).slice(-200)));
    } catch {}
  };

  const incClickCount = async (key: string) => {
    try {
      const next = { ...clickCounts, [key]: (clickCounts[key] || 0) + 1 };
      setClickCounts(next);
      await AsyncStorage.setItem(CLICK_COUNT_KEY, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    const maybePreset = route?.params?.preset as string | undefined;
    if (maybePreset && typeof maybePreset === 'string') {
      setQ(maybePreset);
      setTimeout(() => onSubmit(maybePreset), 0);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const { suggestions } = await searchService.suggest(q.trim());
        if (active) setSuggestions(suggestions);
      } catch (err) {
        console.error('Suggest error', err);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  const onSubmit = async (text?: string) => {
    const keyword = (text ?? q).trim();
    if (!keyword) return;
    setLoading(true);
    setErrorText(null);
    setAiNote(null);
    setAiConvId(null);
    setAiMessages([]);
    setAiInput('');
    try {
      const res = await searchService.search({ q: keyword, per_page: 30 });
      setResults(res.items);
      if (!res.items?.length) {
        setErrorText('本地数据库中没有找到相关内容');
        // AI 辅助：调用百川智能助手
        try {
          setAiNote('现在由智能助手为您提供互联网相关内容（仅供参考）');
          const conv = await chatService.getAiAssistantConversation();
          setAiConvId(String(conv.id));
          setAiLoading(true);
          const aiMsg = await chatService.requestAiReply(String(conv.id), keyword);
          setAiMessages([{ role: 'assistant', content: aiMsg.content }]);
        } catch (e) {
          // AI 失败则忽略
        } finally {
          setAiLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Search error', err);
      setErrorText(err?.message || '搜索失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSend = async () => {
    const text = aiInput.trim();
    if (!text || !aiConvId || aiLoading) return;
    try {
      setAiLoading(true);
      setAiMessages((prev) => [...prev, { role: 'user', content: text }]);
      setAiInput('');
      const reply = await chatService.requestAiReply(aiConvId, text);
      setAiMessages((prev) => [...prev, { role: 'assistant', content: reply.content }]);
    } catch (e) {
      setAiMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，AI服务出现错误，请联系管理员。' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const copyCode = async (item: GlobalSearchItem) => {
    const text = item.code || item.title;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(text));
      } else {
        // @ts-ignore
        const { Clipboard } = await import('react-native');
        // @ts-ignore
        Clipboard.setString(String(text));
      }
      Alert.alert('已复制', String(text));
    } catch (e) {
      Alert.alert('复制失败', String(text));
    }
  };

  const goItem = async (item: GlobalSearchItem) => {
    const key = `${item.type}:${item.id}`;
    await pushRecent(key);
    await incClickCount(key);
    switch (item.type) {
      case 'product':
        (navigation as any).navigate(ROUTES.TABS.HOME_TAB, {
          screen: ROUTES.HOME.PRODUCTS_NAV,
          params: {
            screen: ROUTES.PRODUCTS.DETAIL,
            params: { id: String(item.id) },
          },
        });
        break;
      case 'order':
        (navigation as any).navigate(ROUTES.TABS.HOME_TAB, {
          screen: ROUTES.HOME.ORDERS_NAV,
          params: { screen: ROUTES.ORDERS.DETAIL, params: { id: String(item.id) } },
        });
        break;
      case 'contract':
        (navigation as any).navigate(ROUTES.TABS.HOME_TAB, {
          screen: ROUTES.HOME.CONTRACTS_NAV,
          params: { screen: ROUTES.CONTRACTS.DETAIL, params: { id: String(item.id) } },
        });
        break;
      case 'claim':
        (navigation as any).navigate(ROUTES.TABS.HOME_TAB, {
          screen: ROUTES.HOME.CLAIMS_NAV,
          params: { screen: ROUTES.CLAIMS.DETAIL, params: { id: String(item.id) } },
        });
        break;
      case 'customer':
        (navigation as any).navigate(ROUTES.TABS.CUSTOMERS_TAB, {
          screen: ROUTES.CUSTOMERS.DETAIL,
          params: { id: String(item.id) },
        });
        break;
      case 'lead' as any:
        (navigation as any).navigate(ROUTES.TABS.LEADS_TAB, {
          screen: ROUTES.LEADS.LIST,
          params: {},
        });
        break;
      case 'expert' as any:
        (navigation as any).navigate(ROUTES.EXPERTS.DETAIL as any, { id: String(item.id) });
        break;
      case 'chat':
        (navigation as any).navigate(ROUTES.TABS.CHAT_TAB, {
          screen: ROUTES.CHAT.CONVERSATION,
          params: { id: String(item.id), anchorMessageId: item.message_id },
        });
        break;
    }
  };

  const renderTitle = (item: GlobalSearchItem) => {
    const chipBg = TYPE_TITLE_BG[item.type] || '#EEE';
    const chipText = TYPE_TITLE_TEXT[item.type] || '#333';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: chipBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
          <Text style={{ fontSize: 13, color: chipText }}>{ENTITY_LABEL[item.type] ?? item.type}</Text>
        </View>
        <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.title}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: GlobalSearchItem }) => {
    const key = `${item.type}:${item.id}`;
    const highlighted = recentIds.has(key);
    const baseBg = TYPE_BG[item.type] || 'white';
    const bgColor = highlighted ? 'rgba(33,150,243,0.08)' : baseBg;
    const count = clickCounts[key] || 0;

    return (
      <View style={{
        backgroundColor: bgColor,
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}>
        <List.Item
          title={renderTitle(item)}
          description={item.subtitle ? `${item.subtitle}${item.snippet ? ' | ' + item.snippet : ''}` : item.snippet}
          onPress={() => goItem(item)}
          onLongPress={() => copyCode(item)}
          right={(props) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {count > 0 ? (
                <Text style={{ color: '#999', fontSize: 12, marginRight: 6 }}>{count}</Text>
              ) : null}
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
          style={{ margin: 0 }}
        />
      </View>
    );
  };

  const HeaderComponent = useMemo(() => () => (
    <View>
      {errorText && (
        <List.Item title={errorText} titleStyle={{ color: '#999' }} />
      )}
      {aiNote && (
        <List.Item title={aiNote} titleNumberOfLines={3} titleStyle={{ color: '#999', fontSize: 12 }} />
      )}
      {aiLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <ActivityIndicator animating size="small" style={{ marginRight: 8 }} />
          <Text style={{ color: '#666' }}>智能助手正在搜索互联网资料，请耐心等待…</Text>
        </View>
      )}
      {aiConvId && aiMessages.length > 0 && (
        <View style={{ backgroundColor: 'rgba(255,245,233,1)', marginHorizontal: 12, marginVertical: 6, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>百川智能助手</Text>
          <View>
            {aiMessages.map((m, idx) => (
              <View key={idx} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.role === 'user' ? 'rgba(33,150,243,0.12)' : 'white',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                marginBottom: 6,
                maxWidth: '90%'
              }}>
                <Text style={{ lineHeight: 20 }}>{m.content}</Text>
              </View>
            ))}
          </View>
          <TextInput
            mode="outlined"
            placeholder="继续追问..."
            value={aiInput}
            onChangeText={setAiInput}
            editable={!aiLoading}
            right={<TextInput.Icon icon={aiLoading ? 'progress-clock' : 'send'} disabled={aiLoading} onPress={handleAiSend} />}
          />
        </View>
      )}

      {suggestions.length > 0 && results.length === 0 && (
        <View>
          {suggestions.map((s, idx) => (
            <List.Item
              key={idx}
              title={s}
              onPress={() => {
                setQ(s);
                onSubmit(s);
              }}
            />
          ))}
          <Divider />
        </View>
      )}
    </View>
  ), [errorText, aiNote, aiConvId, aiMessages, aiInput, aiLoading, suggestions, results.length]);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        mode="outlined"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => onSubmit()}
        right={<TextInput.Icon icon="magnify" onPress={() => onSubmit()} />}
        returnKeyType={Platform.OS === 'ios' ? 'search' : 'search'}
      />

      <FlatList
        data={results}
        refreshing={loading}
        keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => null}
        ListHeaderComponent={HeaderComponent}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default SearchScreen; 