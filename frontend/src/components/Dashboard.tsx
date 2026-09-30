import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type {
  Camera,
  Alert,
  SystemHealth,
  BoundingBox,
  FogState,
  RoadsideUnit,
  SensorReadings,
  StalledVehicleState,
  AccidentRiskBreakdown,
  GhatEvent,
  LoRaPacket,
  HazardLevel,
} from '../types';
import { HeroStatusArea } from './HeroStatusArea';
import { FogVisibilityPanel } from './FogVisibilityPanel';
import { StalledVehicleMonitor } from './StalledVehicleMonitor';
import { HazardPipelineView } from './HazardPipelineView';
import { RoadsideWarningSystem } from './RoadsideWarningSystem';
import { LoRaCommunicationPanel } from './LoRaCommunicationPanel';
import { AccidentRiskAnalysis } from './AccidentRiskAnalysis';
import { SensorTelemetries } from './SensorTelemetries';
import { EdgeAIMonitor } from './EdgeAIMonitor';
import { EventTimelineView } from './EventTimelineView';
import { BlindTurn3DView } from './BlindTurn3DView';
import { GoogleMapView } from './GoogleMapView';
import { CameraCard } from './CameraCard';
import {
  Radio,
  Box,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Variants } from 'framer-motion';

interface DashboardProps {
  cameras: Camera[];
  alerts: Alert[];
  systemHealth: SystemHealth;
  selectedCamera: Camera | null;
  boundingBoxes: BoundingBox[];
  onSelectCamera: (camera: Camera) => void;
  onSimulateScenario: (scenario: 'normal' | 'caution' | 'alert') => void;
  isDemoMode: boolean;

  // Rich GhatGuard state
  fogState: FogState;
  roadsideUnits: RoadsideUnit[];
  sensorReadings: SensorReadings;
  stalledVehicle: StalledVehicleState;
  accidentRisk: AccidentRiskBreakdown;
  ghatEvents: GhatEvent[];
  activeLoRaPacket: LoRaPacket | null;
  activeStep: number;
  systemStatus: HazardLevel;

  // Actions
  onSetFogDensity: (density: number) => void;
  onSetThreshold: (threshold: number) => void;
  onToggleStopVehicle: () => void;
  onTriggerHazard: () => void;
  onPropagateLoRa: () => void;
  onClearHazard: () => void;
  onRunStep: (step: number) => void;
  onNextStep: () => void;
  onResetSimulation: () => void;
  onNavigateToSimulation?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const Dashboard: React.FC<DashboardProps> = ({
  cameras,
  alerts: _alerts,
  systemHealth,
  selectedCamera,
  boundingBoxes,
  onSelectCamera,
  onSimulateScenario,
  isDemoMode,
  fogState,
  roadsideUnits,
  sensorReadings,
  stalledVehicle,
  accidentRisk,
  ghatEvents,
  activeLoRaPacket,
  activeStep,
  systemStatus,
  onSetFogDensity,
  onSetThreshold,
  onToggleStopVehicle,
  onTriggerHazard: _onTriggerHazard,
  onPropagateLoRa,
  onClearHazard: _onClearHazard,
  onRunStep,
  onNextStep,
  onResetSimulation: _onResetSimulation,
  onNavigateToSimulation,
}) => {
  const [visualMode, setVisualMode] = useState<'3d' | 'google_map'>('3d');

  const activeHazardsCount =
    systemStatus === 'ALERT' ? 1 : cameras.filter((c) => c.hazard_status === 'ALERT').length;
  const connectedUnitsCount = roadsideUnits.filter((u) => u.status === 'ONLINE').length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* 1. HERO STATUS COMMAND BANNER */}
      <motion.div variants={itemVariants}>
        <HeroStatusArea
          systemStatus={systemStatus}
          fog={fogState}
          activeHazardsCount={activeHazardsCount}
          connectedUnitsCount={connectedUnitsCount}
          isDemoMode={isDemoMode}
        />
      </motion.div>

      {/* 2. QUICK DEMO SCENARIO STRIP FOR PRESENTATION */}
      <motion.div
        variants={itemVariants}
        className="card"
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: 'rgba(11, 21, 40, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
              VIVA PRESENTATION DEMO SEQUENCE
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Step {activeStep} of 11 • Jump to any stage or advance sequentially for the jury
            </div>
          </div>
        </div>

        {/* Quick Scenario Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeStep === 1 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(1)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            1. Normal
          </button>
          <button
            className={`btn btn-sm ${activeStep === 2 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(2)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            2. Enable Fog
          </button>
          <button
            className={`btn btn-sm ${activeStep === 3 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(3)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            3. Vehicle In
          </button>
          <button
            className={`btn btn-sm ${activeStep === 4 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(4)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            4. Stopped
          </button>
          <button
            className={`btn btn-sm ${activeStep === 6 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(6)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            6. Hazard!
          </button>
          <button
            className={`btn btn-sm ${activeStep === 7 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(7)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            7. LoRa Mesh
          </button>
          <button
            className={`btn btn-sm ${activeStep === 11 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onRunStep(11)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            11. Clear
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={onNextStep}
            style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem', gap: '0.3rem' }}
            title="Advance to next presentation step"
          >
            <span>Next</span>
            <ArrowRight size={13} />
          </button>

          {onNavigateToSimulation && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToSimulation}
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
              title="Open full simulation workspace"
            >
              Full Center
            </button>
          )}
        </div>
      </motion.div>

      {/* 3. CORE VISUAL ROW: LIVE ROAD CAMERA + 3D DIGITAL TWIN */}
      <motion.div variants={itemVariants} className="grid-2">
        {/* Left: Live Road Camera Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Radio size={14} color="#38bdf8" className="pulse" />
              LIVE ROAD CAMERA ({selectedCamera?.camera_id || 'CAM001'})
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: isDemoMode ? '#f59e0b' : '#10b981',
                fontFamily: 'var(--font-mono)',
                backgroundColor: isDemoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                border: isDemoMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {isDemoMode ? 'DEMO CAMERA FEED' : 'LIVE PI 4 STREAM'}
            </span>
          </div>

          {selectedCamera ? (
            <CameraCard
              camera={selectedCamera}
              isSelected={true}
              onSelect={onSelectCamera}
              isDemoMode={isDemoMode}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No camera selected
            </div>
          )}
        </div>

        {/* Right: 3D Digital Twin Viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Box size={14} color="#38bdf8" />
              3D DIGITAL TWIN • NH-48 KHANDALA GHAT
            </span>

            {/* Viewport Mode Switcher */}
            <div
              style={{
                display: 'flex',
                gap: '0.3rem',
                backgroundColor: 'rgba(5, 10, 22, 0.8)',
                padding: '0.2rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                className={`btn btn-sm ${visualMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setVisualMode('3d')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                3D Twin
              </button>
              <button
                className={`btn btn-sm ${visualMode === 'google_map' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setVisualMode('google_map')}
                style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
              >
                Google Map HUD
              </button>
            </div>
          </div>

          {visualMode === '3d' ? (
            <BlindTurn3DView
              hazardLevel={systemStatus}
              roadName={selectedCamera?.name || 'NH-48 Khandala Ghat Hairpin #4'}
              cameraId={selectedCamera?.camera_id || 'CAM001'}
              fogDensity={fogState.density_percent}
              rsus={roadsideUnits}
              stalledVehicle={stalledVehicle}
              onHazardTrigger={onSimulateScenario}
              onFogChange={onSetFogDensity}
            />
          ) : (
            <div style={{ height: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <GoogleMapView
                cameras={cameras}
                selectedCamera={selectedCamera}
                boundingBoxes={boundingBoxes}
                onSelectCamera={onSelectCamera}
                onSimulateScenario={onSimulateScenario}
                isDemoMode={isDemoMode}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. INTELLIGENCE ROW: FOG/VISIBILITY PANEL + STALLED VEHICLE MONITOR */}
      <motion.div variants={itemVariants} className="grid-2">
        <FogVisibilityPanel fog={fogState} onFogChange={onSetFogDensity} />
        <StalledVehicleMonitor
          stalledVehicle={stalledVehicle}
          onStopVehicle={onToggleStopVehicle}
          onResumeTransit={onToggleStopVehicle}
          onThresholdChange={onSetThreshold}
        />
      </motion.div>

      {/* 5. HAZARD DECISION PIPELINE (FULL WIDTH) */}
      <motion.div variants={itemVariants}>
        <HazardPipelineView
          systemStatus={systemStatus}
        />
      </motion.div>

      {/* 6. WARNING LIGHTS & LORA COMMUNICATION */}
      <motion.div variants={itemVariants} className="grid-2">
        <RoadsideWarningSystem rsus={roadsideUnits} />
        <LoRaCommunicationPanel
          activePacket={activeLoRaPacket}
          rsus={roadsideUnits}
          onBroadcastTestPacket={onPropagateLoRa}
        />
      </motion.div>

      {/* 7. ACCIDENT RISK ANALYSIS & SENSOR TELEMETRIES */}
      <motion.div variants={itemVariants} className="grid-2">
        <AccidentRiskAnalysis risk={accidentRisk} />
        <SensorTelemetries sensors={sensorReadings} />
      </motion.div>

      {/* 8. EDGE AI MONITOR & LIVE EVENT LOG */}
      <motion.div variants={itemVariants} className="grid-2">
        <EdgeAIMonitor isPiConnected={systemHealth.raspberry_pi === 'ONLINE'} />
        <div className="card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              REAL-TIME EVENT STREAM
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              LATEST {ghatEvents.length} INCIDENTS
            </span>
          </div>
          <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
            <EventTimelineView events={ghatEvents} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
