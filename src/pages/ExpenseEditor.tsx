import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
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

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
      setName(`${monthStr} 出張経費`);
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
        setRateInfo(`最新レート (${result.date})`);
      } else if (dateType === 'specific' && rateFetchDate !== 'latest') {
        result = await getHistoricalExchangeRate(rateFetchDate, 'CNY', 'JPY');
        setRateInfo(`${rateFetchDate} のレート`);
      } else if (dateType === 'monthly') {
        const today = new Date();
        result = await getMonthlyAverageRate(today.getFullYear(), today.getMonth() + 1, 'CNY', 'JPY');
        setRateInfo(`${result.date} の月平均レート`);
      } else {
        result = await getCachedExchangeRate('latest', 'CNY', 'JPY');
        setRateInfo(`最新レート (${result.date})`);
      }

      setExchangeRate(result.rate);
    } catch (error) {
      setRateError(error instanceof Error ? error.message : '為替レートの取得に失敗しました');
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
    { value: '', label: '未設定' },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? '経費レポート作成' : '経費レポート編集'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            WeChat Pay等の支払いを記録してください
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/expenses')}>
          キャンセル
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="レポート名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 2024/01 出張経費"
          />
          <Select
            label="請求先顧客"
            value={customerId}
            onChange={(value) => setCustomerId(value)}
            options={customerOptions}
          />
        </div>

        {/* Exchange Rate Section */}
        <div className="border-t pt-4 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">為替レート（円/元）</h3>
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
                <span className="flex items-center text-gray-500 dark:text-gray-400">円/元</span>
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
                {isFetchingRate ? '取得中...' : '最新レート取得'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchExchangeRate('monthly')}
                disabled={isFetchingRate}
              >
                今月平均
              </Button>
            </div>
          </div>

          {/* Historical Rate Fetch */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">過去の日付で為替レートを取得</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
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
              >
                この日のレートを取得
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">経費明細</h2>
          <Button variant="secondary" size="sm" onClick={addExpenseRow}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            行を追加
          </Button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>経費明細がありません</p>
            <Button variant="secondary" className="mt-4" onClick={addExpenseRow}>
              最初の経費を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
              <div className="col-span-3">日付</div>
              <div className="col-span-2">金額(RMB)</div>
              <div className="col-span-2">カテゴリ</div>
              <div className="col-span-2">説明</div>
              <div className="col-span-2">スクショ</div>
              <div className="col-span-1"></div>
            </div>

            {/* Expense Rows */}
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="md:col-span-3">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">日付</label>
                  <DateInput
                    value={expense.date}
                    onChange={(value) => updateExpense(expense.id, { date: value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">金額(RMB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={expense.amountRMB || ''}
                      onChange={(e) => updateExpense(expense.id, { amountRMB: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">元</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">カテゴリ</label>
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
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">説明</label>
                  <input
                    type="text"
                    value={expense.description || ''}
                    onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                    placeholder="タクシー、昼食など"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1 block">スクショ</label>
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
                        削除
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[expense.id]?.click()}
                      className="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    >
                      📷 添付
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">経費明細: {expenses.length}件</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">為替レート: {exchangeRate}円/元</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">合計 (RMB)</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totals.totalRMB.toLocaleString()}元
              </p>
            </div>
            <div className="text-3xl text-gray-400">→</div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">合計 (JPY)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totals.totalJPY)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">備考</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="備考があれば入力してください"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button variant="secondary" onClick={() => navigate('/expenses')}>
          キャンセル
        </Button>
        <Button variant="secondary" onClick={() => handleSave('draft')}>
          下書き保存
        </Button>
        <Button onClick={() => handleSave('completed')}>
          確定して保存
        </Button>
      </div>
    </div>
  );
}
