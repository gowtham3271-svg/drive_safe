import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Camera, BoundingBox } from '../types';
import { Crosshair, Play, AlertCircle, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DetectionPanelProps {
  camera: Camera | null;
  boundingBoxes: BoundingBox[];
  onSimulateScenario?: (scenario: 'normal' | 'caution' | 'alert') => void;
  isDemoMode?: boolean;
}

const CLASS_COLORS: Record<string, string> = {
  car: '#38bdf8',
  truck: '#f59e0b',
  bus: '#a855f7',
  motorcycle: '#10b981',
  person: '#ef4444',
};

export const DetectionPanel: React.FC<DetectionPanelProps> = ({
  camera,
  boundingBoxes,
  onSimulateScenario,
  isDemoMode = false,
}) => {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);

  if (!camera) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <Crosshair size={38} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No Camera Selected</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Select a camera from the map or 3D digital twin to inspect real-time YOLO11 inference telemetry.
        </p>
      </div>
    );
  }

  const counts = camera.detections;
  const timestamp = camera.last_ping ? new Date(camera.last_ping).toLocaleTimeString() : 'N/A';

  const handleScenarioClick = (scenario: 'normal' | 'caution' | 'alert') => {
    if (scenario === 'normal') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    if (onSimulateScenario) {
      onSimulateScenario(scenario);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header & Overview */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(13, 24, 46, 0.9) 0%, rgba(20, 35, 68, 0.8) 100%)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                fontSize: '1.05rem',
                textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
              }}
            >
              {camera.camera_id}
            </span>
            <span style={{ fontSize: '0.98rem', fontWeight: 700 }}>YOLO11 Live Inference Matrix</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Location: {camera.name} • Edge Pipeline: Raspberry Pi 4 (Ultralytics v11)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Status: </span>
            <span
              style={{
                color: camera.status === 'ONLINE' ? 'var(--color-normal)' : 'var(--color-alert)',
                fontWeight: 800,
                textShadow: camera.status === 'ONLINE' ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              }}
            >
              {camera.status}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Main Detection Grid */}
      <div className="grid-main-sidebar">
        {/* Visual Bounding-Box Viewport / Canvas with Radar Scan */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">
              <Crosshair size={17} color="#38bdf8" />
              YOLO11 Bounding Canvas (640 × 360)
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {boundingBoxes.length} Box(es) Tracked
            </span>
          </div>

          <div
            className="radar-sweep-container"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#040813',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glow)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.9)',
            }}
          >
            {camera.status === 'OFFLINE' ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} color="#f87171" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Camera is OFFLINE</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Awaiting edge detection stream from Pi 4</div>
              </div>
            ) : (
              <svg
                viewBox="0 0 640 360"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              >
                {/* Simulated road curve lanes */}
                <path
                  d="M 50 360 C 200 320, 240 180, 260 80 L 330 80 C 320 180, 390 320, 590 360"
                  fill="none"
                  stroke="#17223b"
                  strokeWidth="80"
                  strokeLinecap="round"
                />
                <path
                  d="M 120 360 C 220 310, 260 200, 280 80"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="8,8"
                />

                {/* Render YOLO Bounding Boxes with smooth animations */}
                <AnimatePresence>
                  {boundingBoxes.map((box, idx) => {
                    const color = CLASS_COLORS[box.class.toLowerCase()] || '#38bdf8';
                    const width = Math.max(10, box.x2 - box.x1);
                    const height = Math.max(10, box.y2 - box.y1);
                    const isSelected = selectedBoxIndex === idx;

                    return (
                      <g
                        key={idx}
                        onClick={() => setSelectedBoxIndex(idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Box rectangle */}
                        <rect
                          x={box.x1}
                          y={box.y1}
                          width={width}
                          height={height}
                          fill={`${color}22`}
                          stroke={color}
                          strokeWidth={isSelected ? 3.5 : 2}
                          rx={3}
                          filter="drop-shadow(0 0 6px currentColor)"
                        />
                        {/* Label badge */}
                        <rect
                          x={box.x1}
                          y={Math.max(0, box.y1 - 20)}
                          width={Math.min(140, Math.max(75, width))}
                          height={20}
                          fill={color}
                          rx={3}
                        />
                        <text
                          x={box.x1 + 6}
                          y={Math.max(14, box.y1 - 5)}
                          fill="#ffffff"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {box.class.toUpperCase()} {(box.confidence * 100).toFixed(0)}%
                        </text>
                      </g>
                    );
                  })}
                </AnimatePresence>
              </svg>
            )}
          </div>

          {/* Interactive Scenario Controls for Demo Mode */}
          {isDemoMode && onSimulateScenario && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: '1.1rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(5, 10, 22, 0.8)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={13} color="#c084fc" />
                  Interactive Blind-Turn Detection Scenarios:
                </span>
                <span style={{ fontSize: '0.68rem', color: '#c084fc', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  [LIVE INFERENCE DEMO]
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleScenarioClick('normal')}
                >
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Normal Traffic Flow</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleScenarioClick('caution')}
                >
                  <Play size={13} color="#f59e0b" />
                  <span>Approaching Blind Curve (Caution)</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-danger btn-sm"
                  onClick={() => handleScenarioClick('alert')}
                >
                  <ShieldAlert size={13} />
                  <span>Truck Stopped on Curve (ALERT)</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar: YOLO Object Count & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Object Counts Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Detected Object Count</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'Car', count: counts.car, color: CLASS_COLORS.car },
                { label: 'Truck', count: counts.truck, color: CLASS_COLORS.truck },
                { label: 'Bus', count: counts.bus, color: CLASS_COLORS.bus },
                { label: 'Motorcycle', count: counts.motorcycle, color: CLASS_COLORS.motorcycle },
                { label: 'Person', count: counts.person, color: CLASS_COLORS.person },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ x: 3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(5, 10, 22, 0.75)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}`,
                      }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: item.count > 0 ? item.color : 'var(--text-muted)',
                    }}
                  >
                    {item.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bounding Box Coordinates Table */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Bounding Boxes Coordinates</span>
            </div>
            <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
              {boundingBoxes.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                  No objects currently detected
                </div>
              ) : (
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.45rem' }}>Class</th>
                      <th style={{ padding: '0.45rem' }}>Conf</th>
                      <th style={{ padding: '0.45rem' }}>[x1, y1, x2, y2]</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boundingBoxes.map((b, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedBoxIndex(i)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          backgroundColor: selectedBoxIndex === i ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.45rem', fontWeight: 700, color: CLASS_COLORS[b.class.toLowerCase()] }}>
                          {b.class}
                        </td>
                        <td style={{ padding: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                          {(b.confidence * 100).toFixed(0)}%
                        </td>
                        <td style={{ padding: '0.45rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          [{Math.round(b.x1)}, {Math.round(b.y1)}, {Math.round(b.x2)}, {Math.round(b.y2)}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
