import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AssetRecord, AssetStatus } from '../types';

interface NetWorthChartProps {
  data: AssetRecord[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data, theme, t }) => {
  
  // Compute cumulative net worth over time
  const chartData = useMemo(() => {
    // 1. Get all unique dates from records
    const dates = Array.from(new Set(data.map(item => item.date))).sort();
    
    if (dates.length === 0) return [];

    // 2. Create data points
    const points = dates.map(date => {
      // Calculate total active assets up to and including this date
      const total = data
        .filter(r => r.date <= date && r.status === AssetStatus.Active)
        .reduce((sum, record) => sum + record.amount, 0);

      return {
        date,
        value: total
      };
    });

    return points;
  }, [data]);

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full min-h-[300px] bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('chart_net_worth_trend')}
        </h3>
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
           {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(latestValue)}
        </span>
      </div>

      {chartData.length > 0 ? (
        <div className="flex-1 min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                minTickGap={30}
              />
              <YAxis 
                hide={true} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', 
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a', 
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value),
                  t('stat_net_worth')
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={2}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-500">
          {t('chart_no_data')}
        </div>
      )}
    </motion.div>
  );
};

export default NetWorthChart;