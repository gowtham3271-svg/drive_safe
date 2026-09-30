import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudFog,
  Car,
  Zap,
  RotateCcw,
  Layers,
  Compass,
  Crosshair,
  Video,
} from 'lucide-react';
import type {
  Camera,
  FogState,
  RoadsideUnit,
  SensorReadings,
  StalledVehicleState,
  AccidentRiskBreakdown,
  GhatEvent,
  LoRaPacket,
  HazardLevel,
} from '../types';
import { BlindTurn3DView } from './BlindTurn3DView';
import { RoadsideWarningSystem } from './RoadsideWarningSystem';
import { LoRaCommunicationPanel } from './LoRaCommunicationPanel';
import { SensorTelemetries } from './SensorTelemetries';
import { EdgeAIMonitor } from './EdgeAIMonitor';
import { AccidentRiskAnalysis } from './AccidentRiskAnalysis';
import { EventTimelineView } from './EventTimelineView';
import { COLLEGE_DEMO_STEPS } from '../services/mockData';

interface Tripo3DStudioWorkspaceProps {
  camera: Camera | null;
  fogState: FogState;
  roadsideUnits: RoadsideUnit[];
  sensorReadings: SensorReadings;
  stalledVehicle: StalledVehicleState;
  accidentRisk: AccidentRiskBreakdown;
  ghatEvents: GhatEvent[];
  activeLoRaPacket: LoRaPacket | null;
  activeStep: number;
  systemStatus: HazardLevel;
  isDemoMode: boolean;

  // Actions
  onSetFogDensity: (density: number) => void;
  onSetThreshold: (threshold: number) => void;
  onToggleStopVehicle: () => void;
  onTriggerHazard: () => void;
  onPropagateLoRa: () => void;
  onClearHazard: () => void;
  onRunStep: (step: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onResetSimulation: () => void;
  onSelectCamera?: (camera: Camera) => void;
}

export const Tripo3DStudioWorkspace: React.FC<Tripo3DStudioWorkspaceProps> = ({
  camera,
  fogState,
  roadsideUnits,
  sensorReadings,
  stalledVehicle,
  accidentRisk,
  ghatEvents,
  activeLoRaPacket,
  activeStep,
  systemStatus,
  isDemoMode,
  onSetFogDensity,
  onSetThreshold,
  onToggleStopVehicle,
  onTriggerHazard,
  onPropagateLoRa,
  onClearHazard,
  onRunStep,
  onNextStep,
  onPrevStep,
  onResetSimulation,
}) => {
  const [leftTab, setLeftTab] = useState<'vision_fog' | 'stalled_risk'>('vision_fog');
  const [rightTab, setRightTab] = useState<'rsu_lora' | 'sensors_ai' | 'risk_events'>('rsu_lora');
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(true);
  const [cameraAngle, setCameraAngle] = useState<'orbit' | 'drone' | 'driver' | 'apex'>('orbit');

  const isAlert = systemStatus === 'ALERT';
  const isCaution = systemStatus === 'CAUTION';

  const statusColor = isAlert ? '#ef4444' : isCaution ? '#f59e0b' : '#10b981';
  const currentStepData = COLLEGE_DEMO_STEPS.find((s) => s.step === activeStep) || COLLEGE_DEMO_STEPS[0];

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        backgroundColor: '#0e0e11',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ============================================================== */}
      {/* 1. LEFT PARAMETER INSPECTOR CARD (Tripo3D Floating Studio Panel) */}
      {/* ============================================================== */}
      <aside
        style={{
          width: '360px',
          backgroundColor: '#16161b',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          overflowY: 'auto',
          userSelect: 'none',
        }}
      >
        {/* Panel Header */}
        <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '0.04em' }}>
              ROADSIDE NODE INSPECTOR
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              {camera?.camera_id || 'CAM001'} • NH-48
            </span>
          </div>

          {/* Tripo3D-style Toggle Pills */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#101014',
              padding: '0.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '0.5rem',
            }}
          >
            <button
              onClick={() => setLeftTab('vision_fog')}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.74rem',
                fontWeight: leftTab === 'vision_fog' ? 800 : 500,
                color: leftTab === 'vision_fog' ? '#ffffff' : '#71717a',
                backgroundColor: leftTab === 'vision_fog' ? '#24242e' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Vision & Fog
            </button>
            <button
              onClick={() => setLeftTab('stalled_risk')}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.74rem',
                fontWeight: leftTab === 'stalled_risk' ? 800 : 500,
                color: leftTab === 'stalled_risk' ? '#ffffff' : '#71717a',
                backgroundColor: leftTab === 'stalled_risk' ? '#24242e' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Obstacle & Risk
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {leftTab === 'vision_fog' ? (
            <>
              {/* Camera Preview Box with Checkerboard background (Tripo3D style) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 700 }}>LIVE CAMERA HUD</span>
                  <span style={{ fontSize: '0.66rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    FPS: 28.5 (Pi 4)
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: '160px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: '#0a0a0f',
                    backgroundImage: `
                      linear-gradient(45deg, #121218 25%, transparent 25%),
                      linear-gradient(-45deg, #121218 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #121218 75%),
                      linear-gradient(-45deg, transparent 75%, #121218 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#38bdf8',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {isDemoMode ? 'DEMO CAMERA' : 'LIVE PI 4'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        color: isAlert ? '#ef4444' : '#10b981',
                        fontWeight: 700,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      YOLO11 FP16
                    </span>
                  </div>

                  {/* Roadway perspective wireframe lines */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.35,
                    }}
                  >
                    <path d="M 0 160 L 130 50 L 170 50 L 300 160" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    <path d="M 150 50 L 150 160" fill="none" stroke="#ffd200" strokeWidth="1" strokeDasharray="4,4" />
                    {isAlert && (
                      <rect x="110" y="60" width="80" height="50" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1.5" />
                    )}
                  </svg>

                  {/* Bottom Bounding Box Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 5 }}>
                    <span style={{ fontSize: '0.68rem', color: '#ffffff', fontWeight: 700 }}>
                      Car: 0.94 • Truck: 0.88
                    </span>
                    {isAlert && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          fontWeight: 800,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '3px',
                        }}
                      >
                        STALLED VEHICLE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fog Density Slider & Controls (Tripo3D parameter style) */}
              <div
                style={{
                  backgroundColor: '#121216',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CloudFog size={15} color="#38bdf8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f4f4f5' }}>Atmospheric Fog</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffd200', fontFamily: 'var(--font-mono)' }}>
                    {fogState.density_percent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fogState.density_percent}
                  onChange={(e) => onSetFogDensity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#ffd200',
                    cursor: 'pointer',
                    marginBottom: '0.75rem',
                  }}
                />

                {/* Preset Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { label: 'Clear', val: 0 },
                    { label: 'Mild', val: 25 },
                    { label: 'Dense', val: 60 },
                    { label: 'Blind', val: 90 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onSetFogDensity(p.val)}
                      style={{
                        padding: '0.3rem 0.2rem',
                        fontSize: '0.68rem',
                        fontWeight: fogState.density_percent === p.val ? 800 : 500,
                        backgroundColor: fogState.density_percent === p.val ? '#2a2a35' : '#181820',
                        color: fogState.density_percent === p.val ? '#ffd200' : '#a1a1aa',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Sensor Fusion Snapshot */}
              <div
                style={{
                  backgroundColor: '#121216',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.75rem',
                  fontSize: '0.72rem',
                }}
              >
                <div style={{ color: '#71717a', fontWeight: 700, marginBottom: '0.4rem' }}>SENSOR FUSION MATRIX</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#a1a1aa' }}>Ultrasonic Apex Sonar:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {sensorReadings.ultrasonic.distance_m} m
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#a1a1aa' }}>24GHz Doppler Radar:</span>
                  <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {sensorReadings.radar.doppler_speed_kmh} km/h
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Optical Attenuation:</span>
                  <span style={{ color: '#ffd200', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {sensorReadings.fog_sensor.attenuation_coefficient} /m
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Stalled Vehicle Dwell Countdown Card */}
              <div
                style={{
                  backgroundColor: '#121216',
                  borderRadius: '10px',
                  border: stalledVehicle.hazard_triggered ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Car size={15} color={stalledVehicle.hazard_triggered ? '#ef4444' : '#38bdf8'} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f4f4f5' }}>Stationary Obstacle</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: stalledVehicle.hazard_triggered ? '#ef4444' : '#10b981',
                      backgroundColor: stalledVehicle.hazard_triggered ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                    }}
                  >
                    {stalledVehicle.hazard_triggered ? 'HAZARD ACTIVE' : 'CORRIDOR CLEAR'}
                  </span>
                </div>

                {/* Circular timer / Duration Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: `3px solid ${stalledVehicle.hazard_triggered ? '#ef4444' : '#ffd200'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#181820',
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {stalledVehicle.stopped_duration_sec}s
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#71717a' }}>STOP</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#f4f4f5', fontWeight: 700 }}>
                      Vehicle: {stalledVehicle.vehicle_id} ({stalledVehicle.speed_kmh} km/h)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>
                      Threshold limit: {stalledVehicle.threshold_sec} seconds
                    </div>
                  </div>
                </div>

                {/* Threshold selector pills */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {[10, 20, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => onSetThreshold(sec)}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0',
                        fontSize: '0.68rem',
                        fontWeight: stalledVehicle.threshold_sec === sec ? 800 : 500,
                        backgroundColor: stalledVehicle.threshold_sec === sec ? '#2a2a35' : '#181820',
                        color: stalledVehicle.threshold_sec === sec ? '#ffd200' : '#a1a1aa',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                {/* Trigger breakdown button */}
                <button
                  onClick={onToggleStopVehicle}
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    backgroundColor: stalledVehicle.is_stationary ? '#ef4444' : '#24242e',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {stalledVehicle.is_stationary ? 'Resume Transit (Vehicle Moving)' : 'Simulate Breakdown (0 km/h)'}
                </button>
              </div>

              {/* Accident Risk Score Bar */}
              <div
                style={{
                  backgroundColor: '#121216',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f4f4f5' }}>Prototype Risk Score</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: statusColor, fontFamily: 'var(--font-mono)' }}>
                    {accidentRisk.overall_score} / 100
                  </span>
                </div>

                <div style={{ height: '6px', backgroundColor: '#24242e', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${accidentRisk.overall_score}%`,
                      backgroundColor: statusColor,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Tripo3D-style Big Glowing Action Button (Bottom of Inspector) */}
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (isAlert) {
                  onClearHazard();
                } else {
                  onTriggerHazard();
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                backgroundColor: isAlert ? '#ef4444' : '#ffd200',
                color: isAlert ? '#ffffff' : '#000000',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: isAlert ? '0 0 25px rgba(239, 68, 68, 0.4)' : '0 0 25px rgba(255, 210, 0, 0.35)',
                letterSpacing: '0.03em',
              }}
            >
              <Zap size={16} fill={isAlert ? '#ffffff' : '#000000'} />
              <span>{isAlert ? 'CLEAR EMERGENCY HAZARD' : 'TRIGGER EMERGENCY WARNING'}</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. CENTER STAGE / 3D VIEWPORT (Tripo3D Digital Twin Centerpiece) */}
      {/* ============================================================== */}
      <main
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          backgroundColor: '#0a0a0d',
          overflow: 'hidden',
        }}
      >
        {/* Three.js 3D Road Scene */}
        <BlindTurn3DView
          hazardLevel={systemStatus}
          roadName="NH-48 Khandala Ghat Hairpin #4"
          cameraId={camera?.camera_id || 'CAM001'}
          fogDensity={fogState.density_percent}
          rsus={roadsideUnits}
          stalledVehicle={stalledVehicle}
          hideOverlays={true}
          activeCameraPreset={cameraAngle}
          onFogChange={onSetFogDensity}
        />

        {/* Floating Top Status HUD Pill (Tripo3D Style) */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(18, 18, 22, 0.85)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${statusColor}`,
            padding: '0.45rem 1.25rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: `0 0 20px ${statusColor}40`,
            zIndex: 15,
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: statusColor }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
            <span>SYSTEM: {systemStatus === 'ALERT' ? 'HAZARD' : systemStatus === 'CAUTION' ? 'CAUTION' : 'SAFE'}</span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <span style={{ color: '#d4d4d8' }}>Visibility: {fogState.visibility_score}%</span>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <span style={{ color: '#38bdf8' }}>LoRa: 433MHz • 3 RSUs</span>
        </div>

        {/* Tripo3D-style 3D Axis Orientation Gizmo (Top Right) */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.25rem',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(24, 24, 30, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            userSelect: 'none',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          }}
          title="3D Coordinate Orientation Axis (X, Y, Z)"
        >
          <svg width="30" height="30" viewBox="0 0 32 32">
            <line x1="16" y1="16" x2="26" y2="16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <text x="26" y="14" fill="#ef4444" fontSize="8" fontWeight="bold">X</text>
            <line x1="16" y1="16" x2="16" y2="6" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <text x="17" y="7" fill="#10b981" fontSize="8" fontWeight="bold">Y</text>
            <line x1="16" y1="16" x2="8" y2="24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <text x="5" y="27" fill="#38bdf8" fontSize="8" fontWeight="bold">Z</text>
          </svg>
        </div>

        {/* Tripo3D-style Floating Vertical Viewport Tooldock (Right Edge of Viewport) */}
        <div
          style={{
            position: 'absolute',
            top: '4.6rem',
            right: '1.25rem',
            backgroundColor: 'rgba(24, 24, 30, 0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            zIndex: 15,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Orbit View */}
          <button
            onClick={() => setCameraAngle('orbit')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: cameraAngle === 'orbit' ? '1px solid #ffd200' : 'none',
              backgroundColor: cameraAngle === 'orbit' ? '#2e2e38' : 'transparent',
              color: cameraAngle === 'orbit' ? '#ffd200' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Orbit View (Free 3D Camera)"
          >
            <Compass size={16} />
          </button>

          {/* Drone Overhead View */}
          <button
            onClick={() => setCameraAngle('drone')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: cameraAngle === 'drone' ? '1px solid #ffd200' : 'none',
              backgroundColor: cameraAngle === 'drone' ? '#2e2e38' : 'transparent',
              color: cameraAngle === 'drone' ? '#ffd200' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Drone Overhead Camera"
          >
            <Video size={16} />
          </button>

          {/* Driver POV View */}
          <button
            onClick={() => setCameraAngle('driver')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: cameraAngle === 'driver' ? '1px solid #ffd200' : 'none',
              backgroundColor: cameraAngle === 'driver' ? '#2e2e38' : 'transparent',
              color: cameraAngle === 'driver' ? '#ffd200' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Driver POV Camera"
          >
            <Car size={16} />
          </button>

          {/* Apex Camera View */}
          <button
            onClick={() => setCameraAngle('apex')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: cameraAngle === 'apex' ? '1px solid #ffd200' : 'none',
              backgroundColor: cameraAngle === 'apex' ? '#2e2e38' : 'transparent',
              color: cameraAngle === 'apex' ? '#ffd200' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Apex Hairpin Camera"
          >
            <Crosshair size={16} />
          </button>

          <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 auto' }} />

          {/* Fog Toggle */}
          <button
            onClick={() => onSetFogDensity(fogState.density_percent > 30 ? 0 : 70)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: fogState.density_percent > 30 ? '#2e2e38' : 'transparent',
              color: fogState.density_percent > 30 ? '#38bdf8' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle Fog On/Off"
          >
            <CloudFog size={16} />
          </button>

          {/* Drawer Toggle */}
          <button
            onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isRightDrawerOpen ? '#2e2e38' : 'transparent',
              color: isRightDrawerOpen ? '#ffd200' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle Right Telemetry Drawer"
          >
            <Layers size={16} />
          </button>
        </div>

        {/* Floating Bottom Timeline / 11-Step Viva Scenario Player Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(18, 18, 24, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            zIndex: 15,
            maxWidth: '90%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={onPrevStep}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#24242e',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Previous Step"
            >
              ◀
            </button>

            {/* Step Pills 1 to 11 */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 6, 7, 11].map((st) => (
                <button
                  key={st}
                  onClick={() => onRunStep(st)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: activeStep === st ? 800 : 500,
                    backgroundColor: activeStep === st ? '#ffd200' : '#1e1e24',
                    color: activeStep === st ? '#000000' : '#a1a1aa',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                  title={`Step ${st}`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={onNextStep}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#24242e',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Next Step"
            >
              ▶
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

          {/* Current Step Description Banner */}
          <div style={{ maxWidth: '380px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f4f4f5' }}>
              Step {currentStepData.step}: {currentStepData.title}
            </div>
            <div style={{ fontSize: '0.64rem', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStepData.description}
            </div>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

          {/* Reset button */}
          <button
            onClick={onResetSimulation}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: '#24242e',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#d4d4d8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </main>

      {/* ============================================================== */}
      {/* 3. RIGHT COLLAPSIBLE INSPECTOR DRAWER (Tripo3D Telemetry Studio) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isRightDrawerOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              height: '100%',
              backgroundColor: '#16161b',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
              overflowY: 'auto',
              userSelect: 'none',
            }}
          >
            {/* Drawer Tabs Header */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#101014',
                  padding: '0.2rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  onClick={() => setRightTab('rsu_lora')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.68rem',
                    fontWeight: rightTab === 'rsu_lora' ? 800 : 500,
                    color: rightTab === 'rsu_lora' ? '#ffd200' : '#71717a',
                    backgroundColor: rightTab === 'rsu_lora' ? '#24242e' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  LEDs & LoRa
                </button>
                <button
                  onClick={() => setRightTab('sensors_ai')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.68rem',
                    fontWeight: rightTab === 'sensors_ai' ? 800 : 500,
                    color: rightTab === 'sensors_ai' ? '#ffd200' : '#71717a',
                    backgroundColor: rightTab === 'sensors_ai' ? '#24242e' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sensors & AI
                </button>
                <button
                  onClick={() => setRightTab('risk_events')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.68rem',
                    fontWeight: rightTab === 'risk_events' ? 800 : 500,
                    color: rightTab === 'risk_events' ? '#ffd200' : '#71717a',
                    backgroundColor: rightTab === 'risk_events' ? '#24242e' : 'transparent',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Audit Log
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto' }}>
              {rightTab === 'rsu_lora' && (
                <>
                  <RoadsideWarningSystem rsus={roadsideUnits} />
                  <LoRaCommunicationPanel
                    activePacket={activeLoRaPacket}
                    rsus={roadsideUnits}
                    onBroadcastTestPacket={onPropagateLoRa}
                  />
                </>
              )}

              {rightTab === 'sensors_ai' && (
                <>
                  <SensorTelemetries sensors={sensorReadings} />
                  <EdgeAIMonitor isPiConnected={true} />
                </>
              )}

              {rightTab === 'risk_events' && (
                <>
                  <AccidentRiskAnalysis risk={accidentRisk} />
                  <div className="card" style={{ padding: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem' }}>
                      RECENT INCIDENT EVENTS
                    </div>
                    <EventTimelineView events={ghatEvents} />
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
