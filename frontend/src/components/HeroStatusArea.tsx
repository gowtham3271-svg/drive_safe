import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ShieldAlert, CloudFog, Radio, Waves } from 'lucide-react';
import type { HazardLevel, FogState } from '../types';

interface HeroStatusAreaProps {
  systemStatus: HazardLevel;
  fog: FogState;
  activeHazardsCount: number;
  connectedUnitsCount: number;
  isDemoMode?: boolean;
}

export const HeroStatusArea: React.FC<HeroStatusAreaProps> = ({
  systemStatus,
  fog,
  activeHazardsCount,
  connectedUnitsCount,
  isDemoMode = false,
}) => {
  const isAlert = systemStatus === 'ALERT';
  const isCaution = systemStatus === 'CAUTION';

  const statusColor = isAlert ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981';
  const statusGlow = isAlert
    ? 'rgba(239, 68, 68, 0.45)'
    : isCaution
    ? 'rgba(245, 158, 11, 0.35)'
    : 'rgba(16, 185, 129, 0.35)';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        border: `1px solid ${statusColor}`,
        boxShadow: `0 0 35px ${statusGlow}, inset 0 0 30px rgba(0, 0, 0, 0.8)`,
        backgroundImage: isAlert
          ? 'radial-gradient(circle at 10% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)'
          : isCaution
          ? 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.12) 0%, transparent 60%)'
          : 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Meta Line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'var(--accent-cyan)',
              textTransform: 'uppercase',
            }}
          >
            GHAT ROAD SAFETY MONITOR • NH-48 KHANDALA GHAT
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              color: isDemoMode ? '#c084fc' : '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            {isDemoMode ? 'SIMULATION MODE' : 'LIVE TELEMETRY'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Waves size={12} color="#38bdf8" />
            <span>DETECT ➔ UNDERSTAND ➔ COMMUNICATE ➔ WARN</span>
          </span>
        </div>
      </div>

      {/* Main Hero Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center',
        }}
      >
        {/* Main Status Block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: `${statusColor}22`,
              border: `2px solid ${statusColor}`,
              boxShadow: `0 0 20px ${statusColor}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAlert ? (
              <ShieldAlert size={32} color="#ef4444" className="pulse" />
            ) : isCaution ? (
              <AlertTriangle size={32} color="#f59e0b" className="pulse" />
            ) : (
              <ShieldCheck size={32} color="#10b981" />
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              SYSTEM STATUS
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: statusColor,
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.1,
                letterSpacing: '0.04em',
              }}
            >
              {systemStatus === 'ALERT' ? 'HAZARD' : systemStatus === 'CAUTION' ? 'CAUTION' : 'SAFE'}
            </div>
          </div>
        </div>

        {/* Visibility Score */}
        <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Visibility Index
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {fog.visibility_score}%
            </span>
            <span style={{ fontSize: '0.75rem', color: fog.visibility_score > 60 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              {fog.visibility_score > 75 ? 'OPTIMAL' : fog.visibility_score > 40 ? 'RESTRICTED' : 'POOR'}
            </span>
          </div>
        </div>

        {/* Fog Condition */}
        <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Atmospheric Fog
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
            <CloudFog size={18} color={fog.density_percent > 50 ? '#f59e0b' : '#38bdf8'} />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {fog.status}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({fog.density_percent}%)
            </span>
          </div>
        </div>

        {/* Active Hazards */}
        <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Active Hazards
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
            <span
              style={{
                fontSize: '1.6rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: activeHazardsCount > 0 ? '#ef4444' : '#10b981',
              }}
            >
              {activeHazardsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeHazardsCount === 0 ? 'Clear Flow' : 'Imminent Conflict'}
            </span>
          </div>
        </div>

        {/* Connected Units */}
        <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Connected Units
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {connectedUnitsCount} / 3
            </span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Radio size={11} className="pulse" /> RSU MESH ONLINE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
