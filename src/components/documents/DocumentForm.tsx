import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Textarea, Select, Button, DateInput } from '../common';
import { LineItemEditor, TotalsSummary } from './LineItemEditor';
import { getTodayString } from '../../utils/format';
import { useLanguage } from '../../contexts/LanguageContext';
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
  submitLabel,
}: DocumentFormProps) {
  const { t } = useLanguage();
  const actualSubmitLabel = submitLabel || t('common.save');
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
    (initialData as any)?.proviso || t('documentForm.provisoAsGoods')
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
    { value: 'draft', label: t('status.draft') },
    { value: 'sent', label: t('status.sent') },
    ...(type === 'invoice'
      ? [
          { value: 'paid', label: t('status.paid') },
          { value: 'overdue', label: t('status.overdue') },
        ]
      : []),
    ...(type === 'receipt' ? [{ value: 'paid', label: t('documentForm.receiptIssued') }] : []),
    { value: 'cancelled', label: t('status.cancelled') },
  ];

  const paymentMethodOptions = [
    { value: '', label: t('documentForm.pleaseSelect') },
    { value: 'bankTransfer', label: t('paymentMethods.bankTransfer') },
    { value: 'cash', label: t('paymentMethods.cash') },
    { value: 'creditCard', label: t('paymentMethods.creditCard') },
    { value: 'directDebit', label: t('paymentMethods.directDebit') },
    { value: 'other', label: t('paymentMethods.other') },
  ];

  const provisoOptions = [
    { value: t('documentForm.provisoAsGoods'), label: t('documentForm.provisoAsGoods') },
    { value: t('documentForm.provisoAsProducts'), label: t('documentForm.provisoAsProducts') },
    { value: t('documentForm.provisoAsService'), label: t('documentForm.provisoAsService') },
    { value: t('documentForm.provisoAsConsulting'), label: t('documentForm.provisoAsConsulting') },
    { value: t('documentForm.provisoAsOutsourcing'), label: t('documentForm.provisoAsOutsourcing') },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('documentForm.basicInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={`${t('documents.customer')} *`}
            options={customerOptions}
            value={customerId}
            onChange={setCustomerId}
            placeholder={t('documentForm.selectCustomer')}
          />
          <Select
            label={t('common.status')}
            options={statusOptions}
            value={status}
            onChange={(val) => setStatus(val as any)}
          />
          <DateInput
            label={t('documents.issueDate')}
            value={issueDate}
            onChange={(value) => setIssueDate(value)}
          />
          {type === 'quotation' && (
            <DateInput
              label={t('documents.validUntil')}
              value={validUntil}
              onChange={(value) => setValidUntil(value)}
            />
          )}
          {type === 'invoice' && (
            <DateInput
              label={t('documents.dueDate')}
              value={dueDate}
              onChange={(value) => setDueDate(value)}
            />
          )}
          {type === 'receipt' && (
            <>
              <Select
                label={t('documents.paymentMethod')}
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('documentForm.proviso')}</label>
                <div className="flex gap-2">
                  <select
                    value={provisoOptions.some(o => o.value === proviso) ? proviso : ''}
                    onChange={(e) => e.target.value && setProviso(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('documentForm.selectOrCustom')}</option>
                    {provisoOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={proviso}
                    onChange={(e) => setProviso(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('documentForm.customProviso')}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.lineItems')}</h2>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('common.notes')}</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('documentForm.notesPlaceholder')}
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!customerId || items.length === 0}>
          {actualSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
