import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Cpu, Database, Eye, RefreshCw, Wrench, Sparkles, Bell } from 'lucide-react';
import type { SystemHealth } from '../types';

interface HeaderProps {
  systemHealth: SystemHealth;
  systemStatus?: 'SAFE' | 'CAUTION' | 'HAZARD';
  activeHazardsCount?: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
  onOpenHardwareGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemHealth,
  systemStatus = 'SAFE',
  activeHazardsCount = 0,
  isDemoMode,
  onToggleDemoMode,
  onRefresh,
  onOpenHardwareGuide,
}) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusBg =
    systemStatus === 'HAZARD'
      ? 'rgba(239, 68, 68, 0.2)'
      : systemStatus === 'CAUTION'
      ? 'rgba(245, 158, 11, 0.2)'
      : 'rgba(16, 185, 129, 0.2)';

  const statusBorder =
    systemStatus === 'HAZARD'
      ? 'rgba(239, 68, 68, 0.5)'
      : systemStatus === 'CAUTION'
      ? 'rgba(245, 158, 11, 0.5)'
      : 'rgba(16, 185, 129, 0.5)';

  const statusColor =
    systemStatus === 'HAZARD'
      ? '#ef4444'
      : systemStatus === 'CAUTION'
      ? '#f59e0b'
      : '#10b981';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        backgroundColor: 'rgba(11, 21, 40, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glow)',
        padding: '0.75rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Title & Cyber Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <motion.div
          whileHover={{ scale: 1.08, rotate: 4 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(30, 58, 138, 0.2) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
            cursor: 'pointer',
          }}
        >
          <ShieldAlert size={24} />
        </motion.div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1
              style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
                margin: 0,
              }}
            >
              GHATGUARD
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              | Intelligent Fog Detection & Accident Prevention
            </span>

            {/* Live System State Badge */}
            <motion.div
              animate={{ scale: systemStatus === 'HAZARD' ? [1, 1.08, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: statusBg,
                border: `1px solid ${statusBorder}`,
                color: statusColor,
                fontSize: '0.7rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                boxShadow: `0 0 12px ${statusBorder}`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`,
                }}
              />
              SYSTEM: {systemStatus}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.span
                key={isDemoMode ? 'demo' : 'live'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={isDemoMode ? 'badge badge-demo' : 'badge badge-live'}
              >
                <Sparkles size={11} />
                {isDemoMode ? 'DEMO / SIMULATION' : 'LIVE PI 4'}
              </motion.span>
            </AnimatePresence>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.02em', margin: '0.15rem 0 0' }}>
            Khandala Ghat Blind Curve Corridors • LoRa Mesh Telemetry • Edge AI
          </p>
        </div>
      </div>


      {/* Hardware Telemetry Neon Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(5, 10, 22, 0.75)',
          padding: '0.45rem 1rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <motion.div
            animate={{ scale: systemHealth.raspberry_pi === 'ONLINE' ? [1, 1.25, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Cpu size={14} color={systemHealth.raspberry_pi === 'ONLINE' ? '#10b981' : '#64748b'} />
          </motion.div>
          <span style={{ color: 'var(--text-muted)' }}>Pi 4:</span>
          <span
            style={{
              color: systemHealth.raspberry_pi === 'ONLINE' ? '#10b981' : '#f87171',
              fontWeight: 700,
              textShadow: systemHealth.raspberry_pi === 'ONLINE' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {systemHealth.raspberry_pi}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Eye size={14} color={systemHealth.yolo11 === 'CONNECTED' ? '#10b981' : '#64748b'} />
          <span style={{ color: 'var(--text-muted)' }}>YOLO11:</span>
          <span
            style={{
              color: systemHealth.yolo11 === 'CONNECTED' ? '#10b981' : '#f87171',
              fontWeight: 700,
              textShadow: systemHealth.yolo11 === 'CONNECTED' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {systemHealth.yolo11}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Activity size={14} color={systemHealth.backend === 'ONLINE' ? '#10b981' : '#f87171'} />
          <span style={{ color: 'var(--text-muted)' }}>Backend:</span>
          <span
            style={{
              color: systemHealth.backend === 'ONLINE' ? '#10b981' : '#f87171',
              fontWeight: 700,
              textShadow: systemHealth.backend === 'ONLINE' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {systemHealth.backend}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Database size={14} color={systemHealth.database === 'CONNECTED' ? '#10b981' : '#64748b'} />
          <span style={{ color: 'var(--text-muted)' }}>Supabase:</span>
          <span
            style={{
              color: systemHealth.database === 'CONNECTED' ? '#10b981' : '#f87171',
              fontWeight: 700,
              textShadow: systemHealth.database === 'CONNECTED' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {systemHealth.database}
          </span>
        </div>
      </div>

      {/* Control Actions & Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-secondary btn-sm"
          onClick={onOpenHardwareGuide}
          title="Hardware Connection & YOLO11 Integration Guide"
        >
          <Wrench size={13} />
          <span>Hardware Guide</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`btn btn-sm ${isDemoMode ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onToggleDemoMode}
          title="Toggle between controlled DEMO simulation mode and LIVE API mode"
        >
          {isDemoMode ? 'Switch to LIVE' : 'Switch to DEMO'}
        </motion.button>

        {/* Notification Icon */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(5, 10, 22, 0.85)',
              border: '1px solid var(--border-subtle)',
              color: activeHazardsCount > 0 ? '#f87171' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={`${activeHazardsCount} active hazard alerts`}
          >
            <Bell size={14} />
          </div>
          {activeHazardsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
          )}
        </div>

        <motion.button
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          title="Refresh telemetry status"
        >
          <RefreshCw size={13} />
        </motion.button>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--accent-cyan)',
            padding: '0.35rem 0.75rem',
            backgroundColor: 'rgba(5, 10, 22, 0.85)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)',
            fontWeight: 700,
          }}
        >
          {time}
        </div>
      </div>
    </motion.header>
  );
};
