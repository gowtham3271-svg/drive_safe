import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Video,
  MapPin,
  Box,
  Crosshair,
  ListOrdered,
  Activity,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import type { DashboardView } from '../types';

interface SidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  activeHazardsCount: number;
  systemStatus?: 'SAFE' | 'CAUTION' | 'HAZARD';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeHazardsCount,
  systemStatus = 'SAFE',
}) => {
  const navItems = [
    { id: 'dashboard' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live_monitor' as DashboardView, label: 'Live Monitoring', icon: Video },
    { id: 'map' as DashboardView, label: 'Hazard Map', icon: MapPin },
    { id: 'twin' as DashboardView, label: '3D Digital Twin', icon: Box },
    {
      id: 'detections' as DashboardView,
      label: 'Detection & Stalled',
      icon: Crosshair,
      badge: activeHazardsCount > 0 ? activeHazardsCount : undefined,
    },
    { id: 'events' as DashboardView, label: 'Event Timeline', icon: ListOrdered },
    { id: 'system_health' as DashboardView, label: 'System Health', icon: Activity },
    {
      id: 'simulation' as DashboardView,
      label: 'Simulation Center',
      icon: PlayCircle,
      badgeText: 'DEMO',
    },
  ];

  const statusColor =
    systemStatus === 'HAZARD'
      ? '#ef4444'
      : systemStatus === 'CAUTION'
      ? '#f59e0b'
      : '#10b981';

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'rgba(11, 21, 40, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-glow)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem 0.9rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
              }}
            >
              GHATGUARD
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              Intelligent Road Safety
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            SYSTEM STATE
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: statusColor,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
            {systemStatus}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectView(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isActive ? 'rgba(56, 189, 248, 0.4)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none',
              }}
            >
              {/* Active sliding indicator border */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    bottom: '15%',
                    width: '3px',
                    borderRadius: '2px',
                    backgroundColor: '#38bdf8',
                    boxShadow: '0 0 10px #38bdf8',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Icon size={17} color={isActive ? '#38bdf8' : '#94a3b8'} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  style={{
                    backgroundColor: 'var(--color-alert)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    padding: '0.1rem 0.45rem',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.badge}
                </motion.span>
              )}

              {item.badgeText && (
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    borderRadius: '4px',
                    padding: '0.1rem 0.35rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.badgeText}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Monitored Corridor telemetry stats footer */}
      <div
        style={{
          marginTop: 'auto',
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(5, 10, 22, 0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>MONITORED ZONE</span>
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>NH-48 KM 74</span>
        </div>
        <div>Khandala Ghat • Blind Hairpin #4</div>
        <div
          style={{
            marginTop: '0.6rem',
            padding: '0.35rem 0.55rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(13, 24, 46, 0.8)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.66rem',
            color: '#60a5fa',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>LoRa: 433 MHz</span>
          <span>RSU Nodes: 3</span>
        </div>
      </div>
    </aside>
  );
};

