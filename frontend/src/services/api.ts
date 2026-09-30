import type { Camera, Alert, SystemHealth, BoundingBox } from '../types';
import { MOCK_CAMERAS, MOCK_ALERTS, MOCK_BOUNDING_BOXES, MOCK_SYSTEM_HEALTH } from './mockData';

// API base URL configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Configurable demo mode switch
let isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

// Allow runtime override for interactive testing
export const setDemoModeState = (enabled: boolean) => {
  isDemoMode = enabled;
};

export const getDemoModeState = () => isDemoMode;
export const getApiBaseUrl = () => API_BASE_URL;

export const api = {
  // Fetch all cameras
  async getCameras(): Promise<Camera[]> {
    if (isDemoMode) {
      return [...MOCK_CAMERAS];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cameras`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error fetching cameras, falling back to mock data:', err);
      return [...MOCK_CAMERAS];
    }
  },

  // Fetch single camera
  async getCamera(cameraId: string): Promise<Camera | null> {
    if (isDemoMode) {
      return MOCK_CAMERAS.find((c) => c.camera_id === cameraId) || null;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cameras/${cameraId}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`API error fetching camera ${cameraId}:`, err);
      return MOCK_CAMERAS.find((c) => c.camera_id === cameraId) || null;
    }
  },

  // Fetch detections bounding boxes for a camera
  async getCameraDetections(cameraId: string): Promise<BoundingBox[]> {
    if (isDemoMode) {
      return MOCK_BOUNDING_BOXES[cameraId] || [];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cameras/${cameraId}/detections`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const raw = await res.json();
      // map backend detection record format to BoundingBox
      return raw.map((d: any) => ({
        class: d.object_class,
        confidence: d.confidence,
        x1: d.x1,
        y1: d.y1,
        x2: d.x2,
        y2: d.y2,
      }));
    } catch (err) {
      console.warn(`API error fetching detections for ${cameraId}:`, err);
      return MOCK_BOUNDING_BOXES[cameraId] || [];
    }
  },

  // Fetch alerts
  async getAlerts(): Promise<Alert[]> {
    if (isDemoMode) {
      return [...MOCK_ALERTS];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error fetching alerts:', err);
      return [...MOCK_ALERTS];
    }
  },

  // Fetch system health
  async getSystemHealth(): Promise<SystemHealth> {
    if (isDemoMode) {
      return { ...MOCK_SYSTEM_HEALTH, last_update: new Date().toISOString() };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        mode: 'LIVE',
      };
    } catch (err) {
      console.warn('Backend offline, returning disconnected state');
      return {
        raspberry_pi: 'OFFLINE',
        yolo11: 'NOT CONNECTED',
        camera: 'OFFLINE',
        backend: 'OFFLINE',
        database: 'NOT CONNECTED',
        last_update: new Date().toISOString(),
        mode: 'LIVE',
      };
    }
  },

  // Ingest detection simulation or forward from UI
  async ingestDetections(
    cameraId: string,
    detections: BoundingBox[]
  ): Promise<any> {
    if (isDemoMode) {
      // In demo mode update local mock state
      MOCK_BOUNDING_BOXES[cameraId] = detections;
      const cam = MOCK_CAMERAS.find((c) => c.camera_id === cameraId);
      if (cam) {
        const counts = { car: 0, truck: 0, bus: 0, motorcycle: 0, person: 0 };
        detections.forEach((b) => {
          const cls = b.class.toLowerCase() as keyof typeof counts;
          if (counts[cls] !== undefined) counts[cls]++;
        });
        cam.detections = counts;
        cam.vehicle_count = counts.car + counts.truck + counts.bus + counts.motorcycle;
        cam.person_count = counts.person;
        cam.hazard = cam.vehicle_count > 3 || counts.truck > 1 || counts.person > 0;
        cam.hazard_status = cam.person_count > 0 || counts.truck > 1 ? 'ALERT' : cam.vehicle_count > 0 ? 'CAUTION' : 'NORMAL';
      }
      return { success: true, mode: 'demo' };
    }
    const res = await fetch(`${API_BASE_URL}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: cameraId,
        detections,
        timestamp: new Date().toISOString(),
      }),
    });
    return await res.json();
  },

  // Update camera stream URL
  async updateCameraStreamUrl(cameraId: string, streamUrl: string): Promise<any> {
    const cam = MOCK_CAMERAS.find((c) => c.camera_id === cameraId);
    if (cam) {
      cam.stream_url = streamUrl;
    }
    if (isDemoMode) {
      return { status: 'success', camera_id: cameraId, stream_url: streamUrl };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cameras/${cameraId}/stream-url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_url: streamUrl }),
      });
      return await res.json();
    } catch (err) {
      console.warn('Error updating camera stream URL on backend:', err);
      return { status: 'success', camera_id: cameraId, stream_url: streamUrl };
    }
  },

  // Diagnostic check for camera stream reachability
  async checkStreamUrl(url: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stream/check?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend might be offline or check failed
    }
    return {
      target: url,
      is_reachable: false,
      latency_ms: null,
      working_endpoint: null,
      details: 'Check failed. Ensure backend and target stream device are reachable.',
    };
  },

  // Get stream proxy URL to avoid browser CORS/mixed-content blocks
  getStreamProxyUrl(url: string): string {
    return `${API_BASE_URL}/api/stream/proxy?url=${encodeURIComponent(url)}`;
  },

  // GHATGUARD: Get system status overview
  async getStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return {
      system: 'GHATGUARD',
      system_status: 'NORMAL',
      visibility_score: 88.0,
      fog_density: 24.0,
      fog_status: 'CLEAR',
      active_hazards: 0,
      connected_units: 3,
      primary_camera: 'CAM001',
      timestamp: new Date().toISOString(),
    };
  },

  // GHATGUARD: Get Fog & Visibility telemetry
  async getFog(): Promise<import('../types').FogState> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fog`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const { MOCK_FOG_STATE } = await import('./mockData');
    return { ...MOCK_FOG_STATE };
  },

  // GHATGUARD: Get Roadside Units (RSU-01, 02, 03)
  async getRoadsideUnits(): Promise<import('../types').RoadsideUnit[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roadside-units`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const { MOCK_ROADSIDE_UNITS } = await import('./mockData');
    return [...MOCK_ROADSIDE_UNITS];
  },

  // GHATGUARD: Get Sensors (Ultrasonic with audio sonar, Radar, LiDAR, Camera)
  async getSensors(): Promise<import('../types').SensorReadings> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const { MOCK_SENSORS } = await import('./mockData');
    return { ...MOCK_SENSORS };
  },

  // GHATGUARD: Get Stalled Vehicle State
  async getStalledVehicle(): Promise<import('../types').StalledVehicleState> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vehicles`);
      if (res.ok) {
        const data = await res.json();
        return data.stalled_vehicle;
      }
    } catch {
      // Fallback
    }
    const { MOCK_STALLED_VEHICLE } = await import('./mockData');
    return { ...MOCK_STALLED_VEHICLE };
  },

  // GHATGUARD: Get Events History
  async getEvents(limit = 50): Promise<import('../types').GhatEvent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events?limit=${limit}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const { MOCK_GHAT_EVENTS } = await import('./mockData');
    return [...MOCK_GHAT_EVENTS];
  },

  // GHATGUARD: Simulation - adjust fog density
  async simulateFog(density: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/fog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ density }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { density_percent: density, status: density > 60 ? 'DENSE FOG' : 'CLEAR' };
  },

  // GHATGUARD: Simulation - stop or resume vehicle
  async simulateVehicle(action: 'stop' | 'resume', stopped_sec = 22, threshold_sec = 20): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stopped_sec, threshold_sec }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { action, stopped_sec, is_stationary: action === 'stop' };
  },

  // GHATGUARD: Simulation - fire accident prevention hazard sequence
  async simulateHazard(type = 'BLIND_CURVE_HAZARD', message?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/hazard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { status: 'HAZARD_ACTIVATED', led_state: 'RED' };
  },

  // GHATGUARD: Simulation - clear all hazards back to green
  async simulateClear(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/clear`, {
        method: 'POST',
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { status: 'SAFE' };
  },
};
