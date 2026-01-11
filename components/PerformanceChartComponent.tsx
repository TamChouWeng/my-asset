import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AssetRecord, AssetStatus } from '../types';
import { ACTION_MULTIPLIERS } from '../constants';

interface PerformanceChartComponentProps {
    data: AssetRecord[];
    theme: 'light' | 'dark';
    currentFilter: string;
}

type TimeRange = '1W' | '1M' | '1Y';

const PerformanceChartComponent: React.FC<PerformanceChartComponentProps> = ({ data, theme, currentFilter }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');

    // Helper to get aggregation start date
    const getStartDate = (range: TimeRange) => {
        const now = new Date();
        const start = new Date(now);
        switch (range) {
            case '1W':
                start.setDate(now.getDate() - 7);
                break;
            case '1M':
                start.setMonth(now.getMonth() - 1);
                break;
            case '1Y':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }
        return start;
    };

    // Process data to build time series
    const chartData = useMemo(() => {
        // 1. Sort all records by date ascending
        const sortedRecords = [...data]
            .filter(item => item.status === AssetStatus.Active) // Only chart active/historic transactions that contribute to current value?
            // Actually, to show history, we should process all "Active" items. 
            // If we want "Growth over time", ideally we replay transactions.
            // For simplicity in this version, we will assume 'date' is the entry date and accumulation happens then.
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const startDate = getStartDate(timeRange);
        const now = new Date();
        const dayMap = new Map<string, number>();

        // Initialize standard daily points for the range to ensure continuous line
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            dayMap.set(d.toISOString().split('T')[0], 0);
        }

        // Identify relevant records based on filter
        const relevantRecords = sortedRecords.filter(item => {
            if (currentFilter === 'All') return true;
            return item.type === currentFilter;
        });

        // Calculate cumulative value
        // We need to calculate the initial value BEFORE the start date to have a correct starting point
        let runningTotal = 0;

        // We iterate through ALL time to build the running total, but only record points within our window
        // First, find all unique dates involved in transactions to make processing efficient? 
        // Or just iterate standard days? Iterating standard days is better for a smooth chart.

        // Optimization: Calculate baseline total before startDate
        const recordsBeforeStart = relevantRecords.filter(r => new Date(r.date) < startDate);
        recordsBeforeStart.forEach(item => {
            const multiplier = ACTION_MULTIPLIERS[item.action.toLowerCase()] ?? 1;
            runningTotal += (item.amount * multiplier);
        });

        // Now populate the dayMap
        const days = Array.from(dayMap.keys()).sort();

        // Filter records within range
        const recordsInRange = relevantRecords.filter(r => {
            const d = new Date(r.date);
            return d >= startDate && d <= now;
        });

        const result = days.map(day => {
            // Find transactions on this specific day
            const daysTransactions = recordsInRange.filter(r => r.date === day);
            daysTransactions.forEach(t => {
                const multiplier = ACTION_MULTIPLIERS[t.action.toLowerCase()] ?? 1;
                runningTotal += (t.amount * multiplier);
            });
            return {
                date: day,
                value: runningTotal
            };
        });

        return result;
    }, [data, timeRange, currentFilter]);

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toString();
    };

    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full h-full min-h-[300px] bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Performance
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Portfolio growth over time
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    {(['1W', '1M', '1Y'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[250px] min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border p-3 rounded-lg shadow-lg`}>
                                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mb-1`}>{label}</p>
                                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                                                {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(payload[0].value as number)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default PerformanceChartComponent;
