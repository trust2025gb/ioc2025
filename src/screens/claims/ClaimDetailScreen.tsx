/**
 * 理赔详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Divider, List, Chip, Menu, Portal, Dialog, Card, Badge, ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, Claim, ClaimStatus, ClaimType, ClaimDetail, ClaimTimelineEvent } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔详情页面组件
 */
const ClaimDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.DETAIL>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [appealDialogVisible, setAppealDialogVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'timeline'

  // 获取理赔详情
  const {
    data: claim,
    isLoading: isLoadingClaim,
    error: claimError,
    refetch: refetchClaim,
  } = useQuery({
    queryKey: ['claim-detail', id],
    queryFn: () => claimService.getClaimDetail(id),
  });

  // 取消理赔
  const cancelClaimMutation = useMutation({
    mutationFn: (reason: string) => claimService.cancelClaim(id, reason),
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-detail', id] });
      setCancelDialogVisible(false);
      setCancelReason('');
    },
    onError: (error) => {
      console.error('取消理赔失败:', error);
    },
    onSettled: () => {
      setActionInProgress(false);
    },
  });

  // 申诉理赔
  const appealClaimMutation = useMutation({
    mutationFn: (reason: string) => claimService.appealClaim(id, reason),
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-detail', id] });
      setAppealDialogVisible(false);
      setAppealReason('');
    },
    onError: (error) => {
      console.error('申诉理赔失败:', error);
    },
    onSettled: () => {
      setActionInProgress(false);
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

  // 导航到文档页面
  const navigateToDocuments = () => {
    if (claim) {
      navigation.navigate(ROUTES.CLAIMS.DOCUMENTS, { id, claim });
    }
  };

  // 导航到时间线页面
  const navigateToTimeline = () => {
    if (claim) {
      navigation.navigate(ROUTES.CLAIMS.TIMELINE, { id });
    }
  };

  // 导航到理赔支付页面
  const navigateToPayment = () => {
    if (claim) {
      navigation.navigate(ROUTES.CLAIMS.PAYMENT, { id });
    }
  };

  // 处理取消理赔
  const handleCancelClaim = () => {
    if (cancelReason.trim()) {
      cancelClaimMutation.mutate(cancelReason);
    }
  };

  // 处理申诉理赔
  const handleAppealClaim = () => {
    if (appealReason.trim()) {
      appealClaimMutation.mutate(appealReason);
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

  // 获取理赔类型显示名称
  const getTypeName = (type: ClaimType) => {
    switch (type) {
      case ClaimType.MEDICAL:
        return '医疗理赔';
      case ClaimType.PROPERTY:
        return '财产理赔';
      case ClaimType.AUTO:
        return '车辆理赔';
      case ClaimType.LIFE:
        return '人寿理赔';
      case ClaimType.LIABILITY:
        return '责任理赔';
      case ClaimType.BUSINESS:
        return '商业理赔';
      case ClaimType.TRAVEL:
        return '旅行理赔';
      case ClaimType.OTHER:
        return '其他';
      default:
        return '未知';
    }
  };

  // 获取理赔类型图标
  const getTypeIcon = (type: ClaimType) => {
    switch (type) {
      case ClaimType.MEDICAL:
        return 'medical-bag';
      case ClaimType.PROPERTY:
        return 'home';
      case ClaimType.AUTO:
        return 'car';
      case ClaimType.LIFE:
        return 'heart-pulse';
      case ClaimType.LIABILITY:
        return 'gavel';
      case ClaimType.BUSINESS:
        return 'office-building';
      case ClaimType.TRAVEL:
        return 'airplane';
      case ClaimType.OTHER:
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString();
  };

  // 格式化货币
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '未设置';
    return `¥${value.toLocaleString('zh-CN')}`;
  };

  // 渲染理赔详情
  const renderClaimDetails = () => {
    if (!claim) return null;

    return (
      <View style={styles.detailsContainer}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.claimTitle}>{claim.title}</Text>
            <View style={styles.headerDetails}>
              <View style={styles.headerInfo}>
                <Text style={styles.claimNumber}>理赔号: {claim.claim_number}</Text>
                <View style={styles.typeContainer}>
                  <Icon name={getTypeIcon(claim.type)} size={16} color={colors.primary} style={styles.typeIcon} />
                  <Text style={styles.typeText}>{getTypeName(claim.type)}</Text>
                </View>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(claim.status) }]}
                textStyle={styles.statusChipText}
              >
                {getStatusName(claim.status)}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Title title="基本信息" />
          <Card.Content>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>客户名称</Text>
                <Text style={styles.infoValue}>{claim.customer_name}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>客户ID</Text>
                <Text style={styles.infoValue}>{claim.customer_id}</Text>
              </View>
            </View>
            
            {claim.policy_number && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>保单号</Text>
                  <Text style={styles.infoValue}>{claim.policy_number}</Text>
                </View>
                
                {claim.policy_id && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>保单ID</Text>
                    <Text style={styles.infoValue}>{claim.policy_id}</Text>
                  </View>
                )}
              </View>
            )}
            
            {claim.description && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.descriptionLabel}>理赔描述</Text>
                <Text style={styles.description}>{claim.description}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Title title="日期信息" />
          <Card.Content>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>创建日期</Text>
                <Text style={styles.dateValue}>{formatDate(claim.created_at)}</Text>
              </View>
              
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>最后更新</Text>
                <Text style={styles.dateValue}>{formatDate(claim.updated_at)}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>事故日期</Text>
                <Text style={styles.dateValue}>{formatDate(claim.incident_date)}</Text>
              </View>
              
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>报告日期</Text>
                <Text style={styles.dateValue}>{formatDate(claim.reported_date)}</Text>
              </View>
            </View>
            
            {claim.settlement_date && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.settlementDateContainer}>
                  <Icon name="calendar-check" size={20} color={colors.success} />
                  <Text style={styles.settlementDateText}>结算于 {formatDate(claim.settlement_date)}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Title title="理赔金额" />
          <Card.Content>
            <View style={styles.amountsContainer}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>理赔申请金额</Text>
                <Text style={styles.amountValue}>{formatCurrency(claim.claim_amount)}</Text>
              </View>
              
              <Divider style={styles.amountDivider} />
              
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>批准金额</Text>
                <Text style={[
                  styles.amountValue, 
                  claim.approved_amount !== undefined ? 
                    (claim.approved_amount === claim.claim_amount ? styles.successText : 
                     claim.approved_amount === 0 ? styles.errorText : 
                     styles.warningText) : 
                    {}
                ]}>
                  {formatCurrency(claim.approved_amount)}
                </Text>
              </View>
              
              <Divider style={styles.amountDivider} />
              
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>已赔付金额</Text>
                <Text style={[
                  styles.amountValue, 
                  claim.paid_amount !== undefined ?
                    (claim.paid_amount === claim.approved_amount ? styles.successText : 
                     styles.warningText) : 
                    {}
                ]}>
                  {formatCurrency(claim.paid_amount)}
                </Text>
              </View>
              
              {claim.deductible_amount !== undefined && claim.deductible_amount > 0 && (
                <>
                  <Divider style={styles.amountDivider} />
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>免赔额</Text>
                    <Text style={styles.amountValue}>{formatCurrency(claim.deductible_amount)}</Text>
                  </View>
                </>
              )}
            </View>
          </Card.Content>
        </Card>

        {claim.location || claim.contact_phone || claim.contact_email ? (
          <Card style={styles.sectionCard}>
            <Card.Title title="联系信息" />
            <Card.Content>
              {claim.location && (
                <View style={styles.contactRow}>
                  <Icon name="map-marker" size={20} color={colors.grey600} />
                  <Text style={styles.contactText}>{claim.location}</Text>
                </View>
              )}
              
              {claim.contact_phone && (
                <View style={styles.contactRow}>
                  <Icon name="phone" size={20} color={colors.grey600} />
                  <Text style={styles.contactText}>{claim.contact_phone}</Text>
                </View>
              )}
              
              {claim.contact_email && (
                <View style={styles.contactRow}>
                  <Icon name="email" size={20} color={colors.grey600} />
                  <Text style={styles.contactText}>{claim.contact_email}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ) : null}

        {claim.handler_name && (
          <Card style={styles.sectionCard}>
            <Card.Title title="处理信息" />
            <Card.Content>
              <View style={styles.handlerContainer}>
                <Icon name="account-tie" size={24} color={colors.primary} />
                <Text style={styles.handlerName}>处理人: {claim.handler_name}</Text>
              </View>
              
              {claim.handler_notes && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.notesLabel}>处理备注</Text>
                  <Text style={styles.notes}>{claim.handler_notes}</Text>
                </>
              )}
              
              {claim.rejection_reason && claim.status === ClaimStatus.REJECTED && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.rejectionLabel}>拒绝原因</Text>
                  <Text style={styles.rejectionText}>{claim.rejection_reason}</Text>
                </>
              )}
              
              {claim.settlement_notes && (claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.CLOSED) && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.settlementLabel}>结算备注</Text>
                  <Text style={styles.settlementText}>{claim.settlement_notes}</Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {claim.is_emergency && (
          <Card style={[styles.sectionCard, styles.emergencyCard]}>
            <Card.Content style={styles.emergencyContent}>
              <Icon name="alert" size={24} color={colors.error} />
              <Text style={styles.emergencyText}>紧急理赔</Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            icon="file-document-outline"
            style={styles.actionButton}
            onPress={navigateToDocuments}
          >
            查看文档{claim.documents_count ? ` (${claim.documents_count})` : ''}
          </Button>
          
          <Button 
            mode="contained" 
            icon="timeline-clock"
            style={styles.actionButton}
            onPress={navigateToTimeline}
          >
            查看时间线
          </Button>
        </View>

        {claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.PARTIALLY_APPROVED ? (
          <Button 
            mode="contained" 
            icon="cash-check"
            style={[styles.fullWidthButton, styles.paymentButton]}
            onPress={navigateToPayment}
          >
            申请赔付
          </Button>
        ) : null}

        {claim.status === ClaimStatus.REJECTED ? (
          <Button 
            mode="contained" 
            icon="gavel"
            style={[styles.fullWidthButton, styles.appealButton]}
            onPress={() => setAppealDialogVisible(true)}
          >
            申诉理赔
          </Button>
        ) : null}
      </View>
    );
  };

  // 渲染理赔时间线
  const renderClaimTimeline = () => {
    if (!claim || !claim.timeline || claim.timeline.length === 0) {
      return (
        <EmptyState
          title="暂无时间线记录"
          message="该理赔暂无时间线记录"
          icon="timeline-outline"
        />
      );
    }

    return (
      <View style={styles.timelineContainer}>
        {claim.timeline.map((event, index) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={styles.timelineDot} />
              {index < claim.timeline.length - 1 && <View style={styles.timelineBar} />}
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>
                {new Date(event.created_at).toLocaleString()}
              </Text>
              <Text style={styles.timelineTitle}>
                {event.event_type}
              </Text>
              <Text style={styles.timelineDescription}>
                {event.description}
              </Text>
              
              {event.status_change && (
                <View style={styles.statusChangeContainer}>
                  <Chip 
                    style={[styles.smallStatusChip, { backgroundColor: getStatusColor(event.status_change.from) }]}
                    textStyle={styles.smallChipText}
                  >
                    {getStatusName(event.status_change.from)}
                  </Chip>
                  <Icon name="arrow-right" size={16} color={colors.grey500} style={styles.statusChangeArrow} />
                  <Chip 
                    style={[styles.smallStatusChip, { backgroundColor: getStatusColor(event.status_change.to) }]}
                    textStyle={styles.smallChipText}
                  >
                    {getStatusName(event.status_change.to)}
                  </Chip>
                </View>
              )}
              
              {event.notes && (
                <Text style={styles.timelineNotes}>
                  {event.notes}
                </Text>
              )}
              
              {event.created_by && (
                <Text style={styles.timelineCreatedBy}>
                  由 {event.created_by} 创建
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 渲染标签页按钮
  const renderTabButtons = () => (
    <View style={styles.tabsContainer}>
      <Button
        mode={activeTab === 'details' ? 'contained' : 'outlined'}
        onPress={() => setActiveTab('details')}
        style={[
          styles.tabButton,
          activeTab === 'details' ? styles.activeTabButton : {}
        ]}
        labelStyle={activeTab === 'details' ? styles.activeTabLabel : {}}
      >
        详细信息
      </Button>
      <Button
        mode={activeTab === 'timeline' ? 'contained' : 'outlined'}
        onPress={() => setActiveTab('timeline')}
        style={[
          styles.tabButton,
          activeTab === 'timeline' ? styles.activeTabButton : {}
        ]}
        labelStyle={activeTab === 'timeline' ? styles.activeTabLabel : {}}
      >
        时间线
      </Button>
    </View>
  );

  if (isLoadingClaim) {
    return <Loading loading={true} message="加载理赔信息..." />;
  }

  if (claimError || !claim) {
    return (
      <Container safeArea>
        <EmptyState
          title="加载失败"
          message="无法加载理赔数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchClaim}
        />
      </Container>
    );
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="理赔详情"
        showBackButton={true}
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
        {claim.status === ClaimStatus.SUBMITTED && (
          <>
            <Menu.Item
              onPress={() => {
                toggleMenu();
                setCancelDialogVisible(true);
              }}
              title="取消理赔"
              leadingIcon="cancel"
            />
            <Divider />
          </>
        )}
        <Menu.Item
          onPress={() => {
            toggleMenu();
            refetchClaim();
          }}
          title="刷新数据"
          leadingIcon="refresh"
        />
      </Menu>

      {/* 取消理赔对话框 */}
      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>取消理赔</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>请输入取消原因:</Text>
            <TextInput
              style={styles.reasonInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              placeholder="例如：信息填写错误、重复提交等"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>关闭</Button>
            <Button 
              onPress={handleCancelClaim} 
              disabled={!cancelReason.trim() || actionInProgress}
              loading={actionInProgress}
            >
              确认取消
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 申诉理赔对话框 */}
      <Portal>
        <Dialog visible={appealDialogVisible} onDismiss={() => setAppealDialogVisible(false)}>
          <Dialog.Title>申诉理赔</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>请输入申诉理由:</Text>
            <TextInput
              style={styles.reasonInput}
              value={appealReason}
              onChangeText={setAppealReason}
              multiline
              numberOfLines={3}
              placeholder="请详细说明申诉理由和相关证据..."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAppealDialogVisible(false)}>关闭</Button>
            <Button 
              onPress={handleAppealClaim} 
              disabled={!appealReason.trim() || actionInProgress}
              loading={actionInProgress}
            >
              提交申诉
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 标签页切换按钮 */}
      {renderTabButtons()}

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'details' ? renderClaimDetails() : renderClaimTimeline()}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.background,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  activeTabLabel: {
    color: colors.white,
  },
  detailsContainer: {
    padding: spacing.medium,
  },
  timelineContainer: {
    padding: spacing.medium,
  },
  headerCard: {
    marginBottom: spacing.medium,
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  headerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  claimNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: spacing.tiny,
  },
  typeText: {
    fontSize: 14,
    color: colors.primary,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: colors.white,
  },
  sectionCard: {
    marginBottom: spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: spacing.small,
  },
  descriptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  description: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  settlementDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  settlementDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
    marginLeft: spacing.tiny,
  },
  amountsContainer: {
    padding: spacing.small,
    backgroundColor: colors.grey100,
    borderRadius: 8,
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountDivider: {
    backgroundColor: colors.grey300,
  },
  successText: {
    color: colors.success,
  },
  warningText: {
    color: colors.warning,
  },
  errorText: {
    color: colors.error,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  contactText: {
    fontSize: 14,
    marginLeft: spacing.medium,
  },
  handlerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  handlerName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.medium,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  notes: {
    fontSize: 14,
  },
  rejectionLabel: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.tiny,
  },
  rejectionText: {
    fontSize: 14,
    color: colors.error,
  },
  settlementLabel: {
    fontSize: 12,
    color: colors.success,
    marginBottom: spacing.tiny,
  },
  settlementText: {
    fontSize: 14,
    color: colors.success,
  },
  emergencyCard: {
    backgroundColor: colors.errorLight,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: spacing.medium,
  },
  actionsContainer: {
    marginTop: spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  },
  fullWidthButton: {
    marginTop: spacing.medium,
  },
  paymentButton: {
    backgroundColor: colors.success,
  },
  appealButton: {
    backgroundColor: colors.orange,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dialogText: {
    marginBottom: spacing.medium,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 4,
    padding: spacing.small,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.large,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineBar: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginBottom: -spacing.large,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.medium,
    backgroundColor: colors.grey100,
    padding: spacing.medium,
    borderRadius: 8,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.tiny,
  },
  timelineDescription: {
    fontSize: 14,
    marginBottom: spacing.small,
  },
  statusChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  smallStatusChip: {
    height: 24,
  },
  smallChipText: {
    fontSize: 10,
    color: colors.white,
  },
  statusChangeArrow: {
    marginHorizontal: spacing.small,
  },
  timelineNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.small,
  },
  timelineCreatedBy: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.small,
    textAlign: 'right',
  },
});

export default ClaimDetailScreen; 