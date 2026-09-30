export type HazardLevel = 'NORMAL' | 'CAUTION' | 'ALERT';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type ConnectionStatus = 'CONNECTED' | 'NOT CONNECTED';
export type VisibilityStatus = 'Normal' | 'Fog' | 'Low Visibility' | 'Fog / Low Visibility';
export type RsuLedState = 'GREEN' | 'YELLOW' | 'RED';
export type FogCondition = 'CLEAR' | 'MODERATE FOG' | 'DENSE FOG' | 'CRITICAL VISIBILITY';

export interface DetectionCounts {
  car: number;
  truck: number;
  bus: number;
  motorcycle: number;
  person: number;
}

export interface BoundingBox {
  class: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Camera {
  camera_id: string;
  name: string;
  location: string;
  road_section: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  hazard_status: HazardLevel;
  hazard: boolean;
  visibility: VisibilityStatus;
  detections: DetectionCounts;
  vehicle_count: number;
  person_count: number;
  stream_url?: string | null;
  last_ping?: string | null;
}

export interface DetectionRecord {
  id?: string;
  camera_id: string;
  object_class: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  camera_id: string;
  alert_type: string;
  message: string;
  severity: HazardLevel;
  timestamp: string;
  resolved: boolean;
}

export interface SystemHealth {
  raspberry_pi: DeviceStatus;
  yolo11: ConnectionStatus;
  camera: DeviceStatus;
  backend: DeviceStatus;
  database: ConnectionStatus;
  last_update: string;
  mode: 'LIVE' | 'DEMO';
}

// GHATGUARD Extended Entities
export interface FogState {
  density_percent: number;
  visibility_score: number;
  status: FogCondition;
  dew_point_c: number;
  temperature_c: number;
  humidity_percent: number;
  last_update: string;
}

export interface RoadsideUnit {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  led_state: RsuLedState;
  warning_active: boolean;
  lora_rssi_dbm: number;
  lora_freq_mhz: number;
  solar_charge_pct: number;
  battery_pct: number;
  status: DeviceStatus;
}

export interface SensorReadings {
  ultrasonic: {
    distance_m: number;
    status: string;
    frequency_khz: number;
    audio_echo_state: string;
    label: string;
  };
  radar: {
    target_distance_m: number;
    doppler_speed_kmh: number;
    targets_count: number;
    status: string;
    label: string;
  };
  camera: {
    active_stream: string;
    model: string;
    status: string;
    fps: number;
    latency_ms: number;
  };
  fog_sensor: {
    density_pct: number;
    attenuation_coefficient: number;
    status: string;
    label: string;
  };
  thermal: {
    ambient_temp_c: number;
    road_surface_temp_c: number;
    status: string;
    label: string;
  };
  lidar: {
    point_cloud_density: string;
    status: string;
    label: string;
  };
}

export interface StalledVehicleState {
  vehicle_id: string;
  type: string;
  speed_kmh: number;
  is_stationary: boolean;
  stopped_duration_sec: number;
  threshold_sec: number;
  location: string;
  risk_level: 'LOW' | 'MEDIUM' | 'CRITICAL';
  hazard_triggered: boolean;
}

export interface AccidentRiskBreakdown {
  overall_score: number; // 0-100
  fog_factor: number;
  stalled_vehicle_factor: number;
  blind_curve_factor: number;
  traffic_density_factor: number;
  approach_speed_factor: number;
}

export interface GhatEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: HazardLevel;
  source: string;
  message: string;
}

export interface LoRaPacket {
  packet_id: string;
  source: string;
  destination: string;
  frequency_mhz: number;
  rssi_dbm: number;
  payload: string;
  latency_ms: number;
  timestamp: string;
  active: boolean;
}

export interface SimulationStep {
  step: number;
  title: string;
  system_status: 'SAFE' | 'CAUTION' | 'HAZARD';
  description: string;
  action_label: string;
}

export type DashboardView =
  | 'dashboard'
  | 'live_monitor'
  | 'map'
  | 'twin'
  | 'detections'
  | 'events'
  | 'system_health'
  | 'simulation'
  | 'flythrough';
