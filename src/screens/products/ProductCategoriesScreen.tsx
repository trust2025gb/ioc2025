/**
 * 产品分类页面
 */

import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { productService, ProductCategory } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { ProductsTabParamList } from '../../navigation/types';

/**
 * 产品分类页面组件
 */
const ProductCategoriesScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProductsTabParamList>>();

  // 获取产品分类
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => productService.getCategories(),
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 处理分类选择
  const handleCategorySelect = (categoryId: string) => {
    navigation.navigate(ROUTES.PRODUCTS.LIST);
    // 注意：这里需要传递选中的分类ID到产品列表页面
    // 由于我们的导航结构，可能需要调整
  };

  // 渲染分类项
  const renderCategoryItem = ({ item }: { item: ProductCategory }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item.id)}
    >
      <View style={styles.categoryContent}>
        {item.icon ? (
          <Avatar.Icon
            size={48}
            icon={item.icon}
            color={colors.background}
            style={styles.categoryIcon}
          />
        ) : (
          <Avatar.Icon
            size={48}
            icon="package-variant"
            color={colors.background}
            style={styles.categoryIcon}
          />
        )}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.categoryDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={colors.grey400} />
      </View>
      <Divider />
    </TouchableOpacity>
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
        title="产品分类"
        showBackButton
        onBackPress={handleBack}
      />

      <View style={styles.container}>
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            message="无法加载产品分类，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : categories && categories.length > 0 ? (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <EmptyState
            title="暂无分类"
            message="没有找到产品分类"
            icon="folder-outline"
          />
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesList: {
    flexGrow: 1,
  },
  categoryItem: {
    backgroundColor: colors.background,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
  },
  categoryIcon: {
    backgroundColor: colors.primary,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.tiny,
  },
});

export default ProductCategoriesScreen; 