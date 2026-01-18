import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, CardHeader, Badge, ChipGroup, Carousel, EmptyState } from '../components/common';
import type { Invoice } from '../types';

export function Dashboard() {
  const { documents, customers, memos, toggleMemoComplete } = useApp();
  const { t } = useLanguage();
  const [quickFilter, setQuickFilter] = useState<string>('all');

  const stats = useMemo(() => {
    const quotations = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice') as Invoice[];
    const receipts = documents.filter((d) => d.type === 'receipt');

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
    const thisMonthSales = thisMonthReceipts.reduce((sum, r) => sum + r.total, 0);
    const lastMonthSales = lastMonthReceipts.reduce((sum, r) => sum + r.total, 0);
    const salesChange = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

    // Get weekly sales for trend
    const weeklyTrend: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekSales = receipts
        .filter((r) => {
          const date = new Date(r.createdAt);
          return date >= weekStart && date < weekEnd;
        })
        .reduce((sum, r) => sum + r.total, 0);
      weeklyTrend.push(weekSales);
    }

    return {
      totalQuotations: quotations.length,
      totalInvoices: invoices.length,
      totalReceipts: receipts.length,
      unpaidCount: unpaidInvoices.length,
      unpaidAmount,
      overdueCount: overdueInvoices.length,
      thisMonthSales,
      salesChange,
      weeklyTrend,
      totalCustomers: customers.length,
    };
  }, [documents, customers]);

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
    return customer?.companyName || customer?.name || '不明';
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
      title: 'キーボードショートカット',
      description: 'Cmd/Ctrl + K でクイック検索、Cmd/Ctrl + N で新規請求書作成',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      title: 'テンプレート機能',
      description: 'よく使う明細をテンプレートとして保存すると、次回から簡単に呼び出せます',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
    },
    {
      title: 'PDF出力',
      description: '書類プレビュー画面からPDFを出力して、そのままメールで送付できます',
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ダッシュボード</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">売上状況と最新の書類を確認できます</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">今月の売上</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.thisMonthSales)}</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">未入金</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.unpaidAmount)}</p>
              <Badge color="yellow" dot className="mt-2">{stats.unpaidCount}件</Badge>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">期限超過</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueCount}件</p>
              {stats.overdueCount > 0 && (
                <Badge color="red" dot pulse className="mt-2">要対応</Badge>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">顧客数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}件</p>
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
            <h3 className="font-semibold text-red-800 dark:text-red-300">支払期限アラート</h3>
            <Badge color="red">{alertInvoices.length}件</Badge>
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
                      {isOverdue ? `${Math.abs(daysUntilDue)}日超過` : daysUntilDue === 0 ? '本日期限' : `あと${daysUntilDue}日`}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            {alertInvoices.length > 3 && (
              <Link to="/invoices?status=unpaid" className="block text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 pt-2">
                他{alertInvoices.length - 3}件を表示 →
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
            <h3 className="font-semibold text-gray-900 dark:text-white">見積書作成</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">新しい見積書を作成</p>
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
            <h3 className="font-semibold text-gray-900 dark:text-white">請求書作成</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">新しい請求書を作成</p>
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
            <h3 className="font-semibold text-gray-900 dark:text-white">領収書作成</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">新しい領収書を作成</p>
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
            title="最近の書類"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            action={
              <Link to="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                すべて表示 →
              </Link>
            }
          />

          <div className="mb-4">
            <ChipGroup
              options={[
                { value: 'all', label: 'すべて', count: documents.length },
                { value: 'quotation', label: '見積書', count: stats.totalQuotations },
                { value: 'invoice', label: '請求書', count: stats.totalInvoices },
                { value: 'receipt', label: '領収書', count: stats.totalReceipts },
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
              title="書類がありません"
              description="最初の書類を作成しましょう"
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
                      {getDocTypeName(doc.type)}
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
            title="未入金の請求書"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            action={
              <Link to="/invoices?status=unpaid" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
                すべて表示 →
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
              title="未入金の請求書はありません"
              description="すべての請求が入金済みです"
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
                        期限: {formatDate(invoice.dueDate)}
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">見積書</p>
        </Card>
        <Card hover className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-3">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalInvoices}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">請求書</p>
        </Card>
        <Card hover className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalReceipts}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">領収書</p>
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

function getDocTypeName(type: string): string {
  const names: Record<string, string> = {
    quotation: '見積',
    invoice: '請求',
    receipt: '領収',
  };
  return names[type] || type;
}
