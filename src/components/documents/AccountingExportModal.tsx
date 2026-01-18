import { useState } from 'react';
import { Modal, Button, Badge, DateInput } from '../common';
import { useApp } from '../../contexts/AppContext';
import {
  exportToAccountingSoftware,
  getExportFileName,
  ACCOUNTING_SOFTWARE_INFO,
  type AccountingSoftware,
} from '../../utils/accountingExport';

interface AccountingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountingExportModal({ isOpen, onClose }: AccountingExportModalProps) {
  const { documents, customers } = useApp();
  const [selectedSoftware, setSelectedSoftware] = useState<AccountingSoftware | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [includeReceipts, setIncludeReceipts] = useState(true);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // フィルターされた書類
  const filteredDocuments = documents.filter((doc) => {
    // 書類タイプフィルター
    if (doc.type === 'invoice' && !includeInvoices) return false;
    if (doc.type === 'receipt' && !includeReceipts) return false;
    if (doc.type === 'quotation') return false; // 見積書は対象外

    // 日付フィルター
    if (dateFrom && doc.issueDate < dateFrom) return false;
    if (dateTo && doc.issueDate > dateTo) return false;

    return true;
  });

  const handleExport = () => {
    if (!selectedSoftware) return;

    try {
      const csvContent = exportToAccountingSoftware(
        selectedSoftware,
        filteredDocuments,
        customers
      );

      // BOMを追加してダウンロード
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFileName(selectedSoftware);
      a.click();
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleClose = () => {
    setSelectedSoftware(null);
    setExportStatus('idle');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="会計ソフト連携エクスポート" size="lg">
      <div className="space-y-6">
        {/* 会計ソフト選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            エクスポート先を選択
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(ACCOUNTING_SOFTWARE_INFO) as AccountingSoftware[]).map((key) => {
              const info = ACCOUNTING_SOFTWARE_INFO[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedSoftware(key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedSoftware === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {info.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {info.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 期間フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            対象期間
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]">
              <DateInput
                value={dateFrom}
                onChange={(value) => setDateFrom(value)}
                placeholder="開始日"
              />
            </div>
            <span className="text-gray-400">〜</span>
            <div className="flex-1 min-w-[180px]">
              <DateInput
                value={dateTo}
                onChange={(value) => setDateTo(value)}
                placeholder="終了日"
              />
            </div>
          </div>
        </div>

        {/* 書類タイプ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            対象書類
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInvoices}
                onChange={(e) => setIncludeInvoices(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">請求書</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeReceipts}
                onChange={(e) => setIncludeReceipts(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">領収書</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ※見積書は仕訳対象外のため含まれません
          </p>
        </div>

        {/* エクスポート対象件数 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">エクスポート対象</span>
            <Badge color={filteredDocuments.length > 0 ? 'blue' : 'gray'}>
              {filteredDocuments.length}件
            </Badge>
          </div>
          {filteredDocuments.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              請求書: {filteredDocuments.filter((d) => d.type === 'invoice').length}件 /
              領収書: {filteredDocuments.filter((d) => d.type === 'receipt').length}件
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">インポート時の注意</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>勘定科目が会計ソフトの設定と異なる場合、インポート後に修正が必要な場合があります</li>
                <li>補助科目（取引先名）が未登録の場合、事前に登録してください</li>
                <li>税区分は標準税率(10%)と軽減税率(8%)に対応しています</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ステータスメッセージ */}
        {exportStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">エクスポートが完了しました</span>
          </div>
        )}
        {exportStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">エクスポートに失敗しました</span>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedSoftware || filteredDocuments.length === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSVエクスポート
          </Button>
        </div>
      </div>
    </Modal>
  );
}
