from fastapi import FastAPI, Depends, HTTPException, Query, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import io
import csv
import os

from backend.database import get_db, engine, Base
from backend.models import Machine, ReasonCode, DowntimeEvent, RepeatAlert
from backend.schemas import (
    MachineCreate, MachineUpdate, MachineOut,
    ReasonCodeCreate, ReasonCodeUpdate, ReasonCodeOut,
    DowntimeEventCreate, DowntimeEventOut,
    RepeatAlertOut
)
from backend.analytics import (
    calculate_pareto,
    calculate_mtbf_mttr,
    calculate_weekly_trends,
    check_and_update_repeat_alerts
)
from backend.seed import seed_database

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Downtime Log & Root-Cause Analyzer API",
    description="Industrial analytics platform with Live MTBF/MTTR, Pareto 80/20 root cause analysis, and repeat-failure alert engine.",
    version="1.0.0"
)

# Enable CORS for local dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    # If database is completely empty, automatically seed 60 events
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Machine).count() == 0:
            print("Database is empty on startup. Automatically seeding initial 60 events...")
            seed_database(db=db, reset=True)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ==========================================
# MACHINES CRUD
# ==========================================

@app.get("/api/machines", response_model=List[MachineOut])
def get_machines(db: Session = Depends(get_db)):
    return db.query(Machine).order_by(Machine.code).all()


@app.post("/api/machines", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
def create_machine(payload: MachineCreate, db: Session = Depends(get_db)):
    existing = db.query(Machine).filter(Machine.code == payload.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Machine with code {payload.code} already exists.")
    
    machine = Machine(
        code=payload.code.upper().strip(),
        name=payload.name.strip(),
        line=payload.line,
        location=payload.location,
        status=payload.status or "OPERATIONAL",
        planned_hours_per_day=payload.planned_hours_per_day or 24.0
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@app.put("/api/machines/{machine_id}", response_model=MachineOut)
def update_machine(machine_id: int, payload: MachineUpdate, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if payload.code is not None:
        m.code = payload.code.upper().strip()
    if payload.name is not None:
        m.name = payload.name.strip()
    if payload.line is not None:
        m.line = payload.line
    if payload.location is not None:
        m.location = payload.location
    if payload.status is not None:
        m.status = payload.status
    if payload.planned_hours_per_day is not None:
        m.planned_hours_per_day = payload.planned_hours_per_day

    db.commit()
    db.refresh(m)
    return m


@app.delete("/api/machines/{machine_id}")
def delete_machine(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    db.delete(m)
    db.commit()
    return {"message": f"Machine {machine_id} deleted successfully"}


# ==========================================
# REASON CODES (Controlled List CRUD)
# ==========================================

@app.get("/api/reasons", response_model=List[ReasonCodeOut])
def get_reason_codes(db: Session = Depends(get_db), active_only: bool = False):
    query = db.query(ReasonCode)
    if active_only:
        query = query.filter(ReasonCode.is_active == True)
    return query.order_by(ReasonCode.category, ReasonCode.name).all()


@app.post("/api/reasons", response_model=ReasonCodeOut, status_code=status.HTTP_201_CREATED)
def create_reason_code(payload: ReasonCodeCreate, db: Session = Depends(get_db)):
    existing = db.query(ReasonCode).filter(ReasonCode.code == payload.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Reason code '{payload.code}' already exists.")
    
    rc = ReasonCode(
        code=payload.code.upper().strip(),
        name=payload.name.strip(),
        category=payload.category or "Mechanical",
        description=payload.description or "",
        is_active=payload.is_active if payload.is_active is not None else True,
        color=payload.color or "#3B82F6"
    )
    db.add(rc)
    db.commit()
    db.refresh(rc)
    return rc


@app.put("/api/reasons/{reason_id}", response_model=ReasonCodeOut)
def update_reason_code(reason_id: int, payload: ReasonCodeUpdate, db: Session = Depends(get_db)):
    rc = db.query(ReasonCode).filter(ReasonCode.id == reason_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Reason code not found")
    
    if payload.code is not None:
        rc.code = payload.code.upper().strip()
    if payload.name is not None:
        rc.name = payload.name.strip()
    if payload.category is not None:
        rc.category = payload.category
    if payload.description is not None:
        rc.description = payload.description
    if payload.is_active is not None:
        rc.is_active = payload.is_active
    if payload.color is not None:
        rc.color = payload.color

    db.commit()
    db.refresh(rc)
    return rc


@app.delete("/api/reasons/{reason_id}")
def delete_reason_code(reason_id: int, db: Session = Depends(get_db)):
    rc = db.query(ReasonCode).filter(ReasonCode.id == reason_id).first()
    if not rc:
        raise HTTPException(status_code=404, detail="Reason code not found")
    
    # Check if used in events
    events_count = db.query(DowntimeEvent).filter(DowntimeEvent.reason_code_id == reason_id).count()
    if events_count > 0:
        # Soft-delete by setting inactive
        rc.is_active = False
        db.commit()
        return {"message": f"Reason code in use by {events_count} events; deactivated instead of permanent deletion."}
    
    db.delete(rc)
    db.commit()
    return {"message": "Reason code deleted."}


# ==========================================
# FAST DOWNTIME ENTRY & EVENTS API (<20s log)
# ==========================================

@app.get("/api/events")
def list_events(
    db: Session = Depends(get_db),
    machine_id: Optional[int] = None,
    reason_code_id: Optional[int] = None,
    shift: Optional[str] = None,
    search: Optional[str] = None,
    days: Optional[int] = None,
    limit: int = 100,
    offset: int = 0
):
    query = db.query(DowntimeEvent)

    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        # SQLite stores naive UTC
        cutoff_naive = cutoff.replace(tzinfo=None)
        query = query.filter(DowntimeEvent.start_time >= cutoff_naive)

    if machine_id:
        query = query.filter(DowntimeEvent.machine_id == machine_id)
    if reason_code_id:
        query = query.filter(DowntimeEvent.reason_code_id == reason_code_id)
    if shift and shift != "All":
        query = query.filter(DowntimeEvent.shift == shift)
    if search:
        s = f"%{search}%"
        query = query.filter(DowntimeEvent.comment.ilike(s) | DowntimeEvent.operator_name.ilike(s))

    total = query.count()
    events = query.order_by(DowntimeEvent.start_time.desc()).offset(offset).limit(limit).all()

    items = []
    for ev in events:
        items.append({
            "id": ev.id,
            "machine_id": ev.machine_id,
            "machine_name": ev.machine.name if ev.machine else "",
            "machine_code": ev.machine.code if ev.machine else "",
            "reason_code_id": ev.reason_code_id,
            "reason_code": ev.reason_code.code if ev.reason_code else "",
            "reason_name": ev.reason_code.name if ev.reason_code else "",
            "reason_category": ev.reason_code.category if ev.reason_code else "",
            "reason_color": ev.reason_code.color if ev.reason_code else "#6B7280",
            "start_time": ev.start_time.isoformat() if ev.start_time else "",
            "end_time": ev.end_time.isoformat() if ev.end_time else "",
            "duration_minutes": ev.duration_minutes,
            "comment": ev.comment,
            "operator_name": ev.operator_name,
            "shift": ev.shift,
            "created_at": ev.created_at.isoformat() if ev.created_at else ""
        })

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": items
    }


@app.post("/api/events", status_code=status.HTTP_201_CREATED)
def log_downtime_event(payload: DowntimeEventCreate, db: Session = Depends(get_db)):
    """
    Fast downtime entry (< 20 seconds):
    Validates machine, controlled reason code, timestamp sanity,
    records event, and triggers repeat-failure alerts immediately.
    """
    # 1. Validate machine exists
    machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine ID {payload.machine_id} does not exist.")

    # 2. Validate reason code exists and is active
    reason = db.query(ReasonCode).filter(ReasonCode.id == payload.reason_code_id).first()
    if not reason:
        raise HTTPException(status_code=404, detail=f"Reason code ID {payload.reason_code_id} does not exist.")
    if not reason.is_active:
        raise HTTPException(status_code=400, detail=f"Reason code '{reason.name}' is inactive.")

    # 3. Create Event record
    event = DowntimeEvent(
        machine_id=payload.machine_id,
        reason_code_id=payload.reason_code_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        comment=payload.comment or "",
        operator_name=payload.operator_name or "Operator",
        shift=payload.shift or "Day"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 4. Trigger repeat pattern alert checker immediately!
    active_alerts = check_and_update_repeat_alerts(db)

    return {
        "message": "Downtime event logged successfully!",
        "event_id": event.id,
        "machine": machine.name,
        "reason": reason.name,
        "duration_minutes": event.duration_minutes,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat(),
        "active_alerts_count": len(active_alerts)
    }


@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(DowntimeEvent).filter(DowntimeEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    # Re-evaluate alerts
    check_and_update_repeat_alerts(db)
    return {"message": f"Event {event_id} removed"}


# ==========================================
# ANALYTICS ENDPOINTS
# ==========================================

@app.get("/api/analytics/overview")
def get_overview(db: Session = Depends(get_db), days: int = 30):
    mtbf_data = calculate_mtbf_mttr(db, days=days)
    pareto_data = calculate_pareto(db, days=days)
    alerts = db.query(RepeatAlert).filter(RepeatAlert.status == "ACTIVE").all()

    return {
        "plant_metrics": mtbf_data["plant_metrics"],
        "vital_few_causes": pareto_data["vital_few_causes"],
        "active_alerts_count": len(alerts),
        "total_failures": mtbf_data["plant_metrics"]["total_failures"],
        "total_downtime_minutes": mtbf_data["plant_metrics"]["total_downtime_minutes"],
        "observation_days": days
    }


@app.get("/api/analytics/pareto")
def get_pareto(db: Session = Depends(get_db), days: int = 30):
    """
    Pareto of reason codes:
    Causes ranked by total downtime minutes with cumulative-% line.
    Vital Few clearly flagged (80/20 rule).
    """
    return calculate_pareto(db, days=days)


@app.get("/api/analytics/mtbf-mttr")
def get_mtbf_mttr(db: Session = Depends(get_db), days: int = 30):
    """
    MTBF / MTTR per machine:
    Total run time / failure count; MTTR = mean(end - start).
    """
    return calculate_mtbf_mttr(db, days=days)


@app.get("/api/analytics/weekly-trends")
def get_weekly_trends(db: Session = Depends(get_db), weeks: int = 5):
    """
    Weekly downtime-minutes trend per machine on the dashboard.
    """
    return calculate_weekly_trends(db, weeks=weeks)


# ==========================================
# ALERTS & ROOT CAUSE RECOMMENDATIONS
# ==========================================

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    # Refresh alerts
    alerts_data = check_and_update_repeat_alerts(db)
    return alerts_data


@app.post("/api/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status: str = Query(..., pattern="^(ACTIVE|ACKNOWLEDGED|RESOLVED)$"), db: Session = Depends(get_db)):
    alert = db.query(RepeatAlert).filter(RepeatAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = status
    alert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return {"message": f"Alert status updated to {status}", "alert_id": alert.id}


# ==========================================
# DEMO DAY RUNNER & SEEDING
# ==========================================

@app.post("/api/seed")
def seed_data(reset: bool = True, db: Session = Depends(get_db)):
    """Reset and seed 60 events across 30 days with dominant causes."""
    seed_database(db=db, reset=reset)
    return {"message": "Database reset and seeded with 60 realistic events, dominant causes, and seeded repeat pattern."}


@app.post("/api/demo/live-stoppages")
def inject_demo_stoppages(db: Session = Depends(get_db)):
    """
    DEMO DAY SPECIAL:
    Logs 3 live stoppages right now to demonstrate:
    1. MTBF / MTTR cards update instantly.
    2. Pareto chart recalculates cumulative line.
    3. Repeat failure alerts react.
    4. Weekly trend reflects newest downtime events.
    """
    now = datetime.now(timezone.utc)
    
    cnc = db.query(Machine).filter(Machine.code == "CNC-01").first()
    cnv = db.query(Machine).filter(Machine.code == "CNV-03").first()
    inj = db.query(Machine).filter(Machine.code == "INJ-02").first()
    
    mtr = db.query(ReasonCode).filter(ReasonCode.code == "MTR-OVH").first()
    jam = db.query(ReasonCode).filter(ReasonCode.code == "CNV-JAM").first()
    snr = db.query(ReasonCode).filter(ReasonCode.code == "SNR-FLT").first()

    if not all([cnc, cnv, inj, mtr, jam, snr]):
        raise HTTPException(status_code=400, detail="Ensure database is seeded before running live demo stoppages.")

    new_events = [
        # Event 1: Live Stoppage on CNC-01 (Motor Overheating - 95 mins)
        DowntimeEvent(
            machine_id=cnc.id,
            reason_code_id=mtr.id,
            start_time=now - timedelta(minutes=95),
            end_time=now,
            duration_minutes=95.0,
            comment="[LIVE DEMO EVENT 1/3] High friction thermal surge logged live during demo.",
            operator_name="Demo Live Operator",
            shift="Day"
        ),
        # Event 2: Live Stoppage on CNV-03 (Conveyor Belt Jam - 45 mins)
        DowntimeEvent(
            machine_id=cnv.id,
            reason_code_id=jam.id,
            start_time=now - timedelta(minutes=50),
            end_time=now - timedelta(minutes=5),
            duration_minutes=45.0,
            comment="[LIVE DEMO EVENT 2/3] Pallet jam on transfer conveyor logged live during demo.",
            operator_name="Demo Live Operator",
            shift="Day"
        ),
        # Event 3: Live Stoppage on INJ-02 (Optical Sensor Misalignment - 20 mins)
        DowntimeEvent(
            machine_id=inj.id,
            reason_code_id=snr.id,
            start_time=now - timedelta(minutes=25),
            end_time=now - timedelta(minutes=5),
            duration_minutes=20.0,
            comment="[LIVE DEMO EVENT 3/3] Photocell misalignment logged live during demo.",
            operator_name="Demo Live Operator",
            shift="Day"
        ),
    ]

    db.add_all(new_events)
    db.commit()

    # Re-evaluate alerts
    alerts = check_and_update_repeat_alerts(db)

    return {
        "message": "3 Live Stoppages injected successfully! Watch MTBF, MTTR, Pareto, and Weekly Trends update live!",
        "injected_count": len(new_events),
        "total_new_minutes": sum(e.duration_minutes for e in new_events),
        "active_alerts_count": len(alerts)
    }


# ==========================================
# EXPORT DATA (CSV)
# ==========================================

@app.get("/api/export")
def export_csv(db: Session = Depends(get_db)):
    events = db.query(DowntimeEvent).order_by(DowntimeEvent.start_time.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Machine Code", "Machine Name", "Line", "Location",
        "Reason Code", "Reason Name", "Category", "Start Time (UTC)",
        "End Time (UTC)", "Duration (Minutes)", "Duration (Hours)",
        "Operator", "Shift", "Comment"
    ])
    for ev in events:
        writer.writerow([
            ev.id,
            ev.machine.code if ev.machine else "",
            ev.machine.name if ev.machine else "",
            ev.machine.line if ev.machine else "",
            ev.machine.location if ev.machine else "",
            ev.reason_code.code if ev.reason_code else "",
            ev.reason_code.name if ev.reason_code else "",
            ev.reason_code.category if ev.reason_code else "",
            ev.start_time.isoformat() if ev.start_time else "",
            ev.end_time.isoformat() if ev.end_time else "",
            ev.duration_minutes,
            round(ev.duration_minutes / 60.0, 2),
            ev.operator_name,
            ev.shift,
            ev.comment
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=downtime_log_export.csv"}
    )


# Serve frontend static assets if built
root_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(root_dist):
    app.mount("/", StaticFiles(directory=root_dist, html=True), name="frontend")
elif os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

