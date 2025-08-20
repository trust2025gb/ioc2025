import React from 'react';
import { TextInput, Platform, TextInputProps } from 'react-native';
import WebTextInput, { WebTextInputProps } from './WebTextInput';

/**
 * 平台自适应输入框组件
 * 在Web平台使用WebTextInput，在其他平台使用原生TextInput
 */
const PlatformTextInput: React.FC<TextInputProps> = (props) => {
  const { value, onChangeText, ...rest } = props;
  // 在Web平台使用WebTextInput，在其他平台使用原生TextInput
  if (Platform.OS === 'web') {
    const webProps: WebTextInputProps = {
      ...(rest as any),
      value: (value as string) ?? '',
      onChangeText: onChangeText || (() => {}),
      onSubmitEditing: undefined,
    };
    return (
      <WebTextInput {...webProps} />
    );
  }

  return <TextInput {...props} />;
};

export default PlatformTextInput; 