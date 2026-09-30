import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Camera, SystemHealth, BoundingBox, DashboardView } from './types';
import { api, getDemoModeState, setDemoModeState } from './services/api';
import { useGhatGuard } from './services/useGhatGuard';
import { TripoTopNav } from './components/TripoTopNav';
import { TripoSidebarDock } from './components/TripoSidebarDock';
import { MapView } from './components/MapView';
import { GoogleMapView } from './components/GoogleMapView';
import { CameraCard } from './components/CameraCard';
import { DetectionPanel } from './components/DetectionPanel';
import { BlindTurn3DView } from './components/BlindTurn3DView';
import { SystemStatus } from './components/SystemStatus';
import { CameraDetails } from './components/CameraDetails';
import { HardwareGuideModal } from './components/HardwareGuideModal';
import { SimulationControlCenter } from './components/SimulationControlCenter';
import { EventTimelineView } from './components/EventTimelineView';
import { StalledVehicleMonitor } from './components/StalledVehicleMonitor';
import { SensorTelemetries } from './components/SensorTelemetries';
import { EdgeAIMonitor } from './components/EdgeAIMonitor';
import { ScrollWorldFlythrough } from './components/ScrollWorldFlythrough';
import { GhatGuardCoreDashboard } from './components/GhatGuardCoreDashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    raspberry_pi: 'ONLINE',
    yolo11: 'CONNECTED',
    camera: 'ONLINE',
    backend: 'ONLINE',
    database: 'CONNECTED',
    last_update: new Date().toISOString(),
    mode: 'DEMO',
  });
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(getDemoModeState());
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState<boolean>(false);
  const [isCameraDetailsOpen, setIsCameraDetailsOpen] = useState<boolean>(false);
  const [mapSubMode, setMapSubMode] = useState<'google_map' | 'regional'>('google_map');
  const [loading, setLoading] = useState<boolean>(true);

  // GhatGuard Central Simulation & Hardware Telemetry Engine Hook
  const ghatGuard = useGhatGuard();

  // Fetch telemetry and camera data
  const fetchData = useCallback(async () => {
    try {
      const [fetchedCameras, , fetchedHealth] = await Promise.all([
        api.getCameras(),
        api.getAlerts(),
        api.getSystemHealth(),
      ]);

      setCameras(fetchedCameras);
      setSystemHealth(fetchedHealth);

      // Default select first camera if none selected
      if (!selectedCamera && fetchedCameras.length > 0) {
        setSelectedCamera(fetchedCameras[0]);
        const boxes = await api.getCameraDetections(fetchedCameras[0].camera_id);
        setBoundingBoxes(boxes);
      } else if (selectedCamera) {
        const updated = fetchedCameras.find((c) => c.camera_id === selectedCamera.camera_id);
        if (updated) setSelectedCamera(updated);
        const boxes = await api.getCameraDetections(selectedCamera.camera_id);
        setBoundingBoxes(boxes);
      }
    } catch (err) {
      console.error('Error polling road safety telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCamera]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle camera selection
  const handleSelectCamera = async (cam: Camera) => {
    setSelectedCamera(cam);
    const boxes = await api.getCameraDetections(cam.camera_id);
    setBoundingBoxes(boxes);
    setIsCameraDetailsOpen(true);
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    setDemoModeState(next);
    fetchData();
  };

  // Scenario Simulator for Demo Testing
  const handleSimulateScenario = async (scenario: 'normal' | 'caution' | 'alert') => {
    const camId = selectedCamera?.camera_id || 'CAM001';

    let testBoxes: BoundingBox[] = [];
    if (scenario === 'caution') {
      testBoxes = [
        { class: 'car', confidence: 0.93, x1: 120, y1: 160, x2: 280, y2: 290 },
        { class: 'motorcycle', confidence: 0.88, x1: 420, y1: 210, x2: 480, y2: 300 },
      ];
    } else if (scenario === 'alert') {
      testBoxes = [
        { class: 'truck', confidence: 0.96, x1: 100, y1: 110, x2: 380, y2: 360 },
        { class: 'car', confidence: 0.89, x1: 410, y1: 190, x2: 580, y2: 320 },
        { class: 'person', confidence: 0.85, x1: 60, y1: 230, x2: 110, y2: 340 },
      ];
    }

    await api.ingestDetections(camId, testBoxes);
    setBoundingBoxes(testBoxes);
    fetchData();
  };

  const activeHazardsCount =
    ghatGuard.systemStatus === 'ALERT'
      ? 1
      : cameras.filter((c) => c.hazard_status === 'ALERT' || c.hazard_status === 'CAUTION').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#0e0e11' }}>
      {/* Tripo3D-Style Top Navbar */}
      <TripoTopNav
        currentView={currentView}
        onSelectView={setCurrentView}
        systemHealth={systemHealth}
        systemStatus={ghatGuard.systemStatus}
        activeHazardsCount={activeHazardsCount}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onRefresh={fetchData}
        onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
        onQuickRunDemo={() => setCurrentView('simulation')}
      />

      {/* Main Studio Body: Slim Left Dock + Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Tripo3D-Style Slim Left Vertical Icon Dock */}
        <TripoSidebarDock
          currentView={currentView}
          onSelectView={setCurrentView}
          activeHazardsCount={activeHazardsCount}
          systemStatus={ghatGuard.systemStatus}
        />

        {/* Central Workspace Area */}
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa' }}>
              Initializing GHATGUARD 3D Studio & Vision Pipeline...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%' }}
              >
                {/* 0. 3D SCROLL WORLD DRONE FLY-THROUGH LANDING EXPERIENCE */}
                {currentView === 'flythrough' && (
                  <ScrollWorldFlythrough
                    onEnterStudio={() => setCurrentView('dashboard')}
                    onEnterLiveMonitor={() => setCurrentView('live_monitor')}
                    onEnterSimulation={() => setCurrentView('simulation')}
                  />
                )}

                {/* 1. PRIMARY LIGHTWEIGHT SENIOR OPERATIONS DASHBOARD */}
                {currentView === 'dashboard' && (
                  <GhatGuardCoreDashboard
                    camera={selectedCamera}
                    cameras={cameras}
                    onSelectCamera={handleSelectCamera}
                    isDemoMode={isDemoMode}
                    onToggleDemoMode={handleToggleDemoMode}
                    onOpenFlythrough={() => setCurrentView('flythrough')}
                  />
                )}

                {/* 2. LIVE VISION MONITORING */}
                {currentView === 'live_monitor' && (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f4f4f5' }}>Live Roadside Camera Array & Vision Telemetry</h2>
                        <p style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>
                          Target Stream: {selectedCamera?.stream_url || 'http://raspberry.local:8080/stream.mjpg'} • YOLO11-Nano Edge Inference
                        </p>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#ffd200', fontFamily: 'var(--font-mono)' }}>
                        TOTAL: {cameras.length} CURVE NODES
                      </span>
                    </div>

                    <div className="grid-2">
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#a1a1aa' }}>
                          ACTIVE CAMERA HUD
                        </div>
                        {selectedCamera && (
                          <CameraCard
                            camera={selectedCamera}
                            isSelected={true}
                            onSelect={handleSelectCamera}
                            isDemoMode={isDemoMode}
                          />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#a1a1aa' }}>
                          YOLO11 EDGE AI BOUNDING BOXES
                        </div>
                        <DetectionPanel
                          camera={selectedCamera}
                          boundingBoxes={boundingBoxes}
                          onSimulateScenario={handleSimulateScenario}
                          isDemoMode={isDemoMode}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: '#a1a1aa' }}>
                        ALL MONITORED CORRIDOR CAMERAS
                      </div>
                      <div className="grid-3">
                        {cameras.map((cam) => (
                          <CameraCard
                            key={cam.camera_id}
                            camera={cam}
                            isSelected={selectedCamera?.camera_id === cam.camera_id}
                            onSelect={handleSelectCamera}
                            isDemoMode={isDemoMode}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HAZARD GIS MAP */}
                {currentView === 'map' && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          className={`btn btn-sm ${mapSubMode === 'google_map' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setMapSubMode('google_map')}
                        >
                          Google Map Live Traffic & Blind-Turn HUD
                        </button>
                        <button
                          className={`btn btn-sm ${mapSubMode === 'regional' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setMapSubMode('regional')}
                        >
                          Regional GIS Network Overview
                        </button>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#ffd200', fontFamily: 'var(--font-mono)' }}>
                        CORRIDOR: NH-48 KHANDALA GHAT (KM 72 - KM 78)
                      </span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {mapSubMode === 'google_map' ? (
                        <GoogleMapView
                          cameras={cameras}
                          selectedCamera={selectedCamera}
                          boundingBoxes={boundingBoxes}
                          onSelectCamera={handleSelectCamera}
                          onSimulateScenario={handleSimulateScenario}
                          isDemoMode={isDemoMode}
                        />
                      ) : (
                        <MapView
                          cameras={cameras}
                          selectedCameraId={selectedCamera?.camera_id || null}
                          onSelectCamera={handleSelectCamera}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 4. DIGITAL TWIN */}
                {currentView === 'twin' && (
                  <div style={{ height: '100%', position: 'relative' }}>
                    <BlindTurn3DView
                      hazardLevel={ghatGuard.systemStatus}
                      roadName={selectedCamera?.name || 'NH-48 Khandala Ghat Hairpin #4'}
                      cameraId={selectedCamera?.camera_id || 'CAM001'}
                      fogDensity={ghatGuard.fog.density_percent}
                      rsus={ghatGuard.rsus}
                      stalledVehicle={ghatGuard.stalledVehicle}
                      onHazardTrigger={handleSimulateScenario}
                      onFogChange={ghatGuard.setFogDensity}
                    />
                  </div>
                )}

                {/* 5. DETECTION & STALLED */}
                {currentView === 'detections' && (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f4f4f5' }}>YOLO11 Detection & Stationary Obstacle Analysis</h2>
                        <p style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>
                          Continuous tracking of vehicle velocity and stationary dwell timer to detect breakdown hazards before drivers round the curve
                        </p>
                      </div>
                    </div>

                    <div className="grid-2">
                      <DetectionPanel
                        camera={selectedCamera}
                        boundingBoxes={boundingBoxes}
                        onSimulateScenario={handleSimulateScenario}
                        isDemoMode={isDemoMode}
                      />
                      <StalledVehicleMonitor
                        stalledVehicle={ghatGuard.stalledVehicle}
                        onStopVehicle={() => {
                          if (ghatGuard.stalledVehicle.is_stationary) {
                            ghatGuard.resumeVehicleTransit();
                          } else {
                            ghatGuard.startVehicleStopSimulation();
                          }
                        }}
                        onResumeTransit={ghatGuard.resumeVehicleTransit}
                        onThresholdChange={(threshold) =>
                          ghatGuard.startVehicleStopSimulation(threshold)
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 6. EVENT TIMELINE */}
                {currentView === 'events' && (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f4f4f5' }}>Complete System Event Timeline & Audit Log</h2>
                        <p style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>
                          Time-stamped audit records for vehicle entries, fog transitions, stationary triggers, LoRa broadcasts, and LED warning activations
                        </p>
                      </div>
                    </div>
                    <EventTimelineView events={ghatGuard.events} />
                  </div>
                )}

                {/* 7. SYSTEM HEALTH */}
                {currentView === 'system_health' && (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <SystemStatus
                      systemHealth={systemHealth}
                      onRefresh={fetchData}
                      isDemoMode={isDemoMode}
                    />
                    <div className="grid-2">
                      <EdgeAIMonitor isPiConnected={systemHealth.raspberry_pi === 'ONLINE'} />
                      <SensorTelemetries sensors={ghatGuard.sensors} />
                    </div>
                  </div>
                )}

                {/* 8. SIMULATION CONTROL CENTER */}
                {currentView === 'simulation' && (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <SimulationControlCenter
                      currentStep={ghatGuard.demoStep}
                      onSetStep={ghatGuard.setDemoStep}
                      onNextStep={ghatGuard.nextDemoStep}
                      onPrevStep={ghatGuard.prevDemoStep}
                      isAutoPlaying={ghatGuard.isAutoPlayingDemo}
                      onToggleAutoPlay={() =>
                        ghatGuard.setIsAutoPlayingDemo(!ghatGuard.isAutoPlayingDemo)
                      }
                      onReset={ghatGuard.clearHazardToSafe}
                      fog={ghatGuard.fog}
                      onFogChange={ghatGuard.setFogDensity}
                      stalledVehicle={ghatGuard.stalledVehicle}
                      onStopVehicle={ghatGuard.startVehicleStopSimulation}
                      onResumeVehicle={ghatGuard.resumeVehicleTransit}
                      onTriggerLoRa={ghatGuard.triggerLoRaPropagation}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Camera Inspection Modal */}
      {isCameraDetailsOpen && selectedCamera && (
        <CameraDetails
          camera={selectedCamera}
          boundingBoxes={boundingBoxes}
          onClose={() => setIsCameraDetailsOpen(false)}
          isDemoMode={isDemoMode}
        />
      )}

      {/* Hardware Setup Guide Modal */}
      {isHardwareGuideOpen && (
        <HardwareGuideModal onClose={() => setIsHardwareGuideOpen(false)} />
      )}
    </div>
  );
};

export default App;
