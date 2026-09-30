import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Send, Zap } from 'lucide-react';
import type { LoRaPacket, RoadsideUnit } from '../types';

interface LoRaCommunicationPanelProps {
  activePacket: LoRaPacket | null;
  rsus: RoadsideUnit[];
  onBroadcastTestPacket?: () => void;
}

export const LoRaCommunicationPanel: React.FC<LoRaCommunicationPanelProps> = ({
  activePacket,
  rsus,
  onBroadcastTestPacket,
}) => {
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
              LoRa SUB-GHZ WIRELESS PROPAGATION MESH
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              433 MHz / 868 MHz Long-Range Low-Power Inter-RSU Telemetry
            </p>
          </div>
        </div>

        <button
          className="btn btn-sm btn-secondary"
          onClick={onBroadcastTestPacket}
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
        >
          <Send size={12} />
          <span>Ping Test Packet</span>
        </button>
      </div>

      {/* Packet Transmission Visual Pipeline */}
      <div
        style={{
          backgroundColor: 'rgba(6, 12, 24, 0.85)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Node 1: RSU-01 */}
          <div style={{ textAlign: 'center', width: '130px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '2px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.4rem',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Radio size={20} color="#38bdf8" />
            </div>
            <strong style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>RSU-01</strong>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hazard Origin (Apex)</div>
          </div>

          {/* Packet Movement Line 1 */}
          <div style={{ flex: 1, position: 'relative', height: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', margin: '0 0.75rem' }}>
            {activePacket && (
              <motion.div
                initial={{ left: '0%' }}
                animate={{ left: '100%' }}
                transition={{ duration: 0.8, repeat: activePacket.active ? Infinity : 0, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 14px #ef4444',
                  border: '2px solid #ffffff',
                }}
              />
            )}
            <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              LoRa 433 MHz • 18ms
            </div>
          </div>

          {/* Node 2: RSU-02 */}
          <div style={{ textAlign: 'center', width: '130px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: rsus[1]?.led_state === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                border: `2px solid ${rsus[1]?.led_state === 'RED' ? '#ef4444' : '#10b981'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.4rem',
                boxShadow: rsus[1]?.led_state === 'RED' ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              <Zap size={20} color={rsus[1]?.led_state === 'RED' ? '#ef4444' : '#10b981'} />
            </div>
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>RSU-02</strong>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Uphill Approach (200m)</div>
          </div>

          {/* Packet Movement Line 2 */}
          <div style={{ flex: 1, position: 'relative', height: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', margin: '0 0.75rem' }}>
            {activePacket && (
              <motion.div
                initial={{ left: '0%' }}
                animate={{ left: '100%' }}
                transition={{ duration: 0.8, delay: 0.4, repeat: activePacket.active ? Infinity : 0, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 14px #ef4444',
                  border: '2px solid #ffffff',
                }}
              />
            )}
            <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Mesh Hop 2 • 16ms
            </div>
          </div>

          {/* Node 3: RSU-03 */}
          <div style={{ textAlign: 'center', width: '130px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: rsus[2]?.led_state === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                border: `2px solid ${rsus[2]?.led_state === 'RED' ? '#ef4444' : '#10b981'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.4rem',
                boxShadow: rsus[2]?.led_state === 'RED' ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              <Zap size={20} color={rsus[2]?.led_state === 'RED' ? '#ef4444' : '#10b981'} />
            </div>
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>RSU-03</strong>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Downhill Approach (200m)</div>
          </div>
        </div>
      </div>

      {/* Packet Metadata Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.74rem',
          backgroundColor: 'rgba(10, 20, 38, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Active Packet: </span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            {activePacket ? activePacket.packet_id : 'STANDBY_HEARTBEAT'}
          </strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Transmission Delay: </span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>
            {activePacket ? `${activePacket.latency_ms} ms` : '18 ms'}
          </strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>RF Frequency: </span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>433.0 MHz</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Mesh RSSI: </span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>-72 dBm (Excellent)</strong>
        </div>
      </div>
    </div>
  );
};
