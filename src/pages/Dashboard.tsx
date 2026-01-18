import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import type { Invoice } from '../types';

export function Dashboard() {
  const { documents, customers } = useApp();

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
    const thisMonthReceipts = receipts.filter((r) => new Date(r.createdAt) >= thisMonth);
    const thisMonthSales = thisMonthReceipts.reduce((sum, r) => sum + r.total, 0);

    return {
      totalQuotations: quotations.length,
      totalInvoices: invoices.length,
      totalReceipts: receipts.length,
      unpaidCount: unpaidInvoices.length,
      unpaidAmount,
      overdueCount: overdueInvoices.length,
      thisMonthSales,
      totalCustomers: customers.length,
    };
  }, [documents, customers]);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [documents]);

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

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || '不明';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">売上状況と最新の書類を確認できます</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今月の売上"
          value={formatCurrency(stats.thisMonthSales)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="未入金"
          value={formatCurrency(stats.unpaidAmount)}
          subtitle={`${stats.unpaidCount}件`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="orange"
        />
        <StatCard
          title="期限超過"
          value={`${stats.overdueCount}件`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color={stats.overdueCount > 0 ? 'red' : 'gray'}
        />
        <StatCard
          title="顧客数"
          value={`${stats.totalCustomers}件`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Due Date Alerts */}
      {alertInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-semibold text-red-800">支払期限アラート</h3>
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
                  className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.documentNumber}</p>
                    <p className="text-sm text-gray-600">{getCustomerName(invoice.customerId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(invoice.total - invoice.paidAmount)}</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                      {isOverdue ? `${Math.abs(daysUntilDue)}日超過` : daysUntilDue === 0 ? '本日期限' : `あと${daysUntilDue}日`}
                    </p>
                  </div>
                </Link>
              );
            })}
            {alertInvoices.length > 3 && (
              <Link to="/invoices?status=unpaid" className="block text-center text-sm text-red-600 hover:text-red-700 pt-2">
                他{alertInvoices.length - 3}件を表示
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/quotations/new"
          className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">見積書作成</h3>
            <p className="text-sm text-gray-500">新しい見積書を作成</p>
          </div>
        </Link>
        <Link
          to="/invoices/new"
          className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">請求書作成</h3>
            <p className="text-sm text-gray-500">新しい請求書を作成</p>
          </div>
        </Link>
        <Link
          to="/receipts/new"
          className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">領収書作成</h3>
            <p className="text-sm text-gray-500">新しい領収書を作成</p>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近の書類</h2>
            <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-700">
              すべて表示
            </Link>
          </div>
          {recentDocuments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">書類がありません</p>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/${doc.type}s/${doc.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getDocTypeColor(doc.type)}`} />
                    <div>
                      <p className="font-medium text-gray-900">{doc.documentNumber}</p>
                      <p className="text-sm text-gray-500">{getCustomerName(doc.customerId)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(doc.total)}</p>
                    <p className="text-sm text-gray-500">{formatDate(doc.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">未入金の請求書</h2>
            <Link to="/invoices?status=unpaid" className="text-sm text-blue-600 hover:text-blue-700">
              すべて表示
            </Link>
          </div>
          {unpaidInvoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">未入金の請求書はありません</p>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.map((invoice) => {
                const isOverdue = new Date(invoice.dueDate) < new Date();
                return (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{invoice.documentNumber}</p>
                      <p className="text-sm text-gray-500">{getCustomerName(invoice.customerId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(invoice.total - invoice.paidAmount)}</p>
                      <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        期限: {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.totalQuotations}</p>
          <p className="text-sm text-gray-500 mt-1">見積書</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{stats.totalInvoices}</p>
          <p className="text-sm text-gray-500 mt-1">請求書</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.totalReceipts}</p>
          <p className="text-sm text-gray-500 mt-1">領収書</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'orange' | 'red' | 'blue' | 'gray';
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function getDocTypeColor(type: string): string {
  const colors: Record<string, string> = {
    quotation: 'bg-purple-500',
    invoice: 'bg-orange-500',
    receipt: 'bg-green-500',
  };
  return colors[type] || 'bg-gray-500';
}
