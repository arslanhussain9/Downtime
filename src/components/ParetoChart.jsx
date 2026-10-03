import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  Cell
} from 'recharts';
import { Target, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function ParetoChart({ data = {} }) {
  const { items = [], total_downtime_minutes = 0, vital_few_causes = [] } = data;

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 card-soft-shadow text-center">
        <p className="text-slate-400 text-sm font-semibold">No downtime data available for Pareto analysis.</p>
      </div>
    );
  }

  // Format chart items
  const chartData = items.map(item => ({
    ...item,
    displayName: item.reason_name.length > 18 ? item.reason_name.slice(0, 16) + '...' : item.reason_name,
    vitalMarker: item.is_vital_few ? ' (Vital Few)' : ''
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl text-xs space-y-2 border border-slate-800">
          <div className="flex items-center justify-between space-x-3">
            <span className="font-bold text-sm text-slate-100">{dataPoint.reason_name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: dataPoint.color }}>
              {dataPoint.reason_code}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300 pt-1 border-t border-slate-800">
            <span>Downtime Duration:</span>
            <span className="font-bold text-white text-right">{dataPoint.total_minutes} mins ({dataPoint.total_hours}h)</span>
            <span>Failure Incidents:</span>
            <span className="font-bold text-white text-right">{dataPoint.count} times</span>
            <span>Cause Share:</span>
            <span className="font-bold text-blue-400 text-right">{dataPoint.percentage}%</span>
            <span>Cumulative Share:</span>
            <span className="font-bold text-amber-400 text-right">{dataPoint.cumulative_percentage}%</span>
          </div>
          {dataPoint.is_vital_few && (
            <div className="pt-1.5 flex items-center space-x-1.5 text-rose-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vital Few Cause (80/20 Driver)</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 card-soft-shadow mb-7">
      
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Pareto of Downtime Causes
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Causes ranked by downtime minutes with cumulative-% curve (80/20 Rule)
          </p>
        </div>

        {/* Vital Few Banner */}
        <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 p-2 sm:p-2.5 rounded-2xl">
          <div className="flex items-center space-x-1 text-rose-600 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Vital Few:</span>
          </div>
          {vital_few_causes.map((cause, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-xl bg-white text-rose-700 shadow-xs border border-rose-200/60"
            >
              #{idx + 1} {cause}
            </span>
          ))}
        </div>
      </div>

      {/* Dual Axis Chart Container */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 25, left: 0, bottom: 45 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="displayName"
              angle={-25}
              textAnchor="end"
              interval={0}
              height={55}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            {/* Primary Left Y-Axis: Downtime Minutes */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#64748B"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(v) => `${v}m`}
              label={{ value: 'Downtime (Minutes)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 11, offset: 10 }}
            />
            {/* Secondary Right Y-Axis: Cumulative % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke="#F59E0B"
              tick={{ fontSize: 11, fill: '#F59E0B', fontWeight: 600 }}
              tickFormatter={(v) => `${v}%`}
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 11, offset: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 80% Pareto Reference Cutoff Line */}
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: '80% Vital Few Threshold',
                position: 'insideTopRight',
                fill: '#EF4444',
                fontSize: 11,
                fontWeight: 700
              }}
            />

            {/* Bars for Downtime Minutes */}
            <Bar
              yAxisId="left"
              dataKey="total_minutes"
              name="Downtime Minutes"
              radius={[8, 8, 0, 0]}
              maxBarSize={45}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.is_vital_few ? '#2563EB' : '#94A3B8'} 
                  opacity={entry.is_vital_few ? 1.0 : 0.65}
                />
              ))}
            </Bar>

            {/* Line for Cumulative % */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative_percentage"
              name="Cumulative %"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#F59E0B', fill: '#FFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#F59E0B', stroke: '#FFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Breakdown Strip */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-600"></span>
            <span className="font-semibold text-slate-700">Vital Few Causes</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-400 opacity-70"></span>
            <span className="font-semibold text-slate-700">Useful Many</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded"></span>
            <span className="font-semibold text-slate-700">Cumulative % Curve</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Addressing top 2 causes resolves ~80% of factory downtime.</span>
        </div>
      </div>

    </div>
  );
}
