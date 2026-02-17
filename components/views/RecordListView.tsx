import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trash2, ArrowUpDown, ListFilter, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { AssetRecord } from '../../types';

interface RecordListViewProps {
    itemVariants: any;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    t: (key: string) => string;
    filterType: string;
    setFilterType: (type: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    itemsPerPage: number;
    setItemsPerPage: (num: number) => void;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    selectedIds: Set<string>;
    sortedRecords: AssetRecord[];
    toggleSelectAll: () => void;
    handleBatchDelete: () => void;
    handleSort: (key: keyof AssetRecord) => void;
    paginatedRecords: AssetRecord[];
    toggleSelect: (id: string) => void;
    selectedCurrency: string;
    handleEdit: (item: AssetRecord) => void;
    handleDelete: (id: string) => void;
    filteredRecords: AssetRecord[];
    currentPage: number;
    totalPages: number;
}

const RecordListView: React.FC<RecordListViewProps> = ({
    itemVariants,
    searchTerm,
    setSearchTerm,
    t,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    selectedIds,
    sortedRecords,
    toggleSelectAll,
    handleBatchDelete,
    handleSort,
    paginatedRecords,
    toggleSelect,
    selectedCurrency,
    handleEdit,
    handleDelete,
    filteredRecords,
    currentPage,
    totalPages
}) => {
    return (
        <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors flex flex-col">
                {/* Unified Header with Search & Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-slate-400"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
                            >
                                <option value="All">{t('All')}</option>
                                <option value="Stock">{t('Stock')}</option>
                                <option value="Crypto">{t('Crypto')}</option>
                                <option value="Fixed Deposit">{t('FD')}</option>
                                <option value="Property">{t('Property')}</option>
                                <option value="Gold">{t('Gold')}</option>
                                <option value="EPF">EPF</option>
                                <option value="Other">{t('Other')}</option>
                            </select>
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Sold">Sold Only</option>
                            <option value="Mature">Mature Only</option>
                        </select>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>
                    </div>
                </div>

                {/* Batch Actions Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {selectedIds.size} records selected
                        </span>
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete Selected
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-950 rounded-lg flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto w-full flex-1">
                        <table className="w-full text-sm text-left min-w-[900px]">
                            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === sortedRecords.length && sortedRecords.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
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
                                                {formatCurrency(item.amount, selectedCurrency)}
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
            </div>
        </motion.div>
    );
};

export default React.memo(RecordListView);
