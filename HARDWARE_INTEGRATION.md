# Hardware Integration & YOLO11 Edge Deployment Guide

This document describes how to connect physical hardware (Android Phone Camera, Raspberry Pi 4, and YOLO11 object detection) to the **Intelligent Road Safety and Blind-Turn Hazard Detection System**.

---

## 1. System Hardware Architecture

```
 Android Phone Camera (IP Webcam / RTSP)
                ↓  (Local WiFi / Hotspot Stream)
       Raspberry Pi 4 (Edge Compute Unit)
                ↓  (Ultralytics YOLO11 Inference)
        Detection Bounding Boxes & Confidence JSON
                ↓  (HTTP POST /api/detections)
        FastAPI Backend Server (Cloud / Local)
                ↓  (SQL Upsert / Realtime Alerts)
         Supabase PostgreSQL Database
                ↓
    React Dashboard Control Room Console
```

---

## 2. Step 1: Android Phone Camera Configuration

1. Install **IP Webcam** (by Pavel Khlebovich) or any RTSP camera app from the Google Play Store on an Android phone.
2. Connect both the Android phone and the Raspberry Pi 4 to the same WiFi network (or enable Hotspot on the Raspberry Pi / Phone).
3. Open the app, scroll to the bottom, and tap **"Start server"**.
4. The phone displays an active stream URL:
   - Example: `http://192.168.1.105:8080/video` or RTSP `rtsp://192.168.1.105:8080/h264_pcm.sdp`.

---

## 3. Step 2: Raspberry Pi 4 Environment Setup

On the Raspberry Pi 4 (Raspberry Pi OS 64-bit recommended):

```bash
# Update system packages
sudo apt update && sudo apt install -y python3-pip python3-opencv libgl1 libglib2.0-0

# Install Python inference and networking packages
pip install --upgrade pip
pip install opencv-python ultralytics requests
```

---

## 4. Step 3: Run the Edge Ingestion Script

The repository includes a ready-to-run edge client at [backend/scripts/raspberry_pi_yolo11_client.py](file:///f:/drive_safe/backend/scripts/raspberry_pi_yolo11_client.py).

### Run with physical Android Phone camera:
```bash
python backend/scripts/raspberry_pi_yolo11_client.py \
  --camera-id CAM001 \
  --stream "http://192.168.1.105:8080/video" \
  --backend "http://YOUR_SERVER_IP:8000"
```

### Run with local USB webcam (Device 0):
```bash
python backend/scripts/raspberry_pi_yolo11_client.py \
  --camera-id CAM001 \
  --stream 0 \
  --backend "http://YOUR_SERVER_IP:8000"
```

### Run in simulation mode (no hardware required):
```bash
python backend/scripts/raspberry_pi_yolo11_client.py \
  --camera-id CAM001 \
  --backend "http://localhost:8000" \
  --simulate
```

---

## 5. Ingestion Protocol (`POST /api/detections`)

Every inference cycle (e.g. 2-5 FPS), the Raspberry Pi sends detection records to the backend:

```json
{
  "camera_id": "CAM001",
  "detections": [
    {
      "class": "truck",
      "confidence": 0.94,
      "x1": 100.5,
      "y1": 120.0,
      "x2": 380.0,
      "y2": 350.5
    },
    {
      "class": "car",
      "confidence": 0.89,
      "x1": 410.0,
      "y1": 180.0,
      "x2": 580.0,
      "y2": 320.0
    }
  ],
  "timestamp": "2026-09-29T18:00:00Z"
}
```

### Backend Hazard Assessment Logic:
1. **ALERT**:
   - Pedestrian detected on blind roadway curve.
   - Multiple commercial vehicles (truck/bus) queued on narrow ghat section.
   - Stopped vehicle obstruction occupying roadway.
2. **CAUTION**:
   - Vehicles entering monitored blind-turn sector.
   - Heavy commercial vehicle navigating hairpin turn with oncoming traffic.
3. **NORMAL**:
   - Clear roadway with no vehicles or obstacles detected.

---

## 6. Verification and Health Checking

The dashboard automatically transitions `Raspberry Pi`, `YOLO11`, and `Camera` from **OFFLINE** to **ONLINE** when heartbeat and detection packets arrive. If transmissions cease for more than 30 seconds, status automatically reverts to **OFFLINE**, strictly adhering to hardware truth.
