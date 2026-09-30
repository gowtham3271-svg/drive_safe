import React from 'react';
import { CloudFog } from 'lucide-react';
import type { FogState } from '../types';

interface FogVisibilityPanelProps {
  fog: FogState;
  onFogChange: (density: number) => void;
}

export const FogVisibilityPanel: React.FC<FogVisibilityPanelProps> = ({
  fog,
  onFogChange,
}) => {
  const isCritical = fog.density_percent >= 75;
  const isDense = fog.density_percent >= 50 && fog.density_percent < 75;
  const isModerate = fog.density_percent >= 25 && fog.density_percent < 50;

  const levelColor = isCritical ? '#ef4444' : isDense ? '#f59e0b' : isModerate ? '#38bdf8' : '#10b981';

  return (
    <div className="card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Panel Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <CloudFog size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                FOG & VISIBILITY MONITOR
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Optical Scatter Sensor • Attenuation Index
              </p>
            </div>
          </div>

          <span
            className="badge"
            style={{
              backgroundColor: `${levelColor}22`,
              color: levelColor,
              border: `1px solid ${levelColor}66`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            {fog.status}
          </span>
        </div>

        {/* Circular / Arc Visibility Gauge Visualization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'rgba(6, 12, 24, 0.8)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
          }}
        >
          {/* Radial Gauge SVG */}
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="10"
              />
              {/* Progress Arc */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={levelColor}
                strokeWidth="10"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * fog.visibility_score) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
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
              <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {fog.visibility_score}%
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Visibility
              </span>
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Fog Density:</span>
              <strong style={{ color: levelColor, fontFamily: 'var(--font-mono)' }}>{fog.density_percent}%</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sight Distance:</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {Math.round((fog.visibility_score / 100) * 180)} m
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Temperature:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{fog.temperature_c}°C</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Humidity:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{fog.humidity_percent}%</span>
            </div>
          </div>
        </div>

        {/* Interactive Fog Density Slider */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Interactive Fog Simulation Slider:
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {fog.density_percent}% Density
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={fog.density_percent}
            onChange={(e) => onFogChange(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: levelColor,
              cursor: 'pointer',
              height: '6px',
              borderRadius: '3px',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <span>0% (Clear)</span>
            <span>25% (Mild)</span>
            <span>50% (Dense)</span>
            <span>75% (Severe)</span>
            <span>100% (Blind)</span>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.5rem' }}>
        {[
          { label: 'Clear', val: 12, color: '#10b981' },
          { label: 'Moderate', val: 38, color: '#38bdf8' },
          { label: 'Dense', val: 68, color: '#f59e0b' },
          { label: 'Critical', val: 92, color: '#ef4444' },
        ].map((p) => (
          <button
            key={p.label}
            className="btn btn-sm btn-secondary"
            onClick={() => onFogChange(p.val)}
            style={{
              fontSize: '0.68rem',
              padding: '0.25rem 0.2rem',
              backgroundColor: Math.abs(fog.density_percent - p.val) <= 12 ? 'rgba(56, 189, 248, 0.2)' : undefined,
              borderColor: Math.abs(fog.density_percent - p.val) <= 12 ? 'var(--accent-cyan)' : undefined,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
