import { useMemo } from 'react';

import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import { useSettingsStore } from './stores';

function AppContent(): React.JSX.Element {
  const { settings } = useSettingsStore();
  // 根据字体大小设置获取基础字号
  const fontSize = useMemo(() => {
    switch (settings.fontSize) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  }, [settings.fontSize]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          fontSize: fontSize
        }
      }}
    >
      <AntdApp >
        <div>asdf</div>
        {/* <UpdateNotification />
        <ZustandAppProvider>
          <Layout />
        </ZustandAppProvider> */}
      </AntdApp>
    </ConfigProvider>
  );
}
function App(): React.JSX.Element {
  return (
    <div className="container">
      <AppContent />
    </div>
  );
}

export default App;
