/**
 * 合同文档管理页面
 */

import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Alert, Linking, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, Badge, Divider, FAB, List, Menu, ActivityIndicator, Chip, Portal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// 导入组件
import { Container, Header, Loading, EmptyState } from '../../components';

// 导入API服务
import { contractService, Contract, ContractDocument, DocumentType } from '../../api/services/contractService';

// 导入常量
import { ROUTES } from '../../constants/routes';
import { colors, spacing } from '../../theme';
import { ContractsStackParamList } from '../../navigation/types';

/**
 * 合同文档管理页面组件
 */
const ContractDocumentsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<ContractsStackParamList>>();
  const route = useRoute<RouteProp<ContractsStackParamList, typeof ROUTES.CONTRACTS.DOCUMENTS>>();
  const { id, contract } = route.params;
  const queryClient = useQueryClient();
  
  // 状态
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(null);
  const [documentMenuVisible, setDocumentMenuVisible] = useState(false);
  const [uploadMenuVisible, setUploadMenuVisible] = useState(false);
  
  // 获取合同文档
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['contract-documents', id],
    queryFn: () => contractService.getContractDocuments(id),
  });
  
  // 添加文档
  const addDocumentMutation = useMutation({
    mutationFn: ({ document, type, description }: { document: any; type: DocumentType; description?: string }) => 
      contractService.addContractDocument(id, document, type, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', id] });
    },
  });
  
  // 删除文档
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => contractService.deleteContractDocument(id, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', id] });
      setSelectedDocument(null);
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
  
  // 处理上传文档
  const handleUploadDocument = async (type: DocumentType) => {
    try {
      setSelectedDocType(type);
      setUploadingFile(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ],
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        setUploadingFile(false);
        return;
      }

      const file = result.assets[0];
      
      // 询问文档描述
      let description = '';
      
      // 注意：React Native不直接支持提示输入，这里只是示例
      // 实际实现中可能需要使用Modal组件或第三方库
      description = `${type} document - ${file.name}`;
      
      await addDocumentMutation.mutateAsync({
        document: file,
        type,
        description,
      });
      
      setUploadingFile(false);
      setSelectedDocType(null);
    } catch (error) {
      console.error('上传文档失败:', error);
      setUploadingFile(false);
      setSelectedDocType(null);
      Alert.alert('上传失败', '文档上传失败，请重试');
    }
  };
  
  // 处理下载/查看文档
  const handleViewDocument = async (document: ContractDocument) => {
    try {
      setDownloadingIds([...downloadingIds, document.id]);
      
      // 如果文件已经下载，直接打开
      const fileExists = await FileSystem.getInfoAsync(
        FileSystem.documentDirectory + document.name
      );
      
      if (fileExists.exists) {
        await Linking.openURL(fileExists.uri);
        setDownloadingIds(downloadingIds.filter(id => id !== document.id));
        return;
      }
      
      // 下载文件
      const downloadResumable = FileSystem.createDownloadResumable(
        document.file_url,
        FileSystem.documentDirectory + document.name,
        {}
      );
      
      const result = await downloadResumable.downloadAsync();
      const uri = (result as any)?.uri as string;
      
      if (uri) {
        // 检查是否可以分享/查看文件
        const canShare = await Sharing.isAvailableAsync();
        
        if (canShare) {
          await Sharing.shareAsync(uri);
        } else {
          await Linking.openURL(uri);
        }
      }
    } catch (error) {
      console.error('查看文档失败:', error);
      Alert.alert('查看失败', '无法查看文档，请重试');
    } finally {
      setDownloadingIds(downloadingIds.filter(id => id !== document.id));
    }
  };
  
  // 处理文档长按
  const handleDocumentLongPress = (document: ContractDocument) => {
    setSelectedDocument(document);
    setDocumentMenuVisible(true);
  };
  
  // 处理删除文档
  const handleDeleteDocument = () => {
    if (selectedDocument) {
      Alert.alert(
        '删除文档',
        `确定要删除文档 "${selectedDocument.name}" 吗？`,
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => {
              deleteDocumentMutation.mutate(selectedDocument.id);
              setDocumentMenuVisible(false);
            },
          },
        ]
      );
    }
  };
  
  // 获取文档类型图标
  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.CONTRACT:
        return 'file-document-outline';
      case DocumentType.ATTACHMENT:
        return 'paperclip';
      case DocumentType.SIGNATURE:
        return 'draw';
      case DocumentType.RECEIPT:
        return 'receipt';
      case DocumentType.OTHER:
      default:
        return 'file-outline';
    }
  };
  
  // 获取文档类型名称
  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case DocumentType.CONTRACT:
        return '合同文件';
      case DocumentType.ATTACHMENT:
        return '附件';
      case DocumentType.SIGNATURE:
        return '签名文件';
      case DocumentType.RECEIPT:
        return '收据';
      case DocumentType.OTHER:
      default:
        return '其他文件';
    }
  };
  
  // 获取文件类型图标
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return 'file-pdf-box';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'file-word';
    } else if (mimeType.includes('image')) {
      return 'file-image';
    } else if (mimeType.includes('text')) {
      return 'file-document';
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return 'file-excel';
    } else {
      return 'file';
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };
  
  // 渲染文档项
  const renderDocumentItem = ({ item }: { item: ContractDocument }) => {
    const isDownloading = downloadingIds.includes(item.id);
    
    return (
      <Card style={styles.documentCard}>
        <Pressable onPress={() => handleViewDocument(item)} onLongPress={() => handleDocumentLongPress(item)}>
        <Card.Content style={styles.documentContent}>
          <View style={styles.documentIconContainer}>
            <Icon 
              name={getFileTypeIcon(item.mime_type)} 
              size={40} 
              color={colors.primary} 
            />
            <View style={[styles.typeBadge, { backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}>
              <Icon 
                name={getDocumentTypeIcon(item.type)} 
                size={12} 
                color={colors.white} 
              />
            </View>
          </View>
          
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
              {item.name}
            </Text>
            
            <View style={styles.documentMeta}>
              <Text style={styles.documentType}>
                {getDocumentTypeName(item.type)}
              </Text>
              <Text style={styles.documentSize}>
                {formatFileSize(item.file_size)}
              </Text>
            </View>
            
            {item.description && (
              <Text style={styles.documentDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <Text style={styles.documentDate}>
              上传于: {new Date(item.uploaded_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.documentActions}>
            {isDownloading ? (
              <ActivityIndicator size={24} color={colors.primary} />
            ) : (
              <IconButton
                icon="download"
                size={24}
                onPress={() => handleViewDocument(item)}
              />
            )}
          </View>
        </Card.Content>
        </Pressable>
        
        {item.is_signed && (
          <Badge style={styles.signedBadge}>
            已签署
          </Badge>
        )}
      </Card>
    );
  };
  
  if (isLoadingDocuments) {
    return <Loading loading={true} message="加载文档列表..." />;
  }
  
  if (documentsError) {
    return (
      <Container safeArea>
        <EmptyState
          title="加载失败"
          message="无法加载合同文档，请稍后重试"
          icon="alert-circle"
          buttonText="重试"
          onButtonPress={refetchDocuments}
        />
      </Container>
    );
  }
  
  return (
    <Container safeArea paddingHorizontal={0} paddingVertical={0}>
      <Header
        title="合同文档"
        showBackButton={true}
        onBackPress={handleBack}
        rightIcon="dots-vertical"
        onRightIconPress={toggleMenu}
      />
      
      <View style={styles.container}>
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
        
        {/* 文档菜单 */}
        <Menu
          visible={documentMenuVisible}
          onDismiss={() => setDocumentMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.documentMenu}
        >
          <Menu.Item
            onPress={() => {
              setDocumentMenuVisible(false);
              if (selectedDocument) {
                handleViewDocument(selectedDocument);
              }
            }}
            title="查看文档"
            leadingIcon="eye"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setDocumentMenuVisible(false);
              handleDeleteDocument();
            }}
            title="删除文档"
            leadingIcon="delete"
            titleStyle={{ color: colors.error }}
          />
        </Menu>
        
        {/* 合同信息摘要 */}
        <Card style={styles.contractInfoCard}>
          <Card.Content style={styles.contractInfoContent}>
            <View>
              <Text style={styles.contractTitle} numberOfLines={1} ellipsizeMode="tail">
                {contract.title}
              </Text>
              <Text style={styles.contractNumber}>
                合同号: {contract.contract_number}
              </Text>
            </View>
            <Badge style={styles.documentCountBadge}>
              {documents?.length || 0}
            </Badge>
          </Card.Content>
        </Card>
        
        {/* 文档类型过滤器 */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.values(DocumentType).map((type) => (
              <Chip
                key={type}
                mode="outlined"
                selected={selectedDocType === type}
                onPress={() => setSelectedDocType(selectedDocType === type ? null : type)}
                style={styles.filterChip}
                icon={() => <Icon name={getDocumentTypeIcon(type)} size={16} color={colors.grey600} />}
              >
                {getDocumentTypeName(type)}
              </Chip>
            ))}
          </ScrollView>
        </View>
        
        {/* 文档列表 */}
        {documents && documents.length > 0 ? (
          <FlatList
            data={selectedDocType 
              ? documents.filter(doc => doc.type === selectedDocType)
              : documents
            }
            renderItem={renderDocumentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.documentsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            title="暂无文档"
            message="该合同暂无相关文档"
            icon="file-document-outline"
          />
        )}
        
        {/* 上传文档按钮 */}
        {Platform.OS === 'web' ? (
          <>
            <Menu
              visible={uploadMenuVisible}
              onDismiss={() => setUploadMenuVisible(false)}
              anchor={{
                x: Dimensions.get('window').width - 24,
                y: Dimensions.get('window').height - 80,
              } as any}
              style={styles.documentMenu}
            >
              <Menu.Item
                onPress={() => {
                  setUploadMenuVisible(false);
                  handleUploadDocument(DocumentType.CONTRACT);
                }}
                title="上传合同文件"
                leadingIcon="file-document-outline"
              />
              <Menu.Item
                onPress={() => {
                  setUploadMenuVisible(false);
                  handleUploadDocument(DocumentType.ATTACHMENT);
                }}
                title="上传附件"
                leadingIcon="paperclip"
              />
              <Menu.Item
                onPress={() => {
                  setUploadMenuVisible(false);
                  handleUploadDocument(DocumentType.RECEIPT);
                }}
                title="上传收据"
                leadingIcon="receipt"
              />
              <Menu.Item
                onPress={() => {
                  setUploadMenuVisible(false);
                  handleUploadDocument(DocumentType.OTHER);
                }}
                title="上传其他文件"
                leadingIcon="file-outline"
              />
            </Menu>
            <FAB
              icon="upload"
              onPress={() => setUploadMenuVisible((v) => !v)}
              style={styles.fab}
              color={colors.white}
            />
          </>
        ) : (
          <Portal>
            <FAB.Group
              visible={true}
              open={false}
              icon="upload"
              actions={[
                {
                  icon: 'file-document-outline',
                  label: '上传合同文件',
                  onPress: () => handleUploadDocument(DocumentType.CONTRACT),
                },
                {
                  icon: 'paperclip',
                  label: '上传附件',
                  onPress: () => handleUploadDocument(DocumentType.ATTACHMENT),
                },
                {
                  icon: 'receipt',
                  label: '上传收据',
                  onPress: () => handleUploadDocument(DocumentType.RECEIPT),
                },
                {
                  icon: 'file-outline',
                  label: '上传其他文件',
                  onPress: () => handleUploadDocument(DocumentType.OTHER),
                },
              ]}
              onStateChange={() => {}}
              fabStyle={{ backgroundColor: colors.primary }}
            />
          </Portal>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  documentMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
  contractInfoCard: {
    margin: spacing.medium,
  },
  contractInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  documentCountBadge: {
    backgroundColor: colors.primary,
  },
  filterContainer: {
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  filterChip: {
    marginRight: spacing.small,
  },
  documentsList: {
    paddingHorizontal: spacing.medium,
    paddingBottom: 80, // 为FAB留出空间
  },
  documentCard: {
    marginBottom: spacing.medium,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIconContainer: {
    position: 'relative',
    marginRight: spacing.medium,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  documentMeta: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 12,
    color: colors.primary,
    marginRight: spacing.small,
  },
  documentSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  documentDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  documentActions: {
    marginLeft: spacing.small,
  },
  signedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.success,
    color: colors.white,
    fontSize: 10,
  },
});

export default ContractDocumentsScreen; 