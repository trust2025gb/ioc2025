/**
 * 理赔申诉页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { 
  Text, Button, Card, TextInput, HelperText, Divider, 
  RadioButton, Chip, ActivityIndicator, Banner, Portal, Dialog,
  List
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, ClaimStatus } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔申诉页面组件
 */
const ClaimAppealScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.APPEAL>>();
  const { id } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [appealData, setAppealData] = useState<{
    reason: string;
    additional_information?: string;
  } | null>(null);

  // 获取理赔详情
  const {
    data: claim,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimService.getClaim(id),
  });

  // 申诉理赔
  const appealClaimMutation = useMutation({
    mutationFn: ({ reason, additionalInformation }: { reason: string; additionalInformation?: string }) => {
      return claimService.appealClaim(id, reason, additionalInformation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      queryClient.invalidateQueries({ queryKey: ['claim-detail', id] });
      
      Alert.alert(
        '申诉成功',
        '您的申诉已提交，我们会尽快审核并与您联系',
        [
          {
            text: '返回详情',
            onPress: () => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id }),
          },
        ]
      );
    },
    onError: (error) => {
      console.error('理赔申诉失败:', error);
      Alert.alert('错误', '申诉提交失败，请重试', [{ text: '确定' }]);
      setConfirmDialogVisible(false);
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示确认对话框
  const showConfirmDialog = (values: any) => {
    setAppealData(values);
    setConfirmDialogVisible(true);
  };

  // 隐藏确认对话框
  const hideConfirmDialog = () => {
    setConfirmDialogVisible(false);
  };

  // 确认提交申诉
  const confirmAppeal = () => {
    if (appealData) {
      appealClaimMutation.mutate({
        reason: appealData.reason,
        additionalInformation: appealData.additional_information,
      });
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.REJECTED:
        return colors.error;
      case ClaimStatus.APPEALING:
        return colors.warning;
      default:
        return colors.grey500;
    }
  };

  // 获取状态名称
  const getStatusName = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.REJECTED:
        return '已拒绝';
      case ClaimStatus.APPEALING:
        return '申诉中';
      default:
        return '未知';
    }
  };

  // 申诉表单验证模式
  const validationSchema = Yup.object().shape({
    reason: Yup.string()
      .required('申诉原因为必填项')
      .min(10, '申诉原因至少需要10个字符'),
    additional_information: Yup.string(),
    agree_terms: Yup.boolean()
      .oneOf([true], '请阅读并同意申诉条款')
      .required('请阅读并同意申诉条款'),
  });

  // 渲染申诉表单
  const renderAppealForm = () => {
    if (!claim) return null;

    // 检查是否可以申诉
    const canAppeal = claim.status === ClaimStatus.REJECTED;
    const isAppealing = claim.status === ClaimStatus.APPEALING;

    if (isAppealing) {
      return (
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusContent}>
              <Icon name="gavel" size={48} color={colors.orange} />
              <Text style={styles.statusTitle}>理赔申诉处理中</Text>
              <Text style={styles.statusDescription}>
                您的申诉已提交，我们正在审核中，请耐心等待。我们会通过您提供的联系方式与您联系。
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(claim.status) }]}
                textStyle={styles.chipText}
              >
                {getStatusName(claim.status)}
              </Chip>
            </View>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id })}
            >
              返回详情
            </Button>
          </Card.Actions>
        </Card>
      );
    }

    if (!canAppeal) {
      return (
        <EmptyState
          title="无法申诉"
          message="只有被拒绝的理赔才能提交申诉"
          icon="alert-circle"
          buttonText="返回详情"
          onButtonPress={() => navigation.navigate(ROUTES.CLAIMS.DETAIL, { id })}
        />
      );
    }

    return (
      <Formik
        initialValues={{
          reason: '',
          additional_information: '',
          agree_terms: false,
        }}
        validationSchema={validationSchema}
        onSubmit={showConfirmDialog}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Banner
              visible={true}
              icon={({ size }) => <Icon name="information" size={size} color={colors.info} />}
              style={styles.banner}
            >
              申诉提交后，我们将重新审核您的理赔请求。请提供充分的理由和更多的证据支持您的申诉。
            </Banner>

            <Card style={styles.rejectionCard}>
              <Card.Title title="拒绝理由" />
              <Card.Content>
                <Text style={styles.rejectionReason}>
                  {claim.rejection_reason || '未提供拒绝理由'}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.formCard}>
              <Card.Title title="申诉信息" />
              <Card.Content>
                <TextInput
                  label="申诉原因 *"
                  value={values.reason}
                  onChangeText={handleChange('reason')}
                  onBlur={handleBlur('reason')}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  error={!!errors.reason && touched.reason}
                  placeholder="请详细说明您不同意理赔拒绝的原因"
                />
                {errors.reason && touched.reason && (
                  <HelperText type="error">{errors.reason}</HelperText>
                )}

                <TextInput
                  label="补充信息（可选）"
                  value={values.additional_information}
                  onChangeText={handleChange('additional_information')}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  placeholder="请提供任何能支持您申诉的额外信息"
                />

                <List.Item
                  title="上传支持文档"
                  description="您可以在理赔详情页面的文档标签上传申诉相关文档"
                  left={props => <List.Icon {...props} icon="file-document-outline" />}
                  onPress={() => navigation.navigate(ROUTES.CLAIMS.DOCUMENTS, { id, claim })}
                  style={styles.uploadItem}
                />

                <Divider style={styles.divider} />

                <View style={styles.checkboxContainer}>
                  <RadioButton.Item
                    value="agree_terms"
                    label="我已阅读并同意申诉须知"
                    status={values.agree_terms ? 'checked' : 'unchecked'}
                    onPress={async () => {
                      await setFieldValue('agree_terms', !values.agree_terms);
                    }}
                    position="leading"
                    style={{ backgroundColor: 'transparent' }}
                    labelStyle={{ color: colors.textSecondary }}
                  />
                </View>
                {errors.agree_terms && touched.agree_terms && (
                  <HelperText type="error">{errors.agree_terms}</HelperText>
                )}
              </Card.Content>
            </Card>

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                请注意：如果您的申诉未提供足够的证据或理由，可能会被再次拒绝。一个理赔最多允许申诉两次。
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              style={styles.submitButton}
              disabled={appealClaimMutation.isPending}
            >
              提交申诉
            </Button>
          </View>
        )}
      </Formik>
    );
  };

  if (isLoading) {
    return <Loading loading={true} message="加载理赔信息..." />;
  }

  if (error || !claim) {
    return (
      <EmptyState
        title="加载失败"
        message="无法加载理赔数据，请稍后重试"
        icon="alert-circle"
        buttonText="重试"
        onButtonPress={refetch}
      />
    );
  }

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="理赔申诉"
        showBackButton={true}
        onBackPress={handleBack}
      />

      <ScrollView style={styles.scrollContent}>
        {renderAppealForm()}
      </ScrollView>

      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={hideConfirmDialog}>
          <Dialog.Title>确认提交申诉</Dialog.Title>
          <Dialog.Content>
            <Text>您确定要提交此申诉吗？</Text>
            <Text style={styles.dialogNote}>
              提交后，您的理赔状态将更改为"申诉中"。我们将重新评估您的理赔请求，这可能需要额外的3-5个工作日。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideConfirmDialog}>取消</Button>
            <Button 
              onPress={confirmAppeal}
              loading={appealClaimMutation.isPending}
              disabled={appealClaimMutation.isPending}
            >
              确认提交
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  formContainer: {
    padding: spacing.medium,
  },
  banner: {
    marginBottom: spacing.medium,
  },
  rejectionCard: {
    marginBottom: spacing.medium,
  },
  rejectionReason: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.error,
  },
  formCard: {
    marginBottom: spacing.medium,
  },
  input: {
    marginBottom: spacing.medium,
    backgroundColor: colors.grey100,
  },
  divider: {
    marginVertical: spacing.medium,
  },
  checkboxContainer: {
    marginBottom: spacing.small,
  },
  checkbox: {
    paddingLeft: 0,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  uploadItem: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  noteContainer: {
    marginBottom: spacing.large,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  submitButton: {
    marginBottom: spacing.large,
  },
  statusCard: {
    margin: spacing.medium,
  },
  statusContent: {
    alignItems: 'center',
    padding: spacing.medium,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: spacing.medium,
  },
  statusDescription: {
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  statusChip: {
    marginTop: spacing.small,
  },
  chipText: {
    color: colors.white,
  },
  cardActions: {
    justifyContent: 'center',
  },
  dialogNote: {
    marginTop: spacing.medium,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ClaimAppealScreen; 