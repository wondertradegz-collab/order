export type Language = 'ja' | 'zh' | 'en';

export const translations = {
  // Common
  common: {
    save: { ja: '保存', zh: '保存', en: 'Save' },
    cancel: { ja: 'キャンセル', zh: '取消', en: 'Cancel' },
    delete: { ja: '削除', zh: '删除', en: 'Delete' },
    edit: { ja: '編集', zh: '编辑', en: 'Edit' },
    create: { ja: '作成', zh: '创建', en: 'Create' },
    add: { ja: '追加', zh: '添加', en: 'Add' },
    close: { ja: '閉じる', zh: '关闭', en: 'Close' },
    confirm: { ja: '確認', zh: '确认', en: 'Confirm' },
    search: { ja: '検索', zh: '搜索', en: 'Search' },
    filter: { ja: 'フィルター', zh: '筛选', en: 'Filter' },
    all: { ja: 'すべて', zh: '全部', en: 'All' },
    loading: { ja: '読み込み中...', zh: '加载中...', en: 'Loading...' },
    noData: { ja: 'データがありません', zh: '没有数据', en: 'No data' },
    error: { ja: 'エラー', zh: '错误', en: 'Error' },
    success: { ja: '成功', zh: '成功', en: 'Success' },
    warning: { ja: '警告', zh: '警告', en: 'Warning' },
    yes: { ja: 'はい', zh: '是', en: 'Yes' },
    no: { ja: 'いいえ', zh: '否', en: 'No' },
    back: { ja: '戻る', zh: '返回', en: 'Back' },
    next: { ja: '次へ', zh: '下一步', en: 'Next' },
    preview: { ja: 'プレビュー', zh: '预览', en: 'Preview' },
    print: { ja: '印刷', zh: '打印', en: 'Print' },
    download: { ja: 'ダウンロード', zh: '下载', en: 'Download' },
    export: { ja: 'エクスポート', zh: '导出', en: 'Export' },
    import: { ja: 'インポート', zh: '导入', en: 'Import' },
    duplicate: { ja: '複製', zh: '复制', en: 'Duplicate' },
    status: { ja: 'ステータス', zh: '状态', en: 'Status' },
    date: { ja: '日付', zh: '日期', en: 'Date' },
    amount: { ja: '金額', zh: '金额', en: 'Amount' },
    total: { ja: '合計', zh: '合计', en: 'Total' },
    subtotal: { ja: '小計', zh: '小计', en: 'Subtotal' },
    tax: { ja: '消費税', zh: '消费税', en: 'Tax' },
    notes: { ja: '備考', zh: '备注', en: 'Notes' },
    description: { ja: '説明', zh: '说明', en: 'Description' },
    quantity: { ja: '数量', zh: '数量', en: 'Quantity' },
    unitPrice: { ja: '単価', zh: '单价', en: 'Unit Price' },
    taxRate: { ja: '税率', zh: '税率', en: 'Tax Rate' },
    yen: { ja: '円', zh: '日元', en: 'JPY' },
    yuan: { ja: '元', zh: '元', en: 'CNY' },
    actions: { ja: '操作', zh: '操作', en: 'Actions' },
    people: { ja: '人', zh: '人', en: '' },
    items: { ja: '件', zh: '项', en: '' },
  },

  // App Header & Navigation
  nav: {
    appName: { ja: '請求書管理', zh: '发票管理', en: 'Invoice Manager' },
    dashboard: { ja: 'ダッシュボード', zh: '仪表板', en: 'Dashboard' },
    quotations: { ja: '見積書', zh: '报价单', en: 'Quotations' },
    invoices: { ja: '請求書', zh: '发票', en: 'Invoices' },
    receipts: { ja: '領収書', zh: '收据', en: 'Receipts' },
    customers: { ja: '顧客管理', zh: '客户管理', en: 'Customers' },
    products: { ja: '商品管理', zh: '商品管理', en: 'Products' },
    expenses: { ja: '経費精算', zh: '费用报销', en: 'Expenses' },
    expenseSplits: { ja: '割り勘精算', zh: '分摊结算', en: 'Expense Splits' },
    memos: { ja: 'メモ・タスク', zh: '备忘录', en: 'Memos' },
    reports: { ja: 'レポート', zh: '报表', en: 'Reports' },
    settings: { ja: '設定', zh: '设置', en: 'Settings' },
  },

  // Settings
  settings: {
    title: { ja: '設定', zh: '设置', en: 'Settings' },
    language: { ja: '言語', zh: '语言', en: 'Language' },
    mode: { ja: 'モード', zh: '模式', en: 'Mode' },
    lightMode: { ja: 'ライトモード', zh: '浅色模式', en: 'Light Mode' },
    darkMode: { ja: 'ダークモード', zh: '深色模式', en: 'Dark Mode' },
    manual: { ja: 'マニュアル', zh: '使用手册', en: 'Manual' },
    japanese: { ja: '日本語', zh: '日语', en: 'Japanese' },
    chinese: { ja: '中国語(簡体字)', zh: '简体中文', en: 'Chinese (Simplified)' },
    english: { ja: '英語', zh: '英语', en: 'English' },
    companyInfo: { ja: '会社情報', zh: '公司信息', en: 'Company Info' },
    companyName: { ja: '会社名', zh: '公司名称', en: 'Company Name' },
    representative: { ja: '代表者名', zh: '代表人', en: 'Representative' },
    postalCode: { ja: '郵便番号', zh: '邮政编码', en: 'Postal Code' },
    address: { ja: '住所', zh: '地址', en: 'Address' },
    phone: { ja: '電話番号', zh: '电话', en: 'Phone' },
    email: { ja: 'メールアドレス', zh: '邮箱', en: 'Email' },
    website: { ja: 'ウェブサイト', zh: '网站', en: 'Website' },
    registrationNumber: { ja: '登録番号', zh: '注册号', en: 'Registration No.' },
    invoiceSettings: { ja: '請求書設定', zh: '发票设置', en: 'Invoice Settings' },
    defaultTaxRate: { ja: 'デフォルト税率', zh: '默认税率', en: 'Default Tax Rate' },
    defaultPaymentTerms: { ja: 'デフォルト支払条件', zh: '默认付款条件', en: 'Default Payment Terms' },
    defaultNotes: { ja: 'デフォルト備考', zh: '默认备注', en: 'Default Notes' },
    bankInfo: { ja: '振込先情報', zh: '银行信息', en: 'Bank Info' },
    bankName: { ja: '銀行名', zh: '银行名称', en: 'Bank Name' },
    branchName: { ja: '支店名', zh: '分行名称', en: 'Branch Name' },
    accountType: { ja: '口座種別', zh: '账户类型', en: 'Account Type' },
    accountNumber: { ja: '口座番号', zh: '账号', en: 'Account No.' },
    accountHolder: { ja: '口座名義', zh: '户名', en: 'Account Holder' },
    stamps: { ja: '電子印鑑', zh: '电子印章', en: 'Electronic Stamps' },
    templates: { ja: 'テンプレート', zh: '模板', en: 'Templates' },
    itemSets: { ja: '明細セット', zh: '明细集', en: 'Item Sets' },
    dataManagement: { ja: 'データ管理', zh: '数据管理', en: 'Data Management' },
    backup: { ja: 'バックアップを作成', zh: '创建备份', en: 'Create Backup' },
    restore: { ja: 'バックアップから復元', zh: '从备份恢复', en: 'Restore from Backup' },
    dataWarning: { ja: 'すべてのデータはブラウザのローカルストレージに保存されています。ブラウザのデータを削除するとデータが失われる可能性があります。定期的にバックアップを取ることをお勧めします。', zh: '所有数据都保存在浏览器的本地存储中。删除浏览器数据可能会导致数据丢失。建议定期备份。', en: 'All data is stored in your browser\'s local storage. Clearing browser data may cause data loss. Regular backups are recommended.' },
  },

  // Dashboard
  dashboard: {
    title: { ja: 'ダッシュボード', zh: '仪表板', en: 'Dashboard' },
    subtitle: { ja: '売上状況と最新の書類を確認できます', zh: '查看销售情况和最新文档', en: 'View sales status and latest documents' },
    monthlySales: { ja: '今月の売上', zh: '本月销售额', en: 'Monthly Sales' },
    unpaid: { ja: '未入金', zh: '未付款', en: 'Unpaid' },
    overdue: { ja: '期限超過', zh: '已逾期', en: 'Overdue' },
    customerCount: { ja: '顧客数', zh: '客户数', en: 'Customers' },
    items: { ja: '件', zh: '件', en: 'items' },
    recentDocuments: { ja: '最近の書類', zh: '最近的文档', en: 'Recent Documents' },
    quickActions: { ja: 'クイックアクション', zh: '快捷操作', en: 'Quick Actions' },
    createQuotation: { ja: '見積書作成', zh: '创建报价单', en: 'Create Quotation' },
    createInvoice: { ja: '請求書作成', zh: '创建发票', en: 'Create Invoice' },
    createReceipt: { ja: '領収書作成', zh: '创建收据', en: 'Create Receipt' },
    newQuotation: { ja: '新しい見積書を作成', zh: '创建新报价单', en: 'Create new quotation' },
    newInvoice: { ja: '新しい請求書を作成', zh: '创建新发票', en: 'Create new invoice' },
    newReceipt: { ja: '新しい領収書を作成', zh: '创建新收据', en: 'Create new receipt' },
    keyboardShortcuts: { ja: 'キーボードショートカット', zh: '键盘快捷键', en: 'Keyboard Shortcuts' },
    shortcutSearch: { ja: 'Cmd/Ctrl + K でクイック検索', zh: 'Cmd/Ctrl + K 快速搜索', en: 'Cmd/Ctrl + K for quick search' },
    shortcutNew: { ja: 'Cmd/Ctrl + N で新規請求書作成', zh: 'Cmd/Ctrl + N 创建新发票', en: 'Cmd/Ctrl + N for new invoice' },
    tips: { ja: '便利なヒント', zh: '实用提示', en: 'Helpful Tips' },
    tip1: { ja: '見積書は請求書に変換できます', zh: '报价单可以转换为发票', en: 'Quotations can be converted to invoices' },
    tip2: { ja: '入金済みの請求書から領収書を発行できます', zh: '可以从已付款的发票生成收据', en: 'Receipts can be issued from paid invoices' },
    welcome: { ja: 'ようこそ', zh: '欢迎', en: 'Welcome' },
    welcomeMessage: { ja: '請求書管理システムへようこそ。左のメニューから各機能にアクセスできます。', zh: '欢迎使用发票管理系统。您可以从左侧菜单访问各项功能。', en: 'Welcome to Invoice Manager. Access features from the menu on the left.' },
  },

  // Documents
  documents: {
    quotation: { ja: '見積書', zh: '报价单', en: 'Quotation' },
    invoice: { ja: '請求書', zh: '发票', en: 'Invoice' },
    receipt: { ja: '領収書', zh: '收据', en: 'Receipt' },
    documentNumber: { ja: '書類番号', zh: '文档编号', en: 'Document No.' },
    issueDate: { ja: '発行日', zh: '发行日期', en: 'Issue Date' },
    dueDate: { ja: '支払期限', zh: '付款期限', en: 'Due Date' },
    validUntil: { ja: '有効期限', zh: '有效期至', en: 'Valid Until' },
    customer: { ja: '顧客', zh: '客户', en: 'Customer' },
    lineItems: { ja: '明細', zh: '明细', en: 'Line Items' },
    addItem: { ja: '明細を追加', zh: '添加明细', en: 'Add Item' },
    itemName: { ja: '品名', zh: '品名', en: 'Item Name' },
    convertToInvoice: { ja: '請求書に変換', zh: '转换为发票', en: 'Convert to Invoice' },
    issueReceipt: { ja: '領収書を発行', zh: '开具收据', en: 'Issue Receipt' },
    recordPayment: { ja: '入金を記録', zh: '记录付款', en: 'Record Payment' },
    paymentAmount: { ja: '入金額', zh: '付款金额', en: 'Payment Amount' },
    paymentDate: { ja: '入金日', zh: '付款日期', en: 'Payment Date' },
    paymentMethod: { ja: '支払方法', zh: '付款方式', en: 'Payment Method' },
    paidAmount: { ja: '入金済み', zh: '已付金额', en: 'Paid Amount' },
    remainingAmount: { ja: '残額', zh: '余额', en: 'Remaining' },
    paymentHistory: { ja: '入金履歴', zh: '付款历史', en: 'Payment History' },
    sendEmail: { ja: 'メール送付', zh: '发送邮件', en: 'Send Email' },
    pdfExport: { ja: 'PDF出力', zh: 'PDF导出', en: 'Export PDF' },
    deleteConfirm: { ja: 'を削除しますか？この操作は取り消せません。', zh: '确定要删除吗？此操作无法撤销。', en: 'Are you sure you want to delete? This cannot be undone.' },
    noDocuments: { ja: '書類がありません', zh: '没有文档', en: 'No documents' },
    createFirst: { ja: '最初の書類を作成しましょう', zh: '创建您的第一个文档', en: 'Create your first document' },
  },

  // Document Status
  status: {
    draft: { ja: '下書き', zh: '草稿', en: 'Draft' },
    sent: { ja: '送付済み', zh: '已发送', en: 'Sent' },
    paid: { ja: '入金済み', zh: '已付款', en: 'Paid' },
    overdue: { ja: '期限超過', zh: '已逾期', en: 'Overdue' },
    cancelled: { ja: 'キャンセル', zh: '已取消', en: 'Cancelled' },
    partiallyPaid: { ja: '一部入金', zh: '部分付款', en: 'Partially Paid' },
    completed: { ja: '完了', zh: '已完成', en: 'Completed' },
    invoiced: { ja: '請求済み', zh: '已开票', en: 'Invoiced' },
  },

  // Customers
  customers: {
    title: { ja: '顧客管理', zh: '客户管理', en: 'Customer Management' },
    subtitle: { ja: '顧客情報を管理します', zh: '管理客户信息', en: 'Manage customer information' },
    addCustomer: { ja: '顧客を追加', zh: '添加客户', en: 'Add Customer' },
    editCustomer: { ja: '顧客を編集', zh: '编辑客户', en: 'Edit Customer' },
    customerName: { ja: '顧客名', zh: '客户名', en: 'Customer Name' },
    companyName: { ja: '会社名', zh: '公司名', en: 'Company Name' },
    contactPerson: { ja: '担当者名', zh: '联系人', en: 'Contact Person' },
    totalSales: { ja: '合計売上', zh: '总销售额', en: 'Total Sales' },
    documentCount: { ja: '書類数', zh: '文档数', en: 'Documents' },
    noCustomers: { ja: '顧客がいません', zh: '没有客户', en: 'No customers' },
    addFirstCustomer: { ja: '最初の顧客を追加しましょう', zh: '添加您的第一个客户', en: 'Add your first customer' },
    defaultExchangeRate: { ja: 'デフォルト為替レート', zh: '默认汇率', en: 'Default Exchange Rate' },
  },

  // Products
  products: {
    title: { ja: '商品管理', zh: '商品管理', en: 'Product Management' },
    subtitle: { ja: 'よく使う商品を登録しておくと、書類作成時に選択できます', zh: '注册常用商品，可在创建文档时选择', en: 'Register frequently used products for quick selection when creating documents' },
    addProduct: { ja: '商品を追加', zh: '添加商品', en: 'Add Product' },
    editProduct: { ja: '商品を編集', zh: '编辑商品', en: 'Edit Product' },
    productName: { ja: '商品名', zh: '商品名', en: 'Product Name' },
    productCode: { ja: '商品コード', zh: '商品编号', en: 'Product Code' },
    category: { ja: 'カテゴリ', zh: '分类', en: 'Category' },
    noProducts: { ja: '商品がありません', zh: '没有商品', en: 'No products' },
    addFirstProduct: { ja: '最初の商品を追加しましょう', zh: '添加您的第一个商品', en: 'Add your first product' },
  },

  // Expenses
  expenses: {
    title: { ja: '経費精算', zh: '费用报销', en: 'Expense Reports' },
    subtitle: { ja: 'WeChat Pay等の経費を記録し、請求書に追加できます', zh: '记录微信支付等费用，可添加到发票中', en: 'Record expenses from WeChat Pay etc. and add to invoices' },
    createReport: { ja: '経費レポート作成', zh: '创建费用报告', en: 'Create Expense Report' },
    editReport: { ja: '経費レポート編集', zh: '编辑费用报告', en: 'Edit Expense Report' },
    reportName: { ja: 'レポート名', zh: '报告名称', en: 'Report Name' },
    expenseDate: { ja: '日付', zh: '日期', en: 'Date' },
    amountRMB: { ja: '金額(RMB)', zh: '金额(人民币)', en: 'Amount (RMB)' },
    amountJPY: { ja: '金額(円)', zh: '金额(日元)', en: 'Amount (JPY)' },
    exchangeRate: { ja: '為替レート', zh: '汇率', en: 'Exchange Rate' },
    yenPerYuan: { ja: '円/元', zh: '日元/人民币', en: 'JPY/CNY' },
    fetchLatestRate: { ja: '最新レート取得', zh: '获取最新汇率', en: 'Fetch Latest Rate' },
    fetchHistoricalRate: { ja: 'この日のレートを取得', zh: '获取当日汇率', en: 'Fetch Rate for This Date' },
    monthlyAverage: { ja: '今月平均', zh: '本月平均', en: 'Monthly Average' },
    historicalRateFetch: { ja: '過去の日付で為替レートを取得', zh: '获取历史日期的汇率', en: 'Fetch historical exchange rate' },
    screenshot: { ja: 'スクショ', zh: '截图', en: 'Screenshot' },
    addRow: { ja: '行を追加', zh: '添加行', en: 'Add Row' },
    addToInvoice: { ja: '請求書に追加', zh: '添加到发票', en: 'Add to Invoice' },
    selectInvoice: { ja: '請求書を選択', zh: '选择发票', en: 'Select Invoice' },
    totalRMB: { ja: '合計(RMB)', zh: '合计(人民币)', en: 'Total (RMB)' },
    totalJPY: { ja: '合計(円)', zh: '合计(日元)', en: 'Total (JPY)' },
    noExpenses: { ja: '経費レポートがありません', zh: '没有费用报告', en: 'No expense reports' },
    addFirstExpense: { ja: '最初の経費レポートを作成しましょう', zh: '创建您的第一个费用报告', en: 'Create your first expense report' },
    categories: {
      transportation: { ja: '交通費', zh: '交通费', en: 'Transportation' },
      accommodation: { ja: '宿泊費', zh: '住宿费', en: 'Accommodation' },
      meals: { ja: '飲食費', zh: '餐饮费', en: 'Meals' },
      communication: { ja: '通信費', zh: '通讯费', en: 'Communication' },
      supplies: { ja: '消耗品', zh: '办公用品', en: 'Supplies' },
      other: { ja: 'その他', zh: '其他', en: 'Other' },
    },
  },

  // Reports
  reports: {
    title: { ja: 'レポート', zh: '报表', en: 'Reports' },
    overview: { ja: '概要', zh: '概览', en: 'Overview' },
    aging: { ja: '売掛金年齢', zh: '账龄分析', en: 'Aging' },
    cashflow: { ja: 'キャッシュフロー', zh: '现金流', en: 'Cash Flow' },
    productAnalysis: { ja: '商品分析', zh: '商品分析', en: 'Product Analysis' },
    goals: { ja: '目標', zh: '目标', en: 'Goals' },
    period: { ja: '期間', zh: '期间', en: 'Period' },
    thisMonth: { ja: '今月', zh: '本月', en: 'This Month' },
    lastMonth: { ja: '先月', zh: '上月', en: 'Last Month' },
    thisYear: { ja: '今年', zh: '今年', en: 'This Year' },
    custom: { ja: 'カスタム', zh: '自定义', en: 'Custom' },
    startDate: { ja: '開始日', zh: '开始日期', en: 'Start Date' },
    endDate: { ja: '終了日', zh: '结束日期', en: 'End Date' },
    revenue: { ja: '売上', zh: '销售额', en: 'Revenue' },
    invoiced: { ja: '請求額', zh: '开票金额', en: 'Invoiced' },
    collected: { ja: '入金額', zh: '收款金额', en: 'Collected' },
    outstanding: { ja: '未入金', zh: '未付款', en: 'Outstanding' },
    monthlyGoal: { ja: '月間目標', zh: '月度目标', en: 'Monthly Goal' },
    progress: { ja: '進捗', zh: '进度', en: 'Progress' },
  },

  // Manual
  manual: {
    title: { ja: '使用マニュアル', zh: '使用手册', en: 'User Manual' },
    gettingStarted: { ja: 'はじめに', zh: '开始使用', en: 'Getting Started' },
    gettingStartedContent: {
      ja: 'このアプリは請求書、見積書、領収書を管理するためのツールです。すべてのデータはブラウザのローカルストレージに保存されます。',
      zh: '这是一个用于管理发票、报价单和收据的工具。所有数据都保存在浏览器的本地存储中。',
      en: 'This app is a tool for managing invoices, quotations, and receipts. All data is stored in your browser\'s local storage.',
    },
    features: { ja: '主な機能', zh: '主要功能', en: 'Main Features' },

    // Dashboard section
    dashboardGuide: { ja: 'ダッシュボード', zh: '仪表板', en: 'Dashboard' },
    dashboardContent: {
      ja: 'ダッシュボードでは売上状況、未入金額、期限超過の請求書数などを一目で確認できます。クイックアクションから素早く新規書類を作成できます。',
      zh: '在仪表板上可以一目了然地查看销售情况、未付款金额、逾期发票数量等。可以通过快捷操作快速创建新文档。',
      en: 'The dashboard shows sales status, unpaid amounts, and overdue invoices at a glance. Quick actions allow you to create new documents quickly.',
    },

    // Document creation section
    documentCreation: { ja: '書類作成', zh: '创建文档', en: 'Creating Documents' },
    documentCreationContent: {
      ja: '見積書、請求書、領収書を作成できます。顧客を選択し、明細を追加して保存します。見積書は請求書に、入金済み請求書は領収書に変換できます。',
      zh: '可以创建报价单、发票和收据。选择客户，添加明细后保存。报价单可转换为发票，已付款的发票可转换为收据。',
      en: 'Create quotations, invoices, and receipts. Select a customer, add line items, and save. Quotations can be converted to invoices, and paid invoices can be converted to receipts.',
    },

    // Customer management section
    customerManagement: { ja: '顧客管理', zh: '客户管理', en: 'Customer Management' },
    customerManagementContent: {
      ja: '顧客情報を登録しておくと、書類作成時に選択できます。会社名、担当者名、住所、連絡先などを管理できます。',
      zh: '注册客户信息后，可在创建文档时选择。可以管理公司名称、联系人、地址、联系方式等。',
      en: 'Register customer information for selection when creating documents. Manage company names, contacts, addresses, and contact information.',
    },

    // Product management section
    productManagement: { ja: '商品管理', zh: '商品管理', en: 'Product Management' },
    productManagementContent: {
      ja: 'よく使う商品を登録しておくと、書類の明細に素早く追加できます。商品名、単価、税率を設定できます。',
      zh: '注册常用商品后，可以快速添加到文档明细中。可以设置商品名称、单价和税率。',
      en: 'Register frequently used products for quick addition to document line items. Set product names, unit prices, and tax rates.',
    },

    // Expense tracking section
    expenseTracking: { ja: '経費精算', zh: '费用报销', en: 'Expense Tracking' },
    expenseTrackingContent: {
      ja: '出張などの経費を記録し、請求書に追加できます。為替レート（人民元→日本円）の自動取得や、過去のレート取得にも対応しています。',
      zh: '记录出差等费用，可添加到发票中。支持自动获取汇率（人民币→日元）和获取历史汇率。',
      en: 'Record expenses from business trips and add them to invoices. Supports automatic exchange rate fetching (CNY to JPY) and historical rates.',
    },

    // Reports section
    reportsGuide: { ja: 'レポート', zh: '报表', en: 'Reports' },
    reportsContent: {
      ja: '売上レポート、売掛金年齢分析、キャッシュフロー分析などを確認できます。期間を指定してデータを絞り込めます。',
      zh: '可以查看销售报表、账龄分析、现金流分析等。可以指定期间筛选数据。',
      en: 'View sales reports, aging analysis, and cash flow analysis. Filter data by specifying date ranges.',
    },

    // Settings section
    settingsGuide: { ja: '設定', zh: '设置', en: 'Settings' },
    settingsContent: {
      ja: '会社情報、振込先情報、デフォルト税率、電子印鑑などを設定できます。データのバックアップと復元もここから行えます。',
      zh: '可以设置公司信息、银行信息、默认税率、电子印章等。数据的备份和恢复也在这里进行。',
      en: 'Configure company information, bank details, default tax rates, and electronic stamps. Data backup and restore can also be done here.',
    },

    // Tips section
    tips: { ja: '便利なヒント', zh: '实用提示', en: 'Tips' },
    tip1: {
      ja: 'Cmd/Ctrl + K でクイック検索を開けます',
      zh: '按 Cmd/Ctrl + K 打开快速搜索',
      en: 'Press Cmd/Ctrl + K to open quick search',
    },
    tip2: {
      ja: 'Cmd/Ctrl + N で新規請求書を作成できます',
      zh: '按 Cmd/Ctrl + N 创建新发票',
      en: 'Press Cmd/Ctrl + N to create a new invoice',
    },
    tip3: {
      ja: '定期的にバックアップを取ることをお勧めします',
      zh: '建议定期备份数据',
      en: 'We recommend regular backups',
    },
    tip4: {
      ja: '書類のプレビューからPDF出力や印刷ができます',
      zh: '可以从文档预览导出PDF或打印',
      en: 'Export PDF or print from document preview',
    },

    // Keyboard shortcuts
    keyboardShortcuts: { ja: 'キーボードショートカット', zh: '键盘快捷键', en: 'Keyboard Shortcuts' },
    shortcutList: {
      ja: [
        { key: 'Cmd/Ctrl + K', action: 'クイック検索を開く' },
        { key: 'Cmd/Ctrl + N', action: '新規請求書作成' },
        { key: 'Escape', action: 'モーダルを閉じる' },
      ],
      zh: [
        { key: 'Cmd/Ctrl + K', action: '打开快速搜索' },
        { key: 'Cmd/Ctrl + N', action: '创建新发票' },
        { key: 'Escape', action: '关闭弹窗' },
      ],
      en: [
        { key: 'Cmd/Ctrl + K', action: 'Open quick search' },
        { key: 'Cmd/Ctrl + N', action: 'Create new invoice' },
        { key: 'Escape', action: 'Close modal' },
      ],
    },

    // FAQ
    faq: { ja: 'よくある質問', zh: '常见问题', en: 'FAQ' },
    faqItems: {
      ja: [
        { q: 'データはどこに保存されますか？', a: 'ブラウザのローカルストレージに保存されます。別のブラウザやデバイスからはアクセスできません。' },
        { q: 'データを別のデバイスに移行できますか？', a: '設定画面からバックアップをエクスポートし、別のデバイスでインポートすることで移行できます。' },
        { q: '印刷やPDF出力はできますか？', a: '各書類の詳細画面から印刷やPDF出力が可能です。' },
      ],
      zh: [
        { q: '数据保存在哪里？', a: '数据保存在浏览器的本地存储中。无法从其他浏览器或设备访问。' },
        { q: '可以将数据迁移到其他设备吗？', a: '可以从设置页面导出备份，然后在其他设备上导入。' },
        { q: '可以打印或导出PDF吗？', a: '可以从每个文档的详情页面打印或导出PDF。' },
      ],
      en: [
        { q: 'Where is data stored?', a: 'Data is stored in your browser\'s local storage. It cannot be accessed from other browsers or devices.' },
        { q: 'Can I migrate data to another device?', a: 'You can export a backup from the settings page and import it on another device.' },
        { q: 'Can I print or export to PDF?', a: 'You can print or export to PDF from each document\'s detail page.' },
      ],
    },
  },

  // Date Input
  dateInput: {
    placeholder: { ja: 'YYYY/MM/DD', zh: 'YYYY/MM/DD', en: 'YYYY/MM/DD' },
    invalidFormat: { ja: '無効な日付形式です', zh: '无效的日期格式', en: 'Invalid date format' },
    example: { ja: '例: 2024/01/15, 2024-01-15, 2024年1月15日', zh: '例: 2024/01/15, 2024-01-15, 2024年1月15日', en: 'e.g. 2024/01/15, 2024-01-15, Jan 15 2024' },
    selectFromCalendar: { ja: 'カレンダーから選択', zh: '从日历选择', en: 'Select from calendar' },
    switchToCalendar: { ja: 'カレンダー入力に切替', zh: '切换到日历输入', en: 'Switch to calendar' },
    switchToText: { ja: 'テキスト入力に切替', zh: '切换到文本输入', en: 'Switch to text' },
  },

  // Sorting
  sort: {
    newest: { ja: '新しい順', zh: '最新', en: 'Newest' },
    oldest: { ja: '古い順', zh: '最早', en: 'Oldest' },
    amountHigh: { ja: '金額が高い順', zh: '金额从高到低', en: 'Amount (High)' },
    amountLow: { ja: '金額が低い順', zh: '金额从低到高', en: 'Amount (Low)' },
  },

  // Payment methods
  paymentMethods: {
    bankTransfer: { ja: '銀行振込', zh: '银行转账', en: 'Bank Transfer' },
    cash: { ja: '現金', zh: '现金', en: 'Cash' },
    creditCard: { ja: 'クレジットカード', zh: '信用卡', en: 'Credit Card' },
    directDebit: { ja: '口座振替', zh: '银行代扣', en: 'Direct Debit' },
    other: { ja: 'その他', zh: '其他', en: 'Other' },
  },

  // Account types
  accountTypes: {
    savings: { ja: '普通', zh: '活期', en: 'Savings' },
    checking: { ja: '当座', zh: '支票', en: 'Checking' },
  },

  // Memos & Tasks
  memos: {
    title: { ja: 'メモ・タスク', zh: '备忘录和任务', en: 'Memos & Tasks' },
    subtitle: { ja: 'メモやタスクを管理します', zh: '管理备忘录和任务', en: 'Manage memos and tasks' },
    addMemo: { ja: 'メモを追加', zh: '添加备忘录', en: 'Add Memo' },
    addTask: { ja: 'タスクを追加', zh: '添加任务', en: 'Add Task' },
    editMemo: { ja: 'メモを編集', zh: '编辑备忘录', en: 'Edit Memo' },
    editTask: { ja: 'タスクを編集', zh: '编辑任务', en: 'Edit Task' },
    memo: { ja: 'メモ', zh: '备忘录', en: 'Memo' },
    task: { ja: 'タスク', zh: '任务', en: 'Task' },
    memoTitle: { ja: 'タイトル', zh: '标题', en: 'Title' },
    content: { ja: '内容', zh: '内容', en: 'Content' },
    dueDate: { ja: '期限', zh: '截止日期', en: 'Due Date' },
    priority: { ja: '優先度', zh: '优先级', en: 'Priority' },
    priorityLow: { ja: '低', zh: '低', en: 'Low' },
    priorityMedium: { ja: '中', zh: '中', en: 'Medium' },
    priorityHigh: { ja: '高', zh: '高', en: 'High' },
    linkCustomer: { ja: '顧客に関連付け', zh: '关联客户', en: 'Link to Customer' },
    linkDocument: { ja: '書類に関連付け', zh: '关联文档', en: 'Link to Document' },
    noLink: { ja: 'なし', zh: '无', en: 'None' },
    completed: { ja: '完了', zh: '已完成', en: 'Completed' },
    incomplete: { ja: '未完了', zh: '未完成', en: 'Incomplete' },
    markComplete: { ja: '完了にする', zh: '标记为完成', en: 'Mark Complete' },
    markIncomplete: { ja: '未完了にする', zh: '标记为未完成', en: 'Mark Incomplete' },
    noMemos: { ja: 'メモやタスクがありません', zh: '没有备忘录或任务', en: 'No memos or tasks' },
    addFirstMemo: { ja: '最初のメモを追加しましょう', zh: '添加您的第一条备忘录', en: 'Add your first memo' },
    filterAll: { ja: 'すべて', zh: '全部', en: 'All' },
    filterMemos: { ja: 'メモのみ', zh: '仅备忘录', en: 'Memos Only' },
    filterTasks: { ja: 'タスクのみ', zh: '仅任务', en: 'Tasks Only' },
    filterIncomplete: { ja: '未完了のみ', zh: '仅未完成', en: 'Incomplete Only' },
    overdueTasks: { ja: '期限超過のタスク', zh: '已逾期的任务', en: 'Overdue Tasks' },
    upcomingTasks: { ja: '近日中のタスク', zh: '即将到期的任务', en: 'Upcoming Tasks' },
    todayTasks: { ja: '今日のタスク', zh: '今天的任务', en: 'Today\'s Tasks' },
    incompleteTasks: { ja: '未完了タスク', zh: '未完成的任务', en: 'Incomplete Tasks' },
    deleteConfirm: { ja: 'このメモを削除しますか？', zh: '确定要删除此备忘录吗？', en: 'Delete this memo?' },
    type: { ja: '種類', zh: '类型', en: 'Type' },
  },

  // Expense Split (割り勘経費)
  expenseSplit: {
    title: { ja: '割り勘精算', zh: '分摊结算', en: 'Expense Splitting' },
    subtitle: { ja: 'グループでの経費を分割して請求書を自動生成', zh: '分摊团体费用并自动生成发票', en: 'Split group expenses and auto-generate invoices' },
    create: { ja: '新規作成', zh: '新建', en: 'Create New' },
    edit: { ja: '編集', zh: '编辑', en: 'Edit' },
    noData: { ja: '割り勘精算がありません', zh: '没有分摊结算', en: 'No expense splits' },
    createFirst: { ja: '最初の割り勘精算を作成しましょう', zh: '创建您的第一个分摊结算', en: 'Create your first expense split' },
    deleteConfirm: { ja: 'この割り勘精算を削除しますか？', zh: '确定要删除此分摊结算吗？', en: 'Delete this expense split?' },

    // Basic Info
    basicInfo: { ja: '基本情報', zh: '基本信息', en: 'Basic Information' },
    name: { ja: '精算名', zh: '结算名称', en: 'Split Name' },
    namePlaceholder: { ja: '例：広州202403精算', zh: '例：广州202403结算', en: 'e.g. Guangzhou Mar 2024' },
    descriptionPlaceholder: { ja: '説明やメモ', zh: '说明或备注', en: 'Description or notes' },
    paidBy: { ja: '立替者', zh: '垫付人', en: 'Paid By' },
    selectPaidBy: { ja: '立替した人を選択', zh: '选择垫付人', en: 'Select who paid' },
    payer: { ja: '立替', zh: '垫付', en: 'Payer' },

    // Status
    statusConfirmed: { ja: '確定', zh: '已确认', en: 'Confirmed' },
    statusPartiallyInvoiced: { ja: '一部請求済', zh: '部分已开票', en: 'Partially Invoiced' },
    statusFullyInvoiced: { ja: '全請求済', zh: '全部已开票', en: 'Fully Invoiced' },

    // Participants
    participants: { ja: '参加者', zh: '参与者', en: 'Participants' },
    addParticipant: { ja: '参加者を追加', zh: '添加参与者', en: 'Add Participant' },
    editParticipant: { ja: '参加者を編集', zh: '编辑参与者', en: 'Edit Participant' },
    noParticipants: { ja: '参加者を追加してください', zh: '请添加参与者', en: 'Please add participants' },
    participantName: { ja: '名前', zh: '姓名', en: 'Name' },
    participantNamePlaceholder: { ja: '例：田中さん', zh: '例：田中', en: 'e.g. Tanaka' },
    linkedCustomer: { ja: '顧客連携', zh: '关联客户', en: 'Linked Customer' },
    noCustomerLink: { ja: '連携なし', zh: '无关联', en: 'No link' },
    customerLinkHelp: { ja: '顧客を連携すると請求書を自動発行できます', zh: '关联客户后可自动生成发票', en: 'Link a customer to auto-generate invoices' },
    totalShare: { ja: '負担額', zh: '分摊金额', en: 'Share' },

    // Invoice & Payment
    invoiceStatus: { ja: '請求書', zh: '发票', en: 'Invoice' },
    paymentStatus: { ja: '振込', zh: '付款', en: 'Payment' },
    issued: { ja: '発行済', zh: '已开具', en: 'Issued' },
    issueInvoice: { ja: '発行', zh: '开具', en: 'Issue' },
    invoiced: { ja: '請求済', zh: '已开票', en: 'Invoiced' },
    paid: { ja: '振込済', zh: '已付款', en: 'Paid' },
    generateInvoice: { ja: '請求書を発行', zh: '开具发票', en: 'Generate Invoice' },
    invoiceFor: { ja: 'への請求書を発行:', zh: '开具发票金额:', en: 'invoice for:' },
    invoiceNotesPlaceholder: { ja: '請求書の備考', zh: '发票备注', en: 'Invoice notes' },

    // Items
    expenseItems: { ja: '経費明細', zh: '费用明细', en: 'Expense Items' },
    addItem: { ja: '明細を追加', zh: '添加明细', en: 'Add Item' },
    editItem: { ja: '明細を編集', zh: '编辑明细', en: 'Edit Item' },
    noItems: { ja: '経費明細を追加してください', zh: '请添加费用明细', en: 'Please add expense items' },
    addParticipantsFirst: { ja: '先に参加者を追加してください', zh: '请先添加参与者', en: 'Please add participants first' },
    itemCount: { ja: '明細数', zh: '明细数', en: 'Items' },
    itemDescriptionPlaceholder: { ja: '例：レンタカー、ホテル、食事など', zh: '例：租车、酒店、餐饮等', en: 'e.g. Car rental, hotel, meals' },
    receipt: { ja: '領収書', zh: '收据', en: 'Receipt' },
    receiptUrl: { ja: '領収書URL', zh: '收据链接', en: 'Receipt URL' },

    // Split
    splitAmounts: { ja: '負担額の配分', zh: '分摊金额分配', en: 'Split Amounts' },
    splitEqually: { ja: '均等に分割', zh: '平均分摊', en: 'Split Equally' },
    splitTotal: { ja: '配分合計', zh: '分摊合计', en: 'Split Total' },
    splitMismatch: { ja: '合計と一致していません', zh: '与总金额不符', en: 'Does not match total' },
  },
} as const;

// Helper function to get translation
export function t(
  key: string,
  lang: Language
): string {
  const keys = key.split('.');
  let result: any = translations;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (result && typeof result === 'object' && lang in result) {
    return result[lang];
  }

  return key;
}

// Helper to get nested translation object
export function getTranslation<T>(obj: T, lang: Language): any {
  if (obj && typeof obj === 'object') {
    if (lang in obj) {
      return (obj as any)[lang];
    }
  }
  return obj;
}
