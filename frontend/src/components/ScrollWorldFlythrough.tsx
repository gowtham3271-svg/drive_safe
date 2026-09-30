import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronRight,
  ArrowRight,
  Video,
  PlayCircle,
  Zap,
} from 'lucide-react';

interface ScrollWorldFlythroughProps {
  onEnterStudio: () => void;
  onEnterLiveMonitor?: () => void;
  onEnterSimulation?: () => void;
}

// 5 Story Chapters defining the cinematic journey
interface Chapter {
  id: number;
  start: number;
  end: number;
  phaseTag: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string; color: string }[];
  highlight: string;
  badgeColor: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    start: 0.0,
    end: 0.2,
    phaseTag: 'CHAPTER 01 // CORRIDOR ELEVATION 1,840m',
    title: 'THE TREACHEROUS GHAT PASS',
    subtitle: 'Where Sudden Fog Meets Unforgiving Hairpin Cliffs',
    description:
      'Mountain ghat corridors across India feature high accident severity due to steep descents, hairpin turns, and flash valley fog that blinds drivers with zero advance warning.',
    metrics: [
      { label: 'VISIBILITY', value: '14 METERS', color: '#ef4444' },
      { label: 'ELEVATION', value: '1,840m', color: '#38bdf8' },
      { label: 'CURVATURE', value: 'R = 18m (HAIRPIN)', color: '#f59e0b' },
    ],
    highlight: 'Khandala Ghat • NH-48 Corridor Sector 4',
    badgeColor: '#38bdf8',
  },
  {
    id: 2,
    start: 0.2,
    end: 0.42,
    phaseTag: 'CHAPTER 02 // MULTI-MODAL SENSOR FUSION',
    title: 'EDGE AI PROBING THE FOG',
    subtitle: 'Raspberry Pi 4 + YOLO11-Nano + 40kHz Ultrasonic Echo',
    description:
      'Roadside stations pierce through dense condensation using dual-modality sensing: high-speed neural vision combined with acoustic echo sonar that operates unaffected by optical blindness.',
    metrics: [
      { label: 'YOLO11 ONNX', value: '45 FPS / 14ms', color: '#10b981' },
      { label: 'SONAR FREQ', value: '40 kHz', color: '#38bdf8' },
      { label: 'FUSION CONF', value: '98.4%', color: '#ffd200' },
    ],
    highlight: 'Optical & Acoustic Sensor Mesh Activated',
    badgeColor: '#10b981',
  },
  {
    id: 3,
    start: 0.42,
    end: 0.65,
    phaseTag: 'CHAPTER 03 // CRITICAL HAZARD EVENT',
    title: 'STALLED VEHICLE IN BLIND APEX',
    subtitle: 'Stationary Dwell Monitor Triggers Collision Warning',
    description:
      'A multi-axle freight truck stalls directly behind the blind rocky outcrop. Within 3.2 seconds of stationary dwell, the edge AI rules out slow traffic and escalates to a Priority-1 Collision Hazard.',
    metrics: [
      { label: 'OBSTACLE', value: 'STALLED TRUCK', color: '#ef4444' },
      { label: 'DWELL TIME', value: '18.4 SECONDS', color: '#ef4444' },
      { label: 'COLLISION RISK', value: 'CRITICAL (94/100)', color: '#ef4444' },
    ],
    highlight: 'Zero Driver Line-Of-Sight Behind Cliff',
    badgeColor: '#ef4444',
  },
  {
    id: 4,
    start: 0.65,
    end: 0.85,
    phaseTag: 'CHAPTER 04 // SUB-50ms RF INTERCEPT',
    title: 'LORA MESH BROADCAST',
    subtitle: 'Wireless Beacons Leap 250m Backwards Before Cars Enter',
    description:
      'Even when cellular networks fail in deep ravines, 433 MHz LoRa packets propagate upstream in milliseconds, instantly switching roadside LED towers from safe green to flashing emergency RED.',
    metrics: [
      { label: 'MESH LATENCY', value: '38 MILLISECONDS', color: '#38bdf8' },
      { label: 'WARNING DIST', value: '250m ADVANCE', color: '#ffd200' },
      { label: 'RSU STROBES', value: 'ACTIVE RED', color: '#ef4444' },
    ],
    highlight: 'Approaching Driver Alerted 12 Seconds Early',
    badgeColor: '#f59e0b',
  },
  {
    id: 5,
    start: 0.85,
    end: 1.0,
    phaseTag: 'CHAPTER 05 // SYSTEM COMMAND CENTER',
    title: 'ZERO BLIND SPOTS. SAFE TRANSIT.',
    subtitle: 'Complete Edge Safety Ecosystem Ready for Inspection',
    description:
      'The approaching car decelerates smoothly to 15 km/h, safely avoiding the blind obstacle. Dive into the live 3D studio, inspect telemetry feeds, or run the complete 11-step viva college demonstration.',
    metrics: [
      { label: 'ACCIDENTS', value: '0 PREVENTED', color: '#10b981' },
      { label: 'SYSTEM STATE', value: 'SAFE ARREST', color: '#10b981' },
      { label: 'MESH INTEGRITY', value: '100% NOMINAL', color: '#38bdf8' },
    ],
    highlight: 'Mission Complete • Enter Operations Platform',
    badgeColor: '#a855f7',
  },
];

export const ScrollWorldFlythrough: React.FC<ScrollWorldFlythroughProps> = ({
  onEnterStudio,
  onEnterLiveMonitor,
  onEnterSimulation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Scroll Progress State (0 to 1)
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoSpeed, setAutoSpeed] = useState<number>(1);
  const [cameraMode, setCameraMode] = useState<'drone' | 'driver' | 'orbit'>('drone');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const windGainRef = useRef<GainNode | null>(null);

  // Three.js State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scene Dynamic Objects
  const truckRef = useRef<THREE.Group | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const loraRingsRef = useRef<THREE.Mesh[]>([]);
  const rsuBeaconsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const rsuPointLightsRef = useRef<THREE.PointLight[]>([]);
  const cloudParticlesRef = useRef<THREE.Points | null>(null);
  const wireframeBBoxRef = useRef<THREE.LineSegments | null>(null);
  const sonarRayRef = useRef<THREE.Line | null>(null);

  // Splines for Camera Flight and LookAt
  const cameraSplineRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const lookAtSplineRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const roadCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  // Smooth Interpolation Progress
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);

  // Web Audio Wind Synthesizer
  const toggleAudio = () => {
    if (!isAudioEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // White noise buffer for ambient mountain wind
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass filter for mountain wind whoosh
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.Q.setValueAtTime(3.0, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        windGainRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        setIsAudioEnabled(true);
      } catch (e) {
        console.warn('Web Audio initialization error:', e);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAudioEnabled(false);
    }
  };

  // Play a brief high-tech sonar blip when passing hazard
  const playSonarBlip = useCallback(() => {
    if (!isAudioEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // ignore audio errors
    }
  }, [isAudioEnabled]);

  // Handle scroll in virtual runway
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return;
    const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    targetProgressRef.current = progress;
  }, []);

  // Jump to Chapter Waypoint
  const jumpToChapter = (chapter: Chapter) => {
    targetProgressRef.current = chapter.start;
    if (!containerRef.current) return;
    const { scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    containerRef.current.scrollTo({
      top: chapter.start * maxScroll,
      behavior: 'smooth',
    });
  };

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const nextTop = scrollTop + 16 * autoSpeed;
      if (nextTop >= maxScroll) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        containerRef.current.scrollTop = nextTop;
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isAutoPlaying, autoSpeed]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const mount = canvasMountRef.current;
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. Scene setup with dense atmospheric mountain fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x071120, 0.015);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1200);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(40, 70, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    const rimBlueLight = new THREE.DirectionalLight(0x0284c7, 0.9);
    rimBlueLight.position.set(-50, 30, -40);
    scene.add(rimBlueLight);

    // 5. Mountain Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(260, 260, 80, 80);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // Realistic mountainous topology with deep valleys and ridges
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);
      const ridge1 = Math.sin(vx * 0.035) * Math.cos(vy * 0.035) * 16;
      const ridge2 = Math.sin(vx * 0.08 + 1.2) * Math.cos(vy * 0.07) * 7;
      const cliff = Math.sin((vx + vy) * 0.05) * 6;
      const valleyTrough = Math.exp(-Math.pow(distFromCenter / 70, 2)) * -6;
      pos.setZ(i, ridge1 + ridge2 + cliff + valleyTrough);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x081324,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Subtle cyan wireframe grid overlay for the cybernetic digital-twin look
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const terrainGrid = new THREE.Mesh(terrainGeo, gridMat);
    terrainGrid.rotation.x = -Math.PI / 2;
    terrainGrid.position.y = -1.9;
    scene.add(terrainGrid);

    // 6. Hairpin Highway Spine (3D Catmull-Rom Curve)
    const roadPoints = [
      new THREE.Vector3(-65, 3, 50),
      new THREE.Vector3(-45, 4, 32),
      new THREE.Vector3(-25, 4.5, 14),
      new THREE.Vector3(-8, 5, -4),
      new THREE.Vector3(14, 5.5, -16), // BLIND HAIRPIN APEX
      new THREE.Vector3(26, 4.8, 0),
      new THREE.Vector3(18, 4.2, 22),
      new THREE.Vector3(38, 3.5, 44),
      new THREE.Vector3(60, 2.8, 62),
    ];
    const roadCurve = new THREE.CatmullRomCurve3(roadPoints);
    roadCurveRef.current = roadCurve;

    // Road Surface Ribbon
    const roadGeo = new THREE.TubeGeometry(roadCurve, 120, 4.2, 14, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x141a29,
      roughness: 0.7,
      metalness: 0.25,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.scale.set(1, 0.08, 1);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Reflective Glowing Yellow Center Dashed Divider
    const centerLineGeo = new THREE.TubeGeometry(roadCurve, 120, 0.14, 6, false);
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xffd200 });
    const centerLineMesh = new THREE.Mesh(centerLineGeo, centerLineMat);
    centerLineMesh.scale.set(1, 0.09, 1);
    centerLineMesh.position.y = 0.02;
    scene.add(centerLineMesh);

    // White Edge Lane Stripes
    const leftEdgeGeo = new THREE.TubeGeometry(roadCurve, 120, 0.1, 6, false);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEdge = new THREE.Mesh(leftEdgeGeo, edgeMat);
    leftEdge.scale.set(1, 0.09, 1);
    leftEdge.position.set(-1.8, 0.02, 0);
    scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(leftEdgeGeo, edgeMat);
    rightEdge.scale.set(1, 0.09, 1);
    rightEdge.position.set(1.8, 0.02, 0);
    scene.add(rightEdge);

    // Mountain Guardrails along the sheer drop
    for (let t = 0.1; t <= 0.85; t += 0.04) {
      const pt = roadCurve.getPoint(t);
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pt.x + 3.2, pt.y * 0.08 + 0.55, pt.z);
      scene.add(post);

      // Yellow reflector on post
      const refGeo = new THREE.BoxGeometry(0.12, 0.2, 0.12);
      const refMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const ref = new THREE.Mesh(refGeo, refMat);
      ref.position.set(pt.x + 3.2, pt.y * 0.08 + 0.85, pt.z);
      scene.add(ref);
    }

    // 7. Roadside Units (RSU-01, RSU-02, RSU-03)
    const rsuPositions = [
      { name: 'RSU-01 (Apex Station)', t: 0.52, pos: new THREE.Vector3(17, 3.2, -18) },
      { name: 'RSU-02 (Entry Curve)', t: 0.35, pos: new THREE.Vector3(-10, 3.0, -8) },
      { name: 'RSU-03 (Advance Warning)', t: 0.18, pos: new THREE.Vector3(-38, 2.8, 22) },
    ];

    rsuBeaconsRef.current = [];
    rsuPointLightsRef.current = [];

    rsuPositions.forEach((rsu) => {
      const rsuGroup = new THREE.Group();
      rsuGroup.position.copy(rsu.pos);

      // Base Pole
      const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.75;
      rsuGroup.add(pole);

      // Solar Panel on top
      const solarGeo = new THREE.BoxGeometry(1.6, 0.08, 1.1);
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2, metalness: 0.8 });
      const solar = new THREE.Mesh(solarGeo, solarMat);
      solar.position.set(0, 5.6, 0);
      solar.rotation.x = -0.4;
      rsuGroup.add(solar);

      // Warning Strobe LED array
      const beaconGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 12);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 2.2,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 4.8;
      rsuGroup.add(beacon);
      rsuBeaconsRef.current.push(beaconMat);

      // Point Light casting on ground
      const pLight = new THREE.PointLight(0x10b981, 2.5, 25);
      pLight.position.set(0, 4.8, 0);
      rsuGroup.add(pLight);
      rsuPointLightsRef.current.push(pLight);

      scene.add(rsuGroup);
    });

    // 8. Stalled Freight Truck in Blind Hairpin
    const truckGroup = new THREE.Group();
    truckRef.current = truckGroup;
    const apexPt = roadCurve.getPoint(0.53);
    truckGroup.position.set(apexPt.x + 0.4, 0.8, apexPt.z + 0.5);
    truckGroup.rotation.y = 0.85;

    // Truck Body
    const cabinGeo = new THREE.BoxGeometry(2.6, 2.4, 2.8);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.5 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.4, 1.8);
    cabin.castShadow = true;
    truckGroup.add(cabin);

    const cargoGeo = new THREE.BoxGeometry(2.8, 3.2, 6.2);
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.2 });
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 1.8, -2.4);
    cargo.castShadow = true;
    truckGroup.add(cargo);

    // Flashing Orange Emergency Hazards
    const hazardGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const h1 = new THREE.Mesh(hazardGeo, hazardMat);
    h1.position.set(-1.2, 1.8, 3.2);
    const h2 = new THREE.Mesh(hazardGeo, hazardMat);
    h2.position.set(1.2, 1.8, 3.2);
    truckGroup.add(h1);
    truckGroup.add(h2);

    // AI Bounding Box Wireframe Halo
    const bboxGeo = new THREE.BoxGeometry(3.6, 4.2, 7.6);
    const bboxEdges = new THREE.EdgesGeometry(bboxGeo);
    const bboxMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const bboxWireframe = new THREE.LineSegments(bboxEdges, bboxMat);
    bboxWireframe.position.set(0, 2.1, -0.6);
    truckGroup.add(bboxWireframe);
    wireframeBBoxRef.current = bboxWireframe;

    scene.add(truckGroup);

    // 9. Approaching Car climbing the mountain pass
    const carGroup = new THREE.Group();
    carRef.current = carGroup;
    const carPt = roadCurve.getPoint(0.12);
    carGroup.position.set(carPt.x, 0.45, carPt.z);
    carGroup.rotation.y = -0.55;

    const carBodyGeo = new THREE.BoxGeometry(2.0, 1.1, 4.2);
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carBody.position.y = 0.6;
    carBody.castShadow = true;
    carGroup.add(carBody);

    // Car Headlights casting beams on road
    const headBeam1 = new THREE.SpotLight(0xffffff, 3.5, 45, Math.PI / 6, 0.4);
    headBeam1.position.set(-0.7, 0.6, 2.2);
    headBeam1.target.position.set(-0.7, 0, 16);
    carGroup.add(headBeam1);
    carGroup.add(headBeam1.target);

    const headBeam2 = new THREE.SpotLight(0xffffff, 3.5, 45, Math.PI / 6, 0.4);
    headBeam2.position.set(0.7, 0.6, 2.2);
    headBeam2.target.position.set(0.7, 0, 16);
    carGroup.add(headBeam2);
    carGroup.add(headBeam2.target);

    scene.add(carGroup);

    // 10. Sonar Raycast between RSU-01 and Stalled Truck
    const rayPts = [
      new THREE.Vector3(17, 4.8, -18),
      new THREE.Vector3(apexPt.x + 0.4, 2.0, apexPt.z + 0.5),
    ];
    const rayGeo = new THREE.BufferGeometry().setFromPoints(rayPts);
    const rayMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.8,
      gapSize: 0.4,
      linewidth: 2,
    });
    const sonarLine = new THREE.Line(rayGeo, rayMat);
    sonarLine.computeLineDistances();
    scene.add(sonarLine);
    sonarRayRef.current = sonarLine;

    // 11. Animated LoRa Mesh Wireless Expansion Rings
    loraRingsRef.current = [];
    for (let r = 0; r < 4; r++) {
      const ringGeo = new THREE.RingGeometry(2 + r * 3, 2.4 + r * 3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(17, 4.8, -18);
      scene.add(ring);
      loraRingsRef.current.push(ring);
    }

    // 12. Floating Atmospheric Cloud / Dust Particle Field
    const particleCount = 750;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 160;
      particlePositions[i + 1] = Math.random() * 25 + 1;
      particlePositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.65,
      transparent: true,
      opacity: 0.35,
    });
    const cloudParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(cloudParticles);
    cloudParticlesRef.current = cloudParticles;

    // 13. Camera Flight Spline (The Continuous Drone Fly-Through)
    const cameraSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-68, 44, 75), // 0.0: High altitude summit overview
      new THREE.Vector3(-45, 26, 48), // 0.2: Descending into mist
      new THREE.Vector3(-22, 14, 25), // 0.35: Gliding above road approach
      new THREE.Vector3(4, 7.5, -4),  // 0.50: Swooping around the blind cliff
      new THREE.Vector3(18, 9.5, 8),  // 0.65: Low bank past the stalled truck
      new THREE.Vector3(32, 17, 34),  // 0.80: Tracking upstream LoRa wave
      new THREE.Vector3(-5, 42, 60),  // 1.0: Majestic summit command overview
    ]);
    cameraSplineRef.current = cameraSpline;

    // Corresponding LookAt Spline (Dynamic Focus Point)
    const lookAtSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5, 6, 8),     // 0.0: Centered on valley
      new THREE.Vector3(-20, 4, 15),   // 0.2: Tracking approaching traffic
      new THREE.Vector3(-5, 4, 0),     // 0.35: Entering hairpin zone
      new THREE.Vector3(14, 3.5, -14), // 0.50: Locking onto blind apex & stalled truck
      new THREE.Vector3(16, 3, 0),     // 0.65: Reviewing stopped truck & telemetry
      new THREE.Vector3(5, 4, 20),     // 0.80: Looking at flashing RSU-03 beacon
      new THREE.Vector3(0, 5, 0),      // 1.0: Full valley system equilibrium
    ]);
    lookAtSplineRef.current = lookAtSpline;

    // Resize Handler
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 14. Animation & Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth progress interpolation (Spring Lerp)
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.08;
      const t = Math.min(Math.max(currentProgressRef.current, 0), 1);
      setScrollProgress(t);

      // Determine active chapter index
      const chIndex = CHAPTERS.findIndex((c) => t >= c.start && t <= c.end);
      if (chIndex !== -1 && chIndex !== activeChapterIndex) {
        setActiveChapterIndex(chIndex);
        if (chIndex === 2 || chIndex === 3) {
          playSonarBlip();
        }
      }

      // Update Camera along Fly-Through Spline based on selected camera mode
      if (cameraSplineRef.current && lookAtSplineRef.current) {
        if (cameraMode === 'drone') {
          const camPos = cameraSplineRef.current.getPoint(t);
          const targetLookAt = lookAtSplineRef.current.getPoint(t);
          camera.position.copy(camPos);
          camera.lookAt(targetLookAt);
        } else if (cameraMode === 'driver' && roadCurveRef.current) {
          // Driver perspective tracking with the moving car
          const carT = Math.min(0.08 + t * 0.45, 0.8);
          const cPt = roadCurveRef.current.getPoint(carT);
          const forwardPt = roadCurveRef.current.getPoint(Math.min(carT + 0.04, 0.9));
          camera.position.set(cPt.x, cPt.y * 0.08 + 1.8, cPt.z);
          camera.lookAt(forwardPt.x, forwardPt.y * 0.08 + 1.2, forwardPt.z);
        } else {
          // High Orbit
          const angle = time * 0.15;
          camera.position.set(Math.sin(angle) * 55, 38, Math.cos(angle) * 55);
          camera.lookAt(0, 4, 0);
        }
      }

      // Dynamic Fog based on altitude/progress (Thickest in Chapter 2 & 3)
      if (scene.fog instanceof THREE.FogExp2) {
        const fogIntensity = 0.012 + Math.sin(t * Math.PI) * 0.024;
        scene.fog.density = fogIntensity;
      }

      // Update RSU Strobe LED Colors and Lights (Hazard vs Safe)
      const isHazardActive = t >= 0.42;
      rsuBeaconsRef.current.forEach((mat) => {
        if (isHazardActive) {
          const strobe = (Math.sin(time * 12) + 1) * 0.5 > 0.4;
          mat.color.setHex(strobe ? 0xef4444 : 0x450a0a);
          mat.emissive.setHex(0xef4444);
          mat.emissiveIntensity = strobe ? 3.5 : 0.6;
        } else {
          mat.color.setHex(0x10b981);
          mat.emissive.setHex(0x10b981);
          mat.emissiveIntensity = 2.0;
        }
      });

      rsuPointLightsRef.current.forEach((light) => {
        if (isHazardActive) {
          const strobe = (Math.sin(time * 12) + 1) * 0.5 > 0.4;
          light.color.setHex(0xef4444);
          light.intensity = strobe ? 4.5 : 0.5;
        } else {
          light.color.setHex(0x10b981);
          light.intensity = 2.5;
        }
      });

      // Animate LoRa Expanding Wave Rings
      loraRingsRef.current.forEach((ring, idx) => {
        if (isHazardActive) {
          ring.visible = true;
          const scale = ((time * 1.8 + idx * 0.6) % 3.0) + 0.3;
          ring.scale.set(scale, scale, 1);
          const mat = ring.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.6 - scale * 0.18);
        } else {
          ring.visible = false;
        }
      });

      // Stalled truck AI wireframe bounding box pulse
      if (wireframeBBoxRef.current) {
        const pulse = 1.0 + Math.sin(time * 5) * 0.05;
        wireframeBBoxRef.current.scale.set(pulse, pulse, pulse);
      }

      // Approaching car motion: advances along road curve and decelerates at warning
      if (carRef.current && roadCurveRef.current) {
        const carT = Math.min(0.08 + t * 0.48, 0.78);
        const carPos = roadCurveRef.current.getPoint(carT);
        const nextCarPos = roadCurveRef.current.getPoint(Math.min(carT + 0.01, 0.8));
        carRef.current.position.set(carPos.x, carPos.y * 0.08 + 0.3, carPos.z);
        carRef.current.lookAt(nextCarPos.x, nextCarPos.y * 0.08 + 0.3, nextCarPos.z);
      }

      // Floating cloud particles drift
      if (cloudParticlesRef.current) {
        const positions = cloudParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += delta * 1.8;
          if (positions[i] > 80) positions[i] = -80;
        }
        cloudParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [cameraMode, playSonarBlip]);

  const activeChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#060913',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 1. Fixed Three.js WebGL Canvas (The 3D World) */}
      <div
        ref={canvasMountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2. Top Header HUD Bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          padding: '0 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
          background: 'linear-gradient(to bottom, rgba(6, 9, 19, 0.85) 0%, rgba(6, 9, 19, 0) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Brand & Mode Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.45)',
            }}
          >
            <Compass size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em', color: '#ffffff' }}>
                GHATGUARD
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                3D SCROLL WORLD
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Continuous FPV Drone Fly-Through • Scroll to Scrub Story
            </p>
          </div>
        </div>

        {/* Central Chapter Waypoint Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            padding: '0.35rem 0.65rem',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {CHAPTERS.map((ch, idx) => {
            const isActive = activeChapterIndex === idx;
            return (
              <button
                key={ch.id}
                onClick={() => jumpToChapter(ch)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: isActive ? ch.badgeColor : 'transparent',
                  color: isActive ? '#000000' : '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 14px ${ch.badgeColor}66` : 'none',
                }}
              >
                0{ch.id}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Audio + AutoTour + Enter Studio CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Sound Toggle */}
          <button
            onClick={toggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: isAudioEnabled ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.6)',
              border: isAudioEnabled ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isAudioEnabled ? '#38bdf8' : '#94a3b8',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Ambient Mountain Sound"
          >
            {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{isAudioEnabled ? 'AUDIO ON' : 'AUDIO'}</span>
          </button>

          {/* Auto Tour Play/Pause */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: isAutoPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              border: isAutoPlaying ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isAutoPlaying ? '#10b981' : '#f8fafc',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoPlaying ? 'PAUSE FLY' : 'AUTO FLY'}</span>
          </button>

          {/* Enter Studio Primary CTA */}
          <button
            onClick={onEnterStudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffd200',
              color: '#000000',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(255, 210, 0, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>ENTER 3D STUDIO</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 3. The Virtual Scroll Runway (550vh of buttery-smooth scrubbing) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 10,
          scrollBehavior: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <div style={{ height: '520vh', width: '100%', pointerEvents: 'none' }} />
      </div>

      {/* 4. Dynamic Floating Story Cards (Overlay mapped to scroll progress) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 4rem',
        }}
      >
        <div style={{ maxWidth: '580px', pointerEvents: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter.id}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                backgroundColor: 'rgba(10, 16, 30, 0.82)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '20px',
                padding: '2rem 2.25rem',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(56, 189, 248, 0.12)',
              }}
            >
              {/* Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: activeChapter.badgeColor,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {activeChapter.phaseTag}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#64748b',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {Math.round(scrollProgress * 100)}% FLIGHT COMPLETE
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: '#ffffff',
                  marginBottom: '0.35rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {activeChapter.title}
              </h1>

              {/* Subtitle */}
              <h2
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: activeChapter.badgeColor,
                  marginBottom: '1rem',
                }}
              >
                {activeChapter.subtitle}
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  marginBottom: '1.4rem',
                }}
              >
                {activeChapter.description}
              </p>

              {/* Live Sensor Metrics Pills */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.65rem',
                  marginBottom: '1.4rem',
                }}
              >
                {activeChapter.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, marginBottom: '0.2rem' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Chapter Interactive CTA Hub */}
              {activeChapter.id === 5 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={onEnterStudio}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      backgroundColor: '#ffd200',
                      color: '#000000',
                      border: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      boxShadow: '0 0 25px rgba(255, 210, 0, 0.45)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Zap size={18} />
                    <span>LAUNCH TRIPO3D STUDIO WORKSPACE</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {onEnterSimulation && (
                      <button
                        onClick={onEnterSimulation}
                        style={{
                          padding: '0.7rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <PlayCircle size={15} />
                        <span>11-Step Viva Demo</span>
                      </button>
                    )}

                    {onEnterLiveMonitor && (
                      <button
                        onClick={onEnterLiveMonitor}
                        style={{
                          padding: '0.7rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10b981',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Video size={15} />
                        <span>Live Pi 4 Webcam</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Next Chapter Quick Cue */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    ↓ Scroll down to continue drone fly-through
                  </span>
                  <button
                    onClick={() => {
                      const nextCh = CHAPTERS[activeChapterIndex + 1];
                      if (nextCh) jumpToChapter(nextCh);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: activeChapter.badgeColor,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span>Next Chapter</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Right-Hand Waypoint Timeline Indicator */}
      <div
        style={{
          position: 'absolute',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 25,
          backgroundColor: 'rgba(10, 16, 30, 0.65)',
          padding: '1.25rem 0.65rem',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {CHAPTERS.map((ch, idx) => {
          const isActive = activeChapterIndex === idx;
          const isPassed = scrollProgress >= ch.start;
          return (
            <motion.div
              key={ch.id}
              whileHover={{ scale: 1.25 }}
              onClick={() => jumpToChapter(ch)}
              style={{
                width: isActive ? '12px' : '8px',
                height: isActive ? '12px' : '8px',
                borderRadius: '50%',
                backgroundColor: isActive ? ch.badgeColor : isPassed ? '#38bdf8' : '#334155',
                boxShadow: isActive ? `0 0 12px ${ch.badgeColor}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={ch.title}
            />
          );
        })}
      </div>

      {/* 6. Bottom Floating Flight HUD & Camera Mode Switcher */}
      <footer
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(10, 16, 30, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          padding: '0.5rem 1.25rem',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Scrubber Progress Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            SCRUB
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={scrollProgress}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (containerRef.current) {
                const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
                containerRef.current.scrollTop = val * maxScroll;
              }
            }}
            style={{
              width: '180px',
              accentColor: '#38bdf8',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', minWidth: '40px' }}>
            {Math.round(scrollProgress * 100)}%
          </span>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Camera Angle Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>ANGLE:</span>
          {(['drone', 'driver', 'orbit'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: cameraMode === mode ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                color: cameraMode === mode ? '#000000' : '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: cameraMode === mode ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Speed Multiplier for Auto Tour */}
        <button
          onClick={() => setAutoSpeed(autoSpeed === 1 ? 2 : autoSpeed === 2 ? 0.5 : 1)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ffd200',
            fontSize: '0.72rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
          title="Toggle Auto Fly Speed"
        >
          {autoSpeed}x SPEED
        </button>
      </footer>
    </div>
  );
};
