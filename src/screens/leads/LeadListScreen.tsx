/**
 * 线索列表页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, FAB, Menu, Divider, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Card, Loading, EmptyState } from '../../components';

// 导入API服务
import { leadService, Lead, LeadStatus } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { LeadsTabParamList } from '../../navigation/types';

/**
 * 线索列表页面组件
 */
const LeadListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<LeadsTabParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // 获取线索列表
  const {
    data: leadsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', selectedStatus, searchQuery],
    queryFn: () => leadService.getLeads({
      status: selectedStatus || undefined,
      search: searchQuery || undefined,
    }),
  });

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理状态选择
  const handleStatusSelect = (status: LeadStatus) => {
    setSelectedStatus(status === selectedStatus ? null : status);
  };

  // 导航到线索详情页面
  const navigateToLeadDetail = (leadId: string) => {
    navigation.navigate(ROUTES.LEADS.DETAIL, { id: leadId });
  };

  // 导航到线索创建页面
  const navigateToCreateLead = () => {
    navigation.navigate(ROUTES.LEADS.CREATE);
  };

  // 导航到线索统计页面
  const navigateToStatistics = () => {
    navigation.navigate(ROUTES.LEADS.STATISTICS);
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
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

  // 渲染线索项
  const renderLeadItem = ({ item }: { item: Lead }) => (
    <Card
      title={item.name}
      subtitle={`电话: ${item.phone}`}
      type="outlined"
      onPress={() => navigateToLeadDetail(item.id)}
      style={styles.leadCard}
      rightIcon={
        <Badge
          size={24}
          style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status as any) }]}
        >
          {item.score || 0}
        </Badge>
      }
    >
      <View style={styles.leadContent}>
        {item.email && (
          <Text style={styles.leadInfo}>
            <Icon name="email" size={14} color={colors.grey600} /> {item.email}
          </Text>
        )}
        
        <Text style={styles.leadInfo}>
          <Icon name="source-branch" size={14} color={colors.grey600} /> {item.source}
        </Text>
        
        {item.assigned_user && (
          <Text style={styles.leadInfo}>
            <Icon name="account" size={14} color={colors.grey600} /> {item.assigned_user.name}
          </Text>
        )}
        
        <View style={styles.leadFooter}>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status as any) }]}
            textStyle={styles.statusChipText}
          >
            {getStatusName(item.status as any)}
          </Chip>
          
          {item.follow_up_at && (
            <Text style={styles.followUpText}>
              <Icon name="calendar-clock" size={14} color={colors.grey600} /> 跟进: {new Date(item.follow_up_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  // 渲染状态筛选器
  const renderStatusFilters = () => (
    <View style={styles.statusFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(Object.values(LeadStatus) as any).map((status: any) => (
          <Chip
            key={status}
            mode="outlined"
            selected={selectedStatus === status}
            onPress={() => handleStatusSelect(status)}
            style={styles.statusFilterChip}
            selectedColor={getStatusColor(status)}
          >
            {getStatusName(status)}
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
        title="线索列表"
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
              navigateToStatistics();
            }}
            title="线索统计"
            leadingIcon="chart-bar"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              toggleMenu();
              refetch();
            }}
            title="刷新列表"
            leadingIcon="refresh"
          />
        </Menu>

        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索线索"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 状态筛选器 */}
        {renderStatusFilters()}

        {/* 线索列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载线索数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : leadsResponse && leadsResponse.data.length > 0 ? (
          <FlatList
            data={leadsResponse.data}
            renderItem={renderLeadItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.leadsList}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无线索"
            message="没有找到符合条件的线索"
            icon="account-search"
            buttonText="创建线索"
            onButtonPress={navigateToCreateLead}
          />
        )}

        {/* 创建线索按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToCreateLead}
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
  statusFiltersContainer: {
    marginBottom: spacing.small,
  },
  statusFilterChip: {
    marginRight: spacing.small,
  },
  leadsList: {
    paddingVertical: spacing.small,
  },
  leadCard: {
    marginBottom: spacing.medium,
  },
  leadContent: {
    marginTop: spacing.small,
  },
  leadInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  statusBadge: {
    marginRight: spacing.small,
  },
  followUpText: {
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
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

export default LeadListScreen; 