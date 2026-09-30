#!/usr/bin/env python3
"""
DriveSafe - Live Stream & YOLO Detection Bridge
===============================================
Connects to the object detection system running at http://raspberry.local:8080/
and synchronizes live frames, heartbeats, and detections with the FastAPI backend.

Usage:
  python live_stream_bridge.py --stream http://raspberry.local:8080/ --backend http://localhost:8000
"""

import argparse
import time
import datetime
import httpx
import logging
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("StreamBridge")

def run_bridge(stream_url: str, backend_url: str, camera_id: str = "CAM001", interval_sec: float = 1.0):
    clean_stream = stream_url.rstrip("/")
    clean_backend = backend_url.rstrip("/")
    detections_endpoint = f"{clean_backend}/api/detections"
    heartbeat_endpoint = f"{clean_backend}/api/cameras/{camera_id}/heartbeat"

    logger.info(f"Starting DriveSafe Stream Bridge for Camera [{camera_id}]")
    logger.info(f"Target Stream Source : {clean_stream}")
    logger.info(f"FastAPI Backend Target: {clean_backend}")

    # Check candidate detection endpoints on stream host
    candidate_api_paths = ["/detections", "/results", "/api/detections", "/json"]

    with httpx.Client(timeout=3.0) as client:
        # First notify backend about stream URL
        try:
            client.put(f"{clean_backend}/api/cameras/{camera_id}/stream-url", json={"stream_url": f"{clean_stream}/video"})
            logger.info("Successfully updated camera stream URL in backend.")
        except Exception as e:
            logger.warning(f"Could not update stream URL in backend: {e}")

        while True:
            try:
                # 1. Check if stream host has JSON detections API
                detection_found = False
                for path in candidate_api_paths:
                    try:
                        res = client.get(f"{clean_stream}{path}", timeout=1.5)
                        if res.status_code == 200 and "application/json" in res.headers.get("content-type", ""):
                            data = res.json()
                            raw_boxes = data.get("detections") or data.get("boxes") or []
                            
                            # Forward to backend
                            payload = {
                                "camera_id": camera_id,
                                "detections": raw_boxes,
                                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                            }
                            post_res = client.post(detections_endpoint, json=payload, timeout=2.0)
                            logger.info(f"Forwarded live detection from {path}: {post_res.json().get('hazard_status')}")
                            detection_found = True
                            break
                    except Exception:
                        pass

                # 2. If no JSON endpoint, send heartbeat if stream root is reachable
                if not detection_found:
                    try:
                        probe = client.get(clean_stream, timeout=1.5)
                        if probe.status_code in [200, 301, 302]:
                            # Stream is online! Send heartbeat to backend
                            hb_res = client.post(heartbeat_endpoint, timeout=1.5)
                            logger.info(f"Stream {clean_stream} ONLINE -> Heartbeat ACK: {hb_res.status_code}")
                        else:
                            logger.warning(f"Stream returned status: {probe.status_code}")
                    except httpx.ConnectTimeout:
                        logger.warning(f"Stream {clean_stream} connection timed out. Retrying...")
                    except httpx.ConnectError:
                        logger.warning(f"Stream {clean_stream} host unreachable. Retrying...")

            except Exception as loop_err:
                logger.error(f"Bridge loop error: {loop_err}")

            time.sleep(interval_sec)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Stream & YOLO Detection Bridge")
    parser.add_argument("--stream", default="http://raspberry.local:8080/", help="YOLO / Camera stream URL")
    parser.add_argument("--backend", default="http://localhost:8000", help="FastAPI Backend URL")
    parser.add_argument("--camera-id", default="CAM001", help="Target Camera ID")
    parser.add_argument("--interval", type=float, default=2.0, help="Poll interval in seconds")
    args = parser.parse_args()

    run_bridge(
        stream_url=args.stream,
        backend_url=args.backend,
        camera_id=args.camera_id,
        interval_sec=args.interval
    )
