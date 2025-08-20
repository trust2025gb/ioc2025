/**
 * 线索详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, Divider, List, Chip, Menu, Dialog, Portal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TextInput, Checkbox } from 'react-native-paper';
import { userService, AppUser } from '../../api/services/userService';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { leadService, Lead, LeadStatus } from '../../api/services';
import { apiClient } from '../../api/client';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { LeadsTabParamList } from '../../navigation/types';

/**
 * 线索详情页面组件
 */
const LeadDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<LeadsTabParamList>>();
  const route = useRoute<RouteProp<LeadsTabParamList, typeof ROUTES.LEADS.DETAIL>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignUserName, setAssignUserName] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userCandidates, setUserCandidates] = useState<AppUser[]>([]);
  const [alsoCreateTask, setAlsoCreateTask] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [existingTasks, setExistingTasks] = useState<any[]>([]);
  const [bindTaskId, setBindTaskId] = useState<string | null>(null);
  const [userPickerVisible, setUserPickerVisible] = useState(false);

  // 获取线索详情
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id),
  });

  // 更新线索状态
  const updateLeadStatusMutation = useMutation({
    mutationFn: (status: LeadStatus) => 
      leadService.updateLead(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
  });

  // 转换线索为需求
  const convertLeadMutation = useMutation({
    mutationFn: () => leadService.convertLead(id),
    onSuccess: (data) => {
      // 导航到需求详情页面
      // 注意：这里需要跨导航器导航，可能需要调整
      // navigation.navigate('RequirementsTab', {
      //   screen: 'RequirementDetail',
      //   params: { id: data.requirement_id },
      // });
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 显示/隐藏状态对话框
  const toggleStatusDialog = () => {
    setStatusDialogVisible(!statusDialogVisible);
  };

  // 导航到编辑页面
  const navigateToEdit = () => {
    navigation.navigate(ROUTES.LEADS.EDIT, { id });
  };

  // 导航到分配页面
  const navigateToAssign = () => {
    // 初始化任务默认值
    setTaskTitle(`跟进线索：${lead?.name || id}`);
    // 默认 +1 天截止
    const target = new Date();
    target.setDate(target.getDate() + 1);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setTaskDueDate(`${yyyy}-${mm}-${dd}`);
    setTaskNotes('');
    setBindTaskId(null);
    setUserSearch('');
    setUserCandidates([]);
    setAssignUserId('');
    setAssignUserName('');
    // 载入该线索的历史任务
    (async () => {
      try {
        const res: any = await apiClient.get('/api/dashboard/activities', { entity_type: 'lead', entity_id: id, per_page: 50 });
        setExistingTasks(res.data || []);
      } catch {}
    })();
    setAssignDialogVisible(true);
  };

  // 用户搜索（简单防抖）
  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!userSearch.trim()) { setUserCandidates([]); return; }
      try {
        const res = await userService.getUsers({ search: userSearch, page: 1 } as any);
        if (active) setUserCandidates(res.data || []);
      } catch {}
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [userSearch]);

  const quickSetDue = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setTaskDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleAssignConfirm = async () => {
    if (!assignUserId.trim()) { alert('请选择受派人'); return; }
    try {
      setAssigning(true);
      await leadService.assignLead(id, { assigned_to: assignUserId.trim() });
      if (alsoCreateTask) {
        if (bindTaskId) {
          // 绑定更新已有任务
          await apiClient.put(`/api/dashboard/activities/${bindTaskId}`, {
            assignee_id: assignUserId.trim(),
            title: taskTitle,
            due_date: taskDueDate,
            notes: taskNotes,
          });
        } else {
          // 新建任务
          await apiClient.post('/api/dashboard/activities', {
            title: taskTitle,
            description: taskNotes,
            assignee_id: assignUserId.trim(),
            entity_type: 'lead',
            entity_id: id,
            due_date: taskDueDate,
            notes: taskNotes,
          });
        }
      }
      setAssignDialogVisible(false);
      alert('分配成功');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    } catch (e: any) {
      alert(e?.message || '分配失败');
    } finally {
      setAssigning(false);
    }
  };

  // 处理状态更新
  const handleStatusUpdate = (status: LeadStatus) => {
    updateLeadStatusMutation.mutate(status);
    setStatusDialogVisible(false);
  };

  // 处理转换线索
  const handleConvertLead = () => {
    convertLeadMutation.mutate();
  };

  // 获取状态标签颜色
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return colors.info;
      case LeadStatus.CONTACTED:
        return colors.primary;
      case LeadStatus.QUALIFIED:
        return colors.secondary;
      case LeadStatus.PROPOSAL:
        return colors.success;
      case LeadStatus.NEGOTIATION:
        return colors.warning;
      case LeadStatus.CLOSED_WON:
        return colors.success;
      case LeadStatus.CLOSED_LOST:
        return colors.error;
      default:
        return colors.grey500;
    }
  };

  // 获取状态显示名称
  const getStatusName = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return '新线索';
      case LeadStatus.CONTACTED:
        return '已联系';
      case LeadStatus.QUALIFIED:
        return '已确认';
      case LeadStatus.PROPOSAL:
        return '已提案';
      case LeadStatus.NEGOTIATION:
        return '谈判中';
      case LeadStatus.CLOSED_WON:
        return '已成交';
      case LeadStatus.CLOSED_LOST:
        return '已流失';
      default:
        return '未知';
    }
  };

  // 获取来源显示名称
  const getSourceName = (source: string) => {
    switch (source) {
      case 'website':
        return '网站';
      case 'referral':
        return '推荐';
      case 'social_media':
        return '社交媒体';
      case 'email_campaign':
        return '邮件营销';
      case 'phone_inquiry':
        return '电话咨询';
      case 'event':
        return '活动';
      case 'other':
        return '其他';
      default:
        return source;
    }
  };

  // 如果正在加载
  if (isLoading) {
    return (
      <Container safeArea>
        <Header title="线索详情" showBackButton onBackPress={handleBack} />
        <Loading loading={true} message="加载中..." />
      </Container>
    );
  }

  // 如果加载失败
  if (error || !lead) {
    return (
      <Container safeArea>
        <Header title="线索详情" showBackButton onBackPress={handleBack} />
        <EmptyState
          title="加载失败"
          message="无法加载线索详情，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      </Container>
    );
  }

  return (
    <Container
      safeArea
      scrollable
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="线索详情"
        subtitle={lead.name}
        showBackButton
        onBackPress={handleBack}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      {/* 菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={toggleMenu}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            navigateToEdit();
            toggleMenu();
          }}
          title="编辑线索"
          leadingIcon={() => <Icon name="pencil" size={20} color={colors.textPrimary} />}
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleStatusDialog();
            toggleMenu();
          }}
          title="更新状态"
          leadingIcon={() => <Icon name="refresh" size={20} color={colors.textPrimary} />}
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToAssign();
          }}
          title="分配线索"
          leadingIcon={() => <Icon name="account-switch" size={20} color={colors.textPrimary} />}
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            handleConvertLead();
          }}
          title="转换为需求"
          leadingIcon={() => <Icon name="swap-horizontal" size={20} color={colors.textPrimary} />}
        />
      </Menu>

      {/* 分配线索对话框 */}
      <Portal>
        <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)}>
          <Dialog.Title>分配线索</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 6 }}>受派人</Text>
            <TextInput
              mode="outlined"
              placeholder="搜索姓名/邮箱/手机号"
              value={userSearch}
              onChangeText={setUserSearch}
              right={<TextInput.Icon icon="menu-down" onPress={() => setUserPickerVisible(true)} />}
            />
            <Portal>
              <Dialog visible={userPickerVisible} onDismiss={() => setUserPickerVisible(false)}>
                <Dialog.Title>选择受派人</Dialog.Title>
                <Dialog.Content>
                  {userCandidates.length === 0 ? <Text>请输入关键词搜索</Text> : null}
                  {userCandidates.slice(0,10).map(u => (
                    <List.Item key={u.id} title={u.name || u.username} description={u.email || u.phone}
                      left={(p) => <List.Icon {...p} icon="account" />}
                      onPress={() => { setAssignUserId(String(u.id)); setAssignUserName(u.name || u.username); setUserPickerVisible(false); setUserSearch(`${u.name || u.username} (${u.id})`); }} />
                  ))}
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setUserPickerVisible(false)}>关闭</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
            <View style={{ height: 8 }} />
            <TextInput mode="outlined" label="受派用户ID" value={assignUserId} onChangeText={setAssignUserId} />

            <View style={{ height: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox status={alsoCreateTask ? 'checked' : 'unchecked'} onPress={() => setAlsoCreateTask(!alsoCreateTask)} />
              <Text>同时创建或绑定“跟进线索”任务</Text>
            </View>

            {alsoCreateTask ? (
              <View>
                <TextInput mode="outlined" label="任务标题" value={taskTitle} onChangeText={setTaskTitle} />
                <View style={{ height: 8 }} />
                <TextInput mode="outlined" label="截止日期 (YYYY-MM-DD)" value={taskDueDate} onChangeText={setTaskDueDate}
                  right={<TextInput.Icon icon="calendar" onPress={() => { /* noop for web */ }} />} />
                {Platform.OS === 'web' ? null : null}
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <Chip style={{ marginRight: 8 }} onPress={() => quickSetDue(1)}>+1天</Chip>
                  <Chip style={{ marginRight: 8 }} onPress={() => quickSetDue(3)}>+3天</Chip>
                  <Chip onPress={() => quickSetDue(7)}>+7天</Chip>
                </View>
                <View style={{ height: 8 }} />
                <TextInput mode="outlined" label="备注" value={taskNotes} onChangeText={setTaskNotes} multiline />

                {existingTasks.length > 0 ? (
                  <View>
                    <Text style={{ marginTop: 12, marginBottom: 6 }}>选择绑定的历史任务（可选）</Text>
                    {existingTasks.slice(0,6).map(t => (
                      <List.Item
                        key={t.id}
                        title={t.title}
                        description={`${t?.metadata?.status || ''} · ${t?.entity?.name || ''}`}
                        right={(p) => (
                          <Checkbox
                            status={bindTaskId === String(t.id) ? 'checked' : 'unchecked'}
                            onPress={() => setBindTaskId(bindTaskId === String(t.id) ? null : String(t.id))}
                          />
                        )}
                        onPress={() => setBindTaskId(bindTaskId === String(t.id) ? null : String(t.id))}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAssignDialogVisible(false)}>取消</Button>
            <Button onPress={handleAssignConfirm} loading={assigning} disabled={assigning}>确定</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 状态对话框 */}
      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={toggleStatusDialog}>
          <Dialog.Title>更新线索状态</Dialog.Title>
          <Dialog.Content>
            <View style={styles.statusOptions}>
              {(Object.values(LeadStatus) as any).map((status: any) => (
                <Chip
                  key={status}
                  mode="flat"
                  selected={(lead.status as any) === status}
                  onPress={() => handleStatusUpdate(status)}
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(status as any) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {getStatusName(status as any)}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={toggleStatusDialog}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 状态信息 */}
        <View style={styles.statusContainer}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(lead.status as any) },
            ]}
            textStyle={styles.statusChipText}
          >
            {getStatusName(lead.status as any)}
          </Chip>
          {lead.score !== undefined && (
            <Chip style={styles.scoreChip}>
              得分: {lead.score}
            </Chip>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <Divider style={styles.divider} />
          
          <List.Item title="姓名" description={lead.name || '未设置'} left={(p) => <List.Icon {...p} icon="account" />} />
          <List.Item title="电话" description={lead.phone || '未设置'} left={(p) => <List.Icon {...p} icon="phone" />} />
          {lead.email && (<List.Item title="邮箱" description={lead.email} left={(p) => <List.Icon {...p} icon="email" />} />)}
          {lead.wechat && (<List.Item title="微信" description={lead.wechat} left={(p) => <List.Icon {...p} icon="wechat" />} />)}
          {lead.gender && (<List.Item title="性别" description={{male:'男',female:'女',other:'其他',unknown:'未知'}[lead.gender] || lead.gender} left={(p) => <List.Icon {...p} icon="face-man" />} />)}
          {lead.birth_date && (<List.Item title="出生日期" description={new Date(lead.birth_date).toLocaleDateString()} left={(p) => <List.Icon {...p} icon="calendar" />} />)}
          {lead.occupation && (<List.Item title="职业" description={lead.occupation} left={(p) => <List.Icon {...p} icon="briefcase" />} />)}
          {lead.annual_income !== undefined && lead.annual_income !== null && (
            <List.Item title="年收入" description={`${lead.annual_income}`} left={(p) => <List.Icon {...p} icon="cash" />} />
          )}
          {(lead.province || lead.city || lead.district) && (
            <List.Item title="地区" description={`${lead.province || ''}${lead.city ? ' / ' + lead.city : ''}${lead.district ? ' / ' + lead.district : ''}`} left={(p) => <List.Icon {...p} icon="map-marker" />} />
          )}
          {lead.address && (<List.Item title="详细地址" description={lead.address} left={(p) => <List.Icon {...p} icon="home" />} />)}
          {lead.postal_code && (<List.Item title="邮政编码" description={lead.postal_code} left={(p) => <List.Icon {...p} icon="mailbox" />} />)}
          <List.Item title="来源" description={getSourceName(lead.source)} left={(p) => <List.Icon {...p} icon="source-branch" />} />
          {lead.status && (
            <List.Item title="状态" description={getStatusName(lead.status as any)} left={(p) => <List.Icon {...p} icon="tag" />} />
          )}
          {lead.priority && (<List.Item title="优先级" description={{low:'低',medium:'中',high:'高'}[lead.priority] || lead.priority} left={(p) => <List.Icon {...p} icon="flag" />} />)}
          {lead.quality_grade && (<List.Item title="质量等级" description={`${lead.quality_grade}级`} left={(p) => <List.Icon {...p} icon="star" />} />)}
          {lead.value_grade && (<List.Item title="价值等级" description={{high:'高价值',medium:'中等价值',low:'低价值'}[lead.value_grade] || lead.value_grade} left={(p) => <List.Icon {...p} icon="diamond-stone" />} />)}
          {lead.urgency_grade && (<List.Item title="紧急度" description={{urgent:'紧急',high:'高',medium:'中',low:'低'}[lead.urgency_grade] || lead.urgency_grade} left={(p) => <List.Icon {...p} icon="alert" />} />)}
          {lead.notes && (<List.Item title="备注" description={lead.notes} left={(p) => <List.Icon {...p} icon="note-text" />} />)}
          {lead.assigned_user && (<List.Item title="负责人" description={lead.assigned_user.name} left={(p) => <List.Icon {...p} icon="account-check" />} />)}
        </View>

        {/* 跟进信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>跟进信息</Text>
          <Divider style={styles.divider} />
          
          {lead.last_contacted_at && (
            <List.Item
              title="最近联系"
              description={new Date(lead.last_contacted_at).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
            />
          )}
          {lead.follow_up_at && (
            <List.Item
              title="下次跟进"
              description={new Date(lead.follow_up_at).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            />
          )}
          <List.Item title="创建时间" description={lead.created_at ? new Date(lead.created_at).toLocaleString() : '未设置'} left={(p) => <List.Icon {...p} icon="calendar-plus" />} />
          <List.Item title="更新时间" description={lead.updated_at ? new Date(lead.updated_at).toLocaleString() : '未设置'} left={(p) => <List.Icon {...p} icon="calendar-edit" />} />
        </View>

        {/* 需求信息 */}
        {lead.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>需求信息</Text>
            <Divider style={styles.divider} />
            <Text style={styles.requirements}>{lead.requirements}</Text>
          </View>
        )}

        {/* 备注信息 */}
        {lead.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Divider style={styles.divider} />
            <Text style={styles.notes}>{lead.notes}</Text>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={navigateToEdit}
            style={[styles.actionButton, styles.editButton]}
            icon="pencil"
          >
            编辑线索
          </Button>
          <Button
            mode="outlined"
            onPress={handleConvertLead}
            style={styles.actionButton}
            loading={convertLeadMutation.isPending}
            disabled={
              convertLeadMutation.isPending ||
              lead.status === LeadStatus.CLOSED_LOST
            }
            icon="swap-horizontal"
          >
            转换为需求
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  statusChip: {
    marginRight: spacing.small,
  },
  statusChipText: {
    color: 'white',
  },
  scoreChip: {
    backgroundColor: colors.grey200,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  divider: {
    marginVertical: spacing.small,
  },
  requirements: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  notes: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.medium,
    marginBottom: spacing.xlarge,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
});

export default LeadDetailScreen; 