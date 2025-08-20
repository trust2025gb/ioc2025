/**
 * 合同签署页面
 */

import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, Button, Divider, TextInput, RadioButton, SegmentedButtons, ActivityIndicator, Card } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header } from '../../components';

// 导入API服务
import { contractService, Contract, SignatureType } from '../../api/services/contractService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ContractsStackParamList } from '../../navigation/types';

/**
 * 合同签署页面组件
 */
const ContractSignScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ContractsStackParamList>>();
  const route = useRoute<RouteProp<ContractsStackParamList, typeof ROUTES.CONTRACTS.SIGN>>();
  const { id, contract } = route.params;
  const queryClient = useQueryClient();
  
  // 签名板引用
  const signatureRef = useRef<SignatureViewRef | null>(null);
  
  // 状态
  const [signatureMethod, setSignatureMethod] = useState<SignatureType>(SignatureType.ELECTRONIC);
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [signatoryIdNumber, setSignatoryIdNumber] = useState('');
  const [signatureLocation, setSignatureLocation] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 签署合同
  const signContractMutation = useMutation({
    mutationFn: (signatureData: any) => contractService.signContract(id, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error('签署合同失败:', error);
      setErrors({ submit: '签署失败，请稍后重试' });
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!signatoryName.trim()) {
      newErrors.signatoryName = '签署人姓名为必填项';
    }
    
    if (signatureMethod === SignatureType.HANDWRITTEN && !signatureImage) {
      newErrors.signatureImage = '请提供手写签名';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理签署合同
  const handleSignContract = async () => {
    if (!validateForm()) return;
    
    try {
      const signatureData: any = {
        signature_method: signatureMethod,
        signatory_name: signatoryName,
      };
      
      if (signatoryTitle.trim()) {
        signatureData.signatory_title = signatoryTitle;
      }
      
      if (signatoryIdNumber.trim()) {
        signatureData.signatory_id_number = signatoryIdNumber;
      }
      
      if (signatureLocation.trim()) {
        signatureData.signature_location = signatureLocation;
      }
      
      if (signatureImage && signatureMethod === SignatureType.HANDWRITTEN) {
        // 将Base64图像转换为文件对象
        // 注意：真实实现中，需要处理Base64字符串转为Blob或File
        signatureData.signature_image = signatureImage;
      }
      
      signContractMutation.mutate(signatureData);
    } catch (error) {
      console.error('处理签名失败:', error);
      setErrors({ submit: '处理签名失败，请重试' });
    }
  };

  // 选择图像
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setErrors({ signatureImage: '需要访问相册权限' });
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled) {
        setSignatureImage(result.assets[0].uri);
        setErrors({ ...errors, signatureImage: '' });
      }
    } catch (error) {
      console.error('选择图像失败:', error);
      setErrors({ ...errors, signatureImage: '选择图像失败' });
    }
  };

  // 处理签名完成
  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      // @ts-ignore - 类型声明不完整
      signatureRef.current.readSignature();
    }
  };

  // 处理签名数据
  const handleSignature = (signature: string) => {
    setSignatureImage(signature);
    setShowSignatureCanvas(false);
    setErrors({ ...errors, signatureImage: '' });
  };

  // 渲染签名方式选择
  const renderSignatureMethodSelection = () => (
    <View style={styles.methodSelectionContainer}>
      <Text style={styles.sectionTitle}>签名方式</Text>
      <SegmentedButtons
        value={signatureMethod}
        onValueChange={(value) => setSignatureMethod(value as SignatureType)}
        buttons={[
          {
            value: SignatureType.ELECTRONIC,
            label: '电子签名',
            icon: 'keyboard',
          },
          {
            value: SignatureType.HANDWRITTEN,
            label: '手写签名',
            icon: 'draw',
          },
          {
            value: SignatureType.DIGITAL,
            label: '数字证书',
            icon: 'certificate',
          },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  // 渲染签署人信息表单
  const renderSignatoryForm = () => (
    <View style={styles.signatoryFormContainer}>
      <Text style={styles.sectionTitle}>签署人信息</Text>
      
      <TextInput
        label="姓名 *"
        value={signatoryName}
        onChangeText={(text) => {
          setSignatoryName(text);
          if (text.trim()) {
            setErrors({ ...errors, signatoryName: '' });
          }
        }}
        style={styles.input}
        error={!!errors.signatoryName}
      />
      {errors.signatoryName && (
        <Text style={styles.errorText}>{errors.signatoryName}</Text>
      )}
      
      <TextInput
        label="职位"
        value={signatoryTitle}
        onChangeText={setSignatoryTitle}
        style={styles.input}
      />
      
      <TextInput
        label="身份证号码"
        value={signatoryIdNumber}
        onChangeText={setSignatoryIdNumber}
        style={styles.input}
      />
      
      <TextInput
        label="签署地点"
        value={signatureLocation}
        onChangeText={setSignatureLocation}
        style={styles.input}
      />
    </View>
  );

  // 渲染手写签名部分
  const renderHandwrittenSignature = () => (
    <View style={styles.handwrittenContainer}>
      <Text style={styles.sectionTitle}>手写签名</Text>
      
      {!showSignatureCanvas ? (
        <>
          <View style={styles.signaturePreview}>
            {signatureImage ? (
              <Image 
                source={{ uri: signatureImage }} 
                style={styles.signatureImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.emptySignature}>
                <Icon name="draw" size={40} color={colors.grey400} />
                <Text style={styles.emptySignatureText}>暂无签名</Text>
              </View>
            )}
          </View>
          
          <View style={styles.signatureActions}>
            <Button 
              mode="outlined" 
              icon="draw" 
              onPress={() => setShowSignatureCanvas(true)}
              style={styles.signatureButton}
            >
              手写签名
            </Button>
            <Button 
              mode="outlined" 
              icon="image" 
              onPress={pickImage}
              style={styles.signatureButton}
            >
              从相册选择
            </Button>
          </View>
          
          {errors.signatureImage && (
            <Text style={styles.errorText}>{errors.signatureImage}</Text>
          )}
        </>
      ) : (
        <View style={styles.signatureCanvasContainer}>
          <Signature
            ref={signatureRef}
            onOK={handleSignature}
            onEnd={handleSignatureEnd}
            descriptionText="签名区域"
            clearText="清除"
            confirmText="确认"
            webStyle={`
              .m-signature-pad--footer {
                display: flex;
                justify-content: space-between;
                margin: 0px 10px;
              }
              .m-signature-pad--footer .button {
                background-color: ${colors.primary};
                color: white;
                padding: 10px;
                border-radius: 4px;
              }
              .m-signature-pad--footer .clear-button {
                background-color: ${colors.error};
              }
            `}
          />
        </View>
      )}
    </View>
  );

  // 渲染电子签名部分
  const renderElectronicSignature = () => (
    <View style={styles.electronicContainer}>
      <Text style={styles.sectionTitle}>电子签名</Text>
      <Text style={styles.electronicDescription}>
        通过提交此表单，我确认并同意这是我的合法电子签名，并承认这与我的手写签名具有相同的法律效力。
      </Text>
      <View style={styles.electronicPreview}>
        <Text style={styles.electronicName}>{signatoryName || '请输入签署人姓名'}</Text>
        <Text style={styles.electronicDate}>{new Date().toLocaleDateString()}</Text>
      </View>
    </View>
  );

  // 渲染数字证书签名部分
  const renderDigitalSignature = () => (
    <View style={styles.digitalContainer}>
      <Text style={styles.sectionTitle}>数字证书</Text>
      <Text style={styles.digitalDescription}>
        使用数字证书签名需要您拥有有效的数字证书。请确保您已安装并配置好数字证书。
      </Text>
      <Button 
        mode="contained" 
        icon="shield-key" 
        onPress={() => {}}
        style={styles.digitalButton}
      >
        选择数字证书
      </Button>
      <Text style={styles.digitalNote}>
        注意: 目前数字证书功能仍在开发中，暂不可用。请选择其他签名方式。
      </Text>
    </View>
  );

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="签署合同"
        showBackButton={true}
        onBackPress={handleBack}
      />
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.contractInfoCard}>
          <Text style={styles.contractTitle}>{contract.title}</Text>
          <Text style={styles.contractNumber}>合同号: {contract.contract_number}</Text>
        </Card>
        
        {renderSignatureMethodSelection()}
        {renderSignatoryForm()}
        
        <Divider style={styles.divider} />
        
        {signatureMethod === SignatureType.HANDWRITTEN && renderHandwrittenSignature()}
        {signatureMethod === SignatureType.ELECTRONIC && renderElectronicSignature()}
        {signatureMethod === SignatureType.DIGITAL && renderDigitalSignature()}
        
        {errors.submit && (
          <Text style={[styles.errorText, styles.submitError]}>{errors.submit}</Text>
        )}
        
        <Button
          mode="contained"
          icon="check"
          onPress={handleSignContract}
          style={styles.submitButton}
          loading={signContractMutation.isPending}
          disabled={signContractMutation.isPending}
        >
          确认签署
        </Button>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
  },
  contractInfoCard: {
    padding: spacing.medium,
    backgroundColor: colors.grey100,
    borderRadius: 8,
    marginBottom: spacing.medium,
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.tiny,
  },
  contractNumber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
    color: colors.primary,
  },
  methodSelectionContainer: {
    marginBottom: spacing.medium,
  },
  segmentedButtons: {
    marginBottom: spacing.small,
  },
  signatoryFormContainer: {
    marginBottom: spacing.medium,
  },
  input: {
    marginBottom: spacing.small,
    backgroundColor: colors.grey100,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  handwrittenContainer: {
    marginBottom: spacing.medium,
  },
  signaturePreview: {
    height: 150,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 8,
    marginBottom: spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptySignature: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySignatureText: {
    color: colors.grey400,
    marginTop: spacing.tiny,
  },
  signatureImage: {
    width: '100%',
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureButton: {
    flex: 1,
    marginHorizontal: spacing.tiny,
  },
  signatureCanvasContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 8,
    marginBottom: spacing.medium,
  },
  electronicContainer: {
    marginBottom: spacing.medium,
  },
  electronicDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.medium,
    lineHeight: 20,
  },
  electronicPreview: {
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 8,
    backgroundColor: colors.grey100,
  },
  electronicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.small,
  },
  electronicDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  digitalContainer: {
    marginBottom: spacing.medium,
  },
  digitalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.medium,
    lineHeight: 20,
  },
  digitalButton: {
    marginBottom: spacing.medium,
  },
  digitalNote: {
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -spacing.small,
    marginBottom: spacing.small,
  },
  submitError: {
    textAlign: 'center',
    marginTop: 0,
  },
  submitButton: {
    marginTop: spacing.medium,
  },
});

export default ContractSignScreen; 