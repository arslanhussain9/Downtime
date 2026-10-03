import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Target, 
  Clock, 
  AlertOctagon, 
  BarChart3, 
  FileText, 
  Settings, 
  HardHat, 
  Zap, 
  RefreshCw,
  Sparkles,
  TrendingUp,
  Download
} from 'lucide-react';

import { api } from './api';
import Navbar from './components/Navbar';
import MetricsOverview from './components/MetricsOverview';
import ParetoChart from './components/ParetoChart';
import RepeatAlertsBanner from './components/RepeatAlertsBanner';
import WeeklyTrendsChart from './components/WeeklyTrendsChart';
import MachineBreakdown from './components/MachineBreakdown';
import EventLogTable from './components/EventLogTable';
import AdminManager from './components/AdminManager';
import FastLogModal from './components/FastLogModal';
import OperatorView from './components/OperatorView';

export default function App() {
  const [role, setRole] = useState('admin'); // 'operator' or 'admin'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'pareto', 'mtbf', 'alerts', 'log', 'admin', 'operator_log'
  const [daysWindow, setDaysWindow] = useState(30);

  // Core Data Stores
  const [overview, setOverview] = useState(null);
  const [paretoData, setParetoData] = useState({});
  const [mtbfData, setMtbfData] = useState({});
  const [weeklyData, setWeeklyData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [events, setEvents] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isFastLogOpen, setIsFastLogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [targetMachineForLog, setTargetMachineForLog] = useState(null);

  // Load all analytics and master data
  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const effectiveDays = daysWindow === 0 ? 0 : daysWindow;
      const [
        ovRes,
        pRes,
        mRes,
        wRes,
        aRes,
        machRes,
        reasRes,
        evRes
      ] = await Promise.all([
        api.getOverview(effectiveDays),
        api.getPareto(effectiveDays),
        api.getMTBF(effectiveDays),
        api.getWeeklyTrends(5),
        api.getAlerts(),
        api.getMachines(),
        api.getReasonCodes(),
        api.getEvents({ days: effectiveDays, limit: 100 })
      ]);

      setOverview(ovRes);
      setParetoData(pRes);
      setMtbfData(mRes);
      setWeeklyData(wRes);
      setAlerts(aRes);
      setMachines(machRes);
      setReasons(reasRes);
      setEvents(evRes.items || []);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [daysWindow]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Show temporary toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1-Click Demo Injector (Problem Statement Requirement: 3 live stoppages update cards & charts)
  const handleInjectDemo = async () => {
    try {
      const res = await api.injectDemoStoppages();
      await loadData(false);
      triggerToast('🚀 3 Stoppages logged live! MTBF/MTTR cards, Pareto curve, and weekly trends updated!');
    } catch (err) {
      alert('Demo injection failed: ' + err.message);
    }
  };

  // Re-seed Data
  const handleSeedData = async () => {
    if (window.confirm('Reset and re-seed 60 events across 30 days with dominant root causes?')) {
      try {
        await api.seedData(true);
        await loadData(false);
        triggerToast('Database reset and re-seeded with 60 realistic events!');
      } catch (err) {
        alert('Seed failed: ' + err.message);
      }
    }
  };

  // Log Event from Fast Modal or Operator View
  const handleLogEvent = async (payload) => {
    const res = await api.logEvent(payload);
    await loadData(false);
    setActiveTab('log'); // Switch immediately to Stoppage Log view so user sees new log!
    triggerToast(`✅ Stoppage recorded on ${res.machine || 'machine'}! Showing at top of Stoppage Log.`);
    return res;
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    await api.deleteEvent(eventId);
    await loadData(false);
    triggerToast('Event removed. Live analytics recalculated.');
  };

  // Update alert status
  const handleUpdateAlertStatus = async (alertId, status) => {
    try {
      await fetch(`/api/alerts/${alertId}/status?status=${status}`, { method: 'POST' });
    } catch (e) {}
    // Update local alert
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
    triggerToast(`Alert marked as ${status}.`);
  };

  // Create Reason Code (Admin)
  const handleCreateReason = async (payload) => {
    const created = await api.createReasonCode(payload);
    setReasons(prev => [...prev, created]);
    await loadData(false);
    return created;
  };

  // Create Machine (Admin)
  const handleCreateMachine = async (payload) => {
    const created = await api.createMachine(payload);
    setMachines(prev => [...prev, created]);
    await loadData(false);
    return created;
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar 
        role={role}
        setRole={setRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertsCount={activeAlertsCount}
        onSeedData={handleSeedData}
        onInjectDemo={handleInjectDemo}
        onExportCSV={api.exportCSV}
        onOpenFastLog={() => setIsFastLogOpen(true)}
      />

      {/* Sub-header Navigation Tabs (For Admin/Manager View) */}
      {role === 'admin' && (
        <div className="bg-white border-b border-slate-200/70 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between overflow-x-auto py-2.5 space-x-1 sm:space-x-2">
              
              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Overview Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('pareto')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'pareto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Pareto Analysis (80/20)</span>
                </button>

                <button
                  onClick={() => setActiveTab('mtbf')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'mtbf'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>MTBF & MTTR Matrix</span>
                </button>

                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'alerts'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Repeat Alerts (≥3x/7d)</span>
                  {activeAlertsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {activeAlertsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('log')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'log'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Stoppage Log ({events.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Master Data</span>
                </button>
              </div>

              {/* Time Window Selector (7d, 30d, 90d, All Time) */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold shrink-0">
                {[
                  { label: '7 Days', val: 7 },
                  { label: '30 Days', val: 30 },
                  { label: '90 Days', val: 90 },
                  { label: 'All Time', val: 0 }
                ].map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setDaysWindow(d.val)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      daysWindow === d.val
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500">Computing MTBF, Pareto curves & checking repeat alerts...</p>
          </div>
        ) : role === 'operator' ? (
          
          /* OPERATOR MODE: Sub-20s Stoppage Logger & Shift Timeline */
          <OperatorView
            machines={machines}
            reasons={reasons}
            onLogSubmit={handleLogEvent}
            onInjectDemo={handleInjectDemo}
            events={events}
          />

        ) : (

          /* PLANT MANAGER / ADMIN ANALYTICS MODE */
          <div>
            
            {/* 1. OVERVIEW DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-7">
                {activeAlertsCount > 0 && (
                  <RepeatAlertsBanner 
                    alerts={alerts}
                    onRefresh={loadData}
                    onUpdateStatus={handleUpdateAlertStatus}
                  />
                )}

                <MetricsOverview 
                  metrics={overview?.plant_metrics}
                  activeAlertsCount={activeAlertsCount}
                  onAlertClick={() => setActiveTab('alerts')}
                />

                <ParetoChart data={paretoData} />
                <WeeklyTrendsChart data={weeklyData} />
                <MachineBreakdown 
                  machines={mtbfData?.machines}
                  onSelectMachineForLog={(mId) => {
                    setIsFastLogOpen(true);
                  }}
                />
                <EventLogTable 
                  events={events}
                  machines={machines}
                  reasons={reasons}
                  onDeleteEvent={handleDeleteEvent}
                  onExportCSV={api.exportCSV}
                />
              </div>
            )}

            {/* 2. PARETO ANALYSIS TAB */}
            {activeTab === 'pareto' && (
              <div className="space-y-7">
                <MetricsOverview 
                  metrics={overview?.plant_metrics}
                  activeAlertsCount={activeAlertsCount}
                  onAlertClick={() => setActiveTab('alerts')}
                />
                <ParetoChart data={paretoData} />
                <EventLogTable 
                  events={events}
                  machines={machines}
                  reasons={reasons}
                  onDeleteEvent={handleDeleteEvent}
                  onExportCSV={api.exportCSV}
                />
              </div>
            )}

            {/* 3. MTBF & MTTR MATRIX TAB */}
            {activeTab === 'mtbf' && (
              <div className="space-y-7">
                <MetricsOverview 
                  metrics={overview?.plant_metrics}
                  activeAlertsCount={activeAlertsCount}
                  onAlertClick={() => setActiveTab('alerts')}
                />
                <MachineBreakdown 
                  machines={mtbfData?.machines}
                  onSelectMachineForLog={(mId) => {
                    setIsFastLogOpen(true);
                  }}
                />
                <WeeklyTrendsChart data={weeklyData} />
              </div>
            )}

            {/* 4. REPEAT ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-7">
                <RepeatAlertsBanner 
                  alerts={alerts}
                  onRefresh={loadData}
                  onUpdateStatus={handleUpdateAlertStatus}
                />
                <div className="bg-white rounded-3xl p-6 border border-slate-100/90 card-soft-shadow">
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">
                    Repeat-Failure Detection Engine Explained
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    The platform continuously sweeps downtime logs over a rolling <strong>7-day window</strong>. Any combination of <code>Machine ID</code> + <code>Reason Code</code> with <strong>≥ 3 stoppage events</strong> triggers an automated alert, calculates severity, logs time windows, and generates actionable Root Cause Analysis recommendations to eliminate repeat anecdotal breakdowns.
                  </p>
                </div>
              </div>
            )}

            {/* 5. STOPPAGE LOG TAB */}
            {activeTab === 'log' && (
              <div className="space-y-7">
                <EventLogTable 
                  events={events}
                  machines={machines}
                  reasons={reasons}
                  onDeleteEvent={handleDeleteEvent}
                  onExportCSV={api.exportCSV}
                />
              </div>
            )}

            {/* 6. MASTER DATA TAB */}
            {activeTab === 'admin' && (
              <div className="space-y-7">
                <AdminManager 
                  machines={machines}
                  reasons={reasons}
                  onCreateReason={handleCreateReason}
                  onCreateMachine={handleCreateMachine}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900">ParetoFlow</span>
            <span>•</span>
            <span>Intelligent Stoppage Resolution Platform</span>
          </div>
          <div className="text-slate-600 font-semibold">
            Designed &amp; Engineered by Team <strong className="text-blue-600 font-black">The Four Bits</strong>
          </div>
        </div>
      </footer>

      {/* Fast Downtime Entry Modal (<20 seconds) */}
      <FastLogModal
        isOpen={isFastLogOpen}
        onClose={() => setIsFastLogOpen(false)}
        machines={machines}
        reasonCodes={reasons}
        onLogSubmit={handleLogEvent}
      />

    </div>
  );
}
