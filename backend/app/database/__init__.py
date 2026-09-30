from .supabase_client import get_supabase
from .db import (
    get_all_cameras,
    get_camera,
    record_detections,
    get_detections_for_camera,
    get_alerts,
    get_system_health,
    sync_seed_to_supabase
)

__all__ = [
    "get_supabase",
    "get_all_cameras",
    "get_camera",
    "record_detections",
    "get_detections_for_camera",
    "get_alerts",
    "get_system_health",
    "sync_seed_to_supabase"
]
