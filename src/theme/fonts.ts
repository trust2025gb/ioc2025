import { Platform } from 'react-native';

/**
 * 字体族
 */
export const fonts = {
  regular: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
  },
  medium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'sans-serif-medium',
    }),
  },
  light: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto-Light',
      default: 'sans-serif-light',
    }),
  },
  thin: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto-Thin',
      default: 'sans-serif-thin',
    }),
  },
};

/**
 * 字体配置（React Native Paper）
 */
export const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto-Light',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto-Thin',
      fontWeight: '100',
    },
  },
};

/**
 * 字体大小
 */
export const fontSize = {
  tiny: 10,
  caption: 12,
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
  xxlarge: 24,
  xxxlarge: 30,
  huge: 36,
};

/**
 * 行高
 */
export const lineHeight = {
  tiny: 14,
  caption: 18,
  small: 20,
  medium: 24,
  large: 28,
  xlarge: 30,
  xxlarge: 36,
  xxxlarge: 45,
  huge: 54,
}; 