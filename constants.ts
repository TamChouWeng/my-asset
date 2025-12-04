import { AssetRecord, AssetStatus, AssetType } from './types';

// Helper to generate IDs
const uid = () => Math.random().toString(36).substr(2, 9);

// Data parsed from the user's provided CSV text for the initial state
export const INITIAL_DATA: AssetRecord[] = [
  // Block 1: Gold/Other
  {
    id: uid(),
    date: '2025-08-24',
    type: AssetType.Other,
    name: 'Buy Gold',
    action: 'Buy',
    unitPrice: 4850,
    quantity: 1,
    amount: 4850,
    status: AssetStatus.Active,
    remarks: 'Gold price: RM485/100g 999 Gold 10gram'
  },
  // Block 2: Fixed Deposits
  { id: uid(), date: '2025-07-01', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 11000, interestDividend: 203.5, maturityDate: '2026-01-07', status: AssetStatus.Active, remarks: 'Rate: 3.7%, Tenure: 6m' },
  { id: uid(), date: '2025-10-31', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 3000, interestDividend: 37.5, maturityDate: '2026-01-31', status: AssetStatus.Active, remarks: 'Rate: 5%, Tenure: 3m' },
  { id: uid(), date: '2025-08-06', type: AssetType.FixedDeposit, name: 'RHB', action: 'Deposit', amount: 5000, interestDividend: 86.25, maturityDate: '2026-02-06', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-08-28', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 5000, interestDividend: 86.25, maturityDate: '2026-02-28', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-05', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 15000, interestDividend: 258.75, maturityDate: '2026-03-05', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-12', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 8000, interestDividend: 138, maturityDate: '2026-03-12', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-20', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 6000, interestDividend: 106.5, maturityDate: '2026-03-20', status: AssetStatus.Active, remarks: 'Rate: 3.55%, Tenure: 6m' },
  { id: uid(), date: '2025-09-26', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 7000, interestDividend: 120.75, maturityDate: '2026-03-26', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-09-28', type: AssetType.FixedDeposit, name: 'Maybank', action: 'Deposit', amount: 10000, interestDividend: 172.5, maturityDate: '2026-03-28', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-10-02', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 12000, interestDividend: 207, maturityDate: '2026-04-02', status: AssetStatus.Active, remarks: 'Rate: 3.45%, Tenure: 6m' },
  { id: uid(), date: '2025-11-08', type: AssetType.FixedDeposit, name: 'Public Bank', action: 'Deposit', amount: 12000, interestDividend: 222, maturityDate: '2026-05-08', status: AssetStatus.Active, remarks: 'Rate: 3.7%, Tenure: 6m' },

  // Block 3: Property (Assuming negative pay is outflow, but for asset tracking we often track Equity or Value. 
  // For this list, we'll record them but maybe filtered in charts if negative)
  // Converting dates 27-11-2025 to 2025-11-27
  { id: uid(), date: '2025-11-27', type: AssetType.Property, name: 'The Skies', action: 'Pay', unitPrice: 110.1, quantity: 1, amount: 110.1, status: AssetStatus.Active, remarks: 'MLTA Dec 2025' },
  { id: uid(), date: '2025-08-01', type: AssetType.Property, name: 'The Skies', action: 'Pay', unitPrice: 1000, quantity: 1, amount: 1000, status: AssetStatus.Active, remarks: 'Downpay for 1 time' },

  // Block 4: EPF/Stock/REIT
  { id: uid(), date: '2025-11-27', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-11-07', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 1334, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-11-06', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-30', type: AssetType.Stock, name: 'KOPI', action: 'Buy', unitPrice: 1.4, quantity: 200, amount: 280, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-29', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-15', type: AssetType.REIT, name: 'SUNWAY', action: 'Buy', unitPrice: 5.54, quantity: 100, amount: 554, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-17', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 2.42, quantity: 200, amount: 484, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-15', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 2.4, quantity: 200, amount: 480, status: AssetStatus.Active },
  { id: uid(), date: '2025-10-09', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 1380, quantity: 1, status: AssetStatus.Active },
  
  // Dividends (Usually Action: Dividend, Amount is 0 in the user CSV but Fee/Interest has value. I will normalize Amount to the Interest Value for tracking purpose if 0)
  { id: uid(), date: '2025-09-26', type: AssetType.Stock, name: 'PBBANK', action: 'Dividend', amount: 10.5, interestDividend: 10.5, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-25', type: AssetType.Stock, name: 'AMWAY', action: 'Dividend', amount: 10, interestDividend: 10, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Dividend', amount: 120, interestDividend: 120, status: AssetStatus.Active },
  
  { id: uid(), date: '2025-09-25', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-17', type: AssetType.REIT, name: 'SUNREIT', action: 'Buy', unitPrice: 2.05, quantity: 200, amount: 410, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-12', type: AssetType.EPF, name: 'EPF', action: 'Employee contribute', amount: 3312, quantity: 1, status: AssetStatus.Active },
  { id: uid(), date: '2025-09-10', type: AssetType.REIT, name: 'PAVREIT', action: 'Buy', unitPrice: 1.75, quantity: 100, amount: 175, status: AssetStatus.Active },

  // Aug 26 Stock Spree
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'AMWAY', action: 'Buy', unitPrice: 6.83, quantity: 200, amount: 1366, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'BIMB', action: 'Buy', unitPrice: 2.47, quantity: 100, amount: 247, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'FFB', action: 'Buy', unitPrice: 1.47, quantity: 200, amount: 294, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'GENTING', action: 'Buy', unitPrice: 4.14, quantity: 100, amount: 414, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'KOPI', action: 'Buy', unitPrice: 0.867, quantity: 200, amount: 173.4, status: AssetStatus.Mature, remarks: 'Rakuten Trade' }, // Status Mature in CSV
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Buy', unitPrice: 9.7, quantity: 100, amount: 970, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PADINI', action: 'Buy', unitPrice: 2.18, quantity: 100, amount: 218, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PBBANK', action: 'Buy', unitPrice: 4.36, quantity: 100, amount: 436, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'SIME', action: 'Buy', unitPrice: 2.22, quantity: 100, amount: 222, status: AssetStatus.Active, remarks: 'Rakuten Trade' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'BIMB', action: 'Buy', unitPrice: 2.33, quantity: 200, amount: 466, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'MAYBANK', action: 'Buy', unitPrice: 9.92, quantity: 400, amount: 3968, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'PBBANK', action: 'Buy', unitPrice: 4.335, quantity: 200, amount: 867, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'RHBBANK', action: 'Buy', unitPrice: 6.15, quantity: 100, amount: 615, status: AssetStatus.Active, remarks: 'M+ Global' },
  { id: uid(), date: '2025-08-26', type: AssetType.Stock, name: 'TM', action: 'Buy', unitPrice: 6.62, quantity: 200, amount: 1324, status: AssetStatus.Active, remarks: 'M+ Global' },

  // Big EPF entry
  { id: uid(), date: '2025-08-24', type: AssetType.EPF, name: 'EPF', action: 'Balance', amount: 62824.81, quantity: 1, status: AssetStatus.Active, remarks: 'EPF by far' },

  // Older EPF
  { id: uid(), date: '2025-08-06', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-07-24', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 200, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-06-13', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 500, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
  { id: uid(), date: '2025-05-16', type: AssetType.EPF, name: 'EPF', action: 'Self contribute', amount: 300, quantity: 1, status: AssetStatus.Mature, remarks: 'EPF record only' },
];

export const COLORS: Record<AssetType, string> = {
  [AssetType.Stock]: '#3b82f6', // blue-500
  [AssetType.FixedDeposit]: '#10b981', // emerald-500
  [AssetType.EPF]: '#8b5cf6', // violet-500
  [AssetType.REIT]: '#f59e0b', // amber-500
  [AssetType.Property]: '#ef4444', // red-500
  [AssetType.Other]: '#64748b', // slate-500
};

export type Language = 'en' | 'zh' | 'ms';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav_dashboard': 'Dashboard',
    'nav_property': 'Property',
    'nav_records': 'Records List',
    'nav_settings': 'Settings',
    
    // Header/Titles
    'title_dashboard': 'Overview',
    'title_property': 'Property Analysis',
    'title_records': 'All Transactions',
    'title_settings': 'Settings',
    'subtitle_dashboard': 'Manage your wealth effectively',
    'subtitle_settings': 'Customize your application experience',
    
    // Buttons
    'btn_export': 'Export CSV',
    'btn_add': 'Add Record',
    'btn_cancel': 'Cancel',
    'btn_save': 'Save Record',
    'btn_delete_selected': 'Delete Selected',

    // Stats
    'stat_total_assets': 'Total Assets (Active)',
    'stat_top_asset': 'Top Asset Class',
    'stat_total_records': 'Total Records',
    'stat_net_worth': 'Total Net Worth',

    // Charts & Widgets
    'chart_asset_allocation': 'Asset Allocation',
    'chart_net_worth_trend': 'Net Worth Trend',
    'chart_breakdown': 'Breakdown',
    'chart_history': 'History',
    'chart_view_allocation': 'View Allocation',
    'chart_view_trend': 'View Trend',
    'chart_no_data': 'No active assets to display for this category',
    'recent_activity': 'Recent Activity',
    
    // Property Analysis
    'prop_cash_flow': 'Property Cash Flow',
    'prop_desc': 'Installments vs. Rental Income',
    'prop_invested': 'Total Invested (Outflow)',
    'prop_returned': 'Total Returned (Rent)',
    'prop_net_flow': 'Net Cash Flow',
    'prop_transactions': 'Property Transactions',
    'prop_investment_phase': 'Investment Phase',
    'prop_recovered': 'Recovered',
    'prop_profit_phase': 'Profit Phase',
    
    // Table Headers
    'table_date': 'Date',
    'table_type': 'Type',
    'table_name': 'Name',
    'table_action': 'Action',
    'table_amount': 'Amount',
    'table_status': 'Status',
    'table_actions': 'Actions',
    'search_placeholder': 'Search by name or remarks...',
    'all_types': 'All Types',
    'all_assets': 'All Assets',
    'no_records': 'No records found matching your filters.',

    // Settings
    'setting_theme': 'Appearance',
    'setting_theme_desc': 'Switch between light and dark themes',
    'setting_language': 'Language',
    'setting_language_desc': 'Select your preferred language',
    'theme_light': 'Light',
    'theme_dark': 'Dark',

    // Chatbot
    'chatbot_title': 'AI Financial Assistant',
    'chatbot_welcome': 'Hello! I can analyze your portfolio and answer questions about your assets.',
    'chatbot_input_placeholder': 'Ask a question...',
    'chatbot_thinking': 'Thinking...',
    'chatbot_error': 'Sorry, I encountered an error. Please try again.',
  },
  zh: {
    'nav_dashboard': '仪表板',
    'nav_property': '房产',
    'nav_records': '记录列表',
    'nav_settings': '设置',
    
    'title_dashboard': '概览',
    'title_property': '房产分析',
    'title_records': '所有交易',
    'title_settings': '设置',
    'subtitle_dashboard': '有效管理您的财富',
    'subtitle_settings': '自定义您的应用体验',
    
    'btn_export': '导出 CSV',
    'btn_add': '添加记录',
    'btn_cancel': '取消',
    'btn_save': '保存记录',
    'btn_delete_selected': '删除所选',

    'stat_total_assets': '总资产 (活跃)',
    'stat_top_asset': '主要资产类别',
    'stat_total_records': '总记录',
    'stat_net_worth': '总净值',

    'chart_asset_allocation': '资产配置',
    'chart_net_worth_trend': '净值趋势',
    'chart_breakdown': '细分',
    'chart_history': '历史',
    'chart_view_allocation': '查看配置',
    'chart_view_trend': '查看趋势',
    'chart_no_data': '此类别无活跃资产显示',
    'recent_activity': '近期活动',
    
    'prop_cash_flow': '房产现金流',
    'prop_desc': '分期付款 vs 租金收入',
    'prop_invested': '总投资 (流出)',
    'prop_returned': '总回报 (租金)',
    'prop_net_flow': '净现金流',
    'prop_transactions': '房产交易',
    'prop_investment_phase': '投资阶段',
    'prop_recovered': '已回收',
    'prop_profit_phase': '盈利阶段',
    
    'table_date': '日期',
    'table_type': '类型',
    'table_name': '名称',
    'table_action': '操作',
    'table_amount': '金额',
    'table_status': '状态',
    'table_actions': '操作',
    'search_placeholder': '按名称或备注搜索...',
    'all_types': '所有类型',
    'all_assets': '所有资产',
    'no_records': '未找到匹配的记录。',

    'setting_theme': '外观',
    'setting_theme_desc': '切换亮色和暗色主题',
    'setting_language': '语言',
    'setting_language_desc': '选择您的首选语言',
    'theme_light': '亮色',
    'theme_dark': '暗色',

    'chatbot_title': 'AI 财务助手',
    'chatbot_welcome': '你好！我可以分析您的投资组合并回答有关您资产的问题。',
    'chatbot_input_placeholder': '问一个问题...',
    'chatbot_thinking': '思考中...',
    'chatbot_error': '抱歉，我遇到了错误。请重试。',
  },
  ms: {
    'nav_dashboard': 'Papan Pemuka',
    'nav_property': 'Hartanah',
    'nav_records': 'Senarai Rekod',
    'nav_settings': 'Tetapan',
    
    'title_dashboard': 'Gambaran Keseluruhan',
    'title_property': 'Analisis Hartanah',
    'title_records': 'Semua Transaksi',
    'title_settings': 'Tetapan',
    'subtitle_dashboard': 'Urus kekayaan anda dengan berkesan',
    'subtitle_settings': 'Sesuaikan pengalaman aplikasi anda',
    
    'btn_export': 'Eksport CSV',
    'btn_add': 'Tambah Rekod',
    'btn_cancel': 'Batal',
    'btn_save': 'Simpan Rekod',
    'btn_delete_selected': 'Padam Dipilih',

    'stat_total_assets': 'Jumlah Aset (Aktif)',
    'stat_top_asset': 'Kelas Aset Utama',
    'stat_total_records': 'Jumlah Rekod',
    'stat_net_worth': 'Jumlah Nilai Bersih',

    'chart_asset_allocation': 'Peruntukan Aset',
    'chart_net_worth_trend': 'Trend Nilai Bersih',
    'chart_breakdown': 'Pecahan',
    'chart_history': 'Sejarah',
    'chart_view_allocation': 'Lihat Peruntukan',
    'chart_view_trend': 'Lihat Trend',
    'chart_no_data': 'Tiada aset aktif untuk dipaparkan',
    'recent_activity': 'Aktiviti Terkini',
    
    'prop_cash_flow': 'Aliran Tunai Hartanah',
    'prop_desc': 'Ansuran vs Pendapatan Sewa',
    'prop_invested': 'Jumlah Dilaburkan (Keluar)',
    'prop_returned': 'Jumlah Dipulangkan (Sewa)',
    'prop_net_flow': 'Aliran Tunai Bersih',
    'prop_transactions': 'Transaksi Hartanah',
    'prop_investment_phase': 'Fasa Pelaburan',
    'prop_recovered': 'Dipulihkan',
    'prop_profit_phase': 'Fasa Keuntungan',
    
    'table_date': 'Tarikh',
    'table_type': 'Jenis',
    'table_name': 'Nama',
    'table_action': 'Tindakan',
    'table_amount': 'Jumlah',
    'table_status': 'Status',
    'table_actions': 'Tindakan',
    'search_placeholder': 'Cari mengikut nama atau nota...',
    'all_types': 'Semua Jenis',
    'all_assets': 'Semua Aset',
    'no_records': 'Tiada rekod ditemui.',

    'setting_theme': 'Penampilan',
    'setting_theme_desc': 'Tukar antara tema cerah dan gelap',
    'setting_language': 'Bahasa',
    'setting_language_desc': 'Pilih bahasa pilihan anda',
    'theme_light': 'Cerah',
    'theme_dark': 'Gelap',

    'chatbot_title': 'Pembantu Kewangan AI',
    'chatbot_welcome': 'Helo! Saya boleh menganalisis portfolio anda dan menjawab soalan mengenai aset anda.',
    'chatbot_input_placeholder': 'Tanya soalan...',
    'chatbot_thinking': 'Sedang berfikir...',
    'chatbot_error': 'Maaf, saya menghadapi ralat. Sila cuba lagi.',
  }
};