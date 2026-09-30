import React from 'react';
import { motion } from 'framer-motion';
import type { SystemHealth } from '../types';
import { Cpu, Eye, Camera, Activity, Database, Clock, RefreshCw, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface SystemStatusProps {
  systemHealth: SystemHealth;
  onRefresh: () => void;
  isDemoMode: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  systemHealth,
  onRefresh,
  isDemoMode,
}) => {
  const components = [
    {
      name: 'Raspberry Pi 4',
      key: 'raspberry_pi',
      status: systemHealth.raspberry_pi,
      isGood: systemHealth.raspberry_pi === 'ONLINE',
      icon: Cpu,
      description: 'Edge computing unit located at roadside enclosure running Linux & inference pipeline.',
      protocol: 'Heartbeat / Ingestion Payload',
      color: '#38bdf8',
    },
    {
      name: 'YOLO11 Model',
      key: 'yolo11',
      status: systemHealth.yolo11,
      isGood: systemHealth.yolo11 === 'CONNECTED',
      icon: Eye,
      description: 'Ultralytics YOLO11 object detection weights loaded in edge memory.',
      protocol: 'Ultralytics PyTorch / NCNN Export',
      color: '#a855f7',
    },
    {
      name: 'Camera Feed',
      key: 'camera',
      status: systemHealth.camera,
      isGood: systemHealth.camera === 'ONLINE',
      icon: Camera,
      description: 'Android Phone IP Webcam / RTSP stream or V4L2 camera module.',
      protocol: 'HTTP MJPEG / RTSP Stream',
      color: '#3b82f6',
    },
    {
      name: 'FastAPI Backend',
      key: 'backend',
      status: systemHealth.backend,
      isGood: systemHealth.backend === 'ONLINE',
      icon: Activity,
      description: 'Python REST API server coordinating detection ingestion, hazard rules, and client sockets.',
      protocol: 'Uvicorn ASGI HTTP / WebSocket',
      color: '#10b981',
    },
    {
      name: 'Supabase Database',
      key: 'database',
      status: systemHealth.database,
      isGood: systemHealth.database === 'CONNECTED',
      icon: Database,
      description: 'PostgreSQL database holding cameras, detections, alerts, and historical logs.',
      protocol: 'PostgreSQL REST / Realtime',
      color: '#06b6d4',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Dynamic Telemetry Connectivity Bus Diagram */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <div className="card-title">
              <Zap size={20} color="#38bdf8" />
              <span>Real-Time Edge-to-Cloud Telemetry Pipeline Bus</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Real-time pipeline diagnostics monitoring physical hardware, edge AI, API gateway, and database persistence.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Clock size={13} />
              Last Ping: {new Date(systemHealth.last_update).toLocaleTimeString()}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
            >
              <RefreshCw size={13} />
              <span>Ping Health</span>
            </motion.button>
          </div>
        </div>

        {/* 5 Component Diagnostic Cards */}
        <div className="grid-3" style={{ marginTop: '0.5rem' }}>
          {components.map((c) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{
                  backgroundColor: 'rgba(5, 10, 22, 0.75)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.9rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          backgroundColor: c.isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          color: c.isGood ? 'var(--color-normal)' : 'var(--color-alert)',
                          border: `1px solid ${c.isGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                    </div>

                    <span className={`badge ${c.isGood ? 'badge-normal' : 'badge-alert'}`}>
                      {c.isGood ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {c.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {c.description}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'rgba(11, 21, 40, 0.8)',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  Interface: {c.protocol}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hardware Integrity Notice */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid #38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.06)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#93c5fd', marginBottom: '0.4rem' }}>
          Hardware State Integrity Rule:
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          This road-safety monitoring dashboard strictly avoids faking live hardware states. When the physical
          Raspberry Pi 4, YOLO model, or video stream is offline, the telemetry displays <strong>OFFLINE / NOT CONNECTED</strong>.
          {isDemoMode && (
            <span style={{ color: '#c084fc', marginLeft: '0.35rem', fontWeight: 600 }}>
              (Currently operating in DEMO MODE with simulated road geometry for UI evaluation).
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
