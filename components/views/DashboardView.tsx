import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Table2 } from 'lucide-react';
import PieChartComponent from '../PieChartComponent';
import PerformanceChartComponent from '../PerformanceChartComponent';
import { formatCurrency } from '../../utils/currencyUtils';
import { AssetRecord } from '../../types';

interface DashboardViewProps {
    itemVariants: any;
    currencyRecords: AssetRecord[];
    activeAssetCount: number; // New Prop
    theme: string;
    t: (key: string) => string;
    filterType: string;
    onFilterChange: (type: string) => void;
    selectedCurrency: string;
    totalValue: number;
    topAssetMetric: { name: string; value: number };
}

const DashboardView: React.FC<DashboardViewProps> = ({
    itemVariants,
    currencyRecords,
    activeAssetCount,
    theme,
    t,
    filterType,
    onFilterChange,
    selectedCurrency,
    totalValue,
    topAssetMetric
}) => {
    return (
        <motion.div variants={itemVariants} className="space-y-4 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:min-h-[calc(100vh-7rem)]">
                <div className="lg:col-span-3 h-full flex flex-col gap-4">
                    <div className="min-h-[350px] lg:min-h-0 lg:h-[45%]">
                        {currencyRecords.length > 0 ? (
                            <PieChartComponent
                                data={currencyRecords}
                                theme={theme}
                                t={t}
                                filterType={filterType}
                                onFilterChange={onFilterChange}
                                selectedCurrency={selectedCurrency}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400">
                                <Wallet size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No {selectedCurrency} assets found</p>
                                <p className="text-sm">Add a new asset to see your portfolio breakdown.</p>
                            </div>
                        )}
                    </div>

                    <div className="min-h-[350px] lg:min-h-0 lg:h-[55%] flex-1">
                        {currencyRecords.length > 0 && (
                            <PerformanceChartComponent
                                data={currencyRecords}
                                theme={theme}
                                currentFilter={filterType}
                                selectedCurrency={selectedCurrency}
                            />
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-4 h-full">
                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-[1]">
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

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-[1]">
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

                    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center gap-2 text-center transition-all flex-[8]">
                        <div className="p-3 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full shrink-0">
                            <Table2 size={24} />
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 truncate">{t('stat_total_assets_count') || 'Active Assets'}</p>
                            <p className="text-xl xl:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{activeAssetCount}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(DashboardView);
