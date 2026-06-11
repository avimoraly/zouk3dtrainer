// ─── SCENE CONTROLLER ────────────────────────────────
// Owns the Three.js scene: renderer/camera setup, builder calls,
// the per-frame animation loop (tick), and all input handlers.
// All component refs/state-setters are passed in via `ctx` and
// destructured back into their original names, so the animation
// logic is identical to the original single-file component.
// Returns the effect cleanup function.
window.ZT = window.ZT || {};

ZT.createScene = function (ctx) {
  const {
    // refs
    mountRef, camAngleRef, camPitchRef, camZoomRef, figPosRef,
    lastTimeRef, smSmoothedRef, speedMultRef,
    bodySpeedRef, headSpeedRef, flexRef, headARef,
    baseTiltRef, tiltModeRef, snapTiltRef, frozenTiltXRef, frozenTiltZRef,
    torsionRef, torsionAmpRef, torsionPhaseRef,
    bateCabeloRef, bcAmpRef, bcPhaseRef,
    moveEnabledRef, keysRef,
    eggActiveRef, eggPhaseRef, eggHeadDetached, eggVel, eggResetTimer, eggHoldTime,
    isDragging, lastMouseX, lastMouseY,
    // state setters
    setSpeedMult, setShowEasterEgg, setBodySpeed, setHeadSpeed, setActivePreset, setVh,
    // helpers
    gaEvent,
  } = ctx;

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

    // Check WebGL support before creating renderer
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1a1410;color:#cc9944;font-family:sans-serif;text-align:center;padding:30px;gap:16px;">
        <div style="font-size:40px">⚠️</div>
        <div style="font-size:18px;font-weight:700;color:#ffcc55">WebGL Not Available</div>
        <div style="font-size:14px;color:#8a7060;max-width:340px;line-height:1.6">Your browser blocked WebGL — the 3D engine can't start.<br/><br/>
        <b style="color:#cc9944">Chrome fix:</b> go to <code style="background:#2a2018;padding:2px 6px;border-radius:3px">chrome://flags</code> → search <b>WebGL</b> → Enable.<br/>Or try: <code style="background:#2a2018;padding:2px 6px;border-radius:3px">chrome --enable-webgl</code><br/><br/>
        <b style="color:#cc9944">Works great on:</b> Firefox · Safari · Edge</div>
      </div>`;
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.sortObjects = true;

    // ─── STUDIO, FIGURE, HAIR ────────────────────────
    ZT.buildStudio(scene);
    const { fig, hipsG, spineG, chestG, headG, LA, RA, LL, RL, colliders } = ZT.buildFigure(scene);
    const { strands, NS, SL } = ZT.buildHair(scene);

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
      // Reverse is now instant — handled directly in the button click
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


      // ── EASTER EGG ──────────────────────────────────
      {
        const bs = Math.abs(bodySpeedRef.current);
        const hs = Math.abs(headSpeedRef.current);
        const triggered = bs >= 2.9 && hs >= 2.9 && tiltModeRef.current === 'fwd-back' && flexRef.current >= 0.99;

        if (!eggActiveRef.current) {
          eggHoldTime.current = triggered ? eggHoldTime.current + dt : 0;

          if (eggHoldTime.current >= 3.0) {
            eggActiveRef.current    = true;
            eggPhaseRef.current     = 1;
            gaEvent('easter_egg_triggered');
            eggHeadDetached.current = false;
            eggHoldTime.current     = 0;
            eggVel.current = {
              vx: (Math.random() > 0.5 ? 1 : -1) * (0.025 + Math.random() * 0.015),
              vy: 0.09 + Math.random() * 0.03,
              vz: -0.02 + Math.random() * 0.015,
              rx: 0.10 + Math.random() * 0.05,
              rz: (Math.random() - 0.5) * 0.06,
            };
            // Slow down the simulation a bit during the egg
            speedMultRef.current = 0.35; setSpeedMult(0.35);
          }
        }

        if (eggActiveRef.current) {
          // Phase 1: fly through air
          if (eggPhaseRef.current === 1) {
            if (!eggHeadDetached.current) {
              const wp = new THREE.Vector3();
              const wq = new THREE.Quaternion();
              headG.getWorldPosition(wp);
              headG.getWorldQuaternion(wq);
              chestG.remove(headG);
              headG.position.copy(wp);
              headG.quaternion.copy(wq);
              scene.add(headG);
              eggHeadDetached.current = true;
            }
            const v = eggVel.current;
            v.vy -= 0.013 * sm;
            headG.position.x += v.vx * sm;
            headG.position.y += v.vy * sm;
            headG.position.z += v.vz * sm;
            headG.rotation.x += v.rx * sm;
            headG.rotation.z += v.rz * sm;
            if (headG.position.y <= 0.22) {
              headG.position.y = 0.22;
              v.vy = Math.abs(v.vy) * 0.30;
              v.vx *= 0.78; v.vz *= 0.78;
              v.rx *= 0.65; v.rz *= 0.65;
              if (Math.abs(v.vy) < 0.018) eggPhaseRef.current = 2;
            }
          }

          // Phase 2: roll on floor
          if (eggPhaseRef.current === 2) {
            const v = eggVel.current;
            v.vx *= 0.88; v.vz *= 0.88; v.rx *= 0.91;
            headG.position.x += v.vx * sm;
            headG.position.z += v.vz * sm;
            headG.position.y  = 0.22;
            headG.rotation.x += v.rx * sm;
            if (Math.abs(v.vx) + Math.abs(v.vz) < 0.003) {
              eggPhaseRef.current = 3;
              setShowEasterEgg(true);
              // Store reset as a function — only runs on user tap, no auto-timeout
              eggResetTimer.current = () => {
                gaEvent('easter_egg_dismissed');
                setShowEasterEgg(false);
                scene.remove(headG);
                headG.position.set(0, 0.87, 0);
                headG.rotation.set(0, 0, 0);
                headG.quaternion.identity();
                chestG.add(headG);
                eggActiveRef.current    = false;
                eggPhaseRef.current     = 0;
                eggHeadDetached.current = false;
                speedMultRef.current = 1.0; setSpeedMult(1.0);
                bodySpeedRef.current = 0; setBodySpeed(0);
                headSpeedRef.current = 0; setHeadSpeed(0);
                setActivePreset(null);
              };
            }
          }
        }
      }
      // ────────────────────────────────────────────────

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
};
