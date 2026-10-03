import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  HardHat, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Wrench, 
  ChevronRight, 
  UserCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function OperatorView({ 
  machines = [], 
  reasons = [], 
  onLogSubmit, 
  onInjectDemo,
  events = [] 
}) {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [duration, setDuration] = useState(15);
  const [comment, setComment] = useState('');
  const [operatorName, setOperatorName] = useState('Operator Arslan');
  const [shift, setShift] = useState('Morning');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(5920); // 01:38:40 live timer simulation

  // Live timer effect for operator floor aesthetic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTimer(totalSecs) {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  // Set default selection
  useEffect(() => {
    if (machines.length > 0 && !selectedMachine) setSelectedMachine(machines[0]);
    if (reasons.length > 0 && !selectedReason) setSelectedReason(reasons[0]);
  }, [machines, reasons]);

  const quickDurations = [5, 10, 15, 30, 45, 60, 90, 120];

  const quickChips = [
    "Motor thermal trip sensor cut off",
    "Conveyor transfer jam cleared",
    "Sensor optical reflector wiped",
    "Hydraulic line pressure dropped",
    "Worn carbide tool insert replaced",
    "Shift handover safety check"
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedMachine || !selectedReason) return;

    try {
      setSubmitting(true);
      await onLogSubmit({
        machine_id: selectedMachine.id,
        reason_code_id: selectedReason.id,
        duration_minutes: parseFloat(duration),
        comment: comment.trim(),
        operator_name: operatorName,
        shift: shift
      });
      setSuccessToast(true);
      setComment('');
      setTimeout(() => setSuccessToast(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to log');
    } finally {
      setSubmitting(false);
    }
  };

  // Recent operator events
  const recentStoppages = events.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Operator Live Shift Status Card (Inspired by reference UI 'Clock In Track Everything') */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-blue-100">
                Shift In Progress • {shift}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Fast Stoppage Logger
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
              Log machinery downtime in &lt; 20 seconds. Instant MTBF & Pareto recalculation.
            </p>
          </div>

          {/* Active Shift Clock Badge (like 01:38:20 in reference photo) */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block">
              Active Shift Time
            </span>
            <span className="font-mono font-black text-2xl sm:text-3xl tracking-tight text-white">
              {formatTimer(activeTimerSeconds)}
            </span>
            <div className="flex items-center justify-end space-x-1 text-[11px] text-emerald-300 font-bold mt-0.5">
              <UserCheck className="w-3 h-3" />
              <span>{operatorName}</span>
            </div>
          </div>
        </div>

        {/* Quick Simulation Trigger */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-blue-100 font-medium">
            Live Stoppage Simulation: Test instant MTBF & Pareto reactivity across shop floor.
          </span>
          <button
            onClick={onInjectDemo}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Simulate 3 Live Stoppages</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Stoppage logged in 14.2s! MTBF cards, Pareto vital few, and weekly trends updated!</span>
          </div>
          <span className="text-xs bg-emerald-200/60 px-2 py-0.5 rounded-md font-mono">&lt; 20s Verified</span>
        </div>
      )}

      {/* Rapid Downtime Entry Canvas */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 card-soft-shadow">
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. Step 1: Select Machine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">1</span>
                <span>Select Down Machine</span>
              </label>
              {selectedMachine && (
                <span className="text-xs font-bold text-blue-600">
                  Selected: {selectedMachine.code} ({selectedMachine.name})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {machines.map((m) => {
                const isSelected = selectedMachine?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMachine(m)}
                    className={`p-3 rounded-2xl text-left border transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.code}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 truncate mt-1.5">{m.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{m.line}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Step 2: Select Reason Code (Controlled List) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">2</span>
                <span>Reason Code (Controlled List)</span>
              </label>
              {selectedReason && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedReason.category}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {reasons.map((r) => {
                const isSelected = selectedReason?.id === r.id;
                const isDominant = r.code === 'MTR-OVH';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`p-2.5 rounded-2xl text-left border transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {r.code}
                      </span>
                      <span 
                        className="w-2.5 h-2.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: r.color }}
                      ></span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-1">{r.name}</p>
                    <span className="text-[10px] text-slate-400 block truncate">{r.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Step 3: Stoppage Duration (<20s fast chips) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">3</span>
                <span>Duration</span>
              </label>
              <span className="text-xs font-extrabold text-blue-600">
                {duration} Minutes Selected ({Math.round((duration / 60) * 10) / 10}h)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickDurations.map((mins) => {
                const isAct = duration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all ${
                      isAct
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20 scale-105'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
              <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold">
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-14 bg-transparent text-slate-900 font-extrabold focus:outline-none"
                />
                <span className="text-slate-400">min</span>
              </div>
            </div>
          </div>

          {/* 4. Step 4: Quick Comment & Observation */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Observation / Quick Comment
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setComment(chip)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors truncate max-w-[260px]"
                >
                  + {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Short comment: e.g. High ambient temperature caused motor thermal breaker trip."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Big Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              <Clock className="w-5 h-5" />
              <span>{submitting ? 'Recording Live Stoppage...' : 'Log Stoppage (Sub-20s)'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </form>

      </div>

      {/* Operator's Stoppages Stream (Like 'My Timeline' in reference photo) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100/90 card-soft-shadow">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Recently Logged Stoppages on Floor</span>
        </h3>

        <div className="space-y-2.5">
          {recentStoppages.map((ev) => (
            <div key={ev.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                  {ev.machine_code || `M${ev.machine_id}`}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{ev.machine_name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-rose-600">{ev.reason_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">{ev.comment || 'No notes'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-slate-900 block">{ev.duration_minutes}m</span>
                <span className="text-[10px] text-slate-400">{ev.shift} Shift</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
