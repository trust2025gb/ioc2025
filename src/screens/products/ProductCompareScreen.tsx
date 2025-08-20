/**
 * 产品比较页面
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, Divider, Button, DataTable, Checkbox, Portal, Dialog, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
// 注意：PDF导出在原生端采用动态导入expo-print，Web端走浏览器打印

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { productService, Product } from '../../api/services';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing, radius } from '../../theme';
import { ProductsTabParamList } from '../../navigation/types';

/**
 * 产品比较页面组件
 */
const ProductCompareScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProductsTabParamList>>();
  const route = useRoute<RouteProp<ProductsTabParamList, typeof ROUTES.PRODUCTS.COMPARE>>();
  const { ids } = route.params;

  // 状态
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(ids || []);

  // 获取比较产品
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['compareProducts', selectedProductIds],
    queryFn: () => productService.compareProducts(selectedProductIds),
    enabled: selectedProductIds.length > 0,
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 添加产品
  const handleAddProduct = () => {
    navigation.navigate(ROUTES.PRODUCTS.LIST, { selectMode: 'compare', selectedIds: selectedProductIds });
  };

  // 移除产品
  const handleRemoveProduct = (productId: string) => {
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  // 查看产品详情
  const handleViewProductDetail = (productId: string) => {
    navigation.navigate(ROUTES.PRODUCTS.DETAIL, { id: productId });
  };

  // 获取所有产品特性
  const getAllFeatures = () => {
    if (!products || products.length === 0) return [];

    const allFeatures = new Set<string>();
    products.forEach(product => {
      if (product.features) {
        product.features.forEach((feature: any) => {
          if (feature?.name) {
            allFeatures.add(feature.name);
          }
        });
      }
    });

    return Array.from(allFeatures);
  };

  // 获取产品特性值
  const getFeatureValue = (product: Product, featureName: string) => {
    if (!product.features) return '-';
    const feature = (product.features as any[]).find((f: any) => f?.name === featureName);
    return feature ? String(feature.value ?? '-') : '-';
  };

  // 所有特性
  const allFeatures = products ? getAllFeatures() : [];

  // 表格列宽与色彩
  const screenWidth = Dimensions.get('window').width;
  const featureColumnWidth = Math.max(96, Math.min(120, Math.round(screenWidth * 0.28)));
  const productColumnWidth = 200;
  const tableMinWidth = featureColumnWidth + (products ? products.length * productColumnWidth : 0);
  const columnColors = [
    { bg: '#E3F2FD', border: '#90CAF9' },
    { bg: '#E8F5E9', border: '#A5D6A7' },
    { bg: '#FFF3E0', border: '#FFCC80' },
    { bg: '#F3E5F5', border: '#CE93D8' },
  ];
  const getColStyle = (index: number) => ({
    width: productColumnWidth,
    backgroundColor: columnColors[index % columnColors.length].bg,
    borderColor: columnColors[index % columnColors.length].border,
    borderWidth: 1,
  });

  // 可配置对比项
  type RowDef = { key: string; label: string; render: (p: Product) => string };
  const builtinRows: RowDef[] = [
    { key: 'category', label: '分类', render: (p) => p.category?.name || '-' },
    { key: 'price', label: '价格', render: (p) => p.price ? `¥${p.price.toFixed(2)}` : (p.min_price && p.max_price ? `¥${p.min_price.toFixed(2)}-${p.max_price.toFixed(2)}` : '价格面议') },
  ];
  const featureRows: RowDef[] = allFeatures.map(name => ({ key: `feature:${name}`, label: String(name), render: (p) => getFeatureValue(p, String(name)) }));
  const allRows: RowDef[] = [...builtinRows, ...featureRows];

  // 选中的对比项（默认：分类、价格 + 前2个特性）
  const DEFAULT_SELECTED_KEYS = ['category', 'price', ...allFeatures.slice(0, 2).map(n => `feature:${n}`)];
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [configVisible, setConfigVisible] = useState(false);
  const [tempKeys, setTempKeys] = useState<string[]>([]);
  const STORAGE_KEY = '@ioc3:compare_rows';
  const captureAreaRef = React.useRef<View>(null);
  const exportViewRef = React.useRef<View>(null);
  const [renderForExport, setRenderForExport] = useState(false);

  // 初始化加载/保存配置
  useEffect(() => {
    (async () => {
      if (!products) return;
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : null;
        const initial = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SELECTED_KEYS;
        setSelectedRowKeys(initial);
        setTempKeys(initial);
      } catch {
        setSelectedRowKeys(DEFAULT_SELECTED_KEYS);
        setTempKeys(DEFAULT_SELECTED_KEYS);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products?.length]);

  const openConfig = () => setConfigVisible(true);
  const closeConfig = () => setConfigVisible(false);
  const toggleKey = (key: string) => {
    setTempKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const applyConfig = async () => {
    setSelectedRowKeys(tempKeys);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tempKeys)); } catch {}
    closeConfig();
  };

  // 排序：上移/下移（仅对选中的项生效）
  const moveKey = (key: string, direction: 'up' | 'down') => {
    setTempKeys(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const resetDefault = () => {
    setTempKeys(DEFAULT_SELECTED_KEYS);
  };

  // 根据选中项生成表格行
  const rowsToRender: RowDef[] = selectedRowKeys
    .map(k => allRows.find(r => r.key === k))
    .filter((r): r is RowDef => Boolean(r));

  // --- 导出：PNG（高DPI） ---
  const exportAsPng = async () => {
    try {
      // 渲染离屏完整布局，避免只截到可视区域
      setRenderForExport(true);
      await new Promise((r) => setTimeout(r, 50));
      const targetRef = exportViewRef.current ? exportViewRef : captureAreaRef;
      if (Platform.OS === 'web') {
        // Web 端：导出为 data URL 并触发下载，清晰可放大
        const base64 = await captureRef(targetRef, {
          format: 'png',
          quality: 1,
          result: 'base64',
          snapshotContentContainer: true,
        } as any);
        const a = document.createElement('a');
        a.href = `data:image/png;base64,${base64}`;
        a.download = `产品对比_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // 原生端：生成临时文件并分享/保存
        const uri = await captureRef(targetRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          snapshotContentContainer: true,
        } as any);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (e) {
      console.warn('导出PNG失败', e);
    } finally {
      setRenderForExport(false);
    }
  };

  // --- 导出：PDF（矢量/高清） ---
  const buildPdfHtml = () => {
    const head = `
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f5f5f5; text-align: left; }
          .p-col { min-width: 180px; }
          .feat { width: 140px; position: sticky; left: 0; background: #fff; }
          .title { font-size: 18px; margin: 0 0 12px; }
        </style>
      </head>`;

    const headerRow = `<tr><th class="feat">特性</th>${(products || []).map(p => `<th class="p-col">${p.name}</th>`).join('')}</tr>`;
    const bodyRows = rowsToRender.map(r => `<tr><td class="feat">${r.label}</td>${(products || []).map(p => `<td class="p-col">${r.render(p)}</td>`).join('')}</tr>`).join('');

    return `<!DOCTYPE html><html>${head}<body><h1 class="title">产品对比</h1><table>${headerRow}${bodyRows}</table></body></html>`;
  };

  const exportAsPdf = async () => {
    try {
      const html = buildPdfHtml();
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.open();
          win.document.write(html);
          win.document.close();
          win.focus();
          // 交给浏览器另存为PDF，保证清晰度
          setTimeout(() => {
            try { win.print(); } catch (_) {}
          }, 300);
        }
        return;
      }

      const Print = await import('expo-print');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.warn('导出PDF失败', e);
    }
  };

  return (
    <Container
      safeArea
      scrollable={false}
      backgroundColor={colors.background}
      paddingHorizontal={0}
      paddingVertical={0}
    >
      <Header
        title="产品比较"
        showBackButton
        onBackPress={handleBack}
        rightIcon="plus"
        onRightIconPress={handleAddProduct}
      />

      <View style={styles.container}>
        {isLoading ? (
          <Loading loading={true} message="加载中..." />
        ) : error || !products ? (
          <EmptyState
            title="加载失败"
            message="无法加载产品数据，请稍后重试"
            icon="alert-circle"
            buttonText="重试"
            onButtonPress={refetch}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="暂无产品"
            message="请添加产品进行比较"
            icon="compare"
            buttonText="添加产品"
            onButtonPress={handleAddProduct}
          />
        ) : (
          <>
            {/* 工具栏：配置对比项 + 导出 */}
            <View style={styles.toolbar}>
              <Button mode="outlined" icon="cog" onPress={openConfig}>配置对比项</Button>
              <View style={styles.exportGroup}>
                <Button mode="outlined" icon="image" onPress={exportAsPng} style={styles.exportBtn}>导出图片</Button>
                <Button mode="contained" icon="file-pdf-box" onPress={exportAsPdf} style={styles.exportBtn}>导出PDF</Button>
              </View>
            </View>

            {/* 比较表格：外层纵向滚动，左列固定，右侧整体横向滚动 */}
            <ScrollView style={styles.tableContainer} contentContainerStyle={styles.tableContent}>
              <View ref={captureAreaRef} style={styles.splitRow}>
                {/* 左侧固定列 */}
                <View style={{ width: featureColumnWidth }}>
                  <DataTable>
                    <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={{ width: featureColumnWidth }}>特性</DataTable.Title>
                    </DataTable.Header>
                    {rowsToRender.map(row => (
                      <DataTable.Row key={row.key}>
                        <DataTable.Cell style={{ width: featureColumnWidth }}>
                          {row.label}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </View>

                {/* 右侧可横向滚动区域 */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator
                  contentContainerStyle={{ minWidth: tableMinWidth - featureColumnWidth }}
                >
                  <DataTable>
                    <DataTable.Header style={styles.tableHeader}>
                      {products.map((product, idx) => (
                        <DataTable.Title key={product.id} style={[getColStyle(idx), styles.colHeader]}>
                          <View style={styles.headerCellContent}>
                            <TouchableOpacity onPress={() => handleViewProductDetail(product.id)}>
                              <Text numberOfLines={1} style={styles.colHeaderText}>{product.name}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveProduct(product.id)} style={styles.closeBtn}>
                              <Icon name="close" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        </DataTable.Title>
                      ))}
                    </DataTable.Header>

                    {rowsToRender.map(row => (
                      <DataTable.Row key={row.key}>
                        {products.map((product, idx) => (
                          <DataTable.Cell key={product.id} style={[getColStyle(idx), styles.colCell]}>
                            {row.render(product)}
                          </DataTable.Cell>
                        ))}
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              </View>
            </ScrollView>

            {/* 配置对话框 */}
            <Portal>
              <Dialog visible={configVisible} onDismiss={closeConfig}>
                <Dialog.Title>配置对比项</Dialog.Title>
                <Dialog.Content>
                  <ScrollView style={{ maxHeight: 360 }}>
                    {allRows.map(r => {
                      const isChecked = tempKeys.includes(r.key);
                      const index = tempKeys.indexOf(r.key);
                      return (
                        <View key={r.key} style={styles.optionRow}>
                          <Checkbox status={isChecked ? 'checked' : 'unchecked'} onPress={() => toggleKey(r.key)} />
                          <Text style={{ flex: 1 }}>{r.label}</Text>
                          <IconButton icon="chevron-up" disabled={!isChecked || index <= 0} onPress={() => moveKey(r.key, 'up')} />
                          <IconButton icon="chevron-down" disabled={!isChecked || index === tempKeys.length - 1} onPress={() => moveKey(r.key, 'down')} />
                        </View>
                      );
                    })}
                  </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={resetDefault}>重置默认</Button>
                  <Button onPress={closeConfig}>取消</Button>
                  <Button onPress={applyConfig}>应用</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            {/* 离屏导出布局：完整宽高，不滚动 */}
            {renderForExport && (
              <View
                ref={exportViewRef}
                style={[styles.exportRoot, { width: tableMinWidth }]}
              >
                {/* 表头 */}
                <View style={{ flexDirection: 'row' }}>
                  <View style={[styles.exportCell, { width: featureColumnWidth, backgroundColor: '#f5f5f5' }]}>
                    <Text>特性</Text>
                  </View>
                  {(products || []).map((p, idx) => (
                    <View key={p.id} style={[styles.exportCell, { width: productColumnWidth, backgroundColor: columnColors[idx % columnColors.length].bg, borderColor: columnColors[idx % columnColors.length].border, borderWidth: 1 }]}>
                      <Text numberOfLines={1}>{p.name}</Text>
                    </View>
                  ))}
                </View>

                {/* 内容行 */}
                {rowsToRender.map(r => (
                  <View key={r.key} style={{ flexDirection: 'row' }}>
                    <View style={[styles.exportCell, { width: featureColumnWidth }]}>
                      <Text>{r.label}</Text>
                    </View>
                    {(products || []).map((p, idx) => (
                      <View key={p.id} style={[styles.exportCell, { width: productColumnWidth, backgroundColor: columnColors[idx % columnColors.length].bg, borderColor: columnColors[idx % columnColors.length].border, borderWidth: 1 }]}>
                        <Text>{r.render(p)}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportBtn: {
    marginLeft: spacing.tiny,
  },
  tableContainer: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: spacing.small,
    paddingBottom: spacing.large,
  },
  tableHeader: {
    backgroundColor: colors.background,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colHeader: {
    justifyContent: 'center',
  },
  headerCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.small,
  },
  colHeaderText: {
    fontWeight: '600',
    maxWidth: '88%',
  },
  closeBtn: {
    marginLeft: spacing.tiny,
  },
  colCell: {
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exportRoot: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    backgroundColor: 'white',
  },
  exportCell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    justifyContent: 'center',
  },
});

export default ProductCompareScreen; 