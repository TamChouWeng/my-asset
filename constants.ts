import { AssetType } from './types';

export const COLORS: Record<AssetType, string> = {
  [AssetType.Stock]: '#3b82f6', // blue-500
  [AssetType.ETF]: '#06b6d4', // cyan-500
  [AssetType.FixedDeposit]: '#10b981', // emerald-500
  [AssetType.EPF]: '#8b5cf6', // violet-500
  [AssetType.REIT]: '#f59e0b', // amber-500
  [AssetType.Property]: '#ef4444', // red-500
  [AssetType.Other]: '#64748b', // slate-500
};

// Color palette for individual assets breakdown
export const DETAIL_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
  '#a855f7', // purple-500
];

// Keywords used to determine Property Cash Flow
export const PROPERTY_ACTIONS = {
  OUTFLOW: ['buy', 'pay', 'installment', 'downpayment', 'maintenance', 'expense', 'tax', 'renovation'],
  INFLOW: ['rent', 'income', 'sold', 'dividend']
};

export type Language = 'en' | 'zh' | 'ms';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav_dashboard': 'Dashboard',
    'nav_property': 'Property',
    'nav_fixed_deposit': 'Fixed Deposit',
    'nav_records': 'Records List',
    'nav_settings': 'Settings',

    // Header/Titles
    'title_dashboard': 'Overview',
    'title_property': 'Property Analysis',
    'title_fixed_deposit': 'Fixed Deposit Portfolio',
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
    'stat_fd_principal': 'Total Principal (Active)',
    'stat_fd_interest': 'Total Expected Interest',

    // Charts & Widgets
    'chart_asset_allocation': 'Asset Allocation',
    'chart_breakdown': 'Breakdown',
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
    'table_maturity': 'Maturity Date',
    'table_interest': 'Interest',
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
    'nav_fixed_deposit': '定期存款',
    'nav_records': '记录列表',
    'nav_settings': '设置',

    'title_dashboard': '概览',
    'title_property': '房产分析',
    'title_fixed_deposit': '定期存款组合',
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
    'stat_fd_principal': '总本金 (活跃)',
    'stat_fd_interest': '预期总利息',

    'chart_asset_allocation': '资产配置',
    'chart_breakdown': '细分',
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
    'table_maturity': '到期日',
    'table_interest': '利息',
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
    'nav_fixed_deposit': 'Simpanan Tetap',
    'nav_records': 'Senarai Rekod',
    'nav_settings': 'Tetapan',

    'title_dashboard': 'Gambaran Keseluruhan',
    'title_property': 'Analisis Hartanah',
    'title_fixed_deposit': 'Portfolio Simpanan Tetap',
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
    'stat_fd_principal': 'Jumlah Prinsipal (Aktif)',
    'stat_fd_interest': 'Jangkaan Jumlah Faedah',

    'chart_asset_allocation': 'Peruntukan Aset',
    'chart_breakdown': 'Pecahan',
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
    'table_maturity': 'Tarikh Matang',
    'table_interest': 'Faedah',
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