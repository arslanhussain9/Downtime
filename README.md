# 🏭 ParetoFlow — Downtime Log & Root-Cause Analyzer (PS 25)

> **Ready Full-Stack Industrial Analytics Platform**  
> Built for the Hackathon Coding Sprint to eliminate anecdotal stoppage tracking by automatically aggregating downtime by cause, computing live MTBF/MTTR, producing dual-axis Pareto 80/20 root cause curves, and flagging repeat failures.

---

## 🚀 Live Demo Day Features (All PS 25 Requirements Satisfied)

| Feature | Requirement | Implementation |
| :--- | :--- | :--- |
| **Fast Downtime Entry** | Machine, start/end or duration, controlled reason, short comment; **loggable in < 20s** | Dedicated rapid logger with quick duration chips (5m, 15m, 30m, 45m, 1h, 2h), instant category filtering, comment presets, timestamp sanity validation, and `Ctrl + Enter` shortcuts. |
| **MTBF / MTTR Matrix** | Live computed per machine | $\text{MTBF} = \frac{\text{Total Operating Time}}{\text{Failure Count}}$ and $\text{MTTR} = \text{mean}(\text{end} - \text{start})$. Plant-wide and per-machine breakdown with availability % gauges. |
| **Pareto of Reason Codes** | Causes ranked by total downtime minutes with cumulative-% line naming the **vital few** causes | Dual-axis interactive chart (Bar for downtime minutes + Line for cumulative %). Clearly flags and highlights the **Vital Few** (80/20 rule) in amber & red badges. |
| **Repeat-Failure Alert** | Same machine + reason code $\ge 3$ times in 7 days flagged automatically | Automated rolling 7-day query engine that flags repeat hotspots into an alerts store, determines severity, and generates dynamic Root Cause Analysis (RCA) action plans. |
| **Weekly Trend Lines** | Weekly downtime-minutes trend per machine on the dashboard | Multi-machine weekly downtime trend chart comparing historical breakdown cycles across the shop floor. |
| **Role-Based Modes** | Operator / Employee mode & Plant Manager / Admin mode | Instant switch between **Operator Fast Log Mode** (mobile/tablet friendly, active shift timer badge, rapid 4-click logger) and **Plant Manager / Admin Mode** (deep analytics, Pareto, MTBF matrix, master data CRUD). |
| **Seeded Dataset** | 60 events over 30 days with a deliberately dominant cause | Realistic 60-event dataset where **Motor Overheating** (~55%) and **Conveyor Belt Jam** (~22%) dominate, creating a picture-perfect 80/20 Pareto curve and a seeded repeat pattern on CNC-01. |
| **1-Click Demo Injector** | 3 stoppages logged live $\rightarrow$ live update | 1-click **"Demo: 3 Live Events"** button injects 3 live stoppages on stage to demonstrate real-time reactivity of cards, Pareto curve, alerts, and trend lines. |

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python 3.14 + FastAPI + SQLAlchemy 2.0 ORM + Pandas analytical processing + SQLite DB (`downtime.db`).
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 + Lucide React + Recharts interactive data visualization.
- **Design System**: Inspired by modern sleek mobile/SaaS design (Plus Jakarta Sans typography, soft slate/sky pastel backgrounds, rounded-3xl surfaces, vibrant blue/emerald/amber status pills).
- **Deployment**: **100% Vercel-ready** with zero-config build (`dist/`), resilient dual-layer architecture (talks to FastAPI backend when available, runs client analytical engine if deployed statically on Vercel).

---

## ⚡ Quick Start (Local Run)

### 1. Launch Unified Full-Stack App
Run the single launcher script from the root directory:
```bash
py run.py
```

Open your browser at:
- **Interactive Web App**: [http://localhost:8000](http://localhost:8000)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Run Automated Verification Tests
```bash
py tests/test_analytics.py
```
*(Verifies database counts, Pareto 80/20 ranking, MTBF/MTTR math, timestamp sanity checks, and 7-day repeat alert detection with 100% pass rate).*

---

## 🌐 Deploy to Vercel in 1 Minute

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and select your repository.
3. Vercel will automatically detect **Vite** framework from `vercel.json` and `package.json`.
4. Click **Deploy**!
   - Build Command: `node ./node_modules/vite/bin/vite.js build` (or `npm run build`)
   - Output Directory: `dist`
5. The application will be live immediately with zero configuration and zero errors!

---

## 🎯 Demo Day Walkthrough Script for Judges

1. **Opening Narrative**: Explain that industrial plants traditionally track stoppages anecdotally. Introduce ParetoFlow which structures every stoppage and identifies the vital few causes automatically.
2. **Show Seeded 80/20 Pareto**:
   - Point out the **Pareto of Downtime Causes** chart.
   - Show how **Motor Overheating** and **Conveyor Belt Jam** account for ~77% of total downtime minutes.
   - Point out the dashed **80% Vital Few Threshold** and the badge row naming the vital few causes.
3. **Show MTBF / MTTR & Machine Breakdown**:
   - Point to the **Plant MTBF** (`70.9 hrs`) and **Plant MTTR** (`66.2 mins`) metric cards.
   - Scroll to the **Machine Reliability Matrix** to show per-machine MTBF, MTTR, and Availability %.
4. **Show Automated Repeat-Failure Alert**:
   - Point out the red/amber alert banner: **`CNC-01` + Motor Overheating** occurred 3 times in the last 7 days!
   - Highlight the automated Root Cause Analysis recommendation generated for maintenance engineers.
5. **The Live Demo Test**:
   - Click the **"Demo: 3 Live Events"** button (or open **"+ Log Stoppage"** and log one in under 20 seconds).
   - Watch live:
     - Failure count increases to 63+.
     - MTBF and MTTR numbers recalculate live.
     - The Pareto cumulative curve adjusts in real time.
     - The weekly trend line adds the newly logged events.
6. **Role Switcher**:
   - Switch to **Operator Mode** to demonstrate the shop-floor view with big quick-log buttons and active shift clock.
   - Switch back to **Plant Manager / Admin Mode** to manage controlled reason codes or export CSV.

# Downtime
