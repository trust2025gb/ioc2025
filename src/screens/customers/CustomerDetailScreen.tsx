/**
 * 客户详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Button, Divider, List, Chip, Menu, Dialog, Portal, Avatar, Card as PaperCard } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import {
  customerService,
  Customer,
  CustomerStatus,
  CustomerType,
  PolicySummary,
  ClaimSummary
} from '../../api/services/customerService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { CustomersStackParamList } from '../../navigation/types';
import { chatService, Message } from '../../api/services/chatService';

/**
 * 客户详情页面组件
 */
const CustomerDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<RouteProp<CustomersStackParamList, typeof ROUTES.CUSTOMERS.DETAIL>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'policies' | 'claims'>('info');

  // 获取客户详情
  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: customerError,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomer(id),
  });

  // 获取客户保单
  const {
    data: policies,
    isLoading: isLoadingPolicies,
    error: policiesError,
    refetch: refetchPolicies,
  } = useQuery({
    queryKey: ['customer-policies', id],
    queryFn: () => customerService.getCustomerPolicies(id),
    enabled: activeTab === 'policies',
  });

  // 获取客户理赔
  const {
    data: claims,
    isLoading: isLoadingClaims,
    error: claimsError,
    refetch: refetchClaims,
  } = useQuery({
    queryKey: ['customer-claims', id],
    queryFn: () => customerService.getCustomerClaims(id),
    enabled: activeTab === 'claims',
  });

  // 更新客户状态
  const updateCustomerStatusMutation = useMutation({
    mutationFn: (status: CustomerStatus) => 
      customerService.updateCustomer(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    },
  });

  // 删除客户
  const deleteCustomerMutation = useMutation({
    mutationFn: () => customerService.deleteCustomer(id),
    onSuccess: () => {
      navigation.goBack();
      // 刷新客户列表
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  // 显示/隐藏删除对话框
  const toggleDeleteDialog = () => {
    setDeleteDialogVisible(!deleteDialogVisible);
  };

  // 导航到编辑页面
  const navigateToEdit = () => {
    navigation.navigate(ROUTES.CUSTOMERS.EDIT, { id, customer });
  };

  // 导航到保单页面
  const navigateToPolicies = () => {
    navigation.navigate(ROUTES.CUSTOMERS.POLICIES, { id, customer });
  };

  // 导航到理赔页面
  const navigateToClaims = () => {
    navigation.navigate(ROUTES.CUSTOMERS.CLAIMS, { id, customer });
  };

  // 处理状态更新
  const handleStatusUpdate = (status: CustomerStatus) => {
    updateCustomerStatusMutation.mutate(status);
    setStatusDialogVisible(false);
  };

  // 处理删除客户
  const handleDeleteCustomer = () => {
    deleteCustomerMutation.mutate();
    setDeleteDialogVisible(false);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return colors.success;
      case CustomerStatus.INACTIVE:
        return colors.grey500;
      case CustomerStatus.POTENTIAL:
        return colors.info;
      case CustomerStatus.VIP:
        return colors.warning;
      default:
        return colors.grey500;
    }
  };

  // 获取状态显示名称
  const getStatusName = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return '活跃';
      case CustomerStatus.INACTIVE:
        return '非活跃';
      case CustomerStatus.POTENTIAL:
        return '潜在';
      case CustomerStatus.VIP:
        return 'VIP';
      default:
        return '未知';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: CustomerType) => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return 'account';
      case CustomerType.COMPANY:
        return 'domain';
      case CustomerType.FAMILY:
        return 'home-account';
      default:
        return 'account-question';
    }
  };

  // 获取类型显示名称
  const getTypeName = (type: CustomerType) => {
    switch (type) {
      case CustomerType.INDIVIDUAL:
        return '个人';
      case CustomerType.COMPANY:
        return '企业';
      case CustomerType.FAMILY:
        return '家庭';
      default:
        return '未知';
    }
  };

  // 渲染客户信息标签页
  const renderCustomerInfoTab = () => {
    if (!customer) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.profileHeader}>
          {customer.avatar ? (
            <Avatar.Image size={80} source={{ uri: customer.avatar }} />
          ) : (
            <Avatar.Icon size={80} icon={getTypeIcon(customer.type)} />
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(customer.status) }]}
              textStyle={styles.chipText}
            >
              {getStatusName(customer.status)}
            </Chip>
            <Chip
              style={styles.typeChip}
              icon={() => <Icon name={getTypeIcon(customer.type)} size={14} color={colors.primary} />}
            >
              {getTypeName(customer.type)}
            </Chip>
          </View>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>基本信息</List.Subheader>
          <List.Item
            title="电话"
            description={customer.phone}
            left={() => <List.Icon icon="phone" />}
          />
          {customer.email && (
            <List.Item
              title="邮箱"
              description={customer.email}
              left={() => <List.Icon icon="email" />}
            />
          )}
          {customer.address && (
            <List.Item
              title="地址"
              description={customer.address}
              left={() => <List.Icon icon="map-marker" />}
            />
          )}
          {customer.company && (
            <List.Item
              title="公司"
              description={customer.company}
              left={() => <List.Icon icon="domain" />}
            />
          )}
          {customer.occupation && (
            <List.Item
              title="职业"
              description={customer.occupation}
              left={() => <List.Icon icon="briefcase" />}
            />
          )}
          {customer.identification_number && (
            <List.Item
              title="证件号码"
              description={customer.identification_number}
              left={() => <List.Icon icon="card-account-details" />}
            />
          )}
          {customer.birth_date && (
            <List.Item
              title="出生日期"
              description={new Date(customer.birth_date).toLocaleDateString()}
              left={() => <List.Icon icon="calendar" />}
            />
          )}
          {customer.annual_income !== undefined && (
            <List.Item
              title="年收入"
              description={`¥${customer.annual_income.toLocaleString('zh-CN')}`}
              left={() => <List.Icon icon="currency-cny" />}
            />
          )}
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>统计信息</List.Subheader>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{customer.policies_count || 0}</Text>
              <Text style={styles.statLabel}>保单数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{customer.claims_count || 0}</Text>
              <Text style={styles.statLabel}>理赔数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{customer.orders_count || 0}</Text>
              <Text style={styles.statLabel}>订单数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                ¥{(customer.total_premium || 0).toLocaleString('zh-CN')}
              </Text>
              <Text style={styles.statLabel}>总保费</Text>
            </View>
          </View>
        </List.Section>

        {customer.notes && (
          <>
            <Divider style={styles.divider} />
            <List.Section>
              <List.Subheader>备注</List.Subheader>
              <PaperCard style={styles.notesCard}>
                <PaperCard.Content>
                  <Text>{customer.notes}</Text>
                </PaperCard.Content>
              </PaperCard>
            </List.Section>
          </>
        )}
      </View>
    );
  };

  // 渲染保单列表标签页
  const renderCustomerPoliciesTab = () => {
    if (isLoadingPolicies) {
      return <Loading loading={true} message="加载保单中..." />;
    }

    if (policiesError) {
      return (
        <EmptyState
          title="加载失败"
          message="无法加载保单数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchPolicies}
        />
      );
    }

    if (!policies || policies.length === 0) {
      return (
        <EmptyState
          title="暂无保单"
          message="该客户暂无保单数据"
          icon="file-document-outline"
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        <List.Section>
          {policies.map((policy) => (
            <PaperCard key={policy.id} style={styles.policyCard}>
              <PaperCard.Title
                title={policy.product_name}
                subtitle={`保单号: ${policy.policy_number}`}
                right={(props) => (
                  <Chip mode="outlined" style={{ backgroundColor: getPolicyStatusColor(policy.status) }}>
                    {policy.status}
                  </Chip>
                )}
              />
              <PaperCard.Content>
                <View style={styles.policyDetails}>
                  <View style={styles.policyDetail}>
                    <Text style={styles.policyDetailLabel}>保费</Text>
                    <Text style={styles.policyDetailValue}>¥{policy.premium.toLocaleString('zh-CN')}</Text>
                  </View>
                  <View style={styles.policyDetail}>
                    <Text style={styles.policyDetailLabel}>保额</Text>
                    <Text style={styles.policyDetailValue}>¥{policy.coverage_amount.toLocaleString('zh-CN')}</Text>
                  </View>
                </View>
                <View style={styles.policyDates}>
                  <Text style={styles.policyDateLabel}>
                    <Icon name="calendar-start" size={14} /> 开始: {new Date(policy.start_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.policyDateLabel}>
                    <Icon name="calendar-end" size={14} /> 结束: {new Date(policy.end_date).toLocaleDateString()}
                  </Text>
                </View>
              </PaperCard.Content>
            </PaperCard>
          ))}
        </List.Section>
      </View>
    );
  };

  // 渲染理赔列表标签页
  const renderCustomerClaimsTab = () => {
    if (isLoadingClaims) {
      return <Loading loading={true} message="加载理赔中..." />;
    }

    if (claimsError) {
      return (
        <EmptyState
          title="加载失败"
          message="无法加载理赔数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchClaims}
        />
      );
    }

    if (!claims || claims.length === 0) {
      return (
        <EmptyState
          title="暂无理赔"
          message="该客户暂无理赔数据"
          icon="file-document-outline"
        />
      );
    }

    return (
      <View style={styles.tabContent}>
        <List.Section>
          {claims.map((claim) => (
            <PaperCard key={claim.id} style={styles.claimCard}>
              <PaperCard.Title
                title={`理赔号: ${claim.claim_number}`}
                subtitle={`保单号: ${claim.policy_number}`}
                right={(props) => (
                  <Chip mode="outlined" style={{ backgroundColor: getClaimStatusColor(claim.status) }}>
                    {claim.status}
                  </Chip>
                )}
              />
              <PaperCard.Content>
                <Text style={styles.claimDescription}>{claim.description}</Text>
                <View style={styles.claimFooter}>
                  <Text style={styles.claimAmount}>
                    <Icon name="currency-cny" size={14} /> 金额: ¥{claim.amount.toLocaleString('zh-CN')}
                  </Text>
                  <Text style={styles.claimDate}>
                    <Icon name="calendar" size={14} /> 提交日期: {new Date(claim.submission_date).toLocaleDateString()}
                  </Text>
                </View>
              </PaperCard.Content>
            </PaperCard>
          ))}
        </List.Section>
      </View>
    );
  };

  // 获取保单状态颜色
  const getPolicyStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case '有效':
        return colors.success;
      case 'pending':
      case '待处理':
        return colors.warning;
      case 'expired':
      case '已过期':
        return colors.error;
      case 'cancelled':
      case '已取消':
        return colors.grey500;
      default:
        return colors.grey500;
    }
  };

  // 获取理赔状态颜色
  const getClaimStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case '已批准':
        return colors.success;
      case 'pending':
      case '处理中':
        return colors.warning;
      case 'rejected':
      case '已拒绝':
        return colors.error;
      case 'review':
      case '审核中':
        return colors.info;
      default:
        return colors.grey500;
    }
  };

  // 渲染标签切换按钮
  const renderTabButtons = () => {
    return (
      <View style={styles.tabButtons}>
        <Button
          mode={activeTab === 'info' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('info')}
          style={styles.tabButton}
          icon="account-details"
        >
          基本信息
        </Button>
        <Button
          mode={activeTab === 'policies' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('policies')}
          style={styles.tabButton}
          icon="file-document"
        >
          保单
        </Button>
        <Button
          mode={activeTab === 'claims' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('claims')}
          style={styles.tabButton}
          icon="cash"
        >
          理赔
        </Button>
      </View>
    );
  };

  // 渲染当前活动标签页内容
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderCustomerInfoTab();
      case 'policies':
        return renderCustomerPoliciesTab();
      case 'claims':
        return renderCustomerClaimsTab();
      default:
        return renderCustomerInfoTab();
    }
  };

  // 从最近聊天抓取关键信息并跳转预填
  const startChatAndPrefill = async () => {
    try {
      toggleMenu();
      // 打开会话创建页（如已有会话，可跳到会话，这里仅示例打开创建页）
      navigation.navigate('ChatTab' as any, { screen: ROUTES.CHAT.CREATE });
      // 如果后端支持“按客户ID查询最近会话”，可在此获取会话并取最近消息
      // 这里先跳过后端查询，提示用户在聊天页长按选择自动预填
      Alert.alert('提示', '已打开聊天页。您可在对话中长按选择消息，选择“添加到线索/客户”自动预填。');
    } catch (e) {
      Alert.alert('提示', '打开聊天失败，请稍后再试');
    }
  };

  if (isLoadingCustomer) {
    return <Loading loading={true} message="加载客户信息..." />;
  }

  if (customerError || !customer) {
    return (
      <Container safeArea>
        <EmptyState
          title="加载失败"
          message="无法加载客户数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchCustomer}
        />
      </Container>
    );
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="客户详情"
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
        <Menu.Item
          onPress={startChatAndPrefill}
          title="发起聊天并预填"
          leadingIcon="message-plus"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            navigateToEdit();
          }}
          title="编辑客户"
          leadingIcon="pencil"
        />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            toggleStatusDialog();
          }}
          title="更新状态"
          leadingIcon="tag"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            refetchCustomer();
          }}
          title="刷新数据"
          leadingIcon="refresh"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            toggleMenu();
            toggleDeleteDialog();
          }}
          title="删除客户"
          leadingIcon="delete"
          titleStyle={{ color: colors.error }}
        />
      </Menu>

      {/* 状态更新对话框 */}
      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={toggleStatusDialog}>
          <Dialog.Title>更新客户状态</Dialog.Title>
          <Dialog.Content>
            <Text>选择客户状态:</Text>
            <View style={styles.statusOptions}>
              {Object.values(CustomerStatus).map((status) => (
                <Chip
                  key={status}
                  mode="outlined"
                  selected={customer.status === status}
                  onPress={() => handleStatusUpdate(status)}
                  style={styles.statusOption}
                  selectedColor={getStatusColor(status)}
                >
                  {getStatusName(status)}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={toggleStatusDialog}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 删除确认对话框 */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={toggleDeleteDialog}>
          <Dialog.Title>删除客户</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除客户 "{customer.name}" 吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={toggleDeleteDialog}>取消</Button>
            <Button onPress={handleDeleteCustomer} textColor={colors.error}>删除</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.content}>
        {renderTabButtons()}

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderActiveTabContent()}
        </ScrollView>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.medium,
  },
  tabButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.small,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  nameContainer: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.small,
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.grey100,
  },
  chipText: {
    color: colors.background,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: spacing.small,
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.grey100,
    borderRadius: radius.medium,
    padding: spacing.medium,
    marginBottom: spacing.small,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.grey600,
    marginTop: spacing.tiny,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.medium,
  },
  statusOption: {
    margin: spacing.tiny,
  },
  notesCard: {
    marginTop: spacing.small,
  },
  policyCard: {
    marginBottom: spacing.medium,
  },
  policyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  policyDetail: {
    alignItems: 'center',
  },
  policyDetailLabel: {
    fontSize: 12,
    color: colors.grey600,
  },
  policyDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  policyDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  policyDateLabel: {
    fontSize: 12,
    color: colors.grey600,
  },
  claimCard: {
    marginBottom: spacing.medium,
  },
  claimDescription: {
    marginBottom: spacing.small,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  claimAmount: {
    fontWeight: 'bold',
  },
  claimDate: {
    fontSize: 12,
    color: colors.grey600,
  },
});

export default CustomerDetailScreen; 