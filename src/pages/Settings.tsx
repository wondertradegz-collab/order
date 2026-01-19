import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Select } from '../components/common';
import { ItemSetEditor } from '../components/settings';
import { ManualModal } from '../components/layout/ManualModal';
import type { Language } from '../i18n';
import {
  downloadBackup,
  readBackupFile,
  restoreBackup,
  getBackupStats,
  getAutoBackupSettings,
  saveAutoBackupSettings,
  sendBackupEmail,
  getBackupDownloadUrl,
  generateGmailLink,
  type BackupData,
  type AutoBackupSettings,
} from '../utils/backup';
import type { CompanyInfo, ElectronicStamp, DocumentTemplate } from '../types';

// Stamp Preview Component
const StampPreview = ({ stamp }: { stamp: Omit<ElectronicStamp, 'id' | 'createdAt'> }) => {
  const today = new Date();
  const dateStr = `${today.getFullYear().toString().slice(2)}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  const baseStyle: React.CSSProperties = {
    width: `${stamp.size}px`,
    height: `${stamp.size}px`,
    border: `2px solid ${stamp.color}`,
    color: stamp.color,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${stamp.size / 4}px`,
    fontWeight: 'bold',
    lineHeight: 1.2,
    backgroundColor: 'white',
  };

  if (stamp.shape === 'circle') {
    baseStyle.borderRadius = '50%';
  } else {
    baseStyle.borderRadius = '4px';
  }

  return (
    <div style={baseStyle}>
      <span style={{ fontSize: `${stamp.size / 3}px` }}>{stamp.text || '印'}</span>
      {stamp.showDate && (
        <span style={{ fontSize: `${stamp.size / 5}px` }}>{dateStr}</span>
      )}
    </div>
  );
};

// Password Settings Section Component
const PasswordSettingsSection = () => {
  const { changePassword, logout } = useAuth();
  const { language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const labels = {
    title: language === 'ja' ? 'パスワード設定' : language === 'zh' ? '密码设置' : 'Password Settings',
    subtitle: language === 'ja' ? 'ログインパスワードを変更します' : language === 'zh' ? '更改登录密码' : 'Change your login password',
    currentPassword: language === 'ja' ? '現在のパスワード' : language === 'zh' ? '当前密码' : 'Current Password',
    newPassword: language === 'ja' ? '新しいパスワード' : language === 'zh' ? '新密码' : 'New Password',
    confirmNewPassword: language === 'ja' ? '新しいパスワード（確認）' : language === 'zh' ? '确认新密码' : 'Confirm New Password',
    enterCurrentPassword: language === 'ja' ? '現在のパスワードを入力' : language === 'zh' ? '输入当前密码' : 'Enter current password',
    enterNewPassword: language === 'ja' ? '新しいパスワードを入力' : language === 'zh' ? '输入新密码' : 'Enter new password',
    reenterNewPassword: language === 'ja' ? '新しいパスワードを再入力' : language === 'zh' ? '重新输入新密码' : 'Re-enter new password',
    minChars: language === 'ja' ? '4文字以上で設定してください' : language === 'zh' ? '请设置4位以上字符' : 'Must be at least 4 characters',
    changePassword: language === 'ja' ? 'パスワードを変更' : language === 'zh' ? '更改密码' : 'Change Password',
    logout: language === 'ja' ? 'ログアウト' : language === 'zh' ? '退出登录' : 'Logout',
    errorEnterCurrent: language === 'ja' ? '現在のパスワードを入力してください' : language === 'zh' ? '请输入当前密码' : 'Please enter current password',
    errorEnterNew: language === 'ja' ? '新しいパスワードを入力してください' : language === 'zh' ? '请输入新密码' : 'Please enter new password',
    errorMinChars: language === 'ja' ? 'パスワードは4文字以上で設定してください' : language === 'zh' ? '密码至少4位字符' : 'Password must be at least 4 characters',
    errorNoMatch: language === 'ja' ? '新しいパスワードが一致しません' : language === 'zh' ? '新密码不匹配' : 'New passwords do not match',
    successChanged: language === 'ja' ? 'パスワードを変更しました' : language === 'zh' ? '密码已更改' : 'Password changed successfully',
    errorWrongPassword: language === 'ja' ? '現在のパスワードが正しくありません' : language === 'zh' ? '当前密码不正确' : 'Current password is incorrect',
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'error', text: labels.errorEnterCurrent });
      return;
    }

    if (!newPassword) {
      setMessage({ type: 'error', text: labels.errorEnterNew });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: labels.errorMinChars });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: labels.errorNoMatch });
      return;
    }

    const success = changePassword(currentPassword, newPassword);
    if (success) {
      setMessage({ type: 'success', text: labels.successChanged });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: labels.errorWrongPassword });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.subtitle}</p>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        <Input
          type="password"
          label={labels.currentPassword}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={labels.enterCurrentPassword}
        />
        <Input
          type="password"
          label={labels.newPassword}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={labels.enterNewPassword}
          helperText={labels.minChars}
        />
        <Input
          type="password"
          label={labels.confirmNewPassword}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={labels.reenterNewPassword}
        />

        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="min-h-[44px] w-full sm:w-auto">{labels.changePassword}</Button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t dark:border-gray-600">
        <Button variant="secondary" onClick={logout} className="min-h-[44px] w-full sm:w-auto">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {labels.logout}
        </Button>
      </div>
    </div>
  );
};

// Auto Backup Section Component
const AutoBackupSection = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<AutoBackupSettings>(getAutoBackupSettings);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const labels = {
    title: language === 'ja' ? '自動バックアップ' : language === 'zh' ? '自动备份' : 'Auto Backup',
    subtitle: language === 'ja' ? '毎月自動でバックアップを取得し、Gmailに送信します' : language === 'zh' ? '每月自动备份并发送到Gmail' : 'Automatically backup monthly and send to Gmail',
    enableMonthly: language === 'ja' ? '月次自動バックアップを有効にする' : language === 'zh' ? '启用月度自动备份' : 'Enable monthly auto backup',
    enableDescription: language === 'ja' ? 'アプリ起動時に前回から1ヶ月経過していれば自動でバックアップを送信' : language === 'zh' ? '应用启动时如果距上次超过1个月则自动发送备份' : 'Auto send backup if 1 month has passed since last backup',
    emailAddress: language === 'ja' ? '送信先メールアドレス' : language === 'zh' ? '发送邮箱地址' : 'Email Address',
    emailHelper: language === 'ja' ? 'バックアップファイルの送信先' : language === 'zh' ? '备份文件发送目标' : 'Destination for backup files',
    lastBackup: language === 'ja' ? '最終バックアップ' : language === 'zh' ? '上次备份' : 'Last Backup',
    advancedSettings: language === 'ja' ? '詳細設定（EmailJS）' : language === 'zh' ? '高级设置（EmailJS）' : 'Advanced Settings (EmailJS)',
    emailjsInfo: language === 'ja' ? 'EmailJS を使用すると完全自動でメール送信できます' : language === 'zh' ? '使用EmailJS可以完全自动发送邮件' : 'Use EmailJS for fully automatic email sending',
    emailjsSteps: language === 'ja'
      ? ['EmailJS で無料アカウントを作成', 'Gmail サービスを追加', 'テンプレートを作成（変数: to_email, backup_date, backup_data）', '以下にIDを入力']
      : language === 'zh'
      ? ['在EmailJS创建免费账户', '添加Gmail服务', '创建模板（变量: to_email, backup_date, backup_data）', '在下方输入ID']
      : ['Create free account at EmailJS', 'Add Gmail service', 'Create template (variables: to_email, backup_date, backup_data)', 'Enter IDs below'],
    saveSettings: language === 'ja' ? '設定を保存' : language === 'zh' ? '保存设置' : 'Save Settings',
    sendNow: language === 'ja' ? '今すぐバックアップを送信' : language === 'zh' ? '立即发送备份' : 'Send Backup Now',
    sending: language === 'ja' ? '送信中...' : language === 'zh' ? '发送中...' : 'Sending...',
    savedSuccess: language === 'ja' ? '自動バックアップ設定を保存しました' : language === 'zh' ? '自动备份设置已保存' : 'Auto backup settings saved',
    enterEmail: language === 'ja' ? 'メールアドレスを入力してください' : language === 'zh' ? '请输入邮箱地址' : 'Please enter email address',
    downloadedInfo: language === 'ja' ? 'バックアップファイルをダウンロードしました。Gmailでファイルを添付して送信してください。' : language === 'zh' ? '备份文件已下载。请在Gmail中附加文件发送。' : 'Backup file downloaded. Please attach and send via Gmail.',
  };

  const handleSave = () => {
    saveAutoBackupSettings(settings);
    setMessage({ type: 'success', text: labels.savedSuccess });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSendNow = async () => {
    if (!settings.email) {
      setMessage({ type: 'error', text: labels.enterEmail });
      return;
    }

    if (settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
      // EmailJS経由で送信
      setIsSending(true);
      try {
        const result = await sendBackupEmail();
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
          setSettings(getAutoBackupSettings());
        }
      } finally {
        setIsSending(false);
      }
    } else {
      // Gmail経由で送信
      handleSendViaGmail();
    }
  };

  const handleSendViaGmail = () => {
    if (!settings.email) {
      setMessage({ type: 'error', text: labels.enterEmail });
      return;
    }

    const { url, filename } = getBackupDownloadUrl();

    // ファイルをダウンロード
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
      const updated = { ...settings, lastBackupDate: new Date().toISOString() };
      setSettings(updated);
      saveAutoBackupSettings(updated);

      setMessage({ type: 'info', text: labels.downloadedInfo });
    }, 500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {labels.subtitle}
      </p>

      <div className="space-y-4">
        {/* 有効/無効 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{labels.enableMonthly}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{labels.enableDescription}</p>
          </div>
        </label>

        {/* メールアドレス */}
        <Input
          label={labels.emailAddress}
          type="email"
          value={settings.email}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          placeholder="example@gmail.com"
          helperText={labels.emailHelper}
        />

        {/* 最終バックアップ日時 */}
        {settings.lastBackupDate && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {labels.lastBackup}: {new Date(settings.lastBackupDate).toLocaleString(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US')}
            </p>
          </div>
        )}

        {/* 詳細設定（EmailJS） */}
        <div className="border-t pt-4 dark:border-gray-600">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {labels.advancedSettings}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  <strong>{labels.emailjsInfo}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  1. <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline">EmailJS</a> {labels.emailjsSteps[0]}
                  <br />
                  2. {labels.emailjsSteps[1]}
                  <br />
                  3. {labels.emailjsSteps[2]}
                  <br />
                  4. {labels.emailjsSteps[3]}
                </p>
              </div>

              <Input
                label="Service ID"
                value={settings.emailjsServiceId}
                onChange={(e) => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                placeholder="service_xxxxxxx"
              />
              <Input
                label="Template ID"
                value={settings.emailjsTemplateId}
                onChange={(e) => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                placeholder="template_xxxxxxx"
              />
              <Input
                label="Public Key"
                value={settings.emailjsPublicKey}
                onChange={(e) => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                placeholder="xxxxxxxxxxxxxx"
              />
            </div>
          )}
        </div>

        {/* メッセージ */}
        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
            message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} className="min-h-[44px] w-full sm:w-auto">
            {labels.saveSettings}
          </Button>
          <Button variant="secondary" onClick={handleSendNow} disabled={isSending || !settings.email} className="min-h-[44px] w-full sm:w-auto">
            {isSending ? (
              <>
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {labels.sending}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {labels.sendNow}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Data Management Section Component
const DataManagementSection = () => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const labels = {
    title: language === 'ja' ? 'データ管理' : language === 'zh' ? '数据管理' : 'Data Management',
    dataInfo: language === 'ja' ? 'データについて' : language === 'zh' ? '关于数据' : 'About Data',
    createBackup: language === 'ja' ? 'バックアップを作成' : language === 'zh' ? '创建备份' : 'Create Backup',
    restoreBackup: language === 'ja' ? 'バックアップから復元' : language === 'zh' ? '从备份恢复' : 'Restore from Backup',
    backupContents: language === 'ja' ? 'バックアップの内容' : language === 'zh' ? '备份内容' : 'Backup Contents',
    customers: language === 'ja' ? '顧客' : language === 'zh' ? '客户' : 'Customers',
    documents: language === 'ja' ? '書類' : language === 'zh' ? '文档' : 'Documents',
    products: language === 'ja' ? '商品' : language === 'zh' ? '商品' : 'Products',
    expenseReports: language === 'ja' ? '経費レポート' : language === 'zh' ? '费用报告' : 'Expense Reports',
    createdAt: language === 'ja' ? '作成日時' : language === 'zh' ? '创建时间' : 'Created At',
    restoreWarning: language === 'ja' ? '復元すると現在のデータは上書きされます。この操作は取り消せません。' : language === 'zh' ? '恢复将覆盖当前数据。此操作无法撤销。' : 'Restoring will overwrite current data. This cannot be undone.',
    restoreThis: language === 'ja' ? 'このバックアップを復元' : language === 'zh' ? '恢复此备份' : 'Restore This Backup',
    restoring: language === 'ja' ? '復元中...' : language === 'zh' ? '恢复中...' : 'Restoring...',
    readError: language === 'ja' ? 'ファイルの読み込みに失敗しました' : language === 'zh' ? '读取文件失败' : 'Failed to read file',
    restoreError: language === 'ja' ? '復元に失敗しました' : language === 'zh' ? '恢复失败' : 'Restore failed',
  };

  const handleExport = () => {
    downloadBackup();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    try {
      const backup = await readBackupFile(file);
      setBackupPreview(backup);
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : labels.readError);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestore = () => {
    if (!backupPreview) return;

    setIsRestoring(true);
    try {
      restoreBackup(backupPreview);
      window.location.reload();
    } catch {
      setRestoreError(labels.restoreError);
      setIsRestoring(false);
    }
  };

  const stats = backupPreview ? getBackupStats(backupPreview) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.title}</h2>
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">{labels.dataInfo}</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {t('settings.dataWarning')}
          </p>
        </div>

        {/* Export/Import Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={handleExport} className="min-h-[44px] w-full sm:w-auto">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {labels.createBackup}
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {labels.restoreBackup}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {restoreError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{restoreError}</p>
          </div>
        )}

        {/* Backup Preview */}
        {backupPreview && stats && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{labels.backupContents}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.customers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{labels.customers}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.documents}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{labels.documents}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.products}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{labels.products}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expenseReports}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{labels.expenseReports}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {labels.createdAt}: {new Date(stats.exportedAt).toLocaleString(language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US')}
            </p>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {labels.restoreWarning}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleRestore} disabled={isRestoring} className="min-h-[44px] w-full sm:w-auto">
                {isRestoring ? labels.restoring : labels.restoreThis}
              </Button>
              <Button variant="secondary" onClick={() => setBackupPreview(null)} className="min-h-[44px] w-full sm:w-auto">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// App Settings Section (Language, Theme, Manual)
const AppSettingsSection = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isManualOpen, setIsManualOpen] = useState(false);

  const labels = {
    title: language === 'ja' ? 'アプリ設定' : language === 'zh' ? '应用设置' : 'App Settings',
    languageLabel: language === 'ja' ? '言語 / Language' : language === 'zh' ? '语言 / Language' : 'Language',
    displayMode: language === 'ja' ? '表示モード' : language === 'zh' ? '显示模式' : 'Display Mode',
    darkMode: language === 'ja' ? 'ダークモード' : language === 'zh' ? '深色模式' : 'Dark Mode',
    lightMode: language === 'ja' ? 'ライトモード' : language === 'zh' ? '浅色模式' : 'Light Mode',
    help: language === 'ja' ? 'ヘルプ' : language === 'zh' ? '帮助' : 'Help',
    openManual: language === 'ja' ? '操作マニュアルを開く' : language === 'zh' ? '打开操作手册' : 'Open User Manual',
  };

  const languages: { value: Language; label: string }[] = [
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.title}</h2>
        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {labels.languageLabel}
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`px-4 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
                    language === lang.value
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {labels.displayMode}
              </div>
            </label>
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-between w-full max-w-xs px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isDarkMode ? labels.darkMode : labels.lightMode}
              </span>
              <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-5' : ''}`} />
              </div>
            </button>
          </div>

          {/* Manual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {labels.help}
              </div>
            </label>
            <Button variant="secondary" onClick={() => setIsManualOpen(true)} className="min-h-[44px] w-full sm:w-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {labels.openManual}
            </Button>
          </div>
        </div>
      </div>
      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </>
  );
};

export function Settings() {
  const { settings, updateSettings, addStamp, updateStamp, deleteStamp, templates, deleteTemplate } = useApp();
  const { documentTheme, setDocumentTheme } = useTheme();
  const { t, language } = useLanguage();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(settings.companyInfo);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate);
  const [prefixes, setPrefixes] = useState(settings.documentNumberPrefix);
  const [useYearPrefix, setUseYearPrefix] = useState(settings.useYearPrefix ?? false);
  const [yearPrefixFormat, setYearPrefixFormat] = useState<'full' | 'short'>(settings.yearPrefixFormat ?? 'full');
  const [saved, setSaved] = useState(false);

  // Stamp editor state
  const [editingStamp, setEditingStamp] = useState<Partial<ElectronicStamp> | null>(null);
  const [newStamp, setNewStamp] = useState<Omit<ElectronicStamp, 'id' | 'createdAt'>>({
    name: '',
    text: '',
    shape: 'circle',
    color: '#FF0000',
    size: 50,
    showDate: true,
  });

  // Labels
  const labels = {
    title: t('settings.title'),
    subtitle: language === 'ja' ? '会社情報や書類の設定を管理します' : language === 'zh' ? '管理公司信息和文档设置' : 'Manage company information and document settings',
    companyInfo: t('settings.companyInfo'),
    companyInfoDesc: language === 'ja' ? '書類に表示される自社の情報を設定します' : language === 'zh' ? '设置显示在文档上的公司信息' : 'Set company information displayed on documents',
    companyLogo: language === 'ja' ? '会社ロゴ' : language === 'zh' ? '公司logo' : 'Company Logo',
    selectLogo: language === 'ja' ? 'ロゴを選択' : language === 'zh' ? '选择logo' : 'Select Logo',
    logoSize: language === 'ja' ? '500KB以下のPNG/JPG' : language === 'zh' ? '500KB以下的PNG/JPG' : 'PNG/JPG under 500KB',
    logoError: language === 'ja' ? 'ロゴファイルは500KB以下にしてください' : language === 'zh' ? 'logo文件请保持在500KB以下' : 'Logo file must be under 500KB',
    companyName: language === 'ja' ? '会社名 / 屋号' : language === 'zh' ? '公司名称' : 'Company Name',
    companyNamePlaceholder: language === 'ja' ? '株式会社サンプル' : language === 'zh' ? '示例有限公司' : 'Sample Inc.',
    bankInfo: t('settings.bankInfo'),
    bankInfoDesc: language === 'ja' ? '請求書に表示される振込先を設定します' : language === 'zh' ? '设置显示在发票上的银行信息' : 'Set bank information displayed on invoices',
    documentSettings: language === 'ja' ? '書類設定' : language === 'zh' ? '文档设置' : 'Document Settings',
    defaultTaxRate: t('settings.defaultTaxRate'),
    standardRate: language === 'ja' ? '標準税率' : language === 'zh' ? '标准税率' : 'Standard Rate',
    reducedRate: language === 'ja' ? '軽減税率' : language === 'zh' ? '减税率' : 'Reduced Rate',
    taxFree: language === 'ja' ? '非課税' : language === 'zh' ? '免税' : 'Tax Free',
    quotationPrefix: language === 'ja' ? '見積書番号プレフィックス' : language === 'zh' ? '报价单编号前缀' : 'Quotation No. Prefix',
    invoicePrefix: language === 'ja' ? '請求書番号プレフィックス' : language === 'zh' ? '发票编号前缀' : 'Invoice No. Prefix',
    receiptPrefix: language === 'ja' ? '領収書番号プレフィックス' : language === 'zh' ? '收据编号前缀' : 'Receipt No. Prefix',
    yearPrefix: language === 'ja' ? '書類番号に年度プレフィックスを付ける' : language === 'zh' ? '文档编号添加年份前缀' : 'Add year prefix to document numbers',
    yearFormat: language === 'ja' ? '年度形式' : language === 'zh' ? '年份格式' : 'Year Format',
    yearFull: language === 'ja' ? '4桁 (例: 2026)' : language === 'zh' ? '4位 (例: 2026)' : '4 digits (e.g. 2026)',
    yearShort: language === 'ja' ? '2桁 (例: 26)' : language === 'zh' ? '2位 (例: 26)' : '2 digits (e.g. 26)',
    nextNumbers: language === 'ja' ? '次の書類番号' : language === 'zh' ? '下一个文档编号' : 'Next document numbers',
    documentDesign: language === 'ja' ? '書類デザイン' : language === 'zh' ? '文档设计' : 'Document Design',
    documentDesignDesc: language === 'ja' ? '書類のカラーテーマ、フォント、レイアウトをカスタマイズします' : language === 'zh' ? '自定义文档的配色、字体和布局' : 'Customize document color theme, fonts, and layout',
    colorTheme: language === 'ja' ? 'カラーテーマ' : language === 'zh' ? '配色主题' : 'Color Theme',
    custom: language === 'ja' ? 'カスタム' : language === 'zh' ? '自定义' : 'Custom',
    font: language === 'ja' ? 'フォント' : language === 'zh' ? '字体' : 'Font',
    logoPosition: language === 'ja' ? 'ロゴ位置' : language === 'zh' ? 'logo位置' : 'Logo Position',
    left: language === 'ja' ? '左側' : language === 'zh' ? '左侧' : 'Left',
    right: language === 'ja' ? '右側' : language === 'zh' ? '右侧' : 'Right',
    preview: t('common.preview'),
    stamps: t('settings.stamps'),
    stampsDesc: language === 'ja' ? '書類に押印する電子印を作成・管理します' : language === 'zh' ? '创建和管理文档上的电子印章' : 'Create and manage electronic stamps for documents',
    registeredStamps: language === 'ja' ? '登録済みの電子印' : language === 'zh' ? '已注册的电子印章' : 'Registered Stamps',
    editStamp: language === 'ja' ? '電子印を編集' : language === 'zh' ? '编辑电子印章' : 'Edit Stamp',
    createStamp: language === 'ja' ? '新しい電子印を作成' : language === 'zh' ? '创建新电子印章' : 'Create New Stamp',
    stampName: language === 'ja' ? '印鑑名（管理用）' : language === 'zh' ? '印章名称（管理用）' : 'Stamp Name (for management)',
    stampNamePlaceholder: language === 'ja' ? '例：承認印' : language === 'zh' ? '例：审批章' : 'e.g. Approval',
    displayText: language === 'ja' ? '表示テキスト' : language === 'zh' ? '显示文字' : 'Display Text',
    displayTextPlaceholder: language === 'ja' ? '例：田中' : language === 'zh' ? '例：田中' : 'e.g. Tanaka',
    displayTextHelper: language === 'ja' ? '印鑑に表示される文字（1〜3文字推奨）' : language === 'zh' ? '显示在印章上的文字（建议1-3个字符）' : 'Text displayed on stamp (1-3 characters recommended)',
    shape: language === 'ja' ? '形状' : language === 'zh' ? '形状' : 'Shape',
    circle: language === 'ja' ? '丸型' : language === 'zh' ? '圆形' : 'Circle',
    square: language === 'ja' ? '角型' : language === 'zh' ? '方形' : 'Square',
    color: language === 'ja' ? '色' : language === 'zh' ? '颜色' : 'Color',
    size: language === 'ja' ? 'サイズ' : language === 'zh' ? '大小' : 'Size',
    showDate: language === 'ja' ? '日付を表示する' : language === 'zh' ? '显示日期' : 'Show Date',
    addStamp: language === 'ja' ? '電子印を追加' : language === 'zh' ? '添加电子印章' : 'Add Stamp',
    enterNameAndText: language === 'ja' ? '印鑑名と表示テキストを入力してください' : language === 'zh' ? '请输入印章名称和显示文字' : 'Please enter stamp name and display text',
    templates: t('settings.templates'),
    templatesDesc: language === 'ja' ? 'よく使う明細セットをテンプレートとして保存・管理します' : language === 'zh' ? '将常用明细集保存为模板进行管理' : 'Save and manage frequently used item sets as templates',
    noTemplates: language === 'ja' ? 'テンプレートがありません。書類作成画面から「テンプレートとして保存」で登録できます。' : language === 'zh' ? '没有模板。可以从文档创建页面"保存为模板"来注册。' : 'No templates. Register via "Save as Template" from document creation.',
    deleteTemplateConfirm: language === 'ja' ? 'を削除しますか？' : language === 'zh' ? '确定要删除吗？' : 'Delete this?',
    items: language === 'ja' ? '件の明細' : language === 'zh' ? '条明细' : ' items',
    saved: language === 'ja' ? '保存しました' : language === 'zh' ? '已保存' : 'Saved',
    reset: language === 'ja' ? 'リセット' : language === 'zh' ? '重置' : 'Reset',
  };

  // Color presets with localized names
  const colorPresets = [
    { color: '#000000', name: language === 'ja' ? 'ブラック' : language === 'zh' ? '黑色' : 'Black' },
    { color: '#1e40af', name: language === 'ja' ? 'ブルー' : language === 'zh' ? '蓝色' : 'Blue' },
    { color: '#047857', name: language === 'ja' ? 'グリーン' : language === 'zh' ? '绿色' : 'Green' },
    { color: '#b91c1c', name: language === 'ja' ? 'レッド' : language === 'zh' ? '红色' : 'Red' },
    { color: '#7c3aed', name: language === 'ja' ? 'パープル' : language === 'zh' ? '紫色' : 'Purple' },
    { color: '#c2410c', name: language === 'ja' ? 'オレンジ' : language === 'zh' ? '橙色' : 'Orange' },
  ];

  // Font presets with localized names
  const fontPresets = [
    { value: 'default', name: language === 'ja' ? 'デフォルト' : language === 'zh' ? '默认' : 'Default', sample: 'あいうえお ABC 123' },
    { value: 'gothic', name: language === 'ja' ? 'ゴシック体' : language === 'zh' ? '黑体' : 'Gothic', sample: 'あいうえお ABC 123' },
    { value: 'mincho', name: language === 'ja' ? '明朝体' : language === 'zh' ? '明朝体' : 'Mincho', sample: 'あいうえお ABC 123' },
    { value: 'maru', name: language === 'ja' ? '丸ゴシック' : language === 'zh' ? '圆体' : 'Rounded', sample: 'あいうえお ABC 123' },
  ];

  // Sync form state with settings when settings change
  useEffect(() => {
    setCompanyInfo(settings.companyInfo);
    setDefaultTaxRate(settings.defaultTaxRate);
    setPrefixes(settings.documentNumberPrefix);
    setUseYearPrefix(settings.useYearPrefix ?? false);
    setYearPrefixFormat(settings.yearPrefixFormat ?? 'full');
  }, [settings]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert(labels.logoError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCompanyInfo({ ...companyInfo, logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings({
      companyInfo,
      defaultTaxRate,
      documentNumberPrefix: prefixes,
      useYearPrefix,
      yearPrefixFormat,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setCompanyInfo(settings.companyInfo);
    setDefaultTaxRate(settings.defaultTaxRate);
    setPrefixes(settings.documentNumberPrefix);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{labels.subtitle}</p>
      </div>

      {/* App Settings (Language, Theme, Manual) */}
      <AppSettingsSection />

      {/* Company Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.companyInfo}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.companyInfoDesc}</p>
        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.companyLogo}</label>
            <div className="flex items-center gap-4">
              {companyInfo.logoUrl ? (
                <div className="relative">
                  <img
                    src={companyInfo.logoUrl}
                    alt="Company logo"
                    className="w-24 h-24 object-contain border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setCompanyInfo({ ...companyInfo, logoUrl: undefined })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-block">
                    {labels.selectLogo}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">{labels.logoSize}</p>
              </div>
            </div>
          </div>
          <Input
            label={labels.companyName}
            value={companyInfo.name}
            onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
            placeholder={labels.companyNamePlaceholder}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('settings.postalCode')}
              value={companyInfo.postalCode || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
              placeholder="123-4567"
            />
            <div className="md:col-span-2">
              <Input
                label={t('settings.address')}
                value={companyInfo.address || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder={language === 'ja' ? '東京都千代田区...' : language === 'zh' ? '东京都千代田区...' : 'Tokyo, Chiyoda-ku...'}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('settings.phone')}
              type="tel"
              value={companyInfo.phone || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
              placeholder="03-1234-5678"
            />
            <Input
              label={t('settings.email')}
              type="email"
              value={companyInfo.email || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
              placeholder="info@example.com"
            />
          </div>
          <Input
            label={t('settings.registrationNumber')}
            value={companyInfo.registrationNumber || ''}
            onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
            placeholder="T1234567890123"
            helperText={language === 'ja' ? '適格請求書発行事業者の登録番号' : language === 'zh' ? '合格发票开具企业的注册号' : 'Qualified invoice issuer registration number'}
          />
        </div>
      </div>

      {/* Bank Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.bankInfo}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.bankInfoDesc}</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('settings.bankName')}
              value={companyInfo.bankName || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, bankName: e.target.value })}
              placeholder={language === 'ja' ? 'サンプル銀行' : language === 'zh' ? '示例银行' : 'Sample Bank'}
            />
            <Input
              label={t('settings.branchName')}
              value={companyInfo.bankBranch || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, bankBranch: e.target.value })}
              placeholder={language === 'ja' ? '東京支店' : language === 'zh' ? '东京分行' : 'Tokyo Branch'}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t('settings.accountType')}
              options={[
                { value: '普通', label: t('accountTypes.savings') },
                { value: '当座', label: t('accountTypes.checking') },
              ]}
              value={companyInfo.accountType || '普通'}
              onChange={(val) => setCompanyInfo({ ...companyInfo, accountType: val })}
            />
            <Input
              label={t('settings.accountNumber')}
              value={companyInfo.accountNumber || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, accountNumber: e.target.value })}
              placeholder="1234567"
            />
            <Input
              label={t('settings.accountHolder')}
              value={companyInfo.accountName || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, accountName: e.target.value })}
              placeholder={language === 'ja' ? 'カ）サンプル' : language === 'zh' ? '示例有限公司' : 'Sample Inc.'}
            />
          </div>
        </div>
      </div>

      {/* Document Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.documentSettings}</h2>
        <div className="space-y-4">
          <Select
            label={labels.defaultTaxRate}
            options={[
              { value: '10', label: `10%（${labels.standardRate}）` },
              { value: '8', label: `8%（${labels.reducedRate}）` },
              { value: '0', label: `0%（${labels.taxFree}）` },
            ]}
            value={defaultTaxRate.toString()}
            onChange={(val) => setDefaultTaxRate(parseInt(val))}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={labels.quotationPrefix}
              value={prefixes.quotation}
              onChange={(e) => setPrefixes({ ...prefixes, quotation: e.target.value })}
              placeholder="Q"
            />
            <Input
              label={labels.invoicePrefix}
              value={prefixes.invoice}
              onChange={(e) => setPrefixes({ ...prefixes, invoice: e.target.value })}
              placeholder="INV"
            />
            <Input
              label={labels.receiptPrefix}
              value={prefixes.receipt}
              onChange={(e) => setPrefixes({ ...prefixes, receipt: e.target.value })}
              placeholder="R"
            />
          </div>
          {/* Year Prefix Settings */}
          <div className="border-t pt-4 mt-4">
            <label className="flex items-center gap-2 text-sm mb-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
                checked={useYearPrefix}
                onChange={(e) => setUseYearPrefix(e.target.checked)}
              />
              {labels.yearPrefix}
            </label>
            {useYearPrefix && (
              <div className="ml-6">
                <Select
                  label={labels.yearFormat}
                  options={[
                    { value: 'full', label: labels.yearFull },
                    { value: 'short', label: labels.yearShort },
                  ]}
                  value={yearPrefixFormat}
                  onChange={(val) => setYearPrefixFormat(val as 'full' | 'short')}
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {labels.nextNumbers}: {t('documents.quotation')} {prefixes.quotation}{useYearPrefix ? `-${yearPrefixFormat === 'short' ? new Date().getFullYear().toString().slice(2) : new Date().getFullYear()}` : ''}-{String(settings.nextNumbers.quotation).padStart(5, '0')} /
            {t('documents.invoice')} {prefixes.invoice}{useYearPrefix ? `-${yearPrefixFormat === 'short' ? new Date().getFullYear().toString().slice(2) : new Date().getFullYear()}` : ''}-{String(settings.nextNumbers.invoice).padStart(5, '0')} /
            {t('documents.receipt')} {prefixes.receipt}{useYearPrefix ? `-${yearPrefixFormat === 'short' ? new Date().getFullYear().toString().slice(2) : new Date().getFullYear()}` : ''}-{String(settings.nextNumbers.receipt).padStart(5, '0')}
          </p>
        </div>
      </div>

      {/* Document Design Customization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.documentDesign}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.documentDesignDesc}</p>

        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.colorTheme}</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setDocumentTheme({ ...documentTheme, primaryColor: preset.color })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    documentTheme.primaryColor === preset.color
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{preset.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">{labels.custom}:</span>
              <input
                type="color"
                value={documentTheme.primaryColor}
                onChange={(e) => setDocumentTheme({ ...documentTheme, primaryColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{documentTheme.primaryColor}</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.font}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {fontPresets.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => setDocumentTheme({ ...documentTheme, fontFamily: font.value })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    documentTheme.fontFamily === font.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{font.name}</p>
                  <p
                    className="text-xs text-gray-500 dark:text-gray-400"
                    style={{
                      fontFamily:
                        font.value === 'gothic'
                          ? '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
                          : font.value === 'mincho'
                          ? '"Hiragino Mincho ProN", "Yu Mincho", serif'
                          : font.value === 'maru'
                          ? '"Hiragino Maru Gothic ProN", "Rounded M+ 1c", sans-serif'
                          : 'inherit',
                    }}
                  >
                    {font.sample}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Logo Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.logoPosition}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="logoPosition"
                  value="left"
                  checked={documentTheme.logoPosition === 'left'}
                  onChange={() => setDocumentTheme({ ...documentTheme, logoPosition: 'left' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{labels.left}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="logoPosition"
                  value="right"
                  checked={documentTheme.logoPosition === 'right'}
                  onChange={() => setDocumentTheme({ ...documentTheme, logoPosition: 'right' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{labels.right}</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t pt-4 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{labels.preview}</p>
            <div className="bg-white border rounded-lg p-4 max-w-md">
              <div className={`flex ${documentTheme.logoPosition === 'right' ? 'flex-row-reverse' : ''} items-start justify-between mb-4`}>
                <div
                  className="w-12 h-12 rounded flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: documentTheme.primaryColor }}
                >
                  LOGO
                </div>
                <div className={documentTheme.logoPosition === 'right' ? 'text-left' : 'text-right'}>
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: documentTheme.primaryColor,
                      fontFamily:
                        documentTheme.fontFamily === 'gothic'
                          ? '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
                          : documentTheme.fontFamily === 'mincho'
                          ? '"Hiragino Mincho ProN", "Yu Mincho", serif'
                          : documentTheme.fontFamily === 'maru'
                          ? '"Hiragino Maru Gothic ProN", "Rounded M+ 1c", sans-serif'
                          : 'inherit',
                    }}
                  >
                    {t('documents.invoice')}
                  </p>
                  <p className="text-xs text-gray-500">No. INV-00001</p>
                </div>
              </div>
              <div
                className="border-t-2 pt-2"
                style={{ borderColor: documentTheme.primaryColor }}
              >
                <p
                  className="text-sm"
                  style={{
                    fontFamily:
                      documentTheme.fontFamily === 'gothic'
                        ? '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
                        : documentTheme.fontFamily === 'mincho'
                        ? '"Hiragino Mincho ProN", "Yu Mincho", serif'
                        : documentTheme.fontFamily === 'maru'
                        ? '"Hiragino Maru Gothic ProN", "Rounded M+ 1c", sans-serif'
                        : 'inherit',
                  }}
                >
                  {language === 'ja' ? '株式会社サンプル 御中' : language === 'zh' ? '示例有限公司' : 'Sample Inc.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Electronic Stamps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.stamps}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.stampsDesc}</p>

        {/* Existing Stamps */}
        {(settings.stamps || []).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{labels.registeredStamps}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(settings.stamps || []).map((stamp) => (
                <div key={stamp.id} className="border rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <StampPreview stamp={stamp} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{stamp.name}</p>
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => setEditingStamp(stamp)}
                    >
                      {t('common.edit')}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800"
                      onClick={() => {
                        if (confirm(`${stamp.name} ${labels.deleteTemplateConfirm}`)) {
                          deleteStamp(stamp.id);
                        }
                      }}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stamp Editor Form */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {editingStamp ? labels.editStamp : labels.createStamp}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label={labels.stampName}
                value={editingStamp ? editingStamp.name || '' : newStamp.name}
                onChange={(e) => {
                  if (editingStamp) {
                    setEditingStamp({ ...editingStamp, name: e.target.value });
                  } else {
                    setNewStamp({ ...newStamp, name: e.target.value });
                  }
                }}
                placeholder={labels.stampNamePlaceholder}
              />
              <Input
                label={labels.displayText}
                value={editingStamp ? editingStamp.text || '' : newStamp.text}
                onChange={(e) => {
                  if (editingStamp) {
                    setEditingStamp({ ...editingStamp, text: e.target.value });
                  } else {
                    setNewStamp({ ...newStamp, text: e.target.value });
                  }
                }}
                placeholder={labels.displayTextPlaceholder}
                helperText={labels.displayTextHelper}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={labels.shape}
                  options={[
                    { value: 'circle', label: labels.circle },
                    { value: 'square', label: labels.square },
                  ]}
                  value={editingStamp ? editingStamp.shape || 'circle' : newStamp.shape}
                  onChange={(val) => {
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, shape: val as 'circle' | 'square' });
                    } else {
                      setNewStamp({ ...newStamp, shape: val as 'circle' | 'square' });
                    }
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.color}</label>
                  <input
                    type="color"
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    value={editingStamp ? editingStamp.color || '#FF0000' : newStamp.color}
                    onChange={(e) => {
                      if (editingStamp) {
                        setEditingStamp({ ...editingStamp, color: e.target.value });
                      } else {
                        setNewStamp({ ...newStamp, color: e.target.value });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {labels.size}: {editingStamp ? editingStamp.size || 50 : newStamp.size}px
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  className="w-full"
                  value={editingStamp ? editingStamp.size || 50 : newStamp.size}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, size });
                    } else {
                      setNewStamp({ ...newStamp, size });
                    }
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={editingStamp ? editingStamp.showDate ?? true : newStamp.showDate}
                  onChange={(e) => {
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, showDate: e.target.checked });
                    } else {
                      setNewStamp({ ...newStamp, showDate: e.target.checked });
                    }
                  }}
                />
                {labels.showDate}
              </label>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">{labels.preview}</p>
              <StampPreview stamp={editingStamp ? {
                name: editingStamp.name || '',
                text: editingStamp.text || '',
                shape: editingStamp.shape || 'circle',
                color: editingStamp.color || '#FF0000',
                size: editingStamp.size || 50,
                showDate: editingStamp.showDate ?? true,
              } : newStamp} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {editingStamp ? (
              <>
                <Button
                  onClick={() => {
                    if (editingStamp.id) {
                      updateStamp(editingStamp.id, editingStamp);
                    }
                    setEditingStamp(null);
                  }}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {t('common.save')}
                </Button>
                <Button variant="secondary" onClick={() => setEditingStamp(null)} className="min-h-[44px] w-full sm:w-auto">
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  if (!newStamp.name || !newStamp.text) {
                    alert(labels.enterNameAndText);
                    return;
                  }
                  addStamp(newStamp);
                  setNewStamp({
                    name: '',
                    text: '',
                    shape: 'circle',
                    color: '#FF0000',
                    size: 50,
                    showDate: true,
                  });
                }}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {labels.addStamp}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Templates Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{labels.templates}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{labels.templatesDesc}</p>

        {templates.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {labels.noTemplates}
          </p>
        ) : (
          <div className="space-y-3">
            {templates.map((template: DocumentTemplate) => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{template.name}</p>
                  <p className="text-sm text-gray-500">
                    {template.type === 'quotation' ? t('documents.quotation') : template.type === 'invoice' ? t('documents.invoice') : t('documents.receipt')}
                    {' '}{template.items.length}{labels.items}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`「${template.name}」${labels.deleteTemplateConfirm}`)) {
                      deleteTemplate(template.id);
                    }
                  }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Sets Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <ItemSetEditor />
      </div>

      {/* Password Settings */}
      <PasswordSettingsSection />

      {/* Auto Backup */}
      <AutoBackupSection />

      {/* Data Management */}
      <DataManagementSection />

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
        {saved && (
          <span className="text-green-600 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {labels.saved}
          </span>
        )}
        <Button variant="secondary" onClick={handleReset} className="min-h-[44px] w-full sm:w-auto">
          {labels.reset}
        </Button>
        <Button onClick={handleSave} className="min-h-[44px] w-full sm:w-auto">
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
