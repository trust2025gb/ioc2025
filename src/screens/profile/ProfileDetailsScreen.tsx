/**
 * 个人资料详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
// Web 下 ActionSheetIOS 不存在，按需动态获取
const ActionSheetIOS = Platform.OS === 'ios' ? require('react-native').ActionSheetIOS : undefined;
import { Text, Button, Card, Avatar, List, Divider, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// 导入组件
import { Container, Header, Loading } from '../../components';

// 导入API服务
import { authService } from '../../api/services/authService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ProfileTabParamList } from '../../navigation/types';
import { useTheme as usePaperTheme, Title } from 'react-native-paper';
import { dashboardService } from '../../api/services/dashboardService';
import { analyticsService } from '../../api/services/analyticsService';

/**
 * 个人资料详情页面组件
 */
const ProfileDetailsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProfileTabParamList>>();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [expandedMarketing, setExpandedMarketing] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState(false);
  
  // 获取用户信息
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
  });
  
  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  // 导航到编辑页面
  const navigateToEdit = () => {
    navigation.navigate(ROUTES.PROFILE.EDIT);
  };
  
  // 导航到设置页面
  const navigateToSettings = () => {
    navigation.navigate(ROUTES.PROFILE.SETTINGS);
  };
  
  // 导航到修改密码页面
  const navigateToChangePassword = () => {
    navigation.navigate(ROUTES.PROFILE.CHANGE_PASSWORD);
  };
  const navigateToTwoFactor = () => {
    navigation.navigate(ROUTES.PROFILE.TWO_FACTOR);
  };
  const navigateToDevices = () => {
    navigation.navigate(ROUTES.PROFILE.DEVICES);
  };
  const navigateToLogout = () => {
    navigation.navigate(ROUTES.PROFILE.LOGOUT_CONFIRM);
  };
  
  const pickAndUpload = async (useCamera: boolean) => {
    const picker = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 } as any);
    if (result.canceled || !result.assets?.length) return;
    let asset = result.assets[0];
    const size = Math.min(asset.width || 1024, asset.height || 1024);
    const target = Math.min(512, size);
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: target, height: target } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    asset = { ...asset, uri: manipulated.uri } as any;
    const form = new FormData();
    const fileName = (asset as any).fileName || `avatar_${Date.now()}.jpg`;
    const mime = (asset as any).mimeType || 'image/jpeg';
    if (Platform.OS === 'web') {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mime });
      form.append('avatar', file);
    } else {
      form.append('avatar', { uri: asset.uri, name: fileName, type: mime } as any);
    }
    await authService.uploadAvatar(form);
    await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    await refetch();
    Alert.alert('成功', '头像已更新');
  };

  const handleSelectAvatar = async () => {
    try {
      // Web 直接打开相册（Alert 多按钮在 Web 兼容性不好）
      if (Platform.OS === 'web') {
        await pickAndUpload(false);
        return;
      }
      // 权限
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (media.status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相册权限来更改头像');
        return;
      }
      // iOS 用 ActionSheet，Android 用 Alert
      if (Platform.OS === 'ios') {
        Platform.OS === 'ios' && ActionSheetIOS?.showActionSheetWithOptions && ActionSheetIOS.showActionSheetWithOptions(
          { options: ['拍照', '从相册选择', '取消'], cancelButtonIndex: 2 },
          async (idx) => {
            if (idx === 0) {
              const cam = await ImagePicker.requestCameraPermissionsAsync();
              if (cam.status === 'granted') await pickAndUpload(true);
            } else if (idx === 1) {
              await pickAndUpload(false);
            }
          }
        );
      } else {
        Alert.alert('选择头像来源', '', [
          { text: '拍照', onPress: async () => {
            const cam = await ImagePicker.requestCameraPermissionsAsync();
            if (cam.status === 'granted') await pickAndUpload(true);
          }},
          { text: '相册', onPress: async () => { await pickAndUpload(false); } },
          { text: '取消', style: 'cancel' },
        ]);
      }
    } catch (error) {
      Alert.alert('错误', '选择头像时出错');
    }
  };
  
  // 处理退出登录
  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            authService.logout();
          } 
        }
      ]
    );
  };
  
  // 渲染用户信息卡片
  const renderUserInfoCard = () => (
    <Card style={styles.userInfoCard}>
      <View style={styles.userInfoHeader}>
        <TouchableOpacity onPress={handleSelectAvatar}>
          {userData?.avatar ? (
            <Avatar.Image
              size={80}
              source={{ uri: userData.avatar }}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={userData?.name ? userData.name.substring(0, 2).toUpperCase() : '??'}
              color={theme.colors.onPrimary}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <View style={styles.avatarEditBadge}>
            <Icon name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.userInfoContent}>
          <Text style={styles.userName}>{userData?.name || '未知用户'}</Text>
          <Text style={styles.userRole}>{userData?.role || '未知角色'}</Text>
          <Text style={styles.userEmail}>{userData?.email || '无邮箱'}</Text>
        </View>
      </View>
      
      <View style={styles.userInfoActions}>
        <Button
          mode="contained"
          onPress={navigateToEdit}
          style={styles.editButton}
        >
          编辑资料
        </Button>
        <Button
          mode="outlined"
          onPress={navigateToSettings}
          style={styles.settingsButton}
        >
          设置
        </Button>

      </View>
    </Card>
  );
  
  // 渲染联系信息卡片
  const renderContactInfoCard = () => (
    <Card style={styles.card}>
      <Card.Title title="联系信息" />
      <Card.Content>
        <List.Item
          title="手机号码"
          description={userData?.phone || '未设置'}
          left={props => <List.Icon {...props} icon="phone" />}
        />
        <Divider />
        <List.Item
          title="电子邮箱"
          description={userData?.email || '未设置'}
          left={props => <List.Icon {...props} icon="email" />}
        />
        <Divider />
        <List.Item
          title="办公地址"
          description={userData?.address || '未设置'}
          left={props => <List.Icon {...props} icon="office-building" />}
        />
      </Card.Content>
    </Card>
  );
  
  // 渲染工作信息卡片
  const renderWorkInfoCard = () => (
    <Card style={styles.card}>
      <Card.Title title="工作信息" />
      <Card.Content>
        <List.Item
          title="部门"
          description={userData?.department || '未设置'}
          left={props => <List.Icon {...props} icon="domain" />}
        />
        <Divider />
        <List.Item
          title="职位"
          description={userData?.position || '未设置'}
          left={props => <List.Icon {...props} icon="briefcase" />}
        />
        <Divider />
        <List.Item
          title="员工编号"
          description={'未设置'}
          left={props => <List.Icon {...props} icon="card-account-details" />}
        />
      </Card.Content>
    </Card>
  );
  
  // 渲染账户安全卡片
  const renderSecurityCard = () => (
    <Card style={styles.card}>
      <Card.Title title="账户安全" />
      <Card.Content>
        <List.Item
          title="修改密码"
          left={props => <List.Icon {...props} icon="lock" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={navigateToChangePassword}
        />
        <Divider />
        <List.Item
          title="企业微信绑定"
          description={userData?.wecom_userid ? `已绑定：${userData.wecom_userid}` : '未绑定'}
          left={props => <List.Icon {...props} icon="briefcase" />}
          right={() => (
            <View style={{ flexDirection:'row' }}>
              <Button mode="text" onPress={async()=>{
                try {
                  const url = await authService.getWecomBindUrl();
                  if (url) {
                    if (Platform.OS === 'web') window.open(url,'_blank');
                    else Alert.alert('提示','请在浏览器中打开该URL完成绑定:\n'+url);
                  }
                } catch (e:any) { Alert.alert('错误', e.message || '获取绑定链接失败'); }
              }}>绑定</Button>
              <Button mode="text" onPress={async()=>{
                try { await authService.unbindWecom(); await refetch(); Alert.alert('成功','已解绑企业微信'); }
                catch(e:any){ Alert.alert('错误', e.message || '解绑失败'); }
              }} disabled={!userData?.wecom_userid}>解绑</Button>
            </View>
          )}
        />
        <Divider />
        <List.Item
          title="双因素认证"
          description="未启用"
          left={props => <List.Icon {...props} icon="shield-account" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={navigateToTwoFactor}
        />
        <Divider />
        <List.Item
          title="登录设备管理"
          left={props => <List.Icon {...props} icon="devices" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={navigateToDevices}
        />
      </Card.Content>
    </Card>
  );
  
  // 渲染退出登录按钮
  const renderLogoutButton = () => (
    <Button
      mode="outlined"
      onPress={navigateToLogout}
      style={styles.logoutButton}
      icon="logout"
      color={colors.error}
    >
      退出登录
    </Button>
  );
  
  if (isLoading) {
    return <Loading loading={true} message="加载中..." />;
  }
  
  if (error) {
    return (
      <Container safeArea>
        <Header
          title="个人资料"
          showBackButton={false}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>加载个人资料失败</Text>
          <Button mode="contained" onPress={() => refetch()}>重试</Button>
        </View>
      </Container>
    );
  }
  
  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="个人资料"
        showBackButton={false}
        rightIcon="cog"
        onRightIconPress={navigateToSettings}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 1. 营销管理（点击后展开） */}
        <List.Section style={styles.section}>
          <List.Accordion
            title="营销管理"
            left={(props) => <List.Icon {...props} icon="chart-donut" />}
            expanded={expandedMarketing}
            onPress={() => setExpandedMarketing(!expandedMarketing)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            {/* 我的目标 */}
            <Card style={styles.card}>
              <Card.Title title="我的目标" />
              <Card.Content>
                <Button mode="outlined" onPress={() => navigation.navigate('Goals' as any)}>查看/设置目标</Button>
              </Card.Content>
            </Card>
            <MarketingSection navigation={navigation} />
          </List.Accordion>
        </List.Section>

        {/* 2. 我的资料（点击后展开） */}
        <List.Section style={styles.section}>
          <List.Accordion
            title="我的资料"
            left={(props) => <List.Icon {...props} icon="account-circle" />}
            expanded={expandedProfile}
            onPress={() => setExpandedProfile(!expandedProfile)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            {/* 用户信息 */}
            {renderUserInfoCard()}
            {/* 联系信息 */}
            {renderContactInfoCard()}
            {/* 工作信息 */}
            {renderWorkInfoCard()}
            {/* 账户安全 */}
            {renderSecurityCard()}
          </List.Accordion>
        </List.Section>

        {/* 3. 退出登录 */}
        {renderLogoutButton()}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.medium,
  },
  section: {
    marginBottom: spacing.medium,
  },
  accordion: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '600',
  },
  userInfoCard: {
    marginBottom: spacing.medium,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfoContent: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.tiny,
  },
  userRole: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userInfoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
  },
  editButton: {
    flex: 1,
    marginRight: spacing.small,
  },
  settingsButton: {
    flex: 1,
    marginLeft: spacing.small,
  },
  card: {
    marginBottom: spacing.medium,
  },
  logoutButton: {
    marginVertical: spacing.large,
    borderColor: colors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginVertical: spacing.medium,
  },
});

export default ProfileDetailsScreen; 

// 营销管理子组件，内联到本文件，避免创建新文件
function MarketingSection({ navigation }: any) {
  const theme = usePaperTheme();
  const [kpiScope, setKpiScope] = React.useState<'self'|'team'>('self');

  const { data: salesMetrics } = useQuery({ queryKey: ['salesMetrics','self'], queryFn: () => dashboardService.getSalesMetrics(undefined, 'self'), staleTime: 60*1000 });
  const { data: recvSummary } = useQuery({ queryKey: ['receivablesSummary','self'], queryFn: () => dashboardService.getReceivablesSummary(undefined, 'self'), staleTime: 60*1000 });
  const { data: commissionSummary } = useQuery({ queryKey: ['commissionSummary','self'], queryFn: () => dashboardService.getCommissionSummary(undefined, 'self'), staleTime: 60*1000 });
  const { data: leaderboard } = useQuery({ queryKey: ['leaderboard','amount'], queryFn: () => analyticsService.leaderboard(undefined, 'amount'), staleTime: 60*1000 });
  const { data: kpiBoard } = useQuery({ queryKey: ['kpiBoard', kpiScope], queryFn: () => analyticsService.kpiBoard(undefined, kpiScope), staleTime: 60*1000 });
  const { data: marketingBudget } = useQuery({ queryKey: ['marketingBudget'], queryFn: () => analyticsService.marketingBudget(), staleTime: 60*1000 });

  return (
    <>
      <Card style={styles.card}>
        <Card.Title title="营销管理" left={(props) => <List.Icon {...props} icon="chart-donut" />} />
        <Card.Content>
          <View style={{ flexDirection:'row', justifyContent:'space-around' }}>
            <Button mode="outlined" onPress={() => navigation.navigate('TeamPerformance' as any)}>团队绩效</Button>
            <Button mode="outlined" onPress={() => navigation.navigate('MarketingRoi' as any)}>ROI 报表</Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="本月销售指标" left={(props) => <List.Icon {...props} icon="chart-line" />} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text>金额(¥)</Text>
              <Title>{(salesMetrics as any)?.amount ?? 0}</Title>
            </View>
            <View>
              <Text>订单数</Text>
              <Title>{(salesMetrics as any)?.orders ?? 0}</Title>
            </View>
            <View>
              <Text>客单价</Text>
              <Title>{(salesMetrics as any)?.avgOrderValue ?? 0}</Title>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="回款概览" left={(props) => <List.Icon {...props} icon="cash" />} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text>应收(¥)</Text>
              <Title>{(recvSummary as any)?.total_due ?? 0}</Title>
            </View>
            <View>
              <Text>已回(¥)</Text>
              <Title>{(recvSummary as any)?.paid ?? 0}</Title>
            </View>
            <View>
              <Text>逾期(¥)</Text>
              <Title>{(recvSummary as any)?.overdue ?? 0}</Title>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="佣金概览" left={(props) => <List.Icon {...props} icon="wallet" />} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text>预计(¥)</Text>
              <Title>{(commissionSummary as any)?.pending ?? 0}</Title>
            </View>
            <View>
              <Text>已结算(¥)</Text>
              <Title>{(commissionSummary as any)?.settled ?? 0}</Title>
            </View>
            <View>
              <Text>合计(¥)</Text>
              <Title>{(commissionSummary as any)?.total ?? 0}</Title>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="团队Top3（金额）" left={(props) => <List.Icon {...props} icon="account-group" />} />
        <Card.Content>
          {(leaderboard as any)?.items?.slice(0,3)?.map((it:any, idx:number) => (
            <View key={it.id} style={{ flexDirection:'row', justifyContent:'space-between', marginVertical: 4 }}>
              <Text>{idx+1}. {it.name}</Text>
              <Text>¥{it.amount}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="KPI 看板" left={(props) => <List.Icon {...props} icon="view-dashboard" />} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent:'flex-end', marginBottom: 8 }}>
            <Button mode={kpiScope==='self'?'contained':'outlined'} compact onPress={() => setKpiScope('self')}>个人</Button>
            <View style={{ width: 8 }} />
            <Button mode={kpiScope==='team'?'contained':'outlined'} compact onPress={() => setKpiScope('team')}>团队</Button>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text>销售金额(¥)</Text>
              <Title>{(kpiBoard as any)?.sales?.amount ?? (salesMetrics as any)?.amount ?? 0}</Title>
            </View>
            <View>
              <Text>订单数</Text>
              <Title>{(kpiBoard as any)?.sales?.orders ?? (salesMetrics as any)?.orders ?? 0}</Title>
            </View>
            <View>
              <Text>客单价</Text>
              <Title>{(kpiBoard as any)?.sales?.avgOrderValue ?? (salesMetrics as any)?.avgOrderValue ?? 0}</Title>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <View>
              <Text>回款(¥)</Text>
              <Title>{(kpiBoard as any)?.receivables?.paid ?? (recvSummary as any)?.paid ?? 0}</Title>
            </View>
            <View>
              <Text>逾期(¥)</Text>
              <Title>{(kpiBoard as any)?.receivables?.overdue ?? (recvSummary as any)?.overdue ?? 0}</Title>
            </View>
            <View>
              <Text>佣金(¥)</Text>
              <Title>{(kpiBoard as any)?.commission?.total ?? (commissionSummary as any)?.total ?? 0}</Title>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="营销预算 vs 消耗（本月）" left={(props) => <List.Icon {...props} icon="chart-donut" />} />
        <Card.Content>
          {(marketingBudget as any)?.items?.slice(0,5)?.map((it:any, idx:number) => (
            <View key={it.channel + '_' + idx} style={{ flexDirection:'row', justifyContent:'space-between', marginVertical: 4 }}>
              <Text>{it.channel}</Text>
              <Text>预算 ¥{it.budget} | 消耗 ¥{it.spend} | 差额 ¥{it.variance}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </>
  );
} 