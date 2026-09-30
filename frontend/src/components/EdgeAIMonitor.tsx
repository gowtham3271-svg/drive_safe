import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

interface EdgeAIMonitorProps {
  isPiConnected?: boolean;
}

export const EdgeAIMonitor: React.FC<EdgeAIMonitorProps> = ({ isPiConnected = true }) => {
  const [fpsHistory, setFpsHistory] = useState<number[]>([27, 28, 29, 28.5, 27.8, 28.2, 29.1, 28.4, 28.8, 28.5]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([36, 35, 34, 38, 33, 34, 32, 35, 33, 34]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFpsHistory((prev) => {
        const nextVal = Number((27.5 + Math.random() * 2.2).toFixed(1));
        return [...prev.slice(1), nextVal];
      });
      setLatencyHistory((prev) => {
        const nextVal = Math.floor(32 + Math.random() * 7);
        return [...prev.slice(1), nextVal];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const latestFps = fpsHistory[fpsHistory.length - 1];
  const latestLatency = latencyHistory[latencyHistory.length - 1];

  // SVG Sparkline path generator
  const getSvgPath = (data: number[], min: number, max: number, height = 30, width = 120) => {
    if (data.length < 2) return '';
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const normalized = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
      const y = height - normalized * height;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

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
            <Cpu size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              EDGE AI INFERENCE & HARDWARE TELEMETRY
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Raspberry Pi 4 • ONNX Runtime Execution Provider
            </p>
          </div>
        </div>

        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {isPiConnected ? 'PI 4 ONLINE • 28.5 FPS' : 'SIMULATED TELEMETRY'}
        </span>
      </div>

      {/* Grid of 4 Key Edge Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
        {/* Metric 1: Model & Inference State */}
        <div style={{ backgroundColor: 'rgba(6, 12, 24, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vision Model</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
            YOLO11-Nano
          </div>
          <div style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>INFERENCE: ACTIVE</span>
          </div>
        </div>

        {/* Metric 2: FPS with Sparkline */}
        <div style={{ backgroundColor: 'rgba(6, 12, 24, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Frame Rate</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {latestFps} FPS
            </span>
          </div>
          <svg viewBox="0 0 120 30" style={{ width: '100%', height: '24px', marginTop: '0.35rem' }}>
            <path d={getSvgPath(fpsHistory, 25, 32, 28, 120)} fill="none" stroke="#10b981" strokeWidth="2" />
          </svg>
        </div>

        {/* Metric 3: Latency with Sparkline */}
        <div style={{ backgroundColor: 'rgba(6, 12, 24, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Latency</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {latestLatency} ms
            </span>
          </div>
          <svg viewBox="0 0 120 30" style={{ width: '100%', height: '24px', marginTop: '0.35rem' }}>
            <path d={getSvgPath(latencyHistory, 28, 42, 28, 120)} fill="none" stroke="#38bdf8" strokeWidth="2" />
          </svg>
        </div>

        {/* Metric 4: Hardware Health (CPU, RAM, Temp) */}
        <div style={{ backgroundColor: 'rgba(6, 12, 24, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hardware Loads</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', marginTop: '0.3rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>CPU</div>
              <strong style={{ color: 'var(--text-primary)' }}>38%</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>RAM</div>
              <strong style={{ color: 'var(--text-primary)' }}>61%</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>TEMP</div>
              <strong style={{ color: '#f59e0b' }}>54°C</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
