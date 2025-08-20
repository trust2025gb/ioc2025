import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, TextInput, Title } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Header } from '../../components';
import { dashboardService } from '../../api/services/dashboardService';
import { spacing } from '../../theme';

export default function GoalsScreen({ navigation }: any) {
  const qc = useQueryClient();
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: quota, isLoading } = useQuery({
    queryKey: ['salesQuota', period],
    queryFn: () => dashboardService.getSalesQuota(period),
  });

  const [amount, setAmount] = React.useState('');
  const [orders, setOrders] = React.useState('');

  React.useEffect(() => {
    if (quota) {
      setAmount(String((quota as any).target_amount ?? ''));
      setOrders(String((quota as any).target_orders ?? ''));
    }
  }, [quota]);

  const mutation = useMutation({
    mutationFn: (payload: any) => dashboardService.updateSalesQuota(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salesQuota', period] });
    }
  });

  const onSave = () => {
    mutation.mutate({ period, target_amount: Number(amount || 0), target_orders: Number(orders || 0) });
  };

  return (
    <Container safeArea>
      <Header title="本月目标" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={{ padding: spacing.medium }}>
        <Card>
          <Card.Content>
            <Title>我的目标（{period}）</Title>
            <TextInput label="目标金额(¥)" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ marginTop: spacing.small }} />
            <TextInput label="目标订单数" value={orders} onChangeText={setOrders} keyboardType="numeric" style={{ marginTop: spacing.small }} />
            <Text style={{ marginTop: spacing.small }}>已完成金额：{(quota as any)?.achieved_amount ?? 0}，已完成订单：{(quota as any)?.achieved_orders ?? 0}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={onSave} loading={mutation.isLoading}>保存</Button>
          </Card.Actions>
        </Card>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({}); 