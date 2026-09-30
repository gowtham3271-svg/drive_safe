#!/usr/bin/env python3
"""
Raspberry Pi 4 - YOLO11 Road Hazard Detection Client
====================================================
This script is deployed on the Raspberry Pi 4 located at the blind-turn road section.
It captures video frames from an Android phone camera (IP Webcam / RTSP) or USB camera,
runs YOLO11 inference, filters road obstacles/vehicles, and POSTs detections to the
FastAPI backend server.

Requirements on Raspberry Pi:
  pip install opencv-python ultralytics requests
"""

import argparse
import time
import datetime
import requests
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Pi-YOLO11-Client")

TARGET_CLASSES = {"car", "truck", "bus", "motorcycle", "person"}

def run_pi_client(
    camera_id: str,
    stream_source: str,
    backend_url: str,
    simulate: bool = False,
    model_name: str = "yolo11n.pt",
    post_interval_sec: float = 0.5
):
    ingest_endpoint = f"{backend_url.rstrip('/')}/api/detections"
    heartbeat_endpoint = f"{backend_url.rstrip('/')}/api/cameras/{camera_id}/heartbeat"

    logger.info(f"Starting Pi Road Hazard Detection Client for {camera_id}")
    logger.info(f"Target backend: {ingest_endpoint}")
    
    if simulate:
        logger.info("Running in SIMULATION mode (generating realistic synthetic blind-turn scenarios)...")
        import random
        scenarios = [
            # Normal clear road
            [],
            # Approaching car
            [{"class": "car", "confidence": 0.92, "x1": 210, "y1": 180, "x2": 360, "y2": 290}],
            # Two vehicles in blind curve
            [
                {"class": "car", "confidence": 0.89, "x1": 140, "y1": 160, "x2": 290, "y2": 270},
                {"class": "motorcycle", "confidence": 0.85, "x1": 390, "y1": 210, "x2": 450, "y2": 300}
            ],
            # Truck breakdown / obstruction
            [
                {"class": "truck", "confidence": 0.95, "x1": 100, "y1": 120, "x2": 380, "y2": 360},
                {"class": "car", "confidence": 0.88, "x1": 410, "y1": 190, "x2": 580, "y2": 320},
                {"class": "person", "confidence": 0.82, "x1": 80, "y1": 220, "x2": 130, "y2": 340}
            ]
        ]
        
        while True:
            # Pick a scenario
            detections = random.choice(scenarios)
            payload = {
                "camera_id": camera_id,
                "detections": detections,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            try:
                res = requests.post(ingest_endpoint, json=payload, timeout=3.0)
                logger.info(f"Simulated frame sent -> HTTP {res.status_code}: {res.json().get('hazard_status')} ({len(detections)} objects)")
            except Exception as e:
                logger.warning(f"Failed to reach backend: {e}")
            time.sleep(post_interval_sec * 4)
            
    # Real Hardware Execution Path
    try:
        import cv2
        from ultralytics import YOLO
    except ImportError:
        logger.error("Required libraries (opencv-python, ultralytics) are missing for hardware mode.")
        logger.error("Install with: pip install opencv-python ultralytics")
        return

    logger.info(f"Loading YOLO11 model: {model_name}...")
    model = YOLO(model_name)

    # Initialize video capture from phone camera (IP / RTSP / V4L2)
    # Stream source can be:
    # - 0 (local USB webcam)
    # - "http://192.168.1.100:8080/video" (Android IP Webcam app)
    # - "rtsp://192.168.1.100:554/live"
    capture_src = int(stream_source) if stream_source.isdigit() else stream_source
    logger.info(f"Connecting to video stream: {capture_src}...")
    cap = cv2.VideoCapture(capture_src)

    if not cap.isOpened():
        logger.error(f"Cannot open camera stream from {capture_src}")
        return

    last_post_time = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            logger.warning("Failed to grab frame from camera stream. Reconnecting in 2s...")
            time.sleep(2)
            cap = cv2.VideoCapture(capture_src)
            continue

        now = time.time()
        if now - last_post_time < post_interval_sec:
            continue

        last_post_time = now

        # Run inference
        results = model.predict(source=frame, verbose=False, conf=0.4)
        boxes_out = []

        for r in results:
            for box in r.boxes:
                cls_idx = int(box.cls[0])
                cls_name = model.names[cls_idx]
                conf = float(box.conf[0])
                
                if cls_name.lower() in TARGET_CLASSES:
                    coords = box.xyxy[0].tolist()
                    boxes_out.append({
                        "class": cls_name.lower(),
                        "confidence": round(conf, 2),
                        "x1": round(coords[0], 1),
                        "y1": round(coords[1], 1),
                        "x2": round(coords[2], 1),
                        "y2": round(coords[3], 1)
                    })

        # Send detection payload to backend
        payload = {
            "camera_id": camera_id,
            "detections": boxes_out,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        try:
            res = requests.post(ingest_endpoint, json=payload, timeout=2.0)
            if res.status_code == 200:
                logger.info(f"Ingested {len(boxes_out)} objects -> Status: {res.json().get('hazard_status')}")
        except Exception as e:
            logger.warning(f"Could not reach backend API: {e}")

    cap.release()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Raspberry Pi YOLO11 Ingestion Client")
    parser.add_argument("--camera-id", default="CAM001", help="Camera ID to report as")
    parser.add_argument("--stream", default="http://raspberry.local:8080/stream.mjpg", help="Camera stream URL or device index (e.g. http://raspberry.local:8080/stream.mjpg or 0)")
    parser.add_argument("--backend", default="http://localhost:8000", help="FastAPI backend URL")
    parser.add_argument("--simulate", action="store_true", help="Run simulation mode without hardware")
    args = parser.parse_args()

    run_pi_client(
        camera_id=args.camera_id,
        stream_source=args.stream,
        backend_url=args.backend,
        simulate=args.simulate
    )
