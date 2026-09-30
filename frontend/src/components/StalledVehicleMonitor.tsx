import React from 'react';
import { Car, Play, Square, Settings } from 'lucide-react';
import type { StalledVehicleState } from '../types';

interface StalledVehicleMonitorProps {
  stalledVehicle: StalledVehicleState;
  onStopVehicle: (thresholdSec?: number) => void;
  onResumeTransit: () => void;
  onThresholdChange?: (thresholdSec: number) => void;
}

export const StalledVehicleMonitor: React.FC<StalledVehicleMonitorProps> = ({
  stalledVehicle,
  onStopVehicle,
  onResumeTransit,
  onThresholdChange,
}) => {
  const isStopped = stalledVehicle.is_stationary;
  const isHazard = stalledVehicle.hazard_triggered;
  const isWarning = isStopped && !isHazard;

  const duration = stalledVehicle.stopped_duration_sec;
  const threshold = stalledVehicle.threshold_sec;
  const progressPct = Math.min(100, Math.round((duration / threshold) * 100));

  const stateColor = isHazard ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  return (
    <div className="card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: `${stateColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${stateColor}66`,
              }}
            >
              <Car size={18} color={stateColor} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                STATIONARY VEHICLE MONITOR
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Blind-Curve Stopped Obstruction Detection
              </p>
            </div>
          </div>

          <span
            className="badge"
            style={{
              backgroundColor: `${stateColor}22`,
              color: stateColor,
              border: `1px solid ${stateColor}66`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            {isHazard ? 'HAZARD DETECTED' : isWarning ? 'POTENTIAL STALLED VEHICLE' : 'TRANSIT NORMAL'}
          </span>
        </div>

        {/* Telemetry Grid & Visual Timer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px',
            gap: '1rem',
            backgroundColor: 'rgba(6, 12, 24, 0.8)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            alignItems: 'center',
          }}
        >
          {/* Metadata items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Monitored Vehicle:</span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {stalledVehicle.vehicle_id} ({stalledVehicle.type})
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Speed:</span>
              <strong style={{ color: isStopped ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                {stalledVehicle.speed_kmh} km/h {isStopped && '(STOPPED)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{stalledVehicle.location}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Risk Classification:</span>
              <strong style={{ color: stateColor, fontWeight: 800 }}>
                {stalledVehicle.risk_level}
              </strong>
            </div>
          </div>

          {/* Visual Circular Timer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={stateColor}
                  strokeWidth="8"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * progressPct) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                />
              </svg>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: stateColor }}>
                  {duration}s
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                  Limit: {threshold}s
                </span>
              </div>
            </div>

            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
              {isHazard ? 'THRESHOLD EXCEEDED' : isStopped ? 'COUNTING DOWN...' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Configurable Threshold Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Settings size={12} /> Stalled Threshold:
          </span>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {[10, 20, 30, 60].map((sec) => (
              <button
                key={sec}
                className="btn btn-sm btn-secondary"
                onClick={() => onThresholdChange && onThresholdChange(sec)}
                style={{
                  fontSize: '0.66rem',
                  padding: '0.15rem 0.45rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: threshold === sec ? 'rgba(56, 189, 248, 0.25)' : undefined,
                  borderColor: threshold === sec ? 'var(--accent-cyan)' : undefined,
                }}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {!isStopped ? (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onStopVehicle(threshold)}
            style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
          >
            <Square size={13} />
            <span>Simulate Vehicle Breakdown (0 km/h)</span>
          </button>
        ) : (
          <button
            className="btn btn-sm btn-primary"
            onClick={onResumeTransit}
            style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
          >
            <Play size={13} />
            <span>Resume Vehicle Transit (Clear Apex)</span>
          </button>
        )}
      </div>
    </div>
  );
};
