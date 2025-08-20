/**
 * 合同列表页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView, Platform } from 'react-native';
import { Text, Searchbar, Chip, FAB, Menu, Divider, Badge, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
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
 * 合同列表页面组件
 */
const ContractListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ContractsStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | null>(null);
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // 获取合同列表
  const {
    data: contractsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contracts', selectedStatus, selectedType, searchQuery],
    queryFn: () => contractService.getContracts({
      status: selectedStatus || undefined,
      type: selectedType || undefined,
      search: searchQuery || undefined,
    }),
  });

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理状态选择
  const handleStatusSelect = (status: ContractStatus) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
      setSelectedType(null); // 重置类型筛选
    }
  };

  // 处理类型选择
  const handleTypeSelect = (type: ContractType) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
      setSelectedStatus(null); // 重置状态筛选
    }
  };

  // 导航到合同详情页面
  const navigateToContractDetail = (contractId: string) => {
    navigation.navigate(ROUTES.CONTRACTS.DETAIL, { id: contractId });
  };

  // 导航到合同创建页面
  const navigateToCreateContract = () => {
    navigation.navigate(ROUTES.CONTRACTS.CREATE as any);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 获取状态标签颜色
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

  // 渲染合同项
  const renderContractItem = ({ item }: { item: Contract }) => (
    <Card 
      style={styles.contractCard}
      onPress={() => navigateToContractDetail(item.id)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.contractTitle}>{item.title}</Text>
            <Text style={styles.contractNumber}>合同号: {item.contract_number}</Text>
          </View>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {getStatusName(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />
        
        <View style={styles.contractDetails}>
          <View style={styles.detailRow}>
            <Icon name="account" size={16} color={colors.grey600} />
            <Text style={styles.detailText}>客户: {item.customer_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name={getTypeIcon(item.type)} size={16} color={colors.grey600} />
            <Text style={styles.detailText}>类型: {getTypeName(item.type)}</Text>
          </View>
          
          {item.product_name && (
            <View style={styles.detailRow}>
              <Icon name="package-variant" size={16} color={colors.grey600} />
              <Text style={styles.detailText}>产品: {item.product_name}</Text>
            </View>
          )}
          
          {item.start_date && item.end_date && (
            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>开始日期</Text>
                <Text style={styles.dateValue}>{new Date(item.start_date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>结束日期</Text>
                <Text style={styles.dateValue}>{new Date(item.end_date).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.footerRow}>
            {item.total_value && (
              <View style={styles.valueContainer}>
                <Badge style={styles.valueBadge} size={20}>¥</Badge>
                <Text style={styles.valueText}>
                  {item.total_value.toLocaleString('zh-CN')}
                </Text>
              </View>
            )}
            
            <View style={styles.iconsRow}>
              {item.documents_count !== undefined && item.documents_count > 0 && (
                <View style={styles.iconBadge}>
                  <Icon name="file-document-multiple" size={18} color={colors.primary} />
                  <Badge style={styles.countBadge}>{item.documents_count}</Badge>
                </View>
              )}
              
              {item.has_electronic_signature && (
                <Icon name="check-decagram" size={18} color={colors.success} style={styles.signIcon} />
              )}
              
              {item.is_renewable && (
                <Icon name="refresh" size={18} color={colors.info} style={styles.renewIcon} />
              )}
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // 渲染状态筛选器
  const renderStatusFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>状态:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.values(ContractStatus).map((status) => (
          <Chip
            key={status}
            mode="outlined"
            selected={selectedStatus === status}
            onPress={() => handleStatusSelect(status)}
            style={styles.filterChip}
            selectedColor={getStatusColor(status)}
          >
            {getStatusName(status)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  // 渲染类型筛选器
  const renderTypeFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>类型:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.values(ContractType).map((type) => (
          <Chip
            key={type}
            mode="outlined"
            selected={selectedType === type}
            onPress={() => handleTypeSelect(type)}
            style={styles.filterChip}
            icon={() => <Icon name={getTypeIcon(type)} size={16} color={selectedType === type ? colors.primary : colors.grey600} />}
          >
            {getTypeName(type)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Container
      safeArea
      scrollable={false}
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="合同列表"
        showBackButton={false}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      <View style={styles.container}>
        {/* 菜单 */}
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={{ x: 0, y: 0 }}
          style={styles.menu}
        >
          <Menu.Item
            onPress={() => {
              toggleMenu();
              refetch();
            }}
            title="刷新列表"
            leadingIcon="refresh"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              toggleMenu();
              setSelectedStatus(null);
              setSelectedType(null);
              setSearchQuery('');
            }}
            title="重置筛选"
            leadingIcon="filter-remove"
          />
        </Menu>

        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索合同标题、编号或客户名称"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 筛选器 */}
        <View style={styles.filtersWrapper}>
          {renderStatusFilters()}
          {renderTypeFilters()}
        </View>

        {/* 合同列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载合同数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : contractsResponse && contractsResponse.data.length > 0 ? (
          <FlatList
            data={contractsResponse.data}
            renderItem={renderContractItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contractsList}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无合同"
            message={searchQuery || selectedStatus || selectedType ? "没有找到符合条件的合同" : "暂无合同数据"}
            icon="file-document-outline"
            buttonText="创建合同"
            onButtonPress={navigateToCreateContract}
          />
        )}

        {/* 创建合同按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToCreateContract}
          color={colors.background}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },
  searchBar: {
    marginVertical: spacing.small,
    elevation: 0,
    backgroundColor: colors.grey100,
  },
  filtersWrapper: {
    marginBottom: spacing.small,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  filterLabel: {
    marginRight: spacing.small,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  filterChip: {
    marginRight: spacing.small,
  },
  contractsList: {
    paddingVertical: spacing.small,
  },
  contractCard: {
    marginBottom: spacing.medium,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.small,
  },
  contractNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.tiny,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: colors.white,
    fontSize: 12,
  },
  divider: {
    marginVertical: spacing.small,
  },
  contractDetails: {
    marginTop: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.small,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  dateItem: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueBadge: {
    backgroundColor: colors.primary,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: spacing.tiny,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'relative',
    marginRight: spacing.small,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    fontSize: 10,
  },
  signIcon: {
    marginRight: spacing.small,
  },
  renewIcon: {
    marginRight: spacing.small,
  },
  fab: {
    position: 'absolute',
    margin: spacing.medium,
    right: spacing.medium,
    bottom: spacing.medium,
    backgroundColor: colors.primary,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

export default ContractListScreen; 