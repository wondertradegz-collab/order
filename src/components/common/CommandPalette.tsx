import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency, getDocumentTypeLabel } from '../../utils/format';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultType = 'document' | 'customer' | 'product' | 'action';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  icon: string;
  path?: string;
  action?: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { documents, customers, products } = useApp();
  const { t } = useLanguage();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Quick actions
  const quickActions: SearchResult[] = useMemo(() => [
    { id: 'new-quotation', type: 'action', title: t('dashboard.createQuotation'), icon: '📝', path: '/quotations/new' },
    { id: 'new-invoice', type: 'action', title: t('dashboard.createInvoice'), icon: '📄', path: '/invoices/new' },
    { id: 'new-receipt', type: 'action', title: t('dashboard.createReceipt'), icon: '🧾', path: '/receipts/new' },
    { id: 'new-customer', type: 'action', title: t('commandPalette.newCustomer'), icon: '👤', path: '/customers' },
    { id: 'goto-reports', type: 'action', title: t('commandPalette.viewReports'), icon: '📊', path: '/reports' },
    { id: 'goto-settings', type: 'action', title: t('commandPalette.openSettings'), icon: '⚙️', path: '/settings' },
  ], [t]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return quickActions;
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search documents
    documents.forEach((doc) => {
      if (
        doc.documentNumber.toLowerCase().includes(lowerQuery) ||
        doc.notes?.toLowerCase().includes(lowerQuery)
      ) {
        const customer = customers.find((c) => c.id === doc.customerId);
        searchResults.push({
          id: doc.id,
          type: 'document',
          title: `${getDocumentTypeLabel(doc.type)} ${doc.documentNumber}`,
          subtitle: `${customer?.name || t('common.unknown')} - ${formatCurrency(doc.total)}`,
          icon: doc.type === 'quotation' ? '📝' : doc.type === 'invoice' ? '📄' : '🧾',
          path: `/${doc.type}s/${doc.id}`,
        });
      }
    });

    // Search customers
    customers.forEach((customer) => {
      if (
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.companyName?.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.companyName || customer.email,
          icon: '👤',
          path: `/customers/${customer.id}`,
        });
      }
    });

    // Search products
    products.forEach((product) => {
      if (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: formatCurrency(product.unitPrice),
          icon: '📦',
          path: '/products',
        });
      }
    });

    // Filter quick actions by query
    quickActions.forEach((action) => {
      if (action.title.toLowerCase().includes(lowerQuery)) {
        searchResults.push(action);
      }
    });

    return searchResults.slice(0, 10);
  }, [query, documents, customers, products, quickActions, t]);

  // Handle query change and reset selected index
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.path) {
      navigate(result.path);
    } else if (result.action) {
      result.action();
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
        <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-4 py-4 text-gray-900 dark:text-white bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
              placeholder={t('commandPalette.searchPlaceholder')}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {t('commandPalette.noResults')}
              </div>
            ) : (
              <ul className="py-2">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="text-xl">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {result.type === 'document' && t('commandPalette.document')}
                        {result.type === 'customer' && t('commandPalette.customer')}
                        {result.type === 'product' && t('commandPalette.product')}
                        {result.type === 'action' && t('commandPalette.action')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
              <span>{t('commandPalette.navigate')}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-2">Enter</kbd>
              <span>{t('commandPalette.select')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
