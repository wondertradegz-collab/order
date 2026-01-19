import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Button, Select, Input, DateInput } from '../components/common';
import type { Invoice, Receipt, LineItem } from '../types';

// カテゴリ別の金額計算ヘルパー
function calculateCategoryTotals(items: LineItem[]) {
  const revenue = items
    .filter((item) => !item.category || item.category === 'revenue')
    .reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = Math.floor(subtotal * (item.taxRate / 100));
      return sum + subtotal + tax;
    }, 0);

  const expenseReimbursement = items
    .filter((item) => item.category === 'expense_reimbursement')
    .reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = Math.floor(subtotal * (item.taxRate / 100));
      return sum + subtotal + tax;
    }, 0);

  const discount = items
    .filter((item) => item.category === 'discount')
    .reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = Math.floor(subtotal * (item.taxRate / 100));
      return sum + subtotal + tax;
    }, 0);

  return {
    revenue,
    expenseReimbursement,
    discount,
    netRevenue: revenue - discount,
    total: revenue + expenseReimbursement - discount,
  };
}

type TabType = 'overview' | 'aging' | 'cashflow' | 'products' | 'goals';

export function Reports() {
  const { documents, customers } = useApp();
  const { monthlyGoal, setMonthlyGoal } = useTheme();
  const { t, language } = useLanguage();
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

    // カテゴリ別に集計（領収書）
    const receiptTotals = receipts.reduce(
      (acc, r) => {
        const categoryTotals = calculateCategoryTotals(r.items);
        acc.revenue += categoryTotals.revenue;
        acc.expenseReimbursement += categoryTotals.expenseReimbursement;
        acc.discount += categoryTotals.discount;
        acc.total += categoryTotals.total;
        return acc;
      },
      { revenue: 0, expenseReimbursement: 0, discount: 0, total: 0 }
    );

    // カテゴリ別に集計（請求書）
    const invoiceTotals = invoices.reduce(
      (acc, inv) => {
        const categoryTotals = calculateCategoryTotals(inv.items);
        acc.revenue += categoryTotals.revenue;
        acc.expenseReimbursement += categoryTotals.expenseReimbursement;
        acc.discount += categoryTotals.discount;
        acc.total += categoryTotals.total;
        return acc;
      },
      { revenue: 0, expenseReimbursement: 0, discount: 0, total: 0 }
    );

    const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

    // 顧客別売上（純売上のみ）
    const salesByCustomer = receipts.reduce((acc, r) => {
      const categoryTotals = calculateCategoryTotals(r.items);
      acc[r.customerId] = (acc[r.customerId] || 0) + categoryTotals.revenue - categoryTotals.discount;
      return acc;
    }, {} as Record<string, number>);

    // 月別売上（カテゴリ別）
    const monthlySales = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(new Date().getFullYear(), i, 1);
      const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);
      const monthReceipts = receipts.filter((r) => {
        const date = new Date(r.issueDate);
        return date >= monthStart && date <= monthEnd;
      });
      return monthReceipts.reduce(
        (acc, r) => {
          const categoryTotals = calculateCategoryTotals(r.items);
          acc.revenue += categoryTotals.revenue - categoryTotals.discount;
          acc.expenseReimbursement += categoryTotals.expenseReimbursement;
          acc.total += categoryTotals.total;
          return acc;
        },
        { revenue: 0, expenseReimbursement: 0, total: 0 }
      );
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
      // カテゴリ別集計
      receiptTotals,
      invoiceTotals,
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
    const locale = language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';

    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
      const monthName = monthStart.toLocaleDateString(locale, { year: 'numeric', month: 'long' });

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
  }, [documents, language]);

  // Product/item sales analysis
  const productSales = useMemo(() => {
    const { start, end } = dateRange;
    const salesMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
    const otherLabel = language === 'ja' ? 'その他' : language === 'zh' ? '其他' : 'Other';

    // Analyze items from receipts (confirmed sales)
    const receipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Receipt[];

    receipts.forEach((receipt) => {
      receipt.items.forEach((item) => {
        const category = item.category || 'revenue';
        const key = `${item.description || otherLabel}__${category}`;
        if (!salesMap[key]) {
          salesMap[key] = { name: item.description || otherLabel, quantity: 0, revenue: 0, category };
        }
        salesMap[key].quantity += item.quantity;
        salesMap[key].revenue += item.quantity * item.unitPrice;
      });
    });

    return Object.values(salesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [documents, dateRange, language]);

  // Goal progress - 純売上のみを使用（立替経費回収は含まない）
  const goalProgress = useMemo(() => {
    if (monthlyGoal <= 0) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthReceipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= monthStart && date <= monthEnd;
    }) as Receipt[];

    // 純売上のみを計算（立替経費回収は含まない）
    const monthPureRevenue = monthReceipts.reduce((sum, r) => {
      const categoryTotals = calculateCategoryTotals(r.items);
      return sum + categoryTotals.revenue - categoryTotals.discount;
    }, 0);

    return Math.min((monthPureRevenue / monthlyGoal) * 100, 100);
  }, [documents, monthlyGoal]);

  // 今月の純売上と立替経費回収を分けて計算
  const thisMonthData = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthReceipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= monthStart && date <= monthEnd;
    }) as Receipt[];

    return monthReceipts.reduce(
      (acc, r) => {
        const categoryTotals = calculateCategoryTotals(r.items);
        acc.pureRevenue += categoryTotals.revenue - categoryTotals.discount;
        acc.expenseReimbursement += categoryTotals.expenseReimbursement;
        acc.total += r.total;
        return acc;
      },
      { pureRevenue: 0, expenseReimbursement: 0, total: 0 }
    );
  }, [documents]);

  // 後方互換性のため
  const thisMonthSales = thisMonthData.pureRevenue;

  const getCustomerName = useCallback((customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || t('common.unknown');
  }, [customers, t]);

  const topCustomers = useMemo(() => {
    return Object.entries(stats.salesByCustomer)
      .map(([customerId, amount]) => ({
        customerId,
        name: getCustomerName(customerId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [stats.salesByCustomer, getCustomerName]);

  const months = language === 'ja'
    ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    : language === 'zh'
    ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxMonthlySales = Math.max(...stats.monthlySales.map((m) => m.total), 1);
  const totalAging = agingData.current.amount + agingData.days30.amount + agingData.days60.amount + agingData.days90.amount + agingData.over90.amount;

  const tabs = [
    { id: 'overview', label: t('reports.overview') },
    { id: 'aging', label: t('reports.aging') },
    { id: 'cashflow', label: t('reports.cashflow') },
    { id: 'products', label: t('reports.productAnalysis') },
    { id: 'goals', label: t('reports.goals') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reports.overview')}</p>
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
                  label={t('reports.period')}
                  options={[
                    { value: 'thisMonth', label: t('reports.thisMonth') },
                    { value: 'lastMonth', label: t('reports.lastMonth') },
                    { value: 'thisYear', label: t('reports.thisYear') },
                    { value: 'custom', label: t('reports.custom') },
                  ]}
                  value={period}
                  onChange={(val) => setPeriod(val as typeof period)}
                />
              </div>
              {period === 'custom' && (
                <>
                  <div className="min-w-[200px]">
                    <DateInput
                      label={t('reports.startDate')}
                      value={customStart}
                      onChange={(value) => setCustomStart(value)}
                    />
                  </div>
                  <div className="min-w-[200px]">
                    <DateInput
                      label={t('reports.endDate')}
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

          {/* Summary Cards - Main */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.pureRevenue')} ({t('documents.receipt')})</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.receiptTotals.revenue - stats.receiptTotals.discount)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.receiptCount}{t('common.items')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.invoiced')}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.invoiceTotals.revenue - stats.invoiceTotals.discount)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.invoiceCount}{t('common.items')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.collected')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.outstanding')}</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.totalUnpaid)}</p>
            </div>
          </div>

          {/* Category Breakdown Cards */}
          {(stats.receiptTotals.expenseReimbursement > 0 || stats.invoiceTotals.expenseReimbursement > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.categoryBreakdown')}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-400">{t('reports.revenue')} ({t('common.tax')})</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.receiptTotals.revenue)}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400">{t('reports.expenseReimbursement')}</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.receiptTotals.expenseReimbursement)}</p>
                </div>
                {stats.receiptTotals.discount > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-400">{t('reports.discount')}</p>
                    <p className="text-lg font-bold text-red-600">-{formatCurrency(stats.receiptTotals.discount)}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-700 dark:text-gray-300">{t('reports.receiptTotal')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {t('reports.pureRevenueNote')}
              </p>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.monthlySalesTrend')}</h2>
              <div className="flex gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('reports.revenue')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('reports.expenseReimbursement')}</span>
                </div>
              </div>
              <div className="space-y-3">
                {stats.monthlySales.map((monthData, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-gray-500 dark:text-gray-400">{months[index]}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                      {/* Revenue bar (green) */}
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(monthData.revenue / maxMonthlySales) * 100}%` }}
                        title={`${t('reports.revenue')}: ${formatCurrency(monthData.revenue)}`}
                      />
                      {/* Expense reimbursement bar (amber) */}
                      {monthData.expenseReimbursement > 0 && (
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${(monthData.expenseReimbursement / maxMonthlySales) * 100}%` }}
                          title={`${t('reports.expenseReimbursement')}: ${formatCurrency(monthData.expenseReimbursement)}`}
                        />
                      )}
                    </div>
                    <span className="w-24 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(monthData.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('documents.customer')} {t('reports.revenue')}</h2>
              {topCustomers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('common.noData')}</p>
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
                  [t('reports.period'), `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`],
                  [],
                  [`■ ${t('reports.categoryBreakdown')} (${t('documents.receipt')})`],
                  [`${t('reports.revenue')} (${t('common.tax')})`, stats.receiptTotals.revenue],
                  [t('reports.expenseReimbursement'), stats.receiptTotals.expenseReimbursement],
                  [t('reports.discount'), stats.receiptTotals.discount],
                  [t('reports.pureRevenue'), stats.receiptTotals.revenue - stats.receiptTotals.discount],
                  [t('reports.receiptTotal'), stats.totalSales],
                  [],
                  [`■ ${t('reports.categoryBreakdown')} (${t('documents.invoice')})`],
                  [`${t('reports.revenue')} (${t('common.tax')})`, stats.invoiceTotals.revenue],
                  [t('reports.expenseReimbursement'), stats.invoiceTotals.expenseReimbursement],
                  [t('reports.discount'), stats.invoiceTotals.discount],
                  [t('reports.invoiced'), stats.invoiceTotals.revenue - stats.invoiceTotals.discount],
                  [`${t('documents.invoice')} ${t('common.total')}`, stats.totalInvoiced],
                  [],
                  [`■ ${t('reports.collected')}`],
                  [t('reports.collected'), stats.totalPaid],
                  [t('reports.outstanding'), stats.totalUnpaid],
                  [],
                  [`■ ${t('documents.customer')} ${t('reports.pureRevenue')}`],
                  [t('customers.customerName'), t('reports.revenue')],
                  ...topCustomers.map((c) => [c.name, c.amount]),
                ];
                const csv = csvData.map((row) => row.join(',')).join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${t('reports.title')}_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t('common.export')} CSV
            </Button>
          </div>
        </>
      )}

      {/* Aging Analysis Tab */}
      {activeTab === 'aging' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.aging')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{language === 'ja' ? '未入金請求書を経過日数別に分類し、回収リスクを可視化します' : language === 'zh' ? '按逾期天数对未付发票进行分类，可视化回收风险' : 'Classify unpaid invoices by days overdue to visualize collection risk'}</p>

            {/* Aging Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">{language === 'ja' ? '期限内' : language === 'zh' ? '未逾期' : 'Current'}</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(agingData.current.amount)}</p>
                <p className="text-xs text-green-600">{agingData.current.count}{t('common.items')}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">1-30{language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(agingData.days30.amount)}</p>
                <p className="text-xs text-yellow-600">{agingData.days30.count}{t('common.items')}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-400">31-60{language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(agingData.days60.amount)}</p>
                <p className="text-xs text-orange-600">{agingData.days60.count}{t('common.items')}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">61-90{language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(agingData.days90.amount)}</p>
                <p className="text-xs text-red-600">{agingData.days90.count}{t('common.items')}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">90{language === 'ja' ? '日超' : language === 'zh' ? '天以上' : '+ days'}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(agingData.over90.amount)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{agingData.over90.count}{t('common.items')}</p>
              </div>
            </div>

            {/* Aging Bar Chart */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{language === 'ja' ? '構成比' : language === 'zh' ? '占比' : 'Composition'}</p>
              <div className="h-8 flex rounded-lg overflow-hidden">
                {totalAging > 0 ? (
                  <>
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${(agingData.current.amount / totalAging) * 100}%` }}
                      title={`${language === 'ja' ? '期限内' : language === 'zh' ? '未逾期' : 'Current'}: ${formatCurrency(agingData.current.amount)}`}
                    />
                    <div
                      className="bg-yellow-500 transition-all"
                      style={{ width: `${(agingData.days30.amount / totalAging) * 100}%` }}
                      title={`1-30${language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}: ${formatCurrency(agingData.days30.amount)}`}
                    />
                    <div
                      className="bg-orange-500 transition-all"
                      style={{ width: `${(agingData.days60.amount / totalAging) * 100}%` }}
                      title={`31-60${language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}: ${formatCurrency(agingData.days60.amount)}`}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(agingData.days90.amount / totalAging) * 100}%` }}
                      title={`61-90${language === 'ja' ? '日' : language === 'zh' ? '天' : ' days'}: ${formatCurrency(agingData.days90.amount)}`}
                    />
                    <div
                      className="bg-gray-500 transition-all"
                      style={{ width: `${(agingData.over90.amount / totalAging) * 100}%` }}
                      title={`90${language === 'ja' ? '日超' : language === 'zh' ? '天以上' : '+ days'}: ${formatCurrency(agingData.over90.amount)}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('reports.outstanding')} {t('common.total')}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAging)}</span>
            </div>
          </div>
        </>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.cashflow')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{language === 'ja' ? '支払期限に基づく今後3ヶ月の入金予測' : language === 'zh' ? '基于付款期限的未来3个月收款预测' : 'Payment forecast for the next 3 months based on due dates'}</p>

            <div className="space-y-4">
              {cashFlowForecast.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">{item.month}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ja' ? '入金予定' : language === 'zh' ? '预计收款' : 'Expected'}</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(item.expected)}</p>
                    </div>
                    {index === 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('reports.collected')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(item.received)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {language === 'ja' ? '今後3ヶ月の入金予定合計' : language === 'zh' ? '未来3个月预计收款总额' : 'Total expected payments for the next 3 months'}: <span className="font-bold">{formatCurrency(cashFlowForecast.reduce((sum, f) => sum + f.expected, 0))}</span>
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
                  label={t('reports.period')}
                  options={[
                    { value: 'thisMonth', label: t('reports.thisMonth') },
                    { value: 'lastMonth', label: t('reports.lastMonth') },
                    { value: 'thisYear', label: t('reports.thisYear') },
                    { value: 'custom', label: t('reports.custom') },
                  ]}
                  value={period}
                  onChange={(val) => setPeriod(val as typeof period)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.productAnalysis')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{language === 'ja' ? '期間内の領収書に基づく商品別の売上分析' : language === 'zh' ? '基于期间内收据的商品销售分析' : 'Product sales analysis based on receipts within the period'}</p>

            {/* Category Legend */}
            <div className="flex gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">{t('reports.revenue')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">{t('reports.expenseReimbursement')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">{t('reports.discount')}</span>
              </div>
            </div>

            {productSales.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('common.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('products.productName')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('products.category')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.quantity')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productSales.map((item, index) => (
                      <tr key={`${item.name}-${item.category}`}>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-3 h-3 rounded ${
                            item.category === 'revenue' ? 'bg-green-500' :
                            item.category === 'expense_reimbursement' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} title={
                            item.category === 'revenue' ? t('reports.revenue') :
                            item.category === 'expense_reimbursement' ? t('reports.expenseReimbursement') :
                            t('reports.discount')
                          }></span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t('common.total')}</td>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.monthlyGoal')}</h2>

            {/* Goal Setting */}
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ja' ? '目標金額' : language === 'zh' ? '目标金额' : 'Target Amount'}</span>
                {!editingGoal ? (
                  <Button variant="secondary" size="sm" onClick={() => setEditingGoal(true)}>
                    {t('common.edit')}
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
                      {t('common.save')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingGoal(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                )}
              </div>
              {editingGoal ? (
                <Input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  placeholder={language === 'ja' ? '例: 1000000' : language === 'zh' ? '例: 1000000' : 'e.g. 1000000'}
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthlyGoal > 0 ? formatCurrency(monthlyGoal) : (language === 'ja' ? '未設定' : language === 'zh' ? '未设置' : 'Not set')}
                </p>
              )}
            </div>

            {/* Progress */}
            {monthlyGoal > 0 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.progress')}</span>
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
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">{t('dashboard.monthlyPureRevenue')}</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(thisMonthSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ja' ? '目標まで' : language === 'zh' ? '距离目标' : 'To goal'}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {monthlyGoal - thisMonthSales > 0 ? formatCurrency(monthlyGoal - thisMonthSales) : (language === 'ja' ? '達成!' : language === 'zh' ? '已达成!' : 'Achieved!')}
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                {thisMonthData.expenseReimbursement > 0 && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{language === 'ja' ? '今月の内訳' : language === 'zh' ? '本月明细' : 'This month breakdown'}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">{t('reports.pureRevenue')}</p>
                        <p className="font-bold text-green-600">{formatCurrency(thisMonthData.pureRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">{t('reports.expenseReimbursement')}</p>
                        <p className="font-bold text-amber-600">{formatCurrency(thisMonthData.expenseReimbursement)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('reports.receiptTotal')}</p>
                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(thisMonthData.total)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      {t('reports.goalProgressNote')}
                    </p>
                  </div>
                )}

                {goalProgress >= 100 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      {language === 'ja' ? '目標達成おめでとうございます!' : language === 'zh' ? '恭喜达成目标!' : 'Congratulations on achieving your goal!'}
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
