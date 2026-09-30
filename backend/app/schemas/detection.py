from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class BoundingBox(BaseModel):
    class_: str = Field(alias="class")
    confidence: float = Field(..., ge=0.0, le=1.0)
    x1: float
    y1: float
    x2: float
    y2: float

    class Config:
        populate_by_name = True

class DetectionCount(BaseModel):
    car: int = 0
    truck: int = 0
    bus: int = 0
    motorcycle: int = 0
    person: int = 0

class DetectionIngestRequest(BaseModel):
    camera_id: str
    detections: List[BoundingBox] = []
    timestamp: Optional[datetime] = None
    hazard_override: Optional[str] = None  # Optional override from edge reasoning

class DetectionRecord(BaseModel):
    id: Optional[str] = None
    camera_id: str
    object_class: str
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float
    timestamp: datetime
