import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Building2, ArrowDownRight, ArrowUpRight, Wallet, ArrowUpDown, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { AssetRecord } from '../../types';

interface PropertyViewProps {
    itemVariants: any;
    selectedProperty: string;
    setSelectedProperty: (property: string) => void;
    propertyNames: string[];
    t: (key: string) => string;
    propertyMetrics: {
        totalInvested: number;
        totalReturned: number;
        netCashFlow: number;
        hasProperties: boolean;
    };
    selectedCurrency: string;
    propertyRowsPerPage: number;
    setPropertyRowsPerPage: (rows: number) => void;
    setPropertyPage: (page: number) => void;
    handlePropertySort: (key: keyof AssetRecord) => void;
    paginatedPropertyRecords: AssetRecord[];
    propertyPage: number;
    propertyTotalPages: number;
    handleEdit: (item: AssetRecord) => void;
    handleDelete: (id: string) => void;
}

const PropertyView: React.FC<PropertyViewProps> = ({
    itemVariants,
    selectedProperty,
    setSelectedProperty,
    propertyNames,
    t,
    propertyMetrics,
    selectedCurrency,
    propertyRowsPerPage,
    setPropertyRowsPerPage,
    setPropertyPage,
    handlePropertySort,
    paginatedPropertyRecords,
    propertyPage,
    propertyTotalPages,
    handleEdit,
    handleDelete
}) => {
    return (
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
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(propertyMetrics.totalInvested, selectedCurrency)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                    <ArrowUpRight size={16} className="text-emerald-500" />
                                    <span className="text-sm">{t('prop_returned')}</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(propertyMetrics.totalReturned, selectedCurrency)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                    <Wallet size={16} className={propertyMetrics.netCashFlow >= 0 ? "text-emerald-500" : "text-red-500"} />
                                    <span className="text-sm">{t('prop_net_flow')}</span>
                                </div>
                                <p className={`text-xl font-bold ${propertyMetrics.netCashFlow >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {propertyMetrics.netCashFlow >= 0 ? '+' : ''}{formatCurrency(propertyMetrics.netCashFlow, selectedCurrency)}
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
                                                <th className="px-4 py-3 text-center whitespace-nowrap">{t('table_actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paginatedPropertyRecords.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.action}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 whitespace-nowrap">
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {propertyTotalPages > 1 && (
                                    <div className="px-4 py-3 flex justify-center gap-2 border-t border-slate-200 dark:border-slate-800">
                                        {Array.from({ length: propertyTotalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPropertyPage(i + 1)}
                                                className={`w-2 h-2 rounded-full transition-all ${propertyPage === i + 1 ? 'bg-blue-500 w-4' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                title={`Page ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default React.memo(PropertyView);
