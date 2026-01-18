import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button, Input, ConfirmModal, Badge } from '../components/common';
import { formatCurrency, formatDate } from '../utils/format';
import type { ExpenseSplit, ExpenseSplitStatus } from '../types';

const STATUS_COLORS: Record<ExpenseSplitStatus, 'gray' | 'blue' | 'yellow' | 'green' | 'purple'> = {
  draft: 'gray',
  confirmed: 'blue',
  partially_invoiced: 'yellow',
  fully_invoiced: 'purple',
  completed: 'green',
};

export function ExpenseSplits() {
  const { expenseSplits, deleteExpenseSplit } = useApp();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExpenseSplit | null>(null);

  const filteredSplits = useMemo(() => {
    if (!searchQuery) return expenseSplits;
    const query = searchQuery.toLowerCase();
    return expenseSplits.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    );
  }, [expenseSplits, searchQuery]);

  const sortedSplits = useMemo(() => {
    return [...filteredSplits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredSplits]);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteExpenseSplit(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getStatusLabel = (status: ExpenseSplitStatus) => {
    const labels: Record<ExpenseSplitStatus, string> = {
      draft: t('status.draft'),
      confirmed: t('expenseSplit.statusConfirmed'),
      partially_invoiced: t('expenseSplit.statusPartiallyInvoiced'),
      fully_invoiced: t('expenseSplit.statusFullyInvoiced'),
      completed: t('status.completed'),
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('expenseSplit.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('expenseSplit.subtitle')}</p>
        </div>
        <Link to="/expense-splits/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('expenseSplit.create')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder={t('common.search') + '...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {sortedSplits.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('expenseSplit.noData')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('expenseSplit.createFirst')}</p>
          <Link to="/expense-splits/new">
            <Button>{t('expenseSplit.create')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSplits.map((split) => {
            const invoicedCount = split.participants.filter((p) => p.invoiceIssued).length;
            const paidCount = split.participants.filter((p) => p.paymentReceived).length;
            const participantsWithAmount = split.participants.filter((p) => p.totalAmount > 0);

            return (
              <Link
                key={split.id}
                to={`/expense-splits/${split.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{split.name}</h3>
                      <Badge color={STATUS_COLORS[split.status]}>
                        {getStatusLabel(split.status)}
                      </Badge>
                    </div>
                    {split.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{split.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('expenseSplit.participants')}: {participantsWithAmount.length}{t('common.people')}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t('expenseSplit.itemCount')}: {split.items.length}{t('common.items')}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(split.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(split.totalAmount)}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${invoicedCount === participantsWithAmount.length ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {t('expenseSplit.invoiced')}: {invoicedCount}/{participantsWithAmount.length}
                      </span>
                      <span className={`px-2 py-1 rounded ${paidCount === participantsWithAmount.length ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {t('expenseSplit.paid')}: {paidCount}/{participantsWithAmount.length}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('expenseSplit.deleteConfirm')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}
