/**
 * 设置页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import { List, Divider, RadioButton, Button, Dialog, Portal, Text } from 'react-native-paper';
import { Switch as RNSwitch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';

// 导入组件
import { Container, Header } from '../../components';
import { settingsService } from '../../api/services/settingsService';
import { apiClient } from '../../api/client';
import { NotificationsApi } from '../../api/notifications';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ProfileTabParamList } from '../../navigation/types';
import { STORAGE_KEYS } from '../../constants/config';
import { setTheme } from '../../store/slices/uiSlice';

// 统一开关组件：Web 使用 RN 自带 Switch，移动端使用 Paper Switch
const ToggleSwitch: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }> = ({ value, onValueChange, disabled }) => {
  if (Platform.OS === 'web') {
    return (
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={!!disabled}
      />
    );
  }
  const Paper = require('react-native-paper');
  const PaperSwitch = Paper.Switch as any;
  return <PaperSwitch value={value} onValueChange={onValueChange} color={colors.primary} disabled={!!disabled} />;
};

/**
 * 设置页面组件
 */
const SettingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ProfileTabParamList>>();
  const dispatch = useDispatch();
  const isWeb = Platform.OS === 'web';
  
  // 设置状态
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [language, setLanguage] = useState('zh_CN');
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const [channels, setChannels] = useState<any>({ db: true, push: true, email: false });
  
  // 初始化加载后端设置
  React.useEffect(() => {
    (async () => {
      try {
        const s = await settingsService.get();
        setDarkMode(!!s.dark_mode);
        setBiometricLogin(!!s.biometric_login);
        setLanguage(s.language || 'zh_CN');

        // 读取通知偏好
        try {
          const pref = await NotificationsApi.getPreferences();
          const ch = pref?.channels || { db: true, push: true };
          setChannels(ch);
          setPushNotifications(ch.push !== false);
          setEmailNotifications(ch.email === true);
        } catch (_) {}
      } catch (_) {}
    })();
  }, []);

  // 提交设置到后端
  const saveSettings = async (next: Partial<{ dark_mode: boolean; biometric_login: boolean; language: string }>) => {
    try {
      const merged = { dark_mode: darkMode, biometric_login: biometricLogin, language, ...next };
      const saved = await settingsService.update(merged);
      setDarkMode(!!saved.dark_mode);
      setBiometricLogin(!!saved.biometric_login);
      setLanguage(saved.language || 'zh_CN');
    } catch (_) {}
  };
  
  // 保存通知偏好
  const saveNotificationChannels = async (next: Partial<{ push: boolean; email: boolean }>) => {
    try {
      const merged = { ...channels, ...next };
      setChannels(merged);
      await NotificationsApi.updatePreferences({ channels: merged });
    } catch (_) {}
  };
  
  // 处理清除缓存
  const handleClearCache = async () => {
    try {
      // 先记录后端操作日志（在仍持有令牌的情况下）
      try {
        await apiClient.post('/api/activities', { type: 'clear_cache', title: '用户清除缓存', description: '来自设置页面' });
      } catch (_) {
        // 忽略日志失败
      }
      // 再清除常见本地存储键
      await AsyncStorage.multiRemove([
        '@app_cache', '@temp_data',
        STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_DATA,
        '@ioc3:notification_flags', STORAGE_KEYS.NOTIFICATION_SETTINGS,
      ]);
      setClearCacheDialogVisible(false);
      Alert.alert('成功', '缓存已清除');
    } catch (error) {
      Alert.alert('错误', '清除缓存失败');
    }
  };
  
  // 处理语言选择
  const handleLanguageSelect = (value: string) => {
    setLanguage(value);
    setLanguageDialogVisible(false);
    // 在实际应用中，这里应该更新应用语言设置
  };
  
  // 获取语言名称
  const getLanguageName = (code: string) => {
    switch (code) {
      case 'zh_CN':
        return '简体中文';
      case 'en_US':
        return 'English (US)';
      case 'zh_TW':
        return '繁體中文';
      default:
        return code;
    }
  };
  
  return (
    <Container safeArea>
      <Header
        title="设置"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* 通知设置 */}
        <List.Section>
          <List.Subheader>通知设置</List.Subheader>
          <List.Item
            title="推送通知"
            description={`接收应用内推送通知${isWeb ? '（仅App生效）' : ''}`}
            onPress={() => { if (isWeb) return; const v = !pushNotifications; setPushNotifications(v); saveNotificationChannels({ push: v }); }}
            right={() => (
              <ToggleSwitch
                value={pushNotifications}
                onValueChange={(v) => { if (isWeb) return; setPushNotifications(v); saveNotificationChannels({ push: v }); }}
                disabled={isWeb}
              />
            )}
          />
          <Divider />
          <List.Item
            title="邮件通知"
            description={`接收邮件通知${isWeb ? '（仅App生效）' : ''}`}
            onPress={() => { if (isWeb) return; const v = !emailNotifications; setEmailNotifications(v); saveNotificationChannels({ email: v }); }}
            right={() => (
              <ToggleSwitch
                value={emailNotifications}
                onValueChange={(v) => { if (isWeb) return; setEmailNotifications(v); saveNotificationChannels({ email: v }); }}
                disabled={isWeb}
              />
            )}
          />
        </List.Section>
        
        {/* 应用设置 */}
        <List.Section>
          <List.Subheader>应用设置</List.Subheader>
          <List.Item
            title="深色模式"
            description={`启用深色主题${isWeb ? '（仅App生效）' : ''}`}
            onPress={() => { if (isWeb) return; const v = !darkMode; setDarkMode(v); dispatch(setTheme(v ? 'dark' : 'light')); saveSettings({ dark_mode: v }); }}
            right={() => (
              <ToggleSwitch
                value={darkMode}
                onValueChange={(v) => { if (isWeb) return; setDarkMode(v); dispatch(setTheme(v ? 'dark' : 'light')); saveSettings({ dark_mode: v }); }}
                disabled={isWeb}
              />
            )}
          />
          <Divider />
          <List.Item
            title="生物识别登录"
            description={`使用指纹或面部识别登录${isWeb ? '（仅App生效）' : ''}`}
            onPress={async () => { if (isWeb) return; const v = !biometricLogin; setBiometricLogin(v); await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, v ? '1' : '0'); saveSettings({ biometric_login: v }); }}
            right={() => (
              <ToggleSwitch
                value={biometricLogin}
                onValueChange={async (v) => { if (isWeb) return; setBiometricLogin(v); await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, v ? '1' : '0'); saveSettings({ biometric_login: v }); }}
                disabled={isWeb}
              />
            )}
          />
          <Divider />
          <List.Item
            title="语言"
            description={getLanguageName(language)}
            onPress={() => setLanguageDialogVisible(true)}
          />
          <Divider />
          <List.Item
            title="清除缓存"
            description="清除应用缓存数据"
            onPress={() => setClearCacheDialogVisible(true)}
          />
        </List.Section>
        
        {/* 账户安全 */}
        <List.Section>
          <List.Subheader>账户安全</List.Subheader>
          <List.Item
            title="修改密码"
            onPress={() => navigation.navigate(ROUTES.PROFILE.CHANGE_PASSWORD)}
          />
          <Divider />
          <List.Item
            title="隐私设置"
            onPress={() => navigation.navigate('CmsPage' as any, { slug: 'settings_privacy', title: '隐私设置' })}
          />
        </List.Section>
        
        {/* 关于 */}
        <List.Section>
          <List.Subheader>关于</List.Subheader>
          <List.Item
            title="应用版本"
            description="1.0.0"
          />
          <Divider />
          <List.Item
            title="服务条款"
            onPress={() => navigation.navigate('CmsPage' as any, { slug: 'terms', title: '服务条款' })}
          />
          <Divider />
          <List.Item
            title="隐私政策"
            onPress={() => navigation.navigate('CmsPage' as any, { slug: 'privacy', title: '隐私政策' })}
          />
          <Divider />
          <List.Item
            title="关于我们"
            onPress={() => navigation.navigate('CmsPage' as any, { slug: 'about', title: '关于我们' })}
          />
        </List.Section>
      </ScrollView>
      
      {/* 清除缓存确认对话框 */}
      <Portal>
        <Dialog visible={clearCacheDialogVisible} onDismiss={() => setClearCacheDialogVisible(false)}>
          <Dialog.Title>清除缓存</Dialog.Title>
          <Dialog.Content>
            <Text>确定要清除应用缓存吗？这将删除临时文件和存储的数据，但不会影响您的账户信息。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialogVisible(false)}>取消</Button>
            <Button onPress={handleClearCache}>确定</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* 语言选择对话框 */}
      <Portal>
        <Dialog visible={languageDialogVisible} onDismiss={() => setLanguageDialogVisible(false)}>
          <Dialog.Title>选择语言</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => { handleLanguageSelect(value); saveSettings({ language: value }); }} value={language}>
              <View style={styles.radioItem}>
                <RadioButton value="zh_CN" color={colors.primary} />
                <Text>简体中文</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="en_US" color={colors.primary} />
                <Text>English (US)</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="zh_TW" color={colors.primary} />
                <Text>繁體中文</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLanguageDialogVisible(false)}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.tiny,
  },
});

export default SettingsScreen; 