import React, { useState } from 'react';
import { Settings, Plus, Tag, Cpu, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminManager({ 
  machines = [], 
  reasons = [], 
  onCreateReason, 
  onCreateMachine 
}) {
  const [activeTab, setActiveTab] = useState('reasons'); // 'reasons' or 'machines'

  // Reason code form state
  const [newRCode, setNewRCode] = useState('');
  const [newRName, setNewRName] = useState('');
  const [newRCategory, setNewRCategory] = useState('Mechanical');
  const [newRDesc, setNewRDesc] = useState('');
  const [newRColor, setNewRColor] = useState('#3B82F6');
  const [reasonMsg, setReasonMsg] = useState('');

  // Machine form state
  const [newMCode, setNewMCode] = useState('');
  const [newMName, setNewMName] = useState('');
  const [newMLine, setNewMLine] = useState('Line A');
  const [newMLocation, setNewMLocation] = useState('Bay 1');
  const [newMHours, setNewMHours] = useState(24);
  const [machineMsg, setMachineMsg] = useState('');

  const handleAddReason = async (e) => {
    e.preventDefault();
    if (!newRCode || !newRName) {
      setReasonMsg('Please enter both reason code and title.');
      return;
    }
    try {
      await onCreateReason({
        code: newRCode.toUpperCase().trim(),
        name: newRName.trim(),
        category: newRCategory,
        description: newRDesc.trim(),
        color: newRColor,
        is_active: true
      });
      setNewRCode('');
      setNewRName('');
      setNewRDesc('');
      setReasonMsg('Reason code registered to controlled list!');
      setTimeout(() => setReasonMsg(''), 3000);
    } catch (err) {
      setReasonMsg(err.message || 'Failed to add reason code');
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!newMCode || !newMName) {
      setMachineMsg('Please enter both machine code and name.');
      return;
    }
    try {
      await onCreateMachine({
        code: newMCode.toUpperCase().trim(),
        name: newMName.trim(),
        line: newMLine.trim(),
        location: newMLocation.trim(),
        planned_hours_per_day: parseFloat(newMHours) || 24.0,
        status: 'OPERATIONAL'
      });
      setNewMCode('');
      setNewMName('');
      setMachineMsg('Machine added to plant matrix!');
      setTimeout(() => setMachineMsg(''), 3000);
    } catch (err) {
      setMachineMsg(err.message || 'Failed to add machine');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 card-soft-shadow mb-7">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Master Data & Configuration
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage controlled reason codes and plant machinery specifications
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('reasons')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reasons' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Controlled Reason Codes ({reasons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'machines' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Machines ({machines.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Controlled Reason Codes */}
      {activeTab === 'reasons' && (
        <div className="space-y-6">
          {/* Add Reason Form */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Define New Controlled Reason Code</span>
            </h4>
            
            {reasonMsg && (
              <div className="mb-3 text-xs font-bold text-indigo-700 bg-indigo-50 p-2 rounded-xl border border-indigo-100 flex items-center space-x-2">
                <Check className="w-3.5 h-3.5" />
                <span>{reasonMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddReason} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. BLT-SLP"
                  value={newRCode}
                  onChange={(e) => setNewRCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl p-2.5 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cause Name</label>
                <input
                  type="text"
                  placeholder="e.g. Drive Belt Slippage"
                  value={newRName}
                  onChange={(e) => setNewRName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={newRCategory}
                  onChange={(e) => setNewRCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Operational">Operational</option>
                  <option value="Material">Material</option>
                  <option value="Tooling">Tooling</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Code</span>
                </button>
              </div>
            </form>
          </div>

          {/* Reason Codes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Cause Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reasons.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {r.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{r.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {r.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Machines */}
      {activeTab === 'machines' && (
        <div className="space-y-6">
          {/* Add Machine Form */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enroll New Production Machine</span>
            </h4>

            {machineMsg && (
              <div className="mb-3 text-xs font-bold text-indigo-700 bg-indigo-50 p-2 rounded-xl border border-indigo-100 flex items-center space-x-2">
                <Check className="w-3.5 h-3.5" />
                <span>{machineMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddMachine} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Machine Code</label>
                <input
                  type="text"
                  placeholder="e.g. LAT-07"
                  value={newMCode}
                  onChange={(e) => setNewMCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl p-2.5 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Machine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Precision CNC Lathe 07"
                  value={newMName}
                  onChange={(e) => setNewMName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Production Line</label>
                <input
                  type="text"
                  placeholder="e.g. Line A"
                  value={newMLine}
                  onChange={(e) => setNewMLine(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Machine</span>
                </button>
              </div>
            </form>
          </div>

          {/* Machines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Machine Name</th>
                  <th className="py-2.5 px-3">Line & Location</th>
                  <th className="py-2.5 px-3">Operating Window</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {m.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.line} ({m.location})</td>
                    <td className="py-2.5 px-3 text-slate-700 font-semibold">{m.planned_hours_per_day || 24}h / day</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                        {m.status || 'OPERATIONAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
