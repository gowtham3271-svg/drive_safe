import React from 'react';
import { motion } from 'framer-motion';
import { Radio, BatteryCharging, Sun, Zap } from 'lucide-react';
import type { RoadsideUnit } from '../types';

interface RoadsideWarningSystemProps {
  rsus: RoadsideUnit[];
  onTriggerLed?: (rsuId: string, state: 'GREEN' | 'YELLOW' | 'RED') => void;
}

export const RoadsideWarningSystem: React.FC<RoadsideWarningSystemProps> = ({ rsus, onTriggerLed: _onTriggerLed }) => {
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
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Radio size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ROADSIDE WARNING LED STROBE NETWORK
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Advance Warning Visual Arrays • Solar-Powered IoT Mesh
            </p>
          </div>
        </div>

        <span className="badge badge-normal">3 NODES CONNECTED</span>
      </div>

      {/* 3 RSU Unit Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {rsus.map((rsu) => {
          const isRed = rsu.led_state === 'RED';
          const isYellow = rsu.led_state === 'YELLOW';

          const activeColor = isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#10b981';

          return (
            <motion.div
              key={rsu.id}
              whileHover={{ y: -3 }}
              style={{
                backgroundColor: 'rgba(6, 12, 24, 0.85)',
                border: '1px solid',
                borderColor: isRed ? '#ef4444' : isYellow ? '#f59e0b' : 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                boxShadow: isRed
                  ? '0 0 25px rgba(239, 68, 68, 0.35)'
                  : isYellow
                  ? '0 0 20px rgba(245, 158, 11, 0.25)'
                  : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Unit Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      {rsu.id}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#10b981', fontFamily: 'monospace' }}>
                      ● {rsu.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rsu.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {rsu.location}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: `${activeColor}22`,
                    color: activeColor,
                    border: `1px solid ${activeColor}66`,
                  }}
                >
                  {rsu.led_state}
                </span>
              </div>

              {/* Physical LED Light Bar Array Visualization */}
              <div
                style={{
                  backgroundColor: '#030712',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Roadside Strobe Array:
                </div>

                {/* 5 High-Intensity LEDs in a row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: activeColor,
                        boxShadow: `0 0 16px ${activeColor}, inset 0 0 6px #ffffff`,
                        border: '1px solid #ffffff',
                        animation: isRed ? `pulse 0.6s infinite ${idx * 0.1}s` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* IoT Hardware Telemetry Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sun size={11} color="#f59e0b" />
                  <span>Solar: <strong style={{ color: 'var(--text-primary)' }}>{rsu.solar_charge_pct}%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <BatteryCharging size={11} color="#10b981" />
                  <span>Batt: <strong style={{ color: 'var(--text-primary)' }}>{rsu.battery_pct}%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Radio size={11} color="#38bdf8" />
                  <span>LoRa: <strong style={{ fontFamily: 'monospace' }}>{rsu.lora_rssi_dbm} dBm</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Zap size={11} color="#c084fc" />
                  <span>Freq: <strong style={{ fontFamily: 'monospace' }}>{rsu.lora_freq_mhz} MHz</strong></span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
