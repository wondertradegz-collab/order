import React, { createContext, useContext, useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  isCloudSyncAvailable,
  loadFromCloud,
  saveToCloud,
  subscribeToCloudUpdates,
  createDebouncedSave,
  type SyncStatus,
  type CloudData,
} from '../lib/firestore-sync';
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
  ItemSet,
  ExpenseReport,
  Memo,
  ExpenseSplit,
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

  // 作業セット（明細セット）
  itemSets: ItemSet[];
  addItemSet: (itemSet: Omit<ItemSet, 'id' | 'createdAt' | 'updatedAt'>) => ItemSet;
  updateItemSet: (id: string, itemSet: Partial<ItemSet>) => void;
  deleteItemSet: (id: string) => void;

  // 経費レポート
  expenseReports: ExpenseReport[];
  addExpenseReport: (report: Omit<ExpenseReport, 'id' | 'createdAt' | 'updatedAt'>) => ExpenseReport;
  updateExpenseReport: (id: string, report: Partial<ExpenseReport>) => void;
  deleteExpenseReport: (id: string) => void;
  getExpenseReport: (id: string) => ExpenseReport | undefined;
  addExpenseToInvoice: (reportId: string, invoiceId: string, description: string) => LineItem | null;

  // メモ・タスク
  memos: Memo[];
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => Memo;
  updateMemo: (id: string, memo: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  getMemo: (id: string) => Memo | undefined;
  toggleMemoComplete: (id: string) => void;
  getMemosByCustomer: (customerId: string) => Memo[];
  getMemosByDocument: (documentId: string) => Memo[];
  getIncompleteTasks: () => Memo[];

  // 割り勘経費
  expenseSplits: ExpenseSplit[];
  addExpenseSplit: (split: Omit<ExpenseSplit, 'id' | 'createdAt' | 'updatedAt'>) => ExpenseSplit;
  updateExpenseSplit: (id: string, split: Partial<ExpenseSplit>) => void;
  deleteExpenseSplit: (id: string) => void;
  getExpenseSplit: (id: string) => ExpenseSplit | undefined;
  generateInvoiceForParticipant: (splitId: string, participantId: string, dueDate: string, notes?: string) => Invoice | null;
  updateParticipantPayment: (splitId: string, participantId: string, paymentReceived: boolean, paymentDate?: string) => void;

  // ユーティリティ
  generateDocumentNumber: (type: DocumentType) => string;
  calculateTotals: (items: LineItem[]) => { subtotal: number; taxAmount: number; total: number };

  // クラウド同期
  syncStatus: SyncStatus;
  isCloudEnabled: boolean;
  lastSyncTime: string | null;
  forceSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('invoice-app-customers', []);
  const [documents, setDocuments] = useLocalStorage<Document[]>('invoice-app-documents', []);
  const [products, setProducts] = useLocalStorage<Product[]>('invoice-app-products', []);
  const [paymentRecords, setPaymentRecords] = useLocalStorage<PaymentRecord[]>('invoice-app-payments', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('invoice-app-settings', defaultSettings);
  const [templates, setTemplates] = useLocalStorage<DocumentTemplate[]>('invoice-app-templates', []);
  const [itemSets, setItemSets] = useLocalStorage<ItemSet[]>('invoice-app-itemsets', []);
  const [expenseReports, setExpenseReports] = useLocalStorage<ExpenseReport[]>('invoice-app-expense-reports', []);
  const [memos, setMemos] = useLocalStorage<Memo[]>('invoice-app-memos', []);
  const [expenseSplits, setExpenseSplits] = useLocalStorage<ExpenseSplit[]>('invoice-app-expense-splits', []);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isCloudEnabled] = useState(() => isCloudSyncAvailable());
  const isInitialLoad = useRef(true);
  const skipNextSync = useRef(false);
  const debouncedSave = useRef(createDebouncedSave(2000));

  // Load initial data from cloud
  useEffect(() => {
    if (!isCloudEnabled) return;

    const loadInitialData = async () => {
      setSyncStatus('syncing');
      try {
        const cloudData = await loadFromCloud();
        if (cloudData) {
          skipNextSync.current = true;
          // Update local state with cloud data
          if (cloudData.customers.length > 0 || customers.length === 0) {
            setCustomers(cloudData.customers);
          }
          if (cloudData.documents.length > 0 || documents.length === 0) {
            setDocuments(cloudData.documents);
          }
          if (cloudData.products.length > 0 || products.length === 0) {
            setProducts(cloudData.products);
          }
          if (cloudData.expenseReports.length > 0 || expenseReports.length === 0) {
            setExpenseReports(cloudData.expenseReports);
          }
          if (cloudData.settings) {
            setSettings(cloudData.settings);
          }
          if (cloudData.templates.length > 0 || templates.length === 0) {
            setTemplates(cloudData.templates);
          }
          if (cloudData.memos.length > 0 || memos.length === 0) {
            setMemos(cloudData.memos);
          }
          if (cloudData.expenseSplits.length > 0 || expenseSplits.length === 0) {
            setExpenseSplits(cloudData.expenseSplits);
          }
          setLastSyncTime(cloudData.lastUpdated);
          setSyncStatus('synced');
        } else {
          // No cloud data, upload local data
          await saveToCloud({
            customers,
            documents,
            products,
            expenseReports,
            settings,
            templates,
            memos,
            expenseSplits,
          });
          setSyncStatus('synced');
        }
      } catch (error) {
        console.error('Failed to load from cloud:', error);
        setSyncStatus('error');
      }
      isInitialLoad.current = false;
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudEnabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isCloudEnabled) return;

    const unsubscribe = subscribeToCloudUpdates(
      (cloudData: CloudData) => {
        if (isInitialLoad.current) return;

        skipNextSync.current = true;
        setCustomers(cloudData.customers);
        setDocuments(cloudData.documents);
        setProducts(cloudData.products);
        setExpenseReports(cloudData.expenseReports);
        if (cloudData.settings) {
          setSettings(cloudData.settings);
        }
        setTemplates(cloudData.templates);
        setMemos(cloudData.memos);
        setExpenseSplits(cloudData.expenseSplits);
        setLastSyncTime(cloudData.lastUpdated);
        setSyncStatus('synced');
      },
      (error) => {
        console.error('Cloud subscription error:', error);
        setSyncStatus('error');
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudEnabled]);

  // Sync data changes to cloud (debounced)
  useEffect(() => {
    if (!isCloudEnabled || isInitialLoad.current) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    setSyncStatus('syncing');
    debouncedSave.current.save({
      customers,
      documents,
      products,
      expenseReports,
      settings,
      templates,
      memos,
      expenseSplits,
    });

    // Update sync status after debounce
    const timer = setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toISOString());
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    isCloudEnabled,
    customers,
    documents,
    products,
    expenseReports,
    settings,
    templates,
    memos,
    expenseSplits,
  ]);

  // Force sync function
  const forceSync = useCallback(async () => {
    if (!isCloudEnabled) return;

    setSyncStatus('syncing');
    try {
      await debouncedSave.current.flush();
      await saveToCloud({
        customers,
        documents,
        products,
        expenseReports,
        settings,
        templates,
        memos,
        expenseSplits,
      });
      setLastSyncTime(new Date().toISOString());
      setSyncStatus('synced');
    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncStatus('error');
    }
  }, [isCloudEnabled, customers, documents, products, expenseReports, settings, templates, memos, expenseSplits]);

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

  // 作業セット操作
  const addItemSet = useCallback((itemSet: Omit<ItemSet, 'id' | 'createdAt' | 'updatedAt'>): ItemSet => {
    const now = new Date().toISOString();
    const newItemSet: ItemSet = {
      ...itemSet,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setItemSets((prev) => [...prev, newItemSet]);
    return newItemSet;
  }, [setItemSets]);

  const updateItemSet = useCallback((id: string, itemSet: Partial<ItemSet>) => {
    setItemSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...itemSet, updatedAt: new Date().toISOString() } : s
      )
    );
  }, [setItemSets]);

  const deleteItemSet = useCallback((id: string) => {
    setItemSets((prev) => prev.filter((s) => s.id !== id));
  }, [setItemSets]);

  // 経費レポート操作
  const addExpenseReport = useCallback((report: Omit<ExpenseReport, 'id' | 'createdAt' | 'updatedAt'>): ExpenseReport => {
    const now = new Date().toISOString();
    const newReport: ExpenseReport = {
      ...report,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setExpenseReports((prev) => [...prev, newReport]);
    return newReport;
  }, [setExpenseReports]);

  const updateExpenseReport = useCallback((id: string, report: Partial<ExpenseReport>) => {
    setExpenseReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...report, updatedAt: new Date().toISOString() } : r
      )
    );
  }, [setExpenseReports]);

  const deleteExpenseReport = useCallback((id: string) => {
    setExpenseReports((prev) => prev.filter((r) => r.id !== id));
  }, [setExpenseReports]);

  const getExpenseReport = useCallback((id: string) => {
    return expenseReports.find((r) => r.id === id);
  }, [expenseReports]);

  // 経費レポートを請求書の明細に追加
  const addExpenseToInvoice = useCallback((reportId: string, invoiceId: string, description: string): LineItem | null => {
    const report = expenseReports.find((r) => r.id === reportId);
    if (!report) return null;

    // 明細行を作成（例：「出張費 / 645元 × 22.1円」）
    const newLineItem: LineItem = {
      id: uuidv4(),
      description: description || `経費精算 (${report.totalRMB}元 × ${report.exchangeRate}円)`,
      quantity: 1,
      unit: '式',
      unitPrice: report.totalJPY,
      taxRate: 0, // 経費は通常非課税
      taxCategory: 'non_taxable',
      foreignAmount: report.totalRMB,
      exchangeRate: report.exchangeRate,
      foreignCurrency: 'CNY',
      calculationNote: `(${report.totalRMB}元 × ${report.exchangeRate}円)`,
    };

    // 請求書を更新
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== invoiceId || d.type !== 'invoice') return d;
        const invoice = d as Invoice;
        const updatedItems = [...invoice.items, newLineItem];
        const totals = calculateTotals(updatedItems);
        return {
          ...invoice,
          items: updatedItems,
          ...totals,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // 経費レポートのステータスを更新
    setExpenseReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'invoiced' as const, invoiceId, updatedAt: new Date().toISOString() }
          : r
      )
    );

    return newLineItem;
  }, [expenseReports, setDocuments, setExpenseReports, calculateTotals]);

  // メモ・タスク操作
  const addMemo = useCallback((memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>): Memo => {
    const now = new Date().toISOString();
    const newMemo: Memo = {
      ...memo,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setMemos((prev) => [...prev, newMemo]);
    return newMemo;
  }, [setMemos]);

  const updateMemo = useCallback((id: string, memo: Partial<Memo>) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...memo, updatedAt: new Date().toISOString() } : m
      )
    );
  }, [setMemos]);

  const deleteMemo = useCallback((id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, [setMemos]);

  const getMemo = useCallback((id: string) => {
    return memos.find((m) => m.id === id);
  }, [memos]);

  const toggleMemoComplete = useCallback((id: string) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, completed: !m.completed, updatedAt: new Date().toISOString() } : m
      )
    );
  }, [setMemos]);

  const getMemosByCustomer = useCallback((customerId: string) => {
    return memos.filter((m) => m.customerId === customerId);
  }, [memos]);

  const getMemosByDocument = useCallback((documentId: string) => {
    return memos.filter((m) => m.documentId === documentId);
  }, [memos]);

  const getIncompleteTasks = useCallback(() => {
    return memos.filter((m) => m.isTask && !m.completed);
  }, [memos]);

  // 割り勘経費操作
  const addExpenseSplit = useCallback((split: Omit<ExpenseSplit, 'id' | 'createdAt' | 'updatedAt'>): ExpenseSplit => {
    const now = new Date().toISOString();
    const newSplit: ExpenseSplit = {
      ...split,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setExpenseSplits((prev) => [...prev, newSplit]);
    return newSplit;
  }, [setExpenseSplits]);

  const updateExpenseSplit = useCallback((id: string, split: Partial<ExpenseSplit>) => {
    setExpenseSplits((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...split, updatedAt: new Date().toISOString() } : s
      )
    );
  }, [setExpenseSplits]);

  const deleteExpenseSplit = useCallback((id: string) => {
    setExpenseSplits((prev) => prev.filter((s) => s.id !== id));
  }, [setExpenseSplits]);

  const getExpenseSplit = useCallback((id: string) => {
    return expenseSplits.find((s) => s.id === id);
  }, [expenseSplits]);

  // 参加者への請求書を自動生成
  const generateInvoiceForParticipant = useCallback((
    splitId: string,
    participantId: string,
    dueDate: string,
    notes?: string
  ): Invoice | null => {
    const split = expenseSplits.find((s) => s.id === splitId);
    if (!split) return null;

    const participant = split.participants.find((p) => p.id === participantId);
    if (!participant || !participant.customerId) return null;

    // 参加者の明細を作成
    const items: LineItem[] = split.items
      .filter((item) => {
        const participantSplit = item.splits.find((s) => s.participantId === participantId);
        return participantSplit && participantSplit.amount > 0;
      })
      .map((item) => {
        const participantSplit = item.splits.find((s) => s.participantId === participantId)!;
        return {
          id: uuidv4(),
          description: `${item.date} ${item.description}`,
          quantity: 1,
          unit: '式',
          unitPrice: participantSplit.amount,
          taxRate: 0, // 立替金は通常非課税
          taxCategory: 'non_taxable' as const,
        };
      });

    if (items.length === 0) return null;

    const now = new Date().toISOString();
    const documentNumber = generateDocumentNumber('invoice');
    const totals = calculateTotals(items);

    const newInvoice: Invoice = {
      id: uuidv4(),
      documentNumber,
      type: 'invoice',
      status: 'draft',
      customerId: participant.customerId,
      issueDate: now.split('T')[0],
      dueDate,
      items,
      ...totals,
      paidAmount: 0,
      notes: notes || `${split.name} 精算分`,
      createdAt: now,
      updatedAt: now,
    };

    setDocuments((prev) => [...prev, newInvoice]);

    // 参加者の請求書発行ステータスを更新
    setExpenseSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        const updatedParticipants = s.participants.map((p) =>
          p.id === participantId
            ? { ...p, invoiceId: newInvoice.id, invoiceIssued: true }
            : p
        );
        // 全員請求済みかチェック
        const allInvoiced = updatedParticipants
          .filter((p) => p.totalAmount > 0)
          .every((p) => p.invoiceIssued);
        return {
          ...s,
          participants: updatedParticipants,
          status: allInvoiced ? 'fully_invoiced' : 'partially_invoiced',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return newInvoice;
  }, [expenseSplits, generateDocumentNumber, calculateTotals, setDocuments, setExpenseSplits]);

  // 参加者の支払いステータスを更新
  const updateParticipantPayment = useCallback((
    splitId: string,
    participantId: string,
    paymentReceived: boolean,
    paymentDate?: string
  ) => {
    setExpenseSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        const updatedParticipants = s.participants.map((p) =>
          p.id === participantId
            ? { ...p, paymentReceived, paymentDate: paymentReceived ? paymentDate : undefined }
            : p
        );
        // 全員支払い済みかチェック
        const allPaid = updatedParticipants
          .filter((p) => p.totalAmount > 0)
          .every((p) => p.paymentReceived);
        return {
          ...s,
          participants: updatedParticipants,
          status: allPaid ? 'completed' : s.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [setExpenseSplits]);

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
    itemSets,
    addItemSet,
    updateItemSet,
    deleteItemSet,
    expenseReports,
    addExpenseReport,
    updateExpenseReport,
    deleteExpenseReport,
    getExpenseReport,
    addExpenseToInvoice,
    memos,
    addMemo,
    updateMemo,
    deleteMemo,
    getMemo,
    toggleMemoComplete,
    getMemosByCustomer,
    getMemosByDocument,
    getIncompleteTasks,
    expenseSplits,
    addExpenseSplit,
    updateExpenseSplit,
    deleteExpenseSplit,
    getExpenseSplit,
    generateInvoiceForParticipant,
    updateParticipantPayment,
    generateDocumentNumber,
    calculateTotals,
    // Cloud sync
    syncStatus,
    isCloudEnabled,
    lastSyncTime,
    forceSync,
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
    itemSets,
    addItemSet,
    updateItemSet,
    deleteItemSet,
    expenseReports,
    addExpenseReport,
    updateExpenseReport,
    deleteExpenseReport,
    getExpenseReport,
    addExpenseToInvoice,
    memos,
    addMemo,
    updateMemo,
    deleteMemo,
    getMemo,
    toggleMemoComplete,
    getMemosByCustomer,
    getMemosByDocument,
    getIncompleteTasks,
    expenseSplits,
    addExpenseSplit,
    updateExpenseSplit,
    deleteExpenseSplit,
    getExpenseSplit,
    generateInvoiceForParticipant,
    updateParticipantPayment,
    generateDocumentNumber,
    calculateTotals,
    syncStatus,
    isCloudEnabled,
    lastSyncTime,
    forceSync,
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
