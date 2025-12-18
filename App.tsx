
import React, { useState, useMemo, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from './types';
import { TRANSLATIONS, Language, PROPERTY_ACTIONS } from './constants';
import PieChartComponent from './components/PieChartComponent';
import TransactionForm from './components/TransactionForm';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';
import { supabase, hasValidSupabaseConfig } from './lib/supabase';
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
  User,
  Lock,
  FileJson,
  ChevronDown,
  ChevronUp,
  Landmark,
  PiggyBank,
  AlertTriangle
} from 'lucide-react';

// --- Helper Functions for Data Parsing ---
const parseRateFromRemarks = (remarks?: string): number => {
  if (!remarks) return 0;
  const match = remarks.match(/\[Rate:\s*([\d.]+)%\]/);
  return match ? parseFloat(match[1]) : 0;
};

const parseIntFromRemarks = (remarks?: string): number => {
  if (!remarks) return 0;
  const match = remarks.match(/\[Int:\s*([\d.]+)\]/);
  return match ? parseFloat(match[1]) : 0;
};

const calculateFdInterest = (amount: number, rate: number, startStr: string, endStr?: string): number => {
  if (!amount || !rate || !startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 0;
  return parseFloat(((amount * rate * diffDays) / 36500).toFixed(2));
};

function App() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [view, setView] = useState<'dashboard' | 'property' | 'fixed-deposit' | 'list' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  const [sortConfig, setSortConfig] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  const [selectedProperty, setSelectedProperty] = useState<string>('All');

  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyRowsPerPage, setPropertyRowsPerPage] = useState(5);
  const [propertySort, setPropertySort] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);

  const [fdPage, setFdPage] = useState(1);
  const [fdRowsPerPage, setFdRowsPerPage] = useState(10);
  const [fdSort, setFdSort] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);
  const [fdSearchTerm, setFdSearchTerm] = useState('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const theme = profile?.theme || 'dark';
  const language = (profile?.language as Language) || 'en';
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    if (!hasValidSupabaseConfig()) {
      setConfigError("Supabase configuration is missing or invalid. Please check your environment variables.");
      return;
    }

    setIsDataLoading(true);
    setConfigError(null);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedData: AssetRecord[] = data.map(item => {
          const interestRate = item.interest_rate || parseRateFromRemarks(item.remarks);
          let interestDividend = item.interest_dividend || parseIntFromRemarks(item.remarks);
          
          if (item.type === AssetType.FixedDeposit && interestRate > 0 && item.amount > 0 && item.date && (item.maturity_date || item.maturityDate)) {
             interestDividend = calculateFdInterest(item.amount, interestRate, item.date, item.maturity_date || item.maturityDate);
          }

          return {
            id: item.id,
            date: item.date,
            type: item.type,
            name: item.name,
            action: item.action,
            unitPrice: item.unit_price || item.unitPrice,
            quantity: item.quantity,
            amount: item.amount,
            fee: item.fee,
            interestRate: interestRate,
            interestDividend: interestDividend,
            maturityDate: item.maturity_date || item.maturityDate,
            status: item.status,
            remarks: item.remarks
          };
        });
        setRecords(mappedData);
      }
    } catch (error: any) {
      console.error('Error fetching records:', error);
      setConfigError(error.message || "Failed to fetch data from Supabase.");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Fix: Added handleEdit function to resolve the missing reference
  const handleEdit = (record: AssetRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleSave = async (data: Omit<AssetRecord, 'id'>) => {
    if (!user || !user.id) {
      alert("You must be logged in to save records.");
      return;
    }

    try {
      let finalRemarks = data.remarks || '';
      finalRemarks = finalRemarks.replace(/\[Rate:\s*[\d.]+%\]/g, '').replace(/\[Int:\s*[\d.]+\]/g, '').trim();

      if (data.interestRate && data.interestRate > 0) {
        finalRemarks += ` [Rate: ${data.interestRate}%]`;
      }
      
      if (data.type !== AssetType.FixedDeposit && data.interestDividend && data.interestDividend > 0) {
        finalRemarks += ` [Int: ${data.interestDividend}]`;
      }
      
      finalRemarks = finalRemarks.trim();

      const dbPayload = {
        user_id: user.id,
        date: data.date ? data.date : null,
        type: data.type,
        name: data.name,
        action: data.action,
        unit_price: isNaN(Number(data.unitPrice)) ? 0 : data.unitPrice,
        quantity: isNaN(Number(data.quantity)) ? 0 : data.quantity,
        amount: isNaN(Number(data.amount)) ? 0 : data.amount,
        fee: data.fee || 0,
        maturity_date: data.maturityDate || null,
        status: data.status,
        remarks: finalRemarks
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('assets')
          .update(dbPayload)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        
        const updatedRecord: AssetRecord = { 
          ...data, 
          id: editingRecord.id,
          remarks: finalRemarks,
          interestRate: data.interestRate || 0,
          interestDividend: data.interestDividend || 0 
        };
        
        setRecords(records.map(r => r.id === editingRecord.id ? updatedRecord : r));
      } else {
        const { data: inserted, error } = await supabase
          .from('assets')
          .insert([dbPayload])
          .select();

        if (error) throw error;
        
        if (inserted && inserted.length > 0) {
           const newRecord = inserted[0];
           const rRate = parseRateFromRemarks(newRecord.remarks);
           let rInt = parseIntFromRemarks(newRecord.remarks);
           if (newRecord.type === AssetType.FixedDeposit && rRate > 0) {
              rInt = calculateFdInterest(newRecord.amount, rRate, newRecord.date, newRecord.maturity_date);
           }

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
              interestRate: rRate,
              interestDividend: rInt,
              maturityDate: newRecord.maturity_date,
              status: newRecord.status,
              remarks: newRecord.remarks
           };
           setRecords([mappedNew, ...records]);
        }
      }
      setEditingRecord(null);
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`Failed to save record: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
        setRecords(prev => prev.filter(r => r.id !== id));
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

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const totalValue = useMemo(() => {
    return records
      .filter(r => r.status === 'Active')
      .filter(r => filterType === 'All' || r.type === filterType)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [records, filterType]);

  const topAssetMetric = useMemo(() => {
    const activeRecords = records.filter(r => r.status === 'Active');
    const map = new Map<string, number>();
    
    if (filterType === 'All') {
        activeRecords.forEach(r => {
          map.set(r.type, (map.get(r.type) || 0) + r.amount);
        });
    } else {
        activeRecords
            .filter(r => r.type === filterType)
            .forEach(r => {
                map.set(r.name, (map.get(r.name) || 0) + r.amount);
            });
    }

    let top = { name: 'N/A', value: 0 };
    map.forEach((val, key) => {
      if (val > top.value) top = { name: key, value: val };
    });
    
    return top;
  }, [records, filterType]);

  const propertyMetrics = useMemo(() => {
    const propertyRecords = records.filter(r => 
      r.type === AssetType.Property && 
      (selectedProperty === 'All' || r.name === selectedProperty)
    );
    
    let totalInvested = 0; 
    let totalReturned = 0; 
    
    propertyRecords.forEach(r => {
      const action = r.action.toLowerCase();
      const isOutflow = PROPERTY_ACTIONS.OUTFLOW.some(k => action.includes(k));
      const isInflow = PROPERTY_ACTIONS.INFLOW.some(k => action.includes(k));

      if (isOutflow) totalInvested += r.amount;
      else if (isInflow) totalReturned += r.amount;
    });

    return {
      totalInvested,
      totalReturned,
      netCashFlow: totalReturned - totalInvested,
      hasProperties: propertyRecords.length > 0,
      records: propertyRecords
    };
  }, [records, selectedProperty]);

  const fdRecords = useMemo(() => {
    let fds = records.filter(r => r.type === AssetType.FixedDeposit);
    if (fdSearchTerm) fds = fds.filter(r => r.name.toLowerCase().includes(fdSearchTerm.toLowerCase()));
    if (fdSort) {
      fds.sort((a, b) => {
        const aVal = a[fdSort.key] ?? '';
        const bVal = b[fdSort.key] ?? '';
        if (aVal < bVal) return fdSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return fdSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return fds;
  }, [records, fdSort, fdSearchTerm]);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => 
        (filterType === 'All' || r.type === filterType) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterType]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val);
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
          w-64 h-full ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
          md:translate-x-0 md:sticky md:top-0 md:h-screen ${isDesktopOpen ? 'md:w-64' : 'md:w-0 md:border-none md:overflow-hidden'}
        `}>
          <div className="w-64 h-full flex flex-col relative">
            <div className="p-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">My Asset</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">{profile?.display_name || user.email}</p>
              </div>
              <button onClick={() => setIsDesktopOpen(false)} className="hidden md:block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors absolute right-4 top-6">
                <PanelLeftClose size={20} />
              </button>
            </div>
            
            <nav className="px-4 space-y-2 flex-1 flex flex-col">
              <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <LayoutDashboard size={20} /> {t('nav_dashboard')}
              </button>
              <button onClick={() => setView('property')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'property' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Building2 size={20} /> {t('nav_property')}
              </button>
              <button onClick={() => setView('fixed-deposit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'fixed-deposit' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Landmark size={20} /> {t('nav_fixed_deposit')}
              </button>
              <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Table2 size={20} /> {t('nav_records')}
              </button>
              <div className="flex-1"></div>
              <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Settings size={20} /> {t('nav_settings')}
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="md:hidden bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-20 transition-colors">
            <button onClick={() => setIsMobileOpen(true)} className="text-slate-500 dark:text-slate-400"><Menu size={24} /></button>
            <h1 className="font-bold">My Asset</h1>
            <button onClick={() => setIsFormOpen(true)} className="p-2 bg-blue-600 text-white rounded-full shadow-lg"><Plus size={20} /></button>
          </header>

          {!isDesktopOpen && (
            <div className="hidden md:block fixed top-6 left-6 z-30">
              <button onClick={() => setIsDesktopOpen(true)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg shadow-lg"><PanelLeftOpen size={20} /></button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8 w-full max-w-[1920px] mx-auto space-y-6">
              
              {configError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200 shadow-sm">
                  <AlertTriangle className="shrink-0" size={20} />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">Connection Issue</p>
                    <p className="opacity-90">{configError}</p>
                  </div>
                  <button onClick={() => fetchRecords()} className="px-3 py-1 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 rounded-lg text-xs font-medium transition-colors">Retry</button>
                </motion.div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className={`${!isDesktopOpen ? 'md:ml-12' : ''} transition-all`}>
                  <h2 className="text-2xl font-bold">{t(`title_${view.replace('-', '_')}`)}</h2>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                     <span>{t(`subtitle_${view === 'settings' ? 'settings' : 'dashboard'}`)}</span>
                     {isDataLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                  </div>
                </div>
                
                {view !== 'settings' && (
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => downloadCSV(records)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border rounded-lg hover:bg-slate-50 transition-all">
                      <Download size={18} /> <span className="hidden md:inline">{t('btn_export')}</span>
                    </button>
                    <button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-900/30 transition-all">
                      <Plus size={18} /> {t('btn_add')}
                    </button>
                  </div>
                )}
              </div>

              {view === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 min-h-[400px]">
                     <PieChartComponent data={records} theme={theme} t={t} filterType={filterType} onFilterChange={setFilterType} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full"><Wallet size={24} /></div>
                      <div><p className="text-sm text-slate-500">{t('stat_total_assets')}</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-full"><TrendingUp size={24} /></div>
                      <div><p className="text-sm text-slate-500">{t('stat_top_asset')}</p><p className="text-2xl font-bold truncate max-w-[150px]">{topAssetMetric.name}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'list' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-950 outline-none">
                      <option value="All">{t('all_types')}</option>
                      {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 overflow-x-auto">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                         <tr>
                           <th className="px-4 py-3">{t('table_date')}</th>
                           <th className="px-4 py-3">{t('table_name')}</th>
                           <th className="px-4 py-3 text-right">{t('table_amount')}</th>
                           <th className="px-4 py-3 text-center">{t('table_actions')}</th>
                         </tr>
                       </thead>
                       <tbody>
                         {filteredRecords.length > 0 ? filteredRecords.slice(0, 10).map(item => (
                           <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                             <td className="px-4 py-3">{item.date}</td>
                             <td className="px-4 py-3 font-medium">{item.name}</td>
                             <td className="px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
                             <td className="px-4 py-3 text-center flex justify-center gap-2">
                               <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                               <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                             </td>
                           </tr>
                         )) : (
                           <tr><td colSpan={4} className="p-10 text-center text-slate-400">No records found.</td></tr>
                         )}
                       </tbody>
                     </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <Chatbot records={records} t={t} />
      <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} initialData={editingRecord} />
    </div>
  );
}

export default App;
