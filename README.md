# Intelligent Road Safety and Blind-Turn Hazard Detection System

A modern, production-oriented prototype for monitoring dangerous road sections such as:
- **Sharp blind turns**
- **Ghat / mountain roads**
- **Fog-prone & low-visibility sectors**
- **Locations where stopped or broken-down vehicles create collision hazards**

---

## 1. System Architecture & Data Flow

```
   Phone Camera (IP Webcam / RTSP)
                ↓
   Raspberry Pi 4 (Edge Inference Unit)
                ↓
       YOLO11 Object Detection
                ↓
    Detection JSON (x1, y1, x2, y2, conf)
                ↓
     FastAPI Backend (Port 8000)
                ↓
     Supabase PostgreSQL Database
                ↓
    React Dashboard (Vite + TypeScript)
```

The system strictly avoids faking hardware connections:
- In **LIVE MODE**, if the Raspberry Pi 4 or camera stream is offline, the console displays `"Camera not connected"` and reports hardware status as **OFFLINE**.
- In **DEMO MODE** (`VITE_DEMO_MODE=true`), controlled sample road scenarios and simulated roadway geometry are loaded for UI evaluation and client demonstrations.

---

## 2. Directory Structure

```
drive_safe/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py             # API endpoints (/cameras, /detections, /health, /alerts)
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── settings.py           # Pydantic environment settings
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── db.py                 # Repository layer & seed logic
│   │   │   ├── supabase_client.py    # Supabase connection
│   │   │   └── supabase_schema.sql   # SQL migration schema
│   │   ├── schemas/
│   │   │   ├── alert.py
│   │   │   ├── camera.py
│   │   │   ├── detection.py
│   │   │   └── status.py
│   │   ├── services/
│   │   │   ├── detection_service.py  # Ingestion & edge reasoning
│   │   │   └── hazard_service.py     # Blind-turn hazard rules (NORMAL, CAUTION, ALERT)
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI application entrypoint
│   ├── scripts/
│   │   └── raspberry_pi_yolo11_client.py # Edge client for Raspberry Pi 4 & phone camera
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertPanel.tsx        # Hazard warning & event log
│   │   │   ├── BlindTurnSection.tsx  # Monitored road section view
│   │   │   ├── CameraCard.tsx        # Individual camera monitoring card
│   │   │   ├── CameraDetails.tsx     # Full inspection modal with stream view
│   │   │   ├── Dashboard.tsx         # Main KPI metrics & overview
│   │   │   ├── DetectionPanel.tsx    # YOLO11 bounding box canvas & counts
│   │   │   ├── HardwareGuideModal.tsx# Edge connection modal
│   │   │   ├── Header.tsx            # Telemetry status strip & mode toggle
│   │   │   ├── MapView.tsx           # Interactive Leaflet map with custom markers
│   │   │   ├── Sidebar.tsx           # Left navigation bar
│   │   │   └── SystemStatus.tsx      # Diagnostic health check console
│   │   ├── services/
│   │   │   ├── api.ts                # Central API client
│   │   │   └── mockData.ts           # Controlled demo scenarios
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx                   # Main state & view controller
│   │   ├── main.tsx
│   │   └── index.css                 # Control-room styling tokens
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── .env
├── HARDWARE_INTEGRATION.md           # Step-by-step edge hardware guide
└── .env.example                      # Root environment reference
```

---

## 3. Database Schema (Supabase / PostgreSQL)

The database schema is defined in [backend/database/supabase_schema.sql](file:///f:/drive_safe/backend/database/supabase_schema.sql) and includes:
- `cameras`: Camera ID, location, road section, lat/long, status, hazard status, visibility, vehicle counts.
- `detections`: Ingested YOLO detections with bounding boxes (`x1, y1, x2, y2`) and confidence.
- `alerts`: Road hazard alerts with severity (`NORMAL`, `CAUTION`, `ALERT`).
- `system_status`: Component heartbeats (`raspberry_pi`, `yolo11`, `camera`, `backend`, `database`).

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Run the FastAPI Backend
```bash
cd backend
# Create virtual environment if not already created
python -m venv venv
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/Mac)

# Install dependencies
pip install -r requirements.txt

# Start backend server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`.

### 2. Run the React Frontend
```bash
cd frontend
# Install npm packages
npm install

# Start Vite development server on port 5173
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Connecting Raspberry Pi 4 & Phone Camera Later

See [HARDWARE_INTEGRATION.md](file:///f:/drive_safe/HARDWARE_INTEGRATION.md) for full hardware wiring.
On the Raspberry Pi 4:
```bash
python backend/scripts/raspberry_pi_yolo11_client.py \
  --camera-id CAM001 \
  --stream "http://<PHONE_IP>:8080/video" \
  --backend "http://<SERVER_IP>:8000"
```
The script will stream detections directly to `POST /api/detections`, dynamically updating the web dashboard.
