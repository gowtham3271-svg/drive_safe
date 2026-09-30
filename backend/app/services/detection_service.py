from datetime import datetime, timezone
from typing import Dict, Any
from ..schemas.detection import DetectionIngestRequest
from ..services.hazard_service import hazard_service
from ..database.db import record_detections

class DetectionService:
    @staticmethod
    def process_incoming_detections(payload: DetectionIngestRequest) -> Dict[str, Any]:
        ts = payload.timestamp or datetime.now(timezone.utc)
        
        # Determine hazard status based on algorithm unless explicitly overridden by edge Pi
        if payload.hazard_override in ["NORMAL", "CAUTION", "ALERT"]:
            hazard_status = payload.hazard_override
            reason = f"Edge detection flagged hazard status: {hazard_status}"
        else:
            hazard_status, reason = hazard_service.evaluate_hazard(payload.detections)
            
        result = record_detections(
            camera_id=payload.camera_id,
            boxes=payload.detections,
            timestamp=ts,
            hazard_status=hazard_status,
            reason=reason
        )
        result["reason"] = reason
        return result

detection_service = DetectionService()
