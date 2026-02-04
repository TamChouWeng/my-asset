import React, { useState, useMemo, useEffect } from 'react';
import { AssetRecord, AssetType, AssetStatus } from './types';
import { TRANSLATIONS, Language, PROPERTY_ACTIONS, ACTION_MULTIPLIERS } from './constants';
import TransactionForm from './components/TransactionForm';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { downloadCSV, parseCSV, normalizeDate } from './utils/csvHelper';
import { formatCurrency, CURRENCIES } from './utils/currencyUtils';
import { motion, AnimatePresence } from 'framer-motion';
import ImportConfirmationModal from './components/ImportConfirmationModal';
import DashboardView from './components/views/DashboardView';
import PropertyView from './components/views/PropertyView';
import FixedDepositView from './components/views/FixedDepositView';
import RecordListView from './components/views/RecordListView';
import SettingsView from './components/views/SettingsView';

import {
  LayoutDashboard,
  Table2,
  Plus,
  Download,
  Building2,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  RefreshCw,
  Loader2,
  Landmark,
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
  const [filterStatus, setFilterStatus] = useState<string>('All');

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

  const handleSave = React.useCallback(async (data: Omit<AssetRecord, 'id'>) => {
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
        date: data.date ? normalizeDate(data.date) : null,
        type: data.type,
        name: data.name,
        action: data.action,
        unit_price: isNaN(Number(data.unitPrice)) ? 0 : data.unitPrice,
        quantity: isNaN(Number(data.quantity)) ? 0 : data.quantity,
        amount: isNaN(Number(data.amount)) ? 0 : data.amount,
        fee: data.fee || 0,
        // Removed: interest_rate, interest_dividend (Using remarks as fallback storage)
        maturity_date: data.maturityDate ? normalizeDate(data.maturityDate) : null,
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

        setRecords(prev => {
          const newRecords = prev.map(r => r.id === editingRecord.id ? updatedRecord : r);
          checkMaturity(newRecords);
          return newRecords;
        });

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
          setRecords(prev => {
            const newRecords = [mappedNew, ...prev];
            checkMaturity(newRecords);
            return newRecords;
          });
        }
      }
      setEditingRecord(null);
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`Failed to save record: ${error.message || 'Unknown error'}`);
    }
  }, [user, editingRecord]);

  const handleDelete = React.useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;

        setRecords(prev => prev.filter(r => r.id !== id));
        setSelectedIds(prev => {
          if (prev.has(id)) {
            const newSelected = new Set(prev);
            newSelected.delete(id);
            return newSelected;
          }
          return prev;
        });
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  }, [selectedIds]);

  const handleBatchDelete = React.useCallback(async () => {
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
  }, [selectedIds]);

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
      const payload = importCandidates.map(r => {
        // Embed metadata in remarks just like handleSave
        let finalRemarks = r.remarks || '';
        finalRemarks = finalRemarks.replace(/\[Rate:\s*[\d.]+%\]/g, '').replace(/\[Int:\s*[\d.]+\]/g, '').trim();

        if (r.interestRate && r.interestRate > 0) {
          finalRemarks += ` [Rate: ${r.interestRate}%]`;
        }
        if (r.type !== AssetType.FixedDeposit && r.interestDividend && r.interestDividend > 0) {
          finalRemarks += ` [Int: ${r.interestDividend}]`;
        }

        return {
          user_id: user.id,
          date: r.date,
          type: r.type,
          name: r.name,
          action: r.action,
          unit_price: r.unitPrice || 0,
          quantity: r.quantity || 0,
          amount: r.amount,
          fee: r.fee || 0,
          // Columns missing in DB: interest_rate, interest_dividend (stored in remarks)
          maturity_date: r.maturityDate || null,
          status: r.status,
          currency: r.currency || 'MYR',
          remarks: finalRemarks.trim()
        };
      });

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
    setCurrentPage(1);
  }, [view, selectedProperty, filterStatus]);

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
    const total = activeRecords.reduce((acc, curr) => {
      const multiplier = ACTION_MULTIPLIERS[curr.action.toLowerCase()] ?? 1;
      return acc + (curr.amount * multiplier || 0);
    }, 0);

    return { [selectedCurrency]: total };
  }, [currencyRecords, filterType, selectedCurrency]);

  // Keep existing single value for compatibility if needed (defaults to MYR sum)
  const totalValue = totalValues[selectedCurrency] || 0;

  const topAssetMetric = useMemo(() => {
    const activeRecords = currencyRecords.filter(r => r.status === 'Active');
    const map = new Map<string, number>();

    if (filterType === 'All') {
      activeRecords.forEach(r => {
        const multiplier = ACTION_MULTIPLIERS[r.action.toLowerCase()] ?? 1;
        map.set(r.type, (map.get(r.type) || 0) + (r.amount * multiplier));
      });
    } else {
      activeRecords
        .filter(r => r.type === filterType)
        .forEach(r => {
          const multiplier = ACTION_MULTIPLIERS[r.action.toLowerCase()] ?? 1;
          map.set(r.name, (map.get(r.name) || 0) + (r.amount * multiplier));
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
    if (filterStatus !== 'All') {
      fds = fds.filter(r => r.status === filterStatus);
    }
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
  }, [currencyRecords, fdSort, fdSearchTerm, filterStatus]);

  const fdStats = useMemo(() => {
    const activeFDs = currencyRecords.filter(r => r.type === AssetType.FixedDeposit && r.status === AssetStatus.Active);
    const principal = activeFDs.reduce((sum, r) => {
      const multiplier = ACTION_MULTIPLIERS[r.action.toLowerCase()] ?? 1;
      return sum + (r.amount * multiplier);
    }, 0);

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
        (filterStatus === 'All' || r.status === filterStatus) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currencyRecords, searchTerm, filterType, filterStatus]);

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

  const handleEdit = React.useCallback((record: AssetRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  }, []);

  const handleSort = React.useCallback((key: keyof AssetRecord) => {
    setSortConfig(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const handlePropertySort = React.useCallback((key: keyof AssetRecord) => {
    setPropertySort(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const handleFdSort = React.useCallback((key: keyof AssetRecord) => {
    setFdSort(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current && current.key === key && current.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  const toggleSelectAll = React.useCallback(() => {
    // Only toggle based on CURRENT sortedRecords length, but we need sortedRecords in dep array which changes often.
    // Ideally we pass ids, but sortedRecords is derived.
    // For now, let's keep it simple. If sortedRecords changes, this function changes, causing List to re-render.
    // Since List depends on sortedRecords anyway, this is fine.
    // Wait, we can't access state inside callback without closure or ref.
    // We already have closure over sortedRecords and selectedIds.
    if (selectedIds.size === sortedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRecords.map(r => r.id)));
    }
  }, [selectedIds, sortedRecords]);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

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
          <button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} className="p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-900/20">
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
                    onClick={fetchRecords}
                    title="Refresh Data"
                    disabled={isDataLoading}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={20} className={isDataLoading ? "animate-spin" : ""} />
                  </button>

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
              <DashboardView
                itemVariants={itemVariants}
                currencyRecords={currencyRecords}
                theme={theme}
                t={t}
                filterType={filterType}
                onFilterChange={setFilterType}
                selectedCurrency={selectedCurrency}
                totalValue={totalValue}
                topAssetMetric={topAssetMetric}
              />
            )}

            {view === 'property' && (
              <PropertyView
                itemVariants={itemVariants}
                selectedProperty={selectedProperty}
                setSelectedProperty={setSelectedProperty}
                propertyNames={propertyNames}
                t={t}
                propertyMetrics={propertyMetrics}
                selectedCurrency={selectedCurrency}
                propertyRowsPerPage={propertyRowsPerPage}
                setPropertyRowsPerPage={setPropertyRowsPerPage}
                setPropertyPage={setPropertyPage}
                handlePropertySort={handlePropertySort}
                paginatedPropertyRecords={paginatedPropertyRecords}
                propertyPage={propertyPage}
                propertyTotalPages={propertyTotalPages}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            )}

            {view === 'fixed-deposit' && (
              <FixedDepositView
                itemVariants={itemVariants}
                t={t}
                fdStats={fdStats}
                selectedCurrency={selectedCurrency}
                fdSearchTerm={fdSearchTerm}
                setFdSearchTerm={setFdSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                fdRowsPerPage={fdRowsPerPage}
                setFdRowsPerPage={setFdRowsPerPage}
                setFdPage={setFdPage}
                fdRecords={fdRecords}
                paginatedFdRecords={paginatedFdRecords}
                handleFdSort={handleFdSort}
                handleEdit={handleEdit}
                fdPage={fdPage}
                fdTotalPages={fdTotalPages}
              />
            )}

            {view === 'list' && (
              <RecordListView
                itemVariants={itemVariants}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                t={t}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                setCurrentPage={setCurrentPage}
                selectedIds={selectedIds}
                sortedRecords={sortedRecords}
                toggleSelectAll={toggleSelectAll}
                handleBatchDelete={handleBatchDelete}
                handleSort={handleSort}
                paginatedRecords={paginatedRecords}
                toggleSelect={toggleSelect}
                selectedCurrency={selectedCurrency}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                filteredRecords={filteredRecords}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            )}

            {view === 'settings' && (
              <SettingsView
                itemVariants={itemVariants}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                t={t}
                theme={theme}
                updateProfile={updateProfile}
                language={language}
                setIsPasswordModalOpen={setIsPasswordModalOpen}
                user={user}
                signOut={signOut}
              />
            )}

          </motion.div>
        </div>
      </main>

      {/* Floating Elements */}
      <Chatbot records={records} t={t} />
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
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
