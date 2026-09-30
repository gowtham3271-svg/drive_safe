import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  HazardLevel,
  FogState,
  RoadsideUnit,
  SensorReadings,
  StalledVehicleState,
  AccidentRiskBreakdown,
  GhatEvent,
  LoRaPacket,
  RsuLedState,
} from '../types';
import {
  MOCK_FOG_STATE,
  MOCK_ROADSIDE_UNITS,
  MOCK_SENSORS,
  MOCK_STALLED_VEHICLE,
  MOCK_GHAT_EVENTS,
} from './mockData';
import { api } from './api';

export function useGhatGuard() {
  // 1. Fog & Visibility State
  const [fog, setFog] = useState<FogState>({ ...MOCK_FOG_STATE });

  // 2. Roadside Units State (RSU-01, RSU-02, RSU-03)
  const [rsus, setRsus] = useState<RoadsideUnit[]>([...MOCK_ROADSIDE_UNITS]);

  // 3. Stalled / Stationary Vehicle State
  const [stalledVehicle, setStalledVehicle] = useState<StalledVehicleState>({
    ...MOCK_STALLED_VEHICLE,
  });

  // 4. Sensors Telemetry (Ultrasonic Sonar, Radar, LiDAR, Camera)
  const [sensors, setSensors] = useState<SensorReadings>({ ...MOCK_SENSORS });

  // 5. Chronological Event Feed
  const [events, setEvents] = useState<GhatEvent[]>([...MOCK_GHAT_EVENTS]);

  // 6. Active LoRa Transmission Packet State
  const [activeLoRaPacket, setActiveLoRaPacket] = useState<LoRaPacket | null>(null);

  // 7. Guided 11-Step College Demo Step (1 to 11)
  const [demoStep, setDemoStep] = useState<number>(1);
  const [isAutoPlayingDemo, setIsAutoPlayingDemo] = useState<boolean>(false);

  // 8. Stalled Vehicle Ticking Timer Ref
  const stoppedTimerRef = useRef<number | null>(null);

  // Helper to add an event
  const addEvent = useCallback(
    (event_type: string, severity: HazardLevel, source: string, message: string) => {
      const newEvt: GhatEvent = {
        id: `EVT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type,
        severity,
        source,
        message,
      };
      setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);
    },
    []
  );

  // 9. Compute Overall System Status: SAFE | CAUTION | HAZARD
  const hasAlertRsu = rsus.some((r) => r.led_state === 'RED');
  const hasCautionRsu = rsus.some((r) => r.led_state === 'YELLOW');
  const isStalledHazard = stalledVehicle.hazard_triggered;
  const isFogHazard = fog.density_percent >= 75;
  const isFogCaution = fog.density_percent >= 40;

  const systemStatus: HazardLevel =
    hasAlertRsu || isStalledHazard || isFogHazard
      ? 'ALERT'
      : hasCautionRsu || isFogCaution || stalledVehicle.is_stationary
      ? 'CAUTION'
      : 'NORMAL';

  // 10. Compute Prototype Accident Risk Score (0 - 100)
  const riskScore: AccidentRiskBreakdown = (() => {
    const fog_factor = Math.round((fog.density_percent / 100) * 35);
    const stalled_vehicle_factor = stalledVehicle.hazard_triggered
      ? 40
      : stalledVehicle.is_stationary
      ? 20
      : 0;
    const blind_curve_factor = 15; // Permanent geometric risk for Hairpin #4
    const traffic_density_factor = 6;
    const approach_speed_factor = systemStatus === 'ALERT' ? 4 : 2;

    const total = Math.min(
      100,
      Math.max(5, fog_factor + stalled_vehicle_factor + blind_curve_factor + traffic_density_factor + approach_speed_factor)
    );

    return {
      overall_score: total,
      fog_factor,
      stalled_vehicle_factor,
      blind_curve_factor,
      traffic_density_factor,
      approach_speed_factor,
    };
  })();

  // 11. Fog Density Controller
  const setFogDensity = useCallback(
    (density: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(density)));
      const vis = Math.max(10, Math.min(100, Math.round(100 - clamped * 0.88)));

      let status: FogState['status'] = 'CLEAR';
      if (clamped >= 75) status = 'CRITICAL VISIBILITY';
      else if (clamped >= 50) status = 'DENSE FOG';
      else if (clamped >= 25) status = 'MODERATE FOG';

      setFog((prev) => ({
        ...prev,
        density_percent: clamped,
        visibility_score: vis,
        status,
        last_update: new Date().toISOString(),
      }));

      // Adjust roadside LEDs if dense fog
      if (clamped >= 60) {
        setRsus((prev) =>
          prev.map((r) => ({
            ...r,
            led_state: clamped >= 80 ? 'RED' : 'YELLOW',
            warning_active: true,
          }))
        );
      } else if (clamped < 35 && !stalledVehicle.hazard_triggered) {
        setRsus((prev) =>
          prev.map((r) => ({
            ...r,
            led_state: 'GREEN',
            warning_active: false,
          }))
        );
      }

      // Sync with backend API
      api.simulateFog(clamped).catch(() => {});
    },
    [stalledVehicle.hazard_triggered]
  );

  // 12. Roadside LED Controller
  const setRsuLedState = useCallback((rsuId: string | 'ALL', state: RsuLedState) => {
    setRsus((prev) =>
      prev.map((r) => {
        if (rsuId === 'ALL' || r.id === rsuId) {
          return {
            ...r,
            led_state: state,
            warning_active: state !== 'GREEN',
          };
        }
        return r;
      })
    );
  }, []);

  // 13. Trigger LoRa Packet Propagation Simulation (RSU-01 -> RSU-02 -> RSU-03)
  const triggerLoRaPropagation = useCallback(
    (packetType = 'HZD-001', customMessage?: string) => {
      const packet: LoRaPacket = {
        packet_id: packetType,
        source: 'RSU-01 (Apex)',
        destination: 'RSU-02 & RSU-03 (Approaches)',
        frequency_mhz: 433.0,
        rssi_dbm: -72,
        payload: customMessage || 'HAZARD_DETECTED: Stalled Vehicle at Blind Apex KM 42.5',
        latency_ms: 18,
        timestamp: new Date().toLocaleTimeString(),
        active: true,
      };

      setActiveLoRaPacket(packet);

      // Turn on Roadside LEDs in sequence
      setRsuLedState('RSU-01', 'RED');
      setTimeout(() => {
        setRsuLedState('RSU-02', 'RED');
      }, 350);
      setTimeout(() => {
        setRsuLedState('RSU-03', 'RED');
      }, 700);

      addEvent(
        'LORA_TRANSMIT',
        'ALERT',
        'LoRa Node RSU-01',
        `Packet ${packetType} transmitted at 433 MHz. Sequential warning activated on RSU-02 and RSU-03.`
      );

      // Packet animates and settles after 3 seconds
      setTimeout(() => {
        setActiveLoRaPacket((p) => (p ? { ...p, active: false } : null));
      }, 3000);
    },
    [addEvent, setRsuLedState]
  );

  // 14. Stop Vehicle Simulation (Starts stationary countdown timer)
  const startVehicleStopSimulation = useCallback(
    (thresholdSec = 20) => {
      setStalledVehicle((prev) => ({
        ...prev,
        is_stationary: true,
        speed_kmh: 0,
        stopped_duration_sec: 0,
        threshold_sec: thresholdSec,
        risk_level: 'LOW',
        hazard_triggered: false,
      }));

      // Update ultrasonic distance to show stopped vehicle at 12.4m
      setSensors((prev) => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          distance_m: 12.4,
          status: 'WARNING_CLOSE',
        },
      }));

      addEvent(
        'VEHICLE_STOPPED',
        'CAUTION',
        'YOLO11 + Ultrasonic Fusion',
        `Vehicle V-102 stopped at Hairpin Apex (KM 42.5). Ultrasonic distance: 12.4m. Timer initiated.`
      );
    },
    [addEvent]
  );

  // 15. Resume Vehicle Transit (Clears stopped state)
  const resumeVehicleTransit = useCallback(() => {
    setStalledVehicle((prev) => ({
      ...prev,
      is_stationary: false,
      speed_kmh: 38,
      stopped_duration_sec: 0,
      risk_level: 'LOW',
      hazard_triggered: false,
    }));

    // Reset ultrasonic distance
    setSensors((prev) => ({
      ...prev,
      ultrasonic: {
        ...prev.ultrasonic,
        distance_m: 24.8,
        status: 'ACTIVE',
      },
    }));

    if (fog.density_percent < 50) {
      setRsuLedState('ALL', 'GREEN');
    }

    addEvent(
      'VEHICLE_RESUMED',
      'NORMAL',
      'YOLO11 Edge AI',
      'Vehicle V-102 transit resumed. Apex obstruction cleared.'
    );
  }, [addEvent, fog.density_percent, setRsuLedState]);

  // 16. Clear All Hazards and Return to Normal Safe Road
  const clearHazardToSafe = useCallback(() => {
    setFogDensity(18);
    resumeVehicleTransit();
    setRsuLedState('ALL', 'GREEN');
    setActiveLoRaPacket(null);
    setDemoStep(1);

    addEvent(
      'HAZARD_CLEARED',
      'NORMAL',
      'Simulation Controller',
      'System cleared. Roadside units reset to GREEN. Corridor returned to SAFE status.'
    );

    api.simulateClear().catch(() => {});
  }, [addEvent, resumeVehicleTransit, setFogDensity, setRsuLedState]);

  // 17. Stalled Vehicle Timer Interval Loop
  useEffect(() => {
    if (stalledVehicle.is_stationary && !stalledVehicle.hazard_triggered) {
      stoppedTimerRef.current = window.setInterval(() => {
        setStalledVehicle((prev) => {
          const nextSec = prev.stopped_duration_sec + 1;
          const isOverThreshold = nextSec >= prev.threshold_sec;

          if (isOverThreshold && !prev.hazard_triggered) {
            // Trigger hazard and LoRa packet!
            triggerLoRaPropagation('HZD-STALLED-01', `Vehicle V-102 stationary for ${nextSec}s! Hazard flagged.`);
            return {
              ...prev,
              stopped_duration_sec: nextSec,
              risk_level: 'CRITICAL',
              hazard_triggered: true,
            };
          }

          const riskLevel = nextSec >= prev.threshold_sec / 2 ? 'MEDIUM' : 'LOW';
          return {
            ...prev,
            stopped_duration_sec: nextSec,
            risk_level: riskLevel,
          };
        });
      }, 1000);
    } else {
      if (stoppedTimerRef.current) {
        clearInterval(stoppedTimerRef.current);
        stoppedTimerRef.current = null;
      }
    }

    return () => {
      if (stoppedTimerRef.current) {
        clearInterval(stoppedTimerRef.current);
      }
    };
  }, [stalledVehicle.is_stationary, stalledVehicle.hazard_triggered, triggerLoRaPropagation]);

  // 18. College 11-Step Demo Executor
  const applyDemoStep = useCallback(
    (stepNum: number) => {
      setDemoStep(stepNum);
      switch (stepNum) {
        case 1: // Normal road condition (GREEN)
          setFogDensity(15);
          resumeVehicleTransit();
          setRsuLedState('ALL', 'GREEN');
          addEvent('DEMO_STEP_1', 'NORMAL', 'Demo Controller', 'Step 1: Normal road condition. System: SAFE (Green LEDs).');
          break;

        case 2: // Enable fog (YELLOW)
          setFogDensity(60);
          setRsuLedState('ALL', 'YELLOW');
          addEvent('DEMO_STEP_2', 'CAUTION', 'Demo Controller', 'Step 2: Mountain fog descends (60%). System: CAUTION (Yellow LEDs).');
          break;

        case 3: // Vehicle enters blind turn
          setSensors((prev) => ({
            ...prev,
            ultrasonic: { ...prev.ultrasonic, distance_m: 16.5, status: 'ACTIVE' },
          }));
          addEvent('DEMO_STEP_3', 'CAUTION', 'Demo Controller', 'Step 3: Vehicle V-102 enters sharp blind-turn apex section. AI tracking active.');
          break;

        case 4: // Vehicle becomes stationary (Timer begins)
          startVehicleStopSimulation(20);
          addEvent('DEMO_STEP_4', 'CAUTION', 'Demo Controller', 'Step 4: Vehicle stops on curve at 0 km/h. Stationary safety timer initiated.');
          break;

        case 5: // Stationary duration exceeds threshold
          setStalledVehicle((prev) => ({
            ...prev,
            is_stationary: true,
            stopped_duration_sec: prev.threshold_sec,
            risk_level: 'CRITICAL',
            hazard_triggered: true,
          }));
          addEvent('DEMO_STEP_5', 'ALERT', 'Demo Controller', 'Step 5: Stationary threshold exceeded! Potential stalled vehicle identified.');
          break;

        case 6: // Hazard engine generates warning (RED)
          setRsuLedState('RSU-01', 'RED');
          addEvent('DEMO_STEP_6', 'ALERT', 'Demo Controller', 'Step 6: Hazard engine generates alert. System status: HAZARD (RED).');
          break;

        case 7: // LoRa packet transmitted (RSU-01 -> RSU-02 -> RSU-03)
          triggerLoRaPropagation('HZD-DEMO-07', 'LoRa transmission: RSU-01 to RSU-02 and RSU-03');
          addEvent('DEMO_STEP_7', 'ALERT', 'Demo Controller', 'Step 7: LoRa packet HZD-001 transmitted across mesh nodes.');
          break;

        case 8: // Roadside LEDs become RED
          setRsuLedState('ALL', 'RED');
          addEvent('DEMO_STEP_8', 'ALERT', 'Demo Controller', 'Step 8: Roadside LEDs switch to RED strobe to warn oncoming drivers.');
          break;

        case 9: // Hazard appears on map
          addEvent('DEMO_STEP_9', 'ALERT', 'Demo Controller', 'Step 9: Hazard zone displayed in pulsing red on Google Map and 3D digital twin.');
          break;

        case 10: // Event timeline records complete chain
          addEvent('DEMO_STEP_10', 'ALERT', 'Demo Controller', 'Step 10: Complete incident chain logged in real-time event timeline.');
          break;

        case 11: // Clear hazard and return to normal
          clearHazardToSafe();
          addEvent('DEMO_STEP_11', 'NORMAL', 'Demo Controller', 'Step 11: Hazard cleared. Corridor returned to SAFE green state.');
          break;

        default:
          break;
      }
    },
    [addEvent, clearHazardToSafe, resumeVehicleTransit, setFogDensity, setRsuLedState, startVehicleStopSimulation, triggerLoRaPropagation]
  );

  const nextDemoStep = useCallback(() => {
    const next = demoStep >= 11 ? 1 : demoStep + 1;
    applyDemoStep(next);
  }, [applyDemoStep, demoStep]);

  const prevDemoStep = useCallback(() => {
    const prev = demoStep <= 1 ? 11 : demoStep - 1;
    applyDemoStep(prev);
  }, [applyDemoStep, demoStep]);

  // 19. Auto-play demo mode timer
  useEffect(() => {
    let interval: number;
    if (isAutoPlayingDemo) {
      interval = window.setInterval(() => {
        setDemoStep((curr) => {
          const next = curr >= 11 ? 1 : curr + 1;
          applyDemoStep(next);
          if (next === 11) {
            setIsAutoPlayingDemo(false);
          }
          return next;
        });
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [applyDemoStep, isAutoPlayingDemo]);

  return {
    systemStatus,
    riskScore,
    fog,
    setFogDensity,
    rsus,
    setRsuLedState,
    stalledVehicle,
    startVehicleStopSimulation,
    resumeVehicleTransit,
    sensors,
    events,
    addEvent,
    activeLoRaPacket,
    triggerLoRaPropagation,
    demoStep,
    setDemoStep: applyDemoStep,
    nextDemoStep,
    prevDemoStep,
    isAutoPlayingDemo,
    setIsAutoPlayingDemo,
    clearHazardToSafe,
  };
}
