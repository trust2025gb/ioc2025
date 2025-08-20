import React, { useState } from 'react';
import { View, Image, Alert } from 'react-native';
import { Text, Button, List, Divider, TextInput, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { userService, AppUser } from '../../api/services/userService';
import { useQuery } from '@tanstack/react-query';
import { Container, Header, Loading } from '../../components';
import { ROUTES } from '../../constants/routes';
import { chatService } from '../../api/services/chatService';
import { apiClient } from '../../api/client';

const ExpertDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any, any>>();
  const expertId = String((route.params as any)?.id ?? '');
  const contextEntityType = (route.params as any)?.entityType as string | undefined;
  const contextEntityId = (route.params as any)?.entityId as string | number | undefined;
  const [pickerType, setPickerType] = useState<string | undefined>(contextEntityType);
  const [pickerId, setPickerId] = useState<string>(contextEntityId ? String(contextEntityId) : '');
  const [creatingChat, setCreatingChat] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const { data: expert, isLoading } = useQuery<AppUser>({
    queryKey: ['expert', expertId],
    queryFn: () => userService.getUser(expertId),
    enabled: !!expertId,
  });

  const startChat = async () => {
    try {
      setCreatingChat(true);
      const conv = await chatService.createPrivateConversation(expertId);
      (navigation as any).navigate(ROUTES.TABS.CHAT_TAB, {
        screen: ROUTES.CHAT.CONVERSATION,
        params: { id: String((conv as any).id) },
      });
    } catch (e: any) {
      Alert.alert('发起聊天失败', e?.message || '请稍后再试');
    } finally {
      setCreatingChat(false);
    }
  };

  const assignTask = async () => {
    try {
      if (!expert) return;
      setCreatingTask(true);
      await apiClient.post('/api/dashboard/activities', {
        title: `指派任务：与 ${expert.name || expert.username} 跟进`,
        description: '',
        assignee_id: expertId,
        entity_type: pickerType || contextEntityType || 'user',
        entity_id: pickerId || contextEntityId || expertId,
      });
      Alert.alert('已创建任务', '请在“我的任务”中查看');
      (navigation as any).navigate(ROUTES.TABS.HOME_TAB, { screen: ROUTES.TASKS.MY as any });
    } catch (e: any) {
      Alert.alert('指派失败', e?.message || '请稍后再试');
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <Container safeArea>
      <Header title="专家详情" />
      {isLoading || !expert ? (
        <Loading loading={true} />
      ) : (
        <View style={{ padding: 16 }}>
          <List.Item
            title={expert.name || expert.username}
            description={(expert.role ? expert.role + ' · ' : '') + (expert.email || '')}
            left={(props) => (
              <Image
                source={expert.avatar ? { uri: expert.avatar } : require('../../assets/logo.png')}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            )}
          />
          <Divider />
          <List.Item title="关联对象" description={(pickerType && pickerId) ? `${pickerType}#${pickerId}` : (contextEntityType && contextEntityId ? `${contextEntityType}#${contextEntityId}` : '未选择')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
            <Chip selected={pickerType==='customer'} onPress={() => setPickerType('customer')} style={{ marginRight: 8 }}>客户</Chip>
            <Chip selected={pickerType==='lead'} onPress={() => setPickerType('lead')}>线索</Chip>
          </View>
          {pickerType ? (
            <TextInput mode="outlined" label={`${pickerType}ID`} value={pickerId} onChangeText={setPickerId} placeholder="输入ID" />
          ) : null}

          <View style={{ height: 12 }} />
          {expert.phone ? <List.Item title="电话" description={expert.phone} /> : null}
          {expert.email ? <List.Item title="邮箱" description={expert.email} /> : null}
          {expert.status ? <List.Item title="状态" description={expert.status} /> : null}

          <View style={{ height: 16 }} />
          <Button mode="contained" onPress={startChat} icon="chat" loading={creatingChat} disabled={creatingChat}>
            发起聊天
          </Button>
          <View style={{ height: 12 }} />
          <Button mode="outlined" onPress={assignTask} icon="clipboard-check" loading={creatingTask} disabled={creatingTask}>
            指派任务
          </Button>
        </View>
      )}
    </Container>
  );
};

export default ExpertDetailScreen; 