// バックアップ・復元ユーティリティ

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
  };
}

const BACKUP_VERSION = '1.0.0';

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
};

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
