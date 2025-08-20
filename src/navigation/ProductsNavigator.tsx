/**
 * 产品导航栈
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { ProductsTabParamList } from './types';

// 导入产品相关页面
import {
  ProductListScreen,
  ProductDetailScreen,
  ProductCategoriesScreen,
  ProductCompareScreen,
  ProductSearchScreen,
} from '../screens/products';

// 创建堆栈导航器
const Stack = createStackNavigator<ProductsTabParamList>();

/**
 * 产品导航栈组件
 * 管理产品相关页面
 */
const ProductsNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.PRODUCTS.LIST}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.PRODUCTS.LIST} component={ProductListScreen} />
      <Stack.Screen name={ROUTES.PRODUCTS.DETAIL} component={ProductDetailScreen} />
      <Stack.Screen name={ROUTES.PRODUCTS.CATEGORIES} component={ProductCategoriesScreen} />
      <Stack.Screen name={ROUTES.PRODUCTS.COMPARE} component={ProductCompareScreen} />
      <Stack.Screen name={ROUTES.PRODUCTS.SEARCH} component={ProductSearchScreen} />
    </Stack.Navigator>
  );
};

export default ProductsNavigator; 