/**
 * 理赔列表页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, FAB, Menu, Divider, Badge, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, Claim, ClaimStatus, ClaimType } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔列表页面组件
 */
const ClaimListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | null>(null);
  const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // 获取理赔列表
  const {
    data: claimsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claims', selectedStatus, selectedType, searchQuery, emergencyOnly],
    queryFn: () => claimService.getClaims({
      status: selectedStatus || undefined,
      type: selectedType || undefined,
      search: searchQuery || undefined,
      is_emergency: emergencyOnly || undefined,
    }),
  });

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理状态选择
  const handleStatusSelect = (status: ClaimStatus) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
      setSelectedType(null); // 重置类型筛选
    }
  };

  // 处理类型选择
  const handleTypeSelect = (type: ClaimType) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
      setSelectedStatus(null); // 重置状态筛选
    }
  };

  // 处理紧急筛选
  const handleEmergencyToggle = () => {
    setEmergencyOnly(!emergencyOnly);
  };

  // 导航到理赔详情页面
  const navigateToClaimDetail = (claimId: string) => {
    navigation.navigate(ROUTES.CLAIMS.DETAIL, { id: claimId });
  };

  // 导航到理赔创建页面
  const navigateToCreateClaim = () => {
    navigation.navigate(ROUTES.CLAIMS.CREATE as any);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 获取状态标签颜色
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
        return colors.orange;
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

  // 格式化金额
  const formatAmount = (amount?: number) => {
    if (amount === undefined) return '未设置';
    return `¥${amount.toLocaleString('zh-CN')}`;
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString();
  };

  // 渲染理赔项
  const renderClaimItem = ({ item }: { item: Claim }) => (
    <Card 
      style={styles.claimCard}
      onPress={() => navigateToClaimDetail(item.id)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.claimTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.claimNumber}>理赔号: {item.claim_number}</Text>
          </View>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {getStatusName(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />
        
        <View style={styles.claimDetails}>
          <View style={styles.detailRow}>
            <Icon name="account" size={16} color={colors.grey600} />
            <Text style={styles.detailText}>客户: {item.customer_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name={getTypeIcon(item.type)} size={16} color={colors.grey600} />
            <Text style={styles.detailText}>类型: {getTypeName(item.type)}</Text>
          </View>
          
          {item.policy_number && (
            <View style={styles.detailRow}>
              <Icon name="shield" size={16} color={colors.grey600} />
              <Text style={styles.detailText}>保单: {item.policy_number}</Text>
            </View>
          )}

          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>事故日期</Text>
              <Text style={styles.dateValue}>{formatDate(item.incident_date)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>报告日期</Text>
              <Text style={styles.dateValue}>{formatDate(item.reported_date)}</Text>
            </View>
          </View>
          
          <View style={styles.footerRow}>
            {item.claim_amount !== undefined && (
              <View style={styles.amountContainer}>
                <Badge style={styles.amountBadge} size={20}>¥</Badge>
                <Text style={styles.amountText}>
                  {(Number(item.claim_amount) || 0).toLocaleString('zh-CN')}
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
              
              {item.is_emergency && (
                <Icon name="alert" size={18} color={colors.error} style={styles.emergencyIcon} />
              )}
              
              {item.handler_name && (
                <Icon name="account-tie" size={18} color={colors.primary} style={styles.handlerIcon} />
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
        {Object.values(ClaimStatus).map((status) => (
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
        {Object.values(ClaimType).map((type) => (
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

  // 渲染紧急筛选器
  const renderEmergencyFilter = () => (
    <View style={styles.emergencyFilterContainer}>
      <Chip
        mode="outlined"
        selected={emergencyOnly}
        onPress={handleEmergencyToggle}
        style={styles.emergencyChip}
        icon={() => <Icon name="alert" size={16} color={emergencyOnly ? colors.error : colors.grey600} />}
        selectedColor={colors.error}
      >
        仅紧急理赔
      </Chip>
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
        title="理赔列表"
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
              setEmergencyOnly(false);
            }}
            title="重置筛选"
            leadingIcon="filter-remove"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              toggleMenu();
              navigation.navigate(ROUTES.CLAIMS.STATISTICS);
            }}
            title="理赔统计"
            leadingIcon="chart-bar"
          />
        </Menu>

        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索理赔标题、编号或客户名称"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 筛选器 */}
        <View style={styles.filtersWrapper}>
          {renderStatusFilters()}
          {renderTypeFilters()}
          {renderEmergencyFilter()}
        </View>

        {/* 理赔列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载理赔数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : claimsResponse && claimsResponse.data.length > 0 ? (
          <FlatList
            data={claimsResponse.data}
            renderItem={renderClaimItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.claimsList}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无理赔"
            message={searchQuery || selectedStatus || selectedType || emergencyOnly ? "没有找到符合条件的理赔" : "暂无理赔数据"}
            icon="clipboard-outline"
            buttonText="创建理赔"
            onButtonPress={navigateToCreateClaim}
          />
        )}

        {/* 创建理赔按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToCreateClaim}
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
  emergencyFilterContainer: {
    flexDirection: 'row',
    marginBottom: spacing.small,
  },
  emergencyChip: {
    marginRight: spacing.small,
  },
  claimsList: {
    paddingVertical: spacing.small,
  },
  claimCard: {
    marginBottom: spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.small,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.tiny,
  },
  claimNumber: {
    fontSize: 12,
    color: colors.textSecondary,
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
  claimDetails: {
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
    marginTop: spacing.medium,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBadge: {
    backgroundColor: colors.primary,
  },
  amountText: {
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
  emergencyIcon: {
    marginRight: spacing.small,
  },
  handlerIcon: {
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

export default ClaimListScreen; 