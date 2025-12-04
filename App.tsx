import React, { useState, useMemo, useEffect } from 'react';
import { AssetRecord, AssetType } from './types';
import { INITIAL_DATA, TRANSLATIONS, Language } from './constants';
import PieChartComponent from './components/PieChartComponent';
import TransactionForm from './components/TransactionForm';
import Chatbot from './components/Chatbot';
import { downloadCSV } from './utils/csvHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Table2, 
  Plus, 
  Download, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  Wallet,
  Search,
  Filter,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

function App() {
  const [records, setRecords] = useState<AssetRecord[]>(INITIAL_DATA);
  const [view, setView] = useState<'dashboard' | 'property' | 'list' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  // Theme and Language State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<Language>('en');

  // Sidebar State
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  // Sorting and Batch Selection State
  const [sortConfig, setSortConfig] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Property Selection State
  const [selectedProperty, setSelectedProperty] = useState<string>('All');

  // Property Table State
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyRowsPerPage, setPropertyRowsPerPage] = useState(5);
  const [propertySort, setPropertySort] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);

  // Translation Helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Reset Property Pagination on Filter Change
  useEffect(() => {
    setPropertyPage(1);
  }, [selectedProperty]);

  // Computed Metrics
  const totalValue = useMemo(() => {
    return records
      .filter(r => r.status === 'Active')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [records]);

  const topAssetClass = useMemo(() => {
    const map = new Map<string, number>();
    records.filter(r => r.status === 'Active').forEach(r => {
      map.set(r.type, (map.get(r.type) || 0) + r.amount);
    });
    let top = { type: 'N/A', value: 0 };
    map.forEach((val, key) => {
      if (val > top.value) top = { type: key, value: val };
    });
    return top;
  }, [records]);

  // Property Specific Analysis
  const propertyNames = useMemo(() => {
    const props = records.filter(r => r.type === AssetType.Property).map(r => r.name);
    return Array.from(new Set(props)).sort();
  }, [records]);

  const propertyMetrics = useMemo(() => {
    // Filter by selected property name if not 'All'
    const propertyRecords = records.filter(r => 
      r.type === AssetType.Property && 
      (selectedProperty === 'All' || r.name === selectedProperty)
    );
    
    let totalInvested = 0; // Outflow (Buy, Installment, Pay, Renovation)
    let totalReturned = 0; // Inflow (Rent, Income, Sold)
    
    propertyRecords.forEach(r => {
      const action = r.action.toLowerCase();
      // Logic to categorize actions
      const isOutflow = ['buy', 'pay', 'installment', 'downpayment', 'maintenance', 'expense', 'tax', 'renovation'].some(k => action.includes(k));
      const isInflow = ['rent', 'income', 'sold', 'dividend'].some(k => action.includes(k));

      if (isOutflow) {
        totalInvested += r.amount;
      } else if (isInflow) {
        totalReturned += r.amount;
      }
    });

    return {
      totalInvested,
      totalReturned,
      netCashFlow: totalReturned - totalInvested,
      hasProperties: propertyRecords.length > 0,
      records: propertyRecords
    };
  }, [records, selectedProperty]);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => 
        (filterType === 'All' || r.type === filterType) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      // Default sort by date desc if no custom sort
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterType]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, sortConfig, itemsPerPage]);

  // Property Table Logic (Sorting & Pagination)
  const sortedPropertyRecords = useMemo(() => {
    let recs = [...propertyMetrics.records];
    if (propertySort) {
      recs.sort((a, b) => {
        const aVal = a[propertySort.key] ?? '';
        const bVal = b[propertySort.key] ?? '';
        if (aVal < bVal) return propertySort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return propertySort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
       // Default sort by date desc
       recs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return recs;
  }, [propertyMetrics.records, propertySort]);

  const propertyTotalPages = Math.ceil(sortedPropertyRecords.length / propertyRowsPerPage);
  const paginatedPropertyRecords = useMemo(() => {
    const start = (propertyPage - 1) * propertyRowsPerPage;
    return sortedPropertyRecords.slice(start, start + propertyRowsPerPage);
  }, [sortedPropertyRecords, propertyPage, propertyRowsPerPage]);

  // Handlers
  const handleSave = (data: Omit<AssetRecord, 'id'>) => {
    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...data, id: editingRecord.id } : r));
    } else {
      setRecords(prev => [...prev, { ...data, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedIds.has(id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
      setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    }
  };

  const handleEdit = (record: AssetRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleSort = (key: keyof AssetRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePropertySort = (key: keyof AssetRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (propertySort && propertySort.key === key && propertySort.direction === 'asc') {
      direction = 'desc';
    }
    setPropertySort({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRecords.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Close mobile sidebar when view changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [view]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
        w-64 h-full
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
        md:translate-x-0 md:sticky md:top-0 md:h-screen
        ${isDesktopOpen ? 'md:w-64' : 'md:w-0 md:border-none md:overflow-hidden'}
      `}>
        {/* Sidebar Content Container (Fixed width to prevent squishing during collapse) */}
        <div className="w-64 h-full flex flex-col relative">
          
          <div className="p-6 flex justify-between items-start">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent whitespace-nowrap"
              >
                My Asset
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap"
              >
                Your best portfolio tracker
              </motion.p>
            </div>
            {/* Close button for Mobile */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
             {/* Collapse button for Desktop */}
             <button 
              onClick={() => setIsDesktopOpen(false)}
              className="hidden md:block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors absolute right-4 top-6"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>
          
          <nav className="px-4 space-y-2 flex-1 flex flex-col">
            <button 
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <LayoutDashboard size={20} />
              {t('nav_dashboard')}
            </button>
            <button 
              onClick={() => setView('property')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${view === 'property' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <Building2 size={20} />
              {t('nav_property')}
            </button>
            <button 
              onClick={() => setView('list')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${view === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <Table2 size={20} />
              {t('nav_records')}
            </button>

            <div className="flex-1"></div>

            <button 
              onClick={() => setView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${view === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <Settings size={20} />
              {t('nav_settings')}
            </button>
          </nav>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 mt-2"
          >
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('stat_net_worth')}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden flex flex-col h-screen">
        
        {/* Top Header Mobile */}
        <header className="md:hidden bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-20 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-900 dark:text-slate-100">My Asset</h1>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-900/20">
            <Plus size={20} />
          </button>
        </header>

        {/* Desktop Expand Sidebar Button - Visible only when sidebar is closed */}
        {!isDesktopOpen && (
          <div className="hidden md:block absolute top-6 left-6 z-30">
            <button 
              onClick={() => setIsDesktopOpen(true)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg shadow-lg hover:scale-105 transition-all"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <motion.div 
            key={view}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 max-w-7xl mx-auto space-y-6"
          >
            
            {/* Action Bar */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className={`${!isDesktopOpen ? 'md:ml-12' : ''} transition-all duration-300`}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {view === 'dashboard' && t('title_dashboard')}
                  {view === 'property' && t('title_property')}
                  {view === 'list' && t('title_records')}
                  {view === 'settings' && t('title_settings')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                   {view === 'settings' ? t('subtitle_settings') : t('subtitle_dashboard')}
                </p>
              </div>
              
              {view !== 'settings' && (
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => downloadCSV(records)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  >
                    <Download size={18} />
                    <span className="hidden md:inline">{t('btn_export')}</span>
                    <span className="md:hidden">CSV</span>
                  </button>
                  <button 
                    onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus size={18} />
                    {t('btn_add')}
                  </button>
                </div>
              )}
            </motion.div>

            {view === 'dashboard' && (
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('stat_total_assets')}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('stat_top_asset')}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{topAssetClass.type}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(topAssetClass.value)}</p>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all">
                    <div className="p-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full">
                      <Table2 size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('stat_total_records')}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{records.length}</p>
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PieChartComponent data={records} theme={theme} t={t} />
                  
                  {/* Recent Activity Mini-Table */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 h-[500px] overflow-hidden flex flex-col transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('recent_activity')}</h3>
                    <div className="overflow-y-auto flex-1 pr-2">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0 transition-colors">
                          <tr>
                            <th className="px-3 py-2">{t('table_date')}</th>
                            <th className="px-3 py-2">{t('table_name')}</th>
                            <th className="px-3 py-2 text-right">{t('table_amount')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {records.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).map(record => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{record.date}</td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-slate-900 dark:text-slate-200">{record.name}</div>
                                <div className="text-xs text-slate-500">{record.action}</div>
                              </td>
                              <td className="px-3 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                {formatCurrency(record.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {view === 'property' && (
              <motion.div variants={itemVariants} className="space-y-6">
                
                {/* Property Selection Dropdown */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Filter size={20} />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Select Property:</span>
                   </div>
                   <select
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
                   >
                      <option value="All">All Properties</option>
                      {propertyNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                   </select>
                </div>

                {/* Property Cash Flow Analysis Widget */}
                <motion.div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('prop_cash_flow')}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedProperty === 'All' ? t('prop_desc') : `${selectedProperty} - ${t('prop_desc')}`}
                      </p>
                    </div>
                  </div>

                  {!propertyMetrics.hasProperties ? (
                    <div className="text-center py-10 text-slate-500">
                      No property records found. Add asset type "Property" to see analysis.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                            <ArrowDownRight size={16} className="text-red-500" />
                            <span className="text-sm">{t('prop_invested')}</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(propertyMetrics.totalInvested)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                            <ArrowUpRight size={16} className="text-emerald-500" />
                            <span className="text-sm">{t('prop_returned')}</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(propertyMetrics.totalReturned)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                            <Wallet size={16} className={propertyMetrics.netCashFlow >= 0 ? "text-emerald-500" : "text-red-500"} />
                            <span className="text-sm">{t('prop_net_flow')}</span>
                          </div>
                          <p className={`text-xl font-bold ${propertyMetrics.netCashFlow >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {propertyMetrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(propertyMetrics.netCashFlow)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 bg-red-500 transition-all duration-500" style={{ width: propertyMetrics.totalInvested > 0 ? '100%' : '0%' }}></div>
                        <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-500" 
                            style={{ width: propertyMetrics.totalInvested > 0 ? `${(propertyMetrics.totalReturned / propertyMetrics.totalInvested) * 100}%` : '0%' }}>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>{t('prop_investment_phase')}</span>
                        <span>{((propertyMetrics.totalReturned / (propertyMetrics.totalInvested || 1)) * 100).toFixed(1)}% {t('prop_recovered')}</span>
                        <span>{t('prop_profit_phase')}</span>
                      </div>

                      {/* Property Transactions List with Sorting & Pagination */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-md font-medium text-slate-900 dark:text-slate-200">{t('prop_transactions')}</h4>
                           <div className="flex items-center gap-2 text-xs">
                             <select 
                               value={propertyRowsPerPage} 
                               onChange={(e) => { setPropertyRowsPerPage(Number(e.target.value)); setPropertyPage(1); }}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none"
                             >
                               <option value={5}>5 / page</option>
                               <option value={10}>10 / page</option>
                               <option value={20}>20 / page</option>
                             </select>
                           </div>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                <tr>
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handlePropertySort('date')}>
                                    <div className="flex items-center gap-1">
                                      {t('table_date')}
                                      <ArrowUpDown size={12} className={propertySort?.key === 'date' ? 'text-blue-500' : 'text-slate-400'} />
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handlePropertySort('name')}>
                                    <div className="flex items-center gap-1">
                                      {t('table_name')}
                                      <ArrowUpDown size={12} className={propertySort?.key === 'name' ? 'text-blue-500' : 'text-slate-400'} />
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handlePropertySort('action')}>
                                    <div className="flex items-center gap-1">
                                      {t('table_action')}
                                      <ArrowUpDown size={12} className={propertySort?.key === 'action' ? 'text-blue-500' : 'text-slate-400'} />
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handlePropertySort('amount')}>
                                    <div className="flex items-center gap-1 justify-end">
                                      {t('table_amount')}
                                      <ArrowUpDown size={12} className={propertySort?.key === 'amount' ? 'text-blue-500' : 'text-slate-400'} />
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {paginatedPropertyRecords.length > 0 ? (
                                  paginatedPropertyRecords.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.date}</td>
                                      <td className="px-4 py-3 text-slate-900 dark:text-slate-200">{r.name}</td>
                                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.action}</td>
                                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-200">{formatCurrency(r.amount)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                      No records found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                            {/* Pagination Controls */}
                            {propertyTotalPages > 1 && (
                              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                <span>Page {propertyPage} of {propertyTotalPages}</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setPropertyPage(p => Math.max(1, p - 1))}
                                    disabled={propertyPage === 1}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
                                  >
                                    <ChevronLeft size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setPropertyPage(p => Math.min(propertyTotalPages, p + 1))}
                                    disabled={propertyPage === propertyTotalPages}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
                {/* Filters */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 dark:placeholder-slate-600 transition-colors"
                      />
                    </div>
                    <div className="relative w-full sm:w-48">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
                      >
                        <option value="All">{t('all_types')}</option>
                        {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Rows per page dropdown */}
                    <div className="relative w-full sm:w-32">
                      <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
                      >
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                      </select>
                    </div>
                  </div>

                  {/* Batch Actions */}
                  <AnimatePresence>
                    {selectedIds.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={handleBatchDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>{t('btn_delete_selected')} ({selectedIds.size})</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={sortedRecords.length > 0 && selectedIds.size === sortedRecords.length}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 cursor-pointer"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('date')}>
                          <div className="flex items-center gap-1">
                            {t('table_date')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'date' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('type')}>
                          <div className="flex items-center gap-1">
                            {t('table_type')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'type' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">
                            {t('table_name')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'name' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('action')}>
                          <div className="flex items-center gap-1">
                            {t('table_action')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'action' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('amount')}>
                          <div className="flex items-center gap-1 justify-end">
                            {t('table_amount')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'amount' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1 justify-center">
                            {t('table_status')}
                            <ArrowUpDown size={14} className={sortConfig?.key === 'status' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-600'} />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">{t('table_actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <AnimatePresence>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((record) => (
                          <motion.tr 
                            key={record.id} 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'table-row' }}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors ${selectedIds.has(record.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.has(record.id)}
                                onChange={() => toggleSelect(record.id)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{record.date}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {record.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                              {record.name}
                              {record.remarks && <div className="text-xs text-slate-500 font-normal truncate max-w-[200px]">{record.remarks}</div>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{record.action}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                              {formatCurrency(record.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                                  className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                  className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                            {t('no_records')}
                          </td>
                        </tr>
                      )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  <span>
                    Showing {paginatedRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedRecords.length)} of {sortedRecords.length} entries
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div variants={itemVariants} className="space-y-6">
                
                {/* Theme Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                        {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                     </div>
                     <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('setting_theme')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('setting_theme_desc')}</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Sun size={32} />
                      <span className="font-medium">{t('theme_light')}</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Moon size={32} />
                      <span className="font-medium">{t('theme_dark')}</span>
                    </button>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="p-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full">
                        <Globe size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('setting_language')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('setting_language_desc')}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['en', 'zh', 'ms'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          language === lang 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-medium">
                          {lang === 'en' ? 'English' : lang === 'zh' ? '中文 (Chinese)' : 'Bahasa Melayu'}
                        </span>
                        {language === lang && <Check size={20} className="text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Transaction Form Modal */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        initialData={editingRecord}
      />
      
      {/* AI Chatbot */}
      <Chatbot records={records} t={t} />

    </div>
  );
}

export default App;