# Zouk 3D Trainer — Full Project Handover
**Date:** April 2026  
**Author:** Avi Moraly  
**Live URL:** https://zouk3dtrainer.netlify.app  
**Current Version:** 1.2

---

## 1. What This App Is

An interactive 3D dance movement visualizer for Brazilian Zouk, built as a single-file web app. A humanoid 3D figure with physics-based hair demonstrates Zouk movements in real time. No build step — runs entirely in the browser via CDN scripts.

---

## 2. Tech Stack

| Technology | Version | Role |
|---|---|---|
| React | 18 | UI + state management |
| Three.js | r128 | 3D rendering |
| Babel Standalone | latest | JSX transpilation in-browser |
| Verlet integration | custom | Hair physics simulation |
| Google Analytics 4 | G-DM3ZH4XNDS | Usage tracking |

All loaded via CDN — no npm, no build step needed.

---

## 3. File Structure

```
zouk-deploy/
├── index.html            ← Main app (self-contained)
├── manual.html           ← User manual
├── manifest.json         ← PWA manifest
├── sw.js                 ← Service worker (offline support)
├── preview.png           ← OG image 1200×630 (WhatsApp/Facebook)
├── preview.svg           ← SVG version
├── instagram-post.png    ← 1080×1080 square
├── instagram-story.png   ← 1080×1920 story
├── app-icon-1024.png     ← Facebook app icon
├── app-icon-512.png      ← Fallback icon
├── zouk-trainer.jsx      ← Full React source
├── README.md             ← Developer readme
└── icons/                ← PWA icons (72 96 128 144 152 192 384 512)
```

---

## 4. How to Deploy

**Netlify Drop (recommended):**
1. Unzip the deploy package
2. Go to https://app.netlify.com/drop
3. Drop the `zouk-deploy` folder

**GitHub Pages:**
- All links use relative paths (manual.html, not /manual.html) — works on subdirectories

---

## 5. Key Architecture Decisions

### Refs vs State
All animation-critical values use `useRef` (bodySpeedRef, headSpeedRef, flexRef, etc.) so the animation loop reads them without React re-renders. React `useState` is only used for UI display.

### Class naming convention
All UI elements have `zt-` prefixed classNames (e.g. `zt-btn-speed`, `zt-slider-body`). This is required for any UI-affecting elements.

### Speed multiplier
Global speed is controlled by `speedMultRef` / `smSmoothedRef`. The smoothed ref lerps toward the target at 0.025/frame. `dt` is multiplied by `sm` before being applied to ALL physics including hair — this creates true slow-motion.

### tap() helper
Prevents double-fire on Instagram/WhatsApp browsers:
```js
const tap = (fn) => ({
  onTouchEnd: (e) => { e.preventDefault(); lastTapRef.current = Date.now(); fn(); },
  onClick: () => { if (Date.now() - lastTapRef.current > 400) fn(); },
});
```

---

## 6. Features in v1.2

### Controls
- Body Rotation: -3 to +3 (buttons + slider)
- Head Movement Speed: -3 to +3 (buttons + slider)  
- 3 Tilt Modes: ⟳ circular / ↕ fwd-back / ↔ left-right
- Flexibility: 0–100% (unlocks chest → spine → hips progressively)
- Global Speed: 0–150% (true slow-motion, snaps to 100% at ±6%)
- Reverse: instant direction flip (onPointerDown, no double-fire)
- Reset: zeros all movement, returns to neutral
- Stop: zeros speeds instantly

### 8 Presets
Circular, Tilted Turns, Toalha, Roasted Chicken, Hyper Toalha, Chicote Lateral, Horse Saddle, Planet

### Camera
- Drag to orbit (mouse or 1 finger)
- Pinch / scroll to zoom
- Drag up/down to tilt angle

### Easter Egg 🎮
**Trigger:** Body=3, Head=3, Tilt=↕ fwd-back, Flex=100% — hold for 3 seconds  
**Effect:** Head detaches, flies, bounces with physics, rolls to stop  
**Message:** "YOU HAVE GONE TOO FAR!!!" (Mortal Kombat style)  
**Dismiss:** Tap anywhere  
**State refs:** eggActiveRef, eggPhaseRef, eggHeadDetached, eggVel, eggResetTimer, eggHoldTime

### PWA
- Manifest with id, scope, dir, screenshots
- Service worker caches ALL CDN scripts for full offline use (sw.js v2)
- Installable via "Add to Home Screen" on Android

### Analytics (GA4: G-DM3ZH4XNDS)
Tracked events:
- `preset_selected` (preset_name)
- `body_speed_set` (speed)
- `head_speed_set` (speed)
- `tilt_mode_changed` (mode)
- `flexibility_changed` (value 0–100)
- `speed_changed` (value 0–150)
- `speed_slider_toggled` (visible)
- `move_toggled` (enabled)
- `reverse_pressed`
- `manual_opened` (platform: mobile/desktop)
- `about_opened`
- `easter_egg_triggered`
- `easter_egg_dismissed`

### Social
- Facebook App ID: 1503011584671001
- OG tags pointing to https://zouk3dtrainer.netlify.app/preview.png
- Instagram: post (1080×1080) + story (1080×1920) images

---

## 7. Important IDs & Accounts

| Service | ID / URL |
|---|---|
| Netlify site | zouk3dtrainer.netlify.app |
| GA4 Measurement ID | G-DM3ZH4XNDS |
| Facebook App ID | 1503011584671001 |
| Instagram | @avimoraly |
| Contact email | avimoraly@gmail.com |

---

## 8. Saved Versions

| Version | Description |
|---|---|
| v1.0 | Base app — all core features, manual, PWA |
| v1.2 | + Easter egg + speed slider + GA4 + ? button + PWA improvements |

Both versions are saved as zip files in the deploy package.

---

## 9. How to Continue Development with Claude

When starting a new conversation, paste this into Claude:

> "I'm Avi Moraly, continuing development on my Brazilian Zouk 3D Trainer app (zouk3dtrainer.netlify.app). It's a React + Three.js PWA, single HTML file, no build step. Current version is 1.2. All UI classNames must use zt- prefix. The app uses useRef for animation values and useState for UI display only. The tap() helper prevents double-fire on touch browsers."

Then attach the `zouk-trainer.jsx` file from the zip — Claude can read it and continue exactly where we left off.

---

## 10. Known Issues / Future Ideas

- Reverse button only flips speed — Tilted Turns has a setTimeout that zeroes head after 1s (this is intentional behavior)
- Recording feature was built but rolled back to v1.2 (was working, available in session history)
- PWABuilder scores well — only "Feature" items (Shortcuts, Widgets) are missing, those are optional
- Chrome on Linux/Debian may show WebGL error — user fix: chrome://flags → enable WebGL
- Android app: use PWABuilder (https://pwabuilder.com) with the live Netlify URL

---

## 11. Development Notes

**To rebuild index.html from zouk-trainer.jsx:**
The index.html wraps the JSX with:
- React 18 + ReactDOM CDN
- Three.js r128 CDN  
- Babel standalone CDN
- GA4 script tag
- Service worker registration
- The JSX content with imports stripped and export default removed

**Hair physics:** Verlet integration, 80 strands, 13 segments each. Gravity = 0.0038*sm. Damping = 1-(1-0.875)*sm. Both scale with speedMult for slow-motion.

**Flexibility chain:**
- 0–25%: head only
- 25–55%: + chest (weight 0.4968)
- 55–80%: + spine (weight 0.2448)
- 80–100%: + hips (weight 0.1377)
