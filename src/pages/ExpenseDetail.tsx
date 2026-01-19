import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, Badge, Button, Modal, Select, Input } from '../components/common';
import { EXPENSE_REPORT_STATUS_LABELS, EXPENSE_CATEGORY_LABELS } from '../types';
import type { ExpenseReportStatus, Invoice } from '../types';

export function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const {
    customers,
    documents,
    deleteExpenseReport,
    updateExpenseReport,
    addExpenseToInvoice,
    getExpenseReport,
  } = useApp();

  const [showAddToInvoiceModal, setShowAddToInvoiceModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const report = getExpenseReport(id || '');

  const customer = useMemo(() => {
    if (!report?.customerId) return null;
    return customers.find((c) => c.id === report.customerId);
  }, [report, customers]);

  // 未入金の請求書を取得
  const availableInvoices = useMemo(() => {
    return documents.filter(
      (d) => d.type === 'invoice' && d.status !== 'paid' && d.status !== 'cancelled'
    ) as Invoice[];
  }, [documents]);

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        <Button className="mt-4" onClick={() => navigate('/expenses')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

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

  const handleDelete = () => {
    if (window.confirm(t('documents.deleteConfirm'))) {
      deleteExpenseReport(report.id);
      navigate('/expenses');
    }
  };

  const handleAddToInvoice = () => {
    if (!selectedInvoiceId) {
      alert(t('expenses.selectInvoice'));
      return;
    }

    const description = invoiceDescription || `${report.totalRMB}${t('common.yuan')} × ${report.exchangeRate}${t('expenses.yenPerYuan')}`;
    addExpenseToInvoice(report.id, selectedInvoiceId, description);
    setShowAddToInvoiceModal(false);
    navigate('/expenses');
  };

  const handleStatusChange = (newStatus: ExpenseReportStatus) => {
    updateExpenseReport(report.id, { status: newStatus });
  };

  const invoiceOptions = availableInvoices.map((inv) => {
    const invCustomer = customers.find((c) => c.id === inv.customerId);
    return {
      value: inv.id,
      label: `${inv.documentNumber} - ${invCustomer?.companyName || invCustomer?.name || t('common.unknown')}`,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{report.name}</h1>
            <Badge color={getStatusColor(report.status)}>
              {EXPENSE_REPORT_STATUS_LABELS[report.status]}
            </Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {t('common.date')}: {formatDate(report.createdAt)}
            {customer && ` | ${t('documents.customer')}: ${customer.companyName || customer.name}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {report.status !== 'invoiced' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/expenses/${report.id}/edit`)}>
                {t('common.edit')}
              </Button>
              {report.status === 'draft' && (
                <Button variant="secondary" onClick={() => handleStatusChange('completed')}>
                  {t('common.confirm')}
                </Button>
              )}
              {report.status === 'completed' && (
                <Button onClick={() => setShowAddToInvoiceModal(true)}>
                  {t('expenses.addToInvoice')}
                </Button>
              )}
            </>
          )}
          <Button variant="danger" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('expenses.totalRMB')}</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {report.totalRMB.toLocaleString()}{t('common.yuan')}
          </p>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('expenses.exchangeRate')}</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {report.exchangeRate}{t('expenses.yenPerYuan')}
          </p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('expenses.totalJPY')}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(report.totalJPY)}
          </p>
        </Card>
      </div>

      {/* Invoice Format Preview */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('documents.invoice')}</h2>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm">
          {report.totalRMB}{t('common.yuan')} × {report.exchangeRate}{t('expenses.yenPerYuan')} / {formatCurrency(report.totalJPY)}
        </div>
      </Card>

      {/* Expense Items */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          {t('documents.lineItems')} ({report.expenses.length}{t('common.items')})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.date')}</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('products.category')}</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('common.description')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('expenses.amountRMB')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('expenses.amountJPY')}</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">{t('expenses.screenshot')}</th>
              </tr>
            </thead>
            <tbody>
              {report.expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-2 text-gray-900 dark:text-white">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                    {EXPENSE_CATEGORY_LABELS[expense.category || 'other']}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                    {expense.description || '-'}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-orange-600 dark:text-orange-400">
                    {expense.amountRMB.toLocaleString()}{t('common.yuan')}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(Math.round(expense.amountRMB * report.exchangeRate))}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {expense.screenshot ? (
                      <button
                        onClick={() => setShowImageModal(expense.screenshot!)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t('common.preview')}
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                <td colSpan={3} className="py-3 px-2 text-gray-900 dark:text-white">
                  {t('common.total')}
                </td>
                <td className="py-3 px-2 text-right text-orange-600 dark:text-orange-400">
                  {report.totalRMB.toLocaleString()}{t('common.yuan')}
                </td>
                <td className="py-3 px-2 text-right text-green-600 dark:text-green-400">
                  {formatCurrency(report.totalJPY)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Notes */}
      {report.notes && (
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('common.notes')}</h2>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{report.notes}</p>
        </Card>
      )}

      {/* Linked Invoice */}
      {report.invoiceId && (
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('documents.invoice')}</h2>
          <Link
            to={`/invoices/${report.invoiceId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('common.preview')} →
          </Link>
        </Card>
      )}

      {/* Add to Invoice Modal */}
      <Modal
        isOpen={showAddToInvoiceModal}
        onClose={() => setShowAddToInvoiceModal(false)}
        title={t('expenses.addToInvoice')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {t('expenses.addToInvoice')}
          </p>

          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('common.amount')}</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(report.totalJPY)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ({report.totalRMB}{t('common.yuan')} × {report.exchangeRate}{t('expenses.yenPerYuan')})
            </p>
          </div>

          <Select
            label={t('expenses.selectInvoice')}
            value={selectedInvoiceId}
            onChange={(value) => setSelectedInvoiceId(value)}
            options={[{ value: '', label: t('expenses.selectInvoice') }, ...invoiceOptions]}
          />

          <Input
            label={t('common.description')}
            value={invoiceDescription}
            onChange={(e) => setInvoiceDescription(e.target.value)}
            placeholder={`${report.totalRMB}${t('common.yuan')} × ${report.exchangeRate}${t('expenses.yenPerYuan')}`}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowAddToInvoiceModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddToInvoice}>
              {t('expenses.addToInvoice')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        isOpen={!!showImageModal}
        onClose={() => setShowImageModal(null)}
        title={t('expenses.screenshot')}
      >
        {showImageModal && (
          <div className="flex justify-center">
            <img
              src={showImageModal}
              alt={t('expenses.screenshot')}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
