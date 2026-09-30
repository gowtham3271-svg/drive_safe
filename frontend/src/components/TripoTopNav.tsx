import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Cpu,
  Eye,
  Activity,
  Wrench,
  Sparkles,
  Zap,
  RefreshCw,
} from 'lucide-react';
import type { SystemHealth, DashboardView, HazardLevel } from '../types';

interface TripoTopNavProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  systemHealth: SystemHealth;
  systemStatus: HazardLevel;
  activeHazardsCount: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
  onOpenHardwareGuide: () => void;
  onQuickRunDemo?: () => void;
}

export const TripoTopNav: React.FC<TripoTopNavProps> = ({
  currentView,
  onSelectView,
  systemHealth,
  systemStatus,
  activeHazardsCount,
  isDemoMode,
  onToggleDemoMode,
  onRefresh,
  onOpenHardwareGuide,
  onQuickRunDemo,
}) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAlert = systemStatus === 'ALERT';
  const isCaution = systemStatus === 'CAUTION';

  const statusBg = isAlert
    ? 'rgba(239, 68, 68, 0.25)'
    : isCaution
    ? 'rgba(245, 158, 11, 0.25)'
    : 'rgba(16, 185, 129, 0.2)';

  const statusBorder = isAlert
    ? '#ef4444'
    : isCaution
    ? '#f59e0b'
    : '#10b981';

  const statusColor = isAlert ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981';

  const navTabs: { id: DashboardView; label: string }[] = [
    { id: 'dashboard', label: '🛡️ Safety Operations' },
    { id: 'flythrough', label: '🎬 3D Fly-Through' },
    { id: 'map', label: '🗺️ Hazard Map' },
    { id: 'simulation', label: '⚡ Viva Demo' },
    { id: 'system_health', label: '⚙️ Diagnostics' },
  ];

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: '#121215',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        userSelect: 'none',
      }}
    >
      {/* Left: Brand Icon + Studio Selector Dropdown (Tripo3D style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Brand Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.45)',
            }}
            onClick={() => onSelectView('dashboard')}
            title="GHATGUARD Platform"
          >
            <ShieldAlert size={20} />
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em' }}>
                GHATGUARD
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                YOLO11 EDGE
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>NH-48 Khandala Ghat Hairpin #4</span>
          </div>
        </div>

        <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Center Navigation Tabs (Tripo3D style clean underline) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navTabs.slice(0, 5).map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                style={{
                  position: 'relative',
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#a1a1aa',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tripoNavUnderline"
                    style={{
                      position: 'absolute',
                      bottom: '-7px',
                      left: '12%',
                      right: '12%',
                      height: '2px',
                      backgroundColor: '#ffd200',
                      borderRadius: '2px',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Hardware Telemetry, System State, and Tripo3D Golden Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Hardware Status Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            backgroundColor: '#18181c',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cpu size={12} color={systemHealth.raspberry_pi === 'ONLINE' ? '#10b981' : '#64748b'} />
            <span style={{ color: '#71717a' }}>Pi 4:</span>
            <span style={{ color: systemHealth.raspberry_pi === 'ONLINE' ? '#10b981' : '#f87171', fontWeight: 700 }}>
              {systemHealth.raspberry_pi}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Eye size={12} color={systemHealth.yolo11 === 'CONNECTED' ? '#10b981' : '#64748b'} />
            <span style={{ color: '#71717a' }}>YOLO11:</span>
            <span style={{ color: systemHealth.yolo11 === 'CONNECTED' ? '#10b981' : '#f87171', fontWeight: 700 }}>
              {systemHealth.yolo11}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Activity size={12} color={systemHealth.backend === 'ONLINE' ? '#10b981' : '#f87171'} />
            <span style={{ color: '#71717a' }}>API:</span>
            <span style={{ color: systemHealth.backend === 'ONLINE' ? '#10b981' : '#f87171', fontWeight: 700 }}>
              {systemHealth.backend}
            </span>
          </div>
        </div>

        {/* Real-time Clock */}
        <span
          style={{
            fontSize: '0.72rem',
            color: '#71717a',
            fontFamily: 'var(--font-mono)',
            padding: '0 0.2rem',
          }}
          title="System Time"
        >
          {time}
        </span>

        {/* System Status Pill */}
        <motion.div
          animate={{ scale: isAlert ? [1, 1.06, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: statusBg,
            border: `1px solid ${statusBorder}`,
            color: statusColor,
            fontSize: '0.72rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            boxShadow: `0 0 12px ${statusBg}`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
          <span>{systemStatus === 'ALERT' ? 'HAZARD' : systemStatus === 'CAUTION' ? 'CAUTION' : 'SAFE'}</span>
          {activeHazardsCount > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '0.05rem 0.35rem',
                fontSize: '0.62rem',
                fontWeight: 900,
                marginLeft: '0.15rem',
              }}
              title={`${activeHazardsCount} active hazard(s)`}
            >
              {activeHazardsCount}
            </span>
          )}
        </motion.div>

        {/* Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '8px',
            backgroundColor: '#1c1c22',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isDemoMode ? '#f59e0b' : '#38bdf8',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title="Toggle LIVE / DEMO mode"
        >
          <Sparkles size={12} />
          <span>{isDemoMode ? 'DEMO' : 'LIVE'}</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          style={{
            padding: '0.35rem 0.5rem',
            borderRadius: '8px',
            backgroundColor: '#1c1c22',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#a1a1aa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Refresh Telemetry"
        >
          <RefreshCw size={13} />
        </button>

        {/* Hardware Guide */}
        <button
          onClick={onOpenHardwareGuide}
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '8px',
            backgroundColor: '#1c1c22',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#a1a1aa',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
          title="Hardware integration instructions"
        >
          <Wrench size={13} />
          <span>Guide</span>
        </button>

        {/* 3D Fly-Through Quick Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelectView('flythrough')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: currentView === 'flythrough' ? 'rgba(56, 189, 248, 0.25)' : '#1c1c22',
            border: currentView === 'flythrough' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: currentView === 'flythrough' ? '#38bdf8' : '#f4f4f5',
            borderRadius: '9999px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: currentView === 'flythrough' ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
          }}
          title="Scroll-Driven 3D Drone Fly-Through Landing Experience"
        >
          <Sparkles size={13} color="#38bdf8" />
          <span>3D Fly-Through</span>
        </motion.button>

        {/* Tripo3D-style Golden Action Button (Viva Sequence) */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (onQuickRunDemo) onQuickRunDemo();
            else onSelectView('simulation');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#ffd200',
            color: '#000000',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.45rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 210, 0, 0.35)',
            letterSpacing: '0.02em',
          }}
          title="Launch 11-Step Emergency Simulation for Viva"
        >
          <Zap size={14} fill="#000000" />
          <span>Viva Demo ⚡</span>
        </motion.button>
      </div>
    </header>
  );
};
