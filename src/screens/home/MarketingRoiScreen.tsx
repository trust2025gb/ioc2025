import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Title, IconButton } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { Container, Header } from '../../components';
import { analyticsService } from '../../api/services/analyticsService';
import { spacing } from '../../theme';

function formatPeriod(d: Date) { return d.toISOString().slice(0,7); }

export default function MarketingRoiScreen({ navigation }: any) {
  const [periodDate, setPeriodDate] = React.useState(new Date());
  const period = formatPeriod(periodDate);
  const { data } = useQuery({ queryKey: ['marketing-roi', period], queryFn: () => analyticsService.marketingRoi(period) });

  const changeMonth = (delta: number) => { const d = new Date(periodDate); d.setMonth(d.getMonth()+delta); setPeriodDate(d); };

  return (
    <Container safeArea>
      <Header title="ROI 报表" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={{ padding: spacing.medium }}>
        <Card style={{ marginBottom: spacing.medium }}>
          <Card.Content style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} />
            <Title>{period}</Title>
            <IconButton icon="chevron-right" onPress={() => changeMonth(1)} />
          </Card.Content>
        </Card>
        <Card>
          <Card.Title title="活动/渠道 ROI" />
          <Card.Content>
            {(data as any)?.items?.map((it:any) => (
              <View key={it.id} style={{ marginVertical: 6 }}>
                <Text>{it.name}（{it.channel}）</Text>
                <Text>成本：¥{it.cost}，收益：¥{it.revenue}，ROI：{it.roi ?? '-'} </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({}); 