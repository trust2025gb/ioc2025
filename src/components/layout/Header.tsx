/**
 * 头部组件
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle, Animated, Easing } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// 头部属性
export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  titleStyle?: ViewStyle;
  backgroundColor?: string; // 保留但不再使用
  elevation?: number;
}

/**
 * 页面头部组件
 */
const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightIcon,
  onRightIconPress,
  style,
  titleStyle,
  elevation = 4,
}) => {
  const navigation = useNavigation();

  // 计算彩虹色
  const hsl = (h: number) => `hsl(${h}, 90%, 50%)`;
  const [hue, setHue] = useState(0);

  // 细微曲线动画
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let frame: number | null = null;
    frame = typeof window !== 'undefined' ? window.setInterval(() => {
      setHue((h) => (h + 3) % 360); // 每次增加 3°，流畅又省电
    }, 60) : (setInterval(() => { setHue((h) => (h + 3) % 360); }, 60) as unknown as number); // ~16fps，足够平滑

    // 曲线动画（非常轻微）
    waveAnim1.setValue(0);
    waveAnim2.setValue(0);
    const loop1 = Animated.loop(
      Animated.timing(waveAnim1, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const loop2 = Animated.loop(
      Animated.timing(waveAnim2, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop1.start();
    loop2.start();

    return () => {
      if (frame) clearInterval(frame as number);
      loop1.stop();
      loop2.stop();
    };
  }, []);

  const gradientColors = [
    hsl(hue),
    hsl((hue + 45) % 360),
    hsl((hue + 90) % 360),
  ];

  // 处理返回
  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else (navigation as any).goBack();
  };

  // 平移范围很小，避免喧宾夺主
  const translateX1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
  const translateX2 = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });

  return (
    <View style={[styles.wrapper, style]}> 
      {/* 动态渐变背景 */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBg}
      />

      {/* 细微动态曲线覆盖层（低不透明度） */}
      <Animated.View
        pointerEvents="none"
        style={[styles.waveContainer as any, { transform: [{ translateX: translateX1 }], opacity: 0.08 }]}
      >
        <Svg viewBox="0 0 120 60" preserveAspectRatio="none" style={styles.waveSvg}>
          <Path d="M0,30 C 20,10 40,50 60,30 S 100,10 120,30 L120,60 L0,60 Z" fill="#ffffff" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.waveContainer as any, { transform: [{ translateX: translateX2 }], opacity: 0.06 }]}
      >
        <Svg viewBox="0 0 120 60" preserveAspectRatio="none" style={styles.waveSvg}>
          <Path d="M0,28 C 18,12 42,46 60,28 S 102,12 120,28 L120,60 L0,60 Z" fill="#ffffff" />
        </Svg>
      </Animated.View>

      {/* 顶部栏本体，透明叠加在渐变上 */}
      <Appbar.Header style={[styles.header, { backgroundColor: 'transparent', elevation }]}> 
        {showBackButton && (
          <Appbar.BackAction onPress={handleBackPress} color={colors.background} />
        )}
        <Appbar.Content
          title={title}
          subtitle={subtitle}
          titleStyle={[styles.title, titleStyle]}
          subtitleStyle={styles.subtitle}
        />
        {rightIcon && (
          <Appbar.Action icon={rightIcon} onPress={onRightIconPress} color={colors.background} />
        )}
      </Appbar.Header>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '200%',
  },
  waveSvg: {
    height: '100%',
    width: '100%',
  },
  header: {
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.background,
  },
  subtitle: {
    fontSize: 14,
    color: colors.grey200,
  },
});

export default Header; 