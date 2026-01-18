import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Button, Select } from '../components/common';
import type { Invoice, Receipt } from '../types';

export function Reports() {
  const { documents, customers } = useApp();
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = customEnd ? new Date(customEnd) : now;
        break;
    }
    return { start, end };
  }, [period, customStart, customEnd]);

  const stats = useMemo(() => {
    const { start, end } = dateRange;

    // 期間内の請求書
    const invoices = documents.filter((d) => {
      if (d.type !== 'invoice') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Invoice[];

    // 期間内の領収書（売上確定）
    const receipts = documents.filter((d) => {
      if (d.type !== 'receipt') return false;
      const date = new Date(d.issueDate);
      return date >= start && date <= end;
    }) as Receipt[];

    // 売上（領収書ベース）
    const totalSales = receipts.reduce((sum, r) => sum + r.total, 0);

    // 請求額
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);

    // 入金済み
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

    // 未入金
    const totalUnpaid = invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

    // 顧客別売上
    const salesByCustomer = receipts.reduce((acc, r) => {
      acc[r.customerId] = (acc[r.customerId] || 0) + r.total;
      return acc;
    }, {} as Record<string, number>);

    // 月別売上（今年）
    const monthlySales = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(new Date().getFullYear(), i, 1);
      const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);
      return receipts
        .filter((r) => {
          const date = new Date(r.issueDate);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + r.total, 0);
    });

    return {
      totalSales,
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      invoiceCount: invoices.length,
      receiptCount: receipts.length,
      salesByCustomer,
      monthlySales,
    };
  }, [documents, dateRange]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customer?.name || '不明';
  };

  const topCustomers = useMemo(() => {
    return Object.entries(stats.salesByCustomer)
      .map(([customerId, amount]) => ({
        customerId,
        name: getCustomerName(customerId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [stats.salesByCustomer, customers]);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxMonthlySales = Math.max(...stats.monthlySales, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">売上レポート</h1>
          <p className="text-gray-500 mt-1">売上状況と顧客別の分析</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <Select
              label="期間"
              options={[
                { value: 'thisMonth', label: '今月' },
                { value: 'lastMonth', label: '先月' },
                { value: 'thisYear', label: '今年' },
                { value: 'custom', label: 'カスタム' },
              ]}
              value={period}
              onChange={(val) => setPeriod(val as typeof period)}
            />
          </div>
          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {formatDate(dateRange.start)} 〜 {formatDate(dateRange.end)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">売上（領収書）</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalSales)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.receiptCount}件</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">請求額</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.totalInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.invoiceCount}件</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">入金済み</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">未入金</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.totalUnpaid)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">月別売上（今年）</h2>
          <div className="space-y-3">
            {stats.monthlySales.map((amount, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-10 text-sm text-gray-500">{months[index]}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${(amount / maxMonthlySales) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">顧客別売上（期間内）</h2>
          {topCustomers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">データがありません</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{customer.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatCurrency(customer.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            const csvData = [
              ['期間', `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`],
              ['売上合計', stats.totalSales],
              ['請求額合計', stats.totalInvoiced],
              ['入金済み', stats.totalPaid],
              ['未入金', stats.totalUnpaid],
              [],
              ['顧客名', '売上'],
              ...topCustomers.map((c) => [c.name, c.amount]),
            ];
            const csv = csvData.map((row) => row.join(',')).join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `売上レポート_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          CSVでエクスポート
        </Button>
      </div>
    </div>
  );
}
