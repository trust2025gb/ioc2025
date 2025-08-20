/**
 * 空状态组件
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme';

// 空状态组件属性
export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  style?: ViewStyle;
}

/**
 * 空状态组件
 * 显示空数据状态，支持自定义图标、标题、消息和按钮
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'database-off',
  iconSize = 64,
  iconColor = colors.grey400,
  buttonText,
  onButtonPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Icon name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {buttonText && onButtonPress && (
        <Button
          mode="contained"
          onPress={onButtonPress}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          {buttonText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xlarge,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: spacing.medium,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.small,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  button: {
    marginTop: spacing.medium,
  },
  buttonLabel: {
    fontSize: 14,
    textTransform: 'none',
  },
});

export default EmptyState; 