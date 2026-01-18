import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { DocumentForm } from '../components/documents/DocumentForm';
import { getDocumentTypeLabel } from '../utils/format';
import type { DocumentType, Document } from '../types';

interface DocumentEditorProps {
  type: DocumentType;
  mode: 'create' | 'edit';
}

export function DocumentEditor({ type, mode }: DocumentEditorProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, products, getDocument, addDocument, updateDocument, settings } = useApp();

  const document = mode === 'edit' && id ? getDocument(id) : undefined;
  const typeLabel = getDocumentTypeLabel(type);
  const basePath = `/${type}s`;

  if (mode === 'edit' && !document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{typeLabel}が見つかりません</h2>
        <button
          onClick={() => navigate(basePath)}
          className="text-blue-600 hover:text-blue-700"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  const handleSubmit = (data: Omit<Document, 'id' | 'documentNumber' | 'createdAt' | 'updatedAt'>) => {
    if (mode === 'edit' && document) {
      updateDocument(document.id, data);
      navigate(`${basePath}/${document.id}`);
    } else {
      const newDoc = addDocument(data);
      navigate(`${basePath}/${newDoc.id}`);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && document) {
      navigate(`${basePath}/${document.id}`);
    } else {
      navigate(basePath);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? `${typeLabel}を編集` : `${typeLabel}を作成`}
        </h1>
        <p className="text-gray-500 mt-1">
          {mode === 'edit' ? document?.documentNumber : `新しい${typeLabel}を作成します`}
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">顧客がいません</h3>
          <p className="text-gray-500 mb-4">{typeLabel}を作成するには、まず顧客を登録してください</p>
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            顧客を登録
          </button>
        </div>
      ) : (
        <DocumentForm
          type={type}
          customers={customers}
          products={products}
          defaultTaxRate={settings.defaultTaxRate}
          initialData={document}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={mode === 'edit' ? '更新' : '作成'}
        />
      )}
    </div>
  );
}
