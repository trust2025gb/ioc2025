/**
 * 输入框组件
 */

import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TextInputProps as RNTextInputProps, Text, TouchableOpacity } from 'react-native';
import { HelperText } from 'react-native-paper';
import { colors, spacing, radius } from '../../theme';

// 输入框类型
export type InputType = 'text' | 'password' | 'email' | 'number' | 'phone';

// 输入框属性
export interface InputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  error?: string;
  touched?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  rightElement?: React.ReactNode; // 新增：右侧自定义元素（按钮等）
  style?: any;
  disabled?: boolean;
  required?: boolean;
}

/**
 * 自定义输入框组件
 */
const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  type = 'text',
  error,
  touched,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightElement,
  style,
  disabled = false,
  required = false,
  ...rest
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(type === 'password');
  const [isFocused, setIsFocused] = useState(false);

  // 根据类型获取键盘类型
  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  // 处理右侧图标点击
  const handleRightIconPress = () => {
    if (type === 'password') {
      setSecureTextEntry(!secureTextEntry);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  // 显示错误信息
  const showError = touched && error;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <View 
        style={[
          styles.inputContainer, 
          isFocused && styles.inputFocused,
          showError ? styles.inputError : undefined,
          disabled ? styles.inputDisabled : undefined
        ]}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{leftIcon === 'account' ? '👤' : leftIcon === 'lock' ? '🔒' : leftIcon === 'email' ? '✉️' : leftIcon === 'phone' ? '📱' : '📄'}</Text>
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={getKeyboardType()}
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {rightElement ? (
          <View style={styles.rightElementContainer}>{rightElement}</View>
        ) : ((type === 'password' || rightIcon) && (
          <TouchableOpacity style={styles.iconContainer} onPress={handleRightIconPress}>
            <Text style={styles.icon}>
              {type === 'password' ? (secureTextEntry ? '👁️' : '👁️‍🗨️') : rightIcon}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showError && <HelperText type="error">{error}</HelperText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
  },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.regular,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.grey100,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.small,
    color: colors.textPrimary,
    fontSize: 16,
  },
  iconContainer: {
    paddingHorizontal: spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  rightElementContainer: {
    paddingHorizontal: spacing.small,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Input; 