import React from 'react';
import { Cpu, Clock, Wrench, Shield, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function MachineBreakdown({ machines = [], onSelectMachineForLog }) {
  if (!machines || machines.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 card-soft-shadow mb-7">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Machine Reliability Matrix (MTBF & MTTR)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Live reliability metrics computed directly from logged stoppages
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-400">
          Formula: <span className="text-slate-700 font-bold">MTBF = Run Time ÷ Failures</span> | <span className="text-slate-700 font-bold">MTTR = mean(end − start)</span>
        </div>
      </div>

      {/* Grid of Machine Reliability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m) => {
          const isCritical = m.health_badge === 'Critical Attention';
          const isModerate = m.health_badge === 'Moderate';

          return (
            <div
              key={m.machine_id}
              className={`p-5 rounded-2xl border transition-all ${
                isCritical
                  ? 'bg-rose-50/20 border-rose-200/80 shadow-xs'
                  : isModerate
                  ? 'bg-amber-50/15 border-amber-200/70 shadow-xs'
                  : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-slate-900 text-white">
                    {m.machine_code}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-100 text-rose-700'
                      : isModerate
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {m.health_badge}
                  </span>
                </div>

                <button
                  onClick={() => onSelectMachineForLog(m.machine_id)}
                  title="Quick Log Stoppage for this machine"
                  className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200/80 transition-colors shadow-2xs"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Machine Name & Line */}
              <h4 className="text-sm font-bold text-slate-900 truncate">{m.machine_name}</h4>
              <p className="text-[11px] text-slate-400 truncate mb-3">{m.line}</p>

              {/* Metric Pillars */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                    <Clock className="w-3 h-3 mr-1 text-blue-500" />
                    <span>MTBF</span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-extrabold text-slate-900">{m.mtbf_hours}</span>
                    <span className="text-[10px] font-semibold text-slate-400">hrs</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                    <Wrench className="w-3 h-3 mr-1 text-amber-500" />
                    <span>MTTR</span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-extrabold text-slate-900">{m.mttr_minutes}</span>
                    <span className="text-[10px] font-semibold text-slate-400">mins</span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100/70">
                <span>Failures: <strong className="text-slate-800">{m.failure_count}</strong></span>
                <span>Down: <strong className="text-slate-800">{m.total_downtime_hours}h</strong></span>
                <span>Avail: <strong className={isCritical ? "text-rose-600" : "text-emerald-600"}>{m.availability_pct}%</strong></span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
