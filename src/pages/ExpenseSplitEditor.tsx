import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button, Input, Modal, Badge } from '../components/common';
import { formatCurrency, formatDate } from '../utils/format';
import type {
  ExpenseSplit,
  ExpenseSplitParticipant,
  ExpenseSplitItem,
  ExpenseSplitStatus,
} from '../types';

interface Props {
  mode: 'create' | 'edit';
}

export function ExpenseSplitEditor({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    expenseSplits,
    addExpenseSplit,
    updateExpenseSplit,
    customers,
    generateInvoiceForParticipant,
    updateParticipantPayment,
  } = useApp();
  const { t } = useLanguage();

  const existingSplit = mode === 'edit' && id ? expenseSplits.find((s) => s.id === id) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<ExpenseSplitParticipant[]>([]);
  const [items, setItems] = useState<ExpenseSplitItem[]>([]);
  const [paidByParticipantId, setPaidByParticipantId] = useState<string>('');
  const [status, setStatus] = useState<ExpenseSplitStatus>('draft');

  // Modals
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ExpenseSplitParticipant | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseSplitItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceTargetParticipant, setInvoiceTargetParticipant] = useState<ExpenseSplitParticipant | null>(null);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Load existing data
  useEffect(() => {
    if (existingSplit) {
      setName(existingSplit.name);
      setDescription(existingSplit.description || '');
      setParticipants(existingSplit.participants);
      setItems(existingSplit.items);
      setPaidByParticipantId(existingSplit.paidByParticipantId || '');
      setStatus(existingSplit.status);
    }
  }, [existingSplit]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [items]);

  // Recalculate participant totals when items change
  const recalculateParticipantTotals = useCallback(() => {
    setParticipants((prev) =>
      prev.map((p) => {
        const total = items.reduce((sum, item) => {
          const split = item.splits.find((s) => s.participantId === p.id);
          return sum + (split?.amount || 0);
        }, 0);
        return { ...p, totalAmount: total };
      })
    );
  }, [items]);

  useEffect(() => {
    recalculateParticipantTotals();
  }, [items, recalculateParticipantTotals]);

  // Participant CRUD
  const handleAddParticipant = (participant: Omit<ExpenseSplitParticipant, 'id' | 'totalAmount' | 'invoiceIssued' | 'paymentReceived'>) => {
    const newParticipant: ExpenseSplitParticipant = {
      ...participant,
      id: uuidv4(),
      totalAmount: 0,
      invoiceIssued: false,
      paymentReceived: false,
    };
    setParticipants((prev) => [...prev, newParticipant]);
    setIsParticipantModalOpen(false);
  };

  const handleUpdateParticipant = (participant: ExpenseSplitParticipant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participant.id ? participant : p))
    );
    setEditingParticipant(null);
    setIsParticipantModalOpen(false);
  };

  const handleDeleteParticipant = (participantId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    // Remove from all item splits
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        splits: item.splits.filter((s) => s.participantId !== participantId),
      }))
    );
  };

  // Item CRUD
  const handleAddItem = (item: Omit<ExpenseSplitItem, 'id'>) => {
    const newItem: ExpenseSplitItem = {
      ...item,
      id: uuidv4(),
    };
    setItems((prev) => [...prev, newItem]);
    setIsItemModalOpen(false);
  };

  const handleUpdateItem = (item: ExpenseSplitItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setEditingItem(null);
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Save
  const handleSave = () => {
    const splitData: Omit<ExpenseSplit, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || undefined,
      participants,
      items,
      totalAmount,
      paidByParticipantId: paidByParticipantId || undefined,
      status,
    };

    if (mode === 'edit' && id) {
      updateExpenseSplit(id, splitData);
    } else {
      addExpenseSplit(splitData);
    }

    navigate('/expense-splits');
  };

  // Generate invoice for participant
  const handleGenerateInvoice = () => {
    if (!invoiceTargetParticipant || !id) return;

    const invoice = generateInvoiceForParticipant(
      id,
      invoiceTargetParticipant.id,
      invoiceDueDate,
      invoiceNotes || undefined
    );

    if (invoice) {
      // Reload the split data
      const updatedSplit = expenseSplits.find((s) => s.id === id);
      if (updatedSplit) {
        setParticipants(updatedSplit.participants);
        setStatus(updatedSplit.status);
      }
    }

    setIsInvoiceModalOpen(false);
    setInvoiceTargetParticipant(null);
    setInvoiceDueDate('');
    setInvoiceNotes('');
  };

  // Toggle payment status
  const handleTogglePayment = (participantId: string, paymentReceived: boolean) => {
    if (mode === 'edit' && id) {
      const paymentDate = paymentReceived ? new Date().toISOString().split('T')[0] : undefined;
      updateParticipantPayment(id, participantId, paymentReceived, paymentDate);

      // Reload the split data
      setTimeout(() => {
        const updatedSplit = expenseSplits.find((s) => s.id === id);
        if (updatedSplit) {
          setParticipants(updatedSplit.participants);
          setStatus(updatedSplit.status);
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? t('expenseSplit.create') : t('expenseSplit.edit')}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{t('expenseSplit.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/expense-splits')} className="flex-1 sm:flex-none min-h-[44px]">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name || participants.length === 0} className="flex-1 sm:flex-none min-h-[44px]">
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('expenseSplit.basicInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('expenseSplit.name') + ' *'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('expenseSplit.namePlaceholder')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('expenseSplit.paidBy')}
            </label>
            <select
              value={paidByParticipantId}
              onChange={(e) => setPaidByParticipantId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('expenseSplit.selectPaidBy')}</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Input
            label={t('common.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('expenseSplit.descriptionPlaceholder')}
          />
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('expenseSplit.participants')}</h2>
          <Button size="sm" onClick={() => { setEditingParticipant(null); setIsParticipantModalOpen(true); }} className="w-full sm:w-auto min-h-[44px]">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('expenseSplit.addParticipant')}
          </Button>
        </div>

        {participants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('expenseSplit.noParticipants')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.participantName')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.linkedCustomer')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.totalShare')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.invoiceStatus')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.paymentStatus')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {participants.map((p) => {
                  const customer = customers.find((c) => c.id === p.customerId);
                  const isPayer = p.id === paidByParticipantId;
                  return (
                    <tr key={p.id} className={isPayer ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                          {isPayer && (
                            <Badge color="blue">{t('expenseSplit.payer')}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {customer ? customer.name : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.invoiceIssued ? (
                          <Badge color="green">{t('expenseSplit.issued')}</Badge>
                        ) : p.customerId && p.totalAmount > 0 && mode === 'edit' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setInvoiceTargetParticipant(p);
                              setIsInvoiceModalOpen(true);
                            }}
                          >
                            {t('expenseSplit.issueInvoice')}
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.totalAmount > 0 ? (
                          <button
                            onClick={() => handleTogglePayment(p.id, !p.paymentReceived)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              p.paymentReceived
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                            }`}
                            disabled={mode !== 'edit'}
                          >
                            {p.paymentReceived && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setEditingParticipant(p); setIsParticipantModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('expenseSplit.expenseItems')}</h2>
          <Button
            size="sm"
            onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
            disabled={participants.length === 0}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('expenseSplit.addItem')}
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {participants.length === 0 ? t('expenseSplit.addParticipantsFirst') : t('expenseSplit.noItems')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.date')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.description')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.total')}</th>
                  {participants.map((p) => (
                    <th key={p.id} className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {p.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('expenseSplit.receipt')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    {participants.map((p) => {
                      const split = item.splits.find((s) => s.participantId === p.id);
                      return (
                        <td key={p.id} className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                          {split && split.amount > 0 ? formatCurrency(split.amount) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {item.receiptUrl ? (
                        <a
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : item.receiptImage ? (
                        <span className="text-green-600 dark:text-green-400">
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                  <td className="px-4 py-3" colSpan={2}>{t('common.total')}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {formatCurrency(totalAmount)}
                  </td>
                  {participants.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatCurrency(p.totalAmount)}
                    </td>
                  ))}
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participant Modal */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => { setIsParticipantModalOpen(false); setEditingParticipant(null); }}
        onSave={editingParticipant ? handleUpdateParticipant : handleAddParticipant}
        participant={editingParticipant}
        customers={customers}
        t={t}
      />

      {/* Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => { setIsItemModalOpen(false); setEditingItem(null); }}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        item={editingItem}
        participants={participants}
        t={t}
      />

      {/* Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => { setIsInvoiceModalOpen(false); setInvoiceTargetParticipant(null); }}
        title={t('expenseSplit.generateInvoice')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {invoiceTargetParticipant?.name} {t('expenseSplit.invoiceFor')} {formatCurrency(invoiceTargetParticipant?.totalAmount || 0)}
          </p>
          <Input
            label={t('documents.dueDate') + ' *'}
            type="date"
            value={invoiceDueDate}
            onChange={(e) => setInvoiceDueDate(e.target.value)}
          />
          <Input
            label={t('common.notes')}
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            placeholder={t('expenseSplit.invoiceNotesPlaceholder')}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)} className="w-full sm:w-auto min-h-[44px]">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={!invoiceDueDate} className="w-full sm:w-auto min-h-[44px]">
              {t('expenseSplit.generateInvoice')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Participant Modal Component
interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participant: any) => void;
  participant: ExpenseSplitParticipant | null;
  customers: { id: string; name: string; companyName?: string }[];
  t: (key: string) => string;
}

function ParticipantModal({ isOpen, onClose, onSave, participant, customers, t }: ParticipantModalProps) {
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (participant) {
        setName(participant.name);
        setCustomerId(participant.customerId || '');
      } else {
        setName('');
        setCustomerId('');
      }
    }
  }, [isOpen, participant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (participant) {
      onSave({
        ...participant,
        name,
        customerId: customerId || undefined,
      });
    } else {
      onSave({
        name,
        customerId: customerId || undefined,
      });
    }
  };

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    if (cId && !name) {
      const customer = customers.find((c) => c.id === cId);
      if (customer) {
        setName(customer.companyName || customer.name);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={participant ? t('expenseSplit.editParticipant') : t('expenseSplit.addParticipant')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('expenseSplit.participantName') + ' *'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t('expenseSplit.participantNamePlaceholder')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenseSplit.linkedCustomer')}
          </label>
          <select
            value={customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('expenseSplit.noCustomerLink')}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('expenseSplit.customerLinkHelp')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto min-h-[44px]">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!name} className="w-full sm:w-auto min-h-[44px]">
            {participant ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Item Modal Component
interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  item: ExpenseSplitItem | null;
  participants: ExpenseSplitParticipant[];
  t: (key: string) => string;
}

function ItemModal({ isOpen, onClose, onSave, item, participants, t }: ItemModalProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [splits, setSplits] = useState<{ participantId: string; amount: number }[]>([]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setDate(item.date);
        setDescription(item.description);
        setTotalAmount(item.totalAmount);
        setSplits(item.splits);
        setReceiptUrl(item.receiptUrl || '');
        setSplitMethod('custom');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setTotalAmount(0);
        setSplits(participants.map((p) => ({ participantId: p.id, amount: 0 })));
        setReceiptUrl('');
        setSplitMethod('equal');
      }
    }
  }, [isOpen, item, participants]);

  // Auto-split equally when total changes and split method is equal
  useEffect(() => {
    if (splitMethod === 'equal' && totalAmount > 0 && participants.length > 0) {
      const equalShare = Math.floor(totalAmount / participants.length);
      const remainder = totalAmount - (equalShare * participants.length);
      setSplits(
        participants.map((p, i) => ({
          participantId: p.id,
          amount: equalShare + (i < remainder ? 1 : 0),
        }))
      );
    }
  }, [totalAmount, splitMethod, participants]);

  const handleSplitChange = (participantId: string, amount: number) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.participantId === participantId ? { ...s, amount } : s
      )
    );
    setSplitMethod('custom');
  };

  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValid = date && description && totalAmount > 0 && splitTotal === totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      onSave({
        ...item,
        date,
        description,
        totalAmount,
        splits,
        receiptUrl: receiptUrl || undefined,
      });
    } else {
      onSave({
        date,
        description,
        totalAmount,
        splits,
        receiptUrl: receiptUrl || undefined,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t('expenseSplit.editItem') : t('expenseSplit.addItem')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('common.date') + ' *'}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label={t('common.total') + ' (¥) *'}
            type="number"
            value={totalAmount || ''}
            onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
            required
          />
        </div>
        <Input
          label={t('common.description') + ' *'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder={t('expenseSplit.itemDescriptionPlaceholder')}
        />
        <Input
          label={t('expenseSplit.receiptUrl')}
          value={receiptUrl}
          onChange={(e) => setReceiptUrl(e.target.value)}
          placeholder="https://..."
        />

        {/* Split Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('expenseSplit.splitAmounts')}
            </label>
            <button
              type="button"
              onClick={() => {
                if (totalAmount > 0 && participants.length > 0) {
                  const equalShare = Math.floor(totalAmount / participants.length);
                  const remainder = totalAmount - (equalShare * participants.length);
                  setSplits(
                    participants.map((p, i) => ({
                      participantId: p.id,
                      amount: equalShare + (i < remainder ? 1 : 0),
                    }))
                  );
                  setSplitMethod('equal');
                }
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('expenseSplit.splitEqually')}
            </button>
          </div>
          <div className="space-y-2">
            {participants.map((p) => {
              const split = splits.find((s) => s.participantId === p.id);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                  <Input
                    type="number"
                    value={split?.amount || ''}
                    onChange={(e) => handleSplitChange(p.id, parseInt(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">円</span>
                </div>
              );
            })}
          </div>
          <div className={`mt-2 text-sm ${splitTotal === totalAmount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {t('expenseSplit.splitTotal')}: {formatCurrency(splitTotal)} / {formatCurrency(totalAmount)}
            {splitTotal !== totalAmount && ` (${t('expenseSplit.splitMismatch')})`}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto min-h-[44px]">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!isValid} className="w-full sm:w-auto min-h-[44px]">
            {item ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
