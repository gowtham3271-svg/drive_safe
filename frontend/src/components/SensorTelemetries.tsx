import React, { useState, useEffect } from 'react';
import { Waves, Volume2, VolumeX } from 'lucide-react';
import type { SensorReadings } from '../types';

interface SensorTelemetriesProps {
  sensors: SensorReadings;
}

export const SensorTelemetries: React.FC<SensorTelemetriesProps> = ({ sensors }) => {
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [waveformBars, setWaveformBars] = useState<number[]>([40, 65, 80, 55, 30, 70, 90, 60, 45, 85, 50, 65]);

  // Dynamic audio-frequency sonar oscillation mimicking LiDAR-echo from ultrasonic pulses
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 65) + 25)
      );
    }, 250);
    return () => clearInterval(interval);
  }, []);

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
            <Waves size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              MULTI-SENSOR TELEMETRY & ULTRASONIC SONAR
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Acoustic Sonar Echo • Radar Distance • Optical Fog Profile
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Unmute Ultrasonic Audio Feedback' : 'Mute Ultrasonic Audio Feedback'}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}
          >
            {isAudioMuted ? <VolumeX size={12} color="#f59e0b" /> : <Volume2 size={12} color="#10b981" />}
            <span>Sonar Audio {isAudioMuted ? 'Muted' : 'Live'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Sensor Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        {/* 1. Ultrasonic Sonar Sensor with Audio Waveform */}
        <div
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              ULTRASONIC (SONAR / LIDAR)
            </span>
            <span className="badge badge-normal" style={{ fontSize: '0.62rem' }}>
              ACTIVE
            </span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            {sensors.ultrasonic.distance_m} m
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Approaching Blind Apex Distance
          </div>

          {/* Real-Time Audio Frequency Echo Sonar Waveform */}
          <div style={{ backgroundColor: '#020617', padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>40 kHz Audio Echo Pulse:</span>
              <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#10b981' }}>{sensors.ultrasonic.audio_echo_state}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {waveformBars.map((val, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${val}%`,
                    backgroundColor: val > 75 ? '#ef4444' : val > 50 ? '#38bdf8' : '#10b981',
                    borderRadius: '1px',
                    transition: 'height 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. 24GHz Doppler Radar */}
        <div
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              24GHz DOPPLER RADAR
            </span>
            <span className="badge badge-normal" style={{ fontSize: '0.62rem' }}>
              ACTIVE
            </span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
            {sensors.radar.target_distance_m} m
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Target Speed: <strong style={{ color: 'var(--text-primary)' }}>{sensors.radar.doppler_speed_kmh} km/h</strong>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            Tracked Radar Targets: <strong style={{ color: '#38bdf8' }}>{sensors.radar.targets_count} Objects</strong>
          </div>
        </div>

        {/* 3. Optical Fog Density Sensor */}
        <div
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              OPTICAL SCATTER FOG
            </span>
            <span className="badge badge-normal" style={{ fontSize: '0.62rem' }}>
              ACTIVE
            </span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
            {sensors.fog_sensor.density_pct}%
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Attenuation: <strong style={{ color: 'var(--text-primary)' }}>{sensors.fog_sensor.attenuation_coefficient} cm⁻¹</strong>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            Infrared Backscatter: <strong style={{ color: '#10b981' }}>CALIBRATED</strong>
          </div>
        </div>

        {/* 4. Solid-State LiDAR (Demo) */}
        <div
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              MINI SOLID-STATE LiDAR
            </span>
            <span style={{ fontSize: '0.62rem', color: '#c084fc', fontFamily: 'monospace' }}>
              [DEMO]
            </span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
            {sensors.lidar.point_cloud_density}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            3D Point Cloud Spatial Resolution
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            Range: <strong>0.2m - 45m (120° FOV)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
