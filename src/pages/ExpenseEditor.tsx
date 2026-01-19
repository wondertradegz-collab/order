import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, getTodayString } from '../utils/format';
import { Card, Button, Input, Select, DateInput } from '../components/common';
import { getCachedExchangeRate, getHistoricalExchangeRate, getMonthlyAverageRate } from '../utils/exchangeRate';
import type { ExpenseItem, ExpenseCategory, ExpenseReportStatus } from '../types';
import { EXPENSE_CATEGORY_LABELS } from '../types';

interface ExpenseEditorProps {
  mode: 'create' | 'edit';
}

export function ExpenseEditor({ mode }: ExpenseEditorProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { customers, addExpenseReport, updateExpenseReport, getExpenseReport } = useApp();

  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [exchangeRate, setExchangeRate] = useState(22.0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ExpenseReportStatus>('draft');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateFetchDate, setRateFetchDate] = useState<string>('latest');
  const [rateInfo, setRateInfo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // 編集モード時にデータを読み込み
  useEffect(() => {
    if (mode === 'edit' && id) {
      const report = getExpenseReport(id);
      if (report) {
        setName(report.name);
        setCustomerId(report.customerId || '');
        setExchangeRate(report.exchangeRate);
        setExpenses(report.expenses);
        setNotes(report.notes || '');
        setStatus(report.status);
      }
    } else {
      // 新規作成時はデフォルト値
      const today = new Date();
      const monthStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}`;
      setName(`${monthStr}`);
      addExpenseRow();
    }
  }, [mode, id, getExpenseReport]);

  // 顧客のデフォルト為替レートを適用
  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer?.defaultExchangeRate) {
        setExchangeRate(customer.defaultExchangeRate);
      }
    }
  }, [customerId, customers]);

  // 為替レート取得関数
  const fetchExchangeRate = async (dateType: 'latest' | 'specific' | 'monthly') => {
    setIsFetchingRate(true);
    setRateError(null);
    setRateInfo(null);

    try {
      let result;

      if (dateType === 'latest') {
        result = await getCachedExchangeRate('latest', 'CNY', 'JPY');
        setRateInfo(`${result.date}`);
      } else if (dateType === 'specific' && rateFetchDate !== 'latest') {
        result = await getHistoricalExchangeRate(rateFetchDate, 'CNY', 'JPY');
        setRateInfo(`${rateFetchDate}`);
      } else if (dateType === 'monthly') {
        const today = new Date();
        result = await getMonthlyAverageRate(today.getFullYear(), today.getMonth() + 1, 'CNY', 'JPY');
        setRateInfo(`${result.date} ${t('expenses.monthlyAverage')}`);
      } else {
        result = await getCachedExchangeRate('latest', 'CNY', 'JPY');
        setRateInfo(`${result.date}`);
      }

      setExchangeRate(result.rate);
    } catch (error) {
      setRateError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsFetchingRate(false);
    }
  };

  const addExpenseRow = () => {
    const newExpense: ExpenseItem = {
      id: uuidv4(),
      date: getTodayString(),
      amountRMB: 0,
      description: '',
      category: 'other',
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const updateExpense = (expenseId: string, updates: Partial<ExpenseItem>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, ...updates } : e))
    );
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const handleScreenshotUpload = (expenseId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateExpense(expenseId, { screenshot: base64 });
    };
    reader.readAsDataURL(file);
  };

  // 複数画像から経費項目を一括作成
  const createExpensesFromImages = useCallback((files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newExpense: ExpenseItem = {
          id: uuidv4(),
          date: getTodayString(),
          amountRMB: 0,
          description: '',
          category: 'other',
          screenshot: base64,
        };
        setExpenses((prev) => [...prev, newExpense]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // ドラッグ＆ドロップハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    createExpensesFromImages(files);
  }, [createExpensesFromImages]);

  // クリップボードからの貼り付け
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        createExpensesFromImages(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [createExpensesFromImages]);

  // 一括ファイル選択ハンドラー
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    createExpensesFromImages(files);
    // 同じファイルを再選択できるようにリセット
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const totals = useMemo(() => {
    const totalRMB = expenses.reduce((sum, e) => sum + (e.amountRMB || 0), 0);
    const totalJPY = Math.round(totalRMB * exchangeRate);
    return { totalRMB, totalJPY };
  }, [expenses, exchangeRate]);

  const handleSave = (newStatus?: ExpenseReportStatus) => {
    const reportData = {
      name,
      customerId: customerId || undefined,
      expenses,
      totalRMB: totals.totalRMB,
      exchangeRate,
      totalJPY: totals.totalJPY,
      status: newStatus || status,
      notes: notes || undefined,
    };

    if (mode === 'edit' && id) {
      updateExpenseReport(id, reportData);
    } else {
      addExpenseReport(reportData);
    }

    navigate('/expenses');
  };

  const customerOptions = [
    { value: '', label: t('common.unknown') },
    ...customers.map((c) => ({
      value: c.id,
      label: c.companyName || c.name,
    })),
  ];

  const categoryOptions = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {mode === 'create' ? t('expenses.createReport') : t('expenses.editReport')}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 truncate">
            {t('expenses.subtitle')}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/expenses')} className="self-start sm:self-auto min-h-[44px] flex-shrink-0">
          {t('common.cancel')}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('expenses.reportName')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label={t('expenses.reportName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            label={t('documents.customer')}
            value={customerId}
            onChange={(value) => setCustomerId(value)}
            options={customerOptions}
          />
        </div>

        {/* Exchange Rate Section */}
        <div className="border-t pt-4 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('expenses.exchangeRate')}</h3>
            {rateInfo && (
              <span className="text-xs text-green-600 dark:text-green-400">{rateInfo}</span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Rate Input */}
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="flex items-center text-gray-500 dark:text-gray-400">{t('expenses.yenPerYuan')}</span>
              </div>
            </div>

            {/* Fetch Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchExchangeRate('latest')}
                disabled={isFetchingRate}
              >
                {isFetchingRate ? t('common.loading') : t('expenses.fetchLatestRate')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchExchangeRate('monthly')}
                disabled={isFetchingRate}
              >
                {t('expenses.monthlyAverage')}
              </Button>
            </div>
          </div>

          {/* Historical Rate Fetch */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('expenses.historicalRateFetch')}</p>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="w-full sm:flex-1">
                <DateInput
                  value={rateFetchDate === 'latest' ? getTodayString() : rateFetchDate}
                  onChange={(value) => setRateFetchDate(value || 'latest')}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchExchangeRate('specific')}
                disabled={isFetchingRate || rateFetchDate === 'latest'}
                className="w-full sm:w-auto min-h-[44px] flex-shrink-0"
              >
                <span className="truncate">{t('expenses.fetchHistoricalRate')}</span>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {rateError && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{rateError}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Expense Items */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('documents.lineItems')}</h2>
          <div className="flex flex-wrap gap-2">
            {/* 一括画像追加ボタン */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={bulkFileInputRef}
              onChange={handleBulkFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bulkFileInputRef.current?.click()}
              className="min-h-[44px]"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('common.import')}
            </Button>
            <Button variant="secondary" size="sm" onClick={addExpenseRow} className="min-h-[44px]">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('expenses.addRow')}
            </Button>
          </div>
        </div>

        {/* ドラッグ＆ドロップエリア */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative mb-4 p-6 border-2 border-dashed rounded-xl transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <div className="text-center">
            <svg className={`mx-auto w-10 h-10 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className={`text-sm ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('common.import')}
            </p>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{t('common.noData')}</p>
            <Button variant="secondary" className="mt-4" onClick={addExpenseRow}>
              {t('expenses.addRow')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
              <div className="col-span-3">{t('common.date')}</div>
              <div className="col-span-2">{t('expenses.amountRMB')}</div>
              <div className="col-span-2">{t('products.category')}</div>
              <div className="col-span-2">{t('common.description')}</div>
              <div className="col-span-2">{t('expenses.screenshot')}</div>
              <div className="col-span-1"></div>
            </div>

            {/* Expense Rows */}
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="md:col-span-3">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('common.date')}</label>
                  <DateInput
                    value={expense.date}
                    onChange={(value) => updateExpense(expense.id, { date: value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('expenses.amountRMB')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={expense.amountRMB || ''}
                      onChange={(e) => updateExpense(expense.id, { amountRMB: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{t('common.yuan')}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('products.category')}</label>
                  <select
                    value={expense.category || 'other'}
                    onChange={(e) => updateExpense(expense.id, { category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('common.description')}</label>
                  <input
                    type="text"
                    value={expense.description || ''}
                    onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('expenses.screenshot')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => { fileInputRefs.current[expense.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleScreenshotUpload(expense.id, file);
                    }}
                    className="hidden"
                  />
                  {expense.screenshot ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={expense.screenshot}
                        alt="Screenshot"
                        className="w-10 h-10 object-cover rounded cursor-pointer"
                        onClick={() => window.open(expense.screenshot, '_blank')}
                      />
                      <button
                        type="button"
                        onClick={() => updateExpense(expense.id, { screenshot: undefined })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[expense.id]?.click()}
                      className="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    >
                      {t('common.add')}
                    </button>
                  )}
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Totals */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 dark:from-orange-900/20 dark:to-green-900/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('documents.lineItems')}: {expenses.length}{t('common.items')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('expenses.exchangeRate')}: {exchangeRate}{t('expenses.yenPerYuan')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('expenses.totalRMB')}</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totals.totalRMB.toLocaleString()}{t('common.yuan')}
              </p>
            </div>
            <div className="hidden sm:block text-3xl text-gray-400">→</div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('expenses.totalJPY')}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totals.totalJPY)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('common.notes')}</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button variant="secondary" onClick={() => navigate('/expenses')} className="w-full sm:w-auto min-h-[44px]">
          {t('common.cancel')}
        </Button>
        <Button variant="secondary" onClick={() => handleSave('draft')} className="w-full sm:w-auto min-h-[44px]">
          {t('status.draft')} {t('common.save')}
        </Button>
        <Button onClick={() => handleSave('completed')} className="w-full sm:w-auto min-h-[44px]">
          {t('common.confirm')} {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
