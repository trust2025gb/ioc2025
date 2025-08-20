import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, List } from 'react-native-paper';
import { Container, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';

const DeviceManagementScreen = () => {
  const navigation = useNavigation();

  return (
    <Container safeArea>
      <Header title="登录设备管理" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={styles.body}>
        <List.Section>
          <List.Subheader>当前设备</List.Subheader>
          <List.Item title="本机" description="该设备已登录" left={props => <List.Icon {...props} icon="cellphone" />} />
        </List.Section>
        <Button mode="contained" style={styles.btn} onPress={() => navigation.goBack()}>
          使所有设备下线
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

export default DeviceManagementScreen; 