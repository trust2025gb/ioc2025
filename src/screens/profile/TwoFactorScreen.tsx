import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, Button, List } from 'react-native-paper';
import { Container, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';

const TwoFactorScreen = () => {
  const navigation = useNavigation();
  const [enabled, setEnabled] = useState(false);

  return (
    <Container safeArea>
      <Header title="双因素认证" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={styles.body}>
        <List.Item
          title="启用双因素认证"
          description={enabled ? '已启用' : '未启用'}
          right={() => <Switch value={enabled} onValueChange={setEnabled} />}
        />
        <Button mode="contained" style={styles.btn} onPress={() => navigation.goBack()}>
          保存
        </Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  btn: {
    marginTop: 24,
  },
});

export default TwoFactorScreen; 