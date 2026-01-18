import { forwardRef } from 'react';
import { formatDate, getDocumentTypeLabel } from '../../utils/format';
import type { Document, Customer, CompanyInfo, LineItem, Receipt, ElectronicStamp } from '../../types';

interface DocumentPreviewProps {
  document: Document;
  customer: Customer | undefined;
  companyInfo: CompanyInfo;
  stamps?: ElectronicStamp[];
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
  if (item.foreignAmount && item.exchangeRate && item.foreignCurrency) {
    const symbol = CURRENCY_SYMBOLS[item.foreignCurrency] || item.foreignCurrency;
    desc += `(${item.foreignAmount}${symbol} × ${item.exchangeRate}円)`;
  }
  return desc;
};

const formatNumber = (num: number): string => {
  return '¥' + num.toLocaleString('ja-JP');
};

// Stamp Component
const StampDisplay = ({ stamp }: { stamp: ElectronicStamp }) => {
  const today = new Date();
  const dateStr = `${today.getFullYear().toString().slice(2)}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  const baseStyle: React.CSSProperties = {
    width: `${stamp.size}px`,
    height: `${stamp.size}px`,
    border: `2px solid ${stamp.color}`,
    color: stamp.color,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${stamp.size / 4}px`,
    fontWeight: 'bold',
    lineHeight: 1.2,
  };

  if (stamp.shape === 'circle') {
    baseStyle.borderRadius = '50%';
  } else {
    baseStyle.borderRadius = '4px';
  }

  return (
    <div style={baseStyle}>
      <span style={{ fontSize: `${stamp.size / 3}px` }}>{stamp.text}</span>
      {stamp.showDate && (
        <span style={{ fontSize: `${stamp.size / 5}px` }}>{dateStr}</span>
      )}
    </div>
  );
};

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ document, customer, companyInfo, stamps = [] }, ref) => {
    // Separate taxable and non-taxable items
    const taxableItems = document.items.filter((item) => item.taxRate > 0);
    const nonTaxableItems = document.items.filter((item) => item.taxRate === 0);

    // Calculate totals by tax rate
    const taxableSubtotal = taxableItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const nonTaxableSubtotal = nonTaxableItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = taxableItems.reduce(
      (sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)),
      0
    );

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

    const getProviso = () => {
      if (document.type === 'receipt' && 'proviso' in document) {
        return (document as Receipt).proviso;
      }
      return null;
    };

    // Create dynamic row items - just pad to minimum visible rows if needed
    const minRows = Math.max(document.items.length, 5);
    const paddedItems = [...document.items];
    while (paddedItems.length < minRows) {
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
              下記のとおりご{document.type === 'quotation' ? '見積' : document.type === 'receipt' ? '領収' : '請求'}申し上げます。<br />
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
                <p>{companyInfo.bankName} {companyInfo.bankBranch}</p>
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

            {/* Receipt: Revenue Stamp indication for amounts >= 50,000 yen */}
            {document.type === 'receipt' && document.total >= 50000 && (
              <div className="border border-dashed border-gray-400 mt-3 p-2 text-center">
                <p className="text-xs text-gray-600">収入印紙</p>
                <p className="text-xs text-gray-400 mt-1">
                  {document.total >= 5000000 ? '¥10,000' : document.total >= 1000000 ? '¥2,000' : '¥200'}
                </p>
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

            {/* Company Info with Logo */}
            <div className="text-right mb-4">
              {companyInfo.logoUrl && (
                <img
                  src={companyInfo.logoUrl}
                  alt="Company logo"
                  className="w-20 h-20 object-contain ml-auto mb-2"
                />
              )}
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
                    <td className="border border-black h-16 p-1 align-middle">
                      {stamps[0] && <StampDisplay stamp={stamps[0]} />}
                    </td>
                    <td className="border border-black h-16 p-1 align-middle">
                      {stamps[1] && <StampDisplay stamp={stamps[1]} />}
                    </td>
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
              <th className="border border-black px-1 py-1 w-12 text-center">税</th>
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
                  <td className="border border-black px-1 py-1 text-center text-xs">
                    {isRealItem && item.quantity > 0 ? (item.taxRate > 0 ? '課税' : '非課税') : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tax Summary Section */}
        <div className="flex justify-end mb-4">
          <table className="border-collapse text-xs" style={{ width: '300px' }}>
            <tbody>
              {/* Taxable subtotal */}
              {taxableSubtotal > 0 && (
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-50">課税対象小計</td>
                  <td className="border border-black px-2 py-1 text-right">{formatNumber(taxableSubtotal)}</td>
                </tr>
              )}
              {/* Non-taxable subtotal */}
              {nonTaxableSubtotal > 0 && (
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-50">非課税対象小計</td>
                  <td className="border border-black px-2 py-1 text-right">{formatNumber(nonTaxableSubtotal)}</td>
                </tr>
              )}
              {/* Tax amount */}
              <tr>
                <td className="border border-black px-2 py-1 bg-gray-50">消費税（10%）</td>
                <td className="border border-black px-2 py-1 text-right">{formatNumber(taxAmount)}</td>
              </tr>
              {/* Total */}
              <tr className="font-bold">
                <td className="border border-black px-2 py-1 bg-gray-100">合計金額</td>
                <td className="border border-black px-2 py-1 text-right bg-gray-100">{formatNumber(document.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

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

        {/* Additional Notes */}
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
