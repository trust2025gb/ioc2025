/**
 * 合同创建页面（占位实现）
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ContractsStackParamList } from '../../navigation/types';

const ContractCreateScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ContractsStackParamList>>();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">创建合同</Text>
      <Text style={{ marginTop: 8 }}>该页面暂为占位实现，后续可接入表单与提交流程。</Text>
      <Button mode="contained" style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
        返回
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

export default ContractCreateScreen; 