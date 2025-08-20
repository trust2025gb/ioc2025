import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, TextInput, HelperText } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { LeadsStackParamList } from '../../navigation/types';
import { ROUTES } from '../../constants/routes';
import { Container, Header, Loading, EmptyState } from '../../components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../../api/services';
import { colors, spacing } from '../../theme';

const OPTIONS = {
  gender: [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'other', label: '其他' },
    { value: 'unknown', label: '未知' },
  ],
  priority: [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
  ],
  quality_grade: [
    { value: 'A', label: 'A级' },
    { value: 'B', label: 'B级' },
    { value: 'C', label: 'C级' },
    { value: 'D', label: 'D级' },
  ],
  value_grade: [
    { value: 'high', label: '高价值' },
    { value: 'medium', label: '中等价值' },
    { value: 'low', label: '低价值' },
  ],
  urgency_grade: [
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ],
};

const SelectWeb = ({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: { value: string; label: string }[]; }) => (
  <View style={{ marginBottom: spacing.small }}>
    <Text style={{ marginBottom: 4, color: colors.textSecondary }}>{label}</Text>
    <select
      value={value || ''}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      style={{ width: '100%', height: 48, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', fontSize: 16, background: '#fff' }}
    >
      <option value="" disabled hidden>请选择</option>
      {options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  </View>
);

const LeadEditScreen = () => {
  const route = useRoute<RouteProp<LeadsStackParamList, typeof ROUTES.LEADS.EDIT>>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id),
  });

  const [form, setForm] = useState<any>({});

  React.useEffect(() => { if (lead) setForm(lead); }, [lead]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => leadService.updateLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      navigation.goBack();
    },
  });

  const setField = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  if (isLoading) {
    return (
      <Container safeArea>
        <Header title="编辑线索" showBackButton onBackPress={() => navigation.goBack()} />
        <Loading loading={true} message="加载中..." />
      </Container>
    );
  }

  if (error || !lead) {
    return (
      <Container safeArea>
        <Header title="编辑线索" showBackButton onBackPress={() => navigation.goBack()} />
        <EmptyState title="加载失败" message="无法加载线索，请重试" icon="alert-circle" />
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="编辑线索" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={{ marginBottom: spacing.small }}>正在编辑线索：{id}</Text>

        <TextInput label="姓名" value={form.name || ''} onChangeText={(v) => setField('name', v)} style={styles.input} />
        <TextInput label="电话" value={form.phone || ''} onChangeText={(v) => setField('phone', v)} style={styles.input} keyboardType="phone-pad" />
        <TextInput label="邮箱" value={form.email || ''} onChangeText={(v) => setField('email', v)} style={styles.input} keyboardType="email-address" />
        <TextInput label="微信" value={form.wechat || ''} onChangeText={(v) => setField('wechat', v)} style={styles.input} />
        {Platform.OS === 'web' ? (
          <SelectWeb label="性别" value={form.gender} onChange={(v) => setField('gender', v)} options={OPTIONS.gender} />
        ) : (
          <TextInput label="性别" value={form.gender || ''} onChangeText={(v) => setField('gender', v)} style={styles.input} />
        )}
        <TextInput label="出生日期(YYYY-MM-DD)" value={form.birth_date || ''} onChangeText={(v) => setField('birth_date', v)} style={styles.input} />

        <TextInput label="职业" value={form.occupation || ''} onChangeText={(v) => setField('occupation', v)} style={styles.input} />
        <TextInput label="年收入（万元）" value={String(form.annual_income ?? '')} onChangeText={(v) => setField('annual_income', v)} style={styles.input} keyboardType="numeric" />
        <TextInput label="省份" value={form.province || ''} onChangeText={(v) => setField('province', v)} style={styles.input} />
        <TextInput label="城市" value={form.city || ''} onChangeText={(v) => setField('city', v)} style={styles.input} />
        <TextInput label="区/县" value={form.district || ''} onChangeText={(v) => setField('district', v)} style={styles.input} />
        <TextInput label="详细地址" value={form.address || ''} onChangeText={(v) => setField('address', v)} style={styles.input} />
        <TextInput label="邮政编码" value={form.postal_code || ''} onChangeText={(v) => setField('postal_code', v)} style={styles.input} />

        {Platform.OS === 'web' ? (
          <>
            <SelectWeb label="优先级" value={form.priority} onChange={(v) => setField('priority', v)} options={OPTIONS.priority} />
            <SelectWeb label="质量等级" value={form.quality_grade} onChange={(v) => setField('quality_grade', v)} options={OPTIONS.quality_grade} />
            <SelectWeb label="价值等级" value={form.value_grade} onChange={(v) => setField('value_grade', v)} options={OPTIONS.value_grade} />
            <SelectWeb label="紧急度" value={form.urgency_grade} onChange={(v) => setField('urgency_grade', v)} options={OPTIONS.urgency_grade} />
          </>
        ) : (
          <>
            <TextInput label="优先级" value={form.priority || ''} onChangeText={(v) => setField('priority', v)} style={styles.input} />
            <TextInput label="质量等级" value={form.quality_grade || ''} onChangeText={(v) => setField('quality_grade', v)} style={styles.input} />
            <TextInput label="价值等级" value={form.value_grade || ''} onChangeText={(v) => setField('value_grade', v)} style={styles.input} />
            <TextInput label="紧急度" value={form.urgency_grade || ''} onChangeText={(v) => setField('urgency_grade', v)} style={styles.input} />
          </>
        )}

        <TextInput label="来源" value={form.source || ''} onChangeText={(v) => setField('source', v)} style={styles.input} />
        <TextInput label="备注" value={form.notes || ''} onChangeText={(v) => setField('notes', v)} style={styles.input} multiline numberOfLines={3} />

        <Button mode="contained" onPress={() => updateMutation.mutate(form)} loading={updateMutation.isPending}>
          保存
        </Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16 },
  input: { marginBottom: 12 },
});

export default LeadEditScreen; 