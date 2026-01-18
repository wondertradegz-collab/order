import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, Badge, Button, Modal, Select, Input } from '../components/common';
import { EXPENSE_REPORT_STATUS_LABELS, EXPENSE_CATEGORY_LABELS } from '../types';
import type { ExpenseReportStatus, Invoice } from '../types';

export function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
        <p className="text-gray-500 dark:text-gray-400">経費レポートが見つかりません</p>
        <Button className="mt-4" onClick={() => navigate('/expenses')}>
          一覧に戻る
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
    if (window.confirm('この経費レポートを削除しますか？')) {
      deleteExpenseReport(report.id);
      navigate('/expenses');
    }
  };

  const handleAddToInvoice = () => {
    if (!selectedInvoiceId) {
      alert('請求書を選択してください');
      return;
    }

    const description = invoiceDescription || `出張費 (${report.totalRMB}元 × ${report.exchangeRate}円)`;
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
      label: `${inv.documentNumber} - ${invCustomer?.companyName || invCustomer?.name || '不明'}`,
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
            作成日: {formatDate(report.createdAt)}
            {customer && ` | 請求先: ${customer.companyName || customer.name}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {report.status !== 'invoiced' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/expenses/${report.id}/edit`)}>
                編集
              </Button>
              {report.status === 'draft' && (
                <Button variant="secondary" onClick={() => handleStatusChange('completed')}>
                  確定
                </Button>
              )}
              {report.status === 'completed' && (
                <Button onClick={() => setShowAddToInvoiceModal(true)}>
                  請求書に追加
                </Button>
              )}
            </>
          )}
          <Button variant="danger" onClick={handleDelete}>
            削除
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">合計金額 (RMB)</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {report.totalRMB.toLocaleString()}元
          </p>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">為替レート</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {report.exchangeRate}円/元
          </p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">合計金額 (JPY)</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(report.totalJPY)}
          </p>
        </Card>
      </div>

      {/* Invoice Format Preview */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">請求書への記載形式</h2>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm">
          出張費 / {report.totalRMB}元 × {report.exchangeRate}円 / {formatCurrency(report.totalJPY)}
        </div>
      </Card>

      {/* Expense Items */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          経費明細 ({report.expenses.length}件)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">日付</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">カテゴリ</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">説明</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">金額(RMB)</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">金額(JPY)</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">証憑</th>
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
                    {expense.amountRMB.toLocaleString()}元
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
                        📷 表示
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
                  合計
                </td>
                <td className="py-3 px-2 text-right text-orange-600 dark:text-orange-400">
                  {report.totalRMB.toLocaleString()}元
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
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">備考</h2>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{report.notes}</p>
        </Card>
      )}

      {/* Linked Invoice */}
      {report.invoiceId && (
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">連携済み請求書</h2>
          <Link
            to={`/invoices/${report.invoiceId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            請求書を表示 →
          </Link>
        </Card>
      )}

      {/* Add to Invoice Modal */}
      <Modal
        isOpen={showAddToInvoiceModal}
        onClose={() => setShowAddToInvoiceModal(false)}
        title="請求書に追加"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            この経費レポートを請求書の明細に追加します。
          </p>

          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">追加される金額</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(report.totalJPY)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ({report.totalRMB}元 × {report.exchangeRate}円)
            </p>
          </div>

          <Select
            label="追加先の請求書"
            value={selectedInvoiceId}
            onChange={(value) => setSelectedInvoiceId(value)}
            options={[{ value: '', label: '請求書を選択してください' }, ...invoiceOptions]}
          />

          <Input
            label="明細の説明"
            value={invoiceDescription}
            onChange={(e) => setInvoiceDescription(e.target.value)}
            placeholder={`出張費 (${report.totalRMB}元 × ${report.exchangeRate}円)`}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowAddToInvoiceModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddToInvoice}>
              請求書に追加
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        isOpen={!!showImageModal}
        onClose={() => setShowImageModal(null)}
        title="支払い証憑"
      >
        {showImageModal && (
          <div className="flex justify-center">
            <img
              src={showImageModal}
              alt="支払い証憑"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
