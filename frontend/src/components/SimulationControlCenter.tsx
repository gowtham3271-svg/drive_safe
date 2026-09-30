import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  CloudFog,
  Car,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { COLLEGE_DEMO_STEPS } from '../services/mockData';
import type { FogState, StalledVehicleState } from '../types';

interface SimulationControlCenterProps {
  currentStep: number;
  onSetStep: (stepNum: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  onReset: () => void;
  fog: FogState;
  onFogChange: (density: number) => void;
  stalledVehicle: StalledVehicleState;
  onStopVehicle: (threshold?: number) => void;
  onResumeVehicle: () => void;
  onTriggerLoRa: () => void;
}

export const SimulationControlCenter: React.FC<SimulationControlCenterProps> = ({
  currentStep,
  onSetStep,
  onNextStep,
  onPrevStep,
  isAutoPlaying,
  onToggleAutoPlay,
  onReset,
  fog,
  onFogChange,
  stalledVehicle,
  onStopVehicle,
  onResumeVehicle,
  onTriggerLoRa,
}) => {
  const activeStepData = COLLEGE_DEMO_STEPS.find((s) => s.step === currentStep) || COLLEGE_DEMO_STEPS[0];

  const statusColor =
    activeStepData.system_status === 'HAZARD'
      ? '#ef4444'
      : activeStepData.system_status === 'CAUTION'
      ? '#f59e0b'
      : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Guided College Demo Runner */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          border: `1px solid ${statusColor}`,
          boxShadow: `0 0 30px ${statusColor}33`,
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                11-STEP ACCIDENT PREVENTION DEMO RUNNER
              </h2>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Step-by-step walkthrough engineered for college viva and project demonstrations.
            </p>
          </div>

          {/* Master Step Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={onPrevStep}
              disabled={currentStep <= 1}
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <SkipBack size={13} />
              <span>Prev</span>
            </button>

            <button
              className={`btn btn-sm ${isAutoPlaying ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onToggleAutoPlay}
              style={{ padding: '0.35rem 0.85rem' }}
            >
              {isAutoPlaying ? <Pause size={13} /> : <Play size={13} color="#10b981" />}
              <span>{isAutoPlaying ? 'Pause Auto-Play' : 'Auto-Play Sequence'}</span>
            </button>

            <button
              className="btn btn-sm btn-primary"
              onClick={onNextStep}
              style={{ padding: '0.35rem 0.95rem', fontWeight: 800 }}
            >
              <span>Next Step ({currentStep < 11 ? `Step ${currentStep + 1}` : 'Restart'})</span>
              <SkipForward size={13} />
            </button>

            <button
              className="btn btn-sm btn-secondary"
              onClick={onReset}
              title="Reset System to Green Safe State"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 11 Step Badges Horizontal Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 1fr)',
            gap: '0.35rem',
            marginBottom: '1.25rem',
            overflowX: 'auto',
          }}
        >
          {COLLEGE_DEMO_STEPS.map((s) => {
            const isCurrent = s.step === currentStep;
            const isPast = s.step < currentStep;
            const stepCol = s.system_status === 'HAZARD' ? '#ef4444' : s.system_status === 'CAUTION' ? '#f59e0b' : '#10b981';

            return (
              <button
                key={s.step}
                onClick={() => onSetStep(s.step)}
                style={{
                  padding: '0.45rem 0.2rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: isCurrent ? stepCol : isPast ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: isCurrent ? `${stepCol}22` : isPast ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 0, 0, 0.4)',
                  color: isCurrent ? stepCol : isPast ? '#38bdf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isCurrent ? 800 : 500,
                  boxShadow: isCurrent ? `0 0 14px ${stepCol}44` : 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}
              >
                0{s.step}
              </button>
            );
          })}
        </div>

        {/* Current Active Step Highlight Card */}
        <div
          style={{
            backgroundColor: 'rgba(5, 10, 22, 0.9)',
            border: `1px solid ${statusColor}66`,
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem 1.35rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                STEP {activeStepData.step} / 11
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeStepData.title}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.4 }}>
              {activeStepData.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.3rem 0.85rem',
                borderRadius: '6px',
                backgroundColor: `${statusColor}22`,
                color: statusColor,
                border: `1px solid ${statusColor}`,
              }}
            >
              SYSTEM: {activeStepData.system_status}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Granular Controls Grid */}
      <div className="grid-2">
        {/* Granular Trigger Buttons */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              Granular Event Trigger Station
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MANUAL OVERRIDE</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onSetStep(1)}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <CheckCircle2 size={13} color="#10b981" />
              <span>Normal Road (Green)</span>
            </button>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onFogChange(65)}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <CloudFog size={13} color="#f59e0b" />
              <span>Inject Dense Fog (65%)</span>
            </button>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onSetStep(3)}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <Car size={13} color="#38bdf8" />
              <span>Add Vehicle to Apex</span>
            </button>

            <button
              className="btn btn-sm btn-danger"
              onClick={() => onStopVehicle(20)}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <AlertTriangle size={13} />
              <span>Stop Vehicle (Timer Start)</span>
            </button>

            <button
              className="btn btn-sm btn-danger"
              onClick={onTriggerLoRa}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <Radio size={13} />
              <span>Propagate LoRa Warning</span>
            </button>

            <button
              className="btn btn-sm btn-primary"
              onClick={onResumeVehicle}
              style={{ fontSize: '0.74rem', padding: '0.5rem' }}
            >
              <CheckCircle2 size={13} />
              <span>Clear Hazard & Resume</span>
            </button>
          </div>
        </div>

        {/* Continuous Environment Sliders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              Corridor Environment Tuning
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LIVE REACTIVITY</span>
          </div>

          {/* Fog Slider */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Fog Density Multiplier:</span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {fog.density_percent}%
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fog.density_percent}
              onChange={(e) => onFogChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* Stalled Vehicle Threshold Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Stalled Vehicle Safety Threshold:</span>
              <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                {stalledVehicle.threshold_sec} Seconds
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[10, 20, 30, 60].map((t) => (
                <button
                  key={t}
                  className="btn btn-sm btn-secondary"
                  onClick={() => onStopVehicle(t)}
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    padding: '0.3rem',
                    backgroundColor: stalledVehicle.threshold_sec === t ? 'rgba(245, 158, 11, 0.25)' : undefined,
                    borderColor: stalledVehicle.threshold_sec === t ? '#f59e0b' : undefined,
                  }}
                >
                  {t} sec
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
