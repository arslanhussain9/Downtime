import os
import sys
import uvicorn
from backend.database import SessionLocal, engine, Base
from backend.models import Machine
from backend.seed import seed_database

def main():
    print("=" * 70)
    print("  ParetoFlow | Problem Statement 25: Downtime Log & Root-Cause Analyzer")
    print("  Full-Stack Analytics Platform (FastAPI + Pandas + React + Recharts)")
    print("=" * 70)

    # 1. Initialize schema
    Base.metadata.create_all(bind=engine)
    
    # 2. Check if DB has seeded records
    db = SessionLocal()
    try:
        count = db.query(Machine).count()
        if count == 0:
            print("[INFO] Database empty. Seeding 60 realistic events across 30 days...")
            seed_database(db=db, reset=True)
            print("[SUCCESS] 60 events, dominant Pareto causes, and repeat alerts seeded!")
        else:
            print(f"[INFO] Database ready with {count} machines and existing stoppage logs.")
    finally:
        db.close()

    print("\n[READY] Starting unified server on http://localhost:8000")
    print("  - Interactive Web App : http://localhost:8000")
    print("  - Swagger REST API    : http://localhost:8000/docs")
    print("  - ReDoc Documentation : http://localhost:8000/redoc")
    print("=" * 70 + "\n")

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
