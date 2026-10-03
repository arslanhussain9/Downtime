/**
 * API Service for Downtime Log & Root-Cause Analyzer.
 * Supports both live FastAPI backend communication and
 * seamless instant fallback for standalone Vercel deployments.
 */

const API_BASE = '/api';

// Initial Seed Data for standalone/fallback mode
export const INITIAL_MACHINES = [
  { id: 1, code: "CNC-01", name: "CNC Milling Center 01", line: "Line A - Heavy Machining", location: "Bay 1", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
  { id: 2, code: "INJ-02", name: "Injection Molding Press B", line: "Line B - Plastics Mold", location: "Bay 2", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
  { id: 3, code: "CNV-03", name: "High-Speed Sorting Conveyor", line: "Line C - Logistics & Sort", location: "Bay 3", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
  { id: 4, code: "HYD-04", name: "Hydraulic Stamping Press 04", line: "Line A - Metal Press", location: "Bay 1", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
  { id: 5, code: "ROB-05", name: "Robotic Welder Cell Alpha", line: "Line D - Automated Assembly", location: "Bay 4", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
  { id: 6, code: "PKG-06", name: "Automated Case Packer 06", line: "Line C - End of Line", location: "Bay 3", status: "OPERATIONAL", planned_hours_per_day: 24.0 },
];

export const INITIAL_REASON_CODES = [
  { id: 1, code: "MTR-OVH", name: "Motor Overheating", category: "Mechanical", description: "Drive motor thermal cutoff exceeded threshold", is_active: true, color: "#EF4444" },
  { id: 2, code: "CNV-JAM", name: "Conveyor Belt Jam", category: "Mechanical", description: "Physical blockage or belt misalignment stopping flow", is_active: true, color: "#F59E0B" },
  { id: 3, code: "SNR-FLT", name: "Optical Sensor Misalignment", category: "Electrical", description: "Presence detection sensor blinded or shifted", is_active: true, color: "#3B82F6" },
  { id: 4, code: "HYD-LKG", name: "Hydraulic Line Pressure Drop", category: "Mechanical", description: "Hydraulic oil seal leakage or solenoid valve trip", is_active: true, color: "#8B5CF6" },
  { id: 5, code: "TLS-WRN", name: "Tool Bit Wear & Breakage", category: "Tooling", description: "Carbide insert chipped or exceeding maximum cycles", is_active: true, color: "#EC4899" },
  { id: 6, code: "ELE-TRP", name: "Electrical Breaker Trip", category: "Electrical", description: "Overcurrent trip on secondary distribution panel", is_active: true, color: "#6366F1" },
  { id: 7, code: "OPR-ABS", name: "Operator Handover Delay", category: "Operational", description: "Crew transition or safety briefing delay", is_active: true, color: "#10B981" },
  { id: 8, code: "MAT-DEF", name: "Raw Material Dimension Defect", category: "Material", description: "Infeed stock tolerance out of specification", is_active: true, color: "#14B8A6" },
];

// Generate 60 realistic seeded events with dominant cause and seeded repeat pattern
function generateSeededEvents() {
  const events = [];
  const now = new Date();
  
  // Seeded Repeat Pattern: CNC-01 (id: 1) + MTR-OVH (id: 1) occurring 3 times in last 7 days!
  // Incident 1: 5 days ago (115 mins)
  const d1End = new Date(now.getTime() - (5 * 24 + 4) * 60 * 60 * 1000);
  const d1Start = new Date(d1End.getTime() - 115 * 60 * 1000);
  events.push({
    id: 1,
    machine_id: 1,
    reason_code_id: 1,
    start_time: d1Start.toISOString(),
    end_time: d1End.toISOString(),
    duration_minutes: 115,
    comment: "Spindle motor thermal overload. Rotor temperature reached 98°C. Seeded incident 1/3.",
    operator_name: "Vikram Patel",
    shift: "Afternoon",
    created_at: d1End.toISOString()
  });

  // Incident 2: 3 days ago (130 mins)
  const d2End = new Date(now.getTime() - (3 * 24 + 7) * 60 * 60 * 1000);
  const d2Start = new Date(d2End.getTime() - 130 * 60 * 1000);
  events.push({
    id: 2,
    machine_id: 1,
    reason_code_id: 1,
    start_time: d2Start.toISOString(),
    end_time: d2End.toISOString(),
    duration_minutes: 130,
    comment: "Secondary thermal trip on spindle drive. High bearing friction suspected. Seeded incident 2/3.",
    operator_name: "Arslan Qureshi",
    shift: "Morning",
    created_at: d2End.toISOString()
  });

  // Incident 3: 1 day ago (145 mins)
  const d3End = new Date(now.getTime() - (1 * 24 + 3) * 60 * 60 * 1000);
  const d3Start = new Date(d3End.getTime() - 145 * 60 * 1000);
  events.push({
    id: 3,
    machine_id: 1,
    reason_code_id: 1,
    start_time: d3Start.toISOString(),
    end_time: d3End.toISOString(),
    duration_minutes: 145,
    comment: "Repeated thermal alarm trip. Coolant flow restricted. Seeded incident 3/3 (Triggering Repeat Alert).",
    operator_name: "Marcus Chen",
    shift: "Night",
    created_at: d3End.toISOString()
  });

  // Generate 57 remaining events spread over 30 days
  const comments = {
    1: ["Thermal trip sensor triggered after sustained high feed load.", "Motor casing hot; waiting for thermal relay reset.", "Heat sink cooling fan clogged."],
    2: ["Box caught between guide rails, belt slipped.", "Pallet debris jammed roller drum.", "Conveyor belt tensioner slipped."],
    3: ["Dust on reflector caused false part-present signal.", "Sensor bracket bumped out of true by forklift."],
    4: ["O-ring on manifold valve 3 leaking oil.", "Hydraulic pressure dropped below 80 bar."],
    5: ["Carbide end mill worn beyond tolerance limit.", "Tool insert chipped during hardened pass."],
    6: ["Main breaker tripped on spindle high surge.", "Ground fault warning on chiller pump."],
    7: ["Shift handover briefing ran over schedule.", "Safety compliance review delay."],
    8: ["Raw stock thickness 3.4mm exceeded spec 2.8mm.", "Burr on raw material stalled infeed guide."]
  };

  const operators = ["Arslan Qureshi", "Vikram Patel", "Elena Rostova", "Marcus Chen", "David Miller"];
  const shifts = ["Morning", "Afternoon", "Night"];

  // Reason weights: MTR-OVH (1): 30%, CNV-JAM (2): 25%, others distributed
  const reasonPool = [
    1, 1, 1, 1, 1, 1, // MTR-OVH
    2, 2, 2, 2, 2,    // CNV-JAM
    3, 3, 3,          // SNR-FLT
    4, 4,             // HYD-LKG
    5, 5,             // TLS-WRN
    6,                // ELE-TRP
    7,                // OPR-ABS
    8                 // MAT-DEF
  ];

  for (let i = 4; i <= 60; i++) {
    const daysAgo = 0.2 + Math.random() * 29.3;
    const rId = reasonPool[Math.floor(Math.random() * reasonPool.length)];
    let mId = 1;
    if (rId === 2) mId = 3; // CNV-03
    else if (rId === 1) mId = [1, 2, 4][Math.floor(Math.random() * 3)];
    else if (rId === 4) mId = [2, 4][Math.floor(Math.random() * 2)];
    else if (rId === 5) mId = 1;
    else if (rId === 6) mId = [1, 5, 6][Math.floor(Math.random() * 3)];
    else mId = 1 + Math.floor(Math.random() * 6);

    let duration = 20;
    if (rId === 1) duration = Math.round(80 + Math.random() * 80);
    else if (rId === 2) duration = Math.round(35 + Math.random() * 45);
    else if (rId === 4) duration = Math.round(25 + Math.random() * 40);
    else duration = Math.round(10 + Math.random() * 25);

    const end = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - duration * 60 * 1000);

    const commList = comments[rId] || ["Standard maintenance intervention"];
    const comment = commList[Math.floor(Math.random() * commList.length)];

    events.push({
      id: i,
      machine_id: mId,
      reason_code_id: rId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: duration,
      comment,
      operator_name: operators[Math.floor(Math.random() * operators.length)],
      shift: shifts[Math.floor(Math.random() * shifts.length)],
      created_at: end.toISOString()
    });
  }

  return events;
}

// Local storage storage keys
const STORAGE_KEYS = {
  MACHINES: "downtime_machines_v1",
  REASONS: "downtime_reasons_v1",
  EVENTS: "downtime_events_v1",
  ALERTS: "downtime_alerts_v1"
};

function getLocalData(key, fallbackFn) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("localStorage read failed:", e);
  }
  const init = fallbackFn();
  try {
    localStorage.setItem(key, JSON.stringify(init));
  } catch (e) {}
  return init;
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// Client-side analytics implementations (identical to Python pandas math)
export function computeClientPareto(events, reasons, days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = days > 0 ? events.filter(e => new Date(e.start_time) >= cutoff) : events;

  const reasonMap = {};
  reasons.forEach(r => {
    reasonMap[r.id] = { ...r, total_minutes: 0, count: 0 };
  });

  filtered.forEach(e => {
    if (reasonMap[e.reason_code_id]) {
      reasonMap[e.reason_code_id].total_minutes += Number(e.duration_minutes) || 0;
      reasonMap[e.reason_code_id].count += 1;
    }
  });

  const totalMinutes = filtered.reduce((acc, e) => acc + (Number(e.duration_minutes) || 0), 0);
  const totalFailures = filtered.length;

  const sorted = Object.values(reasonMap)
    .filter(r => r.count > 0 || r.total_minutes > 0)
    .sort((a, b) => b.total_minutes - a.total_minutes);

  let cumulative = 0;
  let prevCum = 0;
  const vitalFewCauses = [];

  const items = sorted.map(r => {
    cumulative += r.total_minutes;
    const pct = totalMinutes > 0 ? (r.total_minutes / totalMinutes) * 100 : 0;
    const cumPct = totalMinutes > 0 ? (cumulative / totalMinutes) * 100 : 0;
    const isVital = prevCum < 80.0;
    prevCum = cumPct;

    if (isVital) {
      vitalFewCauses.push(r.name);
    }

    return {
      reason_code_id: r.id,
      reason_code: r.code,
      reason_name: r.name,
      category: r.category,
      color: r.color,
      total_minutes: Math.round(r.total_minutes * 10) / 10,
      total_hours: Math.round((r.total_minutes / 60) * 100) / 100,
      count: r.count,
      avg_minutes: r.count > 0 ? Math.round((r.total_minutes / r.count) * 10) / 10 : 0,
      percentage: Math.round(pct * 10) / 10,
      cumulative_percentage: Math.round(cumPct * 10) / 10,
      is_vital_few: isVital
    };
  });

  return {
    items,
    total_downtime_minutes: Math.round(totalMinutes * 10) / 10,
    total_failures: totalFailures,
    vital_few_causes: vitalFewCauses
  };
}

export function computeClientMTBF(events, machines, days = 30) {
  let plantTotalFailures = 0;
  let plantTotalDowntimeMins = 0;
  let plantTotalOperatingHrs = 0;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filteredEvents = days > 0 ? events.filter(e => new Date(e.start_time) >= cutoff) : events;

  const machineList = machines.map(m => {
    const plannedHrs = days * (m.planned_hours_per_day || 24.0);
    const mEvents = filteredEvents.filter(e => e.machine_id === m.id);
    const failures = mEvents.length;
    const downtimeMins = mEvents.reduce((acc, e) => acc + (Number(e.duration_minutes) || 0), 0);
    const downtimeHrs = downtimeMins / 60.0;
    const operatingHrs = Math.max(0, plannedHrs - downtimeHrs);

    let mtbfHrs = operatingHrs;
    let mttrMins = 0;
    let availability = 100;

    if (failures > 0) {
      mtbfHrs = Math.round((operatingHrs / failures) * 100) / 100;
      mttrMins = Math.round((downtimeMins / failures) * 10) / 10;
      availability = plannedHrs > 0 ? Math.round((operatingHrs / plannedHrs) * 1000) / 10 : 0;
    }

    plantTotalFailures += failures;
    plantTotalDowntimeMins += downtimeMins;
    plantTotalOperatingHrs += operatingHrs;

    let healthBadge = "Excellent";
    if (availability < 85) healthBadge = "Critical Attention";
    else if (availability < 95) healthBadge = "Moderate";

    return {
      machine_id: m.id,
      machine_code: m.code,
      machine_name: m.name,
      line: m.line,
      location: m.location,
      current_status: m.status,
      planned_hours: plannedHrs,
      failure_count: failures,
      total_downtime_minutes: Math.round(downtimeMins * 10) / 10,
      total_downtime_hours: Math.round(downtimeHrs * 100) / 100,
      operating_hours: Math.round(operatingHrs * 100) / 100,
      mtbf_hours: mtbfHrs,
      mttr_minutes: mttrMins,
      availability_pct: availability,
      health_badge: healthBadge
    };
  });

  const totalPlannedPlantHrs = machines.reduce((acc, m) => acc + days * (m.planned_hours_per_day || 24.0), 0);
  const plantMTBF = plantTotalFailures > 0 ? Math.round((plantTotalOperatingHrs / plantTotalFailures) * 100) / 100 : plantTotalOperatingHrs;
  const plantMTTR = plantTotalFailures > 0 ? Math.round((plantTotalDowntimeMins / plantTotalFailures) * 10) / 10 : 0;
  const plantAvail = totalPlannedPlantHrs > 0 ? Math.round((plantTotalOperatingHrs / totalPlannedPlantHrs) * 1000) / 10 : 100;

  return {
    plant_metrics: {
      total_failures: plantTotalFailures,
      total_downtime_minutes: Math.round(plantTotalDowntimeMins * 10) / 10,
      total_downtime_hours: Math.round((plantTotalDowntimeMins / 60) * 100) / 100,
      plant_operating_hours: Math.round(plantTotalOperatingHrs * 100) / 100,
      plant_mtbf_hours: plantMTBF,
      plant_mttr_minutes: plantMTTR,
      plant_availability_pct: plantAvail,
      machine_count: machines.length
    },
    machines: machineList
  };
}

export function computeClientWeeklyTrends(events, machines, weeks = 5) {
  const machineNames = machines.map(m => m.name);
  const now = new Date();
  const weeklyData = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const bucketEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const bucketStart = new Date(bucketEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const startStr = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = bucketEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let label = `${startStr} - ${endStr}`;
    if (i === 0) label += " (Current)";

    const row = {
      week_label: label,
      week_index: weeks - i,
      total_plant_minutes: 0
    };
    machineNames.forEach(n => {
      row[n] = 0;
    });

    events.forEach(e => {
      const eTime = new Date(e.start_time);
      if (eTime >= bucketStart && eTime < bucketEnd) {
        const m = machines.find(m => m.id === e.machine_id);
        const mName = m ? m.name : "Other";
        const mins = Number(e.duration_minutes) || 0;
        if (row[mName] !== undefined) {
          row[mName] = Math.round((row[mName] + mins) * 10) / 10;
        }
        row.total_plant_minutes = Math.round((row.total_plant_minutes + mins) * 10) / 10;
      }
    });

    weeklyData.push(row);
  }

  return {
    machine_names: machineNames,
    weekly_data: weeklyData
  };
}

export function evaluateRepeatAlerts(events, machines, reasons) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent = events.filter(e => new Date(e.start_time) >= sevenDaysAgo);
  const groups = {};

  recent.forEach(e => {
    const key = `${e.machine_id}_${e.reason_code_id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const alerts = [];
  let alertIdCounter = 1;

  Object.entries(groups).forEach(([key, evList]) => {
    if (evList.length >= 3) {
      const [mIdStr, rIdStr] = key.split('_');
      const mId = parseInt(mIdStr);
      const rId = parseInt(rIdStr);
      const m = machines.find(item => item.id === mId) || { name: `Machine #${mId}`, code: `M${mId}` };
      const r = reasons.find(item => item.id === rId) || { name: "Failure Cause", category: "General", code: "R0" };

      evList.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      const earliest = evList[0].start_time;
      const latest = evList[evList.length - 1].start_time;

      let rec = `High recurrence of '${r.name}' on ${m.name} (${evList.length} times in 7 days). Immediate root cause investigation required.`;
      if (r.name.includes("Overheating")) {
        rec = `Repeated thermal trips on ${m.name}. Inspect coolant flow, fan operation, and motor bearing lubrication.`;
      } else if (r.name.includes("Jam") || r.name.includes("Belt")) {
        rec = `Recurring mechanical jam on ${m.name}. Inspect belt tension, roller alignment, and guide rail clearances.`;
      } else if (r.name.includes("Sensor")) {
        rec = `Sensor alignment failures on ${m.name}. Calibrate optical sensors and check bracket vibration mounting.`;
      }

      alerts.push({
        id: alertIdCounter++,
        machine_id: mId,
        machine_name: m.name,
        machine_code: m.code,
        reason_code_id: rId,
        reason_code: r.code,
        reason_name: r.name,
        reason_category: r.category,
        incident_count: evList.length,
        window_start: earliest,
        window_end: latest,
        status: "ACTIVE",
        severity: evList.length >= 4 ? "CRITICAL" : "HIGH",
        recommended_action: rec,
        updated_at: new Date().toISOString()
      });
    }
  });

  return alerts;
}

// Main API Export Object
export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { status: "ok", mode: "standalone-client" };
  },

  async getMachines() {
    try {
      const res = await fetch(`${API_BASE}/machines`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
  },

  async createMachine(payload) {
    try {
      const res = await fetch(`${API_BASE}/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const newM = {
      id: Date.now(),
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      line: payload.line || "Main Production Line",
      location: payload.location || "Floor 1",
      status: payload.status || "OPERATIONAL",
      planned_hours_per_day: payload.planned_hours_per_day || 24.0,
      created_at: new Date().toISOString()
    };
    machines.push(newM);
    setLocalData(STORAGE_KEYS.MACHINES, machines);
    return newM;
  },

  async getReasonCodes() {
    try {
      const res = await fetch(`${API_BASE}/reasons`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);
  },

  async createReasonCode(payload) {
    try {
      const res = await fetch(`${API_BASE}/reasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);
    const newR = {
      id: Date.now(),
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      category: payload.category || "Mechanical",
      description: payload.description || "",
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      color: payload.color || "#3B82F6",
      created_at: new Date().toISOString()
    };
    reasons.push(newR);
    setLocalData(STORAGE_KEYS.REASONS, reasons);
    return newR;
  },

  async getEvents({ machine_id, reason_code_id, shift, search, days, limit = 100, offset = 0 } = {}) {
    try {
      const params = new URLSearchParams();
      if (machine_id) params.append('machine_id', machine_id);
      if (reason_code_id) params.append('reason_code_id', reason_code_id);
      if (shift && shift !== 'All') params.append('shift', shift);
      if (search) params.append('search', search);
      if (days && days > 0) params.append('days', days);
      params.append('limit', limit);
      params.append('offset', offset);

      const res = await fetch(`${API_BASE}/events?${params}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);

    let filtered = [...events];
    if (days && days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => new Date(e.start_time) >= cutoff);
    }
    if (machine_id) filtered = filtered.filter(e => e.machine_id === parseInt(machine_id));
    if (reason_code_id) filtered = filtered.filter(e => e.reason_code_id === parseInt(reason_code_id));
    if (shift && shift !== 'All') filtered = filtered.filter(e => e.shift === shift);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(e => (e.comment && e.comment.toLowerCase().includes(s)) || (e.operator_name && e.operator_name.toLowerCase().includes(s)));
    }

    filtered.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    const paginated = filtered.slice(offset, offset + limit);

    const items = paginated.map(e => {
      const m = machines.find(m => m.id === e.machine_id) || {};
      const r = reasons.find(r => r.id === e.reason_code_id) || {};
      return {
        ...e,
        machine_name: m.name || `Machine #${e.machine_id}`,
        machine_code: m.code || `M${e.machine_id}`,
        reason_code: r.code || 'UNKNOWN',
        reason_name: r.name || 'Unknown Cause',
        reason_category: r.category || 'General',
        reason_color: r.color || '#6B7280'
      };
    });

    return {
      total: filtered.length,
      offset,
      limit,
      items
    };
  },

  async logEvent(payload) {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback client log
    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);

    let startTime = payload.start_time ? new Date(payload.start_time) : null;
    let endTime = payload.end_time ? new Date(payload.end_time) : null;
    let duration = Number(payload.duration_minutes);

    if (startTime && endTime) {
      duration = Math.round(((endTime.getTime() - startTime.getTime()) / (60 * 1000)) * 10) / 10;
    } else if (duration && !endTime) {
      endTime = new Date();
      startTime = new Date(endTime.getTime() - duration * 60 * 1000);
    }

    const newEvent = {
      id: Date.now(),
      machine_id: parseInt(payload.machine_id),
      reason_code_id: parseInt(payload.reason_code_id),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: duration,
      comment: payload.comment || "",
      operator_name: payload.operator_name || "Operator",
      shift: payload.shift || "Day",
      created_at: new Date().toISOString()
    };

    events.unshift(newEvent);
    setLocalData(STORAGE_KEYS.EVENTS, events);

    const alerts = evaluateRepeatAlerts(events, machines, reasons);
    setLocalData(STORAGE_KEYS.ALERTS, alerts);

    return {
      message: "Downtime event logged successfully!",
      event_id: newEvent.id,
      duration_minutes: duration,
      active_alerts_count: alerts.length
    };
  },

  async deleteEvent(eventId) {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (e) {}

    let events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    events = events.filter(e => e.id !== parseInt(eventId));
    setLocalData(STORAGE_KEYS.EVENTS, events);
    return { message: "Event removed" };
  },

  async getOverview(days = 30) {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview?days=${days}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);

    const mtbf = computeClientMTBF(events, machines, days);
    const pareto = computeClientPareto(events, reasons, days);
    const alerts = evaluateRepeatAlerts(events, machines, reasons);

    return {
      plant_metrics: mtbf.plant_metrics,
      vital_few_causes: pareto.vital_few_causes,
      active_alerts_count: alerts.length,
      total_failures: mtbf.plant_metrics.total_failures,
      total_downtime_minutes: mtbf.plant_metrics.total_downtime_minutes,
      observation_days: days
    };
  },

  async getPareto(days = 30) {
    try {
      const res = await fetch(`${API_BASE}/analytics/pareto?days=${days}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);
    return computeClientPareto(events, reasons, days);
  },

  async getMTBF(days = 30) {
    try {
      const res = await fetch(`${API_BASE}/analytics/mtbf-mttr?days=${days}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    return computeClientMTBF(events, machines, days);
  },

  async getWeeklyTrends(weeks = 5) {
    try {
      const res = await fetch(`${API_BASE}/analytics/weekly-trends?weeks=${weeks}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    return computeClientWeeklyTrends(events, machines, weeks);
  },

  async getAlerts() {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);
    return evaluateRepeatAlerts(events, machines, reasons);
  },

  async seedData(reset = true) {
    try {
      const res = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const newEvents = generateSeededEvents();
    setLocalData(STORAGE_KEYS.EVENTS, newEvents);
    setLocalData(STORAGE_KEYS.MACHINES, INITIAL_MACHINES);
    setLocalData(STORAGE_KEYS.REASONS, INITIAL_REASON_CODES);
    const alerts = evaluateRepeatAlerts(newEvents, INITIAL_MACHINES, INITIAL_REASON_CODES);
    setLocalData(STORAGE_KEYS.ALERTS, alerts);
    return { message: "Database re-seeded with 60 realistic events and dominant causes." };
  },

  async injectDemoStoppages() {
    try {
      const res = await fetch(`${API_BASE}/demo/live-stoppages`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    const now = new Date();
    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);

    const demoEvents = [
      {
        id: Date.now() + 1,
        machine_id: 1, // CNC-01
        reason_code_id: 1, // Motor Overheating
        start_time: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
        end_time: now.toISOString(),
        duration_minutes: 95.0,
        comment: "[LIVE DEMO EVENT 1/3] High friction thermal surge logged live during demo.",
        operator_name: "Demo Live Operator",
        shift: "Day",
        created_at: now.toISOString()
      },
      {
        id: Date.now() + 2,
        machine_id: 3, // CNV-03
        reason_code_id: 2, // Conveyor Jam
        start_time: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
        end_time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        duration_minutes: 45.0,
        comment: "[LIVE DEMO EVENT 2/3] Pallet jam on transfer conveyor logged live during demo.",
        operator_name: "Demo Live Operator",
        shift: "Day",
        created_at: now.toISOString()
      },
      {
        id: Date.now() + 3,
        machine_id: 2, // INJ-02
        reason_code_id: 3, // Sensor Misalignment
        start_time: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        end_time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        duration_minutes: 20.0,
        comment: "[LIVE DEMO EVENT 3/3] Photocell misalignment logged live during demo.",
        operator_name: "Demo Live Operator",
        shift: "Day",
        created_at: now.toISOString()
      }
    ];

    demoEvents.forEach(e => events.unshift(e));
    setLocalData(STORAGE_KEYS.EVENTS, events);

    const alerts = evaluateRepeatAlerts(events, machines, reasons);
    setLocalData(STORAGE_KEYS.ALERTS, alerts);

    return {
      message: "3 Live Stoppages injected successfully! Watch MTBF, MTTR, Pareto, and Weekly Trends update live!",
      injected_count: 3,
      total_new_minutes: 160.0,
      active_alerts_count: alerts.length
    };
  },

  async exportCSV() {
    try {
      const res = await fetch(`${API_BASE}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `downtime_log_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        return;
      }
    } catch (e) {}

    // Fallback client CSV export
    const events = getLocalData(STORAGE_KEYS.EVENTS, generateSeededEvents);
    const machines = getLocalData(STORAGE_KEYS.MACHINES, () => INITIAL_MACHINES);
    const reasons = getLocalData(STORAGE_KEYS.REASONS, () => INITIAL_REASON_CODES);

    const headers = ["Event ID,Machine Code,Machine Name,Reason Code,Reason Name,Category,Start Time,End Time,Duration Minutes,Operator,Shift,Comment"];
    const rows = events.map(e => {
      const m = machines.find(m => m.id === e.machine_id) || {};
      const r = reasons.find(r => r.id === e.reason_code_id) || {};
      return [
        e.id,
        m.code || "",
        `"${m.name || ""}"`,
        r.code || "",
        `"${r.name || ""}"`,
        r.category || "",
        e.start_time,
        e.end_time,
        e.duration_minutes,
        `"${e.operator_name || ""}"`,
        e.shift || "",
        `"${(e.comment || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `downtime_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
