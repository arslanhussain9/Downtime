import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  HardHat, 
  Sliders, 
  Download, 
  RotateCcw, 
  Zap, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function Navbar({ 
  role, 
  setRole, 
  activeTab, 
  setActiveTab, 
  activeAlertsCount, 
  onSeedData, 
  onInjectDemo, 
  onExportCSV,
  onOpenFastLog,
  isLiveUpdating
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setRole('admin'); setActiveTab('dashboard'); }}>
            <img 
              src="/logo.png" 
              alt="ParetoFlow Logo" 
              className="h-10 sm:h-11 w-auto object-contain rounded-xl"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  ParetoFlow
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Analytics</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Downtime Log & Root-Cause Analyzer
              </p>
            </div>
          </div>

          {/* Center: Role Switcher (Operator vs Plant Manager) */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => { setRole('operator'); setActiveTab('log'); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                role === 'operator'
                  ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Operator Fast Log</span>
            </button>
            <button
              onClick={() => { setRole('admin'); if (activeTab === 'log') setActiveTab('dashboard'); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                role === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Plant Manager / Admin</span>
              {activeAlertsCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Hub: Demo, Fast Log, Export, Seed */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Live Stoppages Demo Button (Problem Statement expected feature) */}
            <button
              onClick={onInjectDemo}
              title="Demo Day: Injects 3 live stoppages to see MTBF, MTTR & Pareto update instantly"
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span className="hidden sm:inline">Demo: 3 Live Events</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Fast Stoppage Logger Button */}
            <button
              onClick={onOpenFastLog}
              className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>+ Log Stoppage</span>
            </button>

            {/* Quick Actions (Reset & CSV) */}
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
              <button
                onClick={onSeedData}
                title="Re-seed 60 events across 30 days"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onExportCSV}
                title="Export Downtime Log to CSV"
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Sub-bar for Role and Alerts */}
        <div className="flex md:hidden items-center justify-between pb-3 pt-1 border-t border-slate-100/80">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setRole('operator'); setActiveTab('log'); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                role === 'operator' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => { setRole('admin'); if (activeTab === 'log') setActiveTab('dashboard'); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>Admin</span>
              {activeAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live Analysis Active</span>
          </div>
        </div>

      </div>
    </header>
  );
}
