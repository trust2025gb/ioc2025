import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export interface WebTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  style?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  autoCorrect?: boolean;
  keyboardType?: string;
  testID?: string;
  enterKeyHint?: string;
  spellCheck?: boolean;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholderTextColor?: string;
}

/**
 * 专门为Web平台设计的输入框组件
 * 使用原生HTML输入框解决React Native Web输入框问题
 */
const WebTextInput: React.FC<WebTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  style,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  keyboardType,
  testID,
  enterKeyHint,
  spellCheck,
  onSubmitEditing,
  onFocus,
  onBlur,
  placeholderTextColor
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && inputRef.current) {
      // 确保输入框获得焦点后不会失去焦点
      const handleFocus = () => {
        console.log('Input focused');
      };
      
      const input = inputRef.current;
      input.addEventListener('focus', handleFocus);
      
      return () => {
        input.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  if (Platform.OS !== 'web') {
    return null; // 只在Web平台使用
  }

  const inputType = secureTextEntry ? 'password' : 
                   keyboardType === 'email-address' ? 'email' :
                   keyboardType === 'numeric' ? 'number' : 'text';

  // 将React Native样式转换为CSS样式
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const cssStyle = {
    height: flattenedStyle.height || 50,
    borderWidth: flattenedStyle.borderWidth || 1,
    borderColor: flattenedStyle.borderColor || '#ddd',
    borderRadius: flattenedStyle.borderRadius || 8,
    paddingLeft: flattenedStyle.paddingHorizontal || 16,
    paddingRight: flattenedStyle.paddingHorizontal || 16,
    fontSize: flattenedStyle.fontSize || 16,
    color: flattenedStyle.color || '#333',
    backgroundColor: flattenedStyle.backgroundColor || '#fff',
    width: '100%',
    boxSizing: 'border-box' as 'border-box',
    outline: 'none',
  };

  return (
    <View style={{ width: '100%' }}>
      <input
        ref={inputRef}
        type={inputType}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        style={cssStyle}
        autoComplete={autoComplete || 'off'}
        data-testid={testID}
        spellCheck={spellCheck}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && onSubmitEditing) {
            onSubmitEditing();
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

export default WebTextInput; 