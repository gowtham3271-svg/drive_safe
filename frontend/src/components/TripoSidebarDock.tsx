import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  MapPin,
  Activity,
  PlayCircle,
  Compass,
} from 'lucide-react';
import type { DashboardView, HazardLevel } from '../types';

interface TripoSidebarDockProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  activeHazardsCount: number;
  systemStatus: HazardLevel;
}

export const TripoSidebarDock: React.FC<TripoSidebarDockProps> = ({
  currentView,
  onSelectView,
  activeHazardsCount,
  systemStatus,
}) => {
  const dockItems: {
    id: DashboardView;
    label: string;
    icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Safety', icon: ShieldAlert, badge: activeHazardsCount > 0 ? activeHazardsCount : undefined },
    { id: 'flythrough', label: 'Fly-Thru', icon: Compass },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'simulation', label: 'Demo ⚡', icon: PlayCircle },
    { id: 'system_health', label: 'Health', icon: Activity },
  ];

  return (
    <aside
      style={{
        width: '68px',
        backgroundColor: '#121215',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.85rem 0',
        zIndex: 40,
        height: 'calc(100vh - 56px)',
        userSelect: 'none',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', alignItems: 'center' }}>
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectView(item.id)}
              style={{
                position: 'relative',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: isActive ? '#24242e' : 'transparent',
                border: isActive ? '1px solid #ffd200' : '1px solid transparent',
                color: isActive ? '#ffd200' : '#a1a1aa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 16px rgba(255, 210, 0, 0.18)' : 'none',
              }}
              title={item.label}
            >
              <Icon size={19} color={isActive ? '#ffd200' : '#9ca3af'} />
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: isActive ? 800 : 500,
                  letterSpacing: '0.01em',
                  color: isActive ? '#ffffff' : '#71717a',
                }}
              >
                {item.label}
              </span>

              {item.badge !== undefined && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    padding: '0.05rem 0.35rem',
                    boxShadow: '0 0 8px #ef4444',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Status Dot */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: systemStatus === 'ALERT' ? '#ef4444' : systemStatus === 'CAUTION' ? '#f59e0b' : '#10b981',
            boxShadow: `0 0 10px ${systemStatus === 'ALERT' ? '#ef4444' : systemStatus === 'CAUTION' ? '#f59e0b' : '#10b981'}`,
          }}
          title={`Status: ${systemStatus}`}
        />
        <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
          433MHz
        </span>
      </div>
    </aside>
  );
};
