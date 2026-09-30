from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    camera_id: str
    alert_type: str
    message: str
    severity: str  # "NORMAL", "CAUTION", "ALERT"
    resolved: bool = False

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True
