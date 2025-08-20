/**
 * 理赔文档管理页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, Alert, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Text, Button, Card, FAB, Menu, Divider, Portal, Dialog, Chip, ActivityIndicator, IconButton, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { claimService, ClaimDocument, ClaimDocumentType } from '../../api/services/claimService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ClaimsStackParamList } from '../../navigation/types';

/**
 * 理赔文档管理页面组件
 */
const ClaimDocumentsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ClaimsStackParamList>>();
  const route = useRoute<RouteProp<ClaimsStackParamList, typeof ROUTES.CLAIMS.DOCUMENTS>>();
  const { id, claim } = route.params;
  const queryClient = useQueryClient();

  // 状态
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<ClaimDocumentType | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ClaimDocument | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [verifyDialogVisible, setVerifyDialogVisible] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [uploadMenuVisible, setUploadMenuVisible] = useState(false);

  // 获取文档列表
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['claim-documents', id],
    queryFn: () => claimService.getClaimDocuments(id),
  });

  // 添加文档
  const addDocumentMutation = useMutation({
    mutationFn: ({
      file,
      type,
      description,
    }: {
      file: any;
      type: ClaimDocumentType;
      description?: string;
    }) => {
      return claimService.addClaimDocument(id, file, type, description);
    },
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-documents', id] });
      Alert.alert('成功', '文档已添加', [{ text: '确定' }]);
    },
    onError: (error) => {
      console.error('添加文档失败:', error);
      Alert.alert('失败', '添加文档失败，请重试', [{ text: '确定' }]);
    },
    onSettled: () => {
      setActionInProgress(false);
    },
  });

  // 删除文档
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => claimService.deleteClaimDocument(id, documentId),
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-documents', id] });
      setDeleteDialogVisible(false);
      setSelectedDocument(null);
      Alert.alert('成功', '文档已删除', [{ text: '确定' }]);
    },
    onError: (error) => {
      console.error('删除文档失败:', error);
      Alert.alert('失败', '删除文档失败，请重试', [{ text: '确定' }]);
    },
    onSettled: () => {
      setActionInProgress(false);
    },
  });

  // 验证文档
  const verifyDocumentMutation = useMutation({
    mutationFn: ({ documentId, notes }: { documentId: string; notes?: string }) => {
      return claimService.verifyClaimDocument(id, documentId, notes);
    },
    onMutate: () => {
      setActionInProgress(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-documents', id] });
      setVerifyDialogVisible(false);
      setSelectedDocument(null);
      setVerifyNotes('');
      Alert.alert('成功', '文档已验证', [{ text: '确定' }]);
    },
    onError: (error) => {
      console.error('验证文档失败:', error);
      Alert.alert('失败', '验证文档失败，请重试', [{ text: '确定' }]);
    },
    onSettled: () => {
      setActionInProgress(false);
    },
  });

  // 处理返回
  const handleBack = () => {
    navigation.goBack();
  };

  // 显示/隐藏菜单
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 处理FAB状态改变
  const onStateChange = ({ open }: { open: boolean }) => {
    setFabOpen(open);
  };

  // 处理选择文件
  const handlePickDocument = async (type: ClaimDocumentType) => {
    setFabOpen(false);
    setSelectedDocumentType(type);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // 检查文件大小是否超过限制
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (fileInfo.exists && fileInfo.size > 10 * 1024 * 1024) { // 超过10MB
          Alert.alert('错误', '文件大小不能超过10MB', [{ text: '确定' }]);
          return;
        }

        // 生成FormData并上传
        const fileToUpload = {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name || 'document',
        };

        addDocumentMutation.mutate({
          file: fileToUpload,
          type,
        });
      }
    } catch (error) {
      console.error('选择文档出错:', error);
      Alert.alert('错误', '无法选择文档', [{ text: '确定' }]);
    }
  };

  // 处理选择图片
  const handlePickImage = async (type: ClaimDocumentType) => {
    setFabOpen(false);
    setSelectedDocumentType(type);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要访问相册权限', [{ text: '确定' }]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // 检查文件大小
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 10 * 1024 * 1024) { // 超过10MB
          Alert.alert('错误', '图片大小不能超过10MB', [{ text: '确定' }]);
          return;
        }

        // 生成FormData并上传
        const imageToUpload = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${new Date().getTime()}.jpg`,
        };

        addDocumentMutation.mutate({
          file: imageToUpload,
          type,
        });
      }
    } catch (error) {
      console.error('选择图片出错:', error);
      Alert.alert('错误', '无法选择图片', [{ text: '确定' }]);
    }
  };

  // 处理拍照
  const handleTakePhoto = async (type: ClaimDocumentType) => {
    setFabOpen(false);
    setSelectedDocumentType(type);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('权限错误', '需要访问相机权限', [{ text: '确定' }]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // 检查文件大小
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 10 * 1024 * 1024) { // 超过10MB
          Alert.alert('错误', '图片大小不能超过10MB', [{ text: '确定' }]);
          return;
        }

        // 生成FormData并上传
        const imageToUpload = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${new Date().getTime()}.jpg`,
        };

        addDocumentMutation.mutate({
          file: imageToUpload,
          type,
        });
      }
    } catch (error) {
      console.error('拍照出错:', error);
      Alert.alert('错误', '无法拍照', [{ text: '确定' }]);
    }
  };

  // 下载文件
  const downloadFile = async (document: ClaimDocument) => {
    try {
      setFileLoading(true);
      
      // 检查是否可以分享
      const canShare = await Sharing.isAvailableAsync();
      
      if (!canShare) {
        // 如果不能分享，则使用浏览器打开
        await WebBrowser.openBrowserAsync(document.file_url);
        setFileLoading(false);
        return;
      }
      
      // 下载文件到缓存目录
      const fileUri = `${FileSystem.cacheDirectory}${document.name}`;
      const downloadResult = await FileSystem.downloadAsync(
        document.file_url,
        fileUri
      );
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(fileUri, {
          mimeType: document.mime_type,
          UTI: document.mime_type === 'application/pdf' ? 'com.adobe.pdf' : undefined,
        });
      } else {
        Alert.alert('错误', '无法下载文件', [{ text: '确定' }]);
      }
    } catch (error) {
      console.error('下载文件出错:', error);
      Alert.alert('错误', '无法下载文件', [{ text: '确定' }]);
    } finally {
      setFileLoading(false);
    }
  };

  // 处理文档操作
  const handleDocumentAction = (document: ClaimDocument, action: 'view' | 'delete' | 'verify') => {
    setSelectedDocument(document);
    
    switch (action) {
      case 'view':
        downloadFile(document);
        break;
      case 'delete':
        setDeleteDialogVisible(true);
        break;
      case 'verify':
        setVerifyDialogVisible(true);
        break;
    }
  };

  // 确认删除文档
  const confirmDeleteDocument = () => {
    if (selectedDocument) {
      deleteDocumentMutation.mutate(selectedDocument.id);
    }
  };

  // 确认验证文档
  const confirmVerifyDocument = () => {
    if (selectedDocument) {
      verifyDocumentMutation.mutate({
        documentId: selectedDocument.id,
        notes: verifyNotes || undefined,
      });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 获取文档类型名称
  const getDocumentTypeName = (type: ClaimDocumentType) => {
    switch (type) {
      case ClaimDocumentType.EVIDENCE:
        return '证据材料';
      case ClaimDocumentType.MEDICAL_REPORT:
        return '医疗报告';
      case ClaimDocumentType.POLICE_REPORT:
        return '警方报告';
      case ClaimDocumentType.RECEIPT:
        return '收据/发票';
      case ClaimDocumentType.PHOTO:
        return '照片';
      case ClaimDocumentType.ASSESSMENT:
        return '评估报告';
      case ClaimDocumentType.IDENTIFICATION:
        return '身份证明';
      case ClaimDocumentType.OTHER:
        return '其他';
      default:
        return '未知';
    }
  };

  // 获取文档类型图标
  const getDocumentTypeIcon = (type: ClaimDocumentType) => {
    switch (type) {
      case ClaimDocumentType.EVIDENCE:
        return 'file-document-outline';
      case ClaimDocumentType.MEDICAL_REPORT:
        return 'medical-bag';
      case ClaimDocumentType.POLICE_REPORT:
        return 'police-badge-outline';
      case ClaimDocumentType.RECEIPT:
        return 'receipt';
      case ClaimDocumentType.PHOTO:
        return 'image-outline';
      case ClaimDocumentType.ASSESSMENT:
        return 'clipboard-text-outline';
      case ClaimDocumentType.IDENTIFICATION:
        return 'card-account-details-outline';
      case ClaimDocumentType.OTHER:
        return 'file-outline';
      default:
        return 'file-outline';
    }
  };

  // 获取文件类型图标
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('image')) {
      return 'file-image-outline';
    } else if (mimeType.includes('pdf')) {
      return 'file-pdf-box-outline';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'file-word-outline';
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return 'file-excel-outline';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return 'file-powerpoint-outline';
    } else if (mimeType.includes('text') || mimeType.includes('txt')) {
      return 'file-document-outline';
    } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return 'file-zip-outline';
    } else {
      return 'file-outline';
    }
  };

  // 获取文档状态图标颜色
  const getVerificationStatusColor = (isVerified: boolean) => {
    return isVerified ? colors.success : colors.warning;
  };

  // 渲染文档项
  const renderDocumentItem = ({ item }: { item: ClaimDocument }) => (
    <Card style={styles.documentCard}>
      <Card.Content>
        <View style={styles.documentHeader}>
          <View style={styles.documentIconContainer}>
            <Icon name={getFileTypeIcon(item.mime_type)} size={24} color={colors.primary} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
              {item.name}
            </Text>
            <Text style={styles.documentSize}>
              {formatFileSize(item.file_size)}
            </Text>
          </View>
          <View style={styles.documentStatusContainer}>
            <Icon 
              name={item.is_verified ? 'check-circle' : 'clock-outline'} 
              size={16} 
              color={getVerificationStatusColor(item.is_verified)}
            />
            <Text style={[styles.documentStatus, { color: getVerificationStatusColor(item.is_verified) }]}>
              {item.is_verified ? '已验证' : '待验证'}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.documentDetails}>
          <Chip
            style={styles.typeChip}
            icon={() => <Icon name={getDocumentTypeIcon(item.type)} size={16} color={colors.primary} />}
            mode="outlined"
          >
            {getDocumentTypeName(item.type)}
          </Chip>
          <Text style={styles.uploadDate}>
            上传于 {new Date(item.uploaded_at).toLocaleDateString()}
          </Text>
        </View>

        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>描述:</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}

        {item.is_verified && item.verification_notes && (
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationLabel}>验证备注:</Text>
            <Text style={styles.verificationNotes}>{item.verification_notes}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Button
            mode="text"
            icon="eye"
            onPress={() => handleDocumentAction(item, 'view')}
            loading={fileLoading && selectedDocument?.id === item.id}
            disabled={fileLoading}
          >
            查看
          </Button>
          {!item.is_verified && (
            <Button
              mode="text"
              icon="check-circle-outline"
              onPress={() => handleDocumentAction(item, 'verify')}
            >
              验证
            </Button>
          )}
          <Button
            mode="text"
            icon="delete-outline"
            onPress={() => handleDocumentAction(item, 'delete')}
            disabled={actionInProgress}
            textColor={colors.error}
          >
            删除
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="理赔文档"
        showBackButton={true}
        onBackPress={handleBack}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />

      {/* 菜单 */}
      <Menu
        visible={menuVisible}
        onDismiss={toggleMenu}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            toggleMenu();
            refetchDocuments();
          }}
          title="刷新列表"
          leadingIcon="refresh"
        />
      </Menu>

      {/* 文档列表 */}
      {isLoadingDocuments ? (
        <Loading loading={true} message="加载文档中..." />
      ) : documentsError ? (
        <EmptyState
          title="加载失败"
          message="无法加载理赔文档，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchDocuments}
        />
      ) : documents && documents.length > 0 ? (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
          onRefresh={refetchDocuments}
          refreshing={isLoadingDocuments}
        />
      ) : (
        <EmptyState
          title="暂无文档"
          message="该理赔尚未上传任何文档"
          icon="file-document-outline"
        />
      )}

      {/* FAB按钮组 */}
      {Platform.OS === 'web' ? (
        <>
          <Menu
            visible={uploadMenuVisible}
            onDismiss={() => setUploadMenuVisible(false)}
            anchor={{
              x: Dimensions.get('window').width - 24,
              y: Dimensions.get('window').height - 80,
            } as any}
          >
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handlePickDocument(ClaimDocumentType.EVIDENCE);
              }}
              title="选择文件"
              leadingIcon="file-plus"
            />
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handlePickImage(ClaimDocumentType.PHOTO);
              }}
              title="选择图片"
              leadingIcon="image-plus"
            />
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handleTakePhoto(ClaimDocumentType.PHOTO);
              }}
              title="拍照"
              leadingIcon="camera-plus"
            />
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handlePickDocument(ClaimDocumentType.MEDICAL_REPORT);
              }}
              title="医疗报告"
              leadingIcon="medical-bag"
            />
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handlePickDocument(ClaimDocumentType.POLICE_REPORT);
              }}
              title="警方报告"
              leadingIcon="police-badge"
            />
            <Menu.Item
              onPress={() => {
                setUploadMenuVisible(false);
                handlePickDocument(ClaimDocumentType.RECEIPT);
              }}
              title="收据/发票"
              leadingIcon="receipt"
            />
          </Menu>
          <FAB
            icon="plus"
            onPress={() => setUploadMenuVisible((v) => !v)}
            style={styles.fab}
            color={colors.white}
          />
        </>
      ) : (
        <Portal>
          <FAB.Group
            visible={true}
            open={fabOpen}
            icon={fabOpen ? 'close' : 'plus'}
            actions={[
              {
                icon: 'file-plus',
                label: '选择文件',
                onPress: () => handlePickDocument(ClaimDocumentType.EVIDENCE),
                style: { backgroundColor: colors.grey300 },
              },
              {
                icon: 'image-plus',
                label: '选择图片',
                onPress: () => handlePickImage(ClaimDocumentType.PHOTO),
                style: { backgroundColor: colors.grey300 },
              },
              {
                icon: 'camera-plus',
                label: '拍照',
                onPress: () => handleTakePhoto(ClaimDocumentType.PHOTO),
                style: { backgroundColor: colors.grey300 },
              },
              {
                icon: 'medical-bag',
                label: '医疗报告',
                onPress: () => handlePickDocument(ClaimDocumentType.MEDICAL_REPORT),
                style: { backgroundColor: colors.grey300 },
              },
              {
                icon: 'police-badge',
                label: '警方报告',
                onPress: () => handlePickDocument(ClaimDocumentType.POLICE_REPORT),
                style: { backgroundColor: colors.grey300 },
              },
              {
                icon: 'receipt',
                label: '收据/发票',
                onPress: () => handlePickDocument(ClaimDocumentType.RECEIPT),
                style: { backgroundColor: colors.grey300 },
              },
            ]}
            onStateChange={onStateChange}
            fabStyle={{ backgroundColor: colors.primary }}
          />
        </Portal>
      )}

      {/* 删除确认对话框 */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>删除文档</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除此文档吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>取消</Button>
            <Button 
              onPress={confirmDeleteDocument} 
              disabled={actionInProgress}
              loading={actionInProgress}
              textColor={colors.error}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 验证对话框 */}
      <Portal>
        <Dialog visible={verifyDialogVisible} onDismiss={() => setVerifyDialogVisible(false)}>
          <Dialog.Title>验证文档</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>确认该文档已被验证为有效。可选择添加验证备注：</Text>
            <TextInput
              value={verifyNotes}
              onChangeText={setVerifyNotes}
              style={styles.verifyInput}
              placeholder="验证备注（可选）"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVerifyDialogVisible(false)}>取消</Button>
            <Button 
              onPress={confirmVerifyDocument} 
              disabled={actionInProgress}
              loading={actionInProgress}
            >
              验证
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Container>
  );
};

const styles = StyleSheet.create({
  documentsList: {
    padding: spacing.medium,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
  documentCard: {
    marginBottom: spacing.medium,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  documentIconContainer: {
    backgroundColor: colors.grey100,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  documentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentStatus: {
    fontSize: 12,
    marginLeft: 4,
  },
  divider: {
    marginVertical: spacing.small,
  },
  documentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  typeChip: {
    height: 28,
  },
  uploadDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  descriptionContainer: {
    marginBottom: spacing.small,
    backgroundColor: colors.grey100,
    borderRadius: 4,
    padding: spacing.small,
  },
  descriptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
  verificationContainer: {
    marginBottom: spacing.small,
    backgroundColor: colors.successLight,
    borderRadius: 4,
    padding: spacing.small,
  },
  verificationLabel: {
    fontSize: 12,
    color: colors.success,
    marginBottom: 2,
  },
  verificationNotes: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.small,
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dialogText: {
    marginBottom: spacing.medium,
  },
  verifyInput: {
    backgroundColor: colors.grey100,
    borderRadius: 4,
    marginTop: spacing.small,
  },
});

export default ClaimDocumentsScreen; 