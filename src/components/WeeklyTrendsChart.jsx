import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const MACHINE_COLORS = [
  '#2563EB', // Blue (CNC-01)
  '#10B981', // Emerald (INJ-02)
  '#F59E0B', // Amber (CNV-03)
  '#8B5CF6', // Purple (HYD-04)
  '#EC4899', // Pink (ROB-05)
  '#06B6D4'  // Cyan (PKG-06)
];

export default function WeeklyTrendsChart({ data = {} }) {
  const { machine_names = [], weekly_data = [] } = data;
  const [selectedMachine, setSelectedMachine] = useState('ALL');

  if (!weekly_data || weekly_data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 card-soft-shadow text-center">
        <p className="text-slate-400 text-sm font-semibold">No weekly trend data available.</p>
      </div>
    );
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-800">
          <p className="font-extrabold text-sm text-slate-100 border-b border-slate-800 pb-1.5 mb-1.5">
            {label}
          </p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300 font-medium">{item.name}:</span>
              </div>
              <span className="font-bold text-white">{item.value} mins</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 card-soft-shadow mb-7">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Weekly Downtime Trend per Machine
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tracking stoppage duration (minutes) across recent weekly cycles
          </p>
        </div>

        {/* Machine filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl">
          <button
            onClick={() => setSelectedMachine('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedMachine === 'ALL'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Machines
          </button>
          {machine_names.map((name, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMachine(name)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedMachine === name
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={weekly_data}
            margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="week_label"
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v) => `${v}m`}
              label={{ value: 'Downtime (Minutes)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10, offset: 15 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }} />

            {machine_names.map((name, idx) => {
              if (selectedMachine !== 'ALL' && selectedMachine !== name) return null;
              const color = MACHINE_COLORS[idx % MACHINE_COLORS.length];
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: color, fill: '#FFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: color, stroke: '#FFF', strokeWidth: 2 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
