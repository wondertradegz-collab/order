import { v4 as uuidv4 } from 'uuid';
import { Input } from '../common';
import { formatCurrency } from '../../utils/format';
import type { LineItem } from '../../types';

interface LineItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  defaultTaxRate: number;
}

export function LineItemEditor({ items, onChange, defaultTaxRate }: LineItemEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: defaultTaxRate,
      },
    ]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const calculateItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = Math.floor(subtotal * (item.taxRate / 100));
    return subtotal + tax;
  };

  return (
    <div className="space-y-4">
      {/* Desktop Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 text-sm font-medium text-gray-500">
        <div className="col-span-5">品名・摘要</div>
        <div className="col-span-2 text-right">数量</div>
        <div className="col-span-2 text-right">単価</div>
        <div className="col-span-1 text-right">税率</div>
        <div className="col-span-2 text-right">金額</div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-3 md:p-2">
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-500">明細 {index + 1}</span>
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
              <Input
                placeholder="品名・摘要"
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">数量</label>
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
                  <label className="text-xs text-gray-500 mb-1 block">単価</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">税率</label>
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
                <span className="text-sm text-gray-500">小計: </span>
                <span className="font-semibold text-gray-900">{formatCurrency(calculateItemTotal(item))}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  placeholder="品名・摘要"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        明細を追加
      </button>
    </div>
  );
}

interface TotalsSummaryProps {
  items: LineItem[];
}

export function TotalsSummary({ items }: TotalsSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)),
    0
  );
  const total = subtotal + taxAmount;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-gray-600">
        <span>小計</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>消費税</span>
        <span>{formatCurrency(taxAmount)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
        <span>合計</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
