import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { AssetRecord, AssetType } from '../../types';
import { COLORS, DETAIL_COLORS } from '../../constants';
import { formatCurrency } from '../../utils/currencyUtils';
import { aggregateHoldings } from '../../utils/investmentUtils';
import { fetchLivePrices } from '../../utils/twelveDataUtils';
import PerformanceChartComponent from '../PerformanceChartComponent';

interface InvestmentViewProps {
    itemVariants: any;
    records: AssetRecord[];
    theme: string;
    selectedCurrency: string;
    setSelectedCurrency: (currency: string) => void;
}

type AssetClassFilter = 'All' | AssetType.Stock | AssetType.ETF;

const InvestmentView: React.FC<InvestmentViewProps> = ({ itemVariants, records, theme, selectedCurrency, setSelectedCurrency }) => {
    const [assetClassFilter, setAssetClassFilter] = useState<AssetClassFilter>('All');
    // ponytail: prices live in component state only, no current_market_prices table -
    // add persistence if a refresh needs to survive a reload before the user re-clicks.
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const holdings = useMemo(
        () => aggregateHoldings(records, selectedCurrency, assetClassFilter),
        [records, selectedCurrency, assetClassFilter]
    );

    const rows = useMemo(() => holdings.map(h => {
        const symbol = h.ticker || h.name;
        const currentPrice = (symbol ? prices[symbol] : undefined) ?? h.avgBuyPrice;
        const currentValue = h.quantity * currentPrice;
        const investedCapital = h.quantity * h.avgBuyPrice;
        const pl = currentValue - investedCapital;
        const plPct = investedCapital > 0 ? (pl / investedCapital) * 100 : 0;
        return { ...h, currentPrice, currentValue, investedCapital, pl, plPct };
    }), [holdings, prices]);

    const totals = useMemo(() => rows.reduce((acc, r) => ({
        currentValue: acc.currentValue + r.currentValue,
        investedCapital: acc.investedCapital + r.investedCapital,
    }), { currentValue: 0, investedCapital: 0 }), [rows]);

    const totalPl = totals.currentValue - totals.investedCapital;
    const totalPlPct = totals.investedCapital > 0 ? (totalPl / totals.investedCapital) * 100 : 0;

    const handleRefresh = async () => {
        const lookups = holdings.map(h => ({ ticker: (h.ticker || h.name).trim(), exchange: h.exchange })).filter(h => h.ticker);
        if (lookups.length === 0) return;
        setIsRefreshing(true);
        try {
            const fetched = await fetchLivePrices(lookups);
            setPrices(prev => ({ ...prev, ...fetched }));
            setLastRefreshed(new Date());
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        handleRefresh();
    }, [holdings]);

    const allocationData = useMemo(() => {
        const map = new Map<string, { value: number; color: string }>();
        let colorIndex = 0;
        rows.forEach(r => {
            if (r.currentValue <= 0) return;
            const groupKey = assetClassFilter === 'All' ? r.type : (r.ticker || r.name);
            const existing = map.get(groupKey);
            const color = assetClassFilter === 'All' ? COLORS[r.type] : DETAIL_COLORS[colorIndex % DETAIL_COLORS.length];
            if (!existing) colorIndex++;
            map.set(groupKey, { value: (existing?.value || 0) + r.currentValue, color: existing?.color || color });
        });
        return Array.from(map.entries()).map(([name, v]) => ({ name, value: parseFloat(v.value.toFixed(2)), color: v.color }));
    }, [rows, assetClassFilter]);

    // Pre-scoped to Stock/ETF so PerformanceChartComponent's 'All' means "all investments", not every asset type
    const investmentRecords = useMemo(
        () => records.filter(r => r.type === AssetType.Stock || r.type === AssetType.ETF),
        [records]
    );

    return (
        <motion.div variants={itemVariants} className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={assetClassFilter}
                        onChange={(e) => setAssetClassFilter(e.target.value as AssetClassFilter)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none cursor-pointer"
                    >
                        <option value="All">All</option>
                        <option value={AssetType.Stock}>Stocks</option>
                        <option value={AssetType.ETF}>ETFs</option>
                    </select>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title={lastRefreshed ? `Last refreshed ${lastRefreshed.toLocaleTimeString()}` : 'Fetch latest market prices'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-900/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    Refresh Prices
                </button>
            </div>

            {holdings.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400">
                    <TrendingUp size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">No active {selectedCurrency} holdings</p>
                    <p className="text-sm">Add a Stock or ETF record with a ticker to see it here.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Portfolio Value</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totals.currentValue, selectedCurrency)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Invested Capital</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totals.investedCapital, selectedCurrency)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Unrealized Profit / Loss</p>
                            <p className={`text-2xl font-bold mt-1 ${totalPl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {totalPl >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalPl), selectedCurrency)} ({totalPl >= 0 ? '+' : '-'}{Math.abs(totalPlPct).toFixed(2)}%)
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="min-h-[320px] bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-800 flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <PieIcon size={18} className="text-slate-400" /> Asset Allocation
                            </h3>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={allocationData} cx="50%" cy="45%" outerRadius="80%" dataKey="value" stroke="none" label={false} labelLine={false}>
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => {
                                                const formattedValue = formatCurrency(value, selectedCurrency);
                                                const totalVal = allocationData.reduce((acc, curr) => acc + curr.value, 0);
                                                const percentage = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0';
                                                return `${formattedValue} (${percentage}%)`;
                                            }}
                                            contentStyle={{
                                                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                                borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                                color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
                                        />
                                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <PerformanceChartComponent
                            data={investmentRecords}
                            theme={theme as 'light' | 'dark'}
                            currentFilter={assetClassFilter}
                            selectedCurrency={selectedCurrency}
                        />
                    </div>

                    {/* Holdings Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-left">
                                    <th className="p-4 font-medium">Ticker</th>
                                    <th className="p-4 font-medium">Asset Class</th>
                                    <th className="p-4 font-medium text-right">Qty</th>
                                    <th className="p-4 font-medium text-right">Avg Buy Price</th>
                                    <th className="p-4 font-medium text-right">Current Price</th>
                                    <th className="p-4 font-medium text-right">Current Value</th>
                                    <th className="p-4 font-medium text-right">Unrealized P/L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.key} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 text-slate-900 dark:text-slate-100">
                                        <td className="p-4 font-medium">{r.ticker || r.name}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400">{r.type}</td>
                                        <td className="p-4 text-right">{r.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                                        <td className="p-4 text-right">{formatCurrency(r.avgBuyPrice, selectedCurrency)}</td>
                                        <td className="p-4 text-right">{formatCurrency(r.currentPrice, selectedCurrency)}</td>
                                        <td className="p-4 text-right font-medium">{formatCurrency(r.currentValue, selectedCurrency)}</td>
                                        <td className={`p-4 text-right font-medium ${r.pl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {r.pl >= 0 ? '+' : '-'}{formatCurrency(Math.abs(r.pl), selectedCurrency)} ({r.pl >= 0 ? '+' : '-'}{Math.abs(r.plPct).toFixed(2)}%)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default React.memo(InvestmentView);
