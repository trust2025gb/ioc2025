import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { List, Button, Divider, Chip } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Container, Header, Loading } from '../../components';

const TaskDetailScreen = () => {
  const route = useRoute<RouteProp<any, any>>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const id = String((route.params as any)?.id ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => apiClient.get(`/api/dashboard/activities/${id}`),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: async (payload: any) => apiClient.put(`/api/dashboard/activities/${id}`, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['task', id] });
      await qc.invalidateQueries({ queryKey: ['myTasks'] });
      Alert.alert('已更新', '任务已更新');
    },
  });

  const task = data?.data;
  const status = task?.metadata?.status || 'open';
  const due = task?.metadata?.due_date || '';
  const notes = task?.metadata?.notes || '';
  const entity = task?.entity;

  const goEntity = () => {
    if (!entity) return;
    if (entity.type === 'customer') {
      (navigation as any).navigate('CustomersTab', { screen: 'CustomerDetail', params: { id: String(entity.id) } });
    } else if (entity.type === 'lead') {
      (navigation as any).navigate('LeadsTab', { screen: 'LeadDetail', params: { id: String(entity.id) } });
    }
  };

  return (
    <Container safeArea>
      <Header title="任务详情" />
      {isLoading || !task ? (
        <Loading loading={true} />
      ) : (
        <View style={{ padding: 16 }}>
          <List.Item title={task.title} description={task.description || ''} />
          {entity ? (
            <List.Item
              title={`关联：${entity.type}#${entity.id}`}
              description={entity.name || ''}
              right={() => <Button onPress={goEntity}>查看</Button>}
            />
          ) : null}
          <Divider />
          <List.Item title="当前状态" description={status} />
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Chip selected={status==='open'} onPress={() => update.mutate({ status: 'open' })} style={{ marginRight: 8, marginBottom: 8 }}>待处理</Chip>
            <Chip selected={status==='done'} onPress={() => update.mutate({ status: 'done' })} style={{ marginRight: 8, marginBottom: 8 }}>已完成</Chip>
            <Chip selected={status==='closed'} onPress={() => update.mutate({ status: 'closed' })} style={{ marginRight: 8, marginBottom: 8 }}>已关闭</Chip>
          </View>

          <Divider />
          <List.Item title="截止日期" description={due || '未设置'} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['+1天','+3天','+7天'].map((label, idx) => (
              <Chip key={label} style={{ marginRight: 8, marginTop: 8 }} onPress={() => {
                const days = [1,3,7][idx];
                const target = new Date();
                target.setDate(target.getDate() + days);
                const yyyy = target.getFullYear();
                const mm = String(target.getMonth()+1).padStart(2,'0');
                const dd = String(target.getDate()).padStart(2,'0');
                update.mutate({ due_date: `${yyyy}-${mm}-${dd}` });
              }}>{label}</Chip>
            ))}
          </View>

          <Divider />
          <List.Item title="备注" description={notes || '无'} onPress={() => {
            Alert.prompt?.('编辑备注', notes, text => update.mutate({ notes: text || '' }));
          }} />

          <View style={{ height: 16 }} />
          <Button onPress={() => navigation.goBack()}>返回</Button>
        </View>
      )}
    </Container>
  );
};

export default TaskDetailScreen; 