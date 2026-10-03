import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, ArrowRight, Sparkles, Clock, RefreshCw } from 'lucide-react';

export default function RepeatAlertsBanner({ alerts = [], onRefresh, onUpdateStatus }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'ACTIVE'

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 mb-7 flex items-center justify-between card-soft-shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Zero Critical Repeat Failures Detected</h4>
            <p className="text-xs text-emerald-700 font-medium">
              No machine has experienced the same failure code ≥ 3 times in the rolling 7-day window.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-xl">
          Stable Floor
        </span>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const displayAlerts = activeTab === 'ACTIVE' ? activeAlerts : alerts;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-rose-100 card-soft-shadow mb-7 relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-50/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Repeat-Failure Alerts (≥3 in 7 Days)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase">
                {activeAlerts.length} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated pattern detection identifying recurring stoppage hotspots for Root Cause Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ACTIVE' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Active ({activeAlerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3.5">
        {displayAlerts.map((alert) => {
          const isResolved = alert.status === 'RESOLVED';
          const isAcknowledged = alert.status === 'ACKNOWLEDGED';

          return (
            <div 
              key={alert.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isResolved
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : 'bg-gradient-to-r from-rose-50/40 via-white to-orange-50/20 border-rose-200/90 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs uppercase">
                      {alert.machine_code}
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">
                      {alert.machine_name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                      {alert.reason_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white">
                      {alert.incident_count} Incidents / 7d
                    </span>
                  </div>

                  {/* Recommendation Quote */}
                  <div className="bg-white/80 p-3 rounded-xl border border-rose-100/80 text-xs text-slate-700 font-medium flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Recommended RCA Action: </span>
                      {alert.recommended_action}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Window: {alert.window_start ? new Date(alert.window_start).toLocaleDateString() : 'Recent'} – {alert.window_end ? new Date(alert.window_end).toLocaleDateString() : 'Now'}
                    </span>
                    <span>Status: <strong className="text-slate-700">{alert.status}</strong></span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  {!isResolved && (
                    <>
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => onUpdateStatus && onUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateStatus && onUpdateStatus(alert.id, 'RESOLVED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve RCA</span>
                      </button>
                    </>
                  )}
                  {isResolved && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                      Resolved
                    </span>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
