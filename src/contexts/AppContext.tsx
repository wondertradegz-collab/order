import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  Customer,
  Document,
  Quotation,
  Invoice,
  Receipt,
  AppSettings,
  DocumentType,
  LineItem,
  Product,
  PaymentRecord,
  ElectronicStamp,
  DocumentTemplate,
} from '../types';

// デフォルト設定
const defaultSettings: AppSettings = {
  companyInfo: {
    name: '',
    postalCode: '',
    address: '',
    phone: '',
    email: '',
    bankName: '',
    bankBranch: '',
    accountType: '普通',
    accountNumber: '',
    accountName: '',
    registrationNumber: '',
  },
  defaultTaxRate: 10,
  documentNumberPrefix: {
    quotation: 'Q',
    invoice: 'INV',
    receipt: 'R',
  },
  nextNumbers: {
    quotation: 1,
    invoice: 1,
    receipt: 1,
  },
  stamps: [],
};

interface AppContextType {
  // 顧客
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;

  // 書類
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id' | 'documentNumber' | 'createdAt' | 'updatedAt'>) => Document;
  updateDocument: (id: string, doc: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  deleteDocuments: (ids: string[]) => void; // 一括削除
  getDocument: (id: string) => Document | undefined;
  getDocumentsByType: (type: DocumentType) => Document[];
  getDocumentsByCustomer: (customerId: string) => Document[];
  duplicateDocument: (id: string) => Document | null; // 複製

  // 見積書から請求書へ変換
  convertToInvoice: (quotationId: string, dueDate: string) => Invoice | null;
  // 請求書から領収書へ変換
  convertToReceipt: (invoiceId: string, paymentMethod?: string, proviso?: string) => Receipt | null;

  // 消し込み（入金処理）
  paymentRecords: PaymentRecord[];
  recordPayment: (invoiceId: string, amount: number, paidDate: string, method?: string, note?: string) => void;
  getPaymentsByInvoice: (invoiceId: string) => PaymentRecord[];

  // 商品マスタ
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // 設定
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // 電子印
  addStamp: (stamp: Omit<ElectronicStamp, 'id' | 'createdAt'>) => ElectronicStamp;
  updateStamp: (id: string, stamp: Partial<ElectronicStamp>) => void;
  deleteStamp: (id: string) => void;

  // テンプレート
  templates: DocumentTemplate[];
  addTemplate: (template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => DocumentTemplate;
  updateTemplate: (id: string, template: Partial<DocumentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesByType: (type: DocumentType) => DocumentTemplate[];

  // ユーティリティ
  generateDocumentNumber: (type: DocumentType) => string;
  calculateTotals: (items: LineItem[]) => { subtotal: number; taxAmount: number; total: number };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('invoice-app-customers', []);
  const [documents, setDocuments] = useLocalStorage<Document[]>('invoice-app-documents', []);
  const [products, setProducts] = useLocalStorage<Product[]>('invoice-app-products', []);
  const [paymentRecords, setPaymentRecords] = useLocalStorage<PaymentRecord[]>('invoice-app-payments', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('invoice-app-settings', defaultSettings);
  const [templates, setTemplates] = useLocalStorage<DocumentTemplate[]>('invoice-app-templates', []);

  // 顧客操作
  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, [setCustomers]);

  const updateCustomer = useCallback((id: string, customer: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...customer, updatedAt: new Date().toISOString() } : c
      )
    );
  }, [setCustomers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, [setCustomers]);

  const getCustomer = useCallback((id: string) => {
    return customers.find((c) => c.id === id);
  }, [customers]);

  // 書類番号生成
  const generateDocumentNumber = useCallback((type: DocumentType): string => {
    const prefix = settings.documentNumberPrefix[type];
    const number = settings.nextNumbers[type];
    const paddedNumber = String(number).padStart(5, '0');

    // 次の番号を更新
    setSettings((prev) => ({
      ...prev,
      nextNumbers: {
        ...prev.nextNumbers,
        [type]: prev.nextNumbers[type] + 1,
      },
    }));

    // 年度プレフィックスが有効な場合
    if (settings.useYearPrefix) {
      const year = new Date().getFullYear();
      const yearStr = settings.yearPrefixFormat === 'short' ? String(year).slice(2) : String(year);
      return `${prefix}-${yearStr}-${paddedNumber}`;
    }

    return `${prefix}-${paddedNumber}`;
  }, [settings, setSettings]);

  // 金額計算
  const calculateTotals = useCallback((items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce(
      (sum, item) => sum + Math.floor(item.quantity * item.unitPrice * (item.taxRate / 100)),
      0
    );
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, []);

  // 書類操作
  const addDocument = useCallback((doc: Omit<Document, 'id' | 'documentNumber' | 'createdAt' | 'updatedAt'>): Document => {
    const now = new Date().toISOString();
    const documentNumber = generateDocumentNumber(doc.type);
    const totals = calculateTotals(doc.items);

    const newDoc = {
      ...doc,
      ...totals,
      id: uuidv4(),
      documentNumber,
      createdAt: now,
      updatedAt: now,
    } as Document;

    setDocuments((prev) => [...prev, newDoc]);
    return newDoc;
  }, [generateDocumentNumber, calculateTotals, setDocuments]);

  const updateDocument = useCallback((id: string, doc: Partial<Document>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;

        const updatedItems = doc.items || d.items;
        const totals = calculateTotals(updatedItems);

        return {
          ...d,
          ...doc,
          ...totals,
          updatedAt: new Date().toISOString(),
        } as Document;
      })
    );
  }, [calculateTotals, setDocuments]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, [setDocuments]);

  const deleteDocuments = useCallback((ids: string[]) => {
    setDocuments((prev) => prev.filter((d) => !ids.includes(d.id)));
  }, [setDocuments]);

  const getDocument = useCallback((id: string) => {
    return documents.find((d) => d.id === id);
  }, [documents]);

  const getDocumentsByType = useCallback((type: DocumentType) => {
    return documents.filter((d) => d.type === type);
  }, [documents]);

  const getDocumentsByCustomer = useCallback((customerId: string) => {
    return documents.filter((d) => d.customerId === customerId);
  }, [documents]);

  // 書類の複製
  const duplicateDocument = useCallback((id: string): Document | null => {
    const original = documents.find((d) => d.id === id);
    if (!original) return null;

    const now = new Date().toISOString();
    const documentNumber = generateDocumentNumber(original.type);

    const duplicated = {
      ...original,
      id: uuidv4(),
      documentNumber,
      status: 'draft' as const,
      issueDate: now.split('T')[0],
      items: original.items.map((item) => ({ ...item, id: uuidv4() })),
      createdAt: now,
      updatedAt: now,
    };

    // 請求書の場合は入金情報をリセット
    if (duplicated.type === 'invoice') {
      (duplicated as Invoice).paidAmount = 0;
      (duplicated as Invoice).paidDate = undefined;
    }

    setDocuments((prev) => [...prev, duplicated as Document]);
    return duplicated as Document;
  }, [documents, generateDocumentNumber, setDocuments]);

  // 見積書→請求書変換
  const convertToInvoice = useCallback((quotationId: string, dueDate: string): Invoice | null => {
    const quotation = documents.find((d) => d.id === quotationId && d.type === 'quotation') as Quotation | undefined;
    if (!quotation) return null;

    const now = new Date().toISOString();
    const documentNumber = generateDocumentNumber('invoice');
    const totals = calculateTotals(quotation.items);

    const newInvoice: Invoice = {
      id: uuidv4(),
      documentNumber,
      type: 'invoice',
      status: 'draft',
      customerId: quotation.customerId,
      issueDate: now.split('T')[0],
      dueDate,
      items: quotation.items.map((item) => ({ ...item, id: uuidv4() })),
      ...totals,
      paidAmount: 0,
      notes: quotation.notes,
      quotationId,
      createdAt: now,
      updatedAt: now,
    };

    setDocuments((prev) => [...prev, newInvoice]);
    return newInvoice;
  }, [documents, generateDocumentNumber, calculateTotals, setDocuments]);

  // 請求書→領収書変換
  const convertToReceipt = useCallback((invoiceId: string, paymentMethod?: string, proviso?: string): Receipt | null => {
    const invoice = documents.find((d) => d.id === invoiceId && d.type === 'invoice') as Invoice | undefined;
    if (!invoice) return null;

    const now = new Date().toISOString();
    const documentNumber = generateDocumentNumber('receipt');

    const newReceipt: Receipt = {
      id: uuidv4(),
      documentNumber,
      type: 'receipt',
      status: 'paid',
      customerId: invoice.customerId,
      issueDate: now.split('T')[0],
      items: invoice.items.map((item) => ({ ...item, id: uuidv4() })),
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      paymentMethod,
      proviso: proviso || 'お品代として',
      invoiceId,
      createdAt: now,
      updatedAt: now,
    };

    setDocuments((prev) => [...prev, newReceipt]);
    return newReceipt;
  }, [documents, generateDocumentNumber, setDocuments]);

  // 消し込み処理（入金履歴も記録）
  const recordPayment = useCallback((invoiceId: string, amount: number, paidDate: string, method?: string, note?: string) => {
    // 入金履歴を追加
    const paymentRecord: PaymentRecord = {
      id: uuidv4(),
      invoiceId,
      amount,
      paidDate,
      method,
      note,
      createdAt: new Date().toISOString(),
    };
    setPaymentRecords((prev) => [...prev, paymentRecord]);

    // 請求書を更新
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== invoiceId || d.type !== 'invoice') return d;

        const invoice = d as Invoice;
        const newPaidAmount = invoice.paidAmount + amount;
        const newStatus = newPaidAmount >= invoice.total ? 'paid' : invoice.status;

        return {
          ...invoice,
          paidAmount: newPaidAmount,
          paidDate: newPaidAmount >= invoice.total ? paidDate : invoice.paidDate,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [setPaymentRecords, setDocuments]);

  const getPaymentsByInvoice = useCallback((invoiceId: string) => {
    return paymentRecords.filter((p) => p.invoiceId === invoiceId);
  }, [paymentRecords]);

  // 商品マスタ操作
  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, [setProducts]);

  const updateProduct = useCallback((id: string, product: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...product, updatedAt: new Date().toISOString() } : p
      )
    );
  }, [setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, [setProducts]);

  // 設定更新
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      companyInfo: {
        ...prev.companyInfo,
        ...(newSettings.companyInfo || {}),
      },
    }));
  }, [setSettings]);

  // 電子印操作
  const addStamp = useCallback((stamp: Omit<ElectronicStamp, 'id' | 'createdAt'>): ElectronicStamp => {
    const now = new Date().toISOString();
    const newStamp: ElectronicStamp = {
      ...stamp,
      id: uuidv4(),
      createdAt: now,
    };
    setSettings((prev) => ({
      ...prev,
      stamps: [...(prev.stamps || []), newStamp],
    }));
    return newStamp;
  }, [setSettings]);

  const updateStamp = useCallback((id: string, stamp: Partial<ElectronicStamp>) => {
    setSettings((prev) => ({
      ...prev,
      stamps: (prev.stamps || []).map((s) =>
        s.id === id ? { ...s, ...stamp } : s
      ),
    }));
  }, [setSettings]);

  const deleteStamp = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      stamps: (prev.stamps || []).filter((s) => s.id !== id),
    }));
  }, [setSettings]);

  // テンプレート操作
  const addTemplate = useCallback((template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): DocumentTemplate => {
    const now = new Date().toISOString();
    const newTemplate: DocumentTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  }, [setTemplates]);

  const updateTemplate = useCallback((id: string, template: Partial<DocumentTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...template, updatedAt: new Date().toISOString() } : t
      )
    );
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, [setTemplates]);

  const getTemplatesByType = useCallback((type: DocumentType) => {
    return templates.filter((t) => t.type === type);
  }, [templates]);

  const value = useMemo(() => ({
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    deleteDocuments,
    getDocument,
    getDocumentsByType,
    getDocumentsByCustomer,
    duplicateDocument,
    convertToInvoice,
    convertToReceipt,
    paymentRecords,
    recordPayment,
    getPaymentsByInvoice,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    settings,
    updateSettings,
    addStamp,
    updateStamp,
    deleteStamp,
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType,
    generateDocumentNumber,
    calculateTotals,
  }), [
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    deleteDocuments,
    getDocument,
    getDocumentsByType,
    getDocumentsByCustomer,
    duplicateDocument,
    convertToInvoice,
    convertToReceipt,
    paymentRecords,
    recordPayment,
    getPaymentsByInvoice,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    settings,
    updateSettings,
    addStamp,
    updateStamp,
    deleteStamp,
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType,
    generateDocumentNumber,
    calculateTotals,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
