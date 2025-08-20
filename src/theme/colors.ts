/**
 * 调色板
 */
const palette = {
  // 主色
  blue: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // 辅助色
  teal: {
    50: '#E0F2F1',
    100: '#B2DFDB',
    200: '#80CBC4',
    300: '#4DB6AC',
    400: '#26A69A',
    500: '#009688',
    600: '#00897B',
    700: '#00796B',
    800: '#00695C',
    900: '#004D40',
  },
  
  // 强调色
  amber: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },
  
  // 错误色
  red: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  
  // 成功色
  green: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  
  // 警告色
  orange: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  
  // 信息色
  cyan: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },
  
  // 中性色
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // 基础色
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * 应用颜色
 */
export const colors = {
  // 主题色
  primary: palette.blue[700],
  primaryLight: palette.blue[500],
  primaryDark: palette.blue[900],

  // 次要色（为兼容旧代码的secondary）
  secondary: palette.teal[500],

  // 强调色
  accent: palette.amber[500],
  accentLight: palette.amber[300],
  accentDark: palette.amber[700],

  // 功能色
  success: palette.green[600],
  info: palette.cyan[600],
  warning: palette.orange[600],
  error: palette.red[600],

  // 背景色
  background: palette.grey[100],
  surface: palette.white,
  card: palette.white,

  // 文本色
  textPrimary: palette.grey[900],
  textSecondary: palette.grey[600],
  textTertiary: palette.grey[500],
  textDisabled: palette.grey[400],
  textInverse: palette.white,

  // 直接暴露常用灰阶（兼容旧用法）
  grey50: palette.grey[50],
  grey100: palette.grey[100],
  grey200: palette.grey[200],
  grey300: palette.grey[300],
  grey400: palette.grey[400],
  grey500: palette.grey[500],
  grey600: palette.grey[600],
  grey700: palette.grey[700],
  grey800: palette.grey[800],
  grey900: palette.grey[900],

  // 边框色
  border: palette.grey[300],
  divider: palette.grey[200],

  // 基础色直出（兼容旧用法）
  white: palette.white,
  black: palette.black,

  // 其他
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: palette.red[500],
  // 兼容别名
  errorLight: palette.red[50],
  successLight: palette.green[50],
  orange: palette.orange[500],
  text: undefined as unknown as string, // 占位，避免旧代码直接取 colors.text


  // 透明度
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(255, 255, 255, 0.6)',
    strong: 'rgba(255, 255, 255, 0.4)',
  },

  // 状态颜色
  statusColors: {
    active: palette.green[600],
    pending: palette.amber[600],
    inactive: palette.grey[500],
    completed: palette.blue[600],
    cancelled: palette.red[600],
  },

  // 图表颜色
  chart: [
    palette.blue[500],
    palette.teal[500],
    palette.amber[500],
    palette.red[500],
    palette.green[500],
    palette.orange[500],
    palette.cyan[500],
    palette.blue[300],
    palette.teal[300],
    palette.amber[300],
  ],
}; 