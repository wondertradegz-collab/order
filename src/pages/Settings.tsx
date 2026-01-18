import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Select } from '../components/common';
import type { CompanyInfo, ElectronicStamp } from '../types';

// Stamp Preview Component
const StampPreview = ({ stamp }: { stamp: Omit<ElectronicStamp, 'id' | 'createdAt'> }) => {
  const today = new Date();
  const dateStr = `${today.getFullYear().toString().slice(2)}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  const baseStyle: React.CSSProperties = {
    width: `${stamp.size}px`,
    height: `${stamp.size}px`,
    border: `2px solid ${stamp.color}`,
    color: stamp.color,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${stamp.size / 4}px`,
    fontWeight: 'bold',
    lineHeight: 1.2,
    backgroundColor: 'white',
  };

  if (stamp.shape === 'circle') {
    baseStyle.borderRadius = '50%';
  } else {
    baseStyle.borderRadius = '4px';
  }

  return (
    <div style={baseStyle}>
      <span style={{ fontSize: `${stamp.size / 3}px` }}>{stamp.text || '印'}</span>
      {stamp.showDate && (
        <span style={{ fontSize: `${stamp.size / 5}px` }}>{dateStr}</span>
      )}
    </div>
  );
};

export function Settings() {
  const { settings, updateSettings, addStamp, updateStamp, deleteStamp } = useApp();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(settings.companyInfo);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate);
  const [prefixes, setPrefixes] = useState(settings.documentNumberPrefix);
  const [saved, setSaved] = useState(false);

  // Stamp editor state
  const [editingStamp, setEditingStamp] = useState<Partial<ElectronicStamp> | null>(null);
  const [newStamp, setNewStamp] = useState<Omit<ElectronicStamp, 'id' | 'createdAt'>>({
    name: '',
    text: '',
    shape: 'circle',
    color: '#FF0000',
    size: 50,
    showDate: true,
  });

  useEffect(() => {
    setCompanyInfo(settings.companyInfo);
    setDefaultTaxRate(settings.defaultTaxRate);
    setPrefixes(settings.documentNumberPrefix);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      companyInfo,
      defaultTaxRate,
      documentNumberPrefix: prefixes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setCompanyInfo(settings.companyInfo);
    setDefaultTaxRate(settings.defaultTaxRate);
    setPrefixes(settings.documentNumberPrefix);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500 mt-1">会社情報や書類の設定を管理します</p>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">会社情報</h2>
        <p className="text-sm text-gray-500 mb-4">書類に表示される自社の情報を設定します</p>
        <div className="space-y-4">
          <Input
            label="会社名 / 屋号"
            value={companyInfo.name}
            onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
            placeholder="株式会社サンプル"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="郵便番号"
              value={companyInfo.postalCode || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
              placeholder="123-4567"
            />
            <div className="md:col-span-2">
              <Input
                label="住所"
                value={companyInfo.address || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder="東京都千代田区..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="電話番号"
              type="tel"
              value={companyInfo.phone || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
              placeholder="03-1234-5678"
            />
            <Input
              label="メールアドレス"
              type="email"
              value={companyInfo.email || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
              placeholder="info@example.com"
            />
          </div>
          <Input
            label="インボイス登録番号"
            value={companyInfo.registrationNumber || ''}
            onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
            placeholder="T1234567890123"
            helperText="適格請求書発行事業者の登録番号"
          />
        </div>
      </div>

      {/* Bank Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">振込先情報</h2>
        <p className="text-sm text-gray-500 mb-4">請求書に表示される振込先を設定します</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="銀行名"
              value={companyInfo.bankName || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, bankName: e.target.value })}
              placeholder="サンプル銀行"
            />
            <Input
              label="支店名"
              value={companyInfo.bankBranch || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, bankBranch: e.target.value })}
              placeholder="東京支店"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="口座種別"
              options={[
                { value: '普通', label: '普通' },
                { value: '当座', label: '当座' },
              ]}
              value={companyInfo.accountType || '普通'}
              onChange={(val) => setCompanyInfo({ ...companyInfo, accountType: val })}
            />
            <Input
              label="口座番号"
              value={companyInfo.accountNumber || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, accountNumber: e.target.value })}
              placeholder="1234567"
            />
            <Input
              label="口座名義"
              value={companyInfo.accountName || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, accountName: e.target.value })}
              placeholder="カ）サンプル"
            />
          </div>
        </div>
      </div>

      {/* Document Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">書類設定</h2>
        <div className="space-y-4">
          <Select
            label="デフォルト消費税率"
            options={[
              { value: '10', label: '10%（標準税率）' },
              { value: '8', label: '8%（軽減税率）' },
              { value: '0', label: '0%（非課税）' },
            ]}
            value={defaultTaxRate.toString()}
            onChange={(val) => setDefaultTaxRate(parseInt(val))}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="見積書番号プレフィックス"
              value={prefixes.quotation}
              onChange={(e) => setPrefixes({ ...prefixes, quotation: e.target.value })}
              placeholder="Q"
            />
            <Input
              label="請求書番号プレフィックス"
              value={prefixes.invoice}
              onChange={(e) => setPrefixes({ ...prefixes, invoice: e.target.value })}
              placeholder="INV"
            />
            <Input
              label="領収書番号プレフィックス"
              value={prefixes.receipt}
              onChange={(e) => setPrefixes({ ...prefixes, receipt: e.target.value })}
              placeholder="R"
            />
          </div>
          <p className="text-sm text-gray-500">
            次の書類番号: 見積書 {prefixes.quotation}-{String(settings.nextNumbers.quotation).padStart(5, '0')} /
            請求書 {prefixes.invoice}-{String(settings.nextNumbers.invoice).padStart(5, '0')} /
            領収書 {prefixes.receipt}-{String(settings.nextNumbers.receipt).padStart(5, '0')}
          </p>
        </div>
      </div>

      {/* Electronic Stamps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">電子印</h2>
        <p className="text-sm text-gray-500 mb-4">書類に押印する電子印を作成・管理します</p>

        {/* Existing Stamps */}
        {(settings.stamps || []).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">登録済みの電子印</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(settings.stamps || []).map((stamp) => (
                <div key={stamp.id} className="border rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <StampPreview stamp={stamp} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{stamp.name}</p>
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => setEditingStamp(stamp)}
                    >
                      編集
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-800"
                      onClick={() => {
                        if (confirm('この電子印を削除しますか？')) {
                          deleteStamp(stamp.id);
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stamp Editor Form */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {editingStamp ? '電子印を編集' : '新しい電子印を作成'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="印鑑名（管理用）"
                value={editingStamp ? editingStamp.name || '' : newStamp.name}
                onChange={(e) => {
                  if (editingStamp) {
                    setEditingStamp({ ...editingStamp, name: e.target.value });
                  } else {
                    setNewStamp({ ...newStamp, name: e.target.value });
                  }
                }}
                placeholder="例：承認印"
              />
              <Input
                label="表示テキスト"
                value={editingStamp ? editingStamp.text || '' : newStamp.text}
                onChange={(e) => {
                  if (editingStamp) {
                    setEditingStamp({ ...editingStamp, text: e.target.value });
                  } else {
                    setNewStamp({ ...newStamp, text: e.target.value });
                  }
                }}
                placeholder="例：田中"
                helperText="印鑑に表示される文字（1〜3文字推奨）"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="形状"
                  options={[
                    { value: 'circle', label: '丸型' },
                    { value: 'square', label: '角型' },
                  ]}
                  value={editingStamp ? editingStamp.shape || 'circle' : newStamp.shape}
                  onChange={(val) => {
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, shape: val as 'circle' | 'square' });
                    } else {
                      setNewStamp({ ...newStamp, shape: val as 'circle' | 'square' });
                    }
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
                  <input
                    type="color"
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    value={editingStamp ? editingStamp.color || '#FF0000' : newStamp.color}
                    onChange={(e) => {
                      if (editingStamp) {
                        setEditingStamp({ ...editingStamp, color: e.target.value });
                      } else {
                        setNewStamp({ ...newStamp, color: e.target.value });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  サイズ: {editingStamp ? editingStamp.size || 50 : newStamp.size}px
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  className="w-full"
                  value={editingStamp ? editingStamp.size || 50 : newStamp.size}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, size });
                    } else {
                      setNewStamp({ ...newStamp, size });
                    }
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={editingStamp ? editingStamp.showDate ?? true : newStamp.showDate}
                  onChange={(e) => {
                    if (editingStamp) {
                      setEditingStamp({ ...editingStamp, showDate: e.target.checked });
                    } else {
                      setNewStamp({ ...newStamp, showDate: e.target.checked });
                    }
                  }}
                />
                日付を表示する
              </label>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-3">プレビュー</p>
              <StampPreview stamp={editingStamp ? {
                name: editingStamp.name || '',
                text: editingStamp.text || '',
                shape: editingStamp.shape || 'circle',
                color: editingStamp.color || '#FF0000',
                size: editingStamp.size || 50,
                showDate: editingStamp.showDate ?? true,
              } : newStamp} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {editingStamp ? (
              <>
                <Button
                  onClick={() => {
                    if (editingStamp.id) {
                      updateStamp(editingStamp.id, editingStamp);
                    }
                    setEditingStamp(null);
                  }}
                >
                  更新
                </Button>
                <Button variant="secondary" onClick={() => setEditingStamp(null)}>
                  キャンセル
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  if (!newStamp.name || !newStamp.text) {
                    alert('印鑑名と表示テキストを入力してください');
                    return;
                  }
                  addStamp(newStamp);
                  setNewStamp({
                    name: '',
                    text: '',
                    shape: 'circle',
                    color: '#FF0000',
                    size: 50,
                    showDate: true,
                  });
                }}
              >
                電子印を追加
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">データ管理</h2>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">データについて</h3>
            <p className="text-sm text-yellow-700">
              すべてのデータはブラウザのローカルストレージに保存されています。
              ブラウザのデータを削除するとデータが失われる可能性があります。
              定期的にバックアップを取ることをお勧めします。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const data = {
                  customers: localStorage.getItem('invoice-app-customers'),
                  documents: localStorage.getItem('invoice-app-documents'),
                  settings: localStorage.getItem('invoice-app-settings'),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-app-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              データをエクスポート
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const data = JSON.parse(e.target?.result as string);
                      if (data.customers) localStorage.setItem('invoice-app-customers', data.customers);
                      if (data.documents) localStorage.setItem('invoice-app-documents', data.documents);
                      if (data.settings) localStorage.setItem('invoice-app-settings', data.settings);
                      window.location.reload();
                    } catch (err) {
                      alert('ファイルの読み込みに失敗しました');
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
            >
              データをインポート
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="text-green-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            保存しました
          </span>
        )}
        <Button variant="secondary" onClick={handleReset}>
          リセット
        </Button>
        <Button onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  );
}
