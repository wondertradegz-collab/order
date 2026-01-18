import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Select, ConfirmModal } from '../components/common';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getDocumentTypeLabel,
} from '../utils/format';
import type { DocumentType, Document, Invoice } from '../types';

interface DocumentListProps {
  type: DocumentType;
}

export function DocumentList({ type }: DocumentListProps) {
  const navigate = useNavigate();
  const { documents, customers, deleteDocument } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const typeLabel = getDocumentTypeLabel(type);
  const basePath = `/${type}s`;

  const filteredDocuments = useMemo(() => {
    let docs = documents.filter((d) => d.type === type);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter((d) => {
        const customer = customers.find((c) => c.id === d.customerId);
        return (
          d.documentNumber.toLowerCase().includes(query) ||
          customer?.name.toLowerCase().includes(query) ||
          customer?.companyName?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      docs = docs.filter((d) => d.status === statusFilter);
    }

    return docs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [documents, type, searchQuery, statusFilter, customers]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || '不明';
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'draft', label: '下書き' },
    { value: 'sent', label: '送付済み' },
    ...(type === 'invoice'
      ? [
          { value: 'paid', label: '入金済み' },
          { value: 'overdue', label: '期限超過' },
        ]
      : []),
    { value: 'cancelled', label: 'キャンセル' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{typeLabel}</h1>
          <p className="text-gray-500 mt-1">{typeLabel}の一覧と管理</p>
        </div>
        <Button onClick={() => navigate(`${basePath}/new`)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {typeLabel}を作成
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="番号、顧客名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{typeLabel}がありません</h3>
          <p className="text-gray-500 mb-4">最初の{typeLabel}を作成してください</p>
          <Button onClick={() => navigate(`${basePath}/new`)}>{typeLabel}を作成</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    発行日
                  </th>
                  {type === 'invoice' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支払期限
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`${basePath}/${doc.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {getCustomerName(doc.customerId)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(doc.issueDate)}
                    </td>
                    {type === 'invoice' && (
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate((doc as Invoice).dueDate)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(doc.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`${basePath}/${doc.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`${basePath}/${doc.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <Link
                key={doc.id}
                to={`${basePath}/${doc.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-blue-600">{doc.documentNumber}</p>
                    <p className="text-sm text-gray-900">{getCustomerName(doc.customerId)}</p>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      doc.status
                    )}`}
                  >
                    {getStatusLabel(doc.status)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{formatDate(doc.issueDate)}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(doc.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`${typeLabel}を削除`}
        message={`「${deleteTarget?.documentNumber}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        variant="danger"
      />
    </div>
  );
}
