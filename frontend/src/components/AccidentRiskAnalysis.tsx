import React from 'react';
import { Info, BarChart2 } from 'lucide-react';
import type { AccidentRiskBreakdown } from '../types';

interface AccidentRiskAnalysisProps {
  risk: AccidentRiskBreakdown;
}

export const AccidentRiskAnalysis: React.FC<AccidentRiskAnalysisProps> = ({ risk }) => {
  const isHighRisk = risk.overall_score >= 70;
  const isMedRisk = risk.overall_score >= 40 && risk.overall_score < 70;

  const scoreColor = isHighRisk ? '#ef4444' : isMedRisk ? '#f59e0b' : '#10b981';

  const factors = [
    { label: 'Atmospheric Fog / Poor Visibility', value: risk.fog_factor, max: 35, color: '#38bdf8' },
    { label: 'Stationary / Stalled Obstruction', value: risk.stalled_vehicle_factor, max: 40, color: '#ef4444' },
    { label: 'Blind-Turn Geometric Hazard', value: risk.blind_curve_factor, max: 15, color: '#f59e0b' },
    { label: 'Corridor Traffic Density', value: risk.traffic_density_factor, max: 6, color: '#818cf8' },
    { label: 'Apex Approach Speed Differential', value: risk.approach_speed_factor, max: 4, color: '#c084fc' },
  ];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${scoreColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${scoreColor}66`,
            }}
          >
            <BarChart2 size={18} color={scoreColor} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ACCIDENT RISK ANALYSIS
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Multi-Factor Engineering Predictive Safety Index
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          [PROTOTYPE RISK SCORE]
        </span>
      </div>

      {/* Main Score Bar & Radial */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '150px 1fr',
          gap: '1.25rem',
          alignItems: 'center',
          backgroundColor: 'rgba(6, 12, 24, 0.75)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
        }}
      >
        {/* Score Dial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * risk.overall_score) / 100}
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
              <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: scoreColor }}>
                {risk.overall_score}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                / 100 Risk
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: scoreColor,
              marginTop: '0.35rem',
            }}
          >
            {isHighRisk ? 'CRITICAL RISK' : isMedRisk ? 'MODERATE CAUTION' : 'LOW RISK'}
          </span>
        </div>

        {/* Detailed Contributing Factors Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {factors.map((f) => {
            const factorPct = Math.round((f.value / f.max) * 100);
            return (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.15rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: f.color, fontWeight: 700 }}>
                    {f.value} / {f.max}
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${factorPct}%`,
                      backgroundColor: f.color,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Info size={12} />
        <span>Calculated dynamically from real-time optical fog density, YOLO vehicle stationary timer, and blind curve apex geometry.</span>
      </div>
    </div>
  );
};
