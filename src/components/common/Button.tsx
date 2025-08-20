/**
 * 按钮组件
 */

import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors, spacing, radius } from '../../theme';

// 按钮类型
export type ButtonType = 'primary' | 'secondary' | 'outline' | 'text';

// 按钮尺寸
export type ButtonSize = 'small' | 'medium' | 'large';

// 按钮属性
export interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: any;
}

/**
 * 自定义按钮组件
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  // 根据类型获取样式
  const getButtonStyle = () => {
    switch (type) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      default:
        return styles.primaryButton;
    }
  };

  // 根据类型获取文本颜色
  const getTextColor = () => {
    switch (type) {
      case 'primary':
        return 'white';
      case 'secondary':
        return 'white';
      case 'outline':
        return colors.primary;
      case 'text':
        return colors.primary;
      default:
        return 'white';
    }
  };

  // 根据尺寸获取按钮高度
  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 44;
      case 'large':
        return 56;
      default:
        return 44;
    }
  };

  // 根据尺寸获取文本大小
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 14;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      <PaperButton
        mode={type === 'text' ? 'text' : type === 'outline' ? 'outlined' : 'contained'}
        onPress={onPress}
        disabled={disabled || loading}
        loading={loading}
        icon={icon}
        labelStyle={{
          fontSize: getTextSize(),
          color: getTextColor(),
          textTransform: 'none',
        }}
        style={[
          styles.button,
          getButtonStyle(),
          { height: getButtonHeight() },
          fullWidth && styles.fullWidth,
        ]}
        contentStyle={{ height: '100%' }}
      >
        {title}
      </PaperButton>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.regular,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button; 