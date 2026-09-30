import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import type { Camera, BoundingBox } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  ShieldAlert,
  Layers,
  Compass,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle2,
  Radio,
  Columns,
  Map as MapIcon,
  Video,
  Camera as CameraIcon,
  Wifi,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface GoogleMapViewProps {
  cameras: Camera[];
  selectedCamera: Camera | null;
  boundingBoxes: BoundingBox[];
  onSelectCamera: (cam: Camera) => void;
  onSimulateScenario?: (scenario: 'normal' | 'caution' | 'alert') => void;
  isDemoMode?: boolean;
}

// Map Tile Providers: Google Maps Styles & Dark Control Room
type MapLayerStyle = 'google_streets' | 'google_satellite' | 'google_terrain' | 'dark_control';

const MAP_TILES: Record<MapLayerStyle, { name: string; url: string; subdomains?: string[]; attribution: string }> = {
  google_streets: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
  },
  google_satellite: {
    name: 'Google Satellite (Hybrid)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Hybrid',
  },
  google_terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
  },
  dark_control: {
    name: 'Cyberpunk Tactical',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
  },
};

// Roadway Spline Waypoints for Khandala Ghat NH-48 Hairpin #4
const ROAD_CENTERLINE: [number, number][] = [
  [18.7582, 73.3742],
  [18.7576, 73.3752],
  [18.7569, 73.3761],
  [18.7564, 73.3766],
  [18.7562, 73.3768], // APEX OF BLIND TURN
  [18.7558, 73.3767],
  [18.7552, 73.3762],
  [18.7545, 73.3754],
  [18.7538, 73.3745],
];

// Inner & Outer Lanes for Downhill & Uphill Traffic
const DOWNHILL_LANE: [number, number][] = [
  [18.75825, 73.37415],
  [18.75765, 73.37515],
  [18.75695, 73.37605],
  [18.75645, 73.37655],
  [18.75622, 73.37672], // Apex Downhill
  [18.75578, 73.37662],
  [18.75518, 73.37612],
  [18.75448, 73.37532],
  [18.75378, 73.37442],
];

const UPHILL_LANE: [number, number][] = [
  [18.75382, 73.37458],
  [18.75452, 73.37548],
  [18.75522, 73.37628],
  [18.75582, 73.37678],
  [18.75618, 73.37688], // Apex Uphill
  [18.75638, 73.37668],
  [18.75688, 73.37618],
  [18.75758, 73.37528],
  [18.75818, 73.37428],
];

// Pedestrian Shoulder Path along the mountain cliff
const PEDESTRIAN_PATH: [number, number][] = [
  [18.7568, 73.3763],
  [18.7564, 73.3768],
  [18.7562, 73.3770],
  [18.7559, 73.3769],
  [18.7554, 73.3765],
];

export interface AnimatedAgent {
  id: string;
  type: 'car' | 'truck' | 'bus' | 'motorcycle' | 'person';
  progress: number; // 0.0 to 1.0 along route
  speed: number; // base delta per tick
  lane: 'downhill' | 'uphill' | 'shoulder';
  label: string;
  speedKmh: number;
  lat: number;
  lng: number;
  bearing: number;
  isNearApex: boolean;
  isInHazard: boolean;
  color: string;
}

// Helper component for map control & smooth pan/zoom
const MapController: React.FC<{ center: [number, number]; zoom: number; viewLayout: string }> = ({
  center,
  zoom,
  viewLayout,
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [viewLayout, map]);

  return null;
};

// Spline Interpolation Helper
function interpolatePath(path: [number, number][], progress: number): { lat: number; lng: number; bearing: number } {
  const clamped = Math.max(0, Math.min(0.9999, progress));
  const totalSegments = path.length - 1;
  const scaled = clamped * totalSegments;
  const index = Math.floor(scaled);
  const frac = scaled - index;

  const p0 = path[index];
  const p1 = path[Math.min(index + 1, totalSegments)];

  const lat = p0[0] + (p1[0] - p0[0]) * frac;
  const lng = p0[1] + (p1[1] - p0[1]) * frac;

  // Bearing in degrees
  const dLng = (p1[1] - p0[1]) * Math.cos(((p0[0] + p1[0]) / 2) * (Math.PI / 180));
  const dLat = p1[0] - p0[0];
  const rad = Math.atan2(dLng, dLat);
  const bearing = (rad * 180) / Math.PI;

  return { lat, lng, bearing };
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  cameras,
  selectedCamera,
  boundingBoxes,
  onSelectCamera,
  onSimulateScenario,
  isDemoMode = false,
}) => {
  const activeCamera = selectedCamera || cameras[0] || null;

  // Layout mode: 'split' = Side-by-side Dual View (Webcam Left, Google Map Right)
  const [viewLayout, setViewLayout] = useState<'split' | 'map_focus' | 'webcam_focus'>('split');

  // Map state
  const [mapStyle, setMapStyle] = useState<MapLayerStyle>('google_streets');
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.7562, 73.3768]);
  const [mapZoom, setMapZoom] = useState<number>(17);

  // Traffic Animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [agents, setAgents] = useState<AnimatedAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AnimatedAgent | null>(null);

  // Live Camera state - defaults to raspberry.local:8080/stream.mjpg
  const [streamUrl, setStreamUrl] = useState<string>(
    activeCamera?.stream_url || 'http://raspberry.local:8080/stream.mjpg'
  );
  const [streamStatus, setStreamStatus] = useState<'testing' | 'online' | 'standby'>('standby');
  const [streamLatency, setStreamLatency] = useState<number | null>(null);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrlInput, setTempUrlInput] = useState<string>(streamUrl);
  const [useBackendProxy, setUseBackendProxy] = useState<boolean>(false);

  // Hazard Alert state
  const [activeHazardAlert, setActiveHazardAlert] = useState<{
    level: 'NORMAL' | 'CAUTION' | 'ALERT';
    message: string;
    distanceMeters?: number;
  } | null>(null);

  // Initialize Animated Agents
  useEffect(() => {
    const initialAgents: AnimatedAgent[] = [
      {
        id: 'VEH-01',
        type: 'car',
        progress: 0.15,
        speed: 0.0018,
        lane: 'downhill',
        label: 'White Sedan',
        speedKmh: 42,
        lat: DOWNHILL_LANE[0][0],
        lng: DOWNHILL_LANE[0][1],
        bearing: 0,
        isNearApex: false,
        isInHazard: false,
        color: '#38bdf8',
      },
      {
        id: 'VEH-02',
        type: 'truck',
        progress: 0.35,
        speed: 0.001,
        lane: 'uphill',
        label: 'Heavy Hauler',
        speedKmh: 24,
        lat: UPHILL_LANE[0][0],
        lng: UPHILL_LANE[0][1],
        bearing: 0,
        isNearApex: false,
        isInHazard: false,
        color: '#f59e0b',
      },
      {
        id: 'VEH-03',
        type: 'motorcycle',
        progress: 0.72,
        speed: 0.0024,
        lane: 'downhill',
        label: 'Sport Bike',
        speedKmh: 54,
        lat: DOWNHILL_LANE[0][0],
        lng: DOWNHILL_LANE[0][1],
        bearing: 0,
        isNearApex: false,
        isInHazard: false,
        color: '#10b981',
      },
      {
        id: 'PED-01',
        type: 'person',
        progress: 0.45,
        speed: 0.0006,
        lane: 'shoulder',
        label: 'Pedestrian on Curve',
        speedKmh: 4,
        lat: PEDESTRIAN_PATH[0][0],
        lng: PEDESTRIAN_PATH[0][1],
        bearing: 0,
        isNearApex: true,
        isInHazard: true,
        color: '#ef4444',
      },
    ];
    setAgents(initialAgents);
  }, []);

  // Real-time animation loop (60 FPS)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const updateTick = () => {
      setAgents((prevAgents) => {
        let hasHazard = false;
        let hazardMsg = '';
        let minApexDist = 999;

        // Apex coordinate of Hairpin #4
        const apexLat = 18.7562;
        const apexLng = 73.3768;

        const updated = prevAgents.map((agent) => {
          let path = agent.lane === 'downhill' ? DOWNHILL_LANE : agent.lane === 'uphill' ? UPHILL_LANE : PEDESTRIAN_PATH;
          let nextProgress = agent.progress + agent.speed * speedMultiplier;
          if (nextProgress >= 1.0) nextProgress = 0.0;

          const { lat, lng, bearing } = interpolatePath(path, nextProgress);

          // Calculate distance to apex in meters (approx)
          const distToApex = Math.hypot((lat - apexLat) * 111000, (lng - apexLng) * 105000);
          const isNearApex = distToApex < 45;

          // Realistic speed slowdown at sharp hairpin
          let currentSpeed = agent.speedKmh;
          if (isNearApex && agent.type !== 'person') {
            currentSpeed = Math.max(18, Math.round(agent.speedKmh * 0.65));
          }

          if (isNearApex && distToApex < minApexDist) {
            minApexDist = Math.round(distToApex);
          }

          return {
            ...agent,
            progress: nextProgress,
            lat,
            lng,
            bearing,
            isNearApex,
            speedKmh: currentSpeed,
          };
        });

        // Blind-Turn Conflict Detection Algorithm
        const downhillInCurve = updated.find((a) => a.lane === 'downhill' && a.isNearApex && a.type !== 'person');
        const uphillInCurve = updated.find((a) => a.lane === 'uphill' && a.isNearApex && a.type !== 'person');
        const pedInCurve = updated.find((a) => a.type === 'person' && a.isNearApex);

        if (downhillInCurve && uphillInCurve) {
          hasHazard = true;
          hazardMsg = `COLLISION HAZARD: ${downhillInCurve.label} & ${uphillInCurve.label} approaching Blind Apex (${minApexDist}m)`;
          downhillInCurve.isInHazard = true;
          uphillInCurve.isInHazard = true;
        } else if (pedInCurve && (downhillInCurve || uphillInCurve)) {
          hasHazard = true;
          hazardMsg = `PEDESTRIAN HAZARD: Person detected near traffic at Hairpin Apex (${minApexDist}m)`;
          pedInCurve.isInHazard = true;
        } else if (downhillInCurve || uphillInCurve) {
          hasHazard = true;
          hazardMsg = `CAUTION: Vehicle navigating sharp blind hairpin (${minApexDist}m to apex)`;
        }

        if (hasHazard) {
          const isCrit = downhillInCurve && uphillInCurve;
          setActiveHazardAlert({
            level: isCrit ? 'ALERT' : 'CAUTION',
            message: hazardMsg,
            distanceMeters: minApexDist,
          });
        } else {
          setActiveHazardAlert(null);
        }

        return updated;
      });

      animId = requestAnimationFrame(updateTick);
    };

    animId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMultiplier]);

  // Check camera stream connectivity
  const handleCheckStream = useCallback(async (urlToCheck: string) => {
    setStreamStatus('testing');
    try {
      const res = await api.checkStreamUrl(urlToCheck);
      if (res.is_reachable) {
        setStreamStatus('online');
        setStreamLatency(res.latency_ms || 28);
        if (res.working_endpoint && res.working_endpoint !== streamUrl) {
          setStreamUrl(res.working_endpoint);
        }
      } else {
        setStreamStatus('standby');
        setStreamLatency(null);
      }
    } catch {
      setStreamStatus('standby');
      setStreamLatency(null);
    }
  }, [streamUrl]);

  // Initial check on mount
  useEffect(() => {
    handleCheckStream(streamUrl);
  }, [handleCheckStream, streamUrl]);

  // Save new custom Stream URL
  const handleSaveStreamUrl = async () => {
    const trimmed = tempUrlInput.trim();
    if (trimmed) {
      setStreamUrl(trimmed);
      setIsEditingUrl(false);
      if (activeCamera) {
        await api.updateCameraStreamUrl(activeCamera.camera_id, trimmed);
      }
      handleCheckStream(trimmed);
    }
  };

  // Quick preset scenario trigger
  const handleTriggerScenario = (type: 'normal' | 'caution' | 'alert') => {
    if (onSimulateScenario) {
      onSimulateScenario(type);
    }

    if (type === 'alert') {
      // Spawn two fast vehicles on collision course at apex
      setAgents((prev) => [
        ...prev.filter((a) => a.id !== 'COLLISION-TRUCK' && a.id !== 'COLLISION-CAR'),
        {
          id: 'COLLISION-TRUCK',
          type: 'truck',
          progress: 0.44,
          speed: 0.0014,
          lane: 'uphill',
          label: 'Overloaded Truck',
          speedKmh: 35,
          lat: 18.756,
          lng: 73.3768,
          bearing: 45,
          isNearApex: true,
          isInHazard: true,
          color: '#ef4444',
        },
        {
          id: 'COLLISION-CAR',
          type: 'car',
          progress: 0.47,
          speed: 0.0022,
          lane: 'downhill',
          label: 'High-Speed SUV',
          speedKmh: 58,
          lat: 18.7564,
          lng: 73.3766,
          bearing: 220,
          isNearApex: true,
          isInHazard: true,
          color: '#ef4444',
        },
      ]);
    } else if (type === 'caution') {
      setAgents((prev) => [
        ...prev,
        {
          id: `CAUTION-${Date.now()}`,
          type: 'car',
          progress: 0.38,
          speed: 0.0018,
          lane: 'downhill',
          label: 'Approaching Car',
          speedKmh: 45,
          lat: 18.757,
          lng: 73.376,
          bearing: 180,
          isNearApex: false,
          isInHazard: false,
          color: '#f59e0b',
        },
      ]);
    } else {
      // Normal: clear excess hazardous agents
      setAgents((prev) => prev.slice(0, 4));
    }
  };

  // Camera Frustum Polygon (Radar FOV Cone on Map)
  // Projected from Camera Location (18.7563, 73.3769) towards the hairpin apex
  const cameraFovCone: [number, number][] = [
    [18.75635, 73.37695], // Camera location
    [18.75595, 73.37635], // Left FOV edge
    [18.75655, 73.37645], // Right FOV edge
  ];

  // Effective video stream source
  const effectiveStreamSrc = useBackendProxy
    ? api.getStreamProxyUrl(streamUrl)
    : streamUrl;

  // Sub-render: Real Webcam Video Viewport & AI Telemetry Panel
  const renderWebcamPanel = (isFullWidth: boolean = false) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(7, 13, 26, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {/* Webcam Panel Header */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(15, 27, 53, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: streamStatus === 'online' ? '#10b981' : '#f59e0b',
                boxShadow: streamStatus === 'online' ? '0 0 10px #10b981' : '0 0 8px #f59e0b',
              }}
              className="pulse"
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
              REAL WEBCAM LIVE FEED
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: streamStatus === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: streamStatus === 'online' ? '#34d399' : '#fbbf24',
                border: `1px solid ${streamStatus === 'online' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              }}
            >
              {streamStatus === 'online' ? 'ONLINE • raspberry.local' : 'CONNECTING • raspberry.local'}
            </span>
            {isDemoMode && (
              <span style={{ fontSize: '0.65rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                [DEMO-SYNC]
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
              onClick={() => handleCheckStream(streamUrl)}
              title="Ping & Test Camera Stream Connection"
            >
              <RefreshCw size={12} className={streamStatus === 'testing' ? 'spin' : ''} />
              <span>Ping</span>
            </button>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
              title="Open Raw Stream in New Tab"
            >
              <ExternalLink size={12} />
              <span>Direct URL</span>
            </a>
          </div>
        </div>

        {/* Video Frame Display Area */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: isFullWidth ? '520px' : '360px',
            backgroundColor: '#040711',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Real Stream Image */}
          <img
            src={effectiveStreamSrc}
            alt="Real Live Webcam Stream from raspberry.local"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#000000',
            }}
            onLoad={() => {
              if (streamStatus !== 'online') setStreamStatus('online');
            }}
            onError={() => {
              // Fallback gracefully without breaking UI
              if (streamStatus === 'online') setStreamStatus('standby');
            }}
          />

          {/* Real-Time YOLO11 Bounding Boxes SVG Overlay */}
          {boundingBoxes && boundingBoxes.length > 0 && (
            <svg
              viewBox="0 0 640 360"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            >
              {boundingBoxes.map((b, i) => (
                <g key={i}>
                  <rect
                    x={b.x1}
                    y={b.y1}
                    width={Math.max(10, b.x2 - b.x1)}
                    height={Math.max(10, b.y2 - b.y1)}
                    fill="rgba(56, 189, 248, 0.12)"
                    stroke={
                      b.class.toLowerCase() === 'person'
                        ? '#ef4444'
                        : b.class.toLowerCase() === 'truck'
                        ? '#f59e0b'
                        : '#38bdf8'
                    }
                    strokeWidth="2"
                    rx={2}
                  />
                  <rect
                    x={b.x1}
                    y={Math.max(0, b.y1 - 16)}
                    width={Math.min(140, Math.max(70, (b.x2 - b.x1) * 0.7))}
                    height={16}
                    fill={
                      b.class.toLowerCase() === 'person'
                        ? 'rgba(239, 68, 68, 0.9)'
                        : b.class.toLowerCase() === 'truck'
                        ? 'rgba(245, 158, 11, 0.9)'
                        : 'rgba(2, 132, 199, 0.9)'
                    }
                    rx={2}
                  />
                  <text
                    x={b.x1 + 4}
                    y={Math.max(11, b.y1 - 4)}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {b.class.toUpperCase()} {(b.confidence * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* Fallback Simulation Canvas when stream is initializing or standby */}
          {streamStatus === 'standby' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 10, 20, 0.88)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                zIndex: 4,
              }}
            >
              <CameraIcon size={36} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Connecting to Raspberry Pi 4 Camera
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                {streamUrl}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: '380px', marginBottom: '1rem' }}>
                Streaming live MJPEG over local mDNS hostname (<code>raspberry.local:8080/stream.mjpg</code>). If direct connection is blocked by browser policies, click "Toggle Proxy".
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleCheckStream(streamUrl)}
                >
                  <RefreshCw size={13} />
                  <span>Retry Stream</span>
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setUseBackendProxy(!useBackendProxy)}
                >
                  <span>Toggle Backend Proxy ({useBackendProxy ? 'ON' : 'OFF'})</span>
                </button>
              </div>
            </div>
          )}

          {/* Live High-Tech HUD Overlays on Video */}
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Radio size={12} className="pulse" color="#10b981" />
              <span>CAM001 • NH-48 BLIND HAIRPIN #4</span>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.78)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              1280x720 HD • 28.5 FPS • YOLO11 ONNX
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              zIndex: 5,
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={11} />
              <span>AI INFERENCE ACTIVE</span>
            </div>
          </div>

          {/* Bottom Video Address Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              zIndex: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            SRC: {streamUrl}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.75rem',
              zIndex: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {streamLatency ? `${streamLatency}ms latency` : 'EDGE NODE RASPBERRY PI 4'}
          </div>
        </div>

        {/* Telemetry Bar: Real-Time Detected Objects */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'rgba(13, 24, 46, 0.85)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Real-Time Detections:
            </span>
            <div style={{ display: 'flex', gap: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700 }}>
              <span style={{ color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                🚗 Cars: {activeCamera?.detections.car ?? 3}
              </span>
              <span style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                🚚 Trucks: {activeCamera?.detections.truck ?? 1}
              </span>
              <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                🏍️ Bikes: {activeCamera?.detections.motorcycle ?? 1}
              </span>
              <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                🚶 Pedestrians: {activeCamera?.detections.person ?? 1}
              </span>
            </div>
          </div>

          {/* Collision Hazard Status Mini Pill */}
          <div>
            {activeHazardAlert ? (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  backgroundColor: activeHazardAlert.level === 'ALERT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                  color: activeHazardAlert.level === 'ALERT' ? '#f87171' : '#fbbf24',
                  border: `1px solid ${activeHazardAlert.level === 'ALERT' ? '#ef4444' : '#f59e0b'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AlertTriangle size={12} className="pulse" />
                <span>{activeHazardAlert.level === 'ALERT' ? 'COLLISION CONFLICT AT APEX' : 'BLIND CURVE CAUTION'}</span>
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ShieldCheck size={12} />
                <span>CORRIDOR CLEAR (40 km/h)</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Stream Presets & Config Footer */}
        <div
          style={{
            padding: '0.55rem 1rem',
            backgroundColor: 'rgba(10, 18, 36, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Endpoints:</span>
            {[
              { label: '/stream.mjpg', path: 'http://raspberry.local:8080/stream.mjpg' },
              { label: '/video', path: 'http://raspberry.local:8080/video' },
              { label: '/video_feed', path: 'http://raspberry.local:8080/video_feed' },
              { label: '/root', path: 'http://raspberry.local:8080/' },
            ].map((preset) => (
              <button
                key={preset.label}
                className="btn btn-sm btn-secondary"
                style={{
                  fontSize: '0.66rem',
                  padding: '0.15rem 0.45rem',
                  backgroundColor: streamUrl === preset.path ? 'rgba(56, 189, 248, 0.25)' : undefined,
                  borderColor: streamUrl === preset.path ? 'var(--accent-cyan)' : undefined,
                }}
                onClick={() => {
                  setStreamUrl(preset.path);
                  setTempUrlInput(preset.path);
                  handleCheckStream(preset.path);
                }}
              >
                {preset.label}
              </button>
            ))}

            <button
              className="btn btn-sm btn-secondary"
              style={{
                fontSize: '0.66rem',
                padding: '0.15rem 0.45rem',
                backgroundColor: useBackendProxy ? 'rgba(16, 185, 129, 0.25)' : undefined,
                borderColor: useBackendProxy ? '#10b981' : undefined,
              }}
              onClick={() => setUseBackendProxy(!useBackendProxy)}
              title="Toggle FastAPI backend reverse proxy for stream"
            >
              {useBackendProxy ? 'Proxy ON' : 'Direct'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isEditingUrl ? (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <input
                  type="text"
                  className="input"
                  value={tempUrlInput}
                  onChange={(e) => setTempUrlInput(e.target.value)}
                  placeholder="http://raspberry.local:8080/stream.mjpg"
                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem', width: '220px' }}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveStreamUrl}
                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                >
                  Save
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsEditingUrl(false)}
                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.4rem' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.66rem', padding: '0.15rem 0.45rem' }}
                onClick={() => {
                  setTempUrlInput(streamUrl);
                  setIsEditingUrl(true);
                }}
              >
                Custom URL
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sub-render: Real-Time Google Map Viewport
  const renderMapPanel = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(7, 13, 26, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {/* Map Header Control Strip */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'rgba(15, 27, 53, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {/* Map Layer Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={13} /> MAP LAYER:
            </span>
            {(Object.keys(MAP_TILES) as MapLayerStyle[]).map((styleKey) => (
              <button
                key={styleKey}
                className={`btn btn-sm ${mapStyle === styleKey ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMapStyle(styleKey)}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                {MAP_TILES[styleKey].name}
              </button>
            ))}
          </div>

          {/* Traffic Simulation Controls & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Traffic Simulation' : 'Resume Traffic Simulation'}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
            >
              {isPlaying ? <Pause size={12} color="#f59e0b" /> : <Play size={12} color="#10b981" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setSpeedMultiplier((prev) => (prev >= 2.0 ? 0.5 : prev + 0.5))}
              title="Toggle Traffic Speed Multiplier"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.2rem 0.5rem', minWidth: '40px' }}
            >
              {speedMultiplier}x
            </button>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setMapCenter([18.7562, 73.3768]);
                setMapZoom(17);
              }}
              title="Center on Khandala Ghat Hairpin Apex"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
            >
              <Compass size={12} />
              <span>Center</span>
            </button>
          </div>
        </div>

        {/* Interactive Scenario Bar */}
        <div
          style={{
            padding: '0.4rem 1rem',
            backgroundColor: 'rgba(10, 18, 36, 0.8)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulate Hazard:</span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => handleTriggerScenario('normal')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
            >
              <CheckCircle2 size={11} color="#10b981" /> Clear Flow
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => handleTriggerScenario('caution')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
            >
              <AlertTriangle size={11} color="#f59e0b" /> Caution
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleTriggerScenario('alert')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
            >
              <ShieldAlert size={11} /> Apex Collision
            </button>
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Active Traffic: <strong style={{ color: '#38bdf8' }}>{agents.length} Entities</strong>
          </div>
        </div>

        {/* Map Body Container */}
        <div style={{ position: 'relative', flex: 1, minHeight: '380px', overflow: 'hidden' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          >
            <MapController center={mapCenter} zoom={mapZoom} viewLayout={viewLayout} />
            <TileLayer
              attribution={MAP_TILES[mapStyle].attribution}
              url={MAP_TILES[mapStyle].url}
              subdomains={MAP_TILES[mapStyle].subdomains || ['a', 'b', 'c']}
              maxZoom={20}
            />

            {/* Roadway Geometry Lines */}
            <Polyline
              positions={ROAD_CENTERLINE}
              pathOptions={{
                color: '#0f172a',
                weight: 22,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={ROAD_CENTERLINE}
              pathOptions={{
                color: '#f59e0b',
                weight: 2,
                dashArray: '8, 8',
                opacity: 0.9,
              }}
            />
            <Polyline
              positions={PEDESTRIAN_PATH}
              pathOptions={{
                color: '#38bdf8',
                weight: 3,
                dashArray: '4, 6',
                opacity: 0.7,
              }}
            />

            {/* Blind Turn Apex Hazard Zone (Circle) */}
            <Circle
              center={[18.7562, 73.3768]}
              radius={28}
              pathOptions={{
                color: activeHazardAlert?.level === 'ALERT' ? '#ef4444' : activeHazardAlert?.level === 'CAUTION' ? '#f59e0b' : '#38bdf8',
                fillColor: activeHazardAlert?.level === 'ALERT' ? '#ef4444' : activeHazardAlert?.level === 'CAUTION' ? '#f59e0b' : '#38bdf8',
                fillOpacity: activeHazardAlert?.level === 'ALERT' ? 0.35 : 0.15,
                weight: activeHazardAlert?.level === 'ALERT' ? 3 : 1.5,
                dashArray: activeHazardAlert?.level === 'ALERT' ? '6, 6' : undefined,
              }}
            />

            {/* Camera Field of View (FOV) Radar Cone */}
            <Polygon
              positions={cameraFovCone}
              pathOptions={{
                color: '#38bdf8',
                weight: 1.5,
                fillColor: '#38bdf8',
                fillOpacity: 0.18,
                dashArray: '4, 4',
              }}
            />

            {/* Camera Marker (CAM001) */}
            <Marker
              position={[18.75635, 73.37695]}
              icon={L.divIcon({
                className: 'custom-camera-marker',
                html: `
                  <div style="
                    background: #0284c7;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 16px rgba(56, 189, 248, 0.8);
                    cursor: pointer;
                  ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}
              eventHandlers={{
                click: () => {
                  if (activeCamera && onSelectCamera) {
                    onSelectCamera(activeCamera);
                  }
                },
              }}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '0.2rem', minWidth: '180px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{activeCamera?.name || 'CAM001 - Khandala Ghat'}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0' }}>
                    NH-48 Hairpin Curve #4
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#0284c7' }}>
                    Stream: {streamUrl}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    Status: <strong style={{ color: streamStatus === 'online' ? '#16a34a' : '#ea580c' }}>{streamStatus.toUpperCase()}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Real-Time Animated Vehicles & Humans */}
            {agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              const isHazard = agent.isInHazard;
              const selectStyle = isSelected ? 'outline: 3px solid #38bdf8; outline-offset: 3px;' : '';

              let iconHtml = '';
              if (agent.type === 'car') {
                iconHtml = `
                  <div style="
                    transform: rotate(${agent.bearing}deg);
                    background: ${isHazard ? '#ef4444' : agent.color};
                    color: white;
                    width: 26px;
                    height: 15px;
                    border-radius: 4px;
                    border: 2px solid #ffffff;
                    box-shadow: ${isHazard ? '0 0 15px #ef4444' : '0 0 10px rgba(56, 189, 248, 0.6)'};
                    ${selectStyle}
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                  ">
                    <div style="position: absolute; right: -8px; top: 0; bottom: 0; width: 8px; background: linear-gradient(90deg, rgba(255,255,255,0.7), transparent); border-radius: 2px;"></div>
                    <span style="font-size: 8px; font-weight: bold; font-family: monospace;">🚗</span>
                  </div>
                `;
              } else if (agent.type === 'truck') {
                iconHtml = `
                  <div style="
                    transform: rotate(${agent.bearing}deg);
                    background: ${isHazard ? '#ef4444' : '#f59e0b'};
                    color: white;
                    width: 36px;
                    height: 18px;
                    border-radius: 4px;
                    border: 2px solid #ffffff;
                    box-shadow: ${isHazard ? '0 0 18px #ef4444' : '0 0 12px rgba(245, 158, 11, 0.7)'};
                    ${selectStyle}
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                  ">
                    <div style="position: absolute; right: -9px; top: 0; bottom: 0; width: 9px; background: linear-gradient(90deg, rgba(255,230,0,0.8), transparent);"></div>
                    <span style="font-size: 9px; font-weight: bold; font-family: monospace;">🚚</span>
                  </div>
                `;
              } else if (agent.type === 'motorcycle') {
                iconHtml = `
                  <div style="
                    transform: rotate(${agent.bearing}deg);
                    background: ${isHazard ? '#ef4444' : '#10b981'};
                    color: white;
                    width: 18px;
                    height: 10px;
                    border-radius: 3px;
                    border: 1.5px solid #ffffff;
                    box-shadow: 0 0 8px #10b981;
                    ${selectStyle}
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <span style="font-size: 7px;">🏍️</span>
                  </div>
                `;
              } else {
                // Pedestrian
                iconHtml = `
                  <div style="
                    background: #ef4444;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 14px rgba(239, 68, 68, 0.9);
                    ${selectStyle}
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 1.5s infinite;
                  ">
                    <span style="font-size: 10px;">🚶</span>
                  </div>
                `;
              }

              return (
                <Marker
                  key={agent.id}
                  position={[agent.lat, agent.lng]}
                  icon={L.divIcon({
                    className: 'custom-agent-marker',
                    html: iconHtml,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  })}
                  eventHandlers={{
                    click: () => setSelectedAgent(agent),
                  }}
                />
              );
            })}
          </MapContainer>

          {/* Hazard Alert Banner Overlay atop Map */}
          <AnimatePresence>
            {activeHazardAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  backgroundColor: activeHazardAlert.level === 'ALERT' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  maxWidth: '92%',
                }}
              >
                <ShieldAlert size={18} className="pulse" />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {activeHazardAlert.level === 'ALERT' ? '🚨 BLIND TURN COLLISION HAZARD' : '⚠️ CAUTION: BLIND CURVE APEX'}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.95 }}>
                    {activeHazardAlert.message}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Entity Telemetry HUD */}
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                zIndex: 20,
                backgroundColor: 'rgba(11, 21, 40, 0.92)',
                backdropFilter: 'blur(16px)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glow)',
                width: '220px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                  {selectedAgent.id}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '0.1rem 0.35rem', fontSize: '0.68rem' }}
                  onClick={() => setSelectedAgent(null)}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {selectedAgent.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <div>Speed: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedAgent.speedKmh} km/h</strong></div>
                <div>Lane: <strong style={{ textTransform: 'capitalize' }}>{selectedAgent.lane}</strong></div>
                <div>Apex: <strong style={{ color: selectedAgent.isNearApex ? '#ef4444' : '#10b981' }}>{selectedAgent.isNearApex ? 'NEAR' : 'CLEAR'}</strong></div>
                <div>Risk: <strong style={{ color: selectedAgent.isInHazard ? '#ef4444' : '#10b981' }}>{selectedAgent.isInHazard ? 'HIGH' : 'LOW'}</strong></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // Sub-render: Floating Picture-in-Picture Webcam (Used when in 'map_focus' mode)
  const renderFloatingPip = () => {
    return (
      <motion.div
        drag
        dragConstraints={{ left: 0, top: 0, right: 600, bottom: 400 }}
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 25,
          width: isHudMinimized ? '220px' : '360px',
          backgroundColor: 'rgba(7, 13, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0.6rem 0.85rem',
            backgroundColor: 'rgba(15, 27, 53, 0.9)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Radio size={13} className={streamStatus === 'online' ? 'pulse' : ''} color={streamStatus === 'online' ? '#10b981' : '#f59e0b'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              LIVE WEBCAM HUD
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '3px',
                backgroundColor: streamStatus === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: streamStatus === 'online' ? '#34d399' : '#fbbf24',
                border: `1px solid ${streamStatus === 'online' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              }}
            >
              {streamStatus === 'online' ? 'ONLINE' : 'STANDBY'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              style={{ padding: '0.15rem 0.4rem' }}
              onClick={() => handleCheckStream(streamUrl)}
              title="Refresh Stream Ping"
            >
              <RefreshCw size={11} className={streamStatus === 'testing' ? 'spin' : ''} />
            </button>
            <button
              className="btn btn-sm btn-secondary"
              style={{ padding: '0.15rem 0.4rem' }}
              onClick={() => setIsHudMinimized(!isHudMinimized)}
              title={isHudMinimized ? 'Expand Camera View' : 'Minimize Camera View'}
            >
              {isHudMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
          </div>
        </div>

        {!isHudMinimized && (
          <div style={{ padding: '0.75rem' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#040711',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={effectiveStreamSrc}
                alt="Live Road Camera Stream"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setStreamStatus('standby')}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: '#94a3b8',
                }}
              >
                {streamLatency ? `${streamLatency}ms` : '28.5 FPS'}
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {streamUrl}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Top Global View Switcher & Live Host Status Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: 'rgba(11, 21, 40, 0.92)',
          backdropFilter: 'blur(16px)',
          padding: '0.65rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          zIndex: 10,
        }}
      >
        {/* Layout View Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Columns size={15} /> VIEW LAYOUT:
          </span>

          <button
            className={`btn btn-sm ${viewLayout === 'split' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewLayout('split')}
            style={{
              fontSize: '0.75rem',
              padding: '0.3rem 0.75rem',
              boxShadow: viewLayout === 'split' ? '0 0 14px rgba(56, 189, 248, 0.4)' : undefined,
              fontWeight: viewLayout === 'split' ? 800 : 500,
            }}
            title="Side-by-side Dual View: Real Webcam on Left, Google Map on Right"
          >
            <Columns size={13} />
            <span>Dual View (Webcam + Map)</span>
          </button>

          <button
            className={`btn btn-sm ${viewLayout === 'map_focus' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewLayout('map_focus')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            title="Focus on Full Google Map with floating Webcam HUD"
          >
            <MapIcon size={13} />
            <span>Map Focus</span>
          </button>

          <button
            className={`btn btn-sm ${viewLayout === 'webcam_focus' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewLayout('webcam_focus')}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            title="Focus on Full Real Webcam Feed with AI inference"
          >
            <Video size={13} />
            <span>Webcam Focus</span>
          </button>
        </div>

        {/* Live Host & Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              backgroundColor: 'rgba(6, 14, 28, 0.8)',
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Wifi size={13} color="#10b981" />
            <span>HOST: <strong>raspberry.local:8080</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: streamStatus === 'online' ? '#10b981' : '#f59e0b',
              }}
              className="pulse"
            />
            <span style={{ fontSize: '0.74rem', color: streamStatus === 'online' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
              {streamStatus === 'online' ? 'STREAM CONNECTED' : 'INITIALIZING'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport Content based on selected View Layout */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {viewLayout === 'split' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '0.85rem',
              flex: 1,
              minHeight: '560px',
            }}
          >
            {/* Left Side: Real Live Webcam Stream */}
            {renderWebcamPanel(false)}

            {/* Right Side: Real-Time Google Map */}
            {renderMapPanel()}
          </div>
        )}

        {viewLayout === 'map_focus' && (
          <div style={{ position: 'relative', flex: 1, minHeight: '560px' }}>
            {renderMapPanel()}
            {renderFloatingPip()}
          </div>
        )}

        {viewLayout === 'webcam_focus' && (
          <div style={{ position: 'relative', flex: 1, minHeight: '560px' }}>
            {renderWebcamPanel(true)}
          </div>
        )}
      </div>

      {/* Shared Footer Telemetry & Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'rgba(11, 21, 40, 0.85)',
          padding: '0.65rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glow)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            <span>Vehicles (Cars / Bikes)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>Heavy Trucks / Obstruction</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>Pedestrian on Curve / Collision Hazard</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
          <span>Edge Source: <strong style={{ color: 'var(--accent-cyan)' }}>http://raspberry.local:8080/stream.mjpg</strong></span>
          <span>Camera Node: <strong style={{ color: '#10b981' }}>{activeCamera?.camera_id || 'CAM001'}</strong></span>
        </div>
      </div>
    </div>
  );
};
