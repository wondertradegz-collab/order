import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, Badge, Button, EmptyState, Select } from '../components/common';
import type { ExpenseReportStatus } from '../types';
import { EXPENSE_REPORT_STATUS_LABELS } from '../types';

export function Expenses() {
  const navigate = useNavigate();
  const { expenseReports, customers } = useApp();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<ExpenseReportStatus | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  // 経費レポートに紐づいている顧客のみを抽出
  const customersWithExpenses = useMemo(() => {
    const customerIds = new Set(expenseReports.map((r) => r.customerId).filter(Boolean));
    return customers.filter((c) => customerIds.has(c.id));
  }, [expenseReports, customers]);

  const filteredReports = useMemo(() => {
    let reports = [...expenseReports];
    if (statusFilter !== 'all') {
      reports = reports.filter((r) => r.status === statusFilter);
    }
    if (customerFilter !== 'all') {
      if (customerFilter === 'none') {
        reports = reports.filter((r) => !r.customerId);
      } else {
        reports = reports.filter((r) => r.customerId === customerFilter);
      }
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [expenseReports, statusFilter, customerFilter]);

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return t('common.unknown');
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || t('common.unknown');
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

  // フィルター対象のレポートで統計を計算
  const totalStats = useMemo(() => {
    // 顧客フィルターを適用したレポート
    let targetReports = [...expenseReports];
    if (customerFilter !== 'all') {
      if (customerFilter === 'none') {
        targetReports = targetReports.filter((r) => !r.customerId);
      } else {
        targetReports = targetReports.filter((r) => r.customerId === customerFilter);
      }
    }

    const draft = targetReports.filter((r) => r.status === 'draft').length;
    const completed = targetReports.filter((r) => r.status === 'completed').length;
    const invoiced = targetReports.filter((r) => r.status === 'invoiced').length;
    const totalRMB = targetReports
      .filter((r) => r.status !== 'invoiced')
      .reduce((sum, r) => sum + r.totalRMB, 0);
    const totalJPY = targetReports
      .filter((r) => r.status !== 'invoiced')
      .reduce((sum, r) => sum + r.totalJPY, 0);
    return { draft, completed, invoiced, totalRMB, totalJPY };
  }, [expenseReports, customerFilter]);

  const customerOptions = useMemo(() => [
    { value: 'all', label: t('common.all') },
    { value: 'none', label: t('common.unknown') },
    ...customersWithExpenses.map((c) => ({
      value: c.id,
      label: c.companyName || c.name,
    })),
  ], [customersWithExpenses, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('expenses.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('expenses.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/expenses/new')}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('expenses.createReport')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('status.draft')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.draft}{t('common.items')}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('status.completed')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalStats.completed}{t('common.items')}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('expenses.totalRMB')}</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalStats.totalRMB.toLocaleString()}{t('common.yuan')}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('expenses.totalJPY')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalStats.totalJPY)}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Customer Filter */}
        <div className="w-full sm:w-64">
          <Select
            label={t('documents.customer')}
            value={customerFilter}
            onChange={(value) => setCustomerFilter(value)}
            options={customerOptions}
          />
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.status')}</p>
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
                {status === 'all' ? t('common.all') : EXPENSE_REPORT_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
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
            title={t('expenses.noExpenses')}
            description={t('expenses.addFirstExpense')}
            action={
              <Button onClick={() => navigate('/expenses/new')}>
                {t('expenses.createReport')}
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
                    <span>{report.expenses.length}{t('common.items')}</span>
                    <span>|</span>
                    <span>{t('documents.customer')}: {getCustomerName(report.customerId)}</span>
                    <span>|</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {report.totalRMB.toLocaleString()}{t('common.yuan')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(report.totalJPY)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    @{report.exchangeRate}{t('expenses.yenPerYuan')}
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
