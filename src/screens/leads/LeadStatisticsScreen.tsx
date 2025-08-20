/**
 * 线索统计页面
 */

import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { leadService, LeadStatus, LeadSource } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { LeadsTabParamList } from '../../navigation/types';

// 图表配置
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

// 屏幕宽度
const screenWidth = Dimensions.get('window').width;

/**
 * 线索统计页面组件
 */
const LeadStatisticsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<LeadsTabParamList>>();

  // 获取线索统计数据
  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leadStatistics'],
    queryFn: () => leadService.getLeadStatistics(),
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
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

  // 获取来源显示名称
  const getSourceName = (source: string) => {
    switch (source) {
      case LeadSource.WEBSITE:
        return '网站';
      case LeadSource.REFERRAL:
        return '推荐';
      case LeadSource.SOCIAL_MEDIA:
        return '社交媒体';
      case LeadSource.EMAIL_CAMPAIGN:
        return '邮件营销';
      case LeadSource.PHONE_INQUIRY:
        return '电话咨询';
      case LeadSource.EVENT:
        return '活动';
      case LeadSource.OTHER:
        return '其他';
      default:
        return source;
    }
  };

  // 获取状态颜色
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

  // 获取来源颜色
  const getSourceColor = (source: string, index: number) => {
    const sourceColors = [
      colors.primary,
      colors.secondary,
      colors.success,
      colors.warning,
      colors.info,
      colors.error,
      colors.grey500,
    ];
    
    return sourceColors[index % sourceColors.length];
  };

  // 准备状态分布数据
  const prepareStatusData = () => {
    if (!statistics) return [];
    
    return Object.entries(statistics.by_status).map(([status, count], index) => ({
      name: getStatusName(status as LeadStatus),
      count,
      color: getStatusColor(status as LeadStatus),
      legendFontColor: colors.textPrimary,
      legendFontSize: 12,
    }));
  };

  // 准备来源分布数据
  const prepareSourceData = () => {
    if (!statistics) return [];
    
    return Object.entries(statistics.by_source).map(([source, count], index) => ({
      name: getSourceName(source),
      count,
      color: getSourceColor(source, index),
      legendFontColor: colors.textPrimary,
      legendFontSize: 12,
    }));
  };

  // 如果正在加载
  if (isLoading) {
    return (
      <Container safeArea>
        <Header title="线索统计" showBackButton onBackPress={handleBack} />
        <Loading loading={true} message="加载中..." />
      </Container>
    );
  }

  // 如果加载失败
  if (error || !statistics) {
    return (
      <Container safeArea>
        <Header title="线索统计" showBackButton onBackPress={handleBack} />
        <EmptyState
          title="加载失败"
          message="无法加载统计数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      </Container>
    );
  }

  // 准备图表数据
  const statusData = prepareStatusData();
  const sourceData = prepareSourceData();

  return (
    <Container
      safeArea
      scrollable
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="线索统计"
        showBackButton
        onBackPress={handleBack}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 总体统计 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>总体统计</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>总线索数</Paragraph>
                <Text style={styles.statValue}>{statistics.total}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>平均得分</Paragraph>
                <Text style={styles.statValue}>{statistics.average_score.toFixed(1)}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>转化率</Paragraph>
                <Text style={styles.statValue}>{(statistics.conversion_rate * 100).toFixed(1)}%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 状态分布 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>状态分布</Title>
            {statusData.length > 0 ? (
              <>
                <PieChart
                  data={statusData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
                <View style={styles.progressContainer}>
                  {Object.entries(statistics.by_status).map(([status, count]) => (
                    <View key={status} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                          {getStatusName(status as LeadStatus)}
                        </Text>
                        <Text style={styles.progressValue}>
                          {count} ({((count / statistics.total) * 100).toFixed(1)}%)
                        </Text>
                      </View>
                      <ProgressBar
                        progress={count / statistics.total}
                        color={getStatusColor(status as LeadStatus)}
                        style={styles.progressBar}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Paragraph>暂无状态分布数据</Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* 来源分布 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>来源分布</Title>
            {sourceData.length > 0 ? (
              <>
                <PieChart
                  data={sourceData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
                <View style={styles.progressContainer}>
                  {Object.entries(statistics.by_source).map(([source, count], index) => (
                    <View key={source} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                          {getSourceName(source)}
                        </Text>
                        <Text style={styles.progressValue}>
                          {count} ({((count / statistics.total) * 100).toFixed(1)}%)
                        </Text>
                      </View>
                      <ProgressBar
                        progress={count / statistics.total}
                        color={getSourceColor(source, index)}
                        style={styles.progressBar}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Paragraph>暂无来源分布数据</Paragraph>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
  },
  card: {
    marginBottom: spacing.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.tiny,
  },
  progressContainer: {
    marginTop: spacing.medium,
  },
  progressItem: {
    marginBottom: spacing.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.tiny,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  progressValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: radius.regular,
  },
});

export default LeadStatisticsScreen; 