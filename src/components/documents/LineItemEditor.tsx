import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '../common';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/format';
import type { LineItem, Product, ItemSet, Customer, ItemCategory } from '../../types';
import { ITEM_CATEGORY_LABELS } from '../../types';

interface LineItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  defaultTaxRate: number;
  products?: Product[];
  customer?: Customer; // 顧客（為替レート・通貨のデフォルト値用）
}

const CURRENCY_OPTIONS = [
  { code: 'CNY', symbol: '元' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'KRW', symbol: '₩' },
  { code: 'TWD', symbol: 'NT$' },
];

export function LineItemEditor({ items, onChange, defaultTaxRate, products = [], customer }: LineItemEditorProps) {
  const { itemSets } = useApp();
  const { t } = useLanguage();
  const [showProductSelector, setShowProductSelector] = useState<string | null>(null);
  const [showItemSetSelector, setShowItemSetSelector] = useState(false);
  const [foreignCurrencyMode, setForeignCurrencyMode] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    onChange(newItems);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const addItem = (category: ItemCategory = 'revenue') => {
    onChange([
      ...items,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: defaultTaxRate,
        category,
      },
    ]);
  };

  const addForeignCurrencyItem = (category: ItemCategory = 'expense_reimbursement') => {
    const newId = uuidv4();
    // 顧客のデフォルト為替レート・通貨を使用
    const defaultCurrency = customer?.defaultCurrency || 'CNY';
    const defaultExchangeRate = customer?.defaultExchangeRate || 0;
    onChange([
      ...items,
      {
        id: newId,
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: defaultTaxRate,
        category, // 外貨立替はデフォルトで「立替経費」
        foreignAmount: 0,
        exchangeRate: defaultExchangeRate,
        foreignCurrency: defaultCurrency,
      },
    ]);
    setForeignCurrencyMode(new Set([...foreignCurrencyMode, newId]));
  };

  // 作業セットから明細を追加
  const addFromItemSet = (itemSet: ItemSet) => {
    const newItems = itemSet.items.map((setItem) => ({
      id: uuidv4(),
      description: setItem.description,
      quantity: setItem.quantity,
      unit: setItem.unit,
      unitPrice: setItem.unitPrice,
      taxRate: setItem.taxRate,
      taxCategory: setItem.taxCategory,
      category: setItem.category || 'revenue',
    }));
    onChange([...items, ...newItems]);
    setShowItemSetSelector(false);
  };

  const addFromProduct = (product: Product) => {
    onChange([
      ...items,
      {
        id: uuidv4(),
        description: product.name + (product.description ? ` - ${product.description}` : ''),
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        category: 'revenue', // 商品は売上
      },
    ]);
    setShowProductSelector(null);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // Auto-calculate unitPrice when foreign currency fields are updated
        if (field === 'foreignAmount' || field === 'exchangeRate') {
          const foreignAmount = field === 'foreignAmount' ? (value as number) : (item.foreignAmount || 0);
          const exchangeRate = field === 'exchangeRate' ? (value as number) : (item.exchangeRate || 0);
          if (foreignAmount > 0 && exchangeRate > 0) {
            updatedItem.unitPrice = Math.round(foreignAmount * exchangeRate);
            // 自動計算備考を生成（例：「(369.94元×22.23円)」）
            const currencySymbol = getCurrencySymbol(item.foreignCurrency);
            updatedItem.calculationNote = `(${foreignAmount}${currencySymbol}×${exchangeRate}円)`;
          }
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    const newMode = new Set(foreignCurrencyMode);
    newMode.delete(id);
    setForeignCurrencyMode(newMode);
  };

  const toggleForeignCurrency = (id: string) => {
    const newMode = new Set(foreignCurrencyMode);
    if (newMode.has(id)) {
      newMode.delete(id);
      // Clear foreign currency fields
      onChange(
        items.map((item) =>
          item.id === id
            ? { ...item, foreignAmount: undefined, exchangeRate: undefined, foreignCurrency: undefined }
            : item
        )
      );
    } else {
      newMode.add(id);
      // Initialize foreign currency fields
      onChange(
        items.map((item) =>
          item.id === id
            ? { ...item, foreignAmount: 0, exchangeRate: 0, foreignCurrency: 'CNY' }
            : item
        )
      );
    }
    setForeignCurrencyMode(newMode);
  };

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = Math.floor(subtotal * (item.taxRate / 100));
    return subtotal + tax;
  };

  const getCurrencySymbol = (code?: string) => {
    const currency = CURRENCY_OPTIONS.find((c) => c.code === code);
    return currency?.symbol || code || '';
  };

  const getCurrencyName = (code: string) => {
    return t(`currencies.${code}`) || code;
  };

  // Check if item has foreign currency data (either in mode or has existing data)
  const hasForeignCurrency = (item: LineItem) => {
    return foreignCurrencyMode.has(item.id) || (item.foreignAmount !== undefined && item.foreignAmount > 0);
  };

  // Initialize foreignCurrencyMode for items that already have foreign currency data
  useState(() => {
    const initialMode = new Set<string>();
    items.forEach((item) => {
      if (item.foreignAmount !== undefined && item.foreignAmount > 0) {
        initialMode.add(item.id);
      }
    });
    if (initialMode.size > 0) {
      setForeignCurrencyMode(initialMode);
    }
  });

  return (
    <div className="space-y-4">
      {/* Desktop Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 text-sm font-medium text-gray-500">
        <div className="col-span-4">{t('lineItems.itemDescription')}</div>
        <div className="col-span-1 text-center">{t('lineItems.category')}</div>
        <div className="col-span-2 text-right">{t('common.quantity')}</div>
        <div className="col-span-2 text-right">{t('common.unitPrice')}</div>
        <div className="col-span-1 text-right">{t('common.taxRate')}</div>
        <div className="col-span-2 text-right">{t('lineItems.amount')}</div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-2 transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : ''
            } ${dragOverIndex === index ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
          >
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('lineItems.lineItem')} {index + 1}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleForeignCurrency(item.id)}
                    className={`p-1 rounded transition-colors ${
                      hasForeignCurrency(item)
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={t('lineItems.foreignCurrency')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <Input
                placeholder={t('lineItems.itemDescription')}
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              />

              {/* Category Selector - Mobile */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('lineItems.category')}</label>
                <select
                  value={item.category || 'revenue'}
                  onChange={(e) => updateItem(item.id, 'category', e.target.value as ItemCategory)}
                  className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    item.category === 'expense_reimbursement'
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : item.category === 'discount'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {Object.entries(ITEM_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Foreign Currency Fields - Mobile */}
              {hasForeignCurrency(item) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-medium text-green-700 mb-2">{t('lineItems.foreignCurrency')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t('lineItems.currency')}</label>
                      <select
                        value={item.foreignCurrency || 'CNY'}
                        onChange={(e) => updateItem(item.id, 'foreignCurrency', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {CURRENCY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t('lineItems.amount')}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.foreignAmount || ''}
                        onChange={(e) => updateItem(item.id, 'foreignAmount', parseFloat(e.target.value) || 0)}
                        placeholder="580.4"
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t('lineItems.rate')}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.exchangeRate || ''}
                        onChange={(e) => updateItem(item.id, 'exchangeRate', parseFloat(e.target.value) || 0)}
                        placeholder="23.08"
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  {item.foreignAmount && item.exchangeRate && (
                    <div className="text-xs text-green-600 text-right">
                      = {formatCurrency(Math.round(item.foreignAmount * item.exchangeRate))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('common.quantity')}</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('common.unitPrice')}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className={`w-full px-2 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasForeignCurrency(item) ? 'bg-gray-100' : ''
                    }`}
                    readOnly={hasForeignCurrency(item) && item.foreignAmount !== undefined && item.foreignAmount > 0}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('common.taxRate')}</label>
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(item.id, 'taxRate', parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">{t('common.subtotal')}: </span>
                <span className="font-semibold text-gray-900">{formatCurrency(calculateItemTotal(item))}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 flex gap-2">
                  <div className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t('lineItems.itemDescription')}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleForeignCurrency(item.id)}
                    className={`px-2 rounded-lg border transition-colors ${
                      hasForeignCurrency(item)
                        ? 'text-green-600 bg-green-50 border-green-300'
                        : 'text-gray-400 border-gray-300 hover:text-green-600 hover:border-green-300'
                    }`}
                    title={t('lineItems.foreignCurrency')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                {/* Category Selector - Desktop */}
                <div className="col-span-1">
                  <select
                    value={item.category || 'revenue'}
                    onChange={(e) => updateItem(item.id, 'category', e.target.value as ItemCategory)}
                    className={`w-full px-1 py-2 border rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      item.category === 'expense_reimbursement'
                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                        : item.category === 'discount'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <option value="revenue">{t('lineItems.revenue')}</option>
                    <option value="expense_reimbursement">{t('lineItems.reimbursement')}</option>
                    <option value="discount">{t('lineItems.discount')}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasForeignCurrency(item) && item.foreignAmount ? 'bg-gray-100' : ''
                    }`}
                    readOnly={hasForeignCurrency(item) && item.foreignAmount !== undefined && item.foreignAmount > 0}
                  />
                </div>
                <div className="col-span-1">
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(item.id, 'taxRate', parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
                <div className="col-span-1 text-right font-medium text-gray-900">
                  {formatCurrency(calculateItemTotal(item))}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Foreign Currency Fields - Desktop */}
              {hasForeignCurrency(item) && (
                <div className="ml-0 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-green-700">{t('lineItems.foreignCurrency')}:</span>
                    <select
                      value={item.foreignCurrency || 'CNY'}
                      onChange={(e) => updateItem(item.id, 'foreignCurrency', e.target.value)}
                      className="px-2 py-1 border border-green-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {getCurrencyName(c.code)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.foreignAmount || ''}
                        onChange={(e) => updateItem(item.id, 'foreignAmount', parseFloat(e.target.value) || 0)}
                        placeholder={t('lineItems.amount')}
                        className="w-28 px-2 py-1 border border-green-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-green-700">{getCurrencySymbol(item.foreignCurrency)}</span>
                      <span className="text-green-700">×</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.exchangeRate || ''}
                        onChange={(e) => updateItem(item.id, 'exchangeRate', parseFloat(e.target.value) || 0)}
                        placeholder={t('lineItems.rate')}
                        className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-green-700">{t('common.yen')}</span>
                    </div>
                    {item.foreignAmount && item.exchangeRate && (
                      <span className="text-sm font-medium text-green-700">
                        = {formatCurrency(Math.round(item.foreignAmount * item.exchangeRate))}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => addItem('revenue')}
          className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('lineItems.addLineItem')}
        </button>
        <button
          type="button"
          onClick={() => addForeignCurrencyItem('expense_reimbursement')}
          className="flex-1 py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('lineItems.addForeignExpense')}
        </button>
        {/* Item Set Call Button */}
        {itemSets.length > 0 && (
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowItemSetSelector(!showItemSetSelector)}
              className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {t('lineItems.callSet')}
            </button>
            {showItemSetSelector && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 sticky top-0">
                  {t('lineItems.setSelectHint')}
                </div>
                {itemSets.map((itemSet) => (
                  <button
                    key={itemSet.id}
                    type="button"
                    onClick={() => addFromItemSet(itemSet)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{itemSet.name}</p>
                        {itemSet.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{itemSet.description}</p>
                        )}
                        <p className="text-xs text-orange-600 mt-1">
                          {itemSet.items.length}項目: {itemSet.items.map((i) => i.description).join('、')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {products.length > 0 && (
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowProductSelector(showProductSelector ? null : 'open')}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {t('lineItems.addFromProducts')}
            </button>
            {showProductSelector && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addFromProduct(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white ml-4">
                        {formatCurrency(product.unitPrice)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TotalsSummaryProps {
  items: LineItem[];
  showCategoryBreakdown?: boolean;
}

export function TotalsSummary({ items, showCategoryBreakdown = true }: TotalsSummaryProps) {
  const { t } = useLanguage();

  // Category breakdown
  const revenueItems = items.filter((item) => !item.category || item.category === 'revenue');
  const expenseItems = items.filter((item) => item.category === 'expense_reimbursement');
  const discountItems = items.filter((item) => item.category === 'discount');

  const calculateSubtotal = (itemList: LineItem[]) =>
    itemList.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const calculateTax = (itemList: LineItem[]) =>
    itemList.reduce((sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)), 0);

  const revenueSubtotal = calculateSubtotal(revenueItems);
  const revenueTax = calculateTax(revenueItems);
  const expenseSubtotal = calculateSubtotal(expenseItems);
  const expenseTax = calculateTax(expenseItems);
  const discountSubtotal = calculateSubtotal(discountItems);
  const discountTax = calculateTax(discountItems);

  const subtotal = revenueSubtotal + expenseSubtotal - discountSubtotal;
  const taxAmount = revenueTax + expenseTax - discountTax;
  const total = subtotal + taxAmount;

  const hasExpenses = expenseItems.length > 0;
  const hasDiscounts = discountItems.length > 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
      {/* Category breakdown (shown only when both revenue and expenses exist) */}
      {showCategoryBreakdown && (hasExpenses || hasDiscounts) && (
        <div className="pb-2 mb-2 border-b border-gray-200 dark:border-gray-600 space-y-1">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('lineItems.breakdown')}</div>
          {revenueItems.length > 0 && (
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {t('lineItems.revenue')}
              </span>
              <span>{formatCurrency(revenueSubtotal + revenueTax)}</span>
            </div>
          )}
          {hasExpenses && (
            <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {t('lineItems.expenseReimbursement')}
              </span>
              <span>{formatCurrency(expenseSubtotal + expenseTax)}</span>
            </div>
          )}
          {hasDiscounts && (
            <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {t('documents.categoryDiscount')}
              </span>
              <span>-{formatCurrency(discountSubtotal + discountTax)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>{t('common.subtotal')}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>{t('common.tax')}</span>
        <span>{formatCurrency(taxAmount)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
        <span>{t('common.total')}</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {/* Net revenue display (shown when expenses exist) */}
      {showCategoryBreakdown && hasExpenses && (
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span>{t('lineItems.netRevenueTaxIncluded')}</span>
            <span>{formatCurrency(revenueSubtotal + revenueTax - discountSubtotal - discountTax)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
