from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import uuid
import logging
from ..schemas.camera import CameraResponse, DetectionCount
from ..schemas.detection import DetectionRecord, BoundingBox
from ..schemas.alert import AlertResponse
from ..schemas.status import SystemHealthResponse
from .supabase_client import get_supabase

logger = logging.getLogger(__name__)

# Default seed cameras for ghat / mountain blind turns
DEFAULT_CAMERAS: List[Dict[str, Any]] = [
    {
        "camera_id": "CAM001",
        "name": "Hairpin Curve #4",
        "location": "Khandala Ghat, NH-48, KM 42.5",
        "road_section": "Sharp Blind Turn / Ghat Section",
        "latitude": 18.7562,
        "longitude": 73.3768,
        "status": "OFFLINE",  # Starts OFFLINE until real Pi/camera connects or demo mode
        "hazard_status": "NORMAL",
        "hazard": False,
        "visibility": "Fog / Low Visibility",
        "stream_url": "http://raspberry.local:8080/stream.mjpg",
        "vehicle_count": 0,
        "person_count": 0,
        "detections": {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0, "person": 0},
        "last_ping": None
    },
    {
        "camera_id": "CAM002",
        "name": "Blind S-Bend",
        "location": "Charmadi Ghat, NH-73, KM 18.2",
        "road_section": "Hairpin Descent - Mist Zone",
        "latitude": 13.0645,
        "longitude": 75.4372,
        "status": "OFFLINE",
        "hazard_status": "NORMAL",
        "hazard": False,
        "visibility": "Normal",
        "stream_url": None,
        "vehicle_count": 0,
        "person_count": 0,
        "detections": {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0, "person": 0},
        "last_ping": None
    },
    {
        "camera_id": "CAM003",
        "name": "Rockfall Hazard Turn",
        "location": "Valparai Ghat, SH-78, Curve 21",
        "road_section": "Narrow Blind Cliff Turn",
        "latitude": 10.3245,
        "longitude": 76.9532,
        "status": "OFFLINE",
        "hazard_status": "NORMAL",
        "hazard": False,
        "visibility": "Low Visibility",
        "stream_url": None,
        "vehicle_count": 0,
        "person_count": 0,
        "detections": {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0, "person": 0},
        "last_ping": None
    }
]

# In-memory storage cache and fallback
_in_memory_cameras: Dict[str, Dict[str, Any]] = {c["camera_id"]: dict(c) for c in DEFAULT_CAMERAS}
_in_memory_detections: List[Dict[str, Any]] = []
_in_memory_alerts: List[Dict[str, Any]] = []
_in_memory_status: Dict[str, Dict[str, Any]] = {
    "raspberry_pi": {"status": "OFFLINE", "last_update": None},
    "yolo11": {"status": "NOT CONNECTED", "last_update": None},
    "camera": {"status": "OFFLINE", "last_update": None},
    "backend": {"status": "ONLINE", "last_update": datetime.now(timezone.utc)},
    "database": {"status": "NOT CONNECTED", "last_update": None}
}


def sync_seed_to_supabase():
    """Seeds the Supabase database with default cameras if table is empty."""
    client = get_supabase()
    if not client:
        return
    try:
        res = client.table("cameras").select("camera_id").execute()
        if not res.data:
            logger.info("Seeding default cameras into Supabase...")
            for c in DEFAULT_CAMERAS:
                db_record = {
                    "camera_id": c["camera_id"],
                    "name": c["name"],
                    "location": c["location"],
                    "road_section": c["road_section"],
                    "latitude": c["latitude"],
                    "longitude": c["longitude"],
                    "status": c["status"],
                    "hazard_status": c["hazard_status"],
                    "visibility": c["visibility"],
                    "vehicle_count": c["vehicle_count"],
                    "person_count": c["person_count"],
                    "stream_url": c["stream_url"]
                }
                client.table("cameras").upsert(db_record).execute()
            logger.info("Default cameras seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding Supabase cameras: {e}")


def get_all_cameras() -> List[CameraResponse]:
    client = get_supabase()
    if client:
        try:
            res = client.table("cameras").select("*").execute()
            if res.data:
                results = []
                for row in res.data:
                    # Look up latest detection counts
                    det_counts = _in_memory_cameras.get(row["camera_id"], {}).get("detections", {
                        "car": 0, "truck": 0, "bus": 0, "motorcycle": 0, "person": 0
                    })
                    results.append(CameraResponse(
                        camera_id=row["camera_id"],
                        name=row.get("name", row["camera_id"]),
                        location=row.get("location", "Ghat Section"),
                        road_section=row.get("road_section", "Blind Turn / Ghat Section"),
                        latitude=row["latitude"],
                        longitude=row["longitude"],
                        status=row.get("status", "OFFLINE"),
                        hazard_status=row.get("hazard_status", "NORMAL"),
                        hazard=row.get("hazard_status") in ["CAUTION", "ALERT"],
                        visibility=row.get("visibility", "Normal"),
                        detections=DetectionCount(**det_counts),
                        vehicle_count=row.get("vehicle_count", 0),
                        person_count=row.get("person_count", 0),
                        stream_url=row.get("stream_url"),
                        last_ping=row.get("last_ping")
                    ))
                return results
        except Exception as e:
            logger.error(f"Supabase query error: {e}")
            
    # Fallback in-memory
    return [
        CameraResponse(
            camera_id=c["camera_id"],
            name=c["name"],
            location=c["location"],
            road_section=c["road_section"],
            latitude=c["latitude"],
            longitude=c["longitude"],
            status=c["status"],
            hazard_status=c["hazard_status"],
            hazard=c["hazard_status"] in ["CAUTION", "ALERT"],
            visibility=c["visibility"],
            detections=DetectionCount(**c["detections"]),
            vehicle_count=c["vehicle_count"],
            person_count=c["person_count"],
            stream_url=c["stream_url"],
            last_ping=c["last_ping"]
        ) for c in _in_memory_cameras.values()
    ]


def get_camera(camera_id: str) -> Optional[CameraResponse]:
    cameras = get_all_cameras()
    for c in cameras:
        if c.camera_id == camera_id:
            return c
    return None


def update_camera_stream_url(camera_id: str, stream_url: str) -> Optional[CameraResponse]:
    if camera_id in _in_memory_cameras:
        _in_memory_cameras[camera_id]["stream_url"] = stream_url
    client = get_supabase()
    if client:
        try:
            client.table("cameras").update({"stream_url": stream_url}).eq("camera_id", camera_id).execute()
        except Exception as e:
            logger.error(f"Error updating stream_url in Supabase: {e}")
    return get_camera(camera_id)


def record_detections(
    camera_id: str,
    boxes: List[BoundingBox],
    timestamp: datetime,
    hazard_status: str,
    reason: str
) -> Dict[str, Any]:
    counts = {"car": 0, "truck": 0, "bus": 0, "motorcycle": 0, "person": 0}
    for b in boxes:
        cls = b.class_.lower()
        if cls in counts:
            counts[cls] += 1
            
    vehicle_count = counts["car"] + counts["truck"] + counts["bus"] + counts["motorcycle"]
    person_count = counts["person"]

    # Update in-memory state
    if camera_id in _in_memory_cameras:
        _in_memory_cameras[camera_id].update({
            "status": "ONLINE",
            "hazard_status": hazard_status,
            "hazard": hazard_status in ["CAUTION", "ALERT"],
            "detections": counts,
            "vehicle_count": vehicle_count,
            "person_count": person_count,
            "last_ping": timestamp
        })

    # Update system health statuses
    _in_memory_status["raspberry_pi"] = {"status": "ONLINE", "last_update": timestamp}
    _in_memory_status["yolo11"] = {"status": "CONNECTED", "last_update": timestamp}
    _in_memory_status["camera"] = {"status": "ONLINE", "last_update": timestamp}

    # Store detection entries
    for b in boxes:
        det_entry = {
            "id": str(uuid.uuid4()),
            "camera_id": camera_id,
            "object_class": b.class_,
            "confidence": b.confidence,
            "x1": b.x1,
            "y1": b.y1,
            "x2": b.x2,
            "y2": b.y2,
            "timestamp": timestamp.isoformat()
        }
        _in_memory_detections.append(det_entry)
    
    # Cap in-memory detections
    if len(_in_memory_detections) > 200:
        _in_memory_detections[:] = _in_memory_detections[-200:]

    # If hazard elevated, record alert
    if hazard_status in ["CAUTION", "ALERT"]:
        alert = {
            "id": str(uuid.uuid4()),
            "camera_id": camera_id,
            "alert_type": "HAZARD_WARNING" if hazard_status == "CAUTION" else "BLIND_TURN_OBSTRUCTION",
            "message": reason,
            "severity": hazard_status,
            "timestamp": timestamp.isoformat(),
            "resolved": False
        }
        _in_memory_alerts.insert(0, alert)
        if len(_in_memory_alerts) > 50:
            _in_memory_alerts.pop()

    # Try saving to Supabase if connected
    client = get_supabase()
    if client:
        try:
            client.table("cameras").update({
                "status": "ONLINE",
                "hazard_status": hazard_status,
                "vehicle_count": vehicle_count,
                "person_count": person_count,
                "last_ping": timestamp.isoformat()
            }).eq("camera_id", camera_id).execute()

            if boxes:
                to_insert = [
                    {
                        "camera_id": camera_id,
                        "object_class": b.class_,
                        "confidence": b.confidence,
                        "x1": b.x1,
                        "y1": b.y1,
                        "x2": b.x2,
                        "y2": b.y2,
                        "timestamp": timestamp.isoformat()
                    } for b in boxes
                ]
                client.table("detections").insert(to_insert).execute()

            if hazard_status in ["CAUTION", "ALERT"]:
                client.table("alerts").insert({
                    "camera_id": camera_id,
                    "alert_type": "HAZARD_WARNING" if hazard_status == "CAUTION" else "BLIND_TURN_OBSTRUCTION",
                    "message": reason,
                    "severity": hazard_status,
                    "timestamp": timestamp.isoformat(),
                    "resolved": False
                }).execute()
        except Exception as e:
            logger.error(f"Error persisting to Supabase: {e}")

    return {
        "status": "success",
        "camera_id": camera_id,
        "hazard_status": hazard_status,
        "counts": counts,
        "vehicle_count": vehicle_count,
        "person_count": person_count
    }


def get_detections_for_camera(camera_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        try:
            res = client.table("detections").select("*").eq("camera_id", camera_id).order("timestamp", desc=True).limit(limit).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Error fetching detections from Supabase: {e}")
            
    filtered = [d for d in _in_memory_detections if d["camera_id"] == camera_id]
    return list(reversed(filtered[-limit:]))


def get_alerts(resolved: Optional[bool] = None, limit: int = 30) -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        try:
            query = client.table("alerts").select("*").order("timestamp", desc=True).limit(limit)
            if resolved is not None:
                query = query.eq("resolved", resolved)
            res = query.execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"Error fetching alerts from Supabase: {e}")
            
    if resolved is not None:
        return [a for a in _in_memory_alerts if a.get("resolved") == resolved][:limit]
    return _in_memory_alerts[:limit]


def get_system_health() -> SystemHealthResponse:
    client = get_supabase()
    db_status = "CONNECTED" if client is not None else "NOT CONNECTED"
    
    # Check if we have received a recent ping from Raspberry Pi/YOLO within last 30s
    now = datetime.now(timezone.utc)
    pi_info = _in_memory_status["raspberry_pi"]
    last_ping = pi_info.get("last_update")
    
    pi_status = "OFFLINE"
    yolo_status = "NOT CONNECTED"
    cam_status = "OFFLINE"
    
    if last_ping:
        diff_sec = (now - last_ping).total_seconds()
        if diff_sec <= 30:
            pi_status = "ONLINE"
            yolo_status = "CONNECTED"
            cam_status = "ONLINE"

    return SystemHealthResponse(
        raspberry_pi=pi_status,
        yolo11=yolo_status,
        camera=cam_status,
        backend="ONLINE",
        database=db_status,
        last_update=now,
        mode="LIVE"
    )


# ==============================================================================
# GHATGUARD: Fog, Roadside Units (RSU), Ultrasonic Sensors & Simulation State
# ==============================================================================

_in_memory_fog = {
    "density_percent": 24.0,
    "visibility_score": 88.0,
    "status": "CLEAR",  # CLEAR | MODERATE FOG | DENSE FOG | CRITICAL VISIBILITY
    "dew_point_c": 16.2,
    "temperature_c": 19.4,
    "humidity_percent": 82.0,
    "last_update": datetime.now(timezone.utc).isoformat()
}

_in_memory_rsus = [
    {
        "id": "RSU-01",
        "name": "Apex Central Node",
        "location": "NH-48 KM 42.5 (Blind Hairpin Apex)",
        "lat": 18.7562,
        "lng": 73.3768,
        "led_state": "GREEN",  # GREEN | YELLOW | RED
        "warning_active": False,
        "lora_rssi_dbm": -68,
        "lora_freq_mhz": 433.0,
        "solar_charge_pct": 89,
        "battery_pct": 94,
        "status": "ONLINE"
    },
    {
        "id": "RSU-02",
        "name": "Entry Warning Node (Uphill)",
        "location": "NH-48 KM 42.3 (Hairpin Approach 1)",
        "lat": 18.7548,
        "lng": 73.3756,
        "led_state": "GREEN",
        "warning_active": False,
        "lora_rssi_dbm": -74,
        "lora_freq_mhz": 433.0,
        "solar_charge_pct": 85,
        "battery_pct": 91,
        "status": "ONLINE"
    },
    {
        "id": "RSU-03",
        "name": "Entry Warning Node (Downhill)",
        "location": "NH-48 KM 42.7 (Hairpin Approach 2)",
        "lat": 18.7576,
        "lng": 73.3751,
        "led_state": "GREEN",
        "warning_active": False,
        "lora_rssi_dbm": -79,
        "lora_freq_mhz": 433.0,
        "solar_charge_pct": 92,
        "battery_pct": 96,
        "status": "ONLINE"
    }
]

_in_memory_sensors = {
    "ultrasonic": {
        "distance_m": 18.4,
        "status": "ACTIVE",
        "frequency_khz": 40.0,
        "audio_echo_state": "CONNECTED_PI_AUDIO",
        "label": "Ultrasonic Rangefinder (Sonar / LiDAR-grade)"
    },
    "radar": {
        "target_distance_m": 24.2,
        "doppler_speed_kmh": 42.0,
        "targets_count": 2,
        "status": "ACTIVE",
        "label": "24GHz Doppler Microwave Radar"
    },
    "camera": {
        "active_stream": "http://raspberry.local:8080/stream.mjpg",
        "model": "YOLO11 ONNX (Edge FP16)",
        "status": "ONLINE",
        "fps": 28.5,
        "latency_ms": 28
    },
    "fog_sensor": {
        "density_pct": 24.0,
        "attenuation_coefficient": 0.28,
        "status": "ACTIVE",
        "label": "Optical Scatter Visibility Sensor"
    },
    "thermal": {
        "ambient_temp_c": 19.4,
        "road_surface_temp_c": 17.8,
        "status": "DEMO",
        "label": "Infrared Thermal Surface Profiler"
    },
    "lidar": {
        "point_cloud_density": "8.4k pts/s",
        "status": "DEMO",
        "label": "Solid-State Mini LiDAR"
    }
}

_in_memory_stalled_vehicle = {
    "vehicle_id": "V-102",
    "type": "Heavy Hauler Truck",
    "speed_kmh": 0.0,
    "is_stationary": False,
    "stopped_duration_sec": 0,
    "threshold_sec": 20,
    "location": "Hairpin Apex #4 (KM 42.5)",
    "risk_level": "LOW",  # LOW | MEDIUM | CRITICAL
    "hazard_triggered": False
}

_in_memory_ghat_events: List[Dict[str, Any]] = [
    {
        "id": "EVT-1001",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "event_type": "SYSTEM_START",
        "severity": "NORMAL",
        "source": "GHATGUARD Central",
        "message": "GHATGUARD Road Safety & Fog Detection System initialized online."
    },
    {
        "id": "EVT-1002",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "event_type": "SENSOR_FUSION",
        "severity": "NORMAL",
        "source": "Edge Sensor Hub",
        "message": "Ultrasonic rangefinder and 24GHz radar telemetry active."
    }
]


def get_fog_state() -> Dict[str, Any]:
    return dict(_in_memory_fog)


def update_fog_density(density: float) -> Dict[str, Any]:
    clamped = max(0.0, min(100.0, float(density)))
    _in_memory_fog["density_percent"] = round(clamped, 1)
    # Visibility inversely proportional
    vis = max(10.0, min(100.0, 100.0 - (clamped * 0.88)))
    _in_memory_fog["visibility_score"] = round(vis, 1)

    if clamped < 25:
        _in_memory_fog["status"] = "CLEAR"
    elif clamped < 50:
        _in_memory_fog["status"] = "MODERATE FOG"
    elif clamped < 75:
        _in_memory_fog["status"] = "DENSE FOG"
    else:
        _in_memory_fog["status"] = "CRITICAL VISIBILITY"

    _in_memory_fog["last_update"] = datetime.now(timezone.utc).isoformat()
    return dict(_in_memory_fog)


def get_roadside_units() -> List[Dict[str, Any]]:
    return [dict(r) for r in _in_memory_rsus]


def set_rsu_led_state(led_state: str, rsu_id: Optional[str] = None) -> List[Dict[str, Any]]:
    state = led_state.upper()
    for r in _in_memory_rsus:
        if rsu_id is None or r["id"] == rsu_id:
            r["led_state"] = state
            r["warning_active"] = (state != "GREEN")
    return [dict(r) for r in _in_memory_rsus]


def get_sensors_telemetry() -> Dict[str, Any]:
    return dict(_in_memory_sensors)


def update_ultrasonic_distance(dist_m: float) -> Dict[str, Any]:
    _in_memory_sensors["ultrasonic"]["distance_m"] = round(float(dist_m), 1)
    return dict(_in_memory_sensors)


def get_stalled_vehicle_state() -> Dict[str, Any]:
    return dict(_in_memory_stalled_vehicle)


def update_stalled_vehicle(is_stationary: bool, stopped_sec: int, threshold_sec: Optional[int] = None) -> Dict[str, Any]:
    _in_memory_stalled_vehicle["is_stationary"] = is_stationary
    _in_memory_stalled_vehicle["speed_kmh"] = 0.0 if is_stationary else 36.0
    _in_memory_stalled_vehicle["stopped_duration_sec"] = stopped_sec
    if threshold_sec is not None:
        _in_memory_stalled_vehicle["threshold_sec"] = threshold_sec

    thresh = _in_memory_stalled_vehicle["threshold_sec"]
    if is_stationary and stopped_sec >= thresh:
        _in_memory_stalled_vehicle["risk_level"] = "CRITICAL"
        _in_memory_stalled_vehicle["hazard_triggered"] = True
    elif is_stationary and stopped_sec >= (thresh // 2):
        _in_memory_stalled_vehicle["risk_level"] = "MEDIUM"
        _in_memory_stalled_vehicle["hazard_triggered"] = False
    else:
        _in_memory_stalled_vehicle["risk_level"] = "LOW"
        _in_memory_stalled_vehicle["hazard_triggered"] = False

    return dict(_in_memory_stalled_vehicle)


def get_ghat_events(limit: int = 50) -> List[Dict[str, Any]]:
    return list(reversed(_in_memory_ghat_events[-limit:]))


def record_ghat_event(event_type: str, severity: str, source: str, message: str) -> Dict[str, Any]:
    evt = {
        "id": f"EVT-{uuid.uuid4().hex[:6].upper()}",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "event_type": event_type,
        "severity": severity,
        "source": source,
        "message": message
    }
    _in_memory_ghat_events.append(evt)
    if len(_in_memory_ghat_events) > 200:
        _in_memory_ghat_events.pop(0)
    return evt


def reset_ghat_simulation() -> Dict[str, Any]:
    """Resets all simulation parameters back to green normal road condition."""
    update_fog_density(15.0)
    set_rsu_led_state("GREEN")
    update_stalled_vehicle(is_stationary=False, stopped_sec=0)
    record_ghat_event("RESET", "NORMAL", "Simulation Controller", "System cleared. Corridor reset to SAFE green state.")
    return {
        "status": "SAFE",
        "fog": _in_memory_fog,
        "rsus": _in_memory_rsus,
        "stalled_vehicle": _in_memory_stalled_vehicle
    }
