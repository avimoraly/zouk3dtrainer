import { useEffect, useRef, useState } from "react";
import useTrainerScene from './hooks/useTrainerScene.js';
import AboutModal from './components/AboutModal.jsx';
import { PRESETS } from './constants/presets.js';
import { gaEvent, shareTrainer } from './utils/share.js';

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
  const ttTimeoutRef = useRef(null); // Tilted Turns setTimeout handle
  const frozenTiltZRef = useRef(0);
  const figPosRef  = useRef({ x: 0, z: 0 });
  const keysRef   = useRef({});
  const [moveEnabled, setMoveEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const moveEnabledRef = useRef(false);
  const shareToastTimerRef = useRef(null);
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
  // ── EASTER EGG ──
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const eggActiveRef    = useRef(false);
  const eggPhaseRef     = useRef(0);       // 1=flying 2=rolling 3=stopped
  const eggHeadDetached = useRef(false);
  const eggVel          = useRef({ vx:0, vy:0, vz:0, rx:0, rz:0 });
  const eggResetTimer   = useRef(null);
  const eggHoldTime     = useRef(0);       // seconds held at trigger condition

  const doReset = () => {
    if (ttTimeoutRef.current) { clearTimeout(ttTimeoutRef.current); ttTimeoutRef.current = null; }
    if (eggResetTimer.current) { clearTimeout(eggResetTimer.current); eggResetTimer.current = null; }
    eggHoldTime.current = 0;
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
    gaEvent('preset_selected', { preset_name: preset.name });

    // ── STEP 2: Apply new preset ──
    bodySpeedRef.current = preset.rotation; setBodySpeed(preset.rotation);
    headSpeedRef.current = preset.tilt;     setHeadSpeed(preset.tilt);
    torsionRef.current    = !!preset.torsion;
    bateCabeloRef.current = !!preset.bateCabelo;

    if (preset.name === 'Tilted Turns') {
      if (ttTimeoutRef.current) clearTimeout(ttTimeoutRef.current);
      ttTimeoutRef.current = setTimeout(() => {
        headSpeedRef.current = 0; setHeadSpeed(0);
        ttTimeoutRef.current = null;
      }, 300);
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


  const shareApp = shareTrainer({ setShareMessage, shareToastTimerRef });

  const setBS = (v) => { bodySpeedRef.current = v; setBodySpeed(v); setActivePreset(null); lastTimeRef.current = performance.now(); gaEvent('body_speed_set', { speed: v }); };
  const setHS = (v) => { headSpeedRef.current = v; setHeadSpeed(v); setActivePreset(null); lastTimeRef.current = performance.now(); gaEvent('head_speed_set', { speed: v }); };
  const setFL = (v) => { flexRef.current = v; setFlex(v); };
  const setFLTracked = (v) => { setFL(v); gaEvent('flexibility_changed', { value: Math.round(v * 100) }); };
  // Non-linear flex: square root curve so slider reaches high values faster
  const flexCurved = (f) => Math.pow(f, 0.55);
  const setTM = (v) => { tiltModeRef.current = v; setTiltMode(v); gaEvent('tilt_mode_changed', { mode: v }); if (v !== 'circular') { setActivePreset(null); if (Math.abs(headSpeedRef.current) < 0.01) { headSpeedRef.current = 1; setHeadSpeed(1); } } };

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

  useTrainerScene({ mountRef, bodySpeedRef, headSpeedRef, flexRef, speedMultRef });

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
          {isMobile && <div style={{ position: 'absolute', right: 0, display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              className="zt-btn-share"
              title="Share this trainer"
              onClick={shareApp}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↗</button>
            <a className="zt-btn-manual" href="manual.html" title="User Manual" onClick={() => gaEvent('manual_opened', { platform: 'mobile' })}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>?</a>
            <button
              className="zt-btn-about"
              title="About"
              onClick={() => setShowAbout(v => !v)}
              style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0 }}>ℹ</button>
            {shareMessage && <span style={{ color: '#ffe5b0', fontSize: 9, whiteSpace: 'nowrap', marginLeft: 4 }}>{shareMessage}</span>}
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
          <button
            className="zt-btn-share"
            title="Share this trainer"
            onClick={shareApp}
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↗</button>
          <a className="zt-btn-manual" href="manual.html" title="User Manual" onClick={() => gaEvent('manual_opened', { platform: 'desktop' })}
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>?</a>
          <button
            className="zt-btn-about"
            title="About"
            onClick={() => { setShowAbout(v => !v); gaEvent('about_opened'); }}
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#3a3028', border: '1px solid #6a5438', color: '#cc9944', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: '24px', flexShrink: 0 }}>ℹ</button>
          {shareMessage && <span style={{ color: '#ffe5b0', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 6 }}>{shareMessage}</span>}
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
          onPointerDown={() => {
            if (ttTimeoutRef.current) { clearTimeout(ttTimeoutRef.current); ttTimeoutRef.current = null; }
            gaEvent('reverse_pressed');
            const newBS = -bodySpeedRef.current;
            const newHS = -headSpeedRef.current;
            bodySpeedRef.current = newBS; setBodySpeed(newBS);
            headSpeedRef.current = newHS; setHeadSpeed(newHS);
            setActivePreset(null);
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
                width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
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
          {...tap(() => { const next = !showSpeedSlider; setShowSpeedSlider(next); gaEvent('speed_slider_toggled', { visible: next }); })}
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
                onChange={e => { let v = parseFloat(e.target.value); if (Math.abs(v - 1.0) <= 0.06) v = 1.0; speedMultRef.current = v; setSpeedMult(v); }} onMouseUp={e => gaEvent('speed_changed', { value: Math.round(parseFloat(e.target.value) * 100) })} onTouchEnd={e => gaEvent('speed_changed', { value: Math.round(parseFloat(e.target.value) * 100) })}
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
          <button className="zt-btn-move-toggle" title="Toggle movement controls" onClick={() => { const v = !moveEnabled; setMoveEnabled(v); moveEnabledRef.current = v; gaEvent('move_toggled', { enabled: v }); }} style={{
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
            <input className="zt-slider zt-slider-flex" title="Flexibility" type="range" min="0" max="1" step="0.01" value={flex} onChange={e => setFL(parseFloat(e.target.value))} onMouseUp={e => setFLTracked(parseFloat(e.target.value))} onTouchEnd={e => setFLTracked(parseFloat(e.target.value))} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
            <div style={{ position: 'absolute', left: `calc(${flex * 100}% - 7px)`, width: 14, height: 14, background: '#c8a06a', borderRadius: '50%', border: '2px solid #fff', pointerEvents: 'none', boxShadow: '0 1px 4px #0005' }} />
          </div>
          <span className="zt-label-flexible" style={{ fontSize: 8, fontWeight: 700, color: '#c8a06a', letterSpacing: 1, whiteSpace: 'nowrap', minWidth: 46 }}>FLEXIBLE</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#ffcc77', minWidth: 32, textAlign: 'right' }}>{Math.round(flex * 100)}%</span>
        </div>
      </div>
    </div>

      {/* EASTER EGG OVERLAY */}
      {showEasterEgg && (
        <div className="zt-egg-overlay"
          onClick={() => { if (eggResetTimer.current) { eggResetTimer.current(); eggResetTimer.current = null; } }}
          style={{
          position:'fixed', inset:0, zIndex:999998,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          pointerEvents:'all', cursor:'pointer',
          background:'radial-gradient(ellipse at center, rgba(150,0,0,0.50) 0%, rgba(0,0,0,0.82) 100%)',
          animation:'egg-fade 0.5s ease-out',
        }}>
          <style>{`
            @keyframes egg-fade    { from{opacity:0} to{opacity:1} }
            @keyframes egg-slam    { 0%{transform:scale(0.1) translateY(60px);opacity:0;letter-spacing:60px} 65%{transform:scale(1.12) translateY(-6px);opacity:1;letter-spacing:5px} 100%{transform:scale(1) translateY(0);letter-spacing:4px} }
            @keyframes egg-shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
            @keyframes egg-sub     { 0%,55%{opacity:0;transform:translateY(24px)} 100%{opacity:1;transform:translateY(0)} }
            @keyframes egg-flicker { 0%,100%{opacity:1} 50%{opacity:0.6} }
          `}</style>
          <div style={{ width:'75%', height:5, background:'linear-gradient(to right,transparent,#cc0000,#cc0000,transparent)', borderRadius:3, marginBottom:28 }} />
          <div className="zt-egg-title" style={{
            fontFamily:"'Impact','Arial Black',sans-serif",
            fontSize:'clamp(28px, 7vw, 72px)',
            fontWeight:900,
            color:'#ffdd00',
            textShadow:'0 0 30px #ff0000, 0 0 60px #990000, 3px 3px 0 #000',
            letterSpacing:4, textTransform:'uppercase', textAlign:'center',
            lineHeight:1.15, padding:'0 20px',
            animation:'egg-slam 0.65s cubic-bezier(0.17,0.89,0.32,1.28) forwards, egg-shake 0.5s 0.7s ease-in-out',
          }}>YOU HAVE<br/>GONE TOO FAR!!!</div>
          <div className="zt-egg-sub" style={{
            marginTop:22,
            fontFamily:"'Impact','Arial Black',sans-serif",
            fontSize:'clamp(12px, 2.5vw, 20px)',
            color:'#ff4444', letterSpacing:6,
            textShadow:'0 0 10px #ff0000',
            textTransform:'uppercase',
            animation:'egg-sub 1.3s ease-out forwards, egg-flicker 0.35s 1.7s infinite',
          }}>the head has left the building</div>
          <div style={{ width:'75%', height:5, background:'linear-gradient(to right,transparent,#cc0000,#cc0000,transparent)', borderRadius:3, marginTop:28 }} />
          <div style={{ marginTop:18, color:'#ff444488', fontSize:'clamp(10px,1.5vw,13px)', letterSpacing:3, fontFamily:"'Impact','Arial Black',sans-serif", textTransform:'uppercase', animation:'egg-flicker 1s 2s infinite' }}>tap anywhere to continue</div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
