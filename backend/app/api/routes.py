from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random

from ..schemas.camera import CameraResponse
from ..schemas.detection import DetectionIngestRequest, BoundingBox
from ..schemas.alert import AlertResponse
from ..schemas.status import SystemHealthResponse
from ..database.db import (
    get_all_cameras,
    get_camera,
    get_detections_for_camera,
    get_alerts,
    get_system_health,
    update_camera_stream_url,
    get_fog_state,
    update_fog_density,
    get_roadside_units,
    set_rsu_led_state,
    get_sensors_telemetry,
    update_ultrasonic_distance,
    get_stalled_vehicle_state,
    update_stalled_vehicle,
    get_ghat_events,
    record_ghat_event,
    reset_ghat_simulation
)
from ..services.detection_service import detection_service
from ..services.stream_service import stream_service

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
def get_health() -> SystemHealthResponse:
    """Returns system status across hardware, model, camera, backend, and database."""
    return get_system_health()

@router.get("/cameras", response_model=List[CameraResponse])
def list_cameras() -> List[CameraResponse]:
    """Returns all monitored road cameras and their real-time state."""
    return get_all_cameras()

@router.get("/cameras/{camera_id}", response_model=CameraResponse)
def get_camera_details(camera_id: str) -> CameraResponse:
    """Returns single camera information including hazard status and counts."""
    cam = get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return cam

@router.get("/cameras/{camera_id}/status")
def get_camera_status(camera_id: str) -> Dict[str, Any]:
    """Returns camera live status, hazard state, and visibility."""
    cam = get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return {
        "camera_id": cam.camera_id,
        "name": cam.name,
        "status": cam.status,
        "hazard_status": cam.hazard_status,
        "hazard": cam.hazard,
        "visibility": cam.visibility,
        "road_section": cam.road_section,
        "vehicle_count": cam.vehicle_count,
        "person_count": cam.person_count,
        "last_ping": cam.last_ping
    }

@router.get("/cameras/{camera_id}/detections")
def get_camera_detections(
    camera_id: str,
    limit: int = Query(default=20, ge=1, le=100)
) -> List[Dict[str, Any]]:
    """Returns recent YOLO detections with bounding boxes and confidence for a camera."""
    return get_detections_for_camera(camera_id, limit=limit)

@router.get("/alerts")
def list_alerts(
    resolved: Optional[bool] = None,
    limit: int = Query(default=20, ge=1, le=100)
) -> List[Dict[str, Any]]:
    """Returns recent hazard alerts."""
    return get_alerts(resolved=resolved, limit=limit)

@router.post("/detections")
def ingest_yolo_detections(payload: DetectionIngestRequest) -> Dict[str, Any]:
    """
    Primary ingestion endpoint for Raspberry Pi 4 running YOLO11.
    Accepts detected objects, bounding boxes, and confidence.
    Computes hazard levels and records to Supabase.
    """
    result = detection_service.process_incoming_detections(payload)
    return result

@router.post("/cameras/{camera_id}/heartbeat")
def camera_heartbeat(camera_id: str) -> Dict[str, Any]:
    """Allows Raspberry Pi to send a periodic heartbeat signal."""
    cam = get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return {
        "status": "acknowledged",
        "camera_id": camera_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/simulate-detection")
def simulate_detection(camera_id: str = "CAM001", scenario: str = "caution") -> Dict[str, Any]:
    """
    Developer testing helper to simulate an incoming YOLO detection frame
    from Raspberry Pi without requiring the physical camera online.
    Scenario: 'normal', 'caution', 'alert'
    """
    sample_boxes = []
    if scenario == "caution":
        sample_boxes = [
            BoundingBox(
                **{"class": "car", "confidence": 0.92, "x1": 120.0, "y1": 150.0, "x2": 310.0, "y2": 290.0}
            ),
            BoundingBox(
                **{"class": "motorcycle", "confidence": 0.88, "x1": 420.0, "y1": 200.0, "x2": 490.0, "y2": 310.0}
            )
        ]
    elif scenario == "alert":
        sample_boxes = [
            BoundingBox(
                **{"class": "truck", "confidence": 0.94, "x1": 100.0, "y1": 110.0, "x2": 380.0, "y2": 350.0}
            ),
            BoundingBox(
                **{"class": "car", "confidence": 0.89, "x1": 410.0, "y1": 180.0, "x2": 580.0, "y2": 320.0}
            ),
            BoundingBox(
                **{"class": "car", "confidence": 0.85, "x1": 50.0, "y1": 220.0, "x2": 190.0, "y2": 340.0}
            )
        ]
        
    req = DetectionIngestRequest(
        camera_id=camera_id,
        detections=sample_boxes,
        timestamp=datetime.now(timezone.utc)
    )
    return detection_service.process_incoming_detections(req)


@router.get("/stream/proxy")
async def proxy_live_stream(url: str = Query(default="http://raspberry.local:8080/stream.mjpg")):
    """
    Proxies an MJPEG camera stream to avoid browser CORS, mixed-content,
    or local network blocking.
    """
    return StreamingResponse(
        stream_service.generate_stream_proxy(url),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/stream/check")
async def check_camera_stream(url: str = Query(default="http://raspberry.local:8080/")):
    """
    Probes candidate stream paths on the target host (e.g. /video, /video_feed, /)
    and reports latency, status, and best active stream URL.
    """
    return await stream_service.check_stream(url)


@router.put("/cameras/{camera_id}/stream-url")
def set_camera_stream_url(camera_id: str, payload: Dict[str, str]) -> Dict[str, Any]:
    """
    Dynamically update the live stream URL for a camera.
    """
    stream_url = payload.get("stream_url", "").strip()
    updated = update_camera_stream_url(camera_id, stream_url)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return {
        "status": "success",
        "camera_id": camera_id,
        "stream_url": updated.stream_url
    }


# ==============================================================================
# GHATGUARD: Mini Project & IoT Sensor Endpoints
# ==============================================================================

@router.get("/status")
def get_system_status_overview() -> Dict[str, Any]:
    """
    Executive summary of the road safety system:
    Hazard status, visibility score, active hazards, connected units, and primary camera.
    """
    fog = get_fog_state()
    cameras = get_all_cameras()
    alerts = get_alerts(resolved=False)
    rsus = get_roadside_units()

    primary_cam = cameras[0] if cameras else None
    overall_hazard = "NORMAL"
    if any(c.hazard_status == "ALERT" for c in cameras) or any(r["led_state"] == "RED" for r in rsus):
        overall_hazard = "HAZARD"
    elif any(c.hazard_status == "CAUTION" for c in cameras) or fog["density_percent"] > 45 or any(r["led_state"] == "YELLOW" for r in rsus):
        overall_hazard = "CAUTION"

    return {
        "system": "GHATGUARD",
        "system_status": overall_hazard,
        "visibility_score": fog["visibility_score"],
        "fog_density": fog["density_percent"],
        "fog_status": fog["status"],
        "active_hazards": len(alerts),
        "connected_units": len([r for r in rsus if r["status"] == "ONLINE"]),
        "primary_camera": primary_cam.camera_id if primary_cam else "CAM001",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/road")
def get_road_telemetry() -> Dict[str, Any]:
    """Information regarding the monitored ghat corridor and hairpin curve."""
    return {
        "corridor_name": "Khandala Ghat Safety Corridor",
        "highway": "NH-48",
        "km_marker": "KM 42.5",
        "curve_type": "Sharp Hairpin Turn #4",
        "speed_limit_kmh": 30,
        "advisory_speed_kmh": 20,
        "apex_coordinates": {"lat": 18.7562, "lng": 73.3768},
        "roadside_units": ["RSU-01", "RSU-02", "RSU-03"]
    }


@router.get("/vehicles")
def get_monitored_vehicles() -> Dict[str, Any]:
    """Tracked vehicles in corridor and stationary vehicle monitor state."""
    stalled = get_stalled_vehicle_state()
    return {
        "stalled_vehicle": stalled,
        "active_count": 4 if not stalled["is_stationary"] else 3,
        "monitored_section": "Blind Turn Hairpin #4"
    }


@router.get("/fog")
def get_fog() -> Dict[str, Any]:
    """Real-time optical fog density and meteorological reading."""
    return get_fog_state()


@router.get("/hazards")
def get_hazards() -> List[Dict[str, Any]]:
    """Active blind turn hazards, obstruction warnings, and collision risks."""
    return get_alerts(resolved=False)


@router.get("/sensors")
def get_sensors() -> Dict[str, Any]:
    """Telemetry across Ultrasonic rangefinder, 24GHz radar, LiDAR, and optical fog sensor."""
    return get_sensors_telemetry()


@router.get("/roadside-units")
def get_roadside_units_list() -> List[Dict[str, Any]]:
    """Returns RSU-01, RSU-02, and RSU-03 statuses, LED states, LoRa RSSI, and solar power."""
    return get_roadside_units()


@router.get("/events")
def get_events_history(limit: int = Query(default=50, ge=1, le=100)) -> List[Dict[str, Any]]:
    """Live chronological audit feed of road safety events."""
    return get_ghat_events(limit=limit)


@router.post("/simulation/fog")
def simulate_fog_change(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Controls the simulated fog density (0-100%)."""
    density = float(payload.get("density", 50.0))
    updated = update_fog_density(density)
    
    # Auto-adjust hazard and RSU if fog is dense
    if density >= 60:
        set_rsu_led_state("YELLOW")
        record_ghat_event(
            "FOG_WARNING",
            "CAUTION",
            "Optical Scatter Sensor",
            f"Dense fog detected ({density}%). RSU roadside warning LEDs switched to YELLOW."
        )
    elif density < 30:
        set_rsu_led_state("GREEN")

    return updated


@router.post("/simulation/vehicle")
def simulate_vehicle_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates vehicle stopping or resuming motion.
    action: 'stop' | 'resume'
    """
    action = payload.get("action", "stop")
    threshold_sec = payload.get("threshold_sec", 20)
    
    if action == "stop":
        stopped_sec = int(payload.get("stopped_sec", 22))
        res = update_stalled_vehicle(is_stationary=True, stopped_sec=stopped_sec, threshold_sec=threshold_sec)
        record_ghat_event(
            "STATIONARY_VEHICLE",
            "ALERT" if res["hazard_triggered"] else "CAUTION",
            "YOLO11 Edge AI",
            f"Vehicle V-102 stationary at Blind Turn Apex for {stopped_sec}s (Threshold: {threshold_sec}s)."
        )
    else:
        res = update_stalled_vehicle(is_stationary=False, stopped_sec=0, threshold_sec=threshold_sec)
        record_ghat_event(
            "VEHICLE_RESUMED",
            "NORMAL",
            "YOLO11 Edge AI",
            "Vehicle V-102 resumed transit. Apex obstruction cleared."
        )
    return res


@router.post("/simulation/hazard")
def simulate_hazard_trigger(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fires an accident prevention hazard sequence:
    1. Sets RSU LEDs to RED.
    2. Logs LoRa packet propagation RSU-01 -> RSU-02 -> RSU-03.
    """
    hazard_type = payload.get("type", "BLIND_CURVE_HAZARD")
    message = payload.get("message", "Imminent collision hazard at Blind Hairpin Curve #4 Apex.")
    
    set_rsu_led_state("RED")
    record_ghat_event("HAZARD_GENERATED", "ALERT", "Hazard Engine", message)
    record_ghat_event("LORA_TRANSMIT", "ALERT", "LoRa Node RSU-01", "Packet HZD-001 propagated via LoRa 433MHz to RSU-02 and RSU-03 (18ms).")
    record_ghat_event("WARNING_ACTIVE", "ALERT", "Roadside Unit Network", "High-intensity RED roadside strobe LEDs activated on approach curves.")

    return {
        "status": "HAZARD_ACTIVATED",
        "hazard_type": hazard_type,
        "led_state": "RED",
        "lora_packet": "HZD-001",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/simulation/clear")
def simulate_clear_system() -> Dict[str, Any]:
    """Clears all hazards and returns GHATGUARD to green SAFE state."""
    return reset_ghat_simulation()


@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health_alias() -> SystemHealthResponse:
    """Alternative standard route for system health."""
    return get_system_health()
