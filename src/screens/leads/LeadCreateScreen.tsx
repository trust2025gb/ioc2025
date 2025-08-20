/**
 * 线索创建页面
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Button, TextInput, HelperText, Divider, Menu } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 导入组件
import { Container, Header } from '../../components';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { LeadsStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { leadService, LeadStatus } from '../../api/services/leadService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import WebTextInput from '../../components/common/WebTextInput';

// 验证模式
const validationSchema = Yup.object().shape({
  name: Yup.string().required('姓名为必填项'),
  phone: Yup.string(),
  email: Yup.string().email('请输入有效的邮箱地址'),
  source: Yup.string().required('来源为必填项'),
  notes: Yup.string(),
  gender: Yup.string(),
  wechat: Yup.string(),
  birth_date: Yup.string(),
  occupation: Yup.string(),
  annual_income: Yup.string(),
  province: Yup.string(),
  city: Yup.string(),
  district: Yup.string(),
  address: Yup.string(),
  postal_code: Yup.string(),
  status: Yup.string(),
  priority: Yup.string(),
  quality_grade: Yup.string(),
  value_grade: Yup.string(),
  urgency_grade: Yup.string(),
  follow_up_date: Yup.string(),
});

/**
 * 线索创建页面组件
 */
const LeadCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<LeadsStackParamList>>();
  const route = useRoute<any>();
  const prefill: any = route.params?.prefill || {};
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showFollowPicker, setShowFollowPicker] = useState(false);
  // 下拉菜单可见性
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [qualityMenuVisible, setQualityMenuVisible] = useState(false);
  const [valueMenuVisible, setValueMenuVisible] = useState(false);
  const [urgencyMenuVisible, setUrgencyMenuVisible] = useState(false);

  // 选项（英文枚举值，中文标签）
  const GENDER_OPTIONS = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'other', label: '其他' },
    { value: 'unknown', label: '未知' },
  ];
  const STATUS_OPTIONS = [
    { value: 'new', label: '新线索' },
    { value: 'contacted', label: '已联系' },
    { value: 'qualified', label: '合格线索' },
    { value: 'unqualified', label: '不合格线索' },
    { value: 'converted', label: '已转化' },
  ];
  const PRIORITY_OPTIONS = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
  ];
  const QUALITY_OPTIONS = [
    { value: 'A', label: 'A级' },
    { value: 'B', label: 'B级' },
    { value: 'C', label: 'C级' },
    { value: 'D', label: 'D级' },
  ];
  const VALUE_OPTIONS = [
    { value: 'high', label: '高价值' },
    { value: 'medium', label: '中等价值' },
    { value: 'low', label: '低价值' },
  ];
  const URGENCY_OPTIONS = [
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  const getLabel = (options: {value:string;label:string}[], value?: string) => {
    const found = options.find(o => o.value === value);
    return found ? found.label : '';
  };

  // Web 平台原生下拉渲染
  const renderWebSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <View style={{ marginBottom: spacing.small }}>
      <Text style={{ marginBottom: 4, color: colors.textSecondary }}>{label}</Text>
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        style={{
          width: '100%',
          height: 48,
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '0 12px',
          fontSize: 16,
          background: '#fff',
        }}
      >
        <option value="" disabled hidden>请选择</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </View>
  );

  // 创建线索
  const createLeadMutation = useMutation({
    mutationFn: (leadData: any) => leadService.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigation.navigate(ROUTES.LEADS.LIST);
    },
    onError: (error: any) => {
      console.error('创建线索失败:', error);
    },
  });

  // 表单处理
  const formik = useFormik({
    initialValues: {
      name: prefill.name || '',
      phone: prefill.phone || '',
      email: prefill.email || '',
      source: prefill.source || '',
      notes: prefill.notes || '',
      gender: ['male','female','other','unknown'].includes(prefill.gender) ? prefill.gender : 'unknown',
      wechat: prefill.wechat || '',
      birth_date: prefill.birth_date || '',
      occupation: prefill.occupation || '',
      annual_income: prefill.annual_income || '',
      province: prefill.province || '',
      city: prefill.city || '',
      district: prefill.district || '',
      address: prefill.address || '',
      postal_code: prefill.postal_code || '',
      status: 'new',
      priority: 'medium',
      quality_grade: 'B',
      value_grade: 'medium',
      urgency_grade: 'medium',
      follow_up_date: prefill.follow_up_date || '',
    },
    validationSchema,
    onSubmit: (values) => {
      setLoading(true);
      createLeadMutation.mutate(values as any);
    },
  });

  return (
    <Container>
      <Header
        title="创建线索"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>线索信息</Text>
          
          {/* 姓名 */}
          <TextInput
            label="姓名"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.touched.name && !!formik.errors.name}
            style={styles.input}
          />
          {formik.touched.name && formik.errors.name && (
            <HelperText type="error">{String(formik.errors.name || '')}</HelperText>
          )}
          
          {/* 电话 */}
          <TextInput
            label="电话"
            value={formik.values.phone}
            onChangeText={formik.handleChange('phone')}
            onBlur={formik.handleBlur('phone')}
            error={formik.touched.phone && !!formik.errors.phone}
            style={styles.input}
            keyboardType="phone-pad"
          />
          {formik.touched.phone && formik.errors.phone && (
            <HelperText type="error">{String(formik.errors.phone || '')}</HelperText>
          )}
          
          {/* 邮箱 */}
          <TextInput
            label="邮箱"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            error={formik.touched.email && !!formik.errors.email}
            style={styles.input}
            keyboardType="email-address"
          />
          {formik.touched.email && formik.errors.email && (
            <HelperText type="error">{String(formik.errors.email || '')}</HelperText>
          )}
          
          {/* 微信 */}
          <TextInput
            label="微信"
            value={formik.values.wechat}
            onChangeText={formik.handleChange('wechat')}
            style={styles.input}
          />

          {/* 性别（Web原生下拉 / 移动端菜单） */}
          {Platform.OS === 'web'
            ? renderWebSelect('性别', formik.values.gender, (v) => formik.setFieldValue('gender', v), GENDER_OPTIONS)
            : (
              <Menu
                visible={genderMenuVisible}
                onDismiss={() => setGenderMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setGenderMenuVisible(true)}>
                    <TextInput
                      label="性别"
                      value={getLabel(GENDER_OPTIONS, formik.values.gender)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {GENDER_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('gender', opt.value); setGenderMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 出生日期 */}
          {Platform.OS === 'web' ? (
            <View style={{ marginBottom: spacing.small }}>
              <WebTextInput
                value={formik.values.birth_date}
                onChangeText={(v) => formik.setFieldValue('birth_date', v)}
                placeholder="出生日期"
                style={styles.input}
              />
              <input
                type="date"
                value={formik.values.birth_date || ''}
                onChange={(e) => formik.setFieldValue('birth_date', e.target.value)}
                style={{ width: '100%', height: 40, boxSizing: 'border-box' }}
              />
            </View>
          ) : (
            <>
              <TextInput
                label="出生日期"
                value={formik.values.birth_date}
                onFocus={() => setShowBirthPicker(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowBirthPicker(true)} />}
                style={styles.input}
              />
              {showBirthPicker && (
                <DateTimePicker
                  value={formik.values.birth_date ? new Date(formik.values.birth_date) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    setShowBirthPicker(false);
                    if (date) formik.setFieldValue('birth_date', date.toISOString().slice(0, 10));
                  }}
                />
              )}
            </>
          )}

          {/* 职业与年收入 */}
          <TextInput
            label="职业"
            value={formik.values.occupation}
            onChangeText={formik.handleChange('occupation')}
            style={styles.input}
          />
          <TextInput
            label="年收入（万元）"
            value={formik.values.annual_income}
            onChangeText={formik.handleChange('annual_income')}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* 地址信息 */}
          <TextInput label="省份" value={formik.values.province} onChangeText={formik.handleChange('province')} style={styles.input} />
          <TextInput label="城市" value={formik.values.city} onChangeText={formik.handleChange('city')} style={styles.input} />
          <TextInput label="区/县" value={formik.values.district} onChangeText={formik.handleChange('district')} style={styles.input} />
          <TextInput label="详细地址" value={formik.values.address} onChangeText={formik.handleChange('address')} style={styles.input} />
          <TextInput label="邮政编码" value={formik.values.postal_code} onChangeText={formik.handleChange('postal_code')} style={styles.input} />

          {/* 来源 */}
          <TextInput
            label="来源"
            value={formik.values.source}
            onChangeText={formik.handleChange('source')}
            onBlur={formik.handleBlur('source')}
            error={formik.touched.source && !!formik.errors.source}
            style={styles.input}
          />
          {formik.touched.source && formik.errors.source && (
            <HelperText type="error">{String(formik.errors.source || '')}</HelperText>
          )}

          {/* 状态 */}
          {Platform.OS === 'web'
            ? renderWebSelect('状态', formik.values.status, (v) => formik.setFieldValue('status', v), STATUS_OPTIONS)
            : (
              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setStatusMenuVisible(true)}>
                    <TextInput
                      label="状态"
                      value={getLabel(STATUS_OPTIONS, formik.values.status)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {STATUS_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('status', opt.value); setStatusMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 优先级 */}
          {Platform.OS === 'web'
            ? renderWebSelect('优先级', formik.values.priority, (v) => formik.setFieldValue('priority', v), PRIORITY_OPTIONS)
            : (
              <Menu
                visible={priorityMenuVisible}
                onDismiss={() => setPriorityMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setPriorityMenuVisible(true)}>
                    <TextInput
                      label="优先级"
                      value={getLabel(PRIORITY_OPTIONS, formik.values.priority)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('priority', opt.value); setPriorityMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 质量等级 */}
          {Platform.OS === 'web'
            ? renderWebSelect('质量等级(A-D)', formik.values.quality_grade, (v) => formik.setFieldValue('quality_grade', v), QUALITY_OPTIONS)
            : (
              <Menu
                visible={qualityMenuVisible}
                onDismiss={() => setQualityMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setQualityMenuVisible(true)}>
                    <TextInput
                      label="质量等级(A-D)"
                      value={getLabel(QUALITY_OPTIONS, formik.values.quality_grade)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {QUALITY_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('quality_grade', opt.value); setQualityMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 价值等级 */}
          {Platform.OS === 'web'
            ? renderWebSelect('价值等级', formik.values.value_grade, (v) => formik.setFieldValue('value_grade', v), VALUE_OPTIONS)
            : (
              <Menu
                visible={valueMenuVisible}
                onDismiss={() => setValueMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setValueMenuVisible(true)}>
                    <TextInput
                      label="价值等级"
                      value={getLabel(VALUE_OPTIONS, formik.values.value_grade)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {VALUE_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('value_grade', opt.value); setValueMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 紧急度 */}
          {Platform.OS === 'web'
            ? renderWebSelect('紧急度', formik.values.urgency_grade, (v) => formik.setFieldValue('urgency_grade', v), URGENCY_OPTIONS)
            : (
              <Menu
                visible={urgencyMenuVisible}
                onDismiss={() => setUrgencyMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setUrgencyMenuVisible(true)}>
                    <TextInput
                      label="紧急度"
                      value={getLabel(URGENCY_OPTIONS, formik.values.urgency_grade)}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      pointerEvents="none"
                      style={styles.input}
                    />
                  </Pressable>
                }
              >
                {URGENCY_OPTIONS.map(opt => (
                  <Menu.Item key={opt.value} title={opt.label} onPress={() => {formik.setFieldValue('urgency_grade', opt.value); setUrgencyMenuVisible(false);}} />
                ))}
              </Menu>
            )}

          {/* 下次跟进日期 */}
          {Platform.OS === 'web' ? (
            <View style={{ marginBottom: spacing.small }}>
              <WebTextInput
                value={formik.values.follow_up_date}
                onChangeText={(v) => formik.setFieldValue('follow_up_date', v)}
                placeholder="下次跟进日期"
                style={styles.input}
              />
              <input
                type="date"
                value={formik.values.follow_up_date || ''}
                onChange={(e) => formik.setFieldValue('follow_up_date', e.target.value)}
                style={{ width: '100%', height: 40, boxSizing: 'border-box' }}
              />
            </View>
          ) : (
            <>
              <TextInput
                label="下次跟进日期"
                value={formik.values.follow_up_date}
                onFocus={() => setShowFollowPicker(true)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowFollowPicker(true)} />}
                style={styles.input}
              />
              {showFollowPicker && (
                <DateTimePicker
                  value={formik.values.follow_up_date ? new Date(formik.values.follow_up_date) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    setShowFollowPicker(false);
                    if (date) formik.setFieldValue('follow_up_date', date.toISOString().slice(0, 10));
                  }}
                />
              )}
            </>
          )}
          
          <Divider style={styles.divider} />
          
          {/* 备注 */}
          <TextInput
            label="备注"
            value={formik.values.notes}
            onChangeText={formik.handleChange('notes')}
            onBlur={formik.handleBlur('notes')}
            error={formik.touched.notes && !!formik.errors.notes}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          {formik.touched.notes && formik.errors.notes && (
            <HelperText type="error">{String(formik.errors.notes || '')}</HelperText>
          )}
          
          {/* 提交按钮 */}
          <Button
            mode="contained"
            onPress={() => formik.handleSubmit()}
            style={styles.submitButton}
            loading={loading || createLeadMutation.isPending}
            disabled={loading || createLeadMutation.isPending}
          >
            创建线索
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
    color: colors.textPrimary,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.surface,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  submitButton: {
    marginTop: spacing.large,
    paddingVertical: 6,
  },
});

export default LeadCreateScreen; 