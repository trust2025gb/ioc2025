import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageUtils, STORAGE_KEYS } from '../../utils/storage';

const ChatSettingsScreen = () => {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = React.useState(true);

  // 加载已保存的设置
  React.useEffect(() => {
    const load = async () => {
      const saved = await StorageUtils.getItem<any>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (saved) {
        if (typeof saved.notificationsEnabled === 'boolean') setNotificationsEnabled(saved.notificationsEnabled);
        if (typeof saved.readReceiptsEnabled === 'boolean') setReadReceiptsEnabled(saved.readReceiptsEnabled);
      }
    };
    load();
  }, []);

  const save = (next: { notificationsEnabled: boolean; readReceiptsEnabled: boolean }) => {
    StorageUtils.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, next).catch(() => {});
    // 控制台输出便于确认点击事件已触发
    console.log('聊天设置已保存: ', next);
  };

  const onToggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    save({ notificationsEnabled: val, readReceiptsEnabled });
  };

  const onToggleReadReceipts = (val: boolean) => {
    setReadReceiptsEnabled(val);
    save({ notificationsEnabled, readReceiptsEnabled: val });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>返回</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' }}>聊天设置</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleNotifications(!notificationsEnabled)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 16 }}>通知</Text>
          <Switch value={notificationsEnabled} onValueChange={onToggleNotifications} pointerEvents="none" />
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: '#eee' }} />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleReadReceipts(!readReceiptsEnabled)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 16 }}>已读回执</Text>
          <Switch value={readReceiptsEnabled} onValueChange={onToggleReadReceipts} pointerEvents="none" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatSettingsScreen; 