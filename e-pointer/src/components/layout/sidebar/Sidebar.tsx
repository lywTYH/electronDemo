import React from 'react';

interface SidebarProps {
  collapsed: boolean;
  // activeTab: ActivityBarTab
  // onSearchOpen: () => void
  // onSettingsOpen: () => void
  // onFindInFolder?: (folderId: string, folderName: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  if (collapsed) {
    return null; // 当折叠时不显示内容
  }

  return <div> sider bar</div>;
};

export default Sidebar;
