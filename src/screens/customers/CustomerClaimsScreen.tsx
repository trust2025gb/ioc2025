/**
 * 客户理赔页面
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Divider, Button, Searchbar, Avatar, Badge } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { customerService, ClaimSummary } from '../../api/services/customerService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { CustomersStackParamList } from '../../navigation/types';

/**
 * 客户理赔页面组件
 */
const CustomerClaimsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<RouteProp<CustomersStackParamList, typeof ROUTES.CUSTOMERS.CLAIMS>>();
  const { id, customer } = route.params;
  const [searchQuery, setSearchQuery] = useState('');

  // 获取客户理赔
  const {
    data: claims,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-claims', id],
    queryFn: () => customerService.getCustomerClaims(id),
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 过滤理赔
  const filteredClaims = claims?.filter((claim) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      claim.claim_number.toLowerCase().includes(searchLower) ||
      claim.policy_number.toLowerCase().includes(searchLower) ||
      claim.description.toLowerCase().includes(searchLower) ||
      claim.status.toLowerCase().includes(searchLower)
    );
  });

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

  // 获取理赔状态图标
  const getClaimStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case '已批准':
        return 'check-circle';
      case 'pending':
      case '处理中':
        return 'clock';
      case 'rejected':
      case '已拒绝':
        return 'close-circle';
      case 'review':
      case '审核中':
        return 'clipboard-check';
      default:
        return 'help-circle';
    }
  };

  // 格式化货币
  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN')}`;
  };

  // 渲染理赔项
  const renderClaimItem = ({ item }: { item: ClaimSummary }) => (
    <Card style={styles.claimCard}>
      <Card.Title
        title={`理赔号: ${item.claim_number}`}
        subtitle={`保单号: ${item.policy_number}`}
        left={(props) => (
          <Avatar.Icon 
            size={40} 
            icon={getClaimStatusIcon(item.status)} 
            color={colors.white} 
            style={{ backgroundColor: getClaimStatusColor(item.status) }}
          />
        )}
        right={(props) => (
          <Chip 
            style={[styles.statusChip, { backgroundColor: getClaimStatusColor(item.status) }]} 
            textStyle={styles.statusChipText}
          >
            {item.status}
          </Chip>
        )}
      />
      <Card.Content>
        <Divider style={styles.divider} />
        
        <View style={styles.claimDetails}>
          <Text style={styles.descriptionTitle}>理赔描述:</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
        
        <View style={styles.claimFooter}>
          <View style={styles.claimInfo}>
            <Icon name="calendar" size={16} color={colors.primary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>提交日期</Text>
              <Text style={styles.infoValue}>{new Date(item.submission_date).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Badge size={24} style={styles.amountBadge}>¥</Badge>
            <View>
              <Text style={styles.amountLabel}>理赔金额</Text>
              <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
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
            icon="file-upload-outline" 
            onPress={() => {}}
            style={styles.actionButton}
          >
            上传资料
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title={customer?.name ? `${customer.name}的理赔` : '客户理赔'}
        showBackButton={true}
        onBackPress={handleBack}
      />

      <View style={styles.container}>
        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索理赔号或描述"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* 理赔列表 */}
        {isLoading ? (
          <Loading loading={true} message="加载理赔中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载理赔数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : filteredClaims && filteredClaims.length > 0 ? (
          <FlatList
            data={filteredClaims}
            renderItem={renderClaimItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无理赔"
            message={searchQuery ? "没有找到符合条件的理赔" : "该客户暂无理赔数据"}
            icon="cash-multiple"
            buttonText={searchQuery ? "清除搜索" : "创建理赔"}
            onButtonPress={searchQuery ? () => setSearchQuery('') : () => {}}
          />
        )}

        {/* 创建理赔按钮 */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => {}}
          style={styles.fabButton}
        >
          创建理赔
        </Button>
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
  claimCard: {
    marginBottom: spacing.medium,
  },
  statusChip: {
    marginRight: spacing.medium,
  },
  statusChipText: {
    color: 'white',
  },
  divider: {
    marginVertical: spacing.small,
  },
  claimDetails: {
    marginVertical: spacing.small,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.tiny,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.grey800,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.small,
  },
  claimInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: spacing.small,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.grey600,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBadge: {
    marginRight: spacing.small,
    backgroundColor: colors.primary,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.grey600,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  },
  fabButton: {
    position: 'absolute',
    bottom: spacing.large,
    right: spacing.large,
    left: spacing.large,
  }
});

export default CustomerClaimsScreen; 