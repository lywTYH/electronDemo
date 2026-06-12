import {
  MinusOutlined,
  CloseOutlined,
  SendOutlined,
  CopyOutlined,
  BorderOutlined
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classnames from 'classnames';
import { useState, useEffect } from 'react';

interface TitleBarProps {
  title: string;
}

const TitleBar = ({ title }: TitleBarProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const platformInfo = await window.electronWindow.getEnvInfo();
        setIsMac(platformInfo.isMac);
        const maximized = await window.electronWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Error initializing titlebar:', error);
      }
    };
    init();
  }, []);

  const handleMinimize = async () => {
    try {
      window.electronWindow.minimize();
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      await window.electronWindow.maximize();
      const maximized = await window.electronWindow.isMaximized();
      setIsMaximized(maximized);
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  };

  const handleClose = async () => {
    try {
      await window.electronWindow.close();
    } catch (error) {
      console.error('Error closing window:', error);
    }
  };

  const controlBtnClass = classnames(
    '[-webkit-app-region:no-drag] w-12 h-10 flex items-center justify-center',
    'rounded-none text-xs transition-all duration-200',
  );

  return (
    <div className="h-10 bg-neutral-100 border-b border-neutral-200 flex items-center select-none shrink-0 z-1000">
      <div className="w-full h-full flex items-center justify-between [-webkit-app-region:drag]">
        <div className={classnames('flex items-center gap-2', isMac ? 'pl-19.5' : 'pl-2')}>
          <SendOutlined className="text-base px-4" />
          <h2 className="m-0 text-xs font-normal text-neutral-700 leading-none">{title}</h2>
        </div>
        {!isMac && (
          <div className="flex items-center pr-0">
            <Tooltip title="最小化">
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={handleMinimize}
                className={classnames(controlBtnClass, 'hover:bg-neutral-200')}
              />
            </Tooltip>
            <Tooltip title={isMaximized ? '还原' : '最大化'}>
              <Button
                type="text"
                icon={isMaximized ? <CopyOutlined /> : <BorderOutlined />}
                onClick={handleMaximize}
                className={classnames(controlBtnClass, 'hover:bg-neutral-200')}
              />
            </Tooltip>
            <Tooltip title="关闭">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
                className={classnames(controlBtnClass, 'hover:bg-[#e81123] hover:text-white')}
              />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
