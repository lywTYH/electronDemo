
import { CloudDownloadOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { App, Button, Progress, Space } from 'antd';
import { useCallback, useEffect, useRef } from 'react';

import { DownloadProgress, UpdateInfo, useUpdateStore } from '../../stores/updateStore';
import { formatBytes } from '../../utils';

const CHECK_DELAY = 3000;
export default function UpdateNotification() {
  const hasCheckedOnStartup = useRef(false);
  const startupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { notification } = App.useApp();

  const updateStore = useUpdateStore();

  // 启动时检查更新
  const checkForUpdatesOnStartup = useCallback(async () => {
    try {
      console.log('启动时检查更新...');
      // 标记为启动检查
      updateStore.setIsStartupCheck(true);
      const result = await window.api.updater.checkForUpdates();
      console.log('启动检查更新结果:', result);
    } catch (error) {
      console.error('启动检查更新失败:', error);
      // 静默失败，不打扰用户
      console.warn('Startup update check failed:', error);
      // 重置启动检查标识
      updateStore.setIsStartupCheck(false);
    }
  }, [updateStore]);

  // 下载更新
  const downloadUpdate = useCallback(async () => {
    try {
      console.log('开始下载更新...');
      updateStore.setDownloading(true);

      // 重置隐藏状态，显示新的下载进度
      updateStore.setDownloadNotificationHidden(false);
      // 显示初始下载通知
      const downloadKey = `downloading-${Date.now()}`;
      updateStore.setDownloadNotificationKey(downloadKey);

      notification.info({
        key: downloadKey,
        message: '准备下载更新',
        description: '正在启动下载...',
        icon: <CloudDownloadOutlined style={{ color: '#1890ff' }} />,
        duration: 2
      });

      await window.api.updater.downloadUpdate();
    } catch (error) {
      console.error('下载更新失败:', error);
      updateStore.setDownloading(false);
      updateStore.setDownloadNotificationKey(null);
      updateStore.setDownloadNotificationHidden(false);
      notification.error({
        message: '下载失败',
        description: '更新下载失败，请稍后重试或手动检查更新',
        duration: 5
      });
    }
  }, [notification, updateStore]);

  // 显示更新可用通知
  const showUpdateAvailableNotification = useCallback(
    (info: UpdateInfo) => {
      const key = `update-available-${Date.now()}`;
      console.log('显示更新可用通知:', info);
      notification.info({
        key,
        message: '发现新版本',
        description: (
          <div>
            <p>新版本 {info.version} 已发布</p>
            {info.releaseName && (
              <p style={{ fontSize: '12px', color: '#666' }}>{info.releaseName}</p>
            )}
          </div>
        ),
        icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        duration: 8,
        placement: 'topRight',
        btn: (
          <Space>
            <Button
              size="small"
              onClick={() => {
                notification.destroy(key);
                downloadUpdate();
              }}
            >
              立即下载
            </Button>
            <Button size="small" onClick={() => notification.destroy(key)}>
              稍后提醒
            </Button>
          </Space>
        )
      });
    },
    [downloadUpdate, notification]
  );
  // 更新下载进度通知
  const updateDownloadProgressNotification = useCallback(
    (progress: DownloadProgress) => {
      // 如果用户选择隐藏下载进度通知，就不显示
      if (updateStore.downloadNotificationHidden) {
        return;
      }
      const key = updateStore.downloadNotificationKey || `downloading-${Date.now()}`;

      if (!updateStore.downloadNotificationKey) {
        updateStore.setDownloadNotificationKey(key);
      }
      notification.info({
        key,
        message: '正在下载更新',
        description: (
          <div>
            <Progress
              percent={Math.round(progress.percent)}
              size="small"
              status="active"
              format={() => `${Math.round(progress.percent)}%`}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666',
                marginTop: '8px'
              }}
            >
              <span>
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              </span>
              <span>{formatBytes(progress.bytesPerSecond) + '/s'}</span>
            </div>
          </div>
        ),
        icon: <CloudDownloadOutlined style={{ color: '#1890ff' }} />,
        duration: 0,
        btn: (
          <Button
            size="small"
            onClick={() => {
              notification.destroy(key);
              updateStore.setDownloadNotificationKey(null);
              updateStore.setDownloadNotificationHidden(true);
            }}
          >
            隐藏
          </Button>
        )
      });
    },
    [notification, updateStore]
  );

  // 安装更新
  const installUpdate = useCallback(async () => {
    try {
      console.log('开始安装更新...');
      await window.api.updater.quitAndInstall();
    } catch (error) {
      console.error('安装更新失败:', error);
      notification.error({
        message: '安装失败',
        description: '更新安装失败，请稍后重试',
        duration: 5
      });
    }
  }, [notification]);
  // 显示更新准备就绪通知
  const showUpdateReadyNotification = useCallback(
    (info: UpdateInfo) => {
      const key = `update-ready-${Date.now()}`;

      console.log('显示更新准备就绪通知:', info);

      // 清理下载进度通知
      if (updateStore.downloadNotificationKey) {
        notification.destroy(updateStore.downloadNotificationKey);
        updateStore.setDownloadNotificationKey(null);
      }
      // 重置隐藏状态，下次下载时可以再次显示进度
      updateStore.setDownloadNotificationHidden(false);
      notification.success({
        key,
        message: '更新已下载',
        description: (
          <div>
            <p>新版本 {info.version} 已下载完成</p>
            <p style={{ fontSize: '12px', color: '#666' }}>点击"立即安装"重启应用完成更新</p>
          </div>
        ),
        icon: <DownloadOutlined style={{ color: '#52c41a' }} />,
        duration: 0, // 不自动关闭
        placement: 'topRight',
        btn: (
          <Space>
            <Button
              type="primary"
              size="small"
              danger
              onClick={() => {
                notification.destroy(key);
                installUpdate();
              }}
            >
              立即安装
            </Button>
            <Button size="small" onClick={() => notification.destroy(key)}>
              稍后安装
            </Button>
          </Space>
        )
      });
    },
    [installUpdate, notification, updateStore]
  );

  // 应用启动时自动检查更新（仅执行一次）
  useEffect(() => {
    if (!hasCheckedOnStartup.current) {
      console.log('设置启动检查定时器...');
      startupTimerRef.current = setTimeout(() => {
        console.log('启动检查定时器触发');
        if (!hasCheckedOnStartup.current) {
          hasCheckedOnStartup.current = true;
          checkForUpdatesOnStartup();
        }
        startupTimerRef.current = null;
      }, CHECK_DELAY); // 延迟3秒检查，避免影响应用启动速度
    }

    return () => {
      console.log('清理启动检查定时器');
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
      }
    };
  }, [checkForUpdatesOnStartup]);

  // 设置更新事件监听器（仅执行一次）
  useEffect(() => {
    console.log('UpdateNotification useEffect - 设置监听器');
    // 设置更新事件监听器
    const handleUpdateAvailable = (info: UpdateInfo) => {
      console.log('收到更新可用事件:', info);
      updateStore.handleUpdateAvailable(info);
      // 重置启动检查标识（有更新可用时需要显示通知）
      updateStore.setIsStartupCheck(false);
      showUpdateAvailableNotification(info);
    };
    const handleUpdateNotAvailable = (info: UpdateInfo) => {
      console.log('收到无更新事件:', info);
      updateStore.handleUpdateNotAvailable();
      // 如果是启动检查且已是最新版本，不显示通知
      if (updateStore.isStartupCheck) {
        console.log('启动检查：已是最新版本，不显示通知');
        updateStore.setIsStartupCheck(false); // 重置标识
        return;
      }
      // 手动检查时显示通知
      notification.info({
        message: '当前已是最新版本',
        description: `当前版本: ${info.version || '未知'}`,
        placement: 'topRight',
        duration: 3
      });
    };
    const handleUpdateError = (error: string) => {
      console.error('收到更新错误事件:', error);
      updateStore.handleUpdateError(error);
      // 重置启动检查标识
      updateStore.setIsStartupCheck(false);
      // 静默处理错误，避免过多通知打扰用户
      console.warn('Update check failed:', error);
    };
    const handleDownloadProgress = (progress: DownloadProgress) => {
      console.log('收到下载进度事件:', progress);
      updateStore.handleDownloadProgress(progress);
      updateDownloadProgressNotification(progress);
    };
    const handleUpdateDownloaded = (info: UpdateInfo) => {
      console.log('收到更新下载完成事件:', info);
      updateStore.handleUpdateDownloaded(info);
      showUpdateReadyNotification(info);
    };

    window.api.updater.onUpdateAvailable(handleUpdateAvailable);
    window.api.updater.onUpdateAvailable(handleUpdateNotAvailable);
    window.api.updater.onUpdateError(handleUpdateError);
    window.api.updater.onDownloadProgress(handleDownloadProgress);
    window.api.updater.onUpdateDownloaded(handleUpdateDownloaded);
    return () => {
      console.log('清理更新事件监听器');
      window.api.updater.removeAllUpdateListeners();
    };
  }, [
    notification,
    showUpdateAvailableNotification,
    showUpdateReadyNotification,
    updateDownloadProgressNotification,
    updateStore
  ]);

  // 这个组件不渲染任何可见内容，只处理通知逻辑
  return null;
}
