import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button, Modal, Input, Select, ConfirmModal } from '../components/common';
import { DocumentPreview } from '../components/documents/DocumentPreview';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getDocumentTypeLabel,
} from '../utils/format';
import type { DocumentType, Invoice } from '../types';

interface DocumentDetailProps {
  type: DocumentType;
}

export function DocumentDetail({ type }: DocumentDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const {
    getDocument,
    getCustomer,
    deleteDocument,
    updateDocument,
    convertToInvoice,
    convertToReceipt,
    recordPayment,
    duplicateDocument,
    getPaymentsByInvoice,
    settings,
  } = useApp();

  const [showPreview, setShowPreview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertDueDate, setConvertDueDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  });
  const [convertPaymentMethod, setConvertPaymentMethod] = useState('銀行振込');

  const document = id ? getDocument(id) : undefined;
  const customer = document ? getCustomer(document.customerId) : undefined;

  const typeLabel = getDocumentTypeLabel(type);
  const basePath = `/${type}s`;

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{typeLabel}が見つかりません</h2>
        <Link to={basePath} className="text-blue-600 hover:text-blue-700">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.documentNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans JP', sans-serif; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleSendEmail = () => {
    if (!customer?.email) {
      alert('顧客のメールアドレスが設定されていません');
      return;
    }

    const subject = encodeURIComponent(`${typeLabel} ${document.documentNumber}`);
    const body = encodeURIComponent(
      `${customer.companyName || customer.name} 様\n\n` +
      `${typeLabel}をお送りいたします。\n\n` +
      `書類番号: ${document.documentNumber}\n` +
      `金額: ${formatCurrency(document.total)}\n\n` +
      `ご確認のほどよろしくお願いいたします。`
    );
    window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordPayment(document.id, amount, paymentDate);
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  const handleConvertToInvoice = () => {
    const invoice = convertToInvoice(document.id, convertDueDate);
    if (invoice) {
      navigate(`/invoices/${invoice.id}`);
    }
  };

  const handleConvertToReceipt = () => {
    const receipt = convertToReceipt(document.id, convertPaymentMethod);
    if (receipt) {
      navigate(`/receipts/${receipt.id}`);
    }
  };

  const handleDelete = () => {
    deleteDocument(document.id);
    navigate(basePath);
  };

  const handleStatusChange = (newStatus: string) => {
    updateDocument(document.id, { status: newStatus as any });
  };

  const invoice = document.type === 'invoice' ? (document as Invoice) : null;
  const remainingAmount = invoice ? invoice.total - invoice.paidAmount : 0;
  const paymentHistory = invoice ? getPaymentsByInvoice(invoice.id) : [];

  const handleDuplicate = () => {
    const duplicated = duplicateDocument(document.id);
    if (duplicated) {
      navigate(`${basePath}/${duplicated.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to={basePath}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{document.documentNumber}</h1>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                document.status
              )}`}
            >
              {getStatusLabel(document.status)}
            </span>
          </div>
          <p className="text-gray-500">
            {customer?.companyName || customer?.name || '顧客情報なし'} | {formatDate(document.issueDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowPreview(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            プレビュー
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷
          </Button>
          <Button variant="secondary" onClick={handleSendEmail}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            メール送付
          </Button>
          <Link to={`${basePath}/${document.id}/edit`}>
            <Button variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleDuplicate}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            複製
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">金額</h2>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(document.total)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">小計</p>
                <p className="font-medium text-gray-900">{formatCurrency(document.subtotal)}</p>
              </div>
              <div>
                <p className="text-gray-500">消費税</p>
                <p className="font-medium text-gray-900">{formatCurrency(document.taxAmount)}</p>
              </div>
            </div>

            {/* Invoice specific: Payment info */}
            {invoice && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">入金済み</p>
                    <p className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">残額</p>
                    <p className="font-medium text-orange-600">{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">入金履歴</h3>
                    <div className="space-y-2">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-gray-600">{formatDate(payment.paidDate)}</span>
                            {payment.method && (
                              <span className="text-gray-400 ml-2">({payment.method})</span>
                            )}
                          </div>
                          <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">明細</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left text-sm font-medium text-gray-500">品名</th>
                    <th className="py-2 text-right text-sm font-medium text-gray-500">数量</th>
                    <th className="py-2 text-right text-sm font-medium text-gray-500">単価</th>
                    <th className="py-2 text-right text-sm font-medium text-gray-500">税率</th>
                    <th className="py-2 text-right text-sm font-medium text-gray-500">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {document.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900">{item.description || '-'}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{item.taxRate}%</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">備考</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{document.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            <div className="space-y-3">
              {/* Status Change */}
              <Select
                label="ステータス変更"
                options={[
                  { value: 'draft', label: '下書き' },
                  { value: 'sent', label: '送付済み' },
                  ...(type === 'invoice'
                    ? [
                        { value: 'paid', label: '入金済み' },
                        { value: 'overdue', label: '期限超過' },
                      ]
                    : []),
                  { value: 'cancelled', label: 'キャンセル' },
                ]}
                value={document.status}
                onChange={handleStatusChange}
              />

              {/* Invoice specific actions */}
              {type === 'invoice' && remainingAmount > 0 && (
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => {
                    setPaymentAmount(remainingAmount.toString());
                    setShowPaymentModal(true);
                  }}
                >
                  入金を記録
                </Button>
              )}

              {/* Convert actions */}
              {type === 'quotation' && document.status !== 'cancelled' && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowConvertModal(true)}
                >
                  請求書に変換
                </Button>
              )}

              {type === 'invoice' && document.status === 'paid' && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowConvertModal(true)}
                >
                  領収書を発行
                </Button>
              )}

              <Button
                variant="danger"
                className="w-full"
                onClick={() => setDeleteConfirm(true)}
              >
                削除
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">顧客情報</h2>
            {customer ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{customer.companyName || customer.name}</p>
                {customer.companyName && <p className="text-gray-600">{customer.name}</p>}
                {customer.email && <p className="text-gray-600">{customer.email}</p>}
                {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                {customer.address && (
                  <p className="text-gray-600">
                    {customer.postalCode && `〒${customer.postalCode} `}
                    {customer.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">顧客情報がありません</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">日付</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">発行日</span>
                <span className="text-gray-900">{formatDate(document.issueDate)}</span>
              </div>
              {type === 'invoice' && invoice && (
                <div className="flex justify-between">
                  <span className="text-gray-500">支払期限</span>
                  <span className={new Date(invoice.dueDate) < new Date() && document.status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
              {type === 'quotation' && 'validUntil' in document && document.validUntil && (
                <div className="flex justify-between">
                  <span className="text-gray-500">有効期限</span>
                  <span className="text-gray-900">{formatDate(document.validUntil)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">作成日</span>
                <span className="text-gray-900">{formatDate(document.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print area */}
      <div className="hidden">
        <DocumentPreview
          ref={printRef}
          document={document}
          customer={customer}
          companyInfo={settings.companyInfo}
        />
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="プレビュー"
        size="xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <DocumentPreview
            document={document}
            customer={customer}
            companyInfo={settings.companyInfo}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            閉じる
          </Button>
          <Button onClick={handlePrint}>印刷</Button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="入金を記録"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="入金額"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0"
          />
          <Input
            label="入金日"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleRecordPayment}>記録</Button>
          </div>
        </div>
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title={type === 'quotation' ? '請求書に変換' : '領収書を発行'}
        size="sm"
      >
        <div className="space-y-4">
          {type === 'quotation' && (
            <Input
              label="支払期限"
              type="date"
              value={convertDueDate}
              onChange={(e) => setConvertDueDate(e.target.value)}
            />
          )}
          {type === 'invoice' && (
            <Select
              label="支払方法"
              options={[
                { value: '銀行振込', label: '銀行振込' },
                { value: '現金', label: '現金' },
                { value: 'クレジットカード', label: 'クレジットカード' },
                { value: '口座振替', label: '口座振替' },
                { value: 'その他', label: 'その他' },
              ]}
              value={convertPaymentMethod}
              onChange={setConvertPaymentMethod}
            />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
              キャンセル
            </Button>
            <Button onClick={type === 'quotation' ? handleConvertToInvoice : handleConvertToReceipt}>
              {type === 'quotation' ? '請求書を作成' : '領収書を発行'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`${typeLabel}を削除`}
        message={`「${document.documentNumber}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        variant="danger"
      />
    </div>
  );
}
