import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CloudFog } from 'lucide-react';
import type { HazardLevel, RoadsideUnit, StalledVehicleState } from '../types';

interface BlindTurn3DViewProps {
  hazardLevel?: HazardLevel;
  roadName?: string;
  cameraId?: string;
  fogDensity?: number;
  rsus?: RoadsideUnit[];
  stalledVehicle?: StalledVehicleState;
  hideOverlays?: boolean;
  activeCameraPreset?: 'orbit' | 'drone' | 'driver' | 'apex';
  onHazardTrigger?: (level: 'normal' | 'caution' | 'alert') => void;
  onFogChange?: (density: number) => void;
}

export const BlindTurn3DView: React.FC<BlindTurn3DViewProps> = ({
  hazardLevel = 'CAUTION',
  roadName = 'NH-48 Khandala Ghat Hairpin #4',
  cameraId: _cameraId = 'CAM001',
  fogDensity = 30,
  rsus,
  stalledVehicle,
  hideOverlays = false,
  activeCameraPreset,
  onHazardTrigger: _onHazardTrigger,
  onFogChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewAngle, setViewAngle] = useState<'orbit' | 'drone' | 'driver' | 'apex'>('orbit');
  const [localFog, setLocalFog] = useState<number>(fogDensity);

  // References for Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const truckRef = useRef<THREE.Group | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const radarSweepRef = useRef<THREE.Mesh | null>(null);
  const rsuLedsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    setLocalFog(fogDensity);
    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(0x0a1426, 0.005 + (fogDensity / 100) * 0.045);
    }
  }, [fogDensity]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050a17);
    scene.fog = new THREE.FogExp2(0x0a1426, 0.005 + (localFog / 100) * 0.045);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 32, 45);
    camera.lookAt(0, 2, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 25);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const bluePoint = new THREE.PointLight(0x00f0ff, 2, 50);
    bluePoint.position.set(0, 8, 0);
    scene.add(bluePoint);

    // 5. Mountain Terrain Geometry
    const terrainGeo = new THREE.PlaneGeometry(160, 160, 48, 48);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const heightVal = Math.sin(vx * 0.04) * Math.cos(vy * 0.04) * 8 + Math.sin(vx * 0.1) * 3;
      pos.setZ(i, heightVal);
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x091428,
      roughness: 0.9,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -1;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Wireframe grid atop terrain
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const gridMesh = new THREE.Mesh(terrainGeo, gridMat);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = -0.9;
    scene.add(gridMesh);

    // 6. 3D Hairpin Roadway Path
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 0, 35),
      new THREE.Vector3(-25, 1, 20),
      new THREE.Vector3(-10, 2, 0),
      new THREE.Vector3(12, 3, -12), // Apex of the hairpin
      new THREE.Vector3(22, 2, 2),
      new THREE.Vector3(15, 1, 22),
      new THREE.Vector3(35, 0, 38),
    ]);

    // Road Surface
    const roadTubeGeo = new THREE.TubeGeometry(curve, 100, 4.5, 12, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x172033,
      roughness: 0.8,
      metalness: 0.2,
    });
    const roadMesh = new THREE.Mesh(roadTubeGeo, roadMat);
    roadMesh.scale.set(1, 0.08, 1);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Center divider lines
    const lineTubeGeo = new THREE.TubeGeometry(curve, 100, 0.15, 6, false);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const lineMesh = new THREE.Mesh(lineTubeGeo, lineMat);
    lineMesh.scale.set(1, 0.12, 1);
    lineMesh.position.y += 0.05;
    scene.add(lineMesh);

    // Guardrail Along Cliff Edge
    const guardrailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-46, 0.8, 38),
      new THREE.Vector3(-27, 1.8, 23),
      new THREE.Vector3(-12, 2.8, 3),
      new THREE.Vector3(15, 3.8, -15),
      new THREE.Vector3(25, 2.8, 4),
      new THREE.Vector3(18, 1.8, 25),
      new THREE.Vector3(38, 0.8, 41),
    ]);
    const railGeo = new THREE.TubeGeometry(guardrailCurve, 80, 0.12, 6, false);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const railMesh = new THREE.Mesh(railGeo, railMat);
    scene.add(railMesh);

    // 7. Sensor Mast & Camera CAM001
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(15, 6, -10);
    scene.add(poleMesh);

    const cameraBoxGeo = new THREE.BoxGeometry(0.8, 0.5, 1.2);
    const cameraBoxMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const cameraBoxMesh = new THREE.Mesh(cameraBoxGeo, cameraBoxMat);
    cameraBoxMesh.position.set(15, 10, -10);
    cameraBoxMesh.lookAt(5, 2, 5);
    scene.add(cameraBoxMesh);

    // Ultrasonic / Radar Scanning Cone
    const radarConeGeo = new THREE.ConeGeometry(16, 28, 32, 1, true);
    const radarConeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const radarCone = new THREE.Mesh(radarConeGeo, radarConeMat);
    radarCone.position.set(15, 10, -10);
    radarCone.rotation.x = Math.PI / 2.8;
    radarCone.rotation.z = -Math.PI / 4;
    scene.add(radarCone);
    radarSweepRef.current = radarCone;

    // 8. 3 Roadside Safety Units (RSU-01, RSU-02, RSU-03) with Dynamic Warning LEDs
    const rsuPositions = [
      { id: 'RSU-01', pos: new THREE.Vector3(14, 0, -8), ledState: rsus?.[0]?.led_state || 'GREEN' },
      { id: 'RSU-02', pos: new THREE.Vector3(-24, 0, 24), ledState: rsus?.[1]?.led_state || 'GREEN' },
      { id: 'RSU-03', pos: new THREE.Vector3(22, 0, 24), ledState: rsus?.[2]?.led_state || 'GREEN' },
    ];

    rsuLedsRef.current = [];

    rsuPositions.forEach((rsuDef) => {
      const rsuGroup = new THREE.Group();
      rsuGroup.position.copy(rsuDef.pos);

      // Pole
      const rsuPoleGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 12);
      const rsuPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const rsuPole = new THREE.Mesh(rsuPoleGeo, rsuPoleMat);
      rsuPole.position.y = 3;
      rsuGroup.add(rsuPole);

      // Solar Panel
      const solarGeo = new THREE.BoxGeometry(1.6, 0.1, 1.2);
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
      const solarMesh = new THREE.Mesh(solarGeo, solarMat);
      solarMesh.position.set(0, 6.2, 0);
      solarMesh.rotation.x = 0.4;
      rsuGroup.add(solarMesh);

      // LED Light Strobe Box
      const ledColorHex =
        hazardLevel === 'ALERT' || rsuDef.ledState === 'RED'
          ? 0xef4444
          : hazardLevel === 'CAUTION' || rsuDef.ledState === 'YELLOW'
          ? 0xf59e0b
          : 0x10b981;

      const ledGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColorHex,
        emissive: ledColorHex,
        emissiveIntensity: 1.5,
      });
      rsuLedsRef.current.push(ledMat);

      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0, 5, 0.3);
      rsuGroup.add(ledMesh);

      // PointLight for ground illumination
      const rsuLight = new THREE.PointLight(ledColorHex, 2, 18);
      rsuLight.position.set(0, 5, 0.5);
      rsuGroup.add(rsuLight);

      scene.add(rsuGroup);
    });

    // 9. 3D Vehicle Models
    // Truck (Obstruction at the apex)
    const truckGroup = new THREE.Group();
    const truckBodyGeo = new THREE.BoxGeometry(3.6, 2.2, 7.5);
    const truckBodyMat = new THREE.MeshStandardMaterial({
      color: hazardLevel === 'ALERT' ? 0xef4444 : 0xf59e0b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const truckBody = new THREE.Mesh(truckBodyGeo, truckBodyMat);
    truckBody.position.y = 1.6;
    truckBody.castShadow = true;
    truckGroup.add(truckBody);

    // Holographic Bounding Box above truck
    const boxFrameGeo = new THREE.BoxGeometry(4.2, 3, 8.2);
    const boxFrameMat = new THREE.MeshBasicMaterial({
      color: hazardLevel === 'ALERT' ? 0xef4444 : 0x38bdf8,
      wireframe: true,
    });
    const boxFrame = new THREE.Mesh(boxFrameGeo, boxFrameMat);
    boxFrame.position.y = 1.8;
    truckGroup.add(boxFrame);

    truckGroup.position.set(12, 3.2, -10);
    truckGroup.rotation.y = Math.PI / 1.4;
    scene.add(truckGroup);
    truckRef.current = truckGroup;

    // Approaching Car
    const carGroup = new THREE.Group();
    const carBodyGeo = new THREE.BoxGeometry(2.4, 1.2, 4.5);
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carBody.position.y = 1;
    carBody.castShadow = true;
    carGroup.add(carBody);

    // Car Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), headlightMat);
    hl1.position.set(-0.8, 0.8, -2.3);
    const hl2 = hl1.clone();
    hl2.position.set(0.8, 0.8, -2.3);
    carGroup.add(hl1);
    carGroup.add(hl2);

    scene.add(carGroup);
    carRef.current = carGroup;

    // 10. Orbit Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      camera.position.x += deltaX * 0.1;
      camera.position.y = Math.max(8, camera.position.y - deltaY * 0.1);
      camera.lookAt(0, 2, 0);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.min(80, Math.max(15, camera.position.z + e.deltaY * 0.04));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // 11. Animation Loop
    let animId: number;
    let progress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate radar scan
      if (radarSweepRef.current) {
        radarSweepRef.current.rotation.y += 0.015;
      }

      // Move car along road
      progress = (progress + 0.0018) % 1;
      const point = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress);
      if (carGroup) {
        carGroup.position.copy(point);
        carGroup.position.y += 0.2;
        carGroup.lookAt(point.clone().add(tangent));
      }

      // If alert or stalled, pulse truck hazard box
      if (truckGroup && (hazardLevel === 'ALERT' || stalledVehicle?.hazard_triggered)) {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
        truckGroup.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [hazardLevel, localFog, rsus, stalledVehicle]);

  // Adjust Camera Preset Angles
  const setCameraPreset = (preset: 'orbit' | 'drone' | 'driver' | 'apex') => {
    setViewAngle(preset);
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'orbit') {
      cam.position.set(0, 32, 45);
      cam.lookAt(0, 2, 0);
    } else if (preset === 'drone') {
      cam.position.set(0, 65, 0.1);
      cam.lookAt(0, 0, 0);
    } else if (preset === 'driver') {
      cam.position.set(-25, 4, 25);
      cam.lookAt(5, 3, -8);
    } else if (preset === 'apex') {
      cam.position.set(22, 12, -18);
      cam.lookAt(12, 3, -10);
    }
  };

  // React to activeCameraPreset changes from parent
  useEffect(() => {
    if (activeCameraPreset) {
      setCameraPreset(activeCameraPreset);
    }
  }, [activeCameraPreset]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        borderRadius: hideOverlays ? 0 : 'var(--radius-md)',
        overflow: 'hidden',
        border: hideOverlays ? 'none' : '1px solid var(--border-glow)',
        backgroundColor: '#0a0a0d',
      }}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />

      {/* Top HUD Controls Overlay */}
      {!hideOverlays && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            pointerEvents: 'none',
          }}
        >
          {/* Left: Road & Hazard Info */}
          <div
            style={{
              backgroundColor: 'rgba(7, 13, 26, 0.88)',
              backdropFilter: 'blur(16px)',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glow)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: hazardLevel === 'ALERT' ? '#ef4444' : hazardLevel === 'CAUTION' ? '#f59e0b' : '#10b981' }} className="pulse" />
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{roadName}</strong>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              3D DIGITAL TWIN • 3 RSU NODES • {localFog}% FOG DENSITY
            </div>
          </div>

          {/* Right: Camera Angles & Quick Scenario Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'auto' }}>
            {(['orbit', 'drone', 'driver', 'apex'] as const).map((mode) => (
              <button
                key={mode}
                className={`btn btn-sm ${viewAngle === mode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCameraPreset(mode)}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', textTransform: 'capitalize' }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Fog Adjustment Bar */}
      {!hideOverlays && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(7, 13, 26, 0.88)',
            backdropFilter: 'blur(16px)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CloudFog size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Scene Fog:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={localFog}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalFog(val);
              if (onFogChange) onFogChange(val);
            }}
            style={{ width: '100px', accentColor: '#38bdf8' }}
          />
          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{localFog}%</span>
        </div>
      )}
    </div>
  );
};
