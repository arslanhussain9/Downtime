import React, { useState } from 'react';
import { Search, Filter, Trash2, Calendar, Clock, User, Download } from 'lucide-react';

export default function EventLogTable({ 
  events = [], 
  machines = [], 
  reasons = [], 
  onDeleteEvent,
  onExportCSV 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterShift, setFilterShift] = useState('');

  // Filtering
  const filteredEvents = events.filter((e) => {
    if (filterMachine && e.machine_id !== parseInt(filterMachine)) return false;
    if (filterReason && e.reason_code_id !== parseInt(filterReason)) return false;
    if (filterShift && filterShift !== 'All' && e.shift !== filterShift) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchComment = e.comment && e.comment.toLowerCase().includes(q);
      const matchOp = e.operator_name && e.operator_name.toLowerCase().includes(q);
      const matchM = e.machine_name && e.machine_name.toLowerCase().includes(q);
      const matchR = e.reason_name && e.reason_name.toLowerCase().includes(q);
      if (!matchComment && !matchOp && !matchM && !matchR) return false;
    }
    return true;
  });

  // Ensure strict descending sort by start_time
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 card-soft-shadow mb-7">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Detailed Stoppage Audit Log
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {sortedEvents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time stoppage journal with chronological breakdown and operator notes
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search comments, ops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* Machine Filter */}
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>

          {/* Reason Code Filter */}
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Reasons</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.code}] {r.name}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Night">Night</option>
          </select>

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            title="Export CSV"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <th className="py-3 px-3 rounded-l-xl">Machine</th>
              <th className="py-3 px-3">Reason Code</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Observation / Comment</th>
              <th className="py-3 px-3">Operator</th>
              <th className="py-3 px-3 rounded-r-xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {sortedEvents.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  No stoppage events match your filters.
                </td>
              </tr>
            ) : (
              sortedEvents.slice(0, 100).map((ev, idx) => {
                const sDate = ev.start_time ? new Date(ev.start_time) : null;
                const isVeryRecent = sDate && (sDate.getTime() > tenMinutesAgo || idx === 0);

                return (
                  <tr 
                    key={ev.id} 
                    className={`transition-colors ${
                      isVeryRecent ? 'bg-blue-50/40 hover:bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Machine */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {isVeryRecent && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider shadow-2xs">
                            NEW
                          </span>
                        )}
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {ev.machine_code || `M${ev.machine_id}`}
                        </span>
                        <span className="font-bold text-slate-900">{ev.machine_name}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: ev.reason_color || '#3B82F6' }}
                      >
                        {ev.reason_name}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {ev.duration_minutes}m
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({Math.round((ev.duration_minutes / 60) * 10) / 10}h)
                      </span>
                    </td>

                    {/* Start/End */}
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {sDate ? sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>

                    {/* Comment */}
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={ev.comment}>
                      {ev.comment || <span className="text-slate-300 italic">No notes</span>}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[11px] text-slate-600 font-semibold">
                        {ev.operator_name || 'Operator'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ev.shift || 'Day'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this downtime event? This will trigger live analytics recalculation.')) {
                            onDeleteEvent(ev.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
