import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { AssetRecord, AssetStatus, ChartDataPoint, AssetType } from '../types';
import { COLORS, DETAIL_COLORS, ACTION_MULTIPLIERS } from '../constants';

interface PieChartComponentProps {
  data: AssetRecord[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
  filterType: string;
  onFilterChange: (type: string) => void;
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, theme, t, filterType, onFilterChange }) => {

  // Aggregate data based on filter
  const aggregatedData = useMemo(() => {
    const map = new Map<string, number>();

    // Step 1: Identify Active Assets
    // We only want to list assets that are currently marked as Active.
    // However, we must process ALL transactions (Active + Sold) for those assets to get the true net quantity.
    const activeAssetNames = new Set<string>();
    data.forEach(item => {
      if (item.status === AssetStatus.Active) {
        activeAssetNames.add(item.name);
      }
    });

    // Step 2: Calculate Holdings for Active Assets
    // We track Total Buy Cost and Total Buy Quantity to calculate Average Cost Basis
    const holdings = new Map<string, {
      netQty: number;
      netValue: number;
      totalBuyQty: number;
      totalBuyCost: number;
      type: AssetType;
    }>();

    data.forEach(item => {
      // Skip if the asset itself is not active
      if (!activeAssetNames.has(item.name)) return;

      const multiplier = ACTION_MULTIPLIERS[item.action.toLowerCase()] ?? 1;
      const current = holdings.get(item.name) || {
        netQty: 0,
        netValue: 0,
        totalBuyQty: 0,
        totalBuyCost: 0,
        type: item.type,
      };

      // Accumulate Net Quantity (All transactions)
      if (item.quantity) {
        current.netQty += (item.quantity * multiplier);
      }

      // Accumulate Net Amount (for non-unit assets)
      current.netValue += (item.amount * multiplier);

      // Track Cost Basis (Only "Buy"/Inflow transactions)
      // We use multiplier > 0 to identify inflows (Buy, Contribute, etc)
      // And strict handling for unit-based assets to avoid mixing "Renovation" etc if they hypothetically applied
      if (multiplier > 0 && item.quantity && item.quantity > 0) {
        current.totalBuyQty += item.quantity;
        current.totalBuyCost += item.amount;
      }

      holdings.set(item.name, current);
    });

    // Step 3: Compute Chart Values
    holdings.forEach((data, name) => {
      let finalValue = data.netValue;

      // For Unit-based assets, calculate Value based on Average Cost of Remaining Units
      // Value = Remaining Units * (Total Buy Cost / Total Buy Units)
      const isUnitBased = [AssetType.Stock, AssetType.ETF, AssetType.REIT].includes(data.type);

      if (isUnitBased && data.netQty > 0) {
        // Avoid division by zero
        const avgCost = data.totalBuyQty > 0 ? (data.totalBuyCost / data.totalBuyQty) : 0;
        finalValue = data.netQty * avgCost;
      }

      if (finalValue > 0) {
        if (filterType === 'All') {
          // Group by Asset Type
          const currentTotal = map.get(data.type) || 0;
          map.set(data.type, currentTotal + finalValue);
        } else {
          // Filter by selected Type, Group by Name
          if (data.type === filterType) {
            map.set(name, finalValue); // Name is unique within type usually, or handled above
          }
        }
      }
    });

    const result: ChartDataPoint[] = [];
    let colorIndex = 0;

    map.forEach((value, key) => {
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
    });

    return result.sort((a, b) => b.value - a.value);
  }, [data, filterType]);

  const totalValue = useMemo(() => aggregatedData.reduce((acc, cur) => acc + cur.value, 0), [aggregatedData]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full min-h-[300px] bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {filterType === 'All' ? t('chart_asset_allocation') : `${filterType} ${t('chart_breakdown')}`}
        </h3>
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer transition-colors"
        >
          <option value="All">{t('all_assets')}</option>
          {Object.values(AssetType).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {aggregatedData.length > 0 ? (
        <div className="flex-1 min-h-[250px] min-w-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="45%"
                outerRadius="80%"
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
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
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
                  return <span className="text-slate-700 dark:text-slate-200" style={{ color: entry.color, marginRight: '10px' }}>{`${value} (${percent}%)`}</span>;
                }}
              />
            </PieChart>
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

export default PieChartComponent;