import type { Document, Invoice, Customer, LineItem } from '../types';

// 会計ソフトの種類
export type AccountingSoftware = 'freee' | 'yayoi' | 'moneyforward';

// 勘定科目マッピング
const ACCOUNT_CODES = {
  // 売上
  sales: {
    freee: '売上高',
    yayoi: '500',
    moneyforward: '売上高',
  },
  // 売掛金
  accountsReceivable: {
    freee: '売掛金',
    yayoi: '131',
    moneyforward: '売掛金',
  },
  // 現金
  cash: {
    freee: '現金',
    yayoi: '100',
    moneyforward: '現金',
  },
  // 預金
  deposit: {
    freee: '普通預金',
    yayoi: '102',
    moneyforward: '普通預金',
  },
};

// 日付フォーマット関数
function formatDateForExport(dateStr: string, software: AccountingSoftware): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (software) {
    case 'freee':
      return `${year}-${month}-${day}`;
    case 'yayoi':
      return `${year}/${month}/${day}`;
    case 'moneyforward':
      return `${year}/${month}/${day}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// 明細から税率区分を判定（最も多い税率を返す）
function getPrimaryTaxRate(items: LineItem[]): number {
  const taxRateCounts: Record<number, number> = {};
  items.forEach((item) => {
    const rate = item.taxRate ?? 10;
    taxRateCounts[rate] = (taxRateCounts[rate] || 0) + (item.quantity * item.unitPrice);
  });

  let maxRate = 10;
  let maxAmount = 0;
  Object.entries(taxRateCounts).forEach(([rate, amount]) => {
    if (amount > maxAmount) {
      maxAmount = amount;
      maxRate = parseInt(rate);
    }
  });

  return maxRate;
}

// 税区分文字列を取得
function getTaxLabel(taxRate: number, software: AccountingSoftware): string {
  switch (software) {
    case 'freee':
      return taxRate === 10 ? '課税売上10%' : taxRate === 8 ? '課税売上8%' : '非課税売上';
    case 'yayoi':
      return taxRate === 10 ? '課対売上10%' : taxRate === 8 ? '課対売上8%' : '非課税売上';
    case 'moneyforward':
      return taxRate === 10 ? '課売 10%' : taxRate === 8 ? '課売 8%' : '非売上';
    default:
      return '';
  }
}

// freee用CSVエクスポート
function exportToFreee(
  documents: Document[],
  customers: Customer[]
): string {
  const headers = [
    '取引日',
    '決算整理仕訳',
    '借方勘定科目',
    '借方補助科目',
    '借方税区分',
    '借方金額',
    '借方税額',
    '貸方勘定科目',
    '貸方補助科目',
    '貸方税区分',
    '貸方金額',
    '貸方税額',
    '摘要',
    'タグ',
    'メモ',
  ];

  const rows: string[][] = [];

  documents.forEach((doc) => {
    const customer = customers.find((c) => c.id === doc.customerId);
    const customerName = customer?.companyName || customer?.name || '';
    const taxRate = getPrimaryTaxRate(doc.items);

    if (doc.type === 'invoice') {
      // 請求書: 売掛金 / 売上
      const invoice = doc as Invoice;

      rows.push([
        formatDateForExport(doc.issueDate, 'freee'),
        '',
        ACCOUNT_CODES.accountsReceivable.freee,
        customerName,
        '',
        String(doc.total),
        '',
        ACCOUNT_CODES.sales.freee,
        '',
        getTaxLabel(taxRate, 'freee'),
        String(doc.subtotal),
        String(doc.taxAmount),
        `${doc.documentNumber} ${customerName}`,
        '',
        '',
      ]);

      // 入金済みの場合: 普通預金 / 売掛金
      if (invoice.status === 'paid' && invoice.paidAmount > 0) {
        rows.push([
          formatDateForExport(invoice.paidDate || doc.issueDate, 'freee'),
          '',
          ACCOUNT_CODES.deposit.freee,
          '',
          '',
          String(invoice.paidAmount),
          '',
          ACCOUNT_CODES.accountsReceivable.freee,
          customerName,
          '',
          String(invoice.paidAmount),
          '',
          `入金 ${doc.documentNumber} ${customerName}`,
          '',
          '',
        ]);
      }
    } else if (doc.type === 'receipt') {
      // 領収書: 現金/預金 / 売上
      rows.push([
        formatDateForExport(doc.issueDate, 'freee'),
        '',
        ACCOUNT_CODES.cash.freee,
        '',
        '',
        String(doc.total),
        '',
        ACCOUNT_CODES.sales.freee,
        '',
        getTaxLabel(taxRate, 'freee'),
        String(doc.subtotal),
        String(doc.taxAmount),
        `${doc.documentNumber} ${customerName}`,
        '',
        '',
      ]);
    }
  });

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

// 弥生会計用CSVエクスポート
function exportToYayoi(
  documents: Document[],
  customers: Customer[]
): string {
  const headers = [
    '識別フラグ',
    '伝票No.',
    '決算',
    '取引日付',
    '借方勘定科目',
    '借方補助科目',
    '借方部門',
    '借方税区分',
    '借方金額',
    '借方税金額',
    '貸方勘定科目',
    '貸方補助科目',
    '貸方部門',
    '貸方税区分',
    '貸方金額',
    '貸方税金額',
    '摘要',
    '番号',
    '期日',
    'タイプ',
    '生成元',
    '仕訳メモ',
    '付箋1',
    '付箋2',
    '調整',
  ];

  const rows: string[][] = [];
  let slipNo = 1;

  documents.forEach((doc) => {
    const customer = customers.find((c) => c.id === doc.customerId);
    const customerName = customer?.companyName || customer?.name || '';
    const taxRate = getPrimaryTaxRate(doc.items);

    if (doc.type === 'invoice') {
      const invoice = doc as Invoice;

      // 売掛金 / 売上
      rows.push([
        '2000', // 仕訳データ
        String(slipNo),
        '0', // 通常仕訳
        formatDateForExport(doc.issueDate, 'yayoi'),
        ACCOUNT_CODES.accountsReceivable.yayoi,
        customerName,
        '',
        getTaxLabel(taxRate, 'yayoi'),
        String(doc.total),
        String(doc.taxAmount),
        ACCOUNT_CODES.sales.yayoi,
        '',
        '',
        '',
        String(doc.subtotal),
        '',
        `${doc.documentNumber} ${customerName}`,
        '',
        formatDateForExport(invoice.dueDate, 'yayoi'),
        '0',
        '0',
        '',
        '',
        '',
        '0',
      ]);
      slipNo++;

      // 入金処理
      if (invoice.status === 'paid' && invoice.paidAmount > 0) {
        rows.push([
          '2000',
          String(slipNo),
          '0',
          formatDateForExport(invoice.paidDate || doc.issueDate, 'yayoi'),
          ACCOUNT_CODES.deposit.yayoi,
          '',
          '',
          '対象外',
          String(invoice.paidAmount),
          '0',
          ACCOUNT_CODES.accountsReceivable.yayoi,
          customerName,
          '',
          '',
          String(invoice.paidAmount),
          '',
          `入金 ${doc.documentNumber} ${customerName}`,
          '',
          '',
          '0',
          '0',
          '',
          '',
          '',
          '0',
        ]);
        slipNo++;
      }
    } else if (doc.type === 'receipt') {
      // 領収書: 現金 / 売上
      rows.push([
        '2000',
        String(slipNo),
        '0',
        formatDateForExport(doc.issueDate, 'yayoi'),
        ACCOUNT_CODES.cash.yayoi,
        '',
        '',
        '対象外',
        String(doc.total),
        '0',
        ACCOUNT_CODES.sales.yayoi,
        '',
        '',
        getTaxLabel(taxRate, 'yayoi'),
        String(doc.subtotal),
        String(doc.taxAmount),
        `${doc.documentNumber} ${customerName}`,
        '',
        '',
        '0',
        '0',
        '',
        '',
        '',
        '0',
      ]);
      slipNo++;
    }
  });

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

// マネーフォワード用CSVエクスポート
function exportToMoneyForward(
  documents: Document[],
  customers: Customer[]
): string {
  const headers = [
    '取引日',
    '借方勘定科目',
    '借方補助科目',
    '借方税区分',
    '借方部門',
    '借方金額（税込）',
    '借方税額',
    '貸方勘定科目',
    '貸方補助科目',
    '貸方税区分',
    '貸方部門',
    '貸方金額（税込）',
    '貸方税額',
    '摘要',
    '仕訳メモ',
    'タグ',
    '決算整理仕訳',
  ];

  const rows: string[][] = [];

  documents.forEach((doc) => {
    const customer = customers.find((c) => c.id === doc.customerId);
    const customerName = customer?.companyName || customer?.name || '';
    const taxRate = getPrimaryTaxRate(doc.items);

    if (doc.type === 'invoice') {
      const invoice = doc as Invoice;

      // 売掛金 / 売上
      rows.push([
        formatDateForExport(doc.issueDate, 'moneyforward'),
        ACCOUNT_CODES.accountsReceivable.moneyforward,
        customerName,
        '対象外',
        '',
        String(doc.total),
        '0',
        ACCOUNT_CODES.sales.moneyforward,
        '',
        getTaxLabel(taxRate, 'moneyforward'),
        '',
        String(doc.total),
        String(doc.taxAmount),
        `${doc.documentNumber} ${customerName}`,
        '',
        '',
        'No',
      ]);

      // 入金処理
      if (invoice.status === 'paid' && invoice.paidAmount > 0) {
        rows.push([
          formatDateForExport(invoice.paidDate || doc.issueDate, 'moneyforward'),
          ACCOUNT_CODES.deposit.moneyforward,
          '',
          '対象外',
          '',
          String(invoice.paidAmount),
          '0',
          ACCOUNT_CODES.accountsReceivable.moneyforward,
          customerName,
          '対象外',
          '',
          String(invoice.paidAmount),
          '0',
          `入金 ${doc.documentNumber} ${customerName}`,
          '',
          '',
          'No',
        ]);
      }
    } else if (doc.type === 'receipt') {
      // 領収書: 現金 / 売上
      rows.push([
        formatDateForExport(doc.issueDate, 'moneyforward'),
        ACCOUNT_CODES.cash.moneyforward,
        '',
        '対象外',
        '',
        String(doc.total),
        '0',
        ACCOUNT_CODES.sales.moneyforward,
        '',
        getTaxLabel(taxRate, 'moneyforward'),
        '',
        String(doc.total),
        String(doc.taxAmount),
        `${doc.documentNumber} ${customerName}`,
        '',
        '',
        'No',
      ]);
    }
  });

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

// メインエクスポート関数
export function exportToAccountingSoftware(
  software: AccountingSoftware,
  documents: Document[],
  customers: Customer[]
): string {
  // 請求書と領収書のみをフィルター（見積書は仕訳対象外）
  const targetDocs = documents.filter((d) => d.type === 'invoice' || d.type === 'receipt');

  switch (software) {
    case 'freee':
      return exportToFreee(targetDocs, customers);
    case 'yayoi':
      return exportToYayoi(targetDocs, customers);
    case 'moneyforward':
      return exportToMoneyForward(targetDocs, customers);
    default:
      throw new Error(`Unknown accounting software: ${software}`);
  }
}

// ファイル名生成
export function getExportFileName(software: AccountingSoftware): string {
  const date = new Date().toISOString().split('T')[0];
  const softwareNames: Record<AccountingSoftware, string> = {
    freee: 'freee',
    yayoi: '弥生会計',
    moneyforward: 'マネーフォワード',
  };
  return `仕訳データ_${softwareNames[software]}_${date}.csv`;
}

// 会計ソフト情報
export const ACCOUNTING_SOFTWARE_INFO: Record<
  AccountingSoftware,
  { name: string; description: string; color: string }
> = {
  freee: {
    name: 'freee',
    description: 'freee会計のインポート形式',
    color: '#6366f1',
  },
  yayoi: {
    name: '弥生会計',
    description: '弥生会計・やよいの青色申告対応',
    color: '#22c55e',
  },
  moneyforward: {
    name: 'マネーフォワード',
    description: 'マネーフォワードクラウド会計対応',
    color: '#3b82f6',
  },
};
