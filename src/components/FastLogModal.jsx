import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Check, Zap } from 'lucide-react';

export default function FastLogModal({ 
  isOpen, 
  onClose, 
  machines = [], 
  reasonCodes = [], 
  onLogSubmit 
}) {
  const [machineId, setMachineId] = useState('');
  const [reasonCodeId, setReasonCodeId] = useState('');
  const [durationMode, setDurationMode] = useState('quick'); // 'quick' or 'custom'
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  const [operatorName, setOperatorName] = useState('Operator');
  const [shift, setShift] = useState('Morning');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Set default machine and reason when data loads
  useEffect(() => {
    if (machines.length > 0 && !machineId) {
      setMachineId(machines[0].id);
    }
    if (reasonCodes.length > 0 && !reasonCodeId) {
      setReasonCodeId(reasonCodes[0].id);
    }
  }, [machines, reasonCodes]);

  // Set initial datetimes for custom mode
  useEffect(() => {
    const now = new Date();
    const halfHourAgo = new Date(now.getTime() - 30 * 60 * 1000);
    setEndTime(toLocalISO(now));
    setStartTime(toLocalISO(halfHourAgo));
  }, []);

  function toLocalISO(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  }

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [reasonCategoryFilter, setReasonCategoryFilter] = useState('ALL');
  const [observationFilter, setObservationFilter] = useState('ALL');
  const [autoMatchedNotice, setAutoMatchedNotice] = useState('');

  const quickDurations = [10, 15, 30, 45, 60, 90, 120];

  const quickFailureReasons = [
    // Overheat / Thermal
    { label: "Motor thermal overload cutoff tripped (>92°C)", reasonCode: "MTR-OVH", icon: "🔥", category: "Thermal" },
    { label: "Spindle bearing high friction & thermal alarm", reasonCode: "BRG-OVH", icon: "🔥", category: "Thermal" },
    { label: "Coolant chiller unit overheated / flow rate low", reasonCode: "CHL-OVH", icon: "🔥", category: "Thermal" },
    { label: "Heat sink clogged with dust; cooling fan stalled", reasonCode: "MTR-OVH", icon: "🔥", category: "Thermal" },

    // Sensors & Detection
    { label: "Optical presence sensor dirty / misaligned", reasonCode: "SNR-FLT", icon: "📡", category: "Sensors" },
    { label: "Proximity inductive sensor failed to detect part", reasonCode: "PRX-FLT", icon: "📡", category: "Sensors" },
    { label: "Safety light curtain interrupted by falling scrap", reasonCode: "SEC-STP", icon: "📡", category: "Sensors" },
    { label: "Thermocouple probe loose / false temperature spike", reasonCode: "THM-FLT", icon: "📡", category: "Sensors" },
    { label: "Travel limit switch roller jammed with metal chips", reasonCode: "LMT-SWT", icon: "📡", category: "Sensors" },

    // Mechanical & Pneumatics
    { label: "Conveyor transfer jam cleared", reasonCode: "CNV-JAM", icon: "⚙️", category: "Mechanical" },
    { label: "Pneumatic air pressure dropped below 5 bar", reasonCode: "PNM-DRP", icon: "⚙️", category: "Mechanical" },
    { label: "Hydraulic hose fitting seal leak & pressure drop", reasonCode: "HYD-LKG", icon: "⚙️", category: "Mechanical" },
    { label: "Synchronous timing belt loose / teeth slipping", reasonCode: "GBX-SLP", icon: "⚙️", category: "Mechanical" },
    { label: "Central auto-lubrication oil reservoir empty", reasonCode: "LUB-FLT", icon: "⚙️", category: "Mechanical" },

    // Electrical & Automation
    { label: "Main distribution breaker MCB overcurrent trip", reasonCode: "ELE-TRP", icon: "⚡", category: "Electrical" },
    { label: "Servo drive axis over-torque encoder fault", reasonCode: "SRV-ERR", icon: "⚡", category: "Electrical" },

    // Tooling, Material & Operations
    { label: "Carbide tool insert chipped / worn past tolerance", reasonCode: "TLS-WRN", icon: "🔧", category: "Tooling" },
    { label: "Raw material sheet thickness out of specification", reasonCode: "MAT-DEF", icon: "📦", category: "Material" },
    { label: "Shift handover crew briefing checklist delay", reasonCode: "OPR-ABS", icon: "⏱️", category: "Operational" }
  ];

  const handleSelectObservation = (item) => {
    setComment(item.label);
    const matched = reasonCodes.find(r => r.code === item.reasonCode);
    if (matched) {
      setReasonCodeId(matched.id);
      setAutoMatchedNotice(`Auto-selected [${matched.code}] ${matched.name}`);
      setTimeout(() => setAutoMatchedNotice(''), 3500);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!machineId) {
      setErrorMsg('Please select a machine.');
      return;
    }
    if (!reasonCodeId) {
      setErrorMsg('Please select a reason code.');
      return;
    }

    let payload = {
      machine_id: parseInt(machineId),
      reason_code_id: parseInt(reasonCodeId),
      comment: comment.trim(),
      operator_name: operatorName.trim() || "Operator",
      shift: shift
    };

    if (durationMode === 'quick') {
      if (!durationMinutes || durationMinutes <= 0) {
        setErrorMsg('Please select a positive duration.');
        return;
      }
      payload.duration_minutes = parseFloat(durationMinutes);
    } else {
      if (!startTime || !endTime) {
        setErrorMsg('Please provide both start and end timestamps.');
        return;
      }
      const s = new Date(startTime);
      const end = new Date(endTime);
      if (end <= s) {
        setErrorMsg('Sanity Check Failed: Stoppage end time must be after start time.');
        return;
      }
      payload.start_time = s.toISOString();
      payload.end_time = end.toISOString();
      payload.duration_minutes = Math.round(((end - s) / (60 * 1000)) * 10) / 10;
    }

    try {
      setSubmitting(true);
      await onLogSubmit(payload);
      setSuccessToast(true);
      setComment('');
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record downtime stoppage.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedReason = reasonCodes.find(r => r.id === parseInt(reasonCodeId));

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      {/* 1. Global Floating Close Button at top-right corner of screen */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-50 flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-white text-slate-700 hover:text-rose-600 shadow-xl border border-slate-200 text-xs font-black transition-all hover:scale-105 cursor-pointer active:scale-95"
      >
        <X className="w-4 h-4 text-rose-500" />
        <span>Close (ESC)</span>
      </button>

      {/* 2. Modal Dialog Card with strict max-height and internal scrolling */}
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') handleSubmit();
        }}
      >
        
        {/* STICKY HEADER - NEVER SCROLLS OUT OF SIGHT */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Fast Downtime Entry</h3>
              <p className="text-xs text-slate-500 font-medium">Log industrial stoppage in under 20 seconds</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close this dialog (or press ESC)"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
          >
            <X className="w-4 h-4 text-rose-500" />
            <span>Close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 shrink-0 animate-bounce">
            <Check className="w-4 h-4 shrink-0" />
            <span>Stoppage logged live! Showing in Stoppage Log...</span>
          </div>
        )}

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 flex-1 space-y-4">
          
          {/* Machine Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Target Machine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {machines.map((m) => {
                const isSelected = parseInt(machineId) === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMachineId(m.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.code}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate mt-1">{m.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{m.line}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason Code (Controlled List) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason Code (Controlled List)
              </label>
              {selectedReason && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Category: <span className="font-bold text-slate-700">{selectedReason.category}</span>
                </span>
              )}
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                { id: 'ALL', label: 'All Causes' },
                { id: 'Thermal', label: '🔥 Overheat' },
                { id: 'Sensors', label: '📡 Sensors' },
                { id: 'Mechanical', label: '⚙️ Mechanical' },
                { id: 'Electrical', label: '⚡ Electrical' },
                { id: 'Tooling', label: '🔧 Tooling' },
                { id: 'Material', label: '📦 Material' },
                { id: 'Operational', label: '⏱️ Ops' },
              ].map((cat) => {
                const isAct = reasonCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setReasonCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isAct
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <select
              value={reasonCodeId}
              onChange={(e) => setReasonCodeId(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-2xl p-2.5 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              {['Thermal', 'Sensors', 'Mechanical', 'Electrical', 'Tooling', 'Material', 'Operational'].map((catName) => {
                const groupReasons = reasonCodes.filter(r => 
                  (reasonCategoryFilter === 'ALL' || r.category === reasonCategoryFilter) &&
                  r.category === catName
                );
                if (groupReasons.length === 0) return null;
                return (
                  <optgroup key={catName} label={`── ${catName.toUpperCase()} CAUSES ──`}>
                    {groupReasons.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.code}] {r.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            {/* Selected Reason Cause Context Card */}
            {selectedReason && (
              <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2 text-xs">
                <span 
                  className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 shadow-2xs" 
                  style={{ backgroundColor: selectedReason.color || '#3B82F6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide">
                      [{selectedReason.code}] {selectedReason.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100/70 text-blue-700">
                      {selectedReason.category}
                    </span>
                  </div>
                  {selectedReason.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      <span className="font-semibold text-slate-600">Why it happens:</span> {selectedReason.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Duration Mode Switcher */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Stoppage Duration
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDurationMode('quick')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    durationMode === 'quick' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Quick Chips
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    durationMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Start / End Time
                </button>
              </div>
            </div>

            {durationMode === 'quick' ? (
              <div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {quickDurations.map((mins) => {
                    const active = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-600/20'
                            : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                  <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1 text-xs">
                    <input
                      type="number"
                      min="1"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-10 bg-transparent text-slate-800 font-bold focus:outline-none"
                    />
                    <span className="text-slate-400 font-semibold text-[11px]">min</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</span>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">End Time</span>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Comment Templates + Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Why Did It Stop? (Quick Observation Chips)
              </label>
              {autoMatchedNotice && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-in fade-in">
                  ✓ {autoMatchedNotice}
                </span>
              )}
            </div>

            {/* Category Filter Pills for Observation Chips */}
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                { id: 'ALL', label: 'All Observations' },
                { id: 'Thermal', label: '🔥 Overheat' },
                { id: 'Sensors', label: '📡 Sensors' },
                { id: 'Mechanical', label: '⚙️ Mechanical' },
                { id: 'Electrical', label: '⚡ Electrical' },
                { id: 'Tooling', label: '🔧 Tooling' },
                { id: 'Material', label: '📦 Material' },
                { id: 'Operational', label: '⏱️ Ops' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setObservationFilter(c.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    observationFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200/70 rounded-2xl bg-slate-50/50">
              {quickFailureReasons
                .filter(item => observationFilter === 'ALL' || item.category === observationFilter)
                .map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectObservation(item)}
                    title={`Tap to auto-select reason [${item.reasonCode}] and fill observation`}
                    className="text-[11px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1.5 rounded-xl transition-all border border-slate-200/90 shadow-2xs flex items-center space-x-1.5 cursor-pointer group active:scale-95"
                  >
                    <span>{item.icon}</span>
                    <span className="group-hover:font-bold">{item.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-700 rounded-md ml-1 font-bold">
                      {item.reasonCode}
                    </span>
                  </button>
                ))}
            </div>

            <textarea
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Or write custom observation: e.g. Drive motor casing reached 95°C. Cleaned air filter and checked thermal overload switch."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-2xl p-2.5 sm:p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Operator & Shift */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Operator
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

        </form>

        {/* STICKY FOOTER - NEVER SCROLLS OUT OF VIEW */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all text-center cursor-pointer shadow-xs active:scale-95"
            >
              Cancel / Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{submitting ? 'Recording Stoppage...' : 'Submit Downtime Log (<20s)'}</span>
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">
            Press <kbd className="px-1 py-0.5 bg-slate-200/80 rounded text-slate-600 font-mono text-[9px]">ESC</kbd> or click outside to dismiss
          </p>
        </div>

      </div>
    </div>
  );
}
