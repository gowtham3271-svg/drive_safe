from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from .detection import DetectionCount

class CameraBase(BaseModel):
    camera_id: str
    name: str
    location: str
    road_section: str = "Blind Turn / Ghat Section"
    latitude: float
    longitude: float
    stream_url: Optional[str] = None
    visibility: str = "Normal"

class CameraCreate(CameraBase):
    pass

class CameraResponse(BaseModel):
    camera_id: str
    name: str
    location: str
    road_section: str = "Blind Turn / Ghat Section"
    latitude: float
    longitude: float
    status: str = "OFFLINE"  # "ONLINE" or "OFFLINE"
    hazard_status: str = "NORMAL"  # "NORMAL", "CAUTION", "ALERT"
    hazard: bool = False
    visibility: str = "Normal"  # "Normal", "Fog", "Low Visibility"
    detections: DetectionCount = DetectionCount()
    vehicle_count: int = 0
    person_count: int = 0
    stream_url: Optional[str] = None
    last_ping: Optional[datetime] = None

class CameraStatusUpdate(BaseModel):
    status: str
    visibility: Optional[str] = None
    stream_url: Optional[str] = None
