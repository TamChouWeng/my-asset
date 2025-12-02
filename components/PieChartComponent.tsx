import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AssetRecord, AssetStatus, ChartDataPoint, AssetType } from '../types';
import { COLORS } from '../constants';

interface PieChartComponentProps {
  data: AssetRecord[];
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ data }) => {
  // Aggregate data by Type, only considering 'Active' assets for the chart
  const aggregatedData = React.useMemo(() => {
    const map = new Map<AssetType, number>();

    data.forEach(item => {
      // Logic: Only sum up if status is Active. 
      // For Property, user CSV showed negative payment. We typically want absolute value for allocation 
      // or we treat it as cost basis. For this demo, we sum the raw 'amount' field if status is Active.
      if (item.status === AssetStatus.Active) {
        const current = map.get(item.type) || 0;
        map.set(item.type, current + item.amount);
      }
    });

    const result: ChartDataPoint[] = [];
    map.forEach((value, key) => {
      if (value > 0) {
        result.push({
          name: key,
          value: parseFloat(value.toFixed(2)),
          color: COLORS[key] || '#cccccc'
        });
      }
    });

    return result.sort((a, b) => b.value - a.value);
  }, [data]);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-800">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Asset Allocation (Active)</h3>
      {aggregatedData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={aggregatedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {aggregatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value)}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-500">
          No active assets to display
        </div>
      )}
    </div>
  );
};

export default PieChartComponent;