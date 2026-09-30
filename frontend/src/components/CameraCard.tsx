import React from 'react';
import { motion } from 'framer-motion';
import type { Camera } from '../types';
import { VideoOff, Car, User, AlertTriangle, ShieldCheck, MapPin, Eye, Radio, Sparkles } from 'lucide-react';

interface CameraCardProps {
  camera: Camera;
  isSelected?: boolean;
  onSelect: (camera: Camera) => void;
  isDemoMode?: boolean;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  isSelected,
  onSelect,
  isDemoMode = false,
}) => {
  const isOnline = camera.status === 'ONLINE';
  const [streamFailed, setStreamFailed] = React.useState<boolean>(false);
  const showSimulated = isDemoMode || streamFailed || !camera.stream_url;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderColor: isSelected ? 'var(--border-active)' : undefined,
        boxShadow: isSelected
          ? '0 0 25px rgba(56, 189, 248, 0.35), 0 10px 30px rgba(0, 0, 0, 0.5)'
          : undefined,
      }}
    >
      <div>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--accent-cyan)',
                  letterSpacing: '0.04em',
                }}
              >
                {camera.camera_id}
              </span>
              <span className={`badge ${isOnline ? 'badge-normal' : 'badge-offline'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {camera.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <MapPin size={12} />
              <span>{camera.location}</span>
            </div>
          </div>

          {/* Hazard Status Badge with Pulse Aura */}
          <div>
            <span
              className={`badge ${
                camera.hazard_status === 'ALERT'
                  ? 'badge-alert'
                  : camera.hazard_status === 'CAUTION'
                  ? 'badge-caution'
                  : 'badge-normal'
              }`}
            >
              {camera.hazard_status === 'ALERT' && <AlertTriangle size={12} />}
              {camera.hazard_status === 'CAUTION' && <AlertTriangle size={12} />}
              {camera.hazard_status === 'NORMAL' && <ShieldCheck size={12} />}
              {camera.hazard_status}
            </span>
          </div>
        </div>

        {/* Live Stream Viewport Area with Animated Radar Sweep Line */}
        <div
          className="radar-sweep-container"
          style={{
            position: 'relative',
            height: '190px',
            backgroundColor: '#050a14',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-glow)',
            marginBottom: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
          }}
        >
          {!showSimulated && camera.stream_url && isOnline ? (
            <img
              src={camera.stream_url}
              alt={`Live Stream ${camera.camera_id}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setStreamFailed(true)}
            />
          ) : isOnline ? (
            // Simulated camera frame with dynamic road geometry and LiDAR scan
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0a1426',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.65rem',
                backgroundImage:
                  'radial-gradient(ellipse at 50% 120%, rgba(30, 58, 138, 0.45) 0%, rgba(5, 10, 20, 0.95) 80%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'var(--accent-cyan)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Sparkles size={11} /> SIMULATED STREAM • {camera.visibility}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <Radio size={11} className="pulse" /> LIVE YOLO11
                </span>
              </div>

              {/* Roadway simulation perspective lines */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.45,
                }}
              >
                <path d="M 0 190 L 135 65 L 185 65 L 340 190" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 160 65 L 160 190" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,6" />
                {/* Curve warning danger sector arc */}
                <circle cx="160" cy="110" r="45" fill="none" stroke="rgba(239, 68, 68, 0.35)" strokeDasharray="4,4" />
              </svg>

              <div style={{ zIndex: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  YOLO11: {camera.vehicle_count} VEHICLES TRACKED
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    backgroundColor: camera.hazard ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                    color: camera.hazard ? '#fca5a5' : '#86efac',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    border: camera.hazard ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)',
                  }}
                >
                  {camera.hazard ? '⚠️ BLIND TURN OBSTRUCTED' : '✓ CORRIDOR CLEAR'}
                </span>
              </div>
            </div>
          ) : (
            // REAL REQUIREMENT: If camera not connected, show exactly "Camera not connected"
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  padding: '0.65rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(100, 116, 139, 0.15)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                }}
              >
                <VideoOff size={30} color="#94a3b8" />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Camera not connected
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '240px', lineHeight: '1.4' }}>
                Awaiting Raspberry Pi 4 video stream or Android IP webcam feed.
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Metric Counts */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.6rem',
            marginBottom: '0.85rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.7)',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <Car size={13} color="#60a5fa" />
              <span style={{ fontWeight: 600 }}>VEHICLES</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              {camera.vehicle_count}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.7)',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <User size={13} color="#f87171" />
              <span style={{ fontWeight: 600 }}>PEDESTRIANS</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              {camera.person_count}
            </div>
          </div>
        </div>

        {/* Detected Objects Breakdown Pills */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            YOLO11 DETECTED CLASSES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.72rem' }}>
            <span style={{ backgroundColor: 'rgba(5, 10, 22, 0.7)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Car: <strong style={{ color: '#60a5fa' }}>{camera.detections.car}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(5, 10, 22, 0.7)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Truck: <strong style={{ color: '#f59e0b' }}>{camera.detections.truck}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(5, 10, 22, 0.7)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Bus: <strong style={{ color: '#a78bfa' }}>{camera.detections.bus}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(5, 10, 22, 0.7)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Moto: <strong style={{ color: '#34d399' }}>{camera.detections.motorcycle}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(5, 10, 22, 0.7)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Person: <strong style={{ color: '#f87171' }}>{camera.detections.person}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: '0.82rem', gap: '0.5rem' }}
        onClick={() => onSelect(camera)}
      >
        <Eye size={15} color="#38bdf8" />
        <span>Inspect YOLO Stream & Details</span>
      </motion.button>
    </motion.div>
  );
};
