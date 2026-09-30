import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert, HazardLevel } from '../types';
import { AlertTriangle, ShieldCheck, AlertCircle, Clock, Camera as CameraIcon, CheckCircle2, Radio } from 'lucide-react';

interface AlertPanelProps {
  alerts: Alert[];
  currentHazard: HazardLevel;
  primaryCameraId?: string;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  currentHazard,
  primaryCameraId = 'CAM001',
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Find the primary reason for current status
  const latestAlert = alerts.find((a) => a.camera_id === primaryCameraId) || alerts[0];
  const primaryReason =
    currentHazard === 'ALERT'
      ? latestAlert?.message || 'Potential obstruction detected in blind turn zone.'
      : currentHazard === 'CAUTION'
      ? latestAlert?.message || 'Vehicle detected near monitored blind-turn section.'
      : 'No immediate hazard detected. Monitored road section is clear.';

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALERT') return a.severity === 'ALERT';
    if (filterSeverity === 'CAUTION') return a.severity === 'CAUTION';
    if (filterSeverity === 'UNRESOLVED') return !a.resolved;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Primary Status Banner with Dynamic 3D Neon Aura */}
      <div
        className="card"
        style={{
          borderLeft: `6px solid ${
            currentHazard === 'ALERT'
              ? 'var(--color-alert)'
              : currentHazard === 'CAUTION'
              ? 'var(--color-caution)'
              : 'var(--color-normal)'
          }`,
          backgroundColor:
            currentHazard === 'ALERT'
              ? 'rgba(239, 68, 68, 0.12)'
              : currentHazard === 'CAUTION'
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(16, 185, 129, 0.08)',
          boxShadow:
            currentHazard === 'ALERT'
              ? '0 0 35px rgba(239, 68, 68, 0.35)'
              : currentHazard === 'CAUTION'
              ? '0 0 25px rgba(245, 158, 11, 0.25)'
              : '0 0 20px rgba(16, 185, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CURRENT HAZARD STATUS:
              </span>
              <span
                className={`badge ${
                  currentHazard === 'ALERT'
                    ? 'badge-alert'
                    : currentHazard === 'CAUTION'
                    ? 'badge-caution'
                    : 'badge-normal'
                }`}
                style={{ fontSize: '0.85rem' }}
              >
                {currentHazard === 'ALERT' && <AlertTriangle size={14} />}
                {currentHazard === 'CAUTION' && <AlertTriangle size={14} />}
                {currentHazard === 'NORMAL' && <ShieldCheck size={14} />}
                {currentHazard}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem', letterSpacing: '0.01em' }}>
              {primaryReason}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CameraIcon size={14} color="#38bdf8" /> Camera: <strong style={{ color: 'var(--text-primary)' }}>{primaryCameraId}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color="#f59e0b" /> Evaluated: <strong style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleTimeString()}</strong>
              </span>
            </div>
          </div>

          {/* Action response indicator */}
          <div
            style={{
              padding: '0.75rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(5, 10, 22, 0.85)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.76rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              ROADWAY SIGN BEACON
            </div>
            <div
              style={{
                fontWeight: 800,
                color: currentHazard === 'ALERT' ? '#f87171' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Radio size={12} className="pulse" />
              {currentHazard === 'ALERT'
                ? '⚠️ BLIND-TURN WARNING SIGN ACTIVATED'
                : currentHazard === 'CAUTION'
                ? '⚡ SLOW SPEED ADVISORY BROADCAST'
                : '✓ CLEAR CORRIDOR BEACON ACTIVE'}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Alert Log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertCircle size={18} color="#f59e0b" />
            <span>Hazard Alert Event Log</span>
          </div>

          {/* Filter options */}
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {(['ALL', 'ALERT', 'CAUTION', 'UNRESOLVED'] as const).map((mode) => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.95 }}
                className={`btn btn-sm ${filterSeverity === mode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterSeverity(mode)}
              >
                {mode}
              </motion.button>
            ))}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No alerts matching current filter
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Severity</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Camera ID</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Alert Type</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Reason & Message</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>State</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAlerts.map((alt) => (
                    <motion.tr
                      key={alt.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor:
                          alt.severity === 'ALERT' && !alt.resolved ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span
                          className={`badge ${
                            alt.severity === 'ALERT'
                              ? 'badge-alert'
                              : alt.severity === 'CAUTION'
                              ? 'badge-caution'
                              : 'badge-normal'
                          }`}
                        >
                          {alt.severity}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {alt.camera_id}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {alt.alert_type}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-primary)', maxWidth: '420px', lineHeight: '1.4' }}>
                        {alt.message}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(alt.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        {alt.resolved ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-normal)', fontSize: '0.76rem', fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Resolved
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-alert)', fontSize: '0.76rem', fontWeight: 700 }}>
                            Active Risk
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
