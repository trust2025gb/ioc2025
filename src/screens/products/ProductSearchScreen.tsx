/**
 * 产品搜索页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';

// 导入组件
import { Container, Header, Card, Loading, EmptyState } from '../../components';

// 导入API服务
import { productService, Product } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { ProductsTabParamList } from '../../navigation/types';

/**
 * 产品搜索页面组件
 */
const ProductSearchScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProductsTabParamList>>();
  const route = useRoute<RouteProp<ProductsTabParamList, typeof ROUTES.PRODUCTS.SEARCH>>();
  const initialKeyword = (route.params as any)?.query || '';
  
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [debouncedQuery, setDebouncedQuery] = useState(initialKeyword);

  // 搜索关键词防抖
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // 获取搜索结果
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['productSearch', debouncedQuery],
    queryFn: () => productService.searchProducts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  // 导航到产品详情页面
  const navigateToProductDetail = (productId: string) => {
    navigation.navigate(ROUTES.PRODUCTS.DETAIL, { id: productId });
  };

  // 渲染产品项
  const renderProductItem = ({ item }: { item: Product }) => (
    <Card
      title={item.name}
      subtitle={item.category?.name}
      type="outlined"
      onPress={() => navigateToProductDetail(item.id)}
      style={styles.productCard}
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
      </View>
    </Card>
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
        title="搜索产品"
        showBackButton
        onBackPress={handleBack}
      />

      <View style={styles.container}>
        {/* 搜索栏 */}
        <Searchbar
          placeholder="搜索产品"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          autoFocus
          onClearIconPress={handleClearSearch}
        />

        {/* 搜索结果 */}
        {debouncedQuery.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>请输入关键词搜索产品</Text>
          </View>
        ) : isLoading ? (
          <Loading loading={true} message="搜索中..." />
        ) : error ? (
          <EmptyState
            title="搜索失败"
            message="无法获取搜索结果，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : searchResults && searchResults.data.length > 0 ? (
          <FlatList
            data={searchResults.data}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            title="未找到结果"
            message={`没有找到与"${debouncedQuery}"相关的产品`}
            icon="magnify-close"
          />
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  resultsList: {
    paddingVertical: spacing.small,
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
});

export default ProductSearchScreen; 