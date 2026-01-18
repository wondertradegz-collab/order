import { forwardRef } from 'react';
import { formatCurrency, formatDate, getDocumentTypeLabel } from '../../utils/format';
import type { Document, Customer, CompanyInfo, LineItem } from '../../types';

interface DocumentPreviewProps {
  document: Document;
  customer: Customer | undefined;
  companyInfo: CompanyInfo;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '元',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KRW: '₩',
  TWD: 'NT$',
};

const formatItemDescription = (item: LineItem): string => {
  let desc = item.description || '-';
  // Add foreign currency calculation if present
  if (item.foreignAmount && item.exchangeRate && item.foreignCurrency) {
    const symbol = CURRENCY_SYMBOLS[item.foreignCurrency] || item.foreignCurrency;
    desc += ` (${item.foreignAmount}${symbol} × ${item.exchangeRate}円)`;
  }
  return desc;
};

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ document, customer, companyInfo }, ref) => {
    const subtotal = document.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = document.items.reduce(
      (sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)),
      0
    );

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-4xl mx-auto"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wider">
            {getDocumentTypeLabel(document.type)}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            No. {document.documentNumber}
          </p>
        </div>

        {/* Two Column Header */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left: Customer Info */}
          <div>
            <div className="border-b-2 border-gray-900 pb-2 mb-4">
              <p className="text-lg font-semibold text-gray-900">
                {customer?.companyName || customer?.name || '顧客情報なし'}
              </p>
              {customer?.companyName && customer?.name && (
                <p className="text-sm text-gray-600">{customer.name} 様</p>
              )}
              {!customer?.companyName && <span className="text-sm text-gray-600">様</span>}
            </div>
            {customer?.postalCode && (
              <p className="text-sm text-gray-600">〒{customer.postalCode}</p>
            )}
            {customer?.address && (
              <p className="text-sm text-gray-600">{customer.address}</p>
            )}
          </div>

          {/* Right: Company Info & Dates */}
          <div className="text-right">
            <p className="text-sm text-gray-600">発行日: {formatDate(document.issueDate, 'long')}</p>
            {document.type === 'invoice' && 'dueDate' in document && (
              <p className="text-sm text-gray-600">支払期限: {formatDate(document.dueDate, 'long')}</p>
            )}
            {document.type === 'quotation' && 'validUntil' in document && document.validUntil && (
              <p className="text-sm text-gray-600">有効期限: {formatDate(document.validUntil, 'long')}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="font-semibold text-gray-900">{companyInfo.name || '会社名未設定'}</p>
              {companyInfo.postalCode && <p className="text-sm text-gray-600">〒{companyInfo.postalCode}</p>}
              {companyInfo.address && <p className="text-sm text-gray-600">{companyInfo.address}</p>}
              {companyInfo.phone && <p className="text-sm text-gray-600">TEL: {companyInfo.phone}</p>}
              {companyInfo.email && <p className="text-sm text-gray-600">Email: {companyInfo.email}</p>}
              {companyInfo.registrationNumber && (
                <p className="text-sm text-gray-600 mt-1">
                  登録番号: {companyInfo.registrationNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total Amount Box */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8 text-center">
          <p className="text-sm text-gray-600 mb-1">
            {document.type === 'receipt' ? '領収金額' : 'ご請求金額'}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(document.total)}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-2 text-left text-sm font-semibold text-gray-900">品名・摘要</th>
              <th className="py-2 text-right text-sm font-semibold text-gray-900 w-20">数量</th>
              <th className="py-2 text-right text-sm font-semibold text-gray-900 w-28">単価</th>
              <th className="py-2 text-right text-sm font-semibold text-gray-900 w-16">税率</th>
              <th className="py-2 text-right text-sm font-semibold text-gray-900 w-28">金額</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 text-sm text-gray-900">{formatItemDescription(item)}</td>
                <td className="py-3 text-sm text-gray-900 text-right">
                  {item.quantity}
                  {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
                </td>
                <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-sm text-gray-900 text-right">{item.taxRate}%</td>
                <td className="py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">小計</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">消費税</span>
              <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-900">
              <span className="text-gray-900">合計</span>
              <span className="text-gray-900">{formatCurrency(document.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info (for invoices) */}
        {document.type === 'invoice' && companyInfo.bankName && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">お振込先</h3>
            <p className="text-sm text-gray-600">
              {companyInfo.bankName} {companyInfo.bankBranch}
            </p>
            <p className="text-sm text-gray-600">
              {companyInfo.accountType} {companyInfo.accountNumber}
            </p>
            <p className="text-sm text-gray-600">
              口座名義: {companyInfo.accountName}
            </p>
          </div>
        )}

        {/* Receipt specific: Payment method */}
        {document.type === 'receipt' && 'paymentMethod' in document && document.paymentMethod && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600">
              お支払方法: {document.paymentMethod}
            </p>
          </div>
        )}

        {/* Notes */}
        {document.notes && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">備考</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{document.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          この書類は請求書管理アプリで作成されました
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';
