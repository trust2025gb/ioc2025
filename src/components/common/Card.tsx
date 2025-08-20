/**
 * 卡片组件
 */

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Card as PaperCard, Text } from 'react-native-paper';
import { colors, spacing, radius, shadows } from '../../theme';

// 卡片类型
export type CardType = 'default' | 'outlined' | 'elevated';

// 卡片属性
export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  type?: CardType;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * 自定义卡片组件
 */
const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  type = 'default',
  onPress,
  style,
  contentStyle,
  leftIcon,
  rightIcon,
  footer,
}) => {
  // 根据类型获取样式
  const getCardStyle = () => {
    switch (type) {
      case 'outlined':
        return styles.outlinedCard;
      case 'elevated':
        return styles.elevatedCard;
      default:
        return styles.defaultCard;
    }
  };

  // 卡片内容
  const renderContent = () => (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  // 可点击卡片
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, getCardStyle(), style]}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // 普通卡片
  return (
    <View style={[styles.container, getCardStyle(), style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.regular,
    marginBottom: spacing.medium,
    backgroundColor: colors.background,
  },
  defaultCard: {
    backgroundColor: colors.background,
  },
  outlinedCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevatedCard: {
    backgroundColor: colors.background,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leftIcon: {
    marginRight: spacing.small,
  },
  rightIcon: {
    marginLeft: spacing.small,
  },
  content: {
    padding: spacing.medium,
  },
  footer: {
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});

export default Card; 