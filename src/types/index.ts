// 書類の種類
export type DocumentType = 'quotation' | 'invoice' | 'receipt';

// 書類のステータス
export type DocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// 顧客
export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// 明細行
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string; // 単位（個、式、時間など）
  unitPrice: number;
  taxRate: number; // 消費税率 (10 = 10%)
  // 外貨計算用（例：中国元での立替を円に換算）
  foreignAmount?: number; // 外貨金額
  exchangeRate?: number; // 為替レート（例：23.08円/元）
  foreignCurrency?: string; // 通貨コード（例：CNY, USD）
}

// 商品マスタ
export interface Product {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  unitPrice: number;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
}

// 入金履歴
export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  paidDate: string;
  method?: string; // 支払方法
  note?: string;
  createdAt: string;
}

// 書類の基本情報
export interface BaseDocument {
  id: string;
  documentNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  customerId: string;
  issueDate: string;
  dueDate?: string; // 支払期限（請求書のみ）
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 見積書
export interface Quotation extends BaseDocument {
  type: 'quotation';
  validUntil?: string; // 見積有効期限
}

// 請求書
export interface Invoice extends BaseDocument {
  type: 'invoice';
  dueDate: string;
  paidAmount: number; // 入金済み金額
  paidDate?: string; // 入金日
  quotationId?: string; // 元の見積書ID
}

// 領収書
export interface Receipt extends BaseDocument {
  type: 'receipt';
  paymentMethod?: string; // 支払方法
  proviso?: string; // 但し書き（例：お品代として）
  invoiceId?: string; // 元の請求書ID
}

// 統合型
export type Document = Quotation | Invoice | Receipt;

// 電子印
export interface ElectronicStamp {
  id: string;
  name: string; // 印鑑の名前（例：承認印、担当印）
  text: string; // 印鑑に表示するテキスト（例：田中、鈴木）
  shape: 'circle' | 'square'; // 形状
  color: string; // 色（例：#FF0000）
  size: number; // サイズ（px）
  showDate: boolean; // 日付を表示するか
  createdAt: string;
}

// 会社情報（自社）
export interface CompanyInfo {
  name: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankBranch?: string;
  accountType?: string;
  accountNumber?: string;
  accountName?: string;
  registrationNumber?: string; // インボイス登録番号
  logoUrl?: string;
}

// 書類テンプレート
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  items: Omit<LineItem, 'id'>[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// アプリの設定
export interface AppSettings {
  companyInfo: CompanyInfo;
  defaultTaxRate: number;
  documentNumberPrefix: {
    quotation: string;
    invoice: string;
    receipt: string;
  };
  nextNumbers: {
    quotation: number;
    invoice: number;
    receipt: number;
  };
  stamps: ElectronicStamp[]; // 電子印のリスト
  useYearPrefix?: boolean; // 書類番号に年度プレフィックスを使用
  yearPrefixFormat?: 'full' | 'short'; // full: 2026, short: 26
}

// ダッシュボード用の統計
export interface DashboardStats {
  totalQuotations: number;
  totalInvoices: number;
  totalReceipts: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  thisMonthSales: number;
  overdueInvoices: number;
}
