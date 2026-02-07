import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button, Input, Modal, ConfirmModal } from '../components/common';
import { formatDate } from '../utils/format';
import type { Customer } from '../types';

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, getDocumentsByCustomer } = useApp();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.companyName?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleOpenModal = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSave = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      addCustomer(data);
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
          <p className="text-gray-500 mt-1">{t('customers.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto min-h-[44px]">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('customers.noCustomers')}</h3>
          <p className="text-gray-500 mb-4">{t('customers.addFirstCustomer')}</p>
          <Button onClick={() => handleOpenModal()} className="min-h-[44px]">{t('customers.addCustomer')}</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.customerName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('settings.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customers.documentCount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.date')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const docCount = getDocumentsByCustomer(customer.id).length;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Link to={`/customers/${customer.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {customer.companyName}
                          </Link>
                          {customer.name && (
                            <p className="text-sm text-gray-500">{customer.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {customer.email && <p className="text-gray-900">{customer.email}</p>}
                          {customer.phone && <p className="text-gray-500">{customer.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{docCount}{t('common.items')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(customer)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredCustomers.map((customer) => {
              const docCount = getDocumentsByCustomer(customer.id).length;
              return (
                <div key={customer.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/customers/${customer.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {customer.companyName}
                      </Link>
                      {customer.name && (
                        <p className="text-sm text-gray-500">{customer.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(customer)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    {customer.email && <p>{customer.email}</p>}
                    {customer.phone && <p>{customer.phone}</p>}
                    <div className="flex gap-4">
                      <span>{t('customers.documentCount')}: {docCount}{t('common.items')}</span>
                      <span>{formatDate(customer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        customer={editingCustomer}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={`${deleteTarget?.companyName} ${t('documents.deleteConfirm')}`}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  customer: Customer | null;
}

function CustomerFormModal({ isOpen, onClose, onSave, customer }: CustomerFormModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    postalCode: '',
    address: '',
  });

  // Reset form when modal opens
  useState(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name,
          companyName: customer.companyName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          postalCode: customer.postalCode || '',
          address: customer.address || '',
        });
      } else {
        setFormData({
          name: '',
          companyName: '',
          email: '',
          phone: '',
          postalCode: '',
          address: '',
        });
      }
    }
  });

  // Update form when customer changes
  if (isOpen && customer && formData.name !== customer.name && formData.email !== customer.email) {
    setFormData({
      name: customer.name,
      companyName: customer.companyName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      postalCode: customer.postalCode || '',
      address: customer.address || '',
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      postalCode: '',
      address: '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? t('customers.editCustomer') : t('customers.addCustomer')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('customers.companyName')} *`}
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
          <Input
            label={t('customers.contactPerson')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('settings.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('settings.phone')}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('settings.postalCode')}
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          />
          <div className="md:col-span-2">
            <Input
              label={t('settings.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto min-h-[44px]">
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="w-full sm:w-auto min-h-[44px]">
            {customer ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
