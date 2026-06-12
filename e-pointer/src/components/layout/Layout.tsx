import { Drawer, Layout as AntLayout } from 'antd';
import { useCallback } from 'react';

import ActivityBar, { ActivityBarTab } from './ActivityBar';
import TabsArea from './tabs/TabsArea'
import TitleBar from './TitleBar';
// eslint-disable-next-line import-x/no-unresolved
import { useUIStore } from '../../stores/uiStore';
import { useNarrowScreen } from '../../utils/hooks';

const { Sider, Content } = AntLayout;

export default function Layout() {
  const { sidebarCollapsed, sidebarWidth, activeTab, toggleSidebar, setActiveTab } = useUIStore();
  const isNarrowScreen = useNarrowScreen();

  const handleActivityTabChange = useCallback(
    (tab: ActivityBarTab) => {
      //  如果点击的是当前已激活的标签;
      if (tab === activeTab) {
        // 如果侧边栏是展开状态，则切换为收起
        if (!sidebarCollapsed) {
          toggleSidebar();
        }
        // 如果已经是收起状态，则展开（复用下面的逻辑）
        else {
          toggleSidebar();
        }
      } else {
        // 点击的是不同的标签
        setActiveTab(tab);
        // 如果侧边栏折叠，自动展开
        if (sidebarCollapsed) {
          toggleSidebar();
        }
      }
    },
    [activeTab, setActiveTab, sidebarCollapsed, toggleSidebar]
  );

  return (
    <div className="w-lvw h-lvh overflow-hidden flex flex-col ">
      <TitleBar title="AI聊天助手" />
      <AntLayout className="app-main-layout">
        <Sider width={64} collapsedWidth={64} theme="light" className="app-activity-bar">
          <ActivityBar activeTab={activeTab} onTabChange={handleActivityTabChange} />
        </Sider>
        {/* 窄屏模式：使用 Drawer */}
        {isNarrowScreen ? (
          <Drawer
            placement="left"
            open={!sidebarCollapsed}
            onClose={toggleSidebar}
            size={sidebarWidth}
            styles={{ body: { padding: 0 } }}
            mask={{
              closable: true
            }}
            closable={false}
          >
            Drawer content
            {/* <Sidebar
              collapsed={false}
              activeTab={activeTab}
              onSearchOpen={handleSearchOpen}
              onSettingsOpen={handleSearchOpen}
              onFindInFolder={handleFindInFolder}
            /> */}
          </Drawer>
        ) : (
          /* 宽屏模式：使用 Sider */
          <Sider
            width={sidebarWidth}
            collapsedWidth={0}
            collapsed={sidebarCollapsed}
            theme="light"
            className="app-sider"
            style={{ position: 'relative' }}
          >
            Sider contetn
            {/* <Sidebar
              collapsed={sidebarCollapsed}
              activeTab={activeTab}
              onSearchOpen={handleSearchOpen}
              onSettingsOpen={handleSearchOpen}
              onFindInFolder={handleFindInFolder}
            />
            <ResizeHandle /> */}
          </Sider>
        )}

        <Content className="app-content">
          <TabsArea />
        </Content>
      </AntLayout>
      {/* <GlobalSearch visible={searchOpen} onClose={handleCloseSearch} /> */}
    </div>
  );
}
