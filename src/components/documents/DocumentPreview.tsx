import { forwardRef } from 'react';
import { formatDate, getDocumentTypeLabel } from '../../utils/format';
import type { Document, Customer, CompanyInfo, LineItem, Receipt } from '../../types';

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
  let desc = item.description || '';
  // Add foreign currency calculation if present
  if (item.foreignAmount && item.exchangeRate && item.foreignCurrency) {
    const symbol = CURRENCY_SYMBOLS[item.foreignCurrency] || item.foreignCurrency;
    desc += `(${item.foreignAmount}${symbol} × ${item.exchangeRate}円)`;
  }
  return desc;
};

const formatNumber = (num: number): string => {
  return '¥' + num.toLocaleString('ja-JP');
};

// Empty rows to fill table to 20 items
const TOTAL_ROWS = 20;

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ document, customer, companyInfo }, ref) => {
    const taxAmount = document.items.reduce(
      (sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)),
      0
    );

    // Get document title based on type
    const getDocumentTitle = () => {
      switch (document.type) {
        case 'quotation':
          return 'ご見積書';
        case 'invoice':
          return 'ご請求書';
        case 'receipt':
          return '領収書';
      }
    };

    // Get receipt proviso if available
    const getProviso = () => {
      if (document.type === 'receipt' && 'proviso' in document) {
        return (document as Receipt).proviso;
      }
      return null;
    };

    // Create array of items padded to TOTAL_ROWS
    const paddedItems = [...document.items];
    while (paddedItems.length < TOTAL_ROWS) {
      paddedItems.push({
        id: `empty-${paddedItems.length}`,
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 0,
      });
    }

    return (
      <div
        ref={ref}
        className="bg-white p-6 max-w-4xl mx-auto text-sm"
        style={{
          fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
          fontSize: '11px',
          lineHeight: '1.4',
        }}
      >
        {/* Document Title */}
        <h1 className="text-2xl font-bold text-center mb-6 tracking-widest border-b-2 border-black pb-2">
          {getDocumentTitle()}
        </h1>

        {/* Header Section */}
        <div className="flex justify-between mb-4">
          {/* Left: Customer Info */}
          <div className="w-1/2">
            <div className="border-b border-black pb-1 mb-2">
              <p className="font-semibold">
                {customer?.companyName || customer?.name || ''}様
              </p>
            </div>

            {/* Subject/Title */}
            {document.notes && (
              <div className="border border-black px-2 py-1 mb-2 font-bold text-base">
                {document.notes.split('\n')[0]}
              </div>
            )}

            <p className="text-xs mb-2">
              下記のとおりご請求申し上げます。<br />
              何卒、宜しくお願い申し上げます。
            </p>

            {/* Total Amount Box */}
            <div className="border-2 border-black px-3 py-2 mb-3">
              <span className="text-2xl font-bold">{formatNumber(document.total)}</span>
            </div>

            {/* Bank Info (for invoices) */}
            {document.type === 'invoice' && companyInfo.bankName && (
              <div className="border-t border-black pt-2 text-xs">
                <p className="font-semibold mb-1">お振込先</p>
                <p>{companyInfo.bankName}　{companyInfo.bankBranch}</p>
                <p>支店番号{companyInfo.bankBranch?.match(/\d+/)?.[0] || ''}</p>
                <p>{companyInfo.accountType} {companyInfo.accountNumber}</p>
                <p>{companyInfo.accountName}</p>
              </div>
            )}

            {/* Receipt specific: Proviso */}
            {getProviso() && (
              <div className="border-t border-black pt-2 text-xs mt-2">
                <p>但し、{getProviso()}</p>
              </div>
            )}
          </div>

          {/* Right: Document Info & Company Info */}
          <div className="w-1/2 pl-8">
            <div className="flex justify-between mb-2 text-xs">
              <span></span>
              <div className="text-right">
                <p>{getDocumentTypeLabel(document.type).replace('書', '')}No.{document.documentNumber}</p>
                <p>{formatDate(document.issueDate, 'long')}</p>
              </div>
            </div>

            {/* Company Info */}
            <div className="text-right mb-4">
              <p className="font-semibold">{companyInfo.name || ''}</p>
              {companyInfo.address && <p className="text-xs">{companyInfo.address}</p>}
              {companyInfo.registrationNumber && (
                <p className="text-xs">登録番号：{companyInfo.registrationNumber}</p>
              )}
            </div>

            {/* Stamp Area */}
            <div className="flex justify-end">
              <table className="border-collapse text-center text-xs">
                <thead>
                  <tr>
                    <th className="border border-black w-16 px-2 py-1">承認</th>
                    <th className="border border-black w-16 px-2 py-1">担当</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black h-16"></td>
                    <td className="border border-black h-16"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse text-xs mb-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-1 py-1 w-8 text-center">No.</th>
              <th className="border border-black px-2 py-1 text-left">項目</th>
              <th className="border border-black px-1 py-1 w-12 text-center">数量</th>
              <th className="border border-black px-1 py-1 w-10 text-center">単位</th>
              <th className="border border-black px-2 py-1 w-20 text-right">単価</th>
              <th className="border border-black px-2 py-1 w-20 text-right">小計</th>
              <th className="border border-black px-2 py-1 w-24 text-left">備考</th>
            </tr>
          </thead>
          <tbody>
            {paddedItems.map((item, index) => {
              const isRealItem = index < document.items.length;
              const itemSubtotal = item.quantity * item.unitPrice;

              return (
                <tr key={item.id}>
                  <td className="border border-black px-1 py-1 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {isRealItem ? formatItemDescription(item) : ''}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {isRealItem && item.quantity > 0 ? item.quantity : ''}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {isRealItem ? (item.unit || '') : ''}
                  </td>
                  <td className="border border-black px-2 py-1 text-right">
                    {isRealItem && item.unitPrice > 0 ? formatNumber(item.unitPrice) : ''}
                  </td>
                  <td className="border border-black px-2 py-1 text-right">
                    {isRealItem && itemSubtotal > 0 ? formatNumber(itemSubtotal) : ''}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {/* Notes column - can be used for tax rate indication */}
                  </td>
                </tr>
              );
            })}

            {/* Tax Row */}
            <tr>
              <td className="border border-black px-1 py-1 text-center">
                {TOTAL_ROWS + 1}
              </td>
              <td className="border border-black px-2 py-1 text-center">
                消費税10%
              </td>
              <td className="border border-black px-1 py-1"></td>
              <td className="border border-black px-1 py-1"></td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-2 py-1 text-right">
                {formatNumber(taxAmount)}
              </td>
              <td className="border border-black px-2 py-1"></td>
            </tr>

            {/* Total Row */}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-black px-1 py-1 text-center">計</td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-1 py-1"></td>
              <td className="border border-black px-1 py-1"></td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-2 py-1 text-right">
                {formatNumber(document.total)}
              </td>
              <td className="border border-black px-2 py-1"></td>
            </tr>
          </tbody>
        </table>

        {/* Due Date (for invoices) */}
        {document.type === 'invoice' && 'dueDate' in document && (
          <div className="text-xs mt-2">
            <p>お支払期限: {formatDate(document.dueDate, 'long')}</p>
          </div>
        )}

        {/* Quotation validity */}
        {document.type === 'quotation' && 'validUntil' in document && document.validUntil && (
          <div className="text-xs mt-2">
            <p>見積有効期限: {formatDate(document.validUntil, 'long')}</p>
          </div>
        )}

        {/* Additional Notes (excluding first line which is used as subject) */}
        {document.notes && document.notes.split('\n').length > 1 && (
          <div className="text-xs mt-4 border-t border-gray-300 pt-2">
            <p className="font-semibold mb-1">備考</p>
            <p className="whitespace-pre-wrap">{document.notes.split('\n').slice(1).join('\n')}</p>
          </div>
        )}
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';
