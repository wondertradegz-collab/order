import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Textarea, Select, Button, DateInput } from '../common';
import { LineItemEditor, TotalsSummary } from './LineItemEditor';
import { getTodayString } from '../../utils/format';
import type { Document, LineItem, Customer, DocumentType, Product } from '../../types';

interface DocumentFormProps {
  type: DocumentType;
  customers: Customer[];
  products: Product[];
  defaultTaxRate: number;
  initialData?: Partial<Document>;
  onSubmit: (data: Omit<Document, 'id' | 'documentNumber' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function DocumentForm({
  type,
  customers,
  products,
  defaultTaxRate,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = '保存',
}: DocumentFormProps) {
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || getTodayString());
  const [dueDate, setDueDate] = useState(
    (initialData as any)?.dueDate || getDefaultDueDate()
  );
  const [validUntil, setValidUntil] = useState(
    (initialData as any)?.validUntil || getDefaultValidUntil()
  );
  const [paymentMethod, setPaymentMethod] = useState(
    (initialData as any)?.paymentMethod || ''
  );
  const [proviso, setProviso] = useState(
    (initialData as any)?.proviso || 'お品代として'
  );
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items || [
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: defaultTaxRate,
      },
    ]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');

  function getDefaultDueDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  }

  function getDefaultValidUntil(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseData = {
      type,
      status: status as any,
      customerId,
      issueDate,
      items,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      notes,
    };

    if (type === 'quotation') {
      onSubmit({
        ...baseData,
        validUntil,
      } as any);
    } else if (type === 'invoice') {
      onSubmit({
        ...baseData,
        dueDate,
        paidAmount: (initialData as any)?.paidAmount || 0,
      } as any);
    } else {
      onSubmit({
        ...baseData,
        paymentMethod,
        proviso,
      } as any);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.companyName ? `${c.companyName} (${c.name})` : c.name,
  }));

  const statusOptions = [
    { value: 'draft', label: '下書き' },
    { value: 'sent', label: '送付済み' },
    ...(type === 'invoice'
      ? [
          { value: 'paid', label: '入金済み' },
          { value: 'overdue', label: '期限超過' },
        ]
      : []),
    ...(type === 'receipt' ? [{ value: 'paid', label: '発行済み' }] : []),
    { value: 'cancelled', label: 'キャンセル' },
  ];

  const paymentMethodOptions = [
    { value: '', label: '選択してください' },
    { value: '銀行振込', label: '銀行振込' },
    { value: '現金', label: '現金' },
    { value: 'クレジットカード', label: 'クレジットカード' },
    { value: '口座振替', label: '口座振替' },
    { value: 'その他', label: 'その他' },
  ];

  const provisoOptions = [
    { value: 'お品代として', label: 'お品代として' },
    { value: '商品代金として', label: '商品代金として' },
    { value: 'サービス料として', label: 'サービス料として' },
    { value: 'コンサルティング費用として', label: 'コンサルティング費用として' },
    { value: '業務委託費として', label: '業務委託費として' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="顧客 *"
            options={customerOptions}
            value={customerId}
            onChange={setCustomerId}
            placeholder="顧客を選択"
          />
          <Select
            label="ステータス"
            options={statusOptions}
            value={status}
            onChange={(val) => setStatus(val as any)}
          />
          <DateInput
            label="発行日"
            value={issueDate}
            onChange={(value) => setIssueDate(value)}
          />
          {type === 'quotation' && (
            <DateInput
              label="有効期限"
              value={validUntil}
              onChange={(value) => setValidUntil(value)}
            />
          )}
          {type === 'invoice' && (
            <DateInput
              label="支払期限"
              value={dueDate}
              onChange={(value) => setDueDate(value)}
            />
          )}
          {type === 'receipt' && (
            <>
              <Select
                label="支払方法"
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">但し書き</label>
                <div className="flex gap-2">
                  <select
                    value={provisoOptions.some(o => o.value === proviso) ? proviso : ''}
                    onChange={(e) => e.target.value && setProviso(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択またはカスタム入力</option>
                    {provisoOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={proviso}
                    onChange={(e) => setProviso(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="カスタム但し書き"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">明細</h2>
        <LineItemEditor
          items={items}
          onChange={setItems}
          defaultTaxRate={defaultTaxRate}
          products={products}
        />
        <div className="mt-6">
          <TotalsSummary items={items} />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">備考</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="備考・特記事項があれば入力してください"
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={!customerId || items.length === 0}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
