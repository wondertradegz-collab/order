import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Select } from '../components/common';
import type { CompanyInfo } from '../types';

export function Settings() {
  const { settings, updateSettings } = useApp();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(settings.companyInfo);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate);
  const [prefixes, setPrefixes] = useState(settings.documentNumberPrefix);
  const [saved, setSaved] = useState(false);

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
