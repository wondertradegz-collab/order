import { useState } from 'react';
import { Button, Input, Modal } from '../common';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/format';
import type { ItemSet, ItemSetItem } from '../../types';

interface ItemSetFormData {
  name: string;
  description: string;
  items: ItemSetItem[];
}

const emptyItem: ItemSetItem = {
  description: '',
  quantity: 1,
  unit: '式',
  unitPrice: 0,
  taxRate: 10,
};

export function ItemSetEditor() {
  const { itemSets, addItemSet, updateItemSet, deleteItemSet } = useApp();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<ItemSet | null>(null);
  const [formData, setFormData] = useState<ItemSetFormData>({
    name: '',
    description: '',
    items: [{ ...emptyItem }],
  });

  const handleOpenCreate = () => {
    setEditingSet(null);
    setFormData({
      name: '',
      description: '',
      items: [{ ...emptyItem }],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (set: ItemSet) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      description: set.description || '',
      items: [...set.items],
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingSet(null);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (index: number, field: keyof ItemSetItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || formData.items.length === 0) return;

    const validItems = formData.items.filter((item) => item.description.trim());
    if (validItems.length === 0) return;

    if (editingSet) {
      updateItemSet(editingSet.id, {
        name: formData.name,
        description: formData.description || undefined,
        items: validItems,
      });
    } else {
      addItemSet({
        name: formData.name,
        description: formData.description || undefined,
        items: validItems,
      });
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (confirm(t('itemSetEditor.deleteConfirm'))) {
      deleteItemSet(id);
    }
  };

  const calculateSetTotal = (items: ItemSetItem[]) => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const tax = Math.floor(subtotal * (item.taxRate / 100));
      return sum + subtotal + tax;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('itemSetEditor.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('itemSetEditor.description')}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('itemSetEditor.addSet')}
        </Button>
      </div>

      {/* Set List */}
      {itemSets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            {t('itemSetEditor.noSets')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {t('itemSetEditor.noSetsHint')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {itemSets.map((set) => (
            <div
              key={set.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {set.name}
                  </h4>
                  {set.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {set.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(set)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title={t('common.edit')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {set.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                      {item.description}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                      {item.quantity}{item.unit || '個'} × {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {set.items.length}{t('itemSetEditor.itemsCount')}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t('common.total')}: {formatCurrency(calculateSetTotal(set.items))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editingSet ? t('itemSetEditor.editSet') : t('itemSetEditor.newSet')}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('itemSetEditor.setName')}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('itemSetEditor.setNamePlaceholder')}
              required
            />
            <Input
              label={t('itemSetEditor.descriptionOptional')}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('itemSetEditor.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('itemSetEditor.includedItems')}
            </label>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-12 md:col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        placeholder={t('lineItems.itemDescription')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={item.unit || ''}
                          onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                          placeholder="単位"
                          className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="単価"
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <select
                        value={item.taxRate}
                        onChange={(e) => handleUpdateItem(index, 'taxRate', parseInt(e.target.value))}
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10%</option>
                        <option value={8}>8%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                        className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('itemSetEditor.addItemToSet')}
            </button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.total')}: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculateSetTotal(formData.items))}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim() || formData.items.every((i) => !i.description.trim())}
              >
                {editingSet ? t('itemSetEditor.update') : t('common.create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
