/**
 * 加载组件
 */

import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

// 加载组件属性
export interface LoadingProps {
  loading: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * 加载组件
 * 显示加载状态，支持覆盖层和自定义消息
 */
const Loading: React.FC<LoadingProps> = ({
  loading,
  message,
  overlay = false,
  size = 'large',
  color = colors.primary,
  style,
  children,
}) => {
  // 如果不是加载状态，直接渲染子组件
  if (!loading) {
    return <>{children}</>;
  }

  // 加载指示器
  const renderLoader = () => (
    <View style={[styles.loaderContainer, overlay ? styles.overlay : null, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  // 如果是覆盖层模式，渲染子组件和加载指示器
  if (overlay && children) {
    return (
      <View style={styles.container}>
        {children}
        {renderLoader()}
      </View>
    );
  }

  // 否则只渲染加载指示器
  return renderLoader();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  message: {
    marginTop: spacing.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

export default Loading; 