import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Select, ConfirmModal, ChipGroup, Badge, Card, EmptyState } from '../components/common';
import { AccountingExportModal } from '../components/documents';
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

type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

export function DocumentList({ type }: DocumentListProps) {
  const navigate = useNavigate();
  const { documents, customers, deleteDocument, deleteDocuments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showAccountingExport, setShowAccountingExport] = useState(false);

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

    if (dateFrom) {
      docs = docs.filter((d) => d.issueDate >= dateFrom);
    }

    if (dateTo) {
      docs = docs.filter((d) => d.issueDate <= dateTo);
    }

    // Sort
    return docs.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_high':
          return b.total - a.total;
        case 'amount_low':
          return a.total - b.total;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [documents, type, searchQuery, statusFilter, dateFrom, dateTo, sortBy, customers]);

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

  const handleBulkDelete = () => {
    deleteDocuments(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'oldest', label: '古い順' },
    { value: 'amount_high', label: '金額: 高い順' },
    { value: 'amount_low', label: '金額: 低い順' },
  ];

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const allDocs = documents.filter((d) => d.type === type);
    const counts: Record<string, number> = { all: allDocs.length };
    statusOptions.forEach((opt) => {
      if (opt.value !== 'all') {
        counts[opt.value] = allDocs.filter((d) => d.status === opt.value).length;
      }
    });
    return counts;
  }, [documents, type, statusOptions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{typeLabel}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{typeLabel}の一覧と管理</p>
        </div>
        <Button onClick={() => navigate(`${basePath}/new`)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {typeLabel}を作成
        </Button>
      </div>

      {/* Status Filter Chips */}
      <div className="overflow-x-auto pb-2">
        <ChipGroup
          options={statusOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
            count: statusCounts[opt.value] || 0,
          }))}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as string)}
        />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="番号、顧客名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="開始日"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="flex items-center text-gray-400">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="終了日"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val as SortOption)}
          />
        </div>
      </Card>

      {/* Action Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedIds.size > 0 && (
            <>
              <Badge color="blue">{selectedIds.size}件選択中</Badge>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                一括削除
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(type === 'invoice' || type === 'receipt') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAccountingExport(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              会計ソフト連携
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // CSV Export
              const csvHeader = type === 'invoice'
                ? ['書類番号', '顧客名', '発行日', '支払期限', '金額', '入金済', 'ステータス']
                : ['書類番号', '顧客名', '発行日', '金額', 'ステータス'];

              const csvRows = filteredDocuments.map((doc) => {
                const customerName = getCustomerName(doc.customerId);
                if (type === 'invoice') {
                  const inv = doc as Invoice;
                  return [
                    doc.documentNumber,
                    customerName,
                    doc.issueDate,
                    inv.dueDate,
                    doc.total,
                    inv.paidAmount,
                    getStatusLabel(doc.status),
                  ];
                }
                return [
                  doc.documentNumber,
                  customerName,
                  doc.issueDate,
                  doc.total,
                  getStatusLabel(doc.status),
                ];
              });

              const csvContent = [csvHeader, ...csvRows]
                .map((row) => row.map((cell) => `"${cell}"`).join(','))
                .join('\n');

              const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${typeLabel}_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV出力
          </Button>
        </div>
      </div>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title={`${typeLabel}がありません`}
            description={`最初の${typeLabel}を作成してください`}
            action={<Button onClick={() => navigate(`${basePath}/new`)}>{typeLabel}を作成</Button>}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedIds.has(doc.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`${basePath}/${doc.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {getCustomerName(doc.customerId)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(doc.issueDate)}
                    </td>
                    {type === 'invoice' && (
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate((doc as Invoice).dueDate)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
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
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((doc) => (
              <Link
                key={doc.id}
                to={`${basePath}/${doc.id}`}
                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400">{doc.documentNumber}</p>
                    <p className="text-sm text-gray-900 dark:text-white">{getCustomerName(doc.customerId)}</p>
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
                  <span className="text-gray-500 dark:text-gray-400">{formatDate(doc.issueDate)}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(doc.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
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

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`${typeLabel}を一括削除`}
        message={`選択した${selectedIds.size}件の${typeLabel}を削除しますか？この操作は取り消せません。`}
        confirmText="一括削除"
        variant="danger"
      />

      {/* Accounting Software Export Modal */}
      <AccountingExportModal
        isOpen={showAccountingExport}
        onClose={() => setShowAccountingExport(false)}
      />
    </div>
  );
}
