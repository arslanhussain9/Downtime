import React from 'react';
import { Clock, Wrench, ShieldCheck, AlertTriangle, TrendingUp, Layers } from 'lucide-react';

export default function MetricsOverview({ metrics, activeAlertsCount, onAlertClick }) {
  if (!metrics) return null;

  const {
    total_failures = 0,
    total_downtime_minutes = 0,
    total_downtime_hours = 0,
    plant_operating_hours = 0,
    plant_mtbf_hours = 0,
    plant_mttr_minutes = 0,
    plant_availability_pct = 100,
    machine_count = 6
  } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7">
      
      {/* 1. MTBF Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 card-soft-shadow card-hover-effect relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plant MTBF
            </span>
            <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md uppercase">
              Live Auto-Update
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {plant_mtbf_hours}
          </span>
          <span className="text-sm font-bold text-slate-500">hours</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-50">
          <span className="text-slate-500 font-medium">Mean Time Between Failures</span>
          <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
            <TrendingUp className="w-3 h-3 mr-1" />
            Recalculates on every log
          </span>
        </div>
      </div>

      {/* 2. MTTR Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 card-soft-shadow card-hover-effect relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plant MTTR
            </span>
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md uppercase">
              Live Auto-Update
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {plant_mttr_minutes}
          </span>
          <span className="text-sm font-bold text-slate-500">mins</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-50">
          <span className="text-slate-500 font-medium">Mean Time to Repair</span>
          <span className="text-[11px] font-semibold text-slate-400">
            mean(end - start)
          </span>
        </div>
      </div>

      {/* 3. Availability Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 card-soft-shadow card-hover-effect relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Availability
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {plant_availability_pct}%
          </span>
          <span className="text-xs font-semibold text-slate-400">uptime</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 pt-3 border-t border-slate-50">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, plant_availability_pct))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5">
            <span>{plant_operating_hours}h operating</span>
            <span>{total_downtime_hours}h down</span>
          </div>
        </div>
      </div>

      {/* 4. Active Repeat-Failure Alerts Card */}
      <div 
        onClick={onAlertClick}
        className={`rounded-3xl p-5 sm:p-6 border card-soft-shadow card-hover-effect relative overflow-hidden cursor-pointer transition-all ${
          activeAlertsCount > 0
            ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
            : 'bg-white border-slate-100/90'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Repeat Alerts (7 Days)
          </span>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
            activeAlertsCount > 0
              ? 'bg-rose-100 text-rose-600 border-rose-200 animate-pulse'
              : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            activeAlertsCount > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {activeAlertsCount}
          </span>
          <span className="text-xs font-bold uppercase text-slate-400">
            {activeAlertsCount === 1 ? 'Pattern' : 'Patterns'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100/80">
          <span className="text-slate-500 font-medium">Machine + Reason ≥ 3x</span>
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
            activeAlertsCount > 0
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {activeAlertsCount > 0 ? 'Action Needed' : 'Normal'}
          </span>
        </div>
      </div>

    </div>
  );
}
