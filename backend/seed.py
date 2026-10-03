import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import Machine, ReasonCode, DowntimeEvent, RepeatAlert
from backend.analytics import check_and_update_repeat_alerts

def seed_database(db: Session = None, reset: bool = True):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    if reset:
        # Clear existing data in reverse order of foreign keys
        db.query(RepeatAlert).delete()
        db.query(DowntimeEvent).delete()
        db.query(ReasonCode).delete()
        db.query(Machine).delete()
        db.commit()

    # Check if already seeded
    if db.query(Machine).count() > 0 and not reset:
        print("Database already contains data. Skipping seed.")
        if should_close:
            db.close()
        return

    print("Seeding fresh data...")

    # 1. Seed Machines
    machines_data = [
        {"code": "CNC-01", "name": "CNC Milling Center 01", "line": "Line A - Heavy Machining", "location": "Bay 1", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
        {"code": "INJ-02", "name": "Injection Molding Press B", "line": "Line B - Plastics Mold", "location": "Bay 2", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
        {"code": "CNV-03", "name": "High-Speed Sorting Conveyor", "line": "Line C - Logistics & Sort", "location": "Bay 3", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
        {"code": "HYD-04", "name": "Hydraulic Stamping Press 04", "line": "Line A - Metal Press", "location": "Bay 1", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
        {"code": "ROB-05", "name": "Robotic Welder Cell Alpha", "line": "Line D - Automated Assembly", "location": "Bay 4", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
        {"code": "PKG-06", "name": "Automated Case Packer 06", "line": "Line C - End of Line", "location": "Bay 3", "status": "OPERATIONAL", "planned_hours_per_day": 24.0},
    ]

    machines = {}
    for m in machines_data:
        obj = Machine(**m)
        db.add(obj)
        db.flush()
        machines[obj.code] = obj

    # 2. Seed Controlled Reason Codes
    reasons_data = [
        {
            "code": "MTR-OVH",
            "name": "Motor Overheating",
            "category": "Mechanical",
            "description": "Drive motor thermal cutoff exceeded safe operating threshold",
            "color": "#EF4444"  # Red (Dominant)
        },
        {
            "code": "CNV-JAM",
            "name": "Conveyor Belt Jam",
            "category": "Mechanical",
            "description": "Physical blockage or belt misalignment stopping material flow",
            "color": "#F59E0B"  # Amber
        },
        {
            "code": "SNR-FLT",
            "name": "Optical Sensor Misalignment",
            "category": "Electrical",
            "description": "Presence detection photodiode blinded or knocked out of position",
            "color": "#3B82F6"  # Blue
        },
        {
            "code": "HYD-LKG",
            "name": "Hydraulic Line Pressure Drop",
            "category": "Mechanical",
            "description": "Hydraulic oil seal leakage or solenoid valve seal blow",
            "color": "#8B5CF6"  # Purple
        },
        {
            "code": "TLS-WRN",
            "name": "Tool Bit Wear & Breakage",
            "category": "Tooling",
            "description": "Carbide insert chipped or exceeding maximum run cycles",
            "color": "#EC4899"  # Pink
        },
        {
            "code": "ELE-TRP",
            "name": "Electrical Breaker Trip",
            "category": "Electrical",
            "description": "Overcurrent or earth fault trip on secondary distribution panel",
            "color": "#6366F1"  # Indigo
        },
        {
            "code": "OPR-ABS",
            "name": "Operator Handover Delay",
            "category": "Operational",
            "description": "Crew transition or mandatory ergonomics pause exceeded window",
            "color": "#10B981"  # Green
        },
        {
            "code": "MAT-DEF",
            "name": "Raw Material Dimension Defect",
            "category": "Material",
            "description": "Infeed stock tolerance out of specification causing machine pause",
            "color": "#14B8A6"  # Teal
        }
    ]

    reasons = {}
    for r in reasons_data:
        obj = ReasonCode(**r)
        db.add(obj)
        db.flush()
        reasons[obj.code] = obj

    db.commit()

    # 3. Seed 60 Events over 30 Days
    now = datetime.now(timezone.utc)
    random.seed(42)  # Deterministic seed for reproducible demo

    operators = ["Arslan Qureshi", "Vikram Patel", "Elena Rostova", "Marcus Chen", "David Miller"]
    shifts = ["Morning", "Afternoon", "Night"]

    comments_map = {
        "MTR-OVH": [
            "Thermal trip sensor kicked in after 4hr sustained high load. Fan housing clogged.",
            "Drive motor bearing hot to touch (>92°C). Cooled down and checked lubricant.",
            "Over-temperature alarm. Thermal paste re-applied to heat sink.",
            "Motor casing overheating; wait for thermal reset relay.",
            "High ambient heat in bay caused motor enclosure to reach 95°C."
        ],
        "CNV-JAM": [
            "Box caught between guide rails, belt slipped.",
            "Pallet debris jammed in secondary roller drum.",
            "Tensioner slipped causing conveyor belt skew and jam.",
            "Overloaded tray stalled transfer belt."
        ],
        "SNR-FLT": [
            "Dust on optical reflector caused false part-present signal.",
            "Forklift bump knocked sensor bracket out of true 5 degrees.",
            "Proximity sensor vibration loosening."
        ],
        "HYD-LKG": [
            "O-ring on manifold valve 3 leaking pressurized hydraulic fluid.",
            "Pressure dropped to 85 bar; replaced return line hose fitting."
        ],
        "TLS-WRN": [
            "Carbide end mill worn beyond tolerance, rough surface finish detected.",
            "Tool insert shattered on hardened steel pass."
        ],
        "ELE-TRP": [
            "Current surge during spindle startup tripped breaker B-12.",
            "Ground fault detector activated on auxiliary chiller pump."
        ],
        "OPR-ABS": [
            "Shift handover briefing ran over due to quality audit.",
            "Operator restroom relief delay during peak batch."
        ],
        "MAT-DEF": [
            "Sheet thickness was 3.4mm instead of spec 2.8mm, feeder jammed.",
            "Burr on raw extruded profile stopped guide chute."
        ]
    }

    events = []

    # A. Specific SEEDED REPEAT PATTERN:
    # CNC Milling Center 01 + Motor Overheating >= 3 times in the last 7 days!
    # Event 1: 5 days ago
    t1_end = now - timedelta(days=5, hours=4, minutes=10)
    t1_start = t1_end - timedelta(minutes=115)
    events.append(DowntimeEvent(
        machine_id=machines["CNC-01"].id,
        reason_code_id=reasons["MTR-OVH"].id,
        start_time=t1_start,
        end_time=t1_end,
        duration_minutes=115.0,
        comment="Spindle motor thermal overload. Rotor temperature reached 98°C. Seeded incident 1/3.",
        operator_name="Vikram Patel",
        shift="Afternoon"
    ))

    # Event 2: 3 days ago
    t2_end = now - timedelta(days=3, hours=7, minutes=25)
    t2_start = t2_end - timedelta(minutes=130)
    events.append(DowntimeEvent(
        machine_id=machines["CNC-01"].id,
        reason_code_id=reasons["MTR-OVH"].id,
        start_time=t2_start,
        end_time=t2_end,
        duration_minutes=130.0,
        comment="Secondary thermal trip on spindle drive. High bearing friction suspected. Seeded incident 2/3.",
        operator_name="Arslan Qureshi",
        shift="Morning"
    ))

    # Event 3: 1 day ago
    t3_end = now - timedelta(days=1, hours=3, minutes=45)
    t3_start = t3_end - timedelta(minutes=145)
    events.append(DowntimeEvent(
        machine_id=machines["CNC-01"].id,
        reason_code_id=reasons["MTR-OVH"].id,
        start_time=t3_start,
        end_time=t3_end,
        duration_minutes=145.0,
        comment="Repeated thermal alarm trip. Coolant flow restricted. Seeded incident 3/3 (Triggering Repeat Alert).",
        operator_name="Marcus Chen",
        shift="Night"
    ))

    # B. Generate the remaining 57 events across 30 days to reach exactly 60 events:
    # We want "Motor Overheating" and "Conveyor Belt Jam" to dominate the downtime minutes (~70-75% Pareto)
    for i in range(57):
        days_ago = random.uniform(0.2, 29.5)
        event_time_end = now - timedelta(days=days_ago)

        # Weighted selection of reason codes so MTR-OVH and CNV-JAM dominate
        # Weights: MTR-OVH: 30%, CNV-JAM: 25%, SNR-FLT: 15%, HYD-LKG: 10%, TLS-WRN: 8%, ELE-TRP: 5%, OPR-ABS: 4%, MAT-DEF: 3%
        r_choice = random.choices(
            ["MTR-OVH", "CNV-JAM", "SNR-FLT", "HYD-LKG", "TLS-WRN", "ELE-TRP", "OPR-ABS", "MAT-DEF"],
            weights=[30, 25, 14, 10, 8, 5, 5, 3],
            k=1
        )[0]

        # Machines: CNC-01 and CNV-03 will see heavy downtime
        if r_choice == "CNV-JAM":
            m_code = "CNV-03"
        elif r_choice == "MTR-OVH":
            m_code = random.choice(["CNC-01", "INJ-02", "HYD-04"])
        elif r_choice == "HYD-LKG":
            m_code = random.choice(["HYD-04", "INJ-02"])
        elif r_choice == "TLS-WRN":
            m_code = "CNC-01"
        elif r_choice == "ROB-05":
            m_code = "ROB-05"
        else:
            m_code = random.choice(list(machines.keys()))

        # Durations: Motor Overheating = 80-160 mins, Conveyor = 40-75 mins, others = 12-40 mins
        if r_choice == "MTR-OVH":
            duration = round(random.uniform(85, 160), 1)
        elif r_choice == "CNV-JAM":
            duration = round(random.uniform(35, 75), 1)
        elif r_choice == "HYD-LKG":
            duration = round(random.uniform(25, 60), 1)
        else:
            duration = round(random.uniform(10, 35), 1)

        event_time_start = event_time_end - timedelta(minutes=duration)
        comment_opts = comments_map.get(r_choice, ["Scheduled corrective action performed."])
        comment = random.choice(comment_opts)

        events.append(DowntimeEvent(
            machine_id=machines[m_code].id,
            reason_code_id=reasons[r_choice].id,
            start_time=event_time_start,
            end_time=event_time_end,
            duration_minutes=duration,
            comment=comment,
            operator_name=random.choice(operators),
            shift=random.choice(shifts)
        ))

    # Add all events
    db.add_all(events)
    db.commit()

    print(f"Successfully seeded {len(events)} events!")

    # 4. Trigger alert checker to auto-flag repeat patterns
    check_and_update_repeat_alerts(db)
    print("Alert checker evaluated. Repeat patterns flagged.")

    if should_close:
        db.close()

if __name__ == "__main__":
    seed_database(reset=True)
