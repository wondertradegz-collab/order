import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button, Input, Modal, ConfirmModal } from '../components/common';
import { formatDate } from '../utils/format';
import type { Memo, TaskPriority, DocumentType } from '../types';

type FilterType = 'all' | 'memos' | 'tasks' | 'incomplete';

export function Memos() {
  const {
    memos,
    addMemo,
    updateMemo,
    deleteMemo,
    toggleMemoComplete,
    customers,
    documents,
    getCustomer
  } = useApp();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredMemos = useMemo(() => {
    let result = memos;

    // Apply type filter
    switch (filter) {
      case 'memos':
        result = result.filter(m => !m.isTask);
        break;
      case 'tasks':
        result = result.filter(m => m.isTask);
        break;
      case 'incomplete':
        result = result.filter(m => m.isTask && !m.completed);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.content?.toLowerCase().includes(query)
      );
    }

    // Sort by priority (high first), then by due date, then by created date
    return result.sort((a, b) => {
      // Priority order: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If both have due dates, sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // Items with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Sort by created date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [memos, filter, searchQuery]);

  const handleOpenModal = (memo?: Memo) => {
    setEditingMemo(memo || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMemo(null);
  };

  const handleSave = (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMemo) {
      updateMemo(editingMemo.id, data);
    } else {
      addMemo(data);
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMemo(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('memos.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('memos.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setEditingMemo(null); setIsModalOpen(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('memos.addMemo')}
          </Button>
          <Button onClick={() => { setEditingMemo({ isTask: true } as Memo); setIsModalOpen(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {t('memos.addTask')}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'memos', 'tasks', 'incomplete'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t(`memos.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Memo List */}
      {filteredMemos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('memos.noMemos')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('memos.addFirstMemo')}</p>
          <Button onClick={() => handleOpenModal()}>{t('memos.addMemo')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemos.map((memo) => {
            const customer = memo.customerId ? getCustomer(memo.customerId) : null;
            const linkedDoc = memo.documentId ? documents.find(d => d.id === memo.documentId) : null;

            return (
              <div
                key={memo.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-all ${
                  memo.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for tasks */}
                  {memo.isTask && (
                    <button
                      onClick={() => toggleMemoComplete(memo.id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        memo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {memo.completed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium text-gray-900 dark:text-white ${memo.completed ? 'line-through' : ''}`}>
                        {memo.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(memo.priority)}`}>
                        {t(`memos.priority${memo.priority.charAt(0).toUpperCase() + memo.priority.slice(1)}`)}
                      </span>
                      {!memo.isTask && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {t('memos.memo')}
                        </span>
                      )}
                      {memo.isTask && memo.dueDate && isOverdue(memo.dueDate) && !memo.completed && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {t('status.overdue')}
                        </span>
                      )}
                    </div>

                    {memo.content && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {memo.content}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      {memo.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(memo.dueDate) && !memo.completed ? 'text-red-500' : ''}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('memos.dueDate')}: {formatDate(memo.dueDate)}
                        </span>
                      )}
                      {customer && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {customer.name}
                        </span>
                      )}
                      {linkedDoc && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {linkedDoc.documentNumber}
                        </span>
                      )}
                      <span>{formatDate(memo.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(memo)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(memo)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Memo Form Modal */}
      <MemoFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        memo={editingMemo}
        customers={customers}
        documents={documents}
        t={t}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('memos.deleteConfirm')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}

interface MemoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  memo: Memo | null;
  customers: { id: string; name: string }[];
  documents: { id: string; documentNumber: string; type: DocumentType }[];
  t: (key: string) => string;
}

function MemoFormModal({ isOpen, onClose, onSave, memo, customers, documents, t }: MemoFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isTask: false,
    completed: false,
    dueDate: '',
    priority: 'medium' as TaskPriority,
    customerId: '',
    documentId: '',
    documentType: undefined as DocumentType | undefined,
  });

  useEffect(() => {
    if (isOpen) {
      if (memo && memo.id) {
        setFormData({
          title: memo.title,
          content: memo.content || '',
          isTask: memo.isTask,
          completed: memo.completed,
          dueDate: memo.dueDate || '',
          priority: memo.priority,
          customerId: memo.customerId || '',
          documentId: memo.documentId || '',
          documentType: memo.documentType,
        });
      } else {
        setFormData({
          title: '',
          content: '',
          isTask: memo?.isTask || false,
          completed: false,
          dueDate: '',
          priority: 'medium',
          customerId: '',
          documentId: '',
          documentType: undefined,
        });
      }
    }
  }, [isOpen, memo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDoc = documents.find(d => d.id === formData.documentId);
    onSave({
      ...formData,
      documentType: selectedDoc?.type,
      dueDate: formData.dueDate || undefined,
      customerId: formData.customerId || undefined,
      documentId: formData.documentId || undefined,
    });
  };

  const isEditing = memo && memo.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing
        ? (formData.isTask ? t('memos.editTask') : t('memos.editMemo'))
        : (formData.isTask ? t('memos.addTask') : t('memos.addMemo'))
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('memos.type')}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isTask: false })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                !formData.isTask
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('memos.memo')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isTask: true })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                formData.isTask
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('memos.task')}
            </button>
          </div>
        </div>

        <Input
          label={t('memos.memoTitle') + ' *'}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('memos.content')}
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('memos.priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">{t('memos.priorityLow')}</option>
              <option value="medium">{t('memos.priorityMedium')}</option>
              <option value="high">{t('memos.priorityHigh')}</option>
            </select>
          </div>

          {formData.isTask && (
            <Input
              label={t('memos.dueDate')}
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('memos.linkCustomer')}
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('memos.noLink')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('memos.linkDocument')}
            </label>
            <select
              value={formData.documentId}
              onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('memos.noLink')}</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.documentNumber}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
