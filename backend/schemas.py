from pydantic import BaseModel, Field, model_validator
from datetime import datetime, timezone, timedelta
from typing import Optional, List

class MachineBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, examples=["CNC-01"])
    name: str = Field(..., min_length=2, max_length=120, examples=["CNC Milling Center 01"])
    line: Optional[str] = "Main Production Line"
    location: Optional[str] = "Floor 1"
    status: Optional[str] = "OPERATIONAL"
    planned_hours_per_day: Optional[float] = 24.0

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    line: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    planned_hours_per_day: Optional[float] = None

class MachineOut(MachineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReasonCodeBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, examples=["MTR-OVH"])
    name: str = Field(..., min_length=2, max_length=120, examples=["Motor Overheating"])
    category: Optional[str] = "Mechanical"
    description: Optional[str] = ""
    is_active: Optional[bool] = True
    color: Optional[str] = "#3B82F6"

class ReasonCodeCreate(ReasonCodeBase):
    pass

class ReasonCodeUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None

class ReasonCodeOut(ReasonCodeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DowntimeEventCreate(BaseModel):
    machine_id: int
    reason_code_id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    comment: Optional[str] = Field(default="", max_length=500)
    operator_name: Optional[str] = "Operator"
    shift: Optional[str] = "Day"

    @model_validator(mode="after")
    def validate_timestamps_and_duration(self):
        now = datetime.now(timezone.utc)
        
        # Scenario A: Both start and end times are provided
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("End time must be strictly after start time.")
            diff_mins = (self.end_time - self.start_time).total_seconds() / 60.0
            if diff_mins <= 0:
                raise ValueError("Duration must be strictly positive.")
            self.duration_minutes = round(diff_mins, 2)
            
        # Scenario B: Start time and duration are provided
        elif self.start_time is not None and self.duration_minutes is not None:
            if self.duration_minutes <= 0:
                raise ValueError("Duration must be strictly positive.")
            self.end_time = self.start_time + timedelta(minutes=float(self.duration_minutes))
            
        # Scenario C: Only duration provided (e.g. logged immediately as 'occurred just now')
        elif self.duration_minutes is not None:
            if self.duration_minutes <= 0:
                raise ValueError("Duration must be strictly positive.")
            self.end_time = now
            self.start_time = now - timedelta(minutes=float(self.duration_minutes))
            
        # Scenario D: Only start time provided (still ongoing stoppage or default 15m)
        elif self.start_time is not None:
            self.duration_minutes = 15.0
            self.end_time = self.start_time + timedelta(minutes=15)
        else:
            raise ValueError("You must supply either start/end times or a valid duration in minutes.")

        return self


class DowntimeEventOut(BaseModel):
    id: int
    machine_id: int
    reason_code_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    comment: str
    operator_name: str
    shift: str
    created_at: datetime
    machine: Optional[MachineOut] = None
    reason_code: Optional[ReasonCodeOut] = None

    class Config:
        from_attributes = True


class RepeatAlertOut(BaseModel):
    id: int
    machine_id: int
    reason_code_id: int
    incident_count: int
    window_start: datetime
    window_end: datetime
    status: str
    severity: str
    recommended_action: str
    updated_at: datetime
    machine: Optional[MachineOut] = None
    reason_code: Optional[ReasonCodeOut] = None

    class Config:
        from_attributes = True
