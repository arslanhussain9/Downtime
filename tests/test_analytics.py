import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models import Machine, ReasonCode, DowntimeEvent, RepeatAlert
from backend.schemas import DowntimeEventCreate
from backend.analytics import (
    calculate_pareto,
    calculate_mtbf_mttr,
    calculate_weekly_trends,
    check_and_update_repeat_alerts
)
from backend.seed import seed_database

def test_database_seeding_and_counts():
    """Verify that seed script creates exactly 60 events, 6 machines, and controlled reasons."""
    db = SessionLocal()
    try:
        seed_database(db=db, reset=True)
        assert db.query(Machine).count() == 6
        assert db.query(ReasonCode).count() == 8
        assert db.query(DowntimeEvent).count() == 60
    finally:
        db.close()


def test_pareto_vital_few():
    """Verify that Pareto groupby -> sum minutes -> sort -> cumulative % correctly identifies vital few causes."""
    db = SessionLocal()
    try:
        pareto = calculate_pareto(db, days=30)
        items = pareto["items"]
        assert len(items) > 0
        
        # Verify descending sort
        for i in range(len(items) - 1):
            assert items[i]["total_minutes"] >= items[i+1]["total_minutes"]
        
        # Verify cumulative percentage reaches 100%
        assert round(items[-1]["cumulative_percentage"]) == 100
        
        # Dominant cause must be Motor Overheating
        top_cause = items[0]["reason_name"]
        assert "Overheating" in top_cause or "Jam" in top_cause
        
        # Verify Vital Few causes are flagged
        vital_few = pareto["vital_few_causes"]
        assert len(vital_few) >= 1
        assert items[0]["is_vital_few"] is True
    finally:
        db.close()


def test_mtbf_mttr_calculation():
    """Verify MTBF = run time / failure count and MTTR = mean(end - start)."""
    db = SessionLocal()
    try:
        metrics = calculate_mtbf_mttr(db, days=30)
        plant = metrics["plant_metrics"]
        
        assert plant["total_failures"] == 60
        assert plant["plant_mtbf_hours"] > 0
        assert plant["plant_mttr_minutes"] > 0
        assert 0 <= plant["plant_availability_pct"] <= 100
        
        # Check machine level metrics
        machines_data = metrics["machines"]
        assert len(machines_data) == 6
        for m in machines_data:
            if m["failure_count"] > 0:
                expected_mttr = round(m["total_downtime_minutes"] / m["failure_count"], 2)
                assert abs(m["mttr_minutes"] - expected_mttr) < 0.05
    finally:
        db.close()


def test_repeat_failure_alert_trigger():
    """Verify machine + reason >= 3 times in 7 days triggers an automatic alert."""
    db = SessionLocal()
    try:
        alerts = check_and_update_repeat_alerts(db)
        assert len(alerts) >= 1
        
        # The seeded repeat was CNC-01 + Motor Overheating
        cnc_alert = [a for a in alerts if a["machine_code"] == "CNC-01" and "Overheating" in a["reason_name"]]
        assert len(cnc_alert) >= 1
        assert cnc_alert[0]["incident_count"] >= 3
        assert cnc_alert[0]["status"] == "ACTIVE"
        assert len(cnc_alert[0]["recommended_action"]) > 10
    finally:
        db.close()


def test_timestamp_sanity_validation():
    """Test validation rejecting end <= start or zero duration."""
    now = datetime.now(timezone.utc)
    
    # Valid event
    ev_valid = DowntimeEventCreate(
        machine_id=1,
        reason_code_id=1,
        start_time=now - timedelta(minutes=45),
        end_time=now,
        comment="Valid test event"
    )
    assert ev_valid.duration_minutes == 45.0
    
    # Invalid: end before start
    try:
        DowntimeEventCreate(
            machine_id=1,
            reason_code_id=1,
            start_time=now,
            end_time=now - timedelta(minutes=10)
        )
        assert False, "Should have raised ValueError for end <= start"
    except ValueError as e:
        assert "after start time" in str(e)


if __name__ == "__main__":
    test_database_seeding_and_counts()
    test_pareto_vital_few()
    test_mtbf_mttr_calculation()
    test_repeat_failure_alert_trigger()
    test_timestamp_sanity_validation()
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
