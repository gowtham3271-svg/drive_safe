import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Cpu,
  Car,
  AlertTriangle,
  Send,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { HazardLevel } from '../types';

interface HazardPipelineViewProps {
  systemStatus: HazardLevel;
}

export const HazardPipelineView: React.FC<HazardPipelineViewProps> = ({ systemStatus }) => {
  const [activeStage, setActiveStage] = useState<number>(0);

  // Subtle cyclic animation through processing pipeline stages
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 6);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    {
      id: 0,
      title: 'SENSOR INPUT',
      desc: 'Camera, Radar, Ultrasonic, Fog, Thermal',
      icon: Camera,
      color: '#38bdf8',
    },
    {
      id: 1,
      title: 'SENSOR FUSION',
      desc: 'Spatial Alignment & Signal Cross-Validation',
      icon: Layers,
      color: '#818cf8',
    },
    {
      id: 2,
      title: 'EDGE PROCESSING',
      desc: 'Raspberry Pi 4 • YOLO11 ONNX (FP16)',
      icon: Cpu,
      color: '#c084fc',
    },
    {
      id: 3,
      title: 'VEHICLE DETECTION',
      desc: 'Cars, Trucks, Bikes, Speed & Lane Tracking',
      icon: Car,
      color: '#38bdf8',
    },
    {
      id: 4,
      title: 'HAZARD ANALYSIS',
      desc: 'Blind Apex Proximity & Stalled Duration Timer',
      icon: AlertTriangle,
      color: systemStatus === 'ALERT' ? '#ef4444' : systemStatus === 'CAUTION' ? '#f59e0b' : '#10b981',
    },
    {
      id: 5,
      title: 'WARNING DECISION',
      desc: 'LoRa 433MHz Mesh & Roadside LED Trigger',
      icon: Send,
      color: systemStatus === 'ALERT' ? '#ef4444' : '#10b981',
    },
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
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Sparkles size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              HAZARD DETECTION & DECISION ENGINE
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Multi-Stage Edge Pipeline • Autonomous Warning Execution
            </p>
          </div>
        </div>

        <span
          className="badge"
          style={{
            backgroundColor: systemStatus === 'ALERT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: systemStatus === 'ALERT' ? '#f87171' : '#34d399',
            border: `1px solid ${systemStatus === 'ALERT' ? '#ef4444' : '#10b981'}`,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {systemStatus === 'ALERT' ? 'HAZARD ACTIVE' : 'PIPELINE ACTIVE'}
        </span>
      </div>

      {/* Horizontal Interactive Pipeline Visualizer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.65rem',
          position: 'relative',
        }}
      >
        {stages.map((stg, i) => {
          const Icon = stg.icon;
          const isCurrentActive = activeStage === stg.id;
          const isHazardTriggered = stg.id >= 4 && systemStatus === 'ALERT';

          return (
            <motion.div
              key={stg.id}
              whileHover={{ y: -3 }}
              style={{
                backgroundColor: isCurrentActive
                  ? 'rgba(15, 28, 55, 0.95)'
                  : 'rgba(8, 16, 32, 0.75)',
                border: '1px solid',
                borderColor: isHazardTriggered
                  ? '#ef4444'
                  : isCurrentActive
                  ? stg.color
                  : 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '110px',
                boxShadow: isCurrentActive ? `0 0 20px ${stg.color}33` : 'none',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Step indicator top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: isCurrentActive ? stg.color : 'var(--text-muted)',
                    fontWeight: 800,
                  }}
                >
                  STAGE 0{i + 1}
                </span>

                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCurrentActive ? stg.color : 'rgba(255, 255, 255, 0.15)',
                  }}
                  className={isCurrentActive ? 'pulse' : ''}
                />
              </div>

              {/* Icon & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <Icon size={16} color={isHazardTriggered ? '#ef4444' : stg.color} />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stg.title}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {stg.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
