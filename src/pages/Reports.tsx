import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Button, Select, Input, DateInput } from '../components/common';
import type { Invoice, Receipt } from '../types';

type TabType = 'overview' | 'aging' | 'cashflow' | 'products' | 'goals';

export function Reports() {
  const { documents, customers } = useApp();
  const { monthlyGoal, setMonthlyGoal } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlyGoal.toString());

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = customEnd ? new Date(customEnd) : now;
        break;
    }
    return { start, end };
  }, [period, customStart, customEnd]);

  // Basic stats
  const stats = useMemo(() => {
    const { start, end } = dateRange;

    const invoices = documents.filter((d) => {
      if (d.type !== 'invoice') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Invoice[];

    const receipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Receipt[];

    const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

    const salesByCustomer = receipts.reduce((acc, r) => {
      acc[r.customerId] = (acc[r.customerId] || 0) + r.total;
      return acc;
    }, {} as Record<string, number>);

    const monthlySales = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(new Date().getFullYear(), i, 1);
      const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);
      return receipts
        .filter((r) => {
          const date = new Date(r.issueDate);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + r.total, 0);
    });

    return {
      totalSales,
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      invoiceCount: invoices.length,
      receiptCount: receipts.length,
      salesByCustomer,
      monthlySales,
    };
  }, [documents, dateRange]);

  // Aging analysis
  const agingData = useMemo(() => {
    const today = new Date();
    const unpaidInvoices = documents.filter(
      (d) => d.type === 'invoice' && d.status !== 'paid' && d.status !== 'cancelled'
    ) as Invoice[];

    const aging = {
      current: { count: 0, amount: 0, invoices: [] as Invoice[] },
      days30: { count: 0, amount: 0, invoices: [] as Invoice[] },
      days60: { count: 0, amount: 0, invoices: [] as Invoice[] },
      days90: { count: 0, amount: 0, invoices: [] as Invoice[] },
      over90: { count: 0, amount: 0, invoices: [] as Invoice[] },
    };

    unpaidInvoices.forEach((inv) => {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const unpaidAmount = inv.total - inv.paidAmount;

      if (daysOverdue <= 0) {
        aging.current.count++;
        aging.current.amount += unpaidAmount;
        aging.current.invoices.push(inv);
      } else if (daysOverdue <= 30) {
        aging.days30.count++;
        aging.days30.amount += unpaidAmount;
        aging.days30.invoices.push(inv);
      } else if (daysOverdue <= 60) {
        aging.days60.count++;
        aging.days60.amount += unpaidAmount;
        aging.days60.invoices.push(inv);
      } else if (daysOverdue <= 90) {
        aging.days90.count++;
        aging.days90.amount += unpaidAmount;
        aging.days90.invoices.push(inv);
      } else {
        aging.over90.count++;
        aging.over90.amount += unpaidAmount;
        aging.over90.invoices.push(inv);
      }
    });

    return aging;
  }, [documents]);

  // Cash flow forecast (next 3 months)
  const cashFlowForecast = useMemo(() => {
    const today = new Date();
    const forecast: { month: string; expected: number; received: number }[] = [];

    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
      const monthName = monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

      // Expected: unpaid invoices due in this month
      const expectedInvoices = (documents.filter(
        (d) =>
          d.type === 'invoice' &&
          d.status !== 'paid' &&
          d.status !== 'cancelled' &&
          new Date((d as Invoice).dueDate) >= monthStart &&
          new Date((d as Invoice).dueDate) <= monthEnd
      ) as Invoice[]);

      const expected = expectedInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

      // Received: receipts in this month (for past/current months)
      const receivedReceipts = documents.filter(
        (d) =>
          d.type === 'receipt' &&
          new Date(d.issueDate) >= monthStart &&
          new Date(d.issueDate) <= monthEnd
      );
      const received = receivedReceipts.reduce((sum, r) => sum + r.total, 0);

      forecast.push({ month: monthName, expected, received });
    }

    return forecast;
  }, [documents]);

  // Product/item sales analysis
  const productSales = useMemo(() => {
    const { start, end } = dateRange;
    const salesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    // Analyze items from receipts (confirmed sales)
    const receipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Receipt[];

    receipts.forEach((receipt) => {
      receipt.items.forEach((item) => {
        const key = item.description || 'その他';
        if (!salesMap[key]) {
          salesMap[key] = { name: key, quantity: 0, revenue: 0 };
        }
        salesMap[key].quantity += item.quantity;
        salesMap[key].revenue += item.quantity * item.unitPrice;
      });
    });

    return Object.values(salesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [documents, dateRange]);

  // Goal progress
  const goalProgress = useMemo(() => {
    if (monthlyGoal <= 0) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthReceipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= monthStart && date <= monthEnd;
    });

    const monthSales = monthReceipts.reduce((sum, r) => sum + r.total, 0);
    return Math.min((monthSales / monthlyGoal) * 100, 100);
  }, [documents, monthlyGoal]);

  const thisMonthSales = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return documents
      .filter((d) => {
        if (d.type !== 'receipt') return false;
        const date = new Date(d.issueDate);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, r) => sum + r.total, 0);
  }, [documents]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || '不明';
  };

  const topCustomers = useMemo(() => {
    return Object.entries(stats.salesByCustomer)
      .map(([customerId, amount]) => ({
        customerId,
        name: getCustomerName(customerId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [stats.salesByCustomer, customers]);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxMonthlySales = Math.max(...stats.monthlySales, 1);
  const totalAging = agingData.current.amount + agingData.days30.amount + agingData.days60.amount + agingData.days90.amount + agingData.over90.amount;

  const tabs = [
    { id: 'overview', label: '概要' },
    { id: 'aging', label: '売掛金分析' },
    { id: 'cashflow', label: 'キャッシュフロー' },
    { id: 'products', label: '商品別分析' },
    { id: 'goals', label: '目標管理' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">売上レポート</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">売上状況と各種分析</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Period Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <Select
                  label="期間"
                  options={[
                    { value: 'thisMonth', label: '今月' },
                    { value: 'lastMonth', label: '先月' },
                    { value: 'thisYear', label: '今年' },
                    { value: 'custom', label: 'カスタム' },
                  ]}
                  value={period}
                  onChange={(val) => setPeriod(val as typeof period)}
                />
              </div>
              {period === 'custom' && (
                <>
                  <div className="min-w-[200px]">
                    <DateInput
                      label="開始日"
                      value={customStart}
                      onChange={(value) => setCustomStart(value)}
                    />
                  </div>
                  <div className="min-w-[200px]">
                    <DateInput
                      label="終了日"
                      value={customEnd}
                      onChange={(value) => setCustomEnd(value)}
                    />
                  </div>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {formatDate(dateRange.start)} 〜 {formatDate(dateRange.end)}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">売上（領収書）</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalSales)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.receiptCount}件</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">請求額</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.totalInvoiced)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.invoiceCount}件</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">入金済み</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">未入金</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.totalUnpaid)}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">月別売上（今年）</h2>
              <div className="space-y-3">
                {stats.monthlySales.map((amount, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-gray-500 dark:text-gray-400">{months[index]}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${(amount / maxMonthlySales) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">顧客別売上</h2>
              {topCustomers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-white">{customer.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(customer.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                const csvData = [
                  ['期間', `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`],
                  ['売上合計', stats.totalSales],
                  ['請求額合計', stats.totalInvoiced],
                  ['入金済み', stats.totalPaid],
                  ['未入金', stats.totalUnpaid],
                  [],
                  ['顧客名', '売上'],
                  ...topCustomers.map((c) => [c.name, c.amount]),
                ];
                const csv = csvData.map((row) => row.join(',')).join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `売上レポート_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              CSVでエクスポート
            </Button>
          </div>
        </>
      )}

      {/* Aging Analysis Tab */}
      {activeTab === 'aging' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">売掛金エージング分析</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">未入金請求書を経過日数別に分類し、回収リスクを可視化します</p>

            {/* Aging Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">期限内</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(agingData.current.amount)}</p>
                <p className="text-xs text-green-600">{agingData.current.count}件</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">1-30日</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(agingData.days30.amount)}</p>
                <p className="text-xs text-yellow-600">{agingData.days30.count}件</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-400">31-60日</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(agingData.days60.amount)}</p>
                <p className="text-xs text-orange-600">{agingData.days60.count}件</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">61-90日</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(agingData.days90.amount)}</p>
                <p className="text-xs text-red-600">{agingData.days90.count}件</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">90日超</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(agingData.over90.amount)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{agingData.over90.count}件</p>
              </div>
            </div>

            {/* Aging Bar Chart */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">構成比</p>
              <div className="h-8 flex rounded-lg overflow-hidden">
                {totalAging > 0 ? (
                  <>
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${(agingData.current.amount / totalAging) * 100}%` }}
                      title={`期限内: ${formatCurrency(agingData.current.amount)}`}
                    />
                    <div
                      className="bg-yellow-500 transition-all"
                      style={{ width: `${(agingData.days30.amount / totalAging) * 100}%` }}
                      title={`1-30日: ${formatCurrency(agingData.days30.amount)}`}
                    />
                    <div
                      className="bg-orange-500 transition-all"
                      style={{ width: `${(agingData.days60.amount / totalAging) * 100}%` }}
                      title={`31-60日: ${formatCurrency(agingData.days60.amount)}`}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(agingData.days90.amount / totalAging) * 100}%` }}
                      title={`61-90日: ${formatCurrency(agingData.days90.amount)}`}
                    />
                    <div
                      className="bg-gray-500 transition-all"
                      style={{ width: `${(agingData.over90.amount / totalAging) * 100}%` }}
                      title={`90日超: ${formatCurrency(agingData.over90.amount)}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="font-medium text-gray-700 dark:text-gray-300">未回収合計</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAging)}</span>
            </div>
          </div>
        </>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">キャッシュフロー予測</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">支払期限に基づく今後3ヶ月の入金予測</p>

            <div className="space-y-4">
              {cashFlowForecast.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">{item.month}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">入金予定</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(item.expected)}</p>
                    </div>
                    {index === 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">入金済み</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(item.received)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                今後3ヶ月の入金予定合計: <span className="font-bold">{formatCurrency(cashFlowForecast.reduce((sum, f) => sum + f.expected, 0))}</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Product Sales Tab */}
      {activeTab === 'products' && (
        <>
          {/* Period Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <Select
                  label="期間"
                  options={[
                    { value: 'thisMonth', label: '今月' },
                    { value: 'lastMonth', label: '先月' },
                    { value: 'thisYear', label: '今年' },
                    { value: 'custom', label: 'カスタム' },
                  ]}
                  value={period}
                  onChange={(val) => setPeriod(val as typeof period)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">商品・サービス別売上</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">期間内の領収書に基づく商品別の売上分析</p>

            {productSales.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">データがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">順位</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">商品名</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">数量</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">売上</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productSales.map((item, index) => (
                      <tr key={item.name}>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-medium text-gray-900 dark:text-white">合計</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(productSales.reduce((sum, p) => sum + p.revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">月間売上目標</h2>

            {/* Goal Setting */}
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">目標金額</span>
                {!editingGoal ? (
                  <Button variant="secondary" size="sm" onClick={() => setEditingGoal(true)}>
                    編集
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setMonthlyGoal(parseInt(tempGoal) || 0);
                        setEditingGoal(false);
                      }}
                    >
                      保存
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingGoal(false)}>
                      キャンセル
                    </Button>
                  </div>
                )}
              </div>
              {editingGoal ? (
                <Input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  placeholder="例: 1000000"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthlyGoal > 0 ? formatCurrency(monthlyGoal) : '未設定'}
                </p>
              )}
            </div>

            {/* Progress */}
            {monthlyGoal > 0 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">今月の進捗</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{goalProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        goalProgress >= 100 ? 'bg-green-500' : goalProgress >= 70 ? 'bg-blue-500' : goalProgress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">今月の売上</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(thisMonthSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">目標まで</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {monthlyGoal - thisMonthSales > 0 ? formatCurrency(monthlyGoal - thisMonthSales) : '達成!'}
                    </p>
                  </div>
                </div>

                {goalProgress >= 100 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      目標達成おめでとうございます!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
