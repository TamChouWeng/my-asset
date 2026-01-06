import React, { useState, useMemo, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from './types';
import { TRANSLATIONS, Language, PROPERTY_ACTIONS } from './constants';
import PieChartComponent from './components/PieChartComponent';
import TransactionForm from './components/TransactionForm';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { downloadCSV, parseCSV } from './utils/csvHelper';
import { motion, AnimatePresence } from 'framer-motion';
import ImportConfirmationModal from './components/ImportConfirmationModal';
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
  Upload
} from 'lucide-react';

// --- Helper Functions for Data Parsing ---
const parseRateFromRemarks = (remarks?: string): number => {
  if (!remarks) return 0;
  // Match pattern: [Rate: 3.45%]
  const match = remarks.match(/\[Rate:\s*([\d.]+)%\]/);
  return match ? parseFloat(match[1]) : 0;
};

const parseIntFromRemarks = (remarks?: string): number => {
  if (!remarks) return 0;
  // Match pattern: [Int: 100]
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
  // Simple Interest: (P * R * T) / 36500
  return parseFloat(((amount * rate * diffDays) / 36500).toFixed(2));
};

function App() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [view, setView] = useState<'dashboard' | 'property' | 'fixed-deposit' | 'list' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

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

  // Fixed Deposit Table State
  const [fdPage, setFdPage] = useState(1);
  const [fdRowsPerPage, setFdRowsPerPage] = useState(10);
  const [fdSort, setFdSort] = useState<{ key: keyof AssetRecord; direction: 'asc' | 'desc' } | null>(null);
  const [fdSearchTerm, setFdSearchTerm] = useState('');

  // Global Currency Setting (Persisted in LocalStorage)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem('myAsset_currency') || 'MYR';
  });

  useEffect(() => {
    localStorage.setItem('myAsset_currency', selectedCurrency);
  }, [selectedCurrency]);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Import State
  const [importCandidates, setImportCandidates] = useState<(AssetRecord & { isDuplicate?: boolean })[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Derived state from Profile (with defaults)
  const theme = profile?.theme || 'dark';
  const language = (profile?.language as Language) || 'en';

  // Translation Helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const checkMaturity = async (currentRecords: AssetRecord[]) => {
    const today = new Date().toLocaleDateString('en-CA');
    const updates: string[] = [];

    currentRecords.forEach(r => {
      if (r.type === AssetType.FixedDeposit && r.status === AssetStatus.Active && r.maturityDate && r.maturityDate <= today) {
        updates.push(r.id);
      }
    });

    if (updates.length > 0) {
      setRecords(prev => prev.map(r =>
        updates.includes(r.id) ? { ...r, status: AssetStatus.Mature } : r
      ));

      const { error } = await supabase
        .from('assets')
        .update({ status: 'Mature' })
        .in('id', updates);

      if (error) console.error("Error auto-maturing:", error);
    }
  };

  const fetchRecords = async () => {
    setIsDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedData: AssetRecord[] = data.map(item => {
          // Fallback: If DB column missing, parse from Remarks
          const interestRate = item.interest_rate || parseRateFromRemarks(item.remarks);

          // Fallback: If DB column missing, calculate FD interest or parse other interest
          let interestDividend = item.interest_dividend || parseIntFromRemarks(item.remarks);

          // Force recalculate for Active FDs to ensure accuracy
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
            currency: item.currency || 'MYR',
            remarks: item.remarks
          };
        });
        setRecords(mappedData);
        checkMaturity(mappedData);
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
      // 1. Prepare Remarks with embedded Metadata (to handle missing DB columns)
      let finalRemarks = data.remarks || '';
      // Clean existing system tags to avoid duplication
      finalRemarks = finalRemarks.replace(/\[Rate:\s*[\d.]+%\]/g, '').replace(/\[Int:\s*[\d.]+\]/g, '').trim();

      if (data.interestRate && data.interestRate > 0) {
        finalRemarks += ` [Rate: ${data.interestRate}%]`;
      }

      // For non-FDs, we preserve user-entered Interest/Dividend
      if (data.type !== AssetType.FixedDeposit && data.interestDividend && data.interestDividend > 0) {
        finalRemarks += ` [Int: ${data.interestDividend}]`;
      }

      finalRemarks = finalRemarks.trim();

      // 2. Prepare Payload (Exclude missing columns interest_rate/interest_dividend to prevent 400 Error)
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
        // Removed: interest_rate, interest_dividend (Using remarks as fallback storage)
        maturity_date: data.maturityDate || null,
        status: data.status,
        currency: data.currency,
        remarks: finalRemarks
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('assets')
          .update(dbPayload)
          .eq('id', editingRecord.id);

        if (error) throw error;

        // Optimistic Update
        const updatedRecord: AssetRecord = {
          ...data,
          id: editingRecord.id,
          remarks: finalRemarks,
          interestRate: data.interestRate || 0,
          interestDividend: data.interestDividend || 0
        };

        const newRecords = records.map(r => r.id === editingRecord.id ? updatedRecord : r);
        setRecords(newRecords);
        checkMaturity(newRecords);

      } else {
        const { data: inserted, error } = await supabase
          .from('assets')
          .insert([dbPayload])
          .select();

        if (error) throw error;

        if (inserted && inserted.length > 0) {
          const newRecord = inserted[0];

          // Parse back immediately for UI
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
            currency: newRecord.currency || 'MYR',
            remarks: newRecord.remarks
          };
          const newRecords = [mappedNew, ...records];
          setRecords(newRecords);
          checkMaturity(newRecords);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const candidates = await parseCSV(file);
      if (candidates.length === 0) {
        alert("No valid records found in the CSV file.");
        return;
      }

      // Check for duplicates
      // A duplicate is defined by matching Date, Name, Type, Action, Amount, (Currency is implicit in checks)
      const existingSignatures = new Set(records.map(r =>
        `${r.date}|${r.name}|${r.type}|${r.action}|${r.amount}|${r.currency || 'MYR'}`
      ));

      const markedCandidates = candidates.map(c => ({
        ...c,
        isDuplicate: existingSignatures.has(`${c.date}|${c.name}|${c.type}|${c.action}|${c.amount}|${c.currency || 'MYR'}`)
      }));

      setImportCandidates(markedCandidates);
      setIsImportModalOpen(true);
    } catch (error: any) {
      console.error("CSV Parse Error:", error);
      alert(error.message || "Failed to parse CSV file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!user || importCandidates.length === 0) return;

    setIsImporting(true);
    try {
      const payload = importCandidates.map(r => ({
        user_id: user.id,
        date: r.date,
        type: r.type,
        name: r.name,
        action: r.action,
        unit_price: r.unitPrice,
        quantity: r.quantity,
        amount: r.amount,
        fee: r.fee,
        interest_dividend: r.interestDividend, // Fallback column
        maturity_date: r.maturityDate,
        status: r.status,
        currency: r.currency,
        remarks: r.remarks
      }));

      const { error } = await supabase.from('assets').insert(payload);
      if (error) throw error;

      await fetchRecords();
      setIsImportModalOpen(false);
      setImportCandidates([]);
      alert(`Successfully imported ${payload.length} records.`);

    } catch (error: any) {
      console.error("Import Error:", error);
      alert("Failed to import records: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveDuplicates = () => {
    setImportCandidates(prev => prev.filter(c => !c.isDuplicate));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!currentPassword) {
      alert("Please enter your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error("Incorrect current password.");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      alert("Password updated successfully");
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Reset Property & FD Pagination on View Change
  useEffect(() => {
    setPropertyPage(1);
    setFdPage(1);
    setFdSearchTerm('');
  }, [view, selectedProperty]);

  // Centralized Currency Filter
  const currencyRecords = useMemo(() => {
    return records.filter(r => (r.currency || 'MYR') === selectedCurrency);
  }, [records, selectedCurrency]);

  // Computed Metrics
  const totalValues = useMemo(() => {
    // Filter by Currency FIRST
    const activeRecords = currencyRecords
      .filter(r => r.status === 'Active')
      .filter(r => filterType === 'All' || r.type === filterType);

    // Now just sum up (since they are all same currency)
    const total = activeRecords.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return { [selectedCurrency]: total };
  }, [currencyRecords, filterType, selectedCurrency]);

  // Keep existing single value for compatibility if needed (defaults to MYR sum)
  const totalValue = totalValues[selectedCurrency] || 0;

  const topAssetMetric = useMemo(() => {
    const activeRecords = currencyRecords.filter(r => r.status === 'Active');
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
  }, [currencyRecords, filterType]);

  const propertyNames = useMemo(() => {
    const props = currencyRecords.filter(r => r.type === AssetType.Property).map(r => r.name);
    return Array.from(new Set(props)).sort();
  }, [currencyRecords]);

  const propertyMetrics = useMemo(() => {
    const propertyRecords = currencyRecords.filter(r =>
      r.type === AssetType.Property &&
      (selectedProperty === 'All' || r.name === selectedProperty)
    );

    let totalInvested = 0;
    let totalReturned = 0;

    propertyRecords.forEach(r => {
      const action = r.action.toLowerCase();
      const isOutflow = PROPERTY_ACTIONS.OUTFLOW.some(k => action.includes(k));
      const isInflow = PROPERTY_ACTIONS.INFLOW.some(k => action.includes(k));

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
  }, [currencyRecords, selectedProperty]);

  // FD Metrics
  const fdRecords = useMemo(() => {
    let fds = currencyRecords.filter(r => r.type === AssetType.FixedDeposit);
    if (fdSearchTerm) {
      fds = fds.filter(r => r.name.toLowerCase().includes(fdSearchTerm.toLowerCase()));
    }
    if (fdSort) {
      fds.sort((a, b) => {
        const aVal = a[fdSort.key] ?? '';
        const bVal = b[fdSort.key] ?? '';
        if (aVal < bVal) return fdSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return fdSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      fds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return fds;
  }, [currencyRecords, fdSort, fdSearchTerm]);

  const fdStats = useMemo(() => {
    const activeFDs = currencyRecords.filter(r => r.type === AssetType.FixedDeposit && r.status === AssetStatus.Active);
    const principal = activeFDs.reduce((sum, r) => sum + r.amount, 0);
    // Use the on-the-fly calculated interestDividend from records state
    const interest = activeFDs.reduce((sum, r) => sum + (r.interestDividend || 0), 0);
    return { principal, interest };
  }, [currencyRecords]);

  const fdTotalPages = Math.ceil(fdRecords.length / fdRowsPerPage);
  const paginatedFdRecords = useMemo(() => {
    const start = (fdPage - 1) * fdRowsPerPage;
    return fdRecords.slice(start, start + fdRowsPerPage);
  }, [fdRecords, fdPage, fdRowsPerPage]);

  const filteredRecords = useMemo(() => {
    return currencyRecords
      .filter(r =>
        (filterType === 'All' || r.type === filterType) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currencyRecords, searchTerm, filterType]);

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

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, sortConfig, itemsPerPage]);

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

  const handleFdSort = (key: keyof AssetRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (fdSort && fdSort.key === key && fdSort.direction === 'asc') {
      direction = 'desc';
    }
    setFdSort({ key, direction });
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

  const formatCurrency = (val: number, currency: string = 'MYR') => {
    const locale = currency === 'USD' ? 'en-US' : 'en-MY';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(val);
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

  useEffect(() => {
    setIsMobileOpen(false);
  }, [view]);

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
                {profile?.display_name || user.email}
              </motion.p>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
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
              onClick={() => setView('fixed-deposit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${view === 'fixed-deposit' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              <Landmark size={20} />
              {t('nav_fixed_deposit')}
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
              <div className="flex flex-col gap-1">
                {Object.entries(totalValues).map(([curr, val]) => (
                  <p key={curr} className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {formatCurrency(Number(val), curr)}
                  </p>
                ))}
                {Object.keys(totalValues).length === 0 && (
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {formatCurrency(0, 'MYR')}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden flex flex-col h-screen">

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

        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={view}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={`px-4 md:px-6 py-4 w-full mx-auto space-y-4`}
          >

            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className={`${!isDesktopOpen ? 'md:ml-12' : ''} transition-all duration-300`}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {view === 'dashboard' && t('title_dashboard')}
                  {view === 'property' && t('title_property')}
                  {view === 'fixed-deposit' && t('title_fixed_deposit')}
                  {view === 'list' && t('title_records')}
                  {view === 'settings' && t('title_settings')}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <span>{view === 'settings' ? t('subtitle_settings') : t('subtitle_dashboard')}</span>
                  {isDataLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                </div>
              </div>

              {view !== 'settings' && (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => downloadCSV(currencyRecords)}
                    title={t('btn_export')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  >
                    <Download size={20} />
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Import CSV"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  >
                    <Upload size={20} />
                  </button>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}
                    title={t('btn_add')}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}
            </motion.div>

            {view === 'dashboard' && (
              <motion.div variants={itemVariants} className="space-y-4 h-full flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:min-h-[calc(100vh-7rem)]">
                  <div className="lg:col-span-3 h-full">
                    {currencyRecords.length > 0 ? (
                      <PieChartComponent
                        data={currencyRecords}
                        theme={theme}
                        t={t}
                        filterType={filterType}
                        onFilterChange={setFilterType}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400">
                        <Wallet size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No {selectedCurrency} assets found</p>
                        <p className="text-sm">Add a new asset to see your portfolio breakdown.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 h-full">
                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-1">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                        <Wallet size={24} />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 truncate">
                          {filterType === 'All' ? t('stat_total_assets') : `Total ${filterType}`}
                        </p>
                        <p className="text-xl xl:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{formatCurrency(totalValue, selectedCurrency)}</p>
                      </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-1">
                      <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                        <TrendingUp size={24} />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 truncate">
                          {filterType === 'All' ? t('stat_top_asset') : `Top ${filterType} Asset`}
                        </p>
                        <p className="text-xl xl:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{topAssetMetric.name}</p>
                        <p className="text-xs text-slate-500 truncate">{formatCurrency(topAssetMetric.value, selectedCurrency)}</p>
                      </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-1">
                      <div className="p-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full shrink-0">
                        <Table2 size={24} />
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 truncate">{t('stat_total_records')}</p>
                        <p className="text-xl xl:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{currencyRecords.length}</p>
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
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${['Buy', 'Pay', 'Installment', 'Renovation'].includes(item.action)
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

            {view === 'fixed-deposit' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                      <Landmark size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('stat_fd_principal')}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(fdStats.principal, selectedCurrency)}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                      <PiggyBank size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('stat_fd_interest')}</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(fdStats.interest, selectedCurrency)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('title_fixed_deposit')}</h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search Name..."
                          value={fdSearchTerm}
                          onChange={(e) => setFdSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <select
                          value={fdRowsPerPage}
                          onChange={(e) => { setFdRowsPerPage(Number(e.target.value)); setFdPage(1); }}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-2 focus:outline-none"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {fdRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400 flex flex-col items-center">
                      <Landmark size={48} className="opacity-20 mb-4" />
                      <p>No Fixed Deposit records found.</p>
                      <p className="text-sm mt-2">Add a new record with Type "Fixed Deposit" to see it here.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left min-w-[700px]">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3 whitespace-nowrap">{t('table_date')}</th>
                              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap transition-colors" onClick={() => handleFdSort('name')}>
                                <div className="flex items-center gap-1">
                                  {t('table_name')}
                                  <ArrowUpDown size={12} className="opacity-50" />
                                </div>
                              </th>
                              <th className="px-4 py-3 text-right whitespace-nowrap">{t('table_amount')}</th>
                              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap transition-colors" onClick={() => handleFdSort('status')}>
                                <div className="flex items-center gap-1">
                                  {t('table_status')}
                                  <ArrowUpDown size={12} className="opacity-50" />
                                </div>
                              </th>
                              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap transition-colors" onClick={() => handleFdSort('maturityDate')}>
                                <div className="flex items-center gap-1">
                                  {t('table_maturity')}
                                  <ArrowUpDown size={12} className="opacity-50" />
                                </div>
                              </th>
                              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 whitespace-nowrap transition-colors" onClick={() => handleFdSort('interestDividend')}>
                                <div className="flex items-center gap-1">
                                  {t('table_interest')}
                                  <ArrowUpDown size={12} className="opacity-50" />
                                </div>
                              </th>
                              <th className="px-4 py-3 whitespace-nowrap text-center">{t('table_actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedFdRecords.map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.date}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(item.amount)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active'
                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                  {item.maturityDate || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                  {formatCurrency(item.interestDividend || 0)}
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
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {fdTotalPages > 1 && (
                        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                          <button
                            onClick={() => setFdPage(p => Math.max(1, p - 1))}
                            disabled={fdPage === 1}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-slate-500 dark:text-slate-400">
                            Page {fdPage} of {fdTotalPages}
                          </span>
                          <button
                            onClick={() => setFdPage(p => Math.min(fdTotalPages, p + 1))}
                            disabled={fdPage === fdTotalPages}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div variants={itemVariants} className="space-y-6">
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
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active'
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
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${currentPage === pageNum
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Currency</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Select your preferred currency view</p>
                      </div>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MYR">MYR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_theme')}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_theme_desc')}</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                          onClick={() => updateProfile({ theme: 'light' })}
                          className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                          <Sun size={16} />
                          {t('theme_light')}
                        </button>
                        <button
                          onClick={() => updateProfile({ theme: 'dark' })}
                          className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${theme === 'dark' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                          <Moon size={16} />
                          {t('theme_dark')}
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_language')}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_language_desc')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={18} className="text-slate-400" />
                        <select
                          value={language}
                          onChange={(e) => updateProfile({ language: e.target.value as Language })}
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

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Lock size={20} className="text-slate-400" />
                      Security
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Password</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Change your account password</p>
                      </div>
                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

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

                <div className="text-center pt-4 pb-8 text-slate-400 dark:text-slate-600 text-xs">
                  Version: Beta 2.1
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
        defaultCurrency={selectedCurrency}
      />

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-md p-6 border border-slate-200 dark:border-slate-800 relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Change Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"><X size={24} /></button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                    {passwordLoading ? 'Verifying...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Confirmation Modal */}
      <ImportConfirmationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
        onRemoveDuplicates={handleRemoveDuplicates}
        candidates={importCandidates}
        isImporting={isImporting}
      />

    </div>
  );
}

export default App;
