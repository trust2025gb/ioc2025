import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Title, IconButton } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { Container, Header } from '../../components';
import { analyticsService } from '../../api/services/analyticsService';
import { spacing } from '../../theme';

function formatPeriod(d: Date) { return d.toISOString().slice(0,7); }

export default function TeamPerformanceScreen({ navigation }: any) {
  const [periodDate, setPeriodDate] = React.useState(new Date());
  const period = formatPeriod(periodDate);
  const [dimension, setDimension] = React.useState<'user'|'channel'|'product'>('user');
  const [metric, setMetric] = React.useState<'amount'|'orders'|'avgOrderValue'|'receivables'|'commission'>('amount');
  const { data } = useQuery({ queryKey: ['leaderboard-full', period, dimension, metric], queryFn: () => analyticsService.leaderboard(period, metric, dimension) });

  const changeMonth = (delta: number) => {
    const d = new Date(periodDate); d.setMonth(d.getMonth()+delta); setPeriodDate(d);
  };

  return (
    <Container safeArea>
      <Header title="团队绩效" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={{ padding: spacing.medium }}>
        <Card style={{ marginBottom: spacing.medium }}>
          <Card.Content style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} />
            <Title>{period}</Title>
            <IconButton icon="chevron-right" onPress={() => changeMonth(1)} />
          </Card.Content>
        </Card>
        <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom: spacing.medium }}>
          <Button mode={dimension==='user'?'contained':'outlined'} onPress={() => setDimension('user')}>人员</Button>
          <Button mode={dimension==='channel'?'contained':'outlined'} onPress={() => setDimension('channel')}>渠道</Button>
          <Button mode={dimension==='product'?'contained':'outlined'} onPress={() => setDimension('product')}>产品</Button>
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom: spacing.medium }}>
          <Button mode={metric==='amount'?'contained':'outlined'} onPress={() => setMetric('amount')}>金额</Button>
          <Button mode={metric==='orders'?'contained':'outlined'} onPress={() => setMetric('orders')}>订单</Button>
          <Button mode={metric==='avgOrderValue'?'contained':'outlined'} onPress={() => setMetric('avgOrderValue')}>客单价</Button>
          <Button mode={metric==='receivables'?'contained':'outlined'} onPress={() => setMetric('receivables')}>应收</Button>
          <Button mode={metric==='commission'?'contained':'outlined'} onPress={() => setMetric('commission')}>佣金</Button>
        </View>
        <Card>
          <Card.Title title={(dimension==='user' ? '金额排行榜（人员）' : dimension==='channel' ? '金额排行榜（渠道）' : '金额排行榜（产品）') + ' · ' + (metric==='amount'?'金额':metric==='orders'?'订单':'客单价/应收/佣金')} />
          <Card.Content>
            {(data as any)?.items?.map((it:any, idx:number) => (
              <View key={(it.id ?? it.name) + '_' + idx} style={{ flexDirection:'row', justifyContent:'space-between', marginVertical: 6 }}>
                <Text>{idx+1}. {it.name}</Text>
                <Text>
                  {metric==='orders' ? `${it.orders} 单` : metric==='avgOrderValue' ? `¥${it.avgOrderValue}` : metric==='receivables' ? `¥${it.receivables}` : metric==='commission' ? `¥${it.commission}` : `¥${it.amount}`}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({}); 