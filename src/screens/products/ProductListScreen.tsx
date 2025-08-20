/**
 * 产品列表页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip, Divider, Button, TextInput, IconButton, Menu, Checkbox } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';

// 导入组件
import { Container, Header, Card, Loading, EmptyState } from '../../components';

// 导入API服务
import { productService, Product, ProductCategory } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { ProductsTabParamList } from '../../navigation/types';

/**
 * 产品列表页面组件
 */
const ProductListScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProductsTabParamList>>();
  const route = useRoute<RouteProp<ProductsTabParamList, typeof ROUTES.PRODUCTS.LIST>>();
  const selectMode = route.params?.selectMode;
  const initialSelectedIds = route.params?.selectedIds || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [pageInput, setPageInput] = useState<string>('1');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  // 获取产品分类
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => productService.getCategories(),
  });

  // 获取产品列表
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', selectedCategory, searchQuery, page, perPage],
    queryFn: () => productService.getProducts({
      category_id: selectedCategory || undefined,
      search: searchQuery || undefined,
      page,
      per_page: perPage,
    }),
  });

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // 处理分类选择
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setPage(1);
  };

  // 导航到产品详情页面（仅非选择模式）
  const navigateToProductDetail = (productId: string) => {
    if (selectMode) return;
    navigation.navigate(ROUTES.PRODUCTS.DETAIL, { id: productId });
  };

  // 勾选切换
  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // 确认加入对比
  const confirmAddToCompare = () => {
    const ids = Array.from(new Set(selectedIds));
    navigation.navigate(ROUTES.PRODUCTS.COMPARE, { ids });
  };

  // 导航到产品分类页面
  const navigateToCategories = () => {
    navigation.navigate(ROUTES.PRODUCTS.CATEGORIES);
  };

  // 渲染产品项
  const renderProductItem = ({ item }: { item: Product }) => (
    <Card
      title={item.name}
      subtitle={item.category?.name}
      type="elevated"
      onPress={() => navigateToProductDetail(item.id)}
      style={styles.productCard}
      rightIcon={selectMode ? (
        <TouchableOpacity onPress={() => toggleSelect(item.id)}>
          <Checkbox status={selectedIds.includes(item.id) ? 'checked' : 'unchecked'} />
        </TouchableOpacity>
      ) : undefined}
    >
      <Text style={styles.productDescription} numberOfLines={2}>
        {item.short_description || item.description}
      </Text>
      <View style={styles.productFooter}>
        {item.price ? (
          <Text style={styles.productPrice}>¥{item.price.toFixed(2)}</Text>
        ) : item.min_price && item.max_price ? (
          <Text style={styles.productPrice}>
            ¥{item.min_price.toFixed(2)} - ¥{item.max_price.toFixed(2)}
          </Text>
        ) : (
          <Text style={styles.productPrice}>价格面议</Text>
        )}
        {item.is_featured && (
          <Chip style={styles.featuredChip} textStyle={styles.featuredChipText}>
            推荐
          </Chip>
        )}
      </View>
    </Card>
  );

  // 渲染分类项
  const renderCategoryItem = ({ item }: { item: ProductCategory }) => (
    <Chip
      mode="outlined"
      selected={selectedCategory === item.id}
      onPress={() => handleCategorySelect(item.id)}
      style={[styles.categoryChip, styles.categoryChipContent]}
      compact
      textStyle={styles.categoryChipText}
    >
      {item.name}
    </Chip>
  );

  // 加载状态
  const isLoading = isLoadingCategories || isLoadingProducts;
  const error = categoriesError || productsError;

  // 处理刷新
  const handleRefresh = () => {
    refetchProducts();
  };

  // 列表头部：搜索 + 分类
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Searchbar
        placeholder="搜索产品"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={colors.primary}
        placeholderTextColor={colors.textSecondary}
      />

      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          style={styles.categoriesScroll}
        >
          {categories.map((item) => (
            <Chip
              key={item.id}
              mode="outlined"
              selected={selectedCategory === item.id}
              onPress={() => handleCategorySelect(item.id)}
              style={[styles.categoryChip, styles.categoryChipContent]}
              compact
              textStyle={styles.categoryChipText}
            >
              {item.name}
            </Chip>
          ))}
        </ScrollView>
      )}

      <Divider style={styles.headerDivider} />
    </View>
  );

  // 分页：总数、当前页、下一页、跳转、每页数量
  const total = (productsResponse as any)?.pagination?.total ?? 0;
  const totalPages = (productsResponse as any)?.pagination?.totalPages ?? 1;
  const currentPage = (productsResponse as any)?.pagination?.currentPage ?? page;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
      setPageInput(String(currentPage + 1));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
      setPageInput(String(currentPage - 1));
    }
  };

  const handleJump = () => {
    const target = Math.max(1, Math.min(totalPages, parseInt(pageInput || '1', 10)));
    setPage(target);
  };

  const perPageOptions = [10, 20, 30, 50];
  const [perPageMenuVisible, setPerPageMenuVisible] = useState(false);
  const openPerPageMenu = () => setPerPageMenuVisible(true);
  const closePerPageMenu = () => setPerPageMenuVisible(false);
  const renderListFooter = () => (
    <View style={styles.paginationContainer}>
      <View style={styles.totalRow}>
        <View style={styles.totalPill}>
          <Text style={styles.totalPillText}>共 {total} 条</Text>
        </View>
      </View>

      <View style={styles.paginationBar}>
        <View style={styles.pageControls}>
          <IconButton icon="chevron-left" size={18} onPress={handlePrevPage} disabled={currentPage <= 1} />
          <Text style={styles.paginationText}>第 {currentPage}/{totalPages} 页</Text>
          <IconButton icon="chevron-right" size={18} onPress={handleNextPage} disabled={currentPage >= totalPages} />
        </View>

        <View style={styles.inlineGroup}>
          <Text style={styles.paginationText}>跳转:</Text>
          <TextInput
            mode="outlined"
            dense
            keyboardType="number-pad"
            value={pageInput}
            onChangeText={setPageInput}
            onSubmitEditing={handleJump}
            onBlur={handleJump}
            style={styles.pageInput}
            placeholder="1"
          />
        </View>

        <Menu
          visible={perPageMenuVisible}
          onDismiss={closePerPageMenu}
          anchor={
            <Button mode="outlined" onPress={openPerPageMenu} style={styles.perPageButton} contentStyle={styles.perPageButtonContent} icon="chevron-down">
              {perPage}
            </Button>
          }
        >
          {perPageOptions.map(opt => (
            <Menu.Item key={opt} onPress={() => { setPerPage(opt); setPage(1); closePerPageMenu(); }} title={`${opt} 条/页`} />
          ))}
        </Menu>
      </View>
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
        title={selectMode ? '选择对比产品' : '产品列表'}
        showBackButton
        rightIcon={selectMode ? undefined : 'filter-variant'}
        onRightIconPress={selectMode ? undefined : navigateToCategories}
      />

      {isLoading ? (
        <Loading loading={true} message="加载中..." />
      ) : error ? (
        <EmptyState
          title="加载失败"
          message="无法加载产品数据，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={handleRefresh}
        />
      ) : (
        <>
          <FlatList
            data={productsResponse?.data || []}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            contentContainerStyle={styles.productsList}
            style={styles.productsFlatList}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={isLoading}
          />

          {selectMode && (
            <View style={styles.actionBar}>
              <Text style={styles.selectedCount}>已选 {selectedIds.length} 项</Text>
              <Button mode="contained" icon="compare" onPress={confirmAddToCompare} disabled={selectedIds.length === 0}>
                加入对比
              </Button>
            </View>
          )}
        </>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.tiny,
    backgroundColor: 'transparent',
  },
  searchBar: {
    marginTop: spacing.tiny,
    marginBottom: spacing.tiny,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  categoriesList: {
    paddingVertical: 0,
    alignItems: 'flex-start',
    flexGrow: 0,
  },
  categoriesScroll: {
    height: 32,
    marginTop: spacing.tiny,
  },
  categoryChip: {
    marginRight: spacing.small,
    marginTop: 0,
    paddingVertical: 0,
    height: 28,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryChipContent: {
    height: 24,
    paddingVertical: 0,
    paddingHorizontal: spacing.small,
  },
  categoryChipText: {
    lineHeight: 18,
  },
  headerDivider: {
    marginTop: spacing.tiny,
  },
  productsList: {
    paddingBottom: spacing.large,
  },
  productsFlatList: {
    flex: 1,
  },
  productCard: {
    marginBottom: spacing.medium,
  },
  productDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.small,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  productPrice: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuredChip: {
    backgroundColor: colors.secondary,
  },
  featuredChipText: {
    color: 'white',
    fontSize: 12,
  },
  paginationContainer: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  totalRow: {
    marginBottom: spacing.tiny,
    alignItems: 'center',
  },
  totalPill: {
    backgroundColor: colors.accentLight,
    paddingVertical: 4,
    paddingHorizontal: spacing.medium,
    borderRadius: radius.large,
  },
  totalPillText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  paginationText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.tiny,
  },
  pageInput: {
    width: 56,
    height: 28,
    paddingVertical: 0,
    fontSize: 14,
  },
  perPageButton: {
    marginLeft: spacing.tiny,
    minWidth: 60,
  },
  perPageButtonContent: {
    height: 28,
    paddingHorizontal: spacing.small,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.medium,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCount: {
    color: colors.textSecondary,
  },
});

export default ProductListScreen; 