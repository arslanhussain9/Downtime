import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Check, Sparkles, ChevronRight, Zap } from 'lucide-react';

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

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickDurations = [10, 15, 30, 45, 60, 90, 120];

  const quickComments = [
    "Motor thermal trip sensor cut off",
    "Conveyor transfer jam cleared",
    "Sensor reflector cleaned & aligned",
    "Hydraulic pressure restored to 120 bar",
    "Worn carbide tool insert replaced",
    "Shift handover checklist briefing"
  ];

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
      }, 300);
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') handleSubmit();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fast Downtime Entry</h3>
              <p className="text-xs text-slate-500 font-medium">Log industrial stoppage in under 20 seconds</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close (Press ESC)"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close (ESC)</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successToast && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-bounce">
            <Check className="w-4 h-4 shrink-0" />
            <span>Stoppage logged live! MTBF & Pareto recalculating...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
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
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
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
            <select
              value={reasonCodeId}
              onChange={(e) => setReasonCodeId(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-sm font-semibold rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              {reasonCodes.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.code}] {r.name} — ({r.category})
                </option>
              ))}
            </select>
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
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    durationMode === 'quick' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Quick Chips
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    durationMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Start / End Time
                </button>
              </div>
            </div>

            {durationMode === 'quick' ? (
              <div>
                <div className="flex flex-wrap gap-2">
                  {quickDurations.map((mins) => {
                    const active = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-600/20'
                            : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                  <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1 text-xs">
                    <input
                      type="number"
                      min="1"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-12 bg-transparent text-slate-800 font-bold focus:outline-none"
                    />
                    <span className="text-slate-400 font-semibold">min</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</span>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">End Time</span>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Comment Templates + Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Short Comment & Observation
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickComments.map((qc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setComment(qc)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors truncate max-w-[240px]"
                >
                  + {qc}
                </button>
              ))}
            </div>
            <textarea
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="E.g. Thermal overload sensor tripped at high RPM. Restored coolant."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Operator & Shift */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Operator
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
              >
                Cancel / Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>{submitting ? 'Recording Stoppage...' : 'Submit Downtime Log (<20s)'}</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">Ctrl + Enter</kbd> to quick submit or <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">ESC</kbd> to close
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}
