/**
 * 理赔时间线页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, Button, Dialog, Portal, TextInput, Divider, FAB } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, ClaimTimelineEvent, ClaimStatus } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔时间线页面组件
 */
const ClaimTimelineScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.TIMELINE>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [isAddEventDialogVisible, setAddEventDialogVisible] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 获取理赔详情
  const {
    data: claimDetail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claim-detail', id],
    queryFn: () => claimService.getClaimDetail(id),
  });

  // 添加时间线事件
  const addEventMutation = useMutation({
    mutationFn: ({
      eventType,
      description,
      notes,
    }: {
      eventType: string;
      description: string;
      notes?: string;
    }) => {
      return claimService.addClaimTimelineEvent(
        id,
        eventType,
        description,
        notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-detail', id] });
      resetForm();
      Alert.alert('成功', '事件已添加到时间线', [{ text: '确定' }]);
    },
    onError: (error) => {
      console.error('添加时间线事件失败:', error);
      Alert.alert('错误', '无法添加时间线事件', [{ text: '确定' }]);
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 显示添加事件对话框
  const showAddEventDialog = () => {
    setAddEventDialogVisible(true);
  };

  // 隐藏添加事件对话框
  const hideAddEventDialog = () => {
    setAddEventDialogVisible(false);
    resetForm();
  };

  // 重置表单
  const resetForm = () => {
    setNewEventType('');
    setNewEventDescription('');
    setNewEventNotes('');
    setAddEventDialogVisible(false);
  };

  // 提交新事件
  const handleSubmitEvent = () => {
    if (!newEventType || !newEventDescription) {
      Alert.alert('错误', '请填写事件类型和描述', [{ text: '确定' }]);
      return;
    }

    addEventMutation.mutate({
      eventType: newEventType,
      description: newEventDescription,
      notes: newEventNotes || undefined,
    });
  };

  // 获取状态显示名称
  const getStatusName = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.SUBMITTED:
        return '已提交';
      case ClaimStatus.REVIEWING:
        return '审核中';
      case ClaimStatus.PENDING_DOCUMENTS:
        return '等待文档';
      case ClaimStatus.APPROVED:
        return '已批准';
      case ClaimStatus.PARTIALLY_APPROVED:
        return '部分批准';
      case ClaimStatus.REJECTED:
        return '已拒绝';
      case ClaimStatus.PAID:
        return '已赔付';
      case ClaimStatus.CLOSED:
        return '已关闭';
      case ClaimStatus.APPEALING:
        return '申诉中';
      default:
        return '未知';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.SUBMITTED:
        return colors.info;
      case ClaimStatus.REVIEWING:
        return colors.warning;
      case ClaimStatus.PENDING_DOCUMENTS:
        return colors.grey500;
      case ClaimStatus.APPROVED:
        return colors.success;
      case ClaimStatus.PARTIALLY_APPROVED:
        return colors.primary;
      case ClaimStatus.REJECTED:
        return colors.error;
      case ClaimStatus.PAID:
        return colors.success;
      case ClaimStatus.CLOSED:
        return colors.grey800;
      case ClaimStatus.APPEALING:
        return colors.warning;
      default:
        return colors.grey500;
    }
  };

  // 获取事件图标
  const getEventIcon = (eventType: string) => {
    const lowerEventType = eventType.toLowerCase();

    if (lowerEventType.includes('创建') || lowerEventType.includes('提交')) {
      return 'file-document-plus';
    } else if (lowerEventType.includes('审核') || lowerEventType.includes('审查')) {
      return 'magnify';
    } else if (lowerEventType.includes('批准') || lowerEventType.includes('通过')) {
      return 'check-circle';
    } else if (lowerEventType.includes('拒绝') || lowerEventType.includes('驳回')) {
      return 'close-circle';
    } else if (lowerEventType.includes('文档') || lowerEventType.includes('附件')) {
      return 'file-document';
    } else if (lowerEventType.includes('支付') || lowerEventType.includes('赔付')) {
      return 'cash-check';
    } else if (lowerEventType.includes('取消')) {
      return 'cancel';
    } else if (lowerEventType.includes('申诉')) {
      return 'gavel';
    } else if (lowerEventType.includes('更新') || lowerEventType.includes('修改')) {
      return 'update';
    } else if (lowerEventType.includes('备注') || lowerEventType.includes('注释')) {
      return 'note-text';
    } else if (lowerEventType.includes('联系') || lowerEventType.includes('沟通')) {
      return 'message-text';
    } else if (lowerEventType.includes('关闭') || lowerEventType.includes('完成')) {
      return 'check-circle-outline';
    } else {
      return 'clock-outline';
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染时间线事件
  const renderTimelineEvents = () => {
    if (!claimDetail || !claimDetail.timeline || claimDetail.timeline.length === 0) {
      return (
        <EmptyState
          title="暂无时间线记录"
          message="该理赔暂无时间线记录"
          icon="timeline-outline"
        />
      );
    }

    // 按创建时间降序排列
    const sortedEvents = [...claimDetail.timeline].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
      <View style={styles.timelineContainer}>
        {sortedEvents.map((event, index) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={styles.timelineDot}>
                <Icon name={getEventIcon(event.event_type)} size={16} color={colors.white} />
              </View>
              {index < sortedEvents.length - 1 && <View style={styles.timelineBar} />}
            </View>
            
            <Card style={styles.eventCard}>
              <Card.Content>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventType}>{event.event_type}</Text>
                  <Text style={styles.eventDate}>{formatDateTime(event.created_at)}</Text>
                </View>
                
                <Text style={styles.eventDescription}>{event.description}</Text>
                
                {event.status_change && (
                  <View style={styles.statusChange}>
                    <Chip 
                      style={[styles.statusChip, { backgroundColor: getStatusColor(event.status_change.from) }]}
                      textStyle={styles.statusChipText}
                    >
                      {getStatusName(event.status_change.from)}
                    </Chip>
                    <Icon name="arrow-right" size={20} color={colors.grey500} style={styles.arrowIcon} />
                    <Chip 
                      style={[styles.statusChip, { backgroundColor: getStatusColor(event.status_change.to) }]}
                      textStyle={styles.statusChipText}
                    >
                      {getStatusName(event.status_change.to)}
                    </Chip>
                  </View>
                )}
                
                {event.notes && (
                  <View style={styles.notesContainer}>
                    <Divider style={styles.notesDivider} />
                    <Text style={styles.notesText}>{event.notes}</Text>
                  </View>
                )}
                
                {event.created_by && (
                  <View style={styles.createdByContainer}>
                    <Text style={styles.createdByText}>处理人: {event.created_by}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return <Loading loading={true} message="加载时间线..." />;
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="理赔时间线"
        showBackButton={true}
        onBackPress={handleBack}
      />

      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {error ? (
          <EmptyState
            title="加载失败"
            message="无法加载时间线数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : (
          renderTimelineEvents()
        )}
      </ScrollView>

      {/* 添加事件按钮 */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={showAddEventDialog}
        color={colors.white}
      />

      {/* 添加事件对话框 */}
      <Portal>
        <Dialog visible={isAddEventDialogVisible} onDismiss={hideAddEventDialog}>
          <Dialog.Title>添加时间线事件</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="事件类型 *"
              value={newEventType}
              onChangeText={setNewEventType}
              style={styles.input}
            />
            <TextInput
              label="事件描述 *"
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <TextInput
              label="备注（可选）"
              value={newEventNotes}
              onChangeText={setNewEventNotes}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideAddEventDialog}>取消</Button>
            <Button 
              onPress={handleSubmitEvent}
              loading={addEventMutation.isPending}
              disabled={addEventMutation.isPending || !newEventType || !newEventDescription}
            >
              添加
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  timelineContainer: {
    padding: spacing.medium,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.large,
  },
  timelineLine: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timelineBar: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginLeft: 15,
    position: 'absolute',
    top: 32,
    bottom: -spacing.large,
  },
  eventCard: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  eventType: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  eventDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  eventDescription: {
    marginBottom: spacing.medium,
    fontSize: 14,
  },
  statusChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: colors.white,
    fontSize: 12,
  },
  arrowIcon: {
    marginHorizontal: spacing.small,
  },
  notesContainer: {
    marginVertical: spacing.small,
  },
  notesDivider: {
    marginBottom: spacing.small,
  },
  notesText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 13,
  },
  createdByContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.tiny,
  },
  createdByText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: spacing.medium,
    right: spacing.medium,
    bottom: spacing.medium,
    backgroundColor: colors.primary,
  },
  input: {
    marginBottom: spacing.medium,
    backgroundColor: colors.grey100,
  },
});

export default ClaimTimelineScreen; 