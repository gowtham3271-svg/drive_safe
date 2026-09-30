from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SystemHealthResponse(BaseModel):
    raspberry_pi: str  # "ONLINE" | "OFFLINE"
    yolo11: str        # "CONNECTED" | "NOT CONNECTED"
    camera: str        # "ONLINE" | "OFFLINE"
    backend: str       # "ONLINE" | "OFFLINE"
    database: str      # "CONNECTED" | "NOT CONNECTED"
    last_update: datetime
    mode: str = "LIVE" # "LIVE" | "DEMO"
    details: Optional[Dict[str, Any]] = None
