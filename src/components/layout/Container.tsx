/**
 * 容器组件
 */

import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
import Header from './Header';

// 容器属性
export interface ContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  statusBarColor?: string;
  statusBarStyle?: any;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

/**
 * 页面容器组件
 * 提供基础页面布局，支持滚动、安全区域等
 */
const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = true,
  safeArea = true,
  style,
  contentContainerStyle,
  backgroundColor = colors.background,
  statusBarColor = colors.background,
  statusBarStyle = 'dark-content',
  paddingHorizontal = spacing.medium,
  paddingVertical = spacing.medium,
}) => {
  // 将 Header 与内容分离，确保 Header 全宽显示
  const childrenArray = React.Children.toArray(children);
  const headerElements: React.ReactNode[] = [];
  const contentElements: React.ReactNode[] = [];
  childrenArray.forEach((child) => {
    if (React.isValidElement(child) && child.type === Header) {
      headerElements.push(child);
    } else {
      contentElements.push(child);
    }
  });

  // 容器内容
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={[styles.container, { backgroundColor }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {headerElements}
          <View style={[styles.content, { paddingHorizontal, paddingVertical }, contentContainerStyle]}>
            {contentElements}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        {headerElements}
        <View style={[styles.content, { paddingHorizontal, paddingVertical }, contentContainerStyle]}>{contentElements}</View>
      </View>
    );
  };

  // 带安全区域的容器
  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <StatusBar backgroundColor={statusBarColor} barStyle={statusBarStyle} />
        {renderContent()}
      </SafeAreaView>
    );
  }

  // 普通容器
  return (
    <>
      <StatusBar backgroundColor={statusBarColor} barStyle={statusBarStyle} />
      {renderContent()}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexGrow: 1,
  },
});

export default Container; 