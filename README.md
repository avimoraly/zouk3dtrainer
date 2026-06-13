# Brazilian Zouk 3D Trainer

An interactive 3D dance movement visualizer for Brazilian Zouk, built with React + Three.js.

**Live app:** https://zouk3dtrainer.netlify.app  
**Created by:** Avi Moraly

---

## File Structure

```
zouk3dtrainer/
├── index.html              ← App shell (loads modules, no build step)
├── manual.html             ← User manual with illustrated controls guide
├── manifest.json           ← PWA web app manifest
├── sw.js                   ← Service worker (offline support)
├── netlify.toml            ← Netlify config (static, no build command)
├── assets/
│   ├── css/
│   │   └── styles.css      ← Global styles, animations, button feedback
│   ├── images/
│   │   └── preview.png     ← OG image for link previews (1200×630)
│   └── icons/              ← PWA icon set (192px, 512px)
└── src/
    ├── data/
    │   └── presets.js      ← 8 dance move preset definitions (ZT.PRESETS)
    ├── lib/
    │   └── analytics.js    ← GA4 event helper (ZT.gaEvent)
    ├── scene/
    │   ├── studio.js       ← Studio environment: floor, mirror, barre, lights
    │   └── figure.js       ← 3D humanoid figure builder
    ├── physics/
    │   └── hair.js         ← Verlet hair physics (80 strands, 13 segments)
    └── app/
    │   └── sceneController.js ← Animation loop, camera, event handlers
    └── ui/
        ├── overlays.jsx    ← Easter egg + About modal
        └── ZoukTrainer.jsx ← Main React component
```

---

## Deployment

### Netlify (from GitHub)
1. Connect repo in Netlify dashboard
2. Netlify auto-detects `netlify.toml` — no build command, serves root directly
3. Done

### Netlify Drop (manual)
1. Go to https://app.netlify.com/drop
2. Drag the repo folder onto the page

### Local development
Any static HTTP server works — open `index.html` via `localhost`, not `file://` (Babel fetches `src/` modules via HTTP).

```
npx serve .
# or
python -m http.server 8123
```

---

## Features

- **3D humanoid figure** with realistic proportions, skin, clothing and shoes
- **Verlet hair physics** — hair responds to movement in real time
- **8 dance movement presets** — Circular, Tilted Turns, Toalha, Roasted Chicken, Hyper Toalha, Chicote Lateral, Horse Saddle, Planet
- **Body Rotation control** — speed -3 to +3, left or right
- **Head Movement control** — speed -3 to +3, CW or CCW
- **3 Tilt Modes** — Circular orbit, Forward/Back, Left/Right
- **Flexibility slider** — controls how much of the body chain joins the head tilt
- **Speed slider** — global slow motion / fast forward (0% to 150%)
- **Camera orbit** — drag to rotate, pinch or scroll to zoom
- **Figure movement** — MOVE toggle + D-pad (or WASD on desktop)
- **Tactile button feedback** — press effect on all action buttons
- **Studio environment** — parquet floor, mirror wall, ballet barre, benches, spotlights
- **PWA support** — installable on mobile, works offline
- **OG meta tags** — rich previews on WhatsApp, Facebook
- **Responsive** — works on mobile and desktop browsers

---

## Controls Reference

| Control | Location | Function |
|---|---|---|
| Preset dropdown | Preset bar | Load a dance movement preset |
| ⇄ Reverse | Preset bar | Flip body + head direction |
| ↺ Reset | Preset bar | Stop all, return to neutral |
| ■ Stop | Preset bar | Zero both speeds instantly |
| ⟳ ↕ ↔ | Right edge of canvas | Tilt mode (circular / fwd-back / left-right) |
| ⚡ SPEED | Upper-left of canvas | Toggle global speed slider (0–150%) |
| MOVE | Lower-left of canvas | Toggle D-pad to walk figure |
| Body Rotation | Controls panel | -3 to 3 speed buttons + slider |
| Head Movement | Controls panel | -3 to 3 speed buttons + slider |
| Flexibility | Controls panel | 0–100% body chain participation |
| Share | Header | Copy link to clipboard / native share |
| ? | Header | Opens user manual |
| ℹ | Header | Opens About / contact dialog |

---

## PWA / Android App

The app is PWA-ready. To install on Android:
1. Open the live URL in Chrome
2. Tap the browser menu → **"Add to Home Screen"**
3. The app installs like a native app with the Z icon

For a standalone APK via PWABuilder:
1. Go to https://pwabuilder.com
2. Paste `https://zouk3dtrainer.netlify.app`
3. Download the Android package

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI components and state |
| Three.js | r128 | 3D rendering |
| Babel Standalone | latest | JSX transpilation in-browser |
| Verlet integration | custom | Hair physics simulation |

No build step — everything runs directly in the browser via CDN scripts.  
Modules share scope through the `window.ZT` namespace pattern.

---

## Contact

**Avi Moraly**  
Email: avimoraly@gmail.com  
Instagram: @avimoraly  
Facebook: facebook.com/avimoraly
