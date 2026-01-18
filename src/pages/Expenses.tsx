import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, Badge, Button, EmptyState } from '../components/common';
import type { ExpenseReportStatus } from '../types';
import { EXPENSE_REPORT_STATUS_LABELS } from '../types';

export function Expenses() {
  const navigate = useNavigate();
  const { expenseReports, customers } = useApp();
  const [statusFilter, setStatusFilter] = useState<ExpenseReportStatus | 'all'>('all');

  const filteredReports = useMemo(() => {
    let reports = [...expenseReports];
    if (statusFilter !== 'all') {
      reports = reports.filter((r) => r.status === statusFilter);
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [expenseReports, statusFilter]);

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return '未設定';
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || '不明';
  };

  const getStatusColor = (status: ExpenseReportStatus): 'gray' | 'blue' | 'green' => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'completed':
        return 'blue';
      case 'invoiced':
        return 'green';
      default:
        return 'gray';
    }
  };

  const totalStats = useMemo(() => {
    const draft = expenseReports.filter((r) => r.status === 'draft').length;
    const completed = expenseReports.filter((r) => r.status === 'completed').length;
    const invoiced = expenseReports.filter((r) => r.status === 'invoiced').length;
    const totalRMB = expenseReports
      .filter((r) => r.status !== 'invoiced')
      .reduce((sum, r) => sum + r.totalRMB, 0);
    const totalJPY = expenseReports
      .filter((r) => r.status !== 'invoiced')
      .reduce((sum, r) => sum + r.totalJPY, 0);
    return { draft, completed, invoiced, totalRMB, totalJPY };
  }, [expenseReports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">経費精算</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">WeChat Pay等での経費をまとめて請求書に反映</p>
        </div>
        <Button onClick={() => navigate('/expenses/new')}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">作成中</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.draft}件</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">確定済み</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalStats.completed}件</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">未請求合計(RMB)</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalStats.totalRMB.toLocaleString()}元</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">未請求合計(JPY)</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalStats.totalJPY)}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'draft', 'completed', 'invoiced'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status === 'all' ? 'すべて' : EXPENSE_REPORT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Report List */}
      {filteredReports.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            }
            title="経費レポートがありません"
            description="新規作成ボタンから経費レポートを作成してください"
            action={
              <Button onClick={() => navigate('/expenses/new')}>
                新規作成
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card key={report.id} hover className="cursor-pointer" onClick={() => navigate(`/expenses/${report.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {report.name}
                    </h3>
                    <Badge color={getStatusColor(report.status)}>
                      {EXPENSE_REPORT_STATUS_LABELS[report.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{report.expenses.length}件の経費</span>
                    <span>|</span>
                    <span>請求先: {getCustomerName(report.customerId)}</span>
                    <span>|</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {report.totalRMB.toLocaleString()}元
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ≈ {formatCurrency(report.totalJPY)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    @{report.exchangeRate}円/元
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
