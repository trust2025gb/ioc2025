/**
 * 产品详情页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, Button, Divider, List, Chip, TextInput, IconButton, DataTable } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { productService, Product, ProductFeature } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { ProductsTabParamList } from '../../navigation/types';

/**
 * 产品详情页面组件
 */
const ProductDetailScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProductsTabParamList>>();
  const route = useRoute<RouteProp<ProductsTabParamList, typeof ROUTES.PRODUCTS.DETAIL>>();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<'calculator' | 'coverage' | 'intro' | 'rules' | 'docs' | 'claims' | 'benefits' | 'exclusions' | 'withdraw' | 'cases' | 'faq'>('calculator');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [paymentYears, setPaymentYears] = useState<number>(10);
  const [premiumAmount, setPremiumAmount] = useState<number>(10000);
  const [birthday, setBirthday] = useState<string>('1994-01-01');

  // 获取产品详情
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理创建订单
  const handleCreateOrder = () => {
    // 导航到订单创建页面
    // 注意：这里需要跨导航器导航，可能需要调整
    // navigation.navigate('OrdersTab', {
    //   screen: ROUTES.ORDERS.CREATE,
    //   params: { productId: id },
    // });
  };

  // 处理比较产品
  const handleCompareProducts = () => {
    navigation.navigate(ROUTES.PRODUCTS.LIST, { selectMode: 'compare', selectedIds: [id] });
  };

  // 渲染产品特性
  const renderFeature = (feature: ProductFeature) => (
    <List.Item
      key={feature.id}
      title={feature.name}
      description={feature.value}
      left={(props) => (
        <List.Icon
          {...props}
          icon={feature.icon || 'check-circle'}
          color={colors.primary}
        />
      )}
    />
  );
  
  const renderTabs = () => (
    <View style={styles.tabsRow}>
      <Chip icon="clipboard-text" selected={activeTab === 'calculator'} onPress={() => setActiveTab('calculator')} style={styles.tabChip} compact>
        保费试算
      </Chip>
      <Chip icon="shield-check" selected={activeTab === 'coverage'} onPress={() => setActiveTab('coverage')} style={styles.tabChip} compact>
        保障责任
      </Chip>
      <Chip icon="book-open-variant" selected={activeTab === 'intro'} onPress={() => setActiveTab('intro')} style={styles.tabChip} compact>
        产品解读
      </Chip>
      <Chip icon="file-document" selected={activeTab === 'rules'} onPress={() => setActiveTab('rules')} style={styles.tabChip} compact>
        投保规则
      </Chip>
      <Chip icon="file-document-outline" selected={activeTab === 'docs'} onPress={() => setActiveTab('docs')} style={styles.tabChip} compact>
        条款资料
      </Chip>
      <Chip icon="hand-coin" selected={activeTab === 'claims'} onPress={() => setActiveTab('claims')} style={styles.tabChip} compact>
        理赔流程
      </Chip>
      <Chip icon="chart-line" selected={activeTab === 'benefits'} onPress={() => setActiveTab('benefits')} style={styles.tabChip} compact>
        利益演示
      </Chip>
      <Chip icon="alert-octagon" selected={activeTab === 'exclusions'} onPress={() => setActiveTab('exclusions')} style={styles.tabChip} compact>
        责任免责
      </Chip>
      <Chip icon="undo" selected={activeTab === 'withdraw'} onPress={() => setActiveTab('withdraw')} style={styles.tabChip} compact>
        犹豫期/退保
      </Chip>
      <Chip icon="account-tie" selected={activeTab === 'cases'} onPress={() => setActiveTab('cases')} style={styles.tabChip} compact>
        案例演示
      </Chip>
      <Chip icon="help-circle" selected={activeTab === 'faq'} onPress={() => setActiveTab('faq')} style={styles.tabChip} compact>
        常见问题
      </Chip>
    </View>
  );
  
  const renderCalculator = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>保费试算</Text>
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>被保人生日</Text>
        <TextInput mode="outlined" value={birthday} onChangeText={setBirthday} style={styles.input} placeholder="YYYY-MM-DD" />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>性别</Text>
        <View style={styles.inlineGroup}>
          <Chip selected={gender === 'male'} onPress={() => setGender('male')} style={styles.smallChip} compact>男</Chip>
          <Chip selected={gender === 'female'} onPress={() => setGender('female')} style={styles.smallChip} compact>女</Chip>
        </View>
      </View>
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>交费期间</Text>
        <View style={styles.inlineGroup}>
          {[3, 5, 6, 8, 10].map(y => (
            <Chip key={y} selected={paymentYears === y} onPress={() => setPaymentYears(y)} style={styles.smallChip} compact>{y}年</Chip>
          ))}
        </View>
      </View>
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>保费（元/年）</Text>
        <View style={styles.premiumEditor}>
          <IconButton icon="minus" size={16} onPress={() => setPremiumAmount(Math.max(5000, premiumAmount - 1000))} />
          <TextInput mode="outlined" value={String(premiumAmount)} onChangeText={(t) => setPremiumAmount(Number(t) || 0)} style={styles.premiumInput} keyboardType="number-pad" />
          <IconButton icon="plus" size={16} onPress={() => setPremiumAmount(premiumAmount + 1000)} />
        </View>
      </View>
      <Text style={styles.noteText}>金额为1000的倍数，最低5000</Text>
    </View>
  );
  
  const renderCoverage = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>保障责任</Text>
      <List.Item title="身故或全残保险金" description="提供终身保障" left={(p) => <List.Icon {...p} icon="shield-check" color={colors.primary} />} />
      <List.Item title="犹豫期退保" description="合同生效15天内可退保" left={(p) => <List.Icon {...p} icon="calendar" color={colors.primary} />} />
    </View>
  );
  
  const renderIntro = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>产品解读</Text>
      <Text style={styles.description}>{product?.description}</Text>
      {product?.intro_html ? (
        <View style={{ height: 320, marginTop: spacing.small }}>
          <WebView source={{ html: product?.intro_html as any }} />
        </View>
      ) : null}
    </View>
  );
  
  const renderRules = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>投保规则</Text>
      <List.Item title="投保年龄" description="出生满28天-75周岁" left={(p) => <List.Icon {...p} icon="account" color={colors.primary} />} />
      <List.Item title="保险期间" description="终身" left={(p) => <List.Icon {...p} icon="infinity" color={colors.primary} />} />
      <List.Item title="交费期间" description="一次/3/5/6/8/10年" left={(p) => <List.Icon {...p} icon="cash-multiple" color={colors.primary} />} />
    </View>
  );
  
  const renderDocs = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>条款资料</Text>
      {Array.isArray(product?.documents) && (product?.documents?.length || 0) > 0 ? (
        (product?.documents || []).map((doc, idx) => (
          <List.Item key={idx} title={doc.title} onPress={() => doc.url && Linking.openURL(doc.url)} right={() => <Icon name="open-in-new" size={18} color={colors.primary} />} />
        ))
      ) : (
        <List.Item title="保险条款" left={(p) => <List.Icon {...p} icon="file-document" color={colors.primary} />} />
      )}
    </View>
  );
  
  const renderClaims = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>理赔流程</Text>
      {Array.isArray(product?.claims_process) && (product?.claims_process?.length || 0) > 0 ? (
        (product?.claims_process || []).map((step, idx) => (
          <List.Item key={idx} title={step.title} description={step.desc} left={(p) => <List.Icon {...p} icon={step.icon || 'check-circle'} color={colors.primary} />} />
        ))
      ) : (
        <>
          <List.Item title="第一步 出险报案" description="24小时报案热线" left={(p) => <List.Icon {...p} icon="phone" color={colors.primary} />} />
          <List.Item title="第二步 收集资料" description="理赔专家协助" left={(p) => <List.Icon {...p} icon="file-search" color={colors.primary} />} />
          <List.Item title="第三步 审核理赔" description="核对明细，查算赔付" left={(p) => <List.Icon {...p} icon="check-decagram" color={colors.primary} />} />
        </>
      )}
    </View>
  );

  const renderBenefits = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>利益演示（示例）</Text>
      <Text style={styles.description}>以下为示例数据，实际收益以保险公司精算和合同为准。</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>年度</DataTable.Title>
          <DataTable.Title>年交保费</DataTable.Title>
          <DataTable.Title>累计已交</DataTable.Title>
          <DataTable.Title numeric>现价(元)</DataTable.Title>
        </DataTable.Header>
        {Array.isArray(product?.benefits) && (product?.benefits?.length || 0) > 0
          ? (product?.benefits || []).slice(0, 10).map((row, idx) => (
              <DataTable.Row key={idx}>
                <DataTable.Cell>{row.year}</DataTable.Cell>
                <DataTable.Cell>{row.annual?.toLocaleString?.() || row.annual}</DataTable.Cell>
                <DataTable.Cell>{row.cumulative?.toLocaleString?.() || row.cumulative}</DataTable.Cell>
                <DataTable.Cell numeric>{row.cash?.toLocaleString?.() || row.cash}</DataTable.Cell>
              </DataTable.Row>
            ))
          : [1,2,3,4,5].map((year) => (
              <DataTable.Row key={year}>
                <DataTable.Cell>{year}</DataTable.Cell>
                <DataTable.Cell>{premiumAmount.toLocaleString()}</DataTable.Cell>
                <DataTable.Cell>{(premiumAmount*year).toLocaleString()}</DataTable.Cell>
                <DataTable.Cell numeric>{Math.round(premiumAmount*year*0.85).toLocaleString()}</DataTable.Cell>
              </DataTable.Row>
            ))}
      </DataTable>
      <Text style={styles.noteText}>注：演示仅供参考。</Text>
    </View>
  );

  const renderExclusions = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>责任免责</Text>
      <List.Item title="故意行为" description="投保人对被保人的故意杀害、伤害等" left={(p) => <List.Icon {...p} icon="close-octagon" color={colors.primary} />} />
      <List.Item title="自杀" description="合同成立或恢复2年内的自杀等法律约定情形" left={(p) => <List.Icon {...p} icon="emoticon-sad" color={colors.primary} />} />
      <List.Item title="违法行为" description="酒驾、无证驾驶等" left={(p) => <List.Icon {...p} icon="car-off" color={colors.primary} />} />
      <List.Item title="战争、核风险" description="战争、军事冲突、核辐射等" left={(p) => <List.Icon {...p} icon="nuke" color={colors.primary} />} />
    </View>
  );

  const renderWithdraw = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>犹豫期及退保</Text>
      <Text style={styles.description}>{product?.withdraw_policy || '自签收合同之日起有15日犹豫期，期间可全额退保；犹豫期后退保将按现金价值退还。'}</Text>
      <List.Item title="犹豫期" description="15日内" left={(p) => <List.Icon {...p} icon="calendar-check" color={colors.primary} />} />
      <List.Item title="犹豫期后退保" description="按合同现金价值退还" left={(p) => <List.Icon {...p} icon="cash-refund" color={colors.primary} />} />
    </View>
  );

  const renderCases = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>案例演示</Text>
      <Text style={styles.description}>张先生40岁，选择{paymentYears}年交，年交保费{premiumAmount}元，以下为前5年示例。</Text>
      {renderBenefits()}
    </View>
  );

  const renderFAQ = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>常见问题</Text>
      <List.Accordion title="投保后多久生效？">
        <Text style={styles.description}>以合同约定为准，一般为次日零时生效。</Text>
      </List.Accordion>
      <List.Accordion title="可以为家人投保吗？">
        <Text style={styles.description}>可以，为配偶、子女、父母等近亲属投保需具备可保利益。</Text>
      </List.Accordion>
    </View>
  );

  // 如果正在加载
  if (isLoading) {
    return (
      <Container safeArea>
        <Header title="产品详情" showBackButton onBackPress={handleBack} />
        <Loading loading={true} message="加载中..." />
      </Container>
    );
  }

  // 如果加载失败
  if (error || !product) {
    return (
      <Container safeArea>
        <Header title="产品详情" showBackButton onBackPress={handleBack} />
        <EmptyState
          title="加载失败"
          message="无法加载产品详情，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetch}
        />
      </Container>
    );
  }

  return (
    <Container
      safeArea
      scrollable
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title={product.name}
        subtitle={product.category?.name}
        showBackButton
        onBackPress={handleBack}
        rightIcon="compare"
        onRightIconPress={handleCompareProducts}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 产品图片 */}
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : product.thumbnail ? (
          <Image
            source={{ uri: product.thumbnail }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={64} color={colors.grey400} />
          </View>
        )}

        {/* 产品信息 */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {product.is_featured && (
            <Chip style={styles.featuredChip} textStyle={styles.featuredChipText}>
              推荐
            </Chip>
          )}
          
          {/* 价格信息 */}
          <View style={styles.priceContainer}>
            {product.price ? (
              <Text style={styles.price}>¥{product.price.toFixed(2)}</Text>
            ) : product.min_price && product.max_price ? (
              <Text style={styles.price}>
                ¥{product.min_price.toFixed(2)} - ¥{product.max_price.toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.price}>价格面议</Text>
            )}
          </View>
          
          {/* 产品卖点（若存在） */}
          {Array.isArray(product.features) && product.features.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>产品特性</Text>
              <View style={styles.featuresList}>{product.features.map(renderFeature)}</View>
            </>
          )}
        </View>

        {/* Tabs */}
        <Divider />
        {renderTabs()}
        <Divider />

        {/* Tab 内容 */}
        {activeTab === 'calculator' && renderCalculator()}
        {activeTab === 'coverage' && renderCoverage()}
        {activeTab === 'intro' && renderIntro()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'docs' && renderDocs()}
        {activeTab === 'claims' && renderClaims()}
        {activeTab === 'benefits' && renderBenefits()}
        {activeTab === 'exclusions' && renderExclusions()}
        {activeTab === 'withdraw' && renderWithdraw()}
        {activeTab === 'cases' && renderCases()}
        {activeTab === 'faq' && renderFAQ()}
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <View style={styles.feeBox}>
          <Text style={styles.feePrice}>{premiumAmount}元/年</Text>
          <Text style={styles.feeNote}>详见费率表</Text>
        </View>
        <Button mode="contained" style={styles.planButton} onPress={() => {}} labelStyle={styles.orderButtonLabel}>计划书</Button>
        <Button mode="contained" style={styles.orderButton} onPress={handleCreateOrder} labelStyle={styles.orderButtonLabel}>立即分享</Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  productImage: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: spacing.medium,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  featuredChip: {
    backgroundColor: colors.secondary,
    alignSelf: 'flex-start',
    marginBottom: spacing.small,
  },
  featuredChipText: {
    color: 'white',
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.small,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresList: {
    marginTop: spacing.small,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    gap: spacing.tiny,
  },
  tabChip: {
    marginRight: spacing.tiny,
    marginBottom: spacing.tiny,
  },
  sectionCard: {
    padding: spacing.medium,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  formLabel: {
    width: 100,
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
  },
  inlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallChip: {
    marginRight: spacing.small,
  },
  premiumEditor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumInput: {
    width: 120,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.small,
  },
  bottomBar: {
    padding: spacing.medium,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeBox: {
    flex: 1,
  },
  feePrice: {
    color: colors.orange,
    fontSize: 20,
    fontWeight: 'bold',
  },
  feeNote: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  planButton: {
    backgroundColor: colors.accent,
    marginRight: spacing.small,
  },
  orderButton: {
    backgroundColor: colors.primary,
  },
  orderButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen; 