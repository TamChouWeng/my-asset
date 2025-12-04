import React, { useState, useMemo, useEffect } from 'react';
import { AssetRecord, AssetType } from './types';
import { INITIAL_DATA, TRANSLATIONS, Language } from './constants';
import PieChartComponent from './components/PieChartComponent';
import TransactionForm from './components/TransactionForm';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
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
  Globe,
  LogOut,
  Database,
  Loader2,
  User
} from 'lucide-react';

function App() {
  const { user, loading, signOut } = useAuth();
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

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

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    setIsDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map DB snake_case to CamelCase
        const mappedData: AssetRecord[] = data.map(item => ({
          id: item.id,
          date: item.date,
          type: item.type,
          name: item.name,
          action: item.action,
          unitPrice: item.unit_price || item.unitPrice,
          quantity: item.quantity,
          amount: item.amount,
          fee: item.fee,
          interestDividend: item.interest_dividend || item.interestDividend,
          maturityDate: item.maturity_date || item.maturityDate,
          status: item.status,
          remarks: item.remarks
        }));
        setRecords(mappedData);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleSave = async (data: Omit<AssetRecord, 'id'>) => {
    if (!user || !user.id) {
      alert("You must be logged in to save records.");
      return;
    }

    try {
      // Map back to snake_case for DB
      const dbPayload = {
        user_id: user.id,
        date: data.date,
        type: data.type,
        name: data.name,
        action: data.action,
        unit_price: data.unitPrice,
        quantity: data.quantity,
        amount: data.amount,
        fee: data.fee,
        interest_dividend: data.interestDividend,
        maturity_date: data.maturityDate,
        status: data.status,
        remarks: data.remarks
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('assets')
          .update(dbPayload)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        
        // Optimistic Update
        setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...data, id: editingRecord.id } : r));
      } else {
        const { data: inserted, error } = await supabase
          .from('assets')
          .insert([dbPayload])
          .select();

        if (error) throw error;
        
        if (inserted && inserted.length > 0) {
           // Map the returned row back to AssetRecord
           const newRecord = inserted[0];
           const mappedNew: AssetRecord = {
              id: newRecord.id,
              date: newRecord.date,
              type: newRecord.type,
              name: newRecord.name,
              action: newRecord.action,
              unitPrice: newRecord.unit_price,
              quantity: newRecord.quantity,
              amount: newRecord.amount,
              fee: newRecord.fee,
              interestDividend: newRecord.interest_dividend,
              maturityDate: newRecord.maturity_date,
              status: newRecord.status,
              remarks: newRecord.remarks
           };
           setRecords(prev => [mappedNew, ...prev]);
        }
      }
      setEditingRecord(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save record.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;

        setRecords(prev => prev.filter(r => r.id !== id));
        if (selectedIds.has(id)) {
          const newSelected = new Set(selectedIds);
          newSelected.delete(id);
          setSelectedIds(newSelected);
        }
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
       try {
        const ids = Array.from(selectedIds);
        const { error } = await supabase.from('assets').delete().in('id', ids);
        if (error) throw error;

        setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
       } catch (error) {
         console.error("Error batch deleting:", error);
       }
    }
  };

  const loadDemoData = async () => {
    if (!user || !user.id) return;
    
    if(window.confirm("This will add sample data to your database. Continue?")) {
       setIsDataLoading(true);
       try {
         const payload = INITIAL_DATA.map(item => ({
            user_id: user.id,
            date: item.date,
            type: item.type,
            name: item.name,
            action: item.action,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            amount: item.amount,
            fee: item.fee,
            interest_dividend: item.interestDividend,
            maturity_date: item.maturityDate,
            status: item.status,
            remarks: item.remarks
         }));
         
         const { error } = await supabase.from('assets').insert(payload);
         if(error) throw error;
         
         await fetchRecords();
       } catch(err) {
         console.error(err);
         alert("Failed to load demo data");
       } finally {
         setIsDataLoading(false);
       }
    }
  };


  // --- STANDARD COMPONENT LOGIC BELOW ---

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

  // --- RENDER ---
  
  if (loading) {
     return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
         <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
       </div>
     );
  }

  if (!user) {
    return <LoginScreen />;
  }

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
                {user.email}
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
            className="p-4 md:p-8 w-full max-w-[1920px] mx-auto space-y-6"
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
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                   <span>{view === 'settings' ? t('subtitle_settings') : t('subtitle_dashboard')}</span>
                   {isDataLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                </div>
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

            {/* VIEWS */}
            {view === 'dashboard' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-14rem)]">
                  <div className="lg:col-span-2 h-full">
                     <PieChartComponent data={records} theme={theme} t={t} />
                  </div>
                  <div className="flex flex-col gap-4 h-full">
                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all flex-1">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                        <Wallet size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{t('stat_total_assets')}</p>
                        <p className="text-xl xl:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{formatCurrency(totalValue)}</p>
                      </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all flex-1">
                      <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                        <TrendingUp size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{t('stat_top_asset')}</p>
                        <p className="text-xl xl:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{topAssetClass.type}</p>
                        <p className="text-xs text-slate-500 truncate">{formatCurrency(topAssetClass.value)}</p>
                      </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-all flex-1">
                      <div className="p-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full shrink-0">
                        <Table2 size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{t('stat_total_records')}</p>
                        <p className="text-xl xl:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{records.length}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'property' && (
              <motion.div variants={itemVariants} className="space-y-6">
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
                        
                        <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                    <tr>
                                      <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap" onClick={() => handlePropertySort('date')}>
                                        <div className="flex items-center gap-1">
                                          {t('table_date')}
                                          <ArrowUpDown size={12} className="opacity-50" />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 whitespace-nowrap">{t('table_name')}</th>
                                      <th className="px-4 py-3 whitespace-nowrap">{t('table_action')}</th>
                                      <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap" onClick={() => handlePropertySort('amount')}>
                                        <div className="flex items-center justify-end gap-1">
                                          {t('table_amount')}
                                          <ArrowUpDown size={12} className="opacity-50" />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 whitespace-nowrap">{t('table_status')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paginatedPropertyRecords.map((item) => (
                                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">{item.date}</td>
                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                        <td className="px-4 py-3">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            ['Buy', 'Pay', 'Installment', 'Renovation'].includes(item.action) 
                                              ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' 
                                              : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                          }`}>
                                            {item.action}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{item.status}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Controls */}
                            {propertyTotalPages > 1 && (
                              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                                <button 
                                  onClick={() => setPropertyPage(p => Math.max(1, p - 1))}
                                  disabled={propertyPage === 1}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Page {propertyPage} of {propertyTotalPages}
                                </span>
                                <button 
                                  onClick={() => setPropertyPage(p => Math.min(propertyTotalPages, p + 1))}
                                  disabled={propertyPage === propertyTotalPages}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight size={16} />
                                </button>
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
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 transition-colors">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder={t('search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-slate-400"
                    />
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="All">{t('all_types')}</option>
                      {Object.values(AssetType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    
                    {selectedIds.size > 0 && (
                      <button 
                        onClick={handleBatchDelete}
                        className="px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline">{t('btn_delete_selected')}</span>
                        <span className="sm:hidden">({selectedIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors flex flex-col">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left min-w-[900px]">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <div className="flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                checked={sortedRecords.length > 0 && selectedIds.size === sortedRecords.length}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                          </th>
                          <th onClick={() => handleSort('date')} className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {t('table_date')}
                              <ArrowUpDown size={12} className="opacity-50" />
                            </div>
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">{t('table_type')}</th>
                          <th onClick={() => handleSort('name')} className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {t('table_name')}
                              <ArrowUpDown size={12} className="opacity-50" />
                            </div>
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">{t('table_action')}</th>
                          <th onClick={() => handleSort('amount')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {t('table_amount')}
                              <ArrowUpDown size={12} className="opacity-50" />
                            </div>
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">{t('table_status')}</th>
                          <th className="px-4 py-3 text-center whitespace-nowrap">{t('table_actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecords.length > 0 ? (
                          paginatedRecords.map((item) => (
                            <tr 
                              key={item.id} 
                              className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                            >
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.has(item.id)}
                                  onChange={() => toggleSelect(item.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                {item.name}
                                {item.remarks && (
                                  <div className="text-xs text-slate-500 dark:text-slate-500 font-normal truncate max-w-[200px]">{item.remarks}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.action}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'Active' 
                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleEdit(item)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center gap-2">
                                <ListFilter size={32} className="opacity-50" />
                                <p>{t('no_records')}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination */}
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm bg-slate-50 dark:bg-slate-900/50">
                     <div className="text-slate-500 dark:text-slate-400">
                       Showing {Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRecords.length, currentPage * itemsPerPage)} of {filteredRecords.length} entries
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                             if (currentPage > 3) pageNum = currentPage - 2 + i;
                             if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                          }
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                currentPage === pageNum 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div variants={itemVariants} className="max-w-2xl mx-auto space-y-6">
                 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                       <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Settings size={20} className="text-slate-400" />
                          Preferences
                       </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                       {/* Theme Toggle */}
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_theme')}</p>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_theme_desc')}</p>
                          </div>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                             <button
                               onClick={() => setTheme('light')}
                               className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${
                                 theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                               }`}
                             >
                                <Sun size={16} />
                                {t('theme_light')}
                             </button>
                             <button
                               onClick={() => setTheme('dark')}
                               className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${
                                 theme === 'dark' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                               }`}
                             >
                                <Moon size={16} />
                                {t('theme_dark')}
                             </button>
                          </div>
                       </div>

                       <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                       {/* Language Toggle */}
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_language')}</p>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_language_desc')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe size={18} className="text-slate-400" />
                            <select 
                               value={language}
                               onChange={(e) => setLanguage(e.target.value as Language)}
                               className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                               <option value="en">English</option>
                               <option value="zh">中文 (Chinese)</option>
                               <option value="ms">Bahasa Melayu</option>
                            </select>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Data Management */}
                 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                       <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Database size={20} className="text-slate-400" />
                          Data Management
                       </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">Load Demo Data</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Populate the database with sample records (useful for testing).</p>
                            </div>
                            <button
                              onClick={loadDemoData}
                              disabled={isDataLoading}
                              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {isDataLoading ? 'Loading...' : 'Load to DB'}
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Account */}
                 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                       <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <User size={20} className="text-slate-400" />
                          Account
                       </h3>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                             <p className="font-medium text-slate-900 dark:text-slate-100">Currently logged in as</p>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                        <button
                          onClick={signOut}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                        >
                           <LogOut size={16} />
                           Sign Out
                        </button>
                    </div>
                 </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      </main>

      {/* Floating Elements */}
      <Chatbot records={records} t={t} />
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave}
        initialData={editingRecord}
      />
      
    </div>
  );
}

export default App;