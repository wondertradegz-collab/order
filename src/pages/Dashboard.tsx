import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, CardHeader, Badge, ChipGroup, Carousel, EmptyState } from '../components/common';
import type { Invoice, Receipt, LineItem } from '../types';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

export function Dashboard() {
  const { documents, customers, memos, toggleMemoComplete } = useApp();
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [quickFilter, setQuickFilter] = useState<string>('all');

  const stats = useMemo(() => {
    const quotations = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice') as Invoice[];
    const receipts = documents.filter((d) => d.type === 'receipt') as Receipt[];

    const unpaidInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
    const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

    const today = new Date();
    const overdueInvoices = invoices.filter(
      (i) => i.status !== 'paid' && i.status !== 'cancelled' && new Date(i.dueDate) < today
    );

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthReceipts = receipts.filter((r) => new Date(r.createdAt) >= thisMonth);
    const lastMonthReceipts = receipts.filter((r) => {
      const date = new Date(r.createdAt);
      return date >= lastMonth && date < thisMonth;
    });

    // カテゴリ別に今月の売上を計算
    const thisMonthData = thisMonthReceipts.reduce(
      (acc, r) => {
        const categoryTotals = calculateCategoryTotals(r.items);
        acc.pureRevenue += categoryTotals.netRevenue;
        acc.expenseReimbursement += categoryTotals.expenseReimbursement;
        acc.total += r.total;
        return acc;
      },
      { pureRevenue: 0, expenseReimbursement: 0, total: 0 }
    );

    // 先月の純売上を計算（前月比較用）
    const lastMonthPureRevenue = lastMonthReceipts.reduce((sum, r) => {
      const categoryTotals = calculateCategoryTotals(r.items);
      return sum + categoryTotals.netRevenue;
    }, 0);

    const salesChange = lastMonthPureRevenue > 0
      ? ((thisMonthData.pureRevenue - lastMonthPureRevenue) / lastMonthPureRevenue) * 100
      : 0;

    // Get weekly sales for trend (純売上のみ)
    const weeklyTrend: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekSales = receipts
        .filter((r) => {
          const date = new Date(r.createdAt);
          return date >= weekStart && date < weekEnd;
        })
        .reduce((sum, r) => {
          const categoryTotals = calculateCategoryTotals(r.items);
          return sum + categoryTotals.netRevenue;
        }, 0);
      weeklyTrend.push(weekSales);
    }

    return {
      totalQuotations: quotations.length,
      totalInvoices: invoices.length,
      totalReceipts: receipts.length,
      unpaidCount: unpaidInvoices.length,
      unpaidAmount,
      overdueCount: overdueInvoices.length,
      thisMonthSales: thisMonthData.pureRevenue, // 純売上のみ
      thisMonthExpenseReimbursement: thisMonthData.expenseReimbursement, // 立替経費回収
      thisMonthTotal: thisMonthData.total, // 領収書合計
      salesChange,
      weeklyTrend,
      totalCustomers: customers.length,
    };
  }, [documents, customers]);

  // Chart data - Monthly sales trend (past 6 months)
  const chartData = useMemo(() => {
    const receipts = documents.filter((d) => d.type === 'receipt') as Receipt[];
    const invoices = documents.filter((d) => d.type === 'invoice') as Invoice[];
    const today = new Date();

    // Monthly sales data for the past 6 months
    const monthlySales: { name: string; sales: number; invoiced: number; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ja-JP';
      const monthName = targetDate.toLocaleDateString(locale, { month: 'short' });

      const monthReceipts = receipts.filter((r) => {
        const date = new Date(r.createdAt);
        return date >= targetDate && date < nextMonth;
      });

      const monthInvoices = invoices.filter((inv) => {
        const date = new Date(inv.createdAt);
        return date >= targetDate && date < nextMonth;
      });

      const sales = monthReceipts.reduce((sum, r) => {
        const categoryTotals = calculateCategoryTotals(r.items);
        return sum + categoryTotals.netRevenue;
      }, 0);

      const invoiced = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);

      monthlySales.push({
        name: monthName,
        sales,
        invoiced,
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
      });
    }

    // Document type breakdown (pie chart)
    const quotationCount = documents.filter((d) => d.type === 'quotation').length;
    const invoiceCount = invoices.length;
    const receiptCount = receipts.length;

    const documentBreakdown = [
      { name: t('documents.quotation'), value: quotationCount, color: '#8b5cf6' },
      { name: t('documents.invoice'), value: invoiceCount, color: '#f97316' },
      { name: t('documents.receipt'), value: receiptCount, color: '#22c55e' },
    ].filter(item => item.value > 0);

    // Payment status breakdown (pie chart)
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length;
    const cancelledInvoices = invoices.filter(i => i.status === 'cancelled').length;

    const paymentStatus = [
      { name: t('status.paid'), value: paidInvoices, color: '#22c55e' },
      { name: t('dashboard.unpaid'), value: unpaidInvoices, color: '#f97316' },
      { name: t('status.cancelled'), value: cancelledInvoices, color: '#94a3b8' },
    ].filter(item => item.value > 0);

    return { monthlySales, documentBreakdown, paymentStatus };
  }, [documents, t, language]);

  const recentDocuments = useMemo(() => {
    let filtered = [...documents];
    if (quickFilter !== 'all') {
      filtered = filtered.filter((d) => d.type === quickFilter);
    }
    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [documents, quickFilter]);

  const unpaidInvoices = useMemo(() => {
    return (documents.filter((d) => d.type === 'invoice' && d.status !== 'paid' && d.status !== 'cancelled') as Invoice[])
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [documents]);

  // Invoices approaching due date (within 7 days) or overdue
  const alertInvoices = useMemo(() => {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return (documents.filter((d) => {
      if (d.type !== 'invoice' || d.status === 'paid' || d.status === 'cancelled') return false;
      const invoice = d as Invoice;
      const dueDate = new Date(invoice.dueDate);
      return dueDate <= sevenDaysLater;
    }) as Invoice[])
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [documents]);

  // Incomplete tasks sorted by priority and due date
  const incompleteTasks = useMemo(() => {
    return memos
      .filter((m) => m.isTask && !m.completed)
      .sort((a, b) => {
        // Priority order: high > medium > low
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        return 0;
      })
      .slice(0, 5);
  }, [memos]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || t('common.unknown');
  };

  const isTaskOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const tips = [
    {
      title: t('dashboard.tipKeyboardTitle'),
      description: t('dashboard.tipKeyboardDesc'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      title: t('dashboard.tipTemplateTitle'),
      description: t('dashboard.tipTemplateDesc'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
    },
    {
      title: t('dashboard.tipPdfTitle'),
      description: t('dashboard.tipPdfDesc'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.monthlyPureRevenue')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.thisMonthSales)}</p>
              {stats.salesChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  stats.salesChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stats.salesChange > 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
                    />
                  </svg>
                  <span>{Math.abs(stats.salesChange).toFixed(1)}%</span>
                </div>
              )}
              {/* 立替経費回収がある場合は内訳を表示 */}
              {stats.thisMonthExpenseReimbursement > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    + {t('dashboard.expenseReimbursement')}: {formatCurrency(stats.thisMonthExpenseReimbursement)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    = {t('dashboard.total')}: {formatCurrency(stats.thisMonthTotal)}
                  </p>
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {stats.weeklyTrend.length > 0 && stats.weeklyTrend.some(v => v > 0) && (
            <div className="mt-4 flex items-end gap-1 h-10">
              {stats.weeklyTrend.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-200 dark:bg-green-800 rounded-t transition-all"
                  style={{ height: `${Math.max(4, (val / Math.max(...stats.weeklyTrend)) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.unpaid')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.unpaidAmount)}</p>
              <Badge color="yellow" dot className="mt-2">{stats.unpaidCount}{t('dashboard.items')}</Badge>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.overdue')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueCount}{t('dashboard.items')}</p>
              {stats.overdueCount > 0 && (
                <Badge color="red" dot pulse className="mt-2">{t('dashboard.actionRequired')}</Badge>
              )}
            </div>
            <div className={`p-3 rounded-xl ${stats.overdueCount > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.customerCount')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}{t('dashboard.items')}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Due Date Alerts */}
      {alertInvoices.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">{t('dashboard.paymentDueAlert')}</h3>
            <Badge color="red">{alertInvoices.length}{t('dashboard.items')}</Badge>
          </div>
          <div className="space-y-2">
            {alertInvoices.slice(0, 3).map((invoice) => {
              const dueDate = new Date(invoice.dueDate);
              const today = new Date();
              const isOverdue = dueDate < today;
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{invoice.documentNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getCustomerName(invoice.customerId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total - invoice.paidAmount)}</p>
                    <Badge color={isOverdue ? 'red' : 'yellow'} dot={isOverdue} pulse={isOverdue}>
                      {isOverdue
                        ? t('dashboard.daysOverdue').replace('{n}', String(Math.abs(daysUntilDue)))
                        : daysUntilDue === 0
                          ? t('dashboard.dueToday')
                          : t('dashboard.daysRemaining').replace('{n}', String(daysUntilDue))}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            {alertInvoices.length > 3 && (
              <Link to="/invoices?status=unpaid" className="block text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 pt-2">
                {t('dashboard.viewMore').replace('{n}', String(alertInvoices.length - 3))} →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Tips Carousel */}
      <Carousel autoPlay interval={8000} showArrows={false}>
        {tips.map((tip, index) => (
          <div key={index} className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                {tip.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{tip.title}</h3>
                <p className="text-white/80">{tip.description}</p>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      {/* Sales Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('dashboard.monthlySalesTrend')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
          {chartData.monthlySales.some(m => m.sales > 0 || m.invoiced > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis
                    dataKey="name"
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickFormatter={(value) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: isDarkMode ? '#ffffff' : '#111827' }}
                    formatter={(value, name) => [
                      formatCurrency(Number(value) || 0),
                      name === 'sales' ? t('dashboard.salesPaid') : t('dashboard.invoicedAmount')
                    ]}
                  />
                  <Legend
                    formatter={(value) => value === 'sales' ? t('dashboard.salesPaid') : t('dashboard.invoicedAmount')}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="invoiced"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInvoiced)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>{t('common.noData')}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Document & Payment Status */}
        <Card>
          <CardHeader
            title={t('dashboard.documentPaymentStatus')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
          <div className="space-y-6">
            {/* Document Breakdown */}
            {chartData.documentBreakdown.length > 0 ? (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.documentType')}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.documentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.documentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value, name) => [`${value}${t('dashboard.items')}`, String(name)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  {chartData.documentBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <p className="text-sm">{t('dashboard.noDocumentsYet')}</p>
              </div>
            )}

            {/* Payment Status */}
            {chartData.paymentStatus.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.invoicePaymentStatus')}</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.paymentStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.paymentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value, name) => [`${value}${t('dashboard.items')}`, String(name)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  {chartData.paymentStatus.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/quotations/new"
          className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.createQuotation')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.newQuotation')}</p>
          </div>
        </Link>
        <Link
          to="/invoices/new"
          className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.createInvoice')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.newInvoice')}</p>
          </div>
        </Link>
        <Link
          to="/receipts/new"
          className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.createReceipt')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.newReceipt')}</p>
          </div>
        </Link>
      </div>

      {/* Tasks Widget */}
      {incompleteTasks.length > 0 && (
        <Card>
          <CardHeader
            title={t('memos.incompleteTasks')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            action={
              <Link to="/memos" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                {t('common.all')} →
              </Link>
            }
          />
          <div className="space-y-2">
            {incompleteTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <button
                  onClick={() => toggleMemoComplete(task.id)}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 flex items-center justify-center transition-colors flex-shrink-0"
                >
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                    <Badge color={getPriorityColor(task.priority) as any} dot>
                      {t(`memos.priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`)}
                    </Badge>
                  </div>
                  {task.dueDate && (
                    <p className={`text-sm ${isTaskOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t('memos.dueDate')}: {formatDate(task.dueDate)}
                      {isTaskOverdue(task.dueDate) && ` (${t('status.overdue')})`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader
            title={t('dashboard.recentDocuments')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            action={
              <Link to="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                {t('dashboard.viewAll')} →
              </Link>
            }
          />

          <div className="mb-4">
            <ChipGroup
              options={[
                { value: 'all', label: t('common.all'), count: documents.length },
                { value: 'quotation', label: t('documents.quotation'), count: stats.totalQuotations },
                { value: 'invoice', label: t('documents.invoice'), count: stats.totalInvoices },
                { value: 'receipt', label: t('documents.receipt'), count: stats.totalReceipts },
              ]}
              value={quickFilter}
              onChange={(val) => setQuickFilter(val as string)}
            />
          </div>

          {recentDocuments.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title={t('dashboard.noDocumentsYet')}
              description={t('dashboard.createFirstDocument')}
            />
          ) : (
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/${doc.type}s/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge color={getDocTypeColor(doc.type)} dot>
                      {getDocTypeName(doc.type, t)}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.documentNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getCustomerName(doc.customerId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(doc.total)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(doc.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Unpaid Invoices */}
        <Card>
          <CardHeader
            title={t('dashboard.unpaidInvoices')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            action={
              <Link to="/invoices?status=unpaid" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                {t('dashboard.viewAll')} →
              </Link>
            }
          />
          {unpaidInvoices.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              title={t('dashboard.noUnpaidInvoices')}
              description={t('dashboard.allPaid')}
            />
          ) : (
            <div className="space-y-2">
              {unpaidInvoices.map((invoice) => {
                const isOverdue = new Date(invoice.dueDate) < new Date();
                return (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{invoice.documentNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getCustomerName(invoice.customerId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total - invoice.paidAmount)}</p>
                      <Badge color={isOverdue ? 'red' : 'gray'} dot={isOverdue}>
                        {t('dashboard.dueDateLabel')}: {formatDate(invoice.dueDate)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card hover className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-3">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalQuotations}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('documents.quotation')}</p>
        </Card>
        <Card hover className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-3">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalInvoices}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('documents.invoice')}</p>
        </Card>
        <Card hover className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalReceipts}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('documents.receipt')}</p>
        </Card>
      </div>
    </div>
  );
}

function getDocTypeColor(type: string): 'purple' | 'yellow' | 'green' | 'gray' {
  const colors: Record<string, 'purple' | 'yellow' | 'green' | 'gray'> = {
    quotation: 'purple',
    invoice: 'yellow',
    receipt: 'green',
  };
  return colors[type] || 'gray';
}

function getDocTypeName(type: string, t: (key: string) => string): string {
  const typeMap: Record<string, string> = {
    quotation: 'documents.quotationShort',
    invoice: 'documents.invoiceShort',
    receipt: 'documents.receiptShort',
  };
  return typeMap[type] ? t(typeMap[type]) : type;
}
