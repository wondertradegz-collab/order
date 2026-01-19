import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/common';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getDocumentTypeLabel } from '../utils/format';
import type { Invoice } from '../types';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getCustomer, getDocumentsByCustomer } = useApp();

  const customer = id ? getCustomer(id) : undefined;
  const customerDocuments = useMemo(() => {
    if (!id) return [];
    return getDocumentsByCustomer(id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [id, getDocumentsByCustomer]);

  // Calculate stats
  const stats = useMemo(() => {
    const quotations = customerDocuments.filter((d) => d.type === 'quotation');
    const invoices = customerDocuments.filter((d) => d.type === 'invoice') as Invoice[];
    const receipts = customerDocuments.filter((d) => d.type === 'receipt');

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);
    const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);

    return {
      quotationCount: quotations.length,
      invoiceCount: invoices.length,
      receiptCount: receipts.length,
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      totalSales,
    };
  }, [customerDocuments]);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('common.noData')}</p>
        <Button onClick={() => navigate('/customers')} className="mt-4">
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/customers" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← {t('common.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          {customer.companyName && (
            <p className="text-gray-500">{customer.companyName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/quotations/new?customerId=${customer.id}`)}>
            {t('dashboard.createQuotation')}
          </Button>
          <Button onClick={() => navigate(`/invoices/new?customerId=${customer.id}`)}>
            {t('dashboard.createInvoice')}
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.customer')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customer.email && (
            <div>
              <p className="text-sm text-gray-500">{t('settings.email')}</p>
              <p className="text-gray-900">{customer.email}</p>
            </div>
          )}
          {customer.phone && (
            <div>
              <p className="text-sm text-gray-500">{t('settings.phone')}</p>
              <p className="text-gray-900">{customer.phone}</p>
            </div>
          )}
          {customer.address && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">{t('settings.address')}</p>
              <p className="text-gray-900">
                {customer.postalCode && `〒${customer.postalCode} `}
                {customer.address}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">{t('common.date')}</p>
            <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">{t('customers.totalSales')}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSales)}</p>
          <p className="text-xs text-gray-400">{stats.receiptCount}{t('common.items')} {t('documents.receipt')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">{t('reports.invoiced')}</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalInvoiced)}</p>
          <p className="text-xs text-gray-400">{stats.invoiceCount}{t('common.items')} {t('documents.invoice')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">{t('documents.paidAmount')}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">{t('dashboard.unpaid')}</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalUnpaid)}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.paymentHistory')}</h2>

        {customerDocuments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.documentType')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.number')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.issueDate')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        doc.type === 'quotation' ? 'bg-purple-100 text-purple-700' :
                        doc.type === 'invoice' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/${doc.type}s/${doc.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(doc.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(doc.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
