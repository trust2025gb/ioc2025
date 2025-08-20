import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Container, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../../store/hooks';
import { logout, resetAuthState } from '../../store/slices/authSlice';

const LogoutConfirmScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(resetAuthState());
    navigation.goBack();
  };

  return (
    <Container safeArea>
      <Header title="退出登录" showBackButton onBackPress={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text>确定要退出登录吗？</Text>
        <Button mode="contained" style={styles.btn} onPress={handleLogout}>确定退出</Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  body: { padding: 16 },
  btn: { marginTop: 24 },
});

export default LogoutConfirmScreen; 