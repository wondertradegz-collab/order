import { useState, useEffect, useCallback } from 'react';
import {
  getAutoBackupSettings,
  saveAutoBackupSettings,
  isMonthlyBackupDue,
  sendBackupEmail,
  getBackupDownloadUrl,
  generateGmailLink,
  type AutoBackupSettings,
} from '../utils/backup';

interface BackupNotification {
  show: boolean;
  type: 'info' | 'success' | 'error';
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

export function useAutoBackup() {
  const [settings, setSettings] = useState<AutoBackupSettings>(getAutoBackupSettings);
  const [notification, setNotification] = useState<BackupNotification | null>(null);
  const [isSending, setIsSending] = useState(false);

  // 設定を更新
  const updateSettings = useCallback((newSettings: Partial<AutoBackupSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveAutoBackupSettings(updated);
  }, [settings]);

  // 通知を閉じる
  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // 今すぐバックアップを送信（EmailJS使用）
  const sendBackupNow = useCallback(async () => {
    setIsSending(true);
    try {
      const result = await sendBackupEmail();
      setNotification({
        show: true,
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        // 設定を更新して最新のlastBackupDateを反映
        setSettings(getAutoBackupSettings());
      }
    } finally {
      setIsSending(false);
    }
  }, []);

  // Gmail経由でバックアップを送信（手動添付）
  const sendViaGmail = useCallback(() => {
    const { url, filename } = getBackupDownloadUrl();

    // まずファイルをダウンロード
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Gmailを開く
    setTimeout(() => {
      const gmailUrl = generateGmailLink(settings.email);
      window.open(gmailUrl, '_blank');
      URL.revokeObjectURL(url);

      // 最終バックアップ日時を更新
      updateSettings({ lastBackupDate: new Date().toISOString() });

      setNotification({
        show: true,
        type: 'info',
        message: 'バックアップファイルをダウンロードしました。Gmailでファイルを添付して送信してください。',
      });
    }, 500);
  }, [settings.email, updateSettings]);

  // 月次バックアップチェック
  useEffect(() => {
    if (isMonthlyBackupDue()) {
      // EmailJSが設定されている場合は自動送信、そうでなければ通知
      const currentSettings = getAutoBackupSettings();

      if (currentSettings.emailjsServiceId && currentSettings.emailjsTemplateId && currentSettings.emailjsPublicKey) {
        // EmailJSで自動送信
        sendBackupNow();
      } else {
        // 手動送信を促す通知
        setNotification({
          show: true,
          type: 'info',
          message: '月次バックアップの時期です。バックアップをGmailで送信しますか？',
          actions: [
            { label: 'Gmailで送信', onClick: sendViaGmail },
            { label: '後で', onClick: dismissNotification },
          ],
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    settings,
    updateSettings,
    notification,
    dismissNotification,
    sendBackupNow,
    sendViaGmail,
    isSending,
  };
}
