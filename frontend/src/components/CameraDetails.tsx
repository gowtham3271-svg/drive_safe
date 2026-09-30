import React from 'react';
import type { Camera, BoundingBox } from '../types';
import { X, VideoOff, MapPin } from 'lucide-react';

interface CameraDetailsProps {
  camera: Camera;
  boundingBoxes: BoundingBox[];
  onClose: () => void;
  isDemoMode: boolean;
}

export const CameraDetails: React.FC<CameraDetailsProps> = ({
  camera,
  boundingBoxes,
  onClose,
  isDemoMode,
}) => {
  const isOnline = camera.status === 'ONLINE';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                {camera.camera_id}
              </span>
              <span className={`badge ${isOnline ? 'badge-normal' : 'badge-offline'}`}>
                {camera.status}
              </span>
              <span
                className={`badge ${
                  camera.hazard_status === 'ALERT'
                    ? 'badge-alert'
                    : camera.hazard_status === 'CAUTION'
                    ? 'badge-caution'
                    : 'badge-normal'
                }`}
              >
                {camera.hazard_status}
              </span>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {camera.name}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={12} />
              <span>{camera.location} • GPS: {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Video Stream Area */}
        <div
          style={{
            height: '280px',
            backgroundColor: '#070b12',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            marginBottom: '1rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {camera.stream_url && isOnline ? (
            <img
              src={camera.stream_url}
              alt="Stream"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : isOnline && isDemoMode ? (
            // Simulated live feed in demo mode
            <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#0d1524' }}>
              <svg viewBox="0 0 640 360" style={{ width: '100%', height: '100%' }}>
                {/* Road curve */}
                <path d="M 40 360 Q 240 240 280 100 L 360 100 Q 340 240 600 360" fill="#1e293b" />
                <path d="M 320 100 Q 310 240 320 360" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,6" />

                {/* Simulated bounding boxes */}
                {boundingBoxes.map((b, i) => (
                  <g key={i}>
                    <rect
                      x={b.x1}
                      y={b.y1}
                      width={Math.max(10, b.x2 - b.x1)}
                      height={Math.max(10, b.y2 - b.y1)}
                      fill="rgba(59, 130, 246, 0.15)"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    <text x={b.x1 + 4} y={Math.max(12, b.y1 - 4)} fill="#ffffff" fontSize="10" fontFamily="monospace">
                      {b.class} ({(b.confidence * 100).toFixed(0)}%)
                    </text>
                  </g>
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan)',
                }}
              >
                [SIMULATED CAMERA STREAM - DEMO MODE]
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <VideoOff size={36} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Camera not connected
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Connect a Raspberry Pi 4 edge stream or IP camera to stream live road footage.
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Summary */}
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <div className="telemetry-label">Monitored Curve</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{camera.road_section}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <div className="telemetry-label">Atmospheric Visibility</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: camera.visibility === 'Normal' ? '#10b981' : '#f59e0b' }}>
              {camera.visibility}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <div className="telemetry-label">Total Vehicles Tracked</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: '#60a5fa' }}>
              {camera.vehicle_count}
            </div>
          </div>
        </div>

        {/* Object breakdown table */}
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Detected Object Classes (YOLO11):
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <div>Cars: <strong>{camera.detections.car}</strong></div>
            <div>Trucks: <strong>{camera.detections.truck}</strong></div>
            <div>Buses: <strong>{camera.detections.bus}</strong></div>
            <div>Motorcycles: <strong>{camera.detections.motorcycle}</strong></div>
            <div>Pedestrians: <strong>{camera.detections.person}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
