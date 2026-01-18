// バックアップ・復元ユーティリティ
import emailjs from '@emailjs/browser';

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    customers: unknown[];
    documents: unknown[];
    products: unknown[];
    paymentRecords: unknown[];
    settings: unknown;
    templates: unknown[];
    itemSets: unknown[];
    expenseReports: unknown[];
    memos: unknown[];
    expenseSplits: unknown[];
  };
}

export interface AutoBackupSettings {
  enabled: boolean;
  email: string;
  lastBackupDate: string | null;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
}

const BACKUP_VERSION = '1.0.0';
const AUTO_BACKUP_KEY = 'invoice-app-auto-backup-settings';

// LocalStorageのキー
const STORAGE_KEYS = {
  customers: 'invoice-app-customers',
  documents: 'invoice-app-documents',
  products: 'invoice-app-products',
  paymentRecords: 'invoice-app-payments',
  settings: 'invoice-app-settings',
  templates: 'invoice-app-templates',
  itemSets: 'invoice-app-itemsets',
  expenseReports: 'invoice-app-expense-reports',
  memos: 'invoice-app-memos',
  expenseSplits: 'invoice-app-expense-splits',
};

// 自動バックアップ設定のデフォルト値
export function getDefaultAutoBackupSettings(): AutoBackupSettings {
  return {
    enabled: false,
    email: '',
    lastBackupDate: null,
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
  };
}

// 自動バックアップ設定を取得
export function getAutoBackupSettings(): AutoBackupSettings {
  const stored = localStorage.getItem(AUTO_BACKUP_KEY);
  if (!stored) return getDefaultAutoBackupSettings();
  try {
    return { ...getDefaultAutoBackupSettings(), ...JSON.parse(stored) };
  } catch {
    return getDefaultAutoBackupSettings();
  }
}

// 自動バックアップ設定を保存
export function saveAutoBackupSettings(settings: AutoBackupSettings): void {
  localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(settings));
}

// バックアップデータの作成
export function createBackup(): BackupData {
  const data: BackupData['data'] = {
    customers: JSON.parse(localStorage.getItem(STORAGE_KEYS.customers) || '[]'),
    documents: JSON.parse(localStorage.getItem(STORAGE_KEYS.documents) || '[]'),
    products: JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || '[]'),
    paymentRecords: JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentRecords) || '[]'),
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}'),
    templates: JSON.parse(localStorage.getItem(STORAGE_KEYS.templates) || '[]'),
    itemSets: JSON.parse(localStorage.getItem(STORAGE_KEYS.itemSets) || '[]'),
    expenseReports: JSON.parse(localStorage.getItem(STORAGE_KEYS.expenseReports) || '[]'),
    memos: JSON.parse(localStorage.getItem(STORAGE_KEYS.memos) || '[]'),
    expenseSplits: JSON.parse(localStorage.getItem(STORAGE_KEYS.expenseSplits) || '[]'),
  };

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

// バックアップをJSONファイルとしてダウンロード
export function downloadBackup(): void {
  const backup = createBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `invoice-app-backup-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// バックアップの検証
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;

  const backup = data as BackupData;

  // バージョンチェック
  if (!backup.version || typeof backup.version !== 'string') return false;

  // データの存在チェック
  if (!backup.data || typeof backup.data !== 'object') return false;

  // 必須フィールドのチェック
  const requiredFields = ['customers', 'documents', 'products', 'settings'];
  for (const field of requiredFields) {
    if (!(field in backup.data)) return false;
  }

  return true;
}

// バックアップからの復元
export function restoreBackup(backup: BackupData): void {
  // 各データをLocalStorageに保存
  if (Array.isArray(backup.data.customers)) {
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(backup.data.customers));
  }

  if (Array.isArray(backup.data.documents)) {
    localStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(backup.data.documents));
  }

  if (Array.isArray(backup.data.products)) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(backup.data.products));
  }

  if (Array.isArray(backup.data.paymentRecords)) {
    localStorage.setItem(STORAGE_KEYS.paymentRecords, JSON.stringify(backup.data.paymentRecords));
  }

  if (backup.data.settings && typeof backup.data.settings === 'object') {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(backup.data.settings));
  }

  if (Array.isArray(backup.data.templates)) {
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(backup.data.templates));
  }

  if (Array.isArray(backup.data.itemSets)) {
    localStorage.setItem(STORAGE_KEYS.itemSets, JSON.stringify(backup.data.itemSets));
  }

  if (Array.isArray(backup.data.expenseReports)) {
    localStorage.setItem(STORAGE_KEYS.expenseReports, JSON.stringify(backup.data.expenseReports));
  }

  if (Array.isArray(backup.data.memos)) {
    localStorage.setItem(STORAGE_KEYS.memos, JSON.stringify(backup.data.memos));
  }

  if (Array.isArray(backup.data.expenseSplits)) {
    localStorage.setItem(STORAGE_KEYS.expenseSplits, JSON.stringify(backup.data.expenseSplits));
  }
}

// ファイルからバックアップを読み込み
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!validateBackup(data)) {
          reject(new Error('無効なバックアップファイルです'));
          return;
        }

        resolve(data);
      } catch {
        reject(new Error('バックアップファイルの読み込みに失敗しました'));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file);
  });
}

// バックアップの統計情報を取得
export function getBackupStats(backup: BackupData): {
  customers: number;
  documents: number;
  products: number;
  expenseReports: number;
  exportedAt: string;
} {
  return {
    customers: Array.isArray(backup.data.customers) ? backup.data.customers.length : 0,
    documents: Array.isArray(backup.data.documents) ? backup.data.documents.length : 0,
    products: Array.isArray(backup.data.products) ? backup.data.products.length : 0,
    expenseReports: Array.isArray(backup.data.expenseReports) ? backup.data.expenseReports.length : 0,
    exportedAt: backup.exportedAt,
  };
}

// 月次バックアップが必要かチェック
export function isMonthlyBackupDue(): boolean {
  const settings = getAutoBackupSettings();
  if (!settings.enabled || !settings.email) return false;

  const lastBackup = settings.lastBackupDate;
  if (!lastBackup) return true;

  const lastDate = new Date(lastBackup);
  const now = new Date();

  // 前回のバックアップから1ヶ月以上経過しているかチェック
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return lastDate < oneMonthAgo;
}

// バックアップをメールで送信
export async function sendBackupEmail(): Promise<{ success: boolean; message: string }> {
  const settings = getAutoBackupSettings();

  if (!settings.email) {
    return { success: false, message: 'メールアドレスが設定されていません' };
  }

  if (!settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsPublicKey) {
    return { success: false, message: 'EmailJS の設定が完了していません' };
  }

  try {
    const backup = createBackup();
    const stats = getBackupStats(backup);
    const backupJson = JSON.stringify(backup, null, 2);

    // EmailJS を初期化
    emailjs.init(settings.emailjsPublicKey);

    // メール送信
    await emailjs.send(
      settings.emailjsServiceId,
      settings.emailjsTemplateId,
      {
        to_email: settings.email,
        backup_date: new Date().toLocaleDateString('ja-JP'),
        customers_count: stats.customers,
        documents_count: stats.documents,
        products_count: stats.products,
        expense_reports_count: stats.expenseReports,
        backup_data: backupJson,
      }
    );

    // 最終バックアップ日時を更新
    const updatedSettings = {
      ...settings,
      lastBackupDate: new Date().toISOString(),
    };
    saveAutoBackupSettings(updatedSettings);

    return { success: true, message: 'バックアップをメールで送信しました' };
  } catch (error) {
    console.error('Backup email error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'メール送信に失敗しました',
    };
  }
}

// バックアップをダウンロード用URLとして取得（手動ダウンロード+Gmail用）
export function getBackupDownloadUrl(): { url: string; filename: string } {
  const backup = createBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const filename = `invoice-app-backup-${date}.json`;

  return { url, filename };
}

// Gmail で送信用のリンクを生成
export function generateGmailLink(toEmail: string): string {
  const subject = encodeURIComponent(`[自動バックアップ] 請求書アプリ データバックアップ ${new Date().toLocaleDateString('ja-JP')}`);
  const body = encodeURIComponent(
    `請求書アプリの自動バックアップです。\n\n` +
    `バックアップ日時: ${new Date().toLocaleString('ja-JP')}\n\n` +
    `添付のJSONファイルを保存してください。\n` +
    `復元する場合は、設定画面の「バックアップから復元」で読み込んでください。`
  );

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${subject}&body=${body}`;
}
