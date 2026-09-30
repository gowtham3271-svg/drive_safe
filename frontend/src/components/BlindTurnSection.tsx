import React from 'react';
import { motion } from 'framer-motion';
import type { Camera } from '../types';
import { BlindTurn3DView } from './BlindTurn3DView';
import { CornerUpRight, CloudFog, Activity, AlertTriangle, ShieldCheck, Cpu, Gauge, Zap, Sparkles } from 'lucide-react';

interface BlindTurnSectionProps {
  camera: Camera | null;
  onHazardTrigger?: (scenario: 'normal' | 'caution' | 'alert') => void;
}

export const BlindTurnSection: React.FC<BlindTurnSectionProps> = ({
  camera,
  onHazardTrigger,
}) => {
  const currentCam = camera || ({
    camera_id: 'CAM001',
    name: 'Hairpin Curve #4 - Khandala Ghat',
    location: 'NH-48, Maharashtra (KM 42.5)',
    road_section: 'Blind Turn / Ghat Section',
    status: 'ONLINE',
    hazard_status: 'CAUTION',
    hazard: true,
    visibility: 'Fog / Low Visibility',
    vehicle_count: 4,
    person_count: 1,
    detections: { car: 3, truck: 1, bus: 0, motorcycle: 0, person: 1 },
    latitude: 18.7562,
    longitude: 73.3768,
  } as Camera);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 3D Interactive Digital Twin Centerpiece */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <div>
            <div className="card-title">
              <CornerUpRight size={22} color="#38bdf8" />
              <span>3D Digital Twin • Mountain Blind-Curve Real-Time Telemetry</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Drag with mouse to orbit 360°, scroll to zoom, switch camera angles, or inject hazard scenarios.
            </p>
          </div>
          <span className="badge badge-normal">LiDAR & Mesh Active</span>
        </div>

        <BlindTurn3DView
          hazardLevel={currentCam.hazard_status}
          roadName={currentCam.name}
          cameraId={currentCam.camera_id}
          onHazardTrigger={onHazardTrigger}
        />
      </div>

      {/* 5 Primary Required Specifications Grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Sparkles size={18} color="#f59e0b" />
            Monitored Curve Specifications & Active Telemetry
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            SURVEILLANCE PORT SEC-04
          </span>
        </div>

        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {/* 1. Road Section */}
          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="telemetry-label">Road Section:</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem' }}>
              {currentCam.road_section || 'Blind Turn / Ghat Section'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {currentCam.location}
            </div>
          </motion.div>

          {/* 2. Monitored Camera */}
          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="telemetry-label">Camera:</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
              {currentCam.camera_id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              GPS: {currentCam.latitude.toFixed(4)}, {currentCam.longitude.toFixed(4)}
            </div>
          </motion.div>

          {/* 3. Visibility */}
          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="telemetry-label">Visibility:</div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: currentCam.visibility === 'Normal' ? '#34d399' : '#fbbf24',
                marginTop: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <CloudFog size={18} />
              <span>{currentCam.visibility}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Optical Range: {currentCam.visibility === 'Normal' ? '> 300m' : '< 75m'}
            </div>
          </motion.div>

          {/* 4. Vehicle Detection */}
          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="telemetry-label">Vehicle Detection:</div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#34d399',
                marginTop: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Activity size={18} />
              <span>Active</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              YOLO11 Inference Active
            </div>
          </motion.div>
        </div>

        {/* 5. Hazard State Display */}
        <div
          style={{
            backgroundColor:
              currentCam.hazard_status === 'ALERT'
                ? 'rgba(239, 68, 68, 0.18)'
                : currentCam.hazard_status === 'CAUTION'
                ? 'rgba(245, 158, 11, 0.16)'
                : 'rgba(16, 185, 129, 0.15)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${
              currentCam.hazard_status === 'ALERT'
                ? 'rgba(239, 68, 68, 0.6)'
                : currentCam.hazard_status === 'CAUTION'
                ? 'rgba(245, 158, 11, 0.55)'
                : 'rgba(16, 185, 129, 0.45)'
            }`,
            boxShadow:
              currentCam.hazard_status === 'ALERT'
                ? '0 0 30px rgba(239, 68, 68, 0.35)'
                : currentCam.hazard_status === 'CAUTION'
                ? '0 0 20px rgba(245, 158, 11, 0.25)'
                : '0 0 15px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '50%',
                backgroundColor:
                  currentCam.hazard_status === 'ALERT'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : currentCam.hazard_status === 'CAUTION'
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(16, 185, 129, 0.3)',
              }}
            >
              {currentCam.hazard_status === 'ALERT' ? (
                <AlertTriangle size={28} color="#ef4444" />
              ) : currentCam.hazard_status === 'CAUTION' ? (
                <AlertTriangle size={28} color="#f59e0b" />
              ) : (
                <ShieldCheck size={28} color="#10b981" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Monitored Hazard Level:
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentCam.hazard_status}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: '1.5' }}>
            {currentCam.hazard_status === 'ALERT'
              ? 'Warning: Obstruction detected inside curve. Oncoming drivers alerted via road hazard sign.'
              : currentCam.hazard_status === 'CAUTION'
              ? 'Caution: Moving vehicles entering blind sector. Speed advisory warning recommended.'
              : 'Clear: Blind turn corridor is unobstructed. Normal speed limits apply.'}
          </div>
        </div>
      </div>

      {/* Structured Sensor Integration Ports */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Cpu size={19} color="#38bdf8" />
            <span>Environmental & Roadway Sensor Integration Bus</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            GPIO / MODBUS / I2C EXPANSION READY
          </span>
        </div>

        <div className="grid-3">
          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', marginBottom: '0.4rem' }}>
              <CloudFog size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Optical Fog Sensor</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Measures atmospheric particle attenuation and optical scattering.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Driver Port: <code>/dev/ttyUSB0 (MODBUS-RTU)</code>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f59e0b', marginBottom: '0.4rem' }}>
              <Gauge size={16} />
              <strong style={{ fontSize: '0.85rem' }}>24GHz Radar Speed Sensor</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Doppler speed detection for approaching vehicles prior to curve entry.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Driver Port: <code>UART0 / GPIO14-15</code>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: 'rgba(5, 10, 22, 0.75)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#10b981', marginBottom: '0.4rem' }}>
              <Zap size={16} />
              <strong style={{ fontSize: '0.85rem' }}>LED Hazard Beacon Relay</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Physical roadside flashing sign triggered when hazard status == ALERT.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Relay Channel: <code>GPIO 23 (Relay 1)</code>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
