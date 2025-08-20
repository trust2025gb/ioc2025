import React, { useState } from 'react';
import { View } from 'react-native';
import { List, Divider, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Container, Header, Loading } from '../../components';
import { useNavigation } from '@react-navigation/native';

const MyTasksScreen = () => {
  const navigation = useNavigation<any>();
  const [onlyMine, setOnlyMine] = useState(true);
  const [status, setStatus] = useState<'all'|'open'|'done'|'closed'>('all');
  const [dueFilter, setDueFilter] = useState<'all'|'today'|'week'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myTasks', onlyMine, status, dueFilter],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (onlyMine) params.assignee_id = 'me';
      if (status !== 'all') params.status = status;
      const res = await apiClient.get('/api/dashboard/activities', params);
      let items = res.data || [];
      if (dueFilter !== 'all') {
        const now = new Date();
        items = items.filter((a: any) => {
          const d = a?.metadata?.due_date ? new Date(a.metadata.due_date) : null;
          if (!d) return false;
          if (dueFilter === 'today') {
            return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
          }
          if (dueFilter === 'week') {
            const diff = (d.getTime()-now.getTime())/86400000;
            return diff>=0 && diff<=7;
          }
          return true;
        });
      }
      // 按截止日优先排序
      items.sort((a: any, b: any) => {
        const ad = a?.metadata?.due_date ? new Date(a.metadata.due_date).getTime() : Infinity;
        const bd = b?.metadata?.due_date ? new Date(b.metadata.due_date).getTime() : Infinity;
        return ad - bd;
      });
      return { data: items };
    },
  });

  const items = (data?.data || []);

  return (
    <Container safeArea>
      <Header title="我的任务" />
      {isLoading ? (
        <Loading loading={true} />
      ) : (
        <View>
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, flexWrap: 'wrap' }}>
            <Chip selected={!onlyMine} onPress={() => { setOnlyMine(false); refetch(); }} style={{ marginRight: 8 }}>全部</Chip>
            <Chip selected={onlyMine} onPress={() => { setOnlyMine(true); refetch(); }} style={{ marginRight: 8 }}>只看分配给我</Chip>
            <Chip selected={status==='all'} onPress={() => { setStatus('all'); refetch(); }} style={{ marginRight: 8 }}>全部状态</Chip>
            <Chip selected={status==='open'} onPress={() => { setStatus('open'); refetch(); }} style={{ marginRight: 8 }}>待处理</Chip>
            <Chip selected={status==='done'} onPress={() => { setStatus('done'); refetch(); }} style={{ marginRight: 8 }}>已完成</Chip>
            <Chip selected={status==='closed'} onPress={() => { setStatus('closed'); refetch(); }} style={{ marginRight: 8 }}>已关闭</Chip>
            <Chip selected={dueFilter==='all'} onPress={() => { setDueFilter('all'); refetch(); }} style={{ marginRight: 8 }}>全部期限</Chip>
            <Chip selected={dueFilter==='today'} onPress={() => { setDueFilter('today'); refetch(); }} style={{ marginRight: 8 }}>今天到期</Chip>
            <Chip selected={dueFilter==='week'} onPress={() => { setDueFilter('week'); refetch(); }}>7天内</Chip>
          </View>
          <Divider />
          {items.map((a: any) => {
            const status = a?.metadata?.status || 'open';
            const due = a?.metadata?.due_date || '';
            const et = a?.entity?.type;
            const eid = a?.entity?.id;
            const ename = a?.entity?.name;
            const descParts = [status, due];
            if (et && eid) descParts.push(`${et}#${eid}${ename ? ' · ' + ename : ''}`);
            const description = descParts.filter(Boolean).join(' · ');
            const go = () => {
              if (et === 'customer') {
                navigation.navigate('CustomersTab' as any, { screen: 'CustomerDetail', params: { id: String(eid) } });
              } else if (et === 'lead') {
                navigation.navigate('LeadsTab' as any, { screen: 'LeadDetail', params: { id: String(eid) } });
              } else {
                navigation.navigate('TaskDetail' as any, { id: String(a.id) });
              }
            };
            return (
              <View key={a.id}>
                <List.Item
                  title={a.title}
                  description={description}
                  onPress={go}
                />
                <Divider />
              </View>
            );
          })}
        </View>
      )}
    </Container>
  );
};

export default MyTasksScreen; 