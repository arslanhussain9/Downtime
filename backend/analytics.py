import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from backend.models import DowntimeEvent, Machine, ReasonCode, RepeatAlert

def get_events_dataframe(db: Session, machine_id: Optional[int] = None, days: int = 30) -> pd.DataFrame:
    """Load downtime events into a pandas DataFrame."""
    query = db.query(DowntimeEvent)
    if machine_id:
        query = query.filter(DowntimeEvent.machine_id == machine_id)
    
    events = query.all()
    if not events:
        return pd.DataFrame(columns=[
            "id", "machine_id", "machine_name", "machine_code",
            "reason_code_id", "reason_code", "reason_name", "reason_category", "reason_color",
            "start_time", "end_time", "duration_minutes", "comment", "shift"
        ])
    
    data = []
    for ev in events:
        data.append({
            "id": ev.id,
            "machine_id": ev.machine_id,
            "machine_name": ev.machine.name if ev.machine else f"Machine #{ev.machine_id}",
            "machine_code": ev.machine.code if ev.machine else f"M{ev.machine_id}",
            "reason_code_id": ev.reason_code_id,
            "reason_code": ev.reason_code.code if ev.reason_code else "UNKNOWN",
            "reason_name": ev.reason_code.name if ev.reason_code else "Unknown Cause",
            "reason_category": ev.reason_code.category if ev.reason_code else "Other",
            "reason_color": ev.reason_code.color if ev.reason_code else "#6B7280",
            "start_time": ev.start_time,
            "end_time": ev.end_time,
            "duration_minutes": float(ev.duration_minutes),
            "comment": ev.comment or "",
            "shift": ev.shift or "Day"
        })
    
    df = pd.DataFrame(data)
    df["start_time"] = pd.to_datetime(df["start_time"])
    df["end_time"] = pd.to_datetime(df["end_time"])
    return df


def calculate_pareto(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Computes Pareto ranking of reason codes:
    groupby reason -> sum minutes -> sort descending -> cumulative %.
    Labels 'Vital Few' (80/20 rule).
    """
    df = get_events_dataframe(db, days=days)
    if df.empty:
        return {
            "items": [],
            "total_downtime_minutes": 0,
            "total_failures": 0,
            "vital_few_causes": []
        }
    
    # Filter by days if specified
    if days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        # make tz-naive or tz-aware matching
        if df["start_time"].dt.tz is not None:
            cutoff = cutoff.replace(tzinfo=timezone.utc)
        else:
            cutoff = cutoff.replace(tzinfo=None)
        df_filtered = df[df["start_time"] >= cutoff]
        if df_filtered.empty:
            df_filtered = df  # fallback if window is narrow
    else:
        df_filtered = df

    total_minutes = df_filtered["duration_minutes"].sum()
    total_failures = len(df_filtered)

    if total_minutes <= 0:
        return {
            "items": [],
            "total_downtime_minutes": 0,
            "total_failures": total_failures,
            "vital_few_causes": []
        }

    # Group by reason code
    grouped = df_filtered.groupby(
        ["reason_code_id", "reason_code", "reason_name", "reason_category", "reason_color"]
    ).agg(
        total_minutes=("duration_minutes", "sum"),
        count=("id", "count"),
        avg_minutes=("duration_minutes", "mean")
    ).reset_index()

    # Sort descending by total downtime minutes
    grouped = grouped.sort_values(by="total_minutes", ascending=False).reset_index(drop=True)

    # Calculate cumulative minutes & percentage
    grouped["cumulative_minutes"] = grouped["total_minutes"].cumsum()
    grouped["percentage"] = (grouped["total_minutes"] / total_minutes) * 100.0
    grouped["cumulative_percentage"] = (grouped["cumulative_minutes"] / total_minutes) * 100.0

    items = []
    vital_few_causes = []
    prev_cum = 0.0

    for _, row in grouped.iterrows():
        # A cause is Vital Few if it helps reach the 80% threshold
        is_vital = prev_cum < 80.0
        prev_cum = float(row["cumulative_percentage"])

        item = {
            "reason_code_id": int(row["reason_code_id"]),
            "reason_code": str(row["reason_code"]),
            "reason_name": str(row["reason_name"]),
            "category": str(row["reason_category"]),
            "color": str(row["reason_color"]),
            "total_minutes": round(float(row["total_minutes"]), 1),
            "total_hours": round(float(row["total_minutes"]) / 60.0, 2),
            "count": int(row["count"]),
            "avg_minutes": round(float(row["avg_minutes"]), 1),
            "percentage": round(float(row["percentage"]), 2),
            "cumulative_percentage": round(float(row["cumulative_percentage"]), 2),
            "is_vital_few": is_vital
        }
        items.append(item)
        if is_vital:
            vital_few_causes.append(str(row["reason_name"]))

    return {
        "items": items,
        "total_downtime_minutes": round(float(total_minutes), 1),
        "total_failures": total_failures,
        "vital_few_causes": vital_few_causes
    }


def calculate_mtbf_mttr(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Computes MTBF and MTTR per machine and plant-wide.
    Formula:
    MTBF = total operating time / failure count
    MTTR = mean(end - start) = total downtime minutes / failure count
    Availability = MTBF / (MTBF + MTTR_hours) * 100%
    """
    machines = db.query(Machine).all()
    df = get_events_dataframe(db)

    # Filter events by days window if specified
    if days > 0 and not df.empty:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        if df["start_time"].dt.tz is not None:
            cutoff = cutoff.replace(tzinfo=timezone.utc)
        else:
            cutoff = cutoff.replace(tzinfo=None)
        df_events = df[df["start_time"] >= cutoff]
    else:
        df_events = df

    # Observation window (default 30 days * 24 hrs = 720 hrs)
    window_hours = float(days * 24.0)

    machines_metrics = []
    plant_total_failures = 0
    plant_total_downtime_mins = 0.0
    plant_total_operating_hrs = 0.0

    for m in machines:
        planned_hrs = float(days * (m.planned_hours_per_day or 24.0)) if days > 0 else 720.0
        m_events = df_events[df_events["machine_id"] == m.id] if not df_events.empty else pd.DataFrame()

        failures = len(m_events)
        downtime_mins = float(m_events["duration_minutes"].sum()) if failures > 0 else 0.0
        downtime_hrs = downtime_mins / 60.0

        # Operating time = planned operating hours - downtime hours
        operating_hrs = max(0.0, planned_hrs - downtime_hrs)

        if failures > 0:
            mtbf_hrs = round(operating_hrs / failures, 2)
            mttr_mins = round(downtime_mins / failures, 2)
            mttr_hrs = mttr_mins / 60.0
            availability_pct = round((operating_hrs / planned_hrs) * 100.0, 2) if planned_hrs > 0 else 0.0
        else:
            mtbf_hrs = round(operating_hrs, 2)
            mttr_mins = 0.0
            availability_pct = 100.0

        plant_total_failures += failures
        plant_total_downtime_mins += downtime_mins
        plant_total_operating_hrs += operating_hrs

        # Machine health status tag based on availability
        if availability_pct >= 95.0:
            health_badge = "Excellent"
        elif availability_pct >= 85.0:
            health_badge = "Moderate"
        else:
            health_badge = "Critical Attention"

        machines_metrics.append({
            "machine_id": m.id,
            "machine_code": m.code,
            "machine_name": m.name,
            "line": m.line,
            "location": m.location,
            "current_status": m.status,
            "planned_hours": planned_hrs,
            "failure_count": failures,
            "total_downtime_minutes": round(downtime_mins, 1),
            "total_downtime_hours": round(downtime_hrs, 2),
            "operating_hours": round(operating_hrs, 2),
            "mtbf_hours": mtbf_hrs,
            "mttr_minutes": mttr_mins,
            "availability_pct": availability_pct,
            "health_badge": health_badge
        })

    # Plant-wide aggregates
    total_planned_plant_hrs = sum(m["planned_hours"] for m in machines_metrics) if machines_metrics else window_hours
    if plant_total_failures > 0:
        plant_mtbf_hrs = round(plant_total_operating_hrs / plant_total_failures, 2)
        plant_mttr_mins = round(plant_total_downtime_mins / plant_total_failures, 2)
    else:
        plant_mtbf_hrs = round(plant_total_operating_hrs, 2)
        plant_mttr_mins = 0.0

    plant_availability = round((plant_total_operating_hrs / total_planned_plant_hrs) * 100.0, 2) if total_planned_plant_hrs > 0 else 100.0

    return {
        "plant_metrics": {
            "total_failures": plant_total_failures,
            "total_downtime_minutes": round(plant_total_downtime_mins, 1),
            "total_downtime_hours": round(plant_total_downtime_mins / 60.0, 2),
            "plant_operating_hours": round(plant_total_operating_hrs, 2),
            "plant_mtbf_hours": plant_mtbf_hrs,
            "plant_mttr_minutes": plant_mttr_mins,
            "plant_availability_pct": plant_availability,
            "machine_count": len(machines)
        },
        "machines": machines_metrics
    }


def calculate_weekly_trends(db: Session, weeks: int = 5) -> Dict[str, Any]:
    """
    Weekly downtime-minutes trend per machine on the dashboard.
    Returns weekly intervals with downtime minutes for each machine.
    """
    df = get_events_dataframe(db)
    machines = db.query(Machine).all()
    machine_names = [m.name for m in machines]

    now = datetime.now(timezone.utc)
    weekly_data = []

    # Generate the last `weeks` weekly buckets
    for i in range(weeks - 1, -1, -1):
        bucket_end = now - timedelta(days=i * 7)
        bucket_start = bucket_end - timedelta(days=7)
        
        # Label format: e.g. "Sep 15 - Sep 21" or "Week -3"
        label = f"{bucket_start.strftime('%b %d')} - {bucket_end.strftime('%b %d')}"
        if i == 0:
            label += " (Current)"

        row: Dict[str, Any] = {
            "week_label": label,
            "week_index": weeks - i,
            "total_plant_minutes": 0.0
        }
        for name in machine_names:
            row[name] = 0.0

        if not df.empty:
            start_col = df["start_time"]
            if start_col.dt.tz is None:
                b_start = bucket_start.replace(tzinfo=None)
                b_end = bucket_end.replace(tzinfo=None)
            else:
                b_start = bucket_start
                b_end = bucket_end

            mask = (df["start_time"] >= b_start) & (df["start_time"] < b_end)
            week_df = df[mask]
            
            if not week_df.empty:
                for _, ev in week_df.iterrows():
                    m_name = ev["machine_name"]
                    mins = float(ev["duration_minutes"])
                    if m_name in row:
                        row[m_name] = round(row[m_name] + mins, 1)
                    row["total_plant_minutes"] = round(row["total_plant_minutes"] + mins, 1)

        weekly_data.append(row)

    return {
        "machine_names": machine_names,
        "weekly_data": weekly_data
    }


def check_and_update_repeat_alerts(db: Session) -> List[Dict[str, Any]]:
    """
    Alert checker: the same machine + reason code >= 3 times in 7 days
    is flagged automatically and written to the alerts table.
    """
    df = get_events_dataframe(db)
    if df.empty:
        return []

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # Ensure tz compatibility
    if df["start_time"].dt.tz is None:
        seven_days_ago_cmp = seven_days_ago.replace(tzinfo=None)
    else:
        seven_days_ago_cmp = seven_days_ago

    # Filter events within last 7 days
    recent_df = df[df["start_time"] >= seven_days_ago_cmp]
    
    # We will identify combinations with >= 3 occurrences
    detected_alerts = []

    if not recent_df.empty:
        # Group by machine_id and reason_code_id
        counts = recent_df.groupby(["machine_id", "reason_code_id"]).size().reset_index(name="count")
        repeats = counts[counts["count"] >= 3]

        for _, row in repeats.iterrows():
            m_id = int(row["machine_id"])
            r_id = int(row["reason_code_id"])
            cnt = int(row["count"])

            matched_events = recent_df[
                (recent_df["machine_id"] == m_id) & (recent_df["reason_code_id"] == r_id)
            ].sort_values("start_time")

            earliest_time = matched_events["start_time"].iloc[0]
            latest_time = matched_events["start_time"].iloc[-1]

            # Generate dynamic Root Cause Recommendation
            m_name = matched_events["machine_name"].iloc[0]
            r_name = matched_events["reason_name"].iloc[0]
            r_category = matched_events["reason_category"].iloc[0]

            if "Overheating" in r_name or "Bearing" in r_name or "Chiller" in r_name:
                rca_rec = f"Repeated thermal/overheating alerts on {m_name}. Inspect coolant flow, radiator fan operation, heat sink thermal paste, and spindle bearing lubrication."
            elif "Sensor" in r_name or "Proximity" in r_name or "Thermocouple" in r_name or "Curtain" in r_name or "Switch" in r_name:
                rca_rec = f"Recurring sensor/detection failures on {m_name}. Clean optical lenses, calibrate proximity sensor gap, inspect thermocouple probes, and check bracket vibration mounting."
            elif "Jam" in r_name or "Belt" in r_name:
                rca_rec = f"Recurring mechanical jam on {m_name}. Inspect belt tension, roller alignment, debris buildup, and guide rail clearances."
            elif "Hydraulic" in r_name or "Pneumatic" in r_name or "Pressure" in r_name:
                rca_rec = f"Fluid power pressure loss on {m_name}. Inspect compressed air line pressure (<5 bar), hydraulic seals, manifold valve solenoids, and pump pressure."
            elif "Breaker" in r_name or "Servo" in r_name or "Electrical" in r_name:
                rca_rec = f"Repeated electrical/drive faults on {m_name}. Inspect breaker load, ground fault detector, servo motor encoder wiring, and subpanel voltage stability."
            elif "Lubrication" in r_name:
                rca_rec = f"Central lubrication alerts on {m_name}. Refill grease/oil reservoir, purge line air bubbles, and inspect manifold metering valves."
            else:
                rca_rec = f"High recurrence of '{r_name}' ({r_category}) on {m_name} (>=3 occurrences in 7 days). Immediate root cause investigation required."

            # Check if alert already exists in DB
            alert = db.query(RepeatAlert).filter(
                RepeatAlert.machine_id == m_id,
                RepeatAlert.reason_code_id == r_id
            ).first()

            if not alert:
                alert = RepeatAlert(
                    machine_id=m_id,
                    reason_code_id=r_id,
                    incident_count=cnt,
                    window_start=earliest_time,
                    window_end=latest_time,
                    status="ACTIVE",
                    severity="CRITICAL" if cnt >= 4 else "HIGH",
                    recommended_action=rca_rec,
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(alert)
            else:
                alert.incident_count = cnt
                alert.window_start = earliest_time
                alert.window_end = latest_time
                if alert.status != "RESOLVED":
                    alert.status = "ACTIVE"
                alert.severity = "CRITICAL" if cnt >= 4 else "HIGH"
                alert.recommended_action = rca_rec
                alert.updated_at = datetime.now(timezone.utc)

            db.commit()
            db.refresh(alert)
            detected_alerts.append(alert)

    # Return all active/acknowledged alerts from DB with relations
    all_alerts = db.query(RepeatAlert).order_by(RepeatAlert.updated_at.desc()).all()
    results = []
    for a in all_alerts:
        results.append({
            "id": a.id,
            "machine_id": a.machine_id,
            "machine_name": a.machine.name if a.machine else f"Machine #{a.machine_id}",
            "machine_code": a.machine.code if a.machine else f"M{a.machine_id}",
            "reason_code_id": a.reason_code_id,
            "reason_code": a.reason_code.code if a.reason_code else "R0",
            "reason_name": a.reason_code.name if a.reason_code else "Cause",
            "reason_category": a.reason_code.category if a.reason_code else "General",
            "incident_count": a.incident_count,
            "window_start": a.window_start.isoformat() if a.window_start else "",
            "window_end": a.window_end.isoformat() if a.window_end else "",
            "status": a.status,
            "severity": a.severity,
            "recommended_action": a.recommended_action,
            "updated_at": a.updated_at.isoformat() if a.updated_at else ""
        })
    return results
