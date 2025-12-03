import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { AssetRecord, AssetStatus, ChartDataPoint, AssetType } from '../types';
import { COLORS } from '../constants';

interface PieChartComponentProps {
  data: AssetRecord[];
}

// Color palette for individual assets breakdown
const DETAIL_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
  '#a855f7', // purple-500
];

const PieChartComponent: React.FC<PieChartComponentProps> = ({ data }) => {
  const [filterType, setFilterType] = useState<string>('All');

  // Aggregate data based on filter
  const aggregatedData = useMemo(() => {
    const map = new Map<string, number>();

    data.forEach(item => {
      // Only consider Active assets
      if (item.status === AssetStatus.Active) {
        if (filterType === 'All') {
          // Group by Asset Type
          const current = map.get(item.type) || 0;
          map.set(item.type, current + item.amount);
        } else {
          // Filter by selected Type, Group by Name
          if (item.type === filterType) {
            const current = map.get(item.name) || 0;
            map.set(item.name, current + item.amount);
          }
        }
      }
    });

    const result: ChartDataPoint[] = [];
    let colorIndex = 0;

    map.forEach((value, key) => {
      if (value > 0) {
        let color: string;
        
        if (filterType === 'All') {
          // Use predefined colors for types
          color = COLORS[key as AssetType] || '#cccccc';
        } else {
          // Cycle through palette for individual items
          color = DETAIL_COLORS[colorIndex % DETAIL_COLORS.length];
          colorIndex++;
        }

        result.push({
          name: key,
          value: parseFloat(value.toFixed(2)),
          color: color
        });
      }
    });

    return result.sort((a, b) => b.value - a.value);
  }, [data, filterType]);

  const totalValue = useMemo(() => aggregatedData.reduce((acc, cur) => acc + cur.value, 0), [aggregatedData]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[500px] bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-800 flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-100">
          {filterType === 'All' ? 'Asset Allocation' : `${filterType} Breakdown`}
        </h3>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="All">All Assets</option>
          {Object.values(AssetType).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {aggregatedData.length > 0 ? (
        <div className="flex-1 min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ bottom: 20 }}>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="45%"
                outerRadius="55%"
                dataKey="value"
                stroke="none"
                // Labels removed as per request
                label={false}
                labelLine={false}
              >
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => {
                  const formattedValue = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value);
                  const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
                  return `${formattedValue} (${percentage}%)`;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                layout="horizontal"
                wrapperStyle={{ 
                  paddingTop: '20px', 
                  fontSize: '12px',
                  width: '100%' 
                }}
                formatter={(value, entry: any) => {
                  const item = aggregatedData.find(d => d.name === value);
                  const percent = (totalValue > 0 && item) ? ((item.value / totalValue) * 100).toFixed(0) : 0;
                  return <span style={{ color: entry.color, marginRight: '10px' }}>{`${value} (${percent}%)`}</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-500">
          No active assets to display for this category
        </div>
      )}
    </motion.div>
  );
};

export default PieChartComponent;