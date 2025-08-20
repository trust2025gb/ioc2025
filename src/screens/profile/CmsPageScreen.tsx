import React from 'react';
import { Platform, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Container, Header } from '../../components';
import { cmsService } from '../../api/services/cmsService';
import { WebView } from 'react-native-webview';

export default function CmsPageScreen({ route, navigation }: any) {
  const { slug, title } = route.params || { slug: 'about', title: '关于我们' };
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      const page = await cmsService.get(slug);
      setHtml(page?.content || '<p>暂无内容</p>');
    })();
  }, [slug]);

  return (
    <Container safeArea>
      <Header title={title || '详情'} showBackButton onBackPress={() => navigation.goBack()} />
      {Platform.OS === 'web' ? (
        <ScrollView style={{ padding: 16 }}>
          <View>
            {/* 简单渲染 HTML 文本到 Text，不执行脚本 */}
            <Text>{html.replace(/<[^>]+>/g, '')}</Text>
          </View>
        </ScrollView>
      ) : (
        <WebView originWhitelist={["*"]} source={{ html }} />
      )}
    </Container>
  );
} 