/**
 * 客户保单页面
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Divider, Button, Searchbar } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { customerService, PolicySummary } from '../../api/services/customerService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { CustomersStackParamList } from '../../navigation/types';

/**
 * 客户保单页面组件
 */
const CustomerPoliciesScreen = () => {
  const navigation = useNavigation<StackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<RouteProp<CustomersStackParamList, typeof ROUTES.CUSTOMERS.POLICIES>>();
  const { id, customer } = route.params;
  const [searchQuery, setSearchQuery] = useState('');

  // 获取客户保单
  const {
    data: policies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-policies', id],
    queryFn: () => customerService.getCustomerPolicies(id),
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 过滤保单
  const filteredPolicies = policies?.filter((policy) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      policy.policy_number.toLowerCase().includes(searchLower) ||
      policy.product_name.toLowerCase().includes(searchLower) ||
      policy.status.toLowerCase().includes(searchLower)
    );
  });

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

  // 格式化货币
  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN')}`;
  };

  // 渲染保单项
  const renderPolicyItem = ({ item }: { item: PolicySummary }) => (
    <Card style={styles.policyCard}>
      <Card.Title
        title={item.product_name}
        subtitle={`保单号: ${item.policy_number}`}
        right={(props) => (
          <Chip 
            style={[styles.statusChip, { backgroundColor: getPolicyStatusColor(item.status) }]} 
            textStyle={styles.statusChipText}
          >
            {item.status}
          </Chip>
        )}
      />
      <Card.Content>
        <View style={styles.policyDetails}>
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>保费</Text>
            <Text style={styles.policyDetailValue}>{formatCurrency(item.premium)}</Text>
          </View>
          <View style={styles.policyDetail}>
            <Text style={styles.policyDetailLabel}>保额</Text>
            <Text style={styles.policyDetailValue}>{formatCurrency(item.coverage_amount)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.policyDates}>
          <View style={styles.dateContainer}>
            <Icon name="calendar-start" size={16} color={colors.primary} style={styles.dateIcon} />
            <View>
              <Text style={styles.dateLabel}>生效日期</Text>
              <Text style={styles.dateValue}>{new Date(item.start_date).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.dateContainer}>
            <Icon name="calendar-end" size={16} color={colors.primary} style={styles.dateIcon} />
            <View>
              <Text style={styles.dateLabel}>到期日期</Text>
              <Text style={styles.dateValue}>{new Date(item.end_date).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            icon="file-document-outline" 
            onPress={() => {}}
            style={styles.actionButton}
          >
            查看详情
          </Button>
          <Button 
            mode="outlined" 
            icon="cash-multiple" 
            onPress={() => {}}
            style={styles.actionButton}
          >
            提交理赔
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title={customer?.name ? `${customer.name}的保单` : '客户保单'}
        showBackButton={true}
        onBackPress={handleBack}
      />

      <View style={styles.container}>
        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索保单号或产品名称"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 保单列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载保单中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载保单数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : filteredPolicies && filteredPolicies.length > 0 ? (
          <FlatList
            data={filteredPolicies}
            renderItem={renderPolicyItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无保单"
            message={searchQuery ? "没有找到符合条件的保单" : "该客户暂无保单数据"}
            icon="file-document-outline"
            buttonText={searchQuery ? "清除搜索" : undefined}
            onButtonPress={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
  },
  searchBar: {
    marginBottom: spacing.medium,
    elevation: 0,
    backgroundColor: colors.grey100,
  },
  listContent: {
    paddingBottom: spacing.large,
  },
  policyCard: {
    marginBottom: spacing.medium,
  },
  statusChip: {
    marginRight: spacing.medium,
  },
  statusChipText: {
    color: 'white',
  },
  policyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.medium,
  },
  policyDetail: {
    alignItems: 'center',
  },
  policyDetailLabel: {
    fontSize: 14,
    color: colors.grey600,
  },
  policyDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.tiny,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  policyDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: spacing.small,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.grey600,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  }
});

export default CustomerPoliciesScreen; 