
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useMemo } from 'react';

import UpdateNotification from './components/common/UpdateNotification';
// import Layout from './components/layout/Layout'
import { useSettingsStore } from './stores/settingsStore';
import { ZustandAppProvider } from './stores/ZustandAppProvider';

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
      <AntdApp>
        <UpdateNotification />
        teststs
        {/* <ZustandAppProvider> */}
          {/* <Layout /> */}
        {/* </ZustandAppProvider> */}
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
