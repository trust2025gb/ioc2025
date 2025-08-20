import { DefaultTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { fonts, fontConfig } from './fonts';

/**
 * 间距常量
 */
export const spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  extraLarge: 32,
  xxlarge: 48,
};

/**
 * 圆角常量
 */
export const radius = {
  small: 4,
  regular: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  round: 9999,
};

/**
 * 阴影常量
 */
export const shadows = {
  light: {
    // 替换boxShadow为React Native原生阴影属性
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    // 替换boxShadow为React Native原生阴影属性
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  heavy: {
    // 替换boxShadow为React Native原生阴影属性
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

/**
 * 亮色主题
 */
export const theme: any = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.textPrimary,
    onSurface: colors.textPrimary,
    disabled: colors.textDisabled,
    placeholder: colors.textSecondary,
    backdrop: colors.backdrop,
    notification: colors.notification,
  },
  fonts: configureFonts(fontConfig as any),
  roundness: radius.regular,
  animation: {
    scale: 1.0,
  },
};

/**
 * 暗色主题
 */
export const darkTheme: any = {
  ...DefaultTheme,
  dark: true,
  mode: 'adaptive',
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryLight,
    background: '#121212',
    surface: '#1E1E1E',
    error: colors.error,
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    disabled: '#888888',
    placeholder: '#BBBBBB',
    backdrop: 'rgba(0,0,0,0.6)',
    notification: colors.notification,
  },
  fonts: configureFonts(fontConfig as any),
  roundness: radius.regular,
  animation: {
    scale: 1.0,
  },
};

/**
 * 导出所有主题相关常量
 */
export { colors, fonts, fontConfig }; 