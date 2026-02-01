import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, PiggyBank, Search, ArrowUpDown, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { AssetRecord } from '../../types';

interface FixedDepositViewProps {
    itemVariants: any;
    t: (key: string) => string;
    fdStats: { principal: number; interest: number };
    selectedCurrency: string;
    fdSearchTerm: string;
    setFdSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    fdRowsPerPage: number;
    setFdRowsPerPage: (rows: number) => void;
    setFdPage: (page: number | ((prev: number) => number)) => void;
    fdRecords: AssetRecord[];
    paginatedFdRecords: AssetRecord[];
    handleFdSort: (key: keyof AssetRecord) => void;
    handleEdit: (item: AssetRecord) => void;
    fdPage: number;
    fdTotalPages: number;
}

const FixedDepositView: React.FC<FixedDepositViewProps> = ({
    itemVariants,
    t,
    fdStats,
    selectedCurrency,
    fdSearchTerm,
    setFdSearchTerm,
    filterStatus,
    setFilterStatus,
    fdRowsPerPage,
    setFdRowsPerPage,
    setFdPage,
    fdRecords,
    paginatedFdRecords,
    handleFdSort,
    handleEdit,
    fdPage,
    fdTotalPages
}) => {
    return (
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

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors flex flex-col">
                {/* Unified Header with Search & Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Name..."
                            value={fdSearchTerm}
                            onChange={(e) => setFdSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-slate-400"
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Mature">Mature Only</option>
                        </select>

                        <select
                            value={fdRowsPerPage}
                            onChange={(e) => { setFdRowsPerPage(Number(e.target.value)); setFdPage(1); }}
                            className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
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
                                            <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(item.amount, selectedCurrency)}</td>
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
                                                {formatCurrency(item.interestDividend || 0, selectedCurrency)}
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
                )
                }
            </div>
        </motion.div>
    );
};

export default React.memo(FixedDepositView);
