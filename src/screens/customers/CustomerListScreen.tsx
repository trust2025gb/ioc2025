/**
 * 客户列表页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, FAB, Menu, Divider, Badge, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Card, Loading, EmptyState } from '../../components';

// 导入API服务
import { customerService, Customer, CustomerStatus, CustomerType } from '../../api/services/customerService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { CustomersStackParamList } from '../../navigation/types';

/**
 * 客户列表页面组件
 */
const CustomerListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<CustomersStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | null>(null);
  const [selectedType, setSelectedType] = useState<CustomerType | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // 获取客户列表
  const {
    data: customersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers', selectedStatus, selectedType, searchQuery],
    queryFn: () => customerService.getCustomers({
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
  const handleStatusSelect = (status: CustomerStatus) => {
    setSelectedStatus(status === selectedStatus ? null : status);
    setSelectedType(null); // 重置类型筛选
  };

  // 处理类型选择
  const handleTypeSelect = (type: CustomerType) => {
    setSelectedType(type === selectedType ? null : type);
    setSelectedStatus(null); // 重置状态筛选
  };

  // 导航到客户详情页面
  const navigateToCustomerDetail = (customerId: string) => {
    navigation.navigate(ROUTES.CUSTOMERS.DETAIL, { id: customerId });
  };

  // 导航到客户创建页面
  const navigateToCreateCustomer = () => {
    navigation.navigate(ROUTES.CUSTOMERS.CREATE);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
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

  // 渲染客户项
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <Card
      title={item.name}
      subtitle={`电话: ${item.phone}`}
      type="outlined"
      onPress={() => navigateToCustomerDetail(item.id)}
      style={styles.customerCard}
      leftIcon={
        item.avatar ? (
          <Avatar.Image size={48} source={{ uri: item.avatar }} />
        ) : (
          <Avatar.Icon size={48} icon={getTypeIcon(item.type)} />
        )
      }
      rightIcon={
        <View style={styles.badgeContainer}>
          {item.policies_count !== undefined && (
            <Badge style={[styles.badge, styles.policiesBadge]}>
              {item.policies_count}
            </Badge>
          )}
        </View>
      }
    >
      <View style={styles.customerContent}>
        {item.email && (
          <Text style={styles.customerInfo}>
            <Icon name="email" size={14} color={colors.grey600} /> {item.email}
          </Text>
        )}
        
        {item.address && (
          <Text style={styles.customerInfo}>
            <Icon name="map-marker" size={14} color={colors.grey600} /> {item.address}
          </Text>
        )}
        
        {item.company && (
          <Text style={styles.customerInfo}>
            <Icon name="domain" size={14} color={colors.grey600} /> {item.company}
          </Text>
        )}
        
        <View style={styles.customerFooter}>
          <View style={styles.tagsContainer}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusChipText}
            >
              {getStatusName(item.status)}
            </Chip>
            
            <Chip
              style={styles.typeChip}
              icon={() => <Icon name={getTypeIcon(item.type)} size={14} color={colors.primary} />}
            >
              {getTypeName(item.type)}
            </Chip>
          </View>
          
          {item.total_premium !== undefined && (
            <Text style={styles.premiumText}>
              <Icon name="currency-cny" size={14} color={colors.grey600} /> {item.total_premium.toLocaleString('zh-CN')}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  // 渲染状态筛选器
  const renderStatusFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>状态:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.values(CustomerStatus).map((status) => (
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
        {Object.values(CustomerType).map((type) => (
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
        title="客户列表"
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
          placeholder="搜索客户名称、电话或邮箱"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 筛选器 */}
        <View style={styles.filtersWrapper}>
          {renderStatusFilters()}
          {renderTypeFilters()}
        </View>

        {/* 客户列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载客户数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : customersResponse && customersResponse.data.length > 0 ? (
          <FlatList
            data={customersResponse.data}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.customersList}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无客户"
            message="没有找到符合条件的客户"
            icon="account-search"
            buttonText="创建客户"
            onButtonPress={navigateToCreateCustomer}
          />
        )}

        {/* 创建客户按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToCreateCustomer}
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
  customersList: {
    paddingVertical: spacing.small,
  },
  customerCard: {
    marginBottom: spacing.medium,
  },
  customerContent: {
    marginTop: spacing.small,
  },
  customerInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 24,
    marginRight: spacing.small,
  },
  typeChip: {
    height: 24,
    backgroundColor: colors.grey100,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    marginBottom: spacing.tiny,
  },
  policiesBadge: {
    backgroundColor: colors.primary,
  },
  premiumText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
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

export default CustomerListScreen; 