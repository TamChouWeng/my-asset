import React, { useState, useMemo } from 'react';
import { AssetRecord, AssetType } from './types';
import { INITIAL_DATA } from './constants';
import PieChartComponent from './components/PieChartComponent';
import TransactionForm from './components/TransactionForm';
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
  Filter
} from 'lucide-react';

function App() {
  const [records, setRecords] = useState<AssetRecord[]>(INITIAL_DATA);
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

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

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => 
        (filterType === 'All' || r.type === filterType) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterType]);

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
    }
  };

  const handleEdit = (record: AssetRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 flex-shrink-0 md:h-screen md:sticky md:top-0 border-r border-slate-800 z-10">
        <div className="p-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
          >
            My Asset
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="text-xs text-slate-400 mt-1"
          >
            Portfolio Tracker
          </motion.p>
        </div>
        
        <nav className="px-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setView('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${view === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <Table2 size={20} />
            Records List
          </button>
        </nav>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 mt-auto"
        >
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Total Net Worth</p>
            <p className="text-lg font-bold text-emerald-400 truncate">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </motion.div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top Header Mobile */}
        <header className="md:hidden bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-bold text-slate-100">My Asset</h1>
          <button onClick={() => setIsFormOpen(true)} className="p-2 bg-blue-600 text-white rounded-full">
            <Plus size={20} />
          </button>
        </header>

        <motion.div 
          key={view}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-4 md:p-8 max-w-7xl mx-auto space-y-6"
        >
          
          {/* Action Bar */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                {view === 'dashboard' ? 'Overview' : 'All Transactions'}
              </h2>
              <p className="text-slate-400 text-sm">Manage your wealth effectively</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => downloadCSV(records)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              >
                <Download size={18} />
                <span className="hidden md:inline">Export CSV</span>
                <span className="md:hidden">CSV</span>
              </button>
              <button 
                onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                Add Record
              </button>
            </div>
          </motion.div>

          {view === 'dashboard' && (
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 flex items-center gap-4 transition-all">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Assets (Active)</p>
                    <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalValue)}</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 flex items-center gap-4 transition-all">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Top Asset Class</p>
                    <p className="text-2xl font-bold text-slate-100">{topAssetClass.type}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(topAssetClass.value)}</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 flex items-center gap-4 transition-all">
                  <div className="p-3 bg-violet-500/10 text-violet-400 rounded-full">
                    <Table2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Records</p>
                    <p className="text-2xl font-bold text-slate-100">{records.length}</p>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartComponent data={records} />
                
                {/* Recent Activity Mini-Table */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-4 h-[500px] overflow-hidden flex flex-col"
                >
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
                  <div className="overflow-y-auto flex-1 pr-2">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {records.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).map(record => (
                          <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-3 py-3 text-slate-400">{record.date}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-slate-200">{record.name}</div>
                              <div className="text-xs text-slate-500">{record.action}</div>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-slate-300">
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

          {view === 'list' && (
            <motion.div variants={itemVariants} className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or remarks..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600 transition-shadow"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-shadow"
                  >
                    <option value="All">All Types</option>
                    {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 whitespace-nowrap">Action</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Amount</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <AnimatePresence>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <motion.tr 
                          key={record.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-800/50 group transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{record.date}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {record.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {record.name}
                            {record.remarks && <div className="text-xs text-slate-500 font-normal truncate max-w-[200px]">{record.remarks}</div>}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{record.action}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-300">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(record)}
                                className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(record.id)}
                                className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
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
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No records found matching your filters.
                        </td>
                      </tr>
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Transaction Form Modal */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </div>
  );
}

export default App;