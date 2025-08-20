/**
 * 合同详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Button, Divider, List, Chip, Menu, Portal, Dialog, Card, Badge, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { contractService, Contract, ContractStatus, ContractType } from '../../api/services/contractService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ContractsStackParamList } from '../../navigation/types';

/**
 * 合同详情页面组件
 */
const ContractDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ContractsStackParamList>>();
  const route = useRoute<RouteProp<ContractsStackParamList, typeof ROUTES.CONTRACTS.DETAIL>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [terminateDialogVisible, setTerminateDialogVisible] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [renewDialogVisible, setRenewDialogVisible] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // 获取合同详情
  const {
    data: contract,
    isLoading: isLoadingContract,
    error: contractError,
    refetch: refetchContract,
  } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContract(id),
  });

  // 终止合同
  const terminateContractMutation = useMutation({
    mutationFn: (reason: string) => contractService.terminateContract(id, reason),
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setTerminateDialogVisible(false);
      setTerminateReason('');
    },
    onError: (error) => {
      console.error('终止合同失败:', error);
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

  // 导航到签署页面
  const navigateToSign = () => {
    if (contract) {
      navigation.navigate(ROUTES.CONTRACTS.SIGN, { id, contract });
    }
  };

  // 导航到文档页面
  const navigateToDocuments = () => {
    if (contract) {
      navigation.navigate(ROUTES.CONTRACTS.DOCUMENTS, { id, contract });
    }
  };

  // 处理终止合同
  const handleTerminateContract = () => {
    if (terminateReason.trim()) {
      terminateContractMutation.mutate(terminateReason);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.DRAFT:
        return colors.grey500;
      case ContractStatus.PENDING:
        return colors.warning;
      case ContractStatus.ACTIVE:
        return colors.success;
      case ContractStatus.EXPIRED:
        return colors.error;
      case ContractStatus.TERMINATED:
        return colors.error;
      case ContractStatus.RENEWED:
        return colors.info;
      default:
        return colors.grey500;
    }
  };

  // 获取状态显示名称
  const getStatusName = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.DRAFT:
        return '草稿';
      case ContractStatus.PENDING:
        return '待签署';
      case ContractStatus.ACTIVE:
        return '有效';
      case ContractStatus.EXPIRED:
        return '已过期';
      case ContractStatus.TERMINATED:
        return '已终止';
      case ContractStatus.RENEWED:
        return '已续约';
      default:
        return '未知';
    }
  };

  // 获取类型显示名称
  const getTypeName = (type: ContractType) => {
    switch (type) {
      case ContractType.INSURANCE:
        return '保险合同';
      case ContractType.ENDORSEMENT:
        return '批单';
      case ContractType.RIDER:
        return '附加险';
      case ContractType.AMENDMENT:
        return '合同修改';
      default:
        return '未知';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: ContractType) => {
    switch (type) {
      case ContractType.INSURANCE:
        return 'shield-check';
      case ContractType.ENDORSEMENT:
        return 'note-text';
      case ContractType.RIDER:
        return 'note-plus';
      case ContractType.AMENDMENT:
        return 'file-document-edit';
      default:
        return 'file-question';
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString();
  };

  // 格式化货币
  const formatCurrency = (value?: number) => {
    if (value == null) return '未设置';
    const num = Number(value);
    if (Number.isNaN(num)) return '未设置';
    return `¥${num.toLocaleString('zh-CN')}`;
  };

  // 渲染合同详情
  const renderContractDetails = () => {
    if (!contract) return null;

    return (
      <View style={styles.detailsContainer}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.contractTitle}>{contract.title}</Text>
            <View style={styles.headerDetails}>
              <View style={styles.headerInfo}>
                <Text style={styles.contractNumber}>合同号: {contract.contract_number}</Text>
                <View style={styles.typeContainer}>
                  <Icon name={getTypeIcon(contract.type)} size={16} color={colors.primary} style={styles.typeIcon} />
                  <Text style={styles.typeText}>{getTypeName(contract.type)}</Text>
                </View>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(contract.status) }]}
                textStyle={styles.statusChipText}
              >
                {getStatusName(contract.status)}
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
                <Text style={styles.infoValue}>{contract.customer_name}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>客户ID</Text>
                <Text style={styles.infoValue}>{contract.customer_id}</Text>
              </View>
            </View>
            
            {contract.product_name && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>产品名称</Text>
                  <Text style={styles.infoValue}>{contract.product_name}</Text>
                </View>
                
                {contract.order_id && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>订单ID</Text>
                    <Text style={styles.infoValue}>{contract.order_id}</Text>
                  </View>
                )}
              </View>
            )}
            
            {contract.description && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.descriptionLabel}>合同描述</Text>
                <Text style={styles.description}>{contract.description}</Text>
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
                <Text style={styles.dateValue}>{formatDate(contract.created_at)}</Text>
              </View>
              
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>最后更新</Text>
                <Text style={styles.dateValue}>{formatDate(contract.updated_at)}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>开始日期</Text>
                <Text style={styles.dateValue}>{formatDate(contract.start_date)}</Text>
              </View>
              
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>结束日期</Text>
                <Text style={styles.dateValue}>{formatDate(contract.end_date)}</Text>
              </View>
            </View>
            
            {contract.signed_at && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.signedDateContainer}>
                  <Icon name="calendar-check" size={20} color={colors.success} />
                  <Text style={styles.signedDateText}>签署于 {formatDate(contract.signed_at)}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {contract.total_value !== undefined && (
          <Card style={styles.sectionCard}>
            <Card.Title title="财务信息" />
            <Card.Content>
              <View style={styles.financialRow}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>合同总价值</Text>
                  <Text style={styles.financialValue}>{formatCurrency(contract.total_value)}</Text>
                </View>
              </View>
              
              {contract.payment_terms && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.termsLabel}>支付条款</Text>
                  <Text style={styles.termsText}>{contract.payment_terms}</Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {(contract.is_renewable || contract.auto_renewal || contract.renewal_terms) && (
          <Card style={styles.sectionCard}>
            <Card.Title title="续约信息" />
            <Card.Content>
              <View style={styles.renewalRow}>
                <View style={styles.renewalTag}>
                  <Icon 
                    name={contract.is_renewable ? 'check-circle' : 'close-circle'} 
                    size={20} 
                    color={contract.is_renewable ? colors.success : colors.grey500}
                  />
                  <Text style={styles.renewalText}>可续约</Text>
                </View>
                
                <View style={styles.renewalTag}>
                  <Icon 
                    name={contract.auto_renewal ? 'autorenew' : 'autorenew-off'} 
                    size={20} 
                    color={contract.auto_renewal ? colors.primary : colors.grey500}
                  />
                  <Text style={styles.renewalText}>自动续约</Text>
                </View>
              </View>
              
              {contract.renewal_terms && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.termsLabel}>续约条款</Text>
                  <Text style={styles.termsText}>{contract.renewal_terms}</Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {contract.signature_info && (
          <Card style={styles.sectionCard}>
            <Card.Title title="签署信息" />
            <Card.Content>
              <View style={styles.signatureStatusRow}>
                <Text style={styles.signatureStatusLabel}>签署状态</Text>
                <Chip
                  style={{ backgroundColor: (
                    contract.signature_info?.signature_status === 'fully_signed' ? colors.success :
                    contract.signature_info?.signature_status === 'partially_signed' ? colors.warning :
                    colors.grey300
                  ) }}
                  textStyle={styles.signatureStatusChipText}
                >
                  {contract.signature_info?.signature_status === 'fully_signed' ? '完成签署' :
                   contract.signature_info?.signature_status === 'partially_signed' ? '部分签署' : '未签署'}
                </Chip>
              </View>

              {contract.signature_info?.signatory_name && (
                <>
                  <Divider style={styles.divider} />

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>签署人</Text>
                      <Text style={styles.infoValue}>{contract.signature_info?.signatory_name}</Text>
                    </View>

                    {contract.signature_info?.signatory_title && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>职位</Text>
                        <Text style={styles.infoValue}>{contract.signature_info?.signatory_title}</Text>
                      </View>
                    )}
                  </View>

                  {contract.signature_info?.signature_date && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>签署日期</Text>
                        <Text style={styles.infoValue}>
                          {formatDate(contract.signature_info?.signature_date)}
                        </Text>
                      </View>

                      {contract.signature_info?.signature_method && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>签署方式</Text>
                          <Text style={styles.infoValue}>
                            {
                              contract.signature_info?.signature_method === 'electronic' ? '电子签名' :
                              contract.signature_info?.signature_method === 'handwritten' ? '手写签名' :
                              contract.signature_info?.signature_method === 'digital' ? '数字证书' :
                              '未知'
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {contract.signature_info?.signature_image_url && (
                    <View style={styles.signatureImageContainer}>
                      <Text style={styles.signatureImageLabel}>签名图像</Text>
                      <Image 
                        source={{ uri: contract.signature_info?.signature_image_url }} 
                        style={styles.signatureImage}
                      />
                    </View>
                  )}
                </>
              )}
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
            查看文档{contract.documents_count ? ` (${contract.documents_count})` : ''}
          </Button>
          
          {contract.status === ContractStatus.PENDING && (
            <Button 
              mode="contained" 
              icon="pen"
              style={[styles.actionButton, styles.signButton]}
              onPress={navigateToSign}
            >
              签署合同
            </Button>
          )}
        </View>
      </View>
    );
  };

  if (isLoadingContract) {
    return <Loading loading={true} message="加载合同信息..." />;
  }

  if (contractError || !contract) {
    return (
      <Container safeArea>
        <EmptyState
          title="加载失败"
          message="无法加载合同数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchContract}
        />
      </Container>
    );
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="合同详情"
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
        {contract.status === ContractStatus.ACTIVE && (
          <>
            <Menu.Item
              onPress={() => {
                toggleMenu();
                setTerminateDialogVisible(true);
              }}
              title="终止合同"
              leadingIcon="file-cancel"
            />
            <Divider />
          </>
        )}
        <Menu.Item
          onPress={() => {
            toggleMenu();
            refetchContract();
          }}
          title="刷新数据"
          leadingIcon="refresh"
        />
      </Menu>

      {/* 终止合同对话框 */}
      <Portal>
        <Dialog visible={terminateDialogVisible} onDismiss={() => setTerminateDialogVisible(false)}>
          <Dialog.Title>终止合同</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>请输入终止原因:</Text>
            <TextInput
              style={styles.reasonInput}
              value={terminateReason}
              onChangeText={setTerminateReason}
              multiline
              numberOfLines={3}
              placeholder="例如：客户要求、服务变更等"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTerminateDialogVisible(false)}>取消</Button>
            <Button 
              onPress={handleTerminateContract} 
              disabled={!terminateReason.trim() || actionInProgress}
              loading={actionInProgress}
            >
              确认终止
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderContractDetails()}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  detailsContainer: {
    padding: spacing.medium,
  },
  headerCard: {
    marginBottom: spacing.medium,
  },
  contractTitle: {
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
  contractNumber: {
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
  signedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  signedDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
    marginLeft: spacing.tiny,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  termsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  renewalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  renewalTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  renewalText: {
    fontSize: 14,
    marginLeft: spacing.tiny,
  },
  signatureStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureStatusBadge: {
    marginRight: spacing.small,
  },
  signatureStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signatureImageContainer: {
    marginTop: spacing.medium,
    alignItems: 'center',
  },
  signatureImageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  signatureImage: {
    width: 200,
    height: 100,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 8,
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
  signButton: {
    backgroundColor: colors.success,
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
  signatureStatusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.tiny,
  },
  signatureStatusChipText: {
    color: colors.white,
  },
});

export default ContractDetailScreen; 