import { useState, type ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Modal } from '../common';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Section = 'getting-started' | 'dashboard' | 'documents' | 'customers' | 'products' | 'expenses' | 'reports' | 'settings' | 'shortcuts' | 'faq';

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const { t, getT, translations } = useLanguage();
  const [activeSection, setActiveSection] = useState<Section>('getting-started');

  const sections: { id: Section; icon: ReactNode; label: string }[] = [
    {
      id: 'getting-started',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: t('manual.gettingStarted'),
    },
    {
      id: 'dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      label: t('manual.dashboardGuide'),
    },
    {
      id: 'documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: t('manual.documentCreation'),
    },
    {
      id: 'customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: t('manual.customerManagement'),
    },
    {
      id: 'products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: t('manual.productManagement'),
    },
    {
      id: 'expenses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: t('manual.expenseTracking'),
    },
    {
      id: 'reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: t('manual.reportsGuide'),
    },
    {
      id: 'settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: t('manual.settingsGuide'),
    },
    {
      id: 'shortcuts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        </svg>
      ),
      label: t('manual.keyboardShortcuts'),
    },
    {
      id: 'faq',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t('manual.faq'),
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('manual.gettingStarted')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {getT(translations.manual.gettingStartedContent)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                {t('manual.features')}
              </h4>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1 text-sm">
                <li>{t('nav.quotations')} / {t('nav.invoices')} / {t('nav.receipts')}</li>
                <li>{t('nav.customers')}</li>
                <li>{t('nav.products')}</li>
                <li>{t('nav.expenses')}</li>
                <li>{t('nav.reports')}</li>
              </ul>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.dashboardGuide')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.dashboardContent)}
            </p>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.documentCreation')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.documentCreationContent)}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <span className="text-green-700 dark:text-green-300 font-medium">{t('documents.quotation')}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('documents.invoice')}</span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <span className="text-purple-700 dark:text-purple-300 font-medium">{t('documents.receipt')}</span>
              </div>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.customerManagement')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.customerManagementContent)}
            </p>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.productManagement')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.productManagementContent)}
            </p>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.expenseTracking')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.expenseTrackingContent)}
            </p>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.reportsGuide')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.reportsContent)}
            </p>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.settingsGuide')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {getT(translations.manual.settingsContent)}
            </p>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.keyboardShortcuts')}
            </h3>
            <div className="space-y-2">
              {getT(translations.manual.shortcutList).map((item: { key: string; action: string }, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <kbd className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm font-mono">
                    {item.key}
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-300">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('manual.faq')}
            </h3>
            <div className="space-y-4">
              {getT(translations.manual.faqItems).map((item: { q: string; a: string }, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Q: {item.q}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    A: {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('manual.title')} size="xl">
      <div className="flex flex-col md:flex-row gap-6 min-h-[400px] max-h-[70vh]">
        {/* Sidebar Navigation */}
        <nav className="md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-4 md:pb-0 md:pr-4 overflow-x-auto md:overflow-y-auto">
          <ul className="flex md:flex-col gap-1 md:gap-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}

          {/* Tips Section (shown on all pages) */}
          {activeSection !== 'faq' && activeSection !== 'shortcuts' && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {t('manual.tips')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {getT(translations.manual.tip1)}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {getT(translations.manual.tip2)}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {getT(translations.manual.tip3)}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {getT(translations.manual.tip4)}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
