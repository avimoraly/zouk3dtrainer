import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ZoukTrainer() {
  const mountRef     = useRef(null);
  const bodySpeedRef = useRef(0);
  const headSpeedRef = useRef(0);
  const flexRef      = useRef(0.68);   // 0 = stiff, 1 = very flexible
  const camAngleRef  = useRef(0);
  const camPitchRef  = useRef(0.18);
  const camZoomRef   = useRef(5.2);
  const headARef     = useRef(0);
  const baseTiltRef     = useRef({ x: 0, z: 0 });
  const bateCabeloRef   = useRef(false);
  const bcPhaseRef      = useRef(0);
  const bcAmpRef        = useRef(0);
  const torsionRef      = useRef(false);
  const torsionPhaseRef = useRef(0);
  const torsionAmpRef   = useRef(0);
  const snapTiltRef  = useRef(false);
  const frozenTiltXRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const [vh, setVh] = useState(window.innerHeight);
  const targetBSRef = useRef(0);  // target body speed for smooth reverse
  const targetHSRef = useRef(0);  // target head speed for smooth reverse
  const reversingRef = useRef(false); // true while transitioning
  const frozenTiltZRef = useRef(0);
  const figPosRef  = useRef({ x: 0, z: 0 });
  const keysRef   = useRef({});
  const [moveEnabled, setMoveEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const moveEnabledRef = useRef(false);
  const isDragging   = useRef(false);
  const lastMouseX   = useRef(0);
  const lastMouseY   = useRef(0);

  const [bodySpeed, setBodySpeed] = useState(0);
  const [headSpeed, setHeadSpeed] = useState(0);
  const [flex,      setFlex     ] = useState(0.68);
  const [activeLabel, setActiveLabel] = useState("");
  const [isMobile,  setIsMobile ] = useState(() => window.innerWidth < 640);
  const [activePreset, setActivePreset] = useState(null);
  const [tiltMode, setTiltMode] = useState('circular');
  const tiltModeRef = useRef('circular');
  const [speedMult, setSpeedMult] = useState(1.0);
  const speedMultRef = useRef(1.0);
  const smSmoothedRef = useRef(1.0);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);

  const PRESETS = [
    { name: 'Circular',         rotation:  0, tilt:  1 },
    { name: 'Tilted Turns',     rotation: -1, tilt:  0.1 },
    { name: 'Toalha',           rotation:  1, tilt:  1 },
    { name: 'Roasted Chicken',  rotation: -1, tilt:  1 },
    { name: 'Hyper Toalha',     rotation:  1, tilt:  2 },
    { name: 'Chicote Lateral',  rotation:  2, tilt:  1 },
    { name: 'Horse Saddle',     rotation:  1, tilt: -2 },
    { name: 'Planet',           rotation:  2, tilt: -1 },
  ];

  const doReset = () => {
    bodySpeedRef.current = 0;        setBodySpeed(0);
    headSpeedRef.current = 0;        setHeadSpeed(0);
    tiltModeRef.current = 'circular'; setTiltMode('circular');
    frozenTiltXRef.current = 0;      frozenTiltZRef.current = 0;
    baseTiltRef.current = { x: 0, z: 0 };
    snapTiltRef.current = true;
    torsionRef.current = false;      torsionAmpRef.current = 0;  torsionPhaseRef.current = 0;
    bateCabeloRef.current = false;   bcAmpRef.current = 0;       bcPhaseRef.current = 0;
    reversingRef.current = false;
  };

  const applyPreset = (preset) => {
    lastTimeRef.current = performance.now();

    // ── STEP 1: Clear everything ──
    doReset();

    setActivePreset(preset.name);

    // ── STEP 2: Apply new preset ──
    bodySpeedRef.current = preset.rotation; setBodySpeed(preset.rotation);
    headSpeedRef.current = preset.tilt;     setHeadSpeed(preset.tilt);
    torsionRef.current    = !!preset.torsion;
    bateCabeloRef.current = !!preset.bateCabelo;

    if (preset.name === 'Tilted Turns') {
      // TT: rotation=1, head=0.1 for 1s then head=0
      setTimeout(() => {
        headSpeedRef.current = 0; setHeadSpeed(0);
      }, 1000);
    } else if (preset.tilt !== 0) {
      {
        baseTiltRef.current = { x: 0, z: 0 };
        if (preset.tilt !== 0) {
          const cur = headARef.current;
          const cardinals = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          let best = cardinals[0], bestD = Infinity;
          for (const c of cardinals) {
            let d = Math.abs(((cur - c) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
            if (d < bestD) { bestD = d; best = c; }
          }
          headARef.current = best;
        }
      }
    }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    const onVisible = () => { if (!document.hidden) lastTimeRef.current = performance.now(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
  }, []);

  // Prevent double-fire (touchend + click) in in-app browsers (Instagram, WhatsApp)
  const lastTapRef = useRef(0);
  const tap = (fn) => ({
    onTouchEnd: (e) => { e.preventDefault(); lastTapRef.current = Date.now(); fn(); },
    onClick: () => { if (Date.now() - lastTapRef.current > 400) fn(); },
  });

  const setBS = (v) => { bodySpeedRef.current = v; setBodySpeed(v); setActivePreset(null); lastTimeRef.current = performance.now(); };
  const setHS = (v) => { headSpeedRef.current = v; setHeadSpeed(v); setActivePreset(null); lastTimeRef.current = performance.now(); };
  const setFL = (v) => { flexRef.current = v; setFlex(v); };
  // Non-linear flex: square root curve so slider reaches high values faster
  const flexCurved = (f) => Math.pow(f, 0.55);
  const setTM = (v) => { tiltModeRef.current = v; setTiltMode(v); if (v !== 'circular') { setActivePreset(null); if (Math.abs(headSpeedRef.current) < 0.01) { headSpeedRef.current = 1; setHeadSpeed(1); } } };

  // Direction: set headA phase so tilt snaps to that direction when frozen
  // headA=0 → left, π/2 → back, π → right, -π/2 → forward
  const setTiltDir = (angle) => { headARef.current = angle; };

  useEffect(() => {
    if (Math.abs(headSpeed) > 0.1)
      setActiveLabel(headSpeed > 0 ? "CABEÇA ↻ CLOCKWISE" : "CABEÇA ↺ COUNTER-CW");
    else if (Math.abs(bodySpeed) > 0.1)
      setActiveLabel(bodySpeed > 0 ? "ROTATION → RIGHT" : "← LEFT ROTATION");
    else setActiveLabel("");
  }, [bodySpeed, headSpeed]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    // ─── SCENE ───────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a3f35);   // warm mid-tone studio brown-grey
    scene.fog = new THREE.Fog(0x4a3f35, 12, 28);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 50);
    const CAM_R = 5.2;
    camera.position.set(0, Math.sin(0.18) * CAM_R, Math.cos(0.18) * CAM_R);
    camera.lookAt(0, 1.55, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // ─── LIGHTS ──────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xc8a878, 0.75));  // warm studio ambient

    // Soft overhead key light
    const keyL = new THREE.SpotLight(0xfff6e0, 1.6, 18, Math.PI * 0.25, 0.40);
    keyL.position.set(0, 7, 3);
    keyL.target.position.set(0, 1.2, 0);
    keyL.castShadow = true;
    keyL.shadow.mapSize.set(1024, 1024);
    scene.add(keyL); scene.add(keyL.target);

    // Warm fill from left
    const fillL = new THREE.DirectionalLight(0xffe0b0, 0.55);
    fillL.position.set(-4, 4, 2);
    scene.add(fillL);

    // Cool-blue rim from rear — gives depth
    const rimL = new THREE.DirectionalLight(0x8ab0dd, 0.35);
    rimL.position.set(3, 3, -5);
    scene.add(rimL);

    // ─── FLOOR ───────────────────────────────────────
    // Wooden parquet floor — semi-transparent so figure visible from below
    renderer.sortObjects = true;
    const floorMat = new THREE.MeshPhongMaterial({
      color: 0xb87840, shininess: 60, specular: 0xd4a060,
      transparent: true, opacity: 0.72,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Parquet plank lines — narrow boards running along Z axis
    const plankW = 0.30; // board width in metres
    const darkPlank = new THREE.LineBasicMaterial({ color: 0x6b3c10, transparent: true, opacity: 0.55 });
    const lightPlank = new THREE.LineBasicMaterial({ color: 0xc89050, transparent: true, opacity: 0.30 });
    for (let px = -10; px <= 10; px += plankW) {
      const mat = (Math.round(px / plankW) % 3 === 0) ? darkPlank : lightPlank;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, 0.001, -10),
        new THREE.Vector3(px, 0.001,  10)
      ]);
      scene.add(new THREE.Line(g, mat));
    }
    // Cross-cut grooves — staggered every 1.8m
    const cutMat = new THREE.LineBasicMaterial({ color: 0x6b3c10, transparent: true, opacity: 0.30 });
    let offset = 0;
    for (let pz = -10; pz <= 10; pz += 1.8) {
      offset = (offset + plankW * 2) % (plankW * 4);
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, 0.001, pz),
        new THREE.Vector3( 10, 0.001, pz)
      ]);
      scene.add(new THREE.Line(g, cutMat));
    }
    // Sheen highlight strip down center
    const sheenMat = new THREE.LineBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12 });
    for (let sx = -0.6; sx <= 0.6; sx += 0.15) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, 0.002, -10),
        new THREE.Vector3(sx, 0.002,  10)
      ]);
      scene.add(new THREE.Line(g, sheenMat));
    }

    // ─── STUDIO ROOM ─────────────────────────────────
    const mkStudio = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      return m;
    };

    // Wall material — warm plaster
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x7a6a58, shininess: 8 });
    const ceilMat = new THREE.MeshPhongMaterial({ color: 0x5a5048, shininess: 4 });

    // Back wall (behind figure, -Z)
    const backWall = mkStudio(new THREE.PlaneGeometry(14, 5.5), wallMat);
    backWall.position.set(0, 2.75, -7);
    scene.add(backWall);

    // Front wall (behind camera, +Z) — partial, just sides
    const frontWallL = mkStudio(new THREE.PlaneGeometry(3, 5.5), wallMat);
    frontWallL.position.set(-5.5, 2.75, 7);
    frontWallL.rotation.y = Math.PI;
    scene.add(frontWallL);
    const frontWallR = mkStudio(new THREE.PlaneGeometry(3, 5.5), wallMat);
    frontWallR.position.set(5.5, 2.75, 7);
    frontWallR.rotation.y = Math.PI;
    scene.add(frontWallR);

    // Left wall
    const leftWall = mkStudio(new THREE.PlaneGeometry(14, 5.5), wallMat);
    leftWall.position.set(-7, 2.75, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = mkStudio(new THREE.PlaneGeometry(14, 5.5), wallMat);
    rightWall.position.set(7, 2.75, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Ceiling
    const ceiling = mkStudio(new THREE.PlaneGeometry(14, 14), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.5;
    scene.add(ceiling);

    // ── MIRROR WALL (back wall, -Z side) ──
    // Simulated with a highly reflective bright plane layered on back wall
    const mirrorMat = new THREE.MeshPhongMaterial({
      color: 0xc8c0b0, shininess: 200, specular: 0xffffff,
      transparent: true, opacity: 0.35,
      side: THREE.FrontSide
    });
    const mirror = mkStudio(new THREE.PlaneGeometry(13.6, 4.8), mirrorMat);
    mirror.position.set(0, 2.7, -6.95);
    scene.add(mirror);

    // Mirror frame — dark wood strips
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x3a2810, shininess: 60 });
    // top & bottom
    for (const y of [0.35, 5.15]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.12, 0.08), frameMat);
      bar.position.set(0, y, -6.92);
      scene.add(bar);
    }
    // left & right
    for (const x of [-6.88, 6.88]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 4.85, 0.08), frameMat);
      bar.position.set(x, 2.72, -6.92);
      scene.add(bar);
    }
    // mirror panel dividers (vertical strips every ~3.4m)
    for (const x of [-3.4, 0, 3.4]) {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.07, 4.85, 0.06), frameMat);
      div.position.set(x, 2.72, -6.91);
      scene.add(div);
    }

    // ── BALLET BARRE (left wall) ──
    const barreMat = new THREE.MeshPhongMaterial({ color: 0xc0803a, shininess: 80, specular: 0xffcc88 });
    const barrePole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 11, 10), barreMat);
    barrePole.rotation.z = Math.PI / 2;
    barrePole.position.set(0, 1.05, -6.5);
    scene.add(barrePole);

    // Barre brackets
    for (const bx of [-4.5, -1.5, 1.5, 4.5]) {
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8), barreMat);
      bracket.position.set(bx, 0.82, -6.85);
      bracket.rotation.x = 0.25;
      scene.add(bracket);
    }

    // ── BENCHES (right wall side) ──
    const benchWoodMat = new THREE.MeshPhongMaterial({ color: 0x8b5e2a, shininess: 40 });
    const benchLegMat  = new THREE.MeshPhongMaterial({ color: 0x2a1f14, shininess: 20 });

    for (const bz of [-4, -1, 2]) {
      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.55), benchWoodMat);
      seat.position.set(5.8, 0.47, bz);
      scene.add(seat);
      // Legs
      for (const lx of [-0.8, 0.8]) {
        for (const lz of [-0.2, 0.2]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), benchLegMat);
          leg.position.set(5.8 + lx, 0.23, bz + lz);
          scene.add(leg);
        }
      }
    }

    // ── CEILING SPOTLIGHTS ──
    const spotHousingMat = new THREE.MeshPhongMaterial({ color: 0x222018, shininess: 30 });
    for (const [sx, sz] of [[-2, -2], [2, -2], [0, 2], [-3, 1], [3, 1]]) {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.18, 10), spotHousingMat);
      housing.position.set(sx, 5.3, sz);
      scene.add(housing);
      // Light cone hint
      const coneGeo = new THREE.ConeGeometry(0.08, 0.25, 8, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.07, side: THREE.BackSide });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(sx, 5.1, sz);
      scene.add(cone);
    }

    // ── BASEBOARD trim along walls ──
    const trimMat = new THREE.MeshPhongMaterial({ color: 0x5a4030, shininess: 30 });
    const trimH = 0.12, trimD = 0.04;
    // back
    const trimBack = new THREE.Mesh(new THREE.BoxGeometry(14, trimH, trimD), trimMat);
    trimBack.position.set(0, trimH / 2, -6.98);
    scene.add(trimBack);
    // left
    const trimLeft = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimH, 14), trimMat);
    trimLeft.position.set(-6.98, trimH / 2, 0);
    scene.add(trimLeft);
    // right
    const trimRight = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimH, 14), trimMat);
    trimRight.position.set(6.98, trimH / 2, 0);
    scene.add(trimRight);
    const skin    = new THREE.MeshPhongMaterial({ color: 0xd4956a, shininess: 40 });
    const cloth   = new THREE.MeshPhongMaterial({ color: 0x2255aa, shininess: 30, specular: 0x1a3366 });
    const shoe    = new THREE.MeshPhongMaterial({ color: 0x1a1a2a, shininess: 120, specular: 0x444466 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x1e0e04 });
    const ewhite  = new THREE.MeshPhongMaterial({ color: 0xf8f8f6 });
    const epupil  = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    const lipMat  = new THREE.MeshPhongMaterial({ color: 0xaa4455 });
    const noseMat = new THREE.MeshPhongMaterial({ color: 0xc48060, shininess: 22 });
    const jointM  = new THREE.MeshPhongMaterial({ color: 0x6688bb, shininess: 70, specular: 0x334466 });
    const shirtM  = new THREE.MeshPhongMaterial({ color: 0x2a5599, shininess: 35, specular: 0x112244 });
    const faceMat      = new THREE.MeshPhongMaterial({ color: 0xe8aa80, shininess: 45 });
    const chestFrontMat= new THREE.MeshPhongMaterial({ color: 0xb0b8c0, shininess: 25 }); // grey chest front

    const mk = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      return m;
    };

    // ─── FIGURE ──────────────────────────────────────
    const fig = new THREE.Group();
    scene.add(fig);

    // ── HIPS — rounded human shape ──
    const hipsG = new THREE.Group();
    hipsG.position.y = 1.18;
    fig.add(hipsG);

    // Pelvis core — wider ellipsoid
    const pelvisCore = mk(new THREE.SphereGeometry(0.22, 14, 10), cloth);
    pelvisCore.scale.set(1.35, 0.62, 0.82);
    pelvisCore.position.y = 0.02;
    hipsG.add(pelvisCore);

    // Left & right hip flares — give the characteristic hip curve
    for (const xs of [-1, 1]) {
      const flare = mk(new THREE.SphereGeometry(0.155, 10, 8), cloth);
      flare.scale.set(0.72, 0.88, 0.78);
      flare.position.set(xs * 0.195, 0.0, 0.0);
      hipsG.add(flare);
    }

    // Hip joint spheres
    for (const xs of [-1, 1]) {
      const hjs = mk(new THREE.SphereGeometry(0.090, 10, 10), jointM);
      hjs.position.set(xs * 0.148, -0.09, 0);
      hipsG.add(hjs);
    }

    // ── SPINE + WAIST FILL ──
    const spineG = new THREE.Group();
    spineG.position.y = 0.18;
    hipsG.add(spineG);

    // Waist connector — fills the visible gap between hips and chest belly
    const waist = mk(new THREE.BoxGeometry(0.50, 0.38, 0.27), shirtM);
    waist.position.y = 0.19;   // centres it in the spineG gap
    spineG.add(waist);

    // Spine cylinder (subtle ridge down the back, visible from side/rear)
    const spineRod = mk(new THREE.CylinderGeometry(0.030, 0.035, 0.36, 8), jointM);
    spineRod.position.set(0, 0.18, -0.10);
    spineG.add(spineRod);

    // ── CHEST ──
    const chestG = new THREE.Group();
    chestG.position.y = 0.36;
    spineG.add(chestG);

    const belly = mk(new THREE.BoxGeometry(0.50, 0.19, 0.26), shirtM);
    belly.position.y = 0.095; chestG.add(belly);

    const ribs = mk(new THREE.BoxGeometry(0.63, 0.22, 0.31), shirtM);
    ribs.position.y = 0.305; chestG.add(ribs);

    const pec = mk(new THREE.BoxGeometry(0.69, 0.21, 0.32), shirtM);
    pec.position.y = 0.52; chestG.add(pec);

    // Chest front panel — cream/off-white strip on the front face of the torso
    const chestFront = mk(new THREE.BoxGeometry(0.40, 0.58, 0.015), chestFrontMat);
    chestFront.position.set(0, 0.32, 0.164);
    chestG.add(chestFront);

    for (const xs of [-1, 1]) {
      const yoke = mk(new THREE.CylinderGeometry(0.068, 0.068, 0.20, 10), shirtM);
      yoke.rotation.z = Math.PI / 2;
      yoke.position.set(xs * 0.445, 0.57, 0);
      chestG.add(yoke);
    }
    for (const xs of [-1, 1]) {
      const clav = mk(new THREE.CylinderGeometry(0.018, 0.024, 0.30, 8), skin);
      clav.rotation.z = Math.PI / 2;
      clav.position.set(xs * 0.225, 0.62, 0.11);
      chestG.add(clav);
    }

    // ── NECK ──
    const neck = mk(new THREE.CylinderGeometry(0.073, 0.091, 0.18, 12), skin);
    neck.position.y = 0.715; chestG.add(neck);

    // ── HEAD ──
    const headG = new THREE.Group();
    headG.position.y = 0.87;
    chestG.add(headG);

    const skullMat = new THREE.MeshPhongMaterial({ color: 0xe8a87a, shininess: 30 });
    const skull = mk(new THREE.SphereGeometry(0.193, 24, 20), skullMat);
    skull.scale.set(1, 1.08, 1);
    headG.add(skull);

    // ── FACE HEMISPHERE — front half-sphere in warm human face color ──
    const faceSkinMat = new THREE.MeshPhongMaterial({ color: 0xe8a87a, shininess: 38 });
    const faceHemi = mk(
      new THREE.SphereGeometry(0.196, 24, 20, Math.PI / 2, Math.PI, 0, Math.PI),
      faceSkinMat
    );
    faceHemi.scale.set(1, 1.08, 1);
    headG.add(faceHemi);

    const midFaceMat = new THREE.MeshPhongMaterial({ color: 0xd89870, shininess: 35, side: THREE.DoubleSide });

    // Eyes — white eyeball + dark iris, NO dark torus lids
    const eyeAreaMat = new THREE.MeshPhongMaterial({ color: 0xd89870, shininess: 20 }); // skin-toned eye surround
    for (const xs of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(xs * 0.072, 0.068, 0.170);
      headG.add(eg);

      // Skin-toned eye socket backing (sits behind eyeball)
      const socket = mk(new THREE.CircleGeometry(0.040, 14), eyeAreaMat);
      socket.position.z = -0.002;
      eg.add(socket);

      // Eyeball
      const eyeball = mk(new THREE.SphereGeometry(0.026, 12, 10), ewhite);
      eg.add(eyeball);

      // Iris
      const iris = mk(new THREE.SphereGeometry(0.016, 10, 8), epupil);
      iris.position.z = 0.018;
      eg.add(iris);

    }

    // Nose tip — warm skin tone, sits proud of face disc
    const noseTip = mk(new THREE.SphereGeometry(0.028, 8, 6), skin);
    noseTip.scale.set(1.1, 0.75, 0.80);
    noseTip.position.set(0, -0.012, 0.208);
    headG.add(noseTip);

    // Nose bridge
    const noseBridge = mk(new THREE.CylinderGeometry(0.011, 0.018, 0.068, 8), midFaceMat);
    noseBridge.position.set(0, 0.032, 0.197);
    headG.add(noseBridge);

    // Lips — upper and lower, rosy tone
    const upLip = mk(new THREE.BoxGeometry(0.072, 0.014, 0.012), lipMat);
    upLip.position.set(0, -0.062, 0.200);
    headG.add(upLip);
    const loLip = mk(new THREE.BoxGeometry(0.068, 0.013, 0.013), lipMat);
    loLip.position.set(0, -0.079, 0.199);
    headG.add(loLip);

    // Ears
    for (const xs of [-1, 1]) {
      const ear = mk(new THREE.SphereGeometry(0.044, 8, 6), skin);
      ear.scale.set(0.44, 0.78, 0.55);
      ear.position.set(xs * 0.200, 0.020, -0.018);
      headG.add(ear);
    }

    // ── HAIR CAP ──
    const hairCap = mk(
      new THREE.SphereGeometry(0.202, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.45),
      hairMat
    );
    hairCap.position.y = 0.022;
    hairCap.rotation.x = -0.55; // swept back diagonally
    headG.add(hairCap);

    // ─────────────────────────────────────────────────
    // HAIR COLLISION SPHERES
    // Parent these to the actual body groups so they
    // automatically follow every tilt & rotation
    // ─────────────────────────────────────────────────
    const colliders = [];  // { obj: Object3D, r: radius, wp: Vector3 }
    const addCol = (parent, lx, ly, lz, r) => {
      const obj = new THREE.Object3D();
      obj.position.set(lx, ly, lz);
      parent.add(obj);
      colliders.push({ obj, r, wp: new THREE.Vector3() });
    };

    // Torso colliders — parented to chestG (follow chest tilt)
    addCol(chestG, 0, 0.52,  0,    0.37);  // upper chest / pecs
    addCol(chestG, 0, 0.305, 0,    0.34);  // mid ribcage
    addCol(chestG, 0, 0.095, 0,    0.28);  // belly/waist
    // Waist/spine collider — parented to spineG
    addCol(spineG, 0, 0.19,  0,    0.26);  // waist connector
    // Hip collider — parented to hipsG
    addCol(hipsG,  0, 0.06,  0,    0.29);  // hips block
    // Head collider — parented to headG (follows head tilt)
    addCol(headG,  0, 0,     0,    0.22);  // head sphere
    // Neck / shoulder collider
    addCol(chestG, 0, 0.715, 0,    0.12);  // neck

    // ─── HAIR STRANDS ────────────────────────────────
    // Shorter: NS=10 segments × SL=0.072 ≈ 0.72m drop  → tips at ~chest height
    const NS = 13, SL = 0.062;
    const strands = [];

    for (let si = 0; si < 80; si++) {
      const a = (si / 80) * Math.PI * 2;
      if (Math.cos(a) > 0.18) continue; // skip frontal strands

      const jt = () => (Math.random() - 0.5) * 0.025;
      const rx = Math.sin(a) * (0.130 + Math.random() * 0.055) + jt();
      const ry = 0.044 + Math.random() * 0.110;
      const rz = Math.cos(a) * 0.125 - 0.030 + jt();

      const pos = new Float32Array((NS + 1) * 3);
      const vel = Array.from({ length: NS + 1 }, () => new THREE.Vector3());
      const HWY = 2.36;
      for (let k = 0; k <= NS; k++) {
        pos[k * 3]     = rx;
        pos[k * 3 + 1] = HWY + ry - k * SL;
        pos[k * 3 + 2] = rz;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const shade = 0.10 + Math.random() * 0.06;
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(shade, shade * 0.45, shade * 0.08) })
      );
      scene.add(line);
      strands.push({ root: new THREE.Vector3(rx, ry, rz), pos, vel, line });
    }

    // ─── ARMS ────────────────────────────────────────
    const makeArm = (side) => {
      const sg = new THREE.Group();
      sg.position.set(side * 0.390, 0.54, 0);
      chestG.add(sg);
      sg.add(mk(new THREE.SphereGeometry(0.095, 12, 10), jointM));

      const uaG = new THREE.Group();
      uaG.rotation.z = side * 0.30;
      sg.add(uaG);
      const ua = mk(new THREE.CylinderGeometry(0.073, 0.062, 0.41, 10), skin);
      ua.position.y = -0.205; uaG.add(ua);

      const eG = new THREE.Group();
      eG.position.y = -0.41;
      eG.rotation.z = side * 0.22;
      uaG.add(eG);
      eG.add(mk(new THREE.SphereGeometry(0.065, 10, 8), jointM));
      const la = mk(new THREE.CylinderGeometry(0.056, 0.047, 0.35, 10), skin);
      la.position.y = -0.175; eG.add(la);
      // ── HAND ──
      const handG = new THREE.Group();
      handG.position.y = -0.35;
      eG.add(handG);

      // Palm — flattened box
      const palm = mk(new THREE.BoxGeometry(0.075, 0.082, 0.028), skin);
      palm.position.y = -0.038;
      handG.add(palm);

      // Fingers — 4 fingers + thumb
      const fingerDefs = [
        { x: -0.028, len: [0.030, 0.022, 0.018], spread: 0.0 },  // index
        { x: -0.009, len: [0.034, 0.024, 0.020], spread: 0.0 },  // middle
        { x:  0.009, len: [0.032, 0.022, 0.018], spread: 0.0 },  // ring
        { x:  0.028, len: [0.024, 0.018, 0.014], spread: 0.0 },  // pinky
      ];
      fingerDefs.forEach(({ x, len }) => {
        let fg = new THREE.Group();
        fg.position.set(x, -0.082, 0);
        handG.add(fg);
        let offset = 0;
        len.forEach((l, i) => {
          // joint sphere
          const jt = mk(new THREE.SphereGeometry(l * 0.52, 6, 5), skin);
          jt.position.y = offset;
          fg.add(jt);
          // segment cylinder
          const seg = mk(new THREE.CylinderGeometry(l * 0.38, l * 0.42, l, 6), skin);
          seg.position.y = offset - l / 2;
          fg.add(seg);
          offset -= l;
        });
      });

      // Thumb — angled outward
      const thumbG = new THREE.Group();
      thumbG.position.set(side * 0.040, -0.022, 0);
      thumbG.rotation.z = side * 0.55;
      handG.add(thumbG);
      [[0.028, 0.38], [0.022, 0.34]].forEach(([l, r], i) => {
        const jt = mk(new THREE.SphereGeometry(l * 0.55, 6, 5), skin);
        jt.position.y = -i * 0.028;
        thumbG.add(jt);
        const seg = mk(new THREE.CylinderGeometry(r * l, r * l, l, 6), skin);
        seg.position.y = -i * 0.028 - l / 2;
        thumbG.add(seg);
      });

      return { uaG, sg, eG };
    };
    const LA = makeArm(-1), RA = makeArm(1);

    // Arm colliders — parented to arm groups so they follow animation
    addCol(LA.sg,  0, -0.20, 0, 0.10);  // L upper arm
    addCol(LA.eG,  0, -0.17, 0, 0.08);  // L forearm
    addCol(LA.eG,  0, -0.35, 0, 0.07);  // L hand
    addCol(RA.sg,  0, -0.20, 0, 0.10);  // R upper arm
    addCol(RA.eG,  0, -0.17, 0, 0.08);  // R forearm
    addCol(RA.eG,  0, -0.35, 0, 0.07);  // R hand

    // ─── LEGS ─────────────────────────────────────────
    const makeLeg = (side) => {
      const hj = new THREE.Group();
      hj.position.set(side * 0.148, -0.14, 0);
      hipsG.add(hj);
      const ul = mk(new THREE.CylinderGeometry(0.107, 0.092, 0.46, 10), cloth);
      ul.position.y = -0.23; hj.add(ul);

      const kg = new THREE.Group();
      kg.position.y = -0.46; hj.add(kg);
      kg.add(mk(new THREE.SphereGeometry(0.087, 10, 10), jointM));
      const ll = mk(new THREE.CylinderGeometry(0.081, 0.066, 0.43, 10), cloth);
      ll.position.y = -0.215; kg.add(ll);

      const ag = new THREE.Group();
      ag.position.y = -0.43; kg.add(ag);
      ag.add(mk(new THREE.SphereGeometry(0.063, 8, 8), jointM));
      const foot = mk(new THREE.BoxGeometry(0.142, 0.085, 0.27), shoe);
      foot.position.set(0, -0.042, 0.065); ag.add(foot);

      return { hj, kg, ag };
    };
    const LL = makeLeg(-1), RL = makeLeg(1);

    // ─── ANIMATION ───────────────────────────────────
    let t = 0, bodyA = 0, headA = 0, animId;
    // FIX: tilt uses FIXED amplitude, only phase angle advances with speed
    // frozenTiltXRef.current/Z never touched when speed=0, so tilt is truly preserved
    // Flex 0→1 controls MAX_TILT and how far down the chain the wave travels
    const MAX_TILT_BASE = 0.8415;
    // frozenTilt now lives in refs — survives re-renders

    const hq = new THREE.Quaternion();
    const rw = new THREE.Vector3();

    const tick = (now = performance.now()) => {
      animId = requestAnimationFrame(tick);
      const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.016);
      lastTimeRef.current = now;
      // Smoothly lerp sm toward target — ~0.4s transition
      smSmoothedRef.current += (speedMultRef.current - smSmoothedRef.current) * 0.025;
      const sm = smSmoothedRef.current;
      const dt = rawDt * sm;
      t += dt;

      // Camera — full spherical orbit with zoom
      const ca = camAngleRef.current;
      const cp = camPitchRef.current;
      const CR = camZoomRef.current;
      const camX = Math.sin(ca) * Math.cos(cp) * CR;
      const camY = Math.sin(cp) * CR;
      const camZ = Math.cos(ca) * Math.cos(cp) * CR;
      camera.position.set(camX, camY, camZ);
      camera.position.set(camX + figPosRef.current.x, camY, camZ + figPosRef.current.z);
      camera.lookAt(figPosRef.current.x, 1.55, figPosRef.current.z);

      // Body rotation: value = rotations per 3 sec → rad/frame = v * 2π/180

      // Smooth reverse transition
      if (reversingRef.current) {
        const lerpSpeed = 0.12; // ~0.5s transition
        bodySpeedRef.current += (targetBSRef.current - bodySpeedRef.current) * lerpSpeed;
        headSpeedRef.current += (targetHSRef.current - headSpeedRef.current) * lerpSpeed;
        // Snap when close enough
        if (Math.abs(bodySpeedRef.current - targetBSRef.current) < 0.005 &&
            Math.abs(headSpeedRef.current - targetHSRef.current) < 0.005) {
          bodySpeedRef.current = targetBSRef.current;
          headSpeedRef.current = targetHSRef.current;
          setBodySpeed(targetBSRef.current);
          setHeadSpeed(targetHSRef.current);
          reversingRef.current = false;
        }
      }
      bodyA -= bodySpeedRef.current * sm * (2 * Math.PI / 180);
      fig.rotation.y = bodyA;

      // ── MOVEMENT ──
      const SPEED = 0.025;
      const keys = moveEnabledRef.current ? keysRef.current : {};
      const fp = figPosRef.current;
      if (keys['ArrowUp']    || keys['w'] || keys['W']) { fp.x += Math.sin(bodyA) * SPEED; fp.z += Math.cos(bodyA) * SPEED; }
      if (keys['ArrowDown']  || keys['s'] || keys['S']) { fp.x -= Math.sin(bodyA) * SPEED; fp.z -= Math.cos(bodyA) * SPEED; }
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) { fp.x += Math.cos(bodyA) * SPEED; fp.z -= Math.sin(bodyA) * SPEED; }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) { fp.x -= Math.cos(bodyA) * SPEED; fp.z += Math.sin(bodyA) * SPEED; }
      fig.position.set(fp.x, 0, fp.z);

      // ── CABEÇA — fixed-amplitude tilt, freezes when stopped ──
      // value = circles per 3 sec → rad/frame = v * 2π/180
      const hs = headSpeedRef.current;
      const fl = Math.pow(flexRef.current, 0.55);  // non-linear: faster to high values
      // MAX_TILT grows with flexibility
      const MAX_TILT = MAX_TILT_BASE * fl;
      // Compute TARGET tilt based on current phase and mode
      let targetTiltX = 0, targetTiltZ = 0;
      if (Math.abs(hs) > 0.02) {
        headA = headARef.current;
        headA -= hs * sm * (2 * Math.PI / 180);
        headARef.current = headA;
      }

      const mode = tiltModeRef.current;
      const ha = headARef.current;
      const base = baseTiltRef.current;
      const hasBase = base.x !== 0 || base.z !== 0;

      if (Math.abs(hs) > 0.02) {
        if (mode === 'circular') {
          targetTiltX = Math.sin(ha) * MAX_TILT;
          targetTiltZ = Math.cos(ha) * MAX_TILT;
        } else if (mode === 'fwd-back') {
          targetTiltX = Math.sin(ha) * MAX_TILT;
          targetTiltZ = 0;
        } else {
          targetTiltX = 0;
          targetTiltZ = Math.sin(ha) * MAX_TILT;
        }
      } else if (hasBase) {
        // Fixed tilt override — bypasses MAX_TILT so it's always visible
        targetTiltX = base.x;
        targetTiltZ = base.z;
      } else {
        // Speed=0, no base — hold wherever the tilt currently is (don't snap to straight)
        targetTiltX = frozenTiltXRef.current;
        targetTiltZ = frozenTiltZRef.current;
      }
      // Smooth lerp — 0.06 per frame ≈ ~1s to fully settle
      const lerpF = 0.06;
      if (snapTiltRef.current) {
        frozenTiltXRef.current = targetTiltX;
        frozenTiltZRef.current = targetTiltZ;
        snapTiltRef.current = false;
      } else {
        frozenTiltXRef.current += (targetTiltX - frozenTiltXRef.current) * lerpF;
        frozenTiltZRef.current += (targetTiltZ - frozenTiltZRef.current) * lerpF;
      }
      // Snap tiny values to zero to avoid float drift
      if (Math.abs(frozenTiltXRef.current) < 0.0005) frozenTiltXRef.current = 0;
      if (Math.abs(frozenTiltZRef.current) < 0.0005) frozenTiltZRef.current = 0;
      // Gradual chain unlock by flexibility:
      //   fl 0.00–0.25 → head only
      //   fl 0.25–0.55 → head + upper chest bleeds in
      //   fl 0.55–0.80 → + lower chest / spine
      //   fl 0.80–1.00 → + hips join in
      const chestW  = Math.max(0, Math.min(1, (fl - 0.25) / 0.30));  // 0→1 over 0.25–0.55
      const spineW  = Math.max(0, Math.min(1, (fl - 0.55) / 0.25));  // 0→1 over 0.55–0.80
      const hipW    = Math.max(0, Math.min(1, (fl - 0.80) / 0.20));  // 0→1 over 0.80–1.00
      // Always write stored values — NEVER reset to 0
      headG.rotation.x  = frozenTiltXRef.current;
      headG.rotation.z  = frozenTiltZRef.current;
      chestG.rotation.x = frozenTiltXRef.current * 0.4968 * chestW;
      chestG.rotation.z = frozenTiltZRef.current * 0.4968 * chestW;
      spineG.rotation.x = frozenTiltXRef.current * 0.2448 * spineW;
      spineG.rotation.z = frozenTiltZRef.current * 0.2448 * spineW;
      hipsG.rotation.x  = frozenTiltXRef.current * 0.1377 * hipW;



      // ── TORSION — chest rotates ±45° (1/8 circle) on Y, hips fixed ──
      {
        const active = torsionRef.current;
        torsionAmpRef.current += ((active ? 1 : 0) - torsionAmpRef.current) * (active ? 0.03 : 0.09);
        if (torsionAmpRef.current > 0.005) {
          const ta = torsionAmpRef.current;
          torsionPhaseRef.current += 2 * Math.PI / 180; // same rate as left/right tilt at speed 1
          const twist = Math.sin(torsionPhaseRef.current); // -1 to +1
          const MAX = Math.PI / 4; // 45° = 1/8 full circle
          chestG.rotation.y = twist * MAX * 0.72 * ta;  // chest leads
          spineG.rotation.y = twist * MAX * 0.28 * ta;  // spine follows partially
          headG.rotation.y  = -twist * MAX * 0.10 * ta;  // head stays roughly forward
        } else {
          chestG.rotation.y = 0;
          spineG.rotation.y = 0;
          headG.rotation.y  = 0;
        }
      }

      // ── BATE CABELO — inclination then torsion same side, alternating ──
      {
        const active = bateCabeloRef.current;
        bcAmpRef.current += ((active ? 1 : 0) - bcAmpRef.current) * (active ? 0.03 : 0.09);
        if (bcAmpRef.current > 0.005) {
          const ba = bcAmpRef.current;
          bcPhaseRef.current += 2 * Math.PI / 180; // same rate as L/R tilt
          const phase = bcPhaseRef.current;

          // Inclination: sine wave on Z (side tilt)
          const incline = Math.sin(phase);
          // Torsion follows inclination with a quarter-beat lag (π/2 behind)
          const torsion = Math.sin(phase - Math.PI / 2);

          const MAX_INC  = 0.55 * fl; // lateral inclination scaled by flex
          const MAX_TOR  = Math.PI / 4 * fl; // torsion scaled by flex

          // Apply inclination to body chain (same side as incline)
          headG.rotation.z  += incline * MAX_INC * ba;
          chestG.rotation.z += incline * MAX_INC * 0.65 * ba;
          spineG.rotation.z += incline * MAX_INC * 0.32 * ba;
          hipsG.rotation.z  += incline * MAX_INC * 0.10 * ba;

          // Apply torsion to same side — chest leads, spine follows, head lags more
          const headTorsion = Math.sin(phase - Math.PI * 0.75); // extra lag behind chest
          chestG.rotation.y -= torsion * MAX_TOR * 0.72 * ba;
          spineG.rotation.y -= torsion * MAX_TOR * 0.28 * ba;
          headG.rotation.y  -= headTorsion * MAX_TOR * 0.18 * ba;
        } else {
          bcPhaseRef.current = 0;
        }
      }

      // Steps / hip sway — scaled by speedMult; sm=0 freezes everything
      const sf = 1.85;  // t already slows via dt*sm — no need to scale sf
      const stepAmt = sm < 0.001 ? 0 : Math.min(1, Math.abs(bodySpeedRef.current) / 0.5);
      LL.hj.rotation.x =  Math.sin(t * sf) * 0.20 * stepAmt;
      RL.hj.rotation.x = -Math.sin(t * sf) * 0.20 * stepAmt;

      // Tilt-driven knee bend:
      const kneeFwd = Math.max(0,  frozenTiltXRef.current) * 0.42;
      const kneeL   = Math.max(0,  frozenTiltZRef.current) * 0.35;
      const kneeR   = Math.max(0, -frozenTiltZRef.current) * 0.35;
      LL.kg.rotation.x = -Math.max(0,  Math.sin(t * sf)) * 0.28 * stepAmt + kneeFwd + kneeL;
      RL.kg.rotation.x = -Math.max(0, -Math.sin(t * sf)) * 0.28 * stepAmt + kneeFwd + kneeR;
      LL.ag.rotation.x =  Math.max(0,  Math.sin(t * sf)) * 0.16 * stepAmt;
      RL.ag.rotation.x =  Math.max(0, -Math.sin(t * sf)) * 0.16 * stepAmt;
      hipsG.position.x  = Math.sin(t * sf) * 0.040 * stepAmt;
      hipsG.rotation.z  = frozenTiltZRef.current * 0.18 * hipW + Math.sin(t * sf) * 0.065 * stepAmt;
      LA.uaG.rotation.x =  Math.sin(t * sf) * 0.13 * stepAmt;
      RA.uaG.rotation.x = -Math.sin(t * sf) * 0.13 * stepAmt;

      // ── Update all collision sphere world positions ──
      // This is the key fix: they're parented to body groups so they
      // automatically follow every tilt — head tilt, chest tilt, body rotation
      for (const c of colliders) {
        c.obj.getWorldPosition(c.wp);
      }

      // ── HAIR PHYSICS ──
      headG.getWorldQuaternion(hq);

      for (const s of strands) {
        // Pin root: transform local root offset by head orientation
        rw.copy(s.root).applyQuaternion(hq);
        // Add head world position (colliders[5] is the head sphere)
        const headWP = colliders[5].wp;
        s.pos[0] = headWP.x + rw.x;
        s.pos[1] = headWP.y + rw.y;
        s.pos[2] = headWP.z + rw.z;
        s.vel[0].set(0, 0, 0);

        // Run 3 constraint iterations for stability
        for (let iter = 0; iter < 3; iter++) {
          for (let j = 1; j <= NS; j++) {
            const i  = j * 3;
            const pi = (j - 1) * 3;
            const v  = s.vel[j];

            if (iter === 0) {
              // Physics only on first pass — scaled by sm for true slow motion
              v.y -= 0.0038 * sm;
              v.multiplyScalar(1 - (1 - 0.875) * sm);  // damping scales with sm
              s.pos[i]     += v.x * sm;
              s.pos[i + 1] += v.y * sm;
              s.pos[i + 2] += v.z * sm;
            }

            // Distance constraint (all iterations)
            const dx = s.pos[i]     - s.pos[pi];
            const dy = s.pos[i + 1] - s.pos[pi + 1];
            const dz = s.pos[i + 2] - s.pos[pi + 2];
            const d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d > 0.0001) {
              const ov = (d - SL) / d * 0.50;
              s.pos[i]     -= dx * ov;
              s.pos[i + 1] -= dy * ov;
              s.pos[i + 2] -= dz * ov;
              if (iter === 0) {
                v.x -= dx * ov * 0.25;
                v.y -= dy * ov * 0.25;
                v.z -= dz * ov * 0.25;
              }
            }

            // ── Sphere colliders — all follow body tilt ──
            for (const c of colliders) {
              const cx = s.pos[i]     - c.wp.x;
              const cy = s.pos[i + 1] - c.wp.y;
              const cz = s.pos[i + 2] - c.wp.z;
              const cd = Math.sqrt(cx * cx + cy * cy + cz * cz);
              if (cd < c.r && cd > 0.0001) {
                const push = c.r / cd;
                const ox = s.pos[i],     oz = s.pos[i + 2];
                s.pos[i]     = c.wp.x + cx * push;
                s.pos[i + 1] = c.wp.y + cy * push;
                s.pos[i + 2] = c.wp.z + cz * push;
                if (iter === 0) {
                  // Kill inward velocity
                  const nx = (s.pos[i] - ox),   nz = (s.pos[i + 2] - oz);
                  const nl = Math.sqrt(nx*nx + nz*nz);
                  if (nl > 0.0001) {
                    const nnx = nx/nl, nnz = nz/nl;
                    const dot = v.x * nnx + v.z * nnz;
                    if (dot < 0) { v.x -= dot * nnx; v.z -= dot * nnz; }
                  }
                }
              }
            }

            // Floor
            if (s.pos[i + 1] < 0.02) {
              s.pos[i + 1] = 0.02;
              if (iter === 0) v.y = Math.abs(v.y) * 0.10;
            }
          }
        }
        s.line.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    tick();

    // ─── EVENTS ──────────────────────────────────────
    const onMD = (e) => { isDragging.current = true; lastMouseX.current = e.clientX; lastMouseY.current = e.clientY; };
    const onMM = (e) => {
      if (!isDragging.current) return;
      camAngleRef.current -= (e.clientX - lastMouseX.current) * 0.012;
      camPitchRef.current  = Math.max(-0.25, Math.min(1.35, camPitchRef.current + (e.clientY - lastMouseY.current) * 0.010));
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };
    const onMU = () => { isDragging.current = false; };
    const lastPinchRef = { dist: null };
    const onTD = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging.current = true;
        lastMouseX.current = e.touches[0].clientX;
        lastMouseY.current = e.touches[0].clientY;
        lastPinchRef.dist = null;
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchRef.dist = Math.sqrt(dx*dx + dy*dy);
      }
    };
    const onTM = (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (lastPinchRef.dist !== null) {
          camZoomRef.current = Math.max(1.5, Math.min(12, camZoomRef.current - (dist - lastPinchRef.dist) * 0.022));
        }
        lastPinchRef.dist = dist;
        return;
      }
      if (!isDragging.current) return;
      camAngleRef.current -= (e.touches[0].clientX - lastMouseX.current) * 0.012;
      camPitchRef.current  = Math.max(-0.25, Math.min(1.35, camPitchRef.current + (e.touches[0].clientY - lastMouseY.current) * 0.010));
      lastMouseX.current = e.touches[0].clientX;
      lastMouseY.current = e.touches[0].clientY;
    };
    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2);
      setVh(window.innerHeight);
    };

    const onWheel = (e) => {
      e.preventDefault();
      camZoomRef.current = Math.max(1.5, Math.min(12, camZoomRef.current + e.deltaY * 0.005));
    };
    const onKD = (e) => { keysRef.current[e.key] = true; };
    const onKU = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    el.addEventListener('mousedown', onMD);
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
    el.addEventListener('touchstart', onTD, { passive: false });
    el.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend', onMU);
    window.addEventListener('resize', onResize);
    const onVisible = () => { if (!document.hidden) lastTimeRef.current = performance.now(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onMD);
      el.removeEventListener('touchstart', onTD);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
      el.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', onMU);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      strands.forEach(s => {
        scene.remove(s.line);
        s.line.geometry.dispose();
        s.line.material.dispose();
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // ─── UI ──────────────────────────────────────────
  const trackStyle = { flex: 1, cursor: 'pointer', height: 6, borderRadius: 3 };

  return (
    <>
    <div className="zt-root" style={{
      background: '#4a3f35', height: vh, display: 'flex', flexDirection: 'column',
      fontFamily: "'Helvetica Neue', Arial, sans-serif", color: '#e8d4b0',
      overflow: 'hidden', userSelect: 'none'
    }}>

      {/* HEADER */}
      <div className="zt-header" style={{
        padding: '5px 12px', background: '#3a3028',
        borderBottom: '1px solid #5a4a38',
        display: 'flex', alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'space-between',
        flexWrap: 'nowrap', overflow: 'hidden', minHeight: 0,
        boxShadow: '0 1px 8px #00000060'
      }}>
        {/* Title — always shown */}
        <div className="zt-header-title" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, flex: isMobile ? 1 : 'none', position: 'relative', justifyContent: 'center' }}>
          <span className="zt-title" style={{ fontSize: 15, fontWeight: 900, letterSpacing: 2, color: '#ffcc55' }}>Zouk 3D Trainer</span>
          {isMobile && <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 4 }}>
            <a className="zt-btn-manual" href="/manual.html" title="User Manual"
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>?</a>
            <button
              className="zt-btn-about"
              title="About"
              onClick={() => setShowAbout(v => !v)}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0 }}>ℹ</button>
          </div>}
        </div>

        {/* Live params + hint — hidden on mobile */}
        {!isMobile && <>
          <div className="zt-header-params" style={{
            display: 'flex', gap: 5, alignItems: 'center',
            flexWrap: 'nowrap', overflow: 'hidden',
            flex: 1, margin: '0 10px', minWidth: 0
          }}>
            {[
              { label: 'BODY', value: Math.abs(bodySpeed) < 0.05 ? '—' : `${bodySpeed > 0 ? '▶' : '◀'}${Math.abs(bodySpeed).toFixed(1)}`, active: Math.abs(bodySpeed) >= 0.05, color: '#5577ff' },
              { label: 'HEAD', value: Math.abs(headSpeed) < 0.05 ? '—' : `${headSpeed > 0 ? '↻' : '↺'}${Math.abs(headSpeed).toFixed(1)}`, active: Math.abs(headSpeed) >= 0.05, color: '#ff5588' },
              { label: 'FLEX', value: `${Math.round(flex * 100)}%`, active: flex > 0.05, color: '#cc9944' },
            ].map(({ label, value, active, color }) => (
              <div key={label} className={`zt-param-pill zt-param-${label.toLowerCase()}`} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                background: active ? '#4e4238' : '#3a3028',
                border: `1px solid ${active ? color + '66' : '#5a4a38'}`,
                borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap'
              }}>
                <span className="zt-stat-label" style={{ fontSize: 6, fontWeight: 700, color: color, letterSpacing: 2 }}>{label}</span>
                <span className="zt-stat-value" style={{ fontSize: 9, fontWeight: 700, color: active ? color : '#665533' }}>{value}</span>
              </div>
            ))}
          </div>
          <a className="zt-btn-manual" href="/manual.html" title="User Manual"
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>?</a>
          <button
            className="zt-btn-about"
            title="About"
            onClick={() => setShowAbout(v => !v)}
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0 }}>ℹ</button>
        </>}
      </div>

      {/* 3D VIEWPORT */}
      {/* PRESET BAR */}
      <div className="zt-preset-bar" style={{
        background: '#2e2620', borderBottom: '1px solid #5a4a38',
        padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <span className="zt-label-move" style={{ fontSize: 7, fontWeight: 700, color: '#8a7050', letterSpacing: 2, whiteSpace: 'nowrap' }}>MOVE:</span>
        <div style={{ flex: 1, maxWidth: 220, position: 'relative' }}>
          <select className="zt-preset-select" title="Select a dance move"
            value={activePreset || ''}
            onChange={e => {
              const p = PRESETS.find(x => x.name === e.target.value);
              if (p) applyPreset(p);
              else { setBS(0); setHS(0); setActivePreset(null); }
            }}
            style={{
              width: '100%',
              background: '#3e3228', border: '1px solid #6a5438',
              color: '#ccaa66',
              borderRadius: 6, padding: '0 36px 0 8px', fontSize: 10, fontWeight: 700, height: 30,
              cursor: 'pointer', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            <option value="">— Select a move —</option>
            {PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          {/* Custom arrow */}
          <span className="zt-select-arrow" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#ccaa66', fontSize: 10 }}>▼</span>
        </div>

        {/* Reverse button */}
        <button className="zt-btn-reverse" title="Reverse direction"
          onClick={() => {
            targetBSRef.current = -bodySpeedRef.current;
            targetHSRef.current = -headSpeedRef.current;
            reversingRef.current = true;
          }}
          style={{
            width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: 700, flexShrink: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
            background: '#3e3228', border: '1px solid #6a5438', color: '#ffaa55',
          }}
        >⇄</button>

        {/* Stop all */}
        <button className="zt-btn-reset-all" title="Reset everything to straight neutral" onClick={() => {
          doReset(); setActivePreset(null);
        }} style={{
            width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: 700, flexShrink: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
            background: '#1a2a1a', border: '1px solid #3a6a3a', color: '#66aa66',
        }}>↺</button>

        {/* Stop all */}
        {(() => {
          const isStopped = Math.abs(bodySpeed) < 0.01 && Math.abs(headSpeed) < 0.01 && !activePreset;
          return (
            <button className="zt-btn-stop-all" title="Stop all movement"
              disabled={isStopped}
              onClick={() => { setBS(0); setHS(0); setActivePreset(null); bateCabeloRef.current = false; torsionRef.current = false; }}
              style={{
                width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: 700, flexShrink: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
                background: isStopped ? '#2a2a2a' : '#8b1a1a',
                border: `1px solid ${isStopped ? '#444' : '#cc2222'}`,
                color: isStopped ? '#555' : '#ff4444',
                cursor: isStopped ? 'default' : 'pointer',
                opacity: isStopped ? 0.5 : 1,
              }}><span style={{ display: 'block', width: 10, height: 10, background: isStopped ? '#555' : '#ff3333', borderRadius: 2 }} /></button>
          );
        })()}
      </div>
      <div className="zt-viewport" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div className="zt-canvas" ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'block', cursor: 'grab' }} />
        {/* SPEED TOGGLE BUTTON — upper left corner */}
        <button
          className="zt-btn-speed-toggle"
          title="Toggle speed slider"
          {...tap(() => setShowSpeedSlider(v => !v))}
          style={{
            position: 'absolute', top: 8, left: 8,
            padding: '3px 8px', height: 26, borderRadius: 5,
            fontSize: 9, fontWeight: 700, letterSpacing: 1,
            background: showSpeedSlider ? '#c87830' : '#3e3228cc',
            border: `1px solid ${showSpeedSlider ? '#ffaa66' : '#6a5438'}`,
            color: showSpeedSlider ? '#1a1008' : '#cc8844',
            cursor: 'pointer', pointerEvents: 'all', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap',
          }}>⚡ SPEED</button>

        {/* SPEED SLIDER PANEL — vertical, left edge */}
        {showSpeedSlider && (
          <div className="zt-speed-slider-panel" style={{
            position: 'absolute', top: 42, left: 4,
            width: 38, height: '65%',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 6, paddingBottom: 6, gap: 4,
            pointerEvents: 'none',
          }}>
            <span className="zt-speed-label-fast" style={{ fontSize: 7, fontWeight: 700, color: '#cc9944', letterSpacing: 1 }}>150%</span>
            <div className="zt-speed-slider-track" style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
              <input
                className="zt-slider zt-slider-speed"
                type="range" min="0" max="1.5" step="0.01"
                value={speedMult}
                onChange={e => { let v = parseFloat(e.target.value); if (Math.abs(v - 1.0) <= 0.06) v = 1.0; speedMultRef.current = v; setSpeedMult(v); }}
                style={{
                  writingMode: 'vertical-lr', direction: 'rtl',
                  WebkitAppearance: 'slider-vertical', appearance: 'slider-vertical',
                  width: 6, height: '100%',
                  cursor: 'pointer', accentColor: '#cc9944', pointerEvents: 'all',
                }}
              />
              {/* 100% tick mark — at 33.3% from top (1.0 out of 1.5) */}
              <div className="zt-speed-tick-100" style={{
                position: 'absolute',
                top: '33.3%',
                left: '50%', transform: 'translate(-50%, -50%)',
                display: 'flex', alignItems: 'center', gap: 2,
                pointerEvents: 'none',
              }}>
                <div style={{ width: 10, height: 1.5, background: Math.abs(speedMult - 1.0) < 0.06 ? '#ffcc55' : '#8b6020', borderRadius: 1 }} />
                <span style={{ fontSize: 6, fontWeight: 700, color: Math.abs(speedMult - 1.0) < 0.06 ? '#ffcc55' : '#7a5018', letterSpacing: 0.5 }}>100</span>
              </div>
            </div>
            <span className="zt-speed-value" style={{ fontSize: 8, fontWeight: 700, color: '#ffcc77' }}>{Math.round(speedMult * 100)}%</span>
            <span className="zt-speed-label-slow" style={{ fontSize: 7, fontWeight: 700, color: '#cc9944', letterSpacing: 1 }}>0%</span>
          </div>
        )}

        {/* MOVEMENT TOGGLE + D-PAD — bottom left of viewport */}
        <div className="zt-dpad-container" style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
          {/* Toggle button */}
          <button className="zt-btn-move-toggle" title="Toggle movement controls" onClick={() => { const v = !moveEnabled; setMoveEnabled(v); moveEnabledRef.current = v; }} style={{
            padding: '3px 8px', fontSize: 9, fontWeight: 700, letterSpacing: 1,
            background: moveEnabled ? '#c87830' : '#3e3228cc',
            border: `1px solid ${moveEnabled ? '#ffaa66' : '#6a5438'}`,
            color: moveEnabled ? '#1a1008' : '#cc8844',
            borderRadius: 4, cursor: 'pointer', pointerEvents: 'all',
          }}>MOVE {moveEnabled ? 'ON' : 'OFF'}</button>

          {/* D-pad — only visible when enabled */}
          {moveEnabled && <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 34px)', gridTemplateRows: 'repeat(3, 34px)',
            gap: 3, pointerEvents: 'none',
          }}>
            {[
              [null, { key: 'ArrowUp', label: '▲' }, null],
              [{ key: 'ArrowLeft', label: '◀' }, null, { key: 'ArrowRight', label: '▶' }],
              [null, { key: 'ArrowDown', label: '▼' }, null],
            ].flat().map((d, i) => d ? (
              <button key={d.key} className="zt-btn-dpad" title={d.title}
                onPointerDown={() => { keysRef.current[d.key] = true; }}
                onPointerUp={() => { keysRef.current[d.key] = false; }}
                onPointerLeave={() => { keysRef.current[d.key] = false; }}
                style={{
                  width: 34, height: 34, fontSize: 14, fontWeight: 700,
                  background: '#3e3228cc', border: '1px solid #6a5438',
                  color: '#cc8844', borderRadius: 6, cursor: 'pointer',
                  pointerEvents: 'all', userSelect: 'none',
                }}>{d.label}</button>
            ) : <div key={i} />)}
          </div>}
        </div>

        {/* RIGHT OVERLAY — tilt mode buttons vertical */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 36,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, background: 'linear-gradient(to left, #2a1a0ecc, transparent)',
          pointerEvents: 'none',
        }}>
          {[
            { key: 'circular',   label: '⟳', title: 'Circular' },
            { key: 'fwd-back',   label: '↕', title: 'Fwd/Back' },
            { key: 'left-right', label: '↔', title: 'L/Right' },
          ].map(({ key, label, title }) => (
            <button key={key} className={`zt-btn-tiltmode zt-btn-tiltmode-${key}`} {...tap(() => setTM(key))} title={title} style={{
              width: 28, height: 28, fontSize: 14, fontWeight: 700,
              background: tiltMode === key ? '#c87830' : '#3e3228bb',
              border: `1px solid ${tiltMode === key ? '#ffaa66' : '#6a5438'}`,
              color: tiltMode === key ? '#1a1008' : '#cc8844',
              borderRadius: 5, cursor: 'pointer', padding: 0, pointerEvents: 'all',
            }}>{label}</button>
          ))}

          {/* Bate Cabelo — hidden */}
          {false && (() => {
            const active = activePreset === 'Bate Cabelo';
            return (
              <button className="zt-btn-bate-cabelo" title="Bate Cabelo" onClick={() => {
                if (active) { doReset(); setActivePreset(null); }
                else applyPreset({ name: 'Bate Cabelo', rotation: 0, tilt: 0, bateCabelo: true });
              }} style={{
                width: 28, height: 28, fontSize: 14, fontWeight: 700,
                background: active ? '#c87830' : '#3e3228bb',
                border: `1px solid ${active ? '#ffaa66' : '#6a5438'}`,
                color: active ? '#1a1008' : '#cc8844',
                borderRadius: 5, cursor: 'pointer', padding: 0, pointerEvents: 'all',
              }}>∞</button>
            );
          })()}

          {/* Torsion — hidden */}
          {false && (() => {
            const active = activePreset === 'Torsion';
            return (
              <button className="zt-btn-torsion" title="Torsion" onClick={() => {
                if (active) { doReset(); setActivePreset(null); }
                else applyPreset({ name: 'Torsion', rotation: 0, tilt: 0, torsion: true });
              }} style={{
                width: 28, height: 28, fontSize: 14, fontWeight: 700,
                background: active ? '#c87830' : '#3e3228bb',
                border: `1px solid ${active ? '#ffaa66' : '#6a5438'}`,
                color: active ? '#1a1008' : '#cc8844',
                borderRadius: 5, cursor: 'pointer', padding: 0, pointerEvents: 'all',
              }}>≋</button>
            );
          })()}

        </div>
      </div>

      {/* CONTROLS */}
      <div className="zt-controls" style={{ background: '#3a3028', borderTop: '1px solid #5a4a38', padding: '8px 20px 10px' }}>
        <div className="zt-controls-grid-wrapper" style={{ position: 'relative' }}>
          {!isMobile && <div className="zt-controls-separator" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#5a4a38', transform: 'translateX(-50%)' }} />}
          <div className="zt-controls-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 20 }}>

          {/* Body Rotation */}
          <div className="zt-body-rotation" style={{ paddingRight: isMobile ? 0 : 0 }}>            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span className="zt-label-body" style={{ fontSize: 8, fontWeight: 700, color: '#ffcc55', letterSpacing: 2 }}>BODY ROTATION</span>
              <span className="zt-speed-indicator-body" style={{ fontSize: 10, color: '#ffd97a', fontWeight: 700 }}>
                  {Math.abs(bodySpeed) < 0.05 ? '■' : bodySpeed > 0 ? `▶ ${bodySpeed.toFixed(1)}` : `◀ ${Math.abs(bodySpeed).toFixed(1)}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              {[-3,-2,-1,0,1,2,3].map(n => (
                <button key={n} className="zt-btn-speed zt-btn-speed-body" title={`Body rotation speed ${n}`} {...tap(() => setBS(n))} style={{ width: 32, height: 26, background: Math.round(bodySpeed) === n && Math.abs(bodySpeed - n) < 0.15 ? '#cc9933' : '#4e4238', border: `1px solid ${Math.round(bodySpeed) === n && Math.abs(bodySpeed - n) < 0.15 ? '#ffcc55' : '#6a5438'}`, color: Math.round(bodySpeed) === n && Math.abs(bodySpeed - n) < 0.15 ? '#1a1410' : '#cc9944', borderRadius: 3, cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 0, fontFamily: 'monospace' }}>{n}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="zt-label-left" style={{ fontSize: 11, color: '#8a7050', fontWeight: 700 }}>◄L</span>
              <input className="zt-slider zt-slider-body" title="Body rotation speed" type="range" min="-3" max="3" step="0.1" value={bodySpeed} onChange={e => setBS(parseFloat(e.target.value))} style={{ ...trackStyle, accentColor: '#ffcc55' }} />
              <span className="zt-label-right" style={{ fontSize: 11, color: '#8a7050', fontWeight: 700 }}>R►</span>
            </div>
          </div>

          {/* Head Tilt */}
          <div className="zt-head-tilt" style={{ paddingLeft: isMobile ? 0 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span className="zt-label-head" style={{ fontSize: 8, fontWeight: 700, color: '#ffaa66', letterSpacing: 2 }}>HEAD MOVEMENT SPEED</span>
              <span className="zt-speed-indicator-head" style={{ fontSize: 10, color: '#ffbb77', fontWeight: 700 }}>
                  {Math.abs(headSpeed) < 0.05 ? '■' : headSpeed > 0 ? `↻ ${headSpeed.toFixed(1)}` : `↺ ${Math.abs(headSpeed).toFixed(1)}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              {[-3,-2,-1,0,1,2,3].map(n => (
                <button key={n} className="zt-btn-speed zt-btn-speed-head" title={`Head movement speed ${n}`} {...tap(() => setHS(n))} style={{ width: 32, height: 26, background: Math.round(headSpeed) === n && Math.abs(headSpeed - n) < 0.15 ? '#c87830' : '#4e4238', border: `1px solid ${Math.round(headSpeed) === n && Math.abs(headSpeed - n) < 0.15 ? '#ffaa66' : '#6a5438'}`, color: Math.round(headSpeed) === n && Math.abs(headSpeed - n) < 0.15 ? '#1a1410' : '#cc8844', borderRadius: 3, cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 0, fontFamily: 'monospace' }}>{n}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="zt-label-ccw" style={{ fontSize: 11, color: '#8a7050', fontWeight: 700, paddingRight: 4 }}>↺ CCW</span>
              <input className="zt-slider zt-slider-head" title="Head movement speed" type="range" min="-3" max="3" step="0.1" value={headSpeed} onChange={e => setHS(parseFloat(e.target.value))} style={{ ...trackStyle, accentColor: '#ffaa66' }} />
              <span className="zt-label-cw" style={{ fontSize: 11, color: '#8a7050', fontWeight: 700, paddingLeft: 4 }}>CW ↻</span>
            </div>
          </div>

        </div>
        </div>

        {/* FLEXIBILITY */}
        <div className="zt-flex-row" style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid #5a4a38', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="zt-label-stiff" style={{ fontSize: 8, fontWeight: 700, color: '#c8a06a', letterSpacing: 1, whiteSpace: 'nowrap', minWidth: 28 }}>STIFF</span>
          <div style={{ flex: 1, position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'linear-gradient(to right, #d4b896, #a07030)' }} />
            <input className="zt-slider zt-slider-flex" title="Flexibility" type="range" min="0" max="1" step="0.01" value={flex} onChange={e => setFL(parseFloat(e.target.value))} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
            <div style={{ position: 'absolute', left: `calc(${flex * 100}% - 7px)`, width: 14, height: 14, background: '#c8a06a', borderRadius: '50%', border: '2px solid #fff', pointerEvents: 'none', boxShadow: '0 1px 4px #0005' }} />
          </div>
          <span className="zt-label-flexible" style={{ fontSize: 8, fontWeight: 700, color: '#c8a06a', letterSpacing: 1, whiteSpace: 'nowrap', minWidth: 46 }}>FLEXIBLE</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#ffcc77', minWidth: 32, textAlign: 'right' }}>{Math.round(flex * 100)}%</span>
        </div>
      </div>
    </div>

      {/* ABOUT MODAL */}
      {showAbout && (
        <div onClick={() => setShowAbout(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'all', isolation: 'isolate'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#2a2018', border: '1px solid #6a5438',
            borderRadius: 12, padding: '28px 32px', minWidth: 260, maxWidth: '90vw',
            boxShadow: '0 8px 40px rgba(0,0,0,0.8)', textAlign: 'center', touchAction: 'none'
          }}>
            <div style={{ color: '#ffcc77', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Avi Moraly</div>
            <div style={{ color: '#8a7a66', fontSize: 10, marginBottom: 20, letterSpacing: 1 }}>ZOUK 3D TRAINER</div>
            <a href="mailto:avimoraly@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
              avimoraly@gmail.com
            </a>
            <a href="https://www.instagram.com/avimoraly/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="25%" stopColor="#e6683c"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#igGrad)"/>
                <circle cx="12" cy="12" r="4" stroke="url(#igGrad)"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#dc2743" stroke="none"/>
              </svg>
              instagram.com/avimoraly
            </a>
            <a href="https://www.facebook.com/avimoraly" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e0e0e0', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              facebook.com/avimoraly
            </a>
            <button onClick={() => setShowAbout(false)} style={{ padding: '6px 20px', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
