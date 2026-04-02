# 🎵 Brazilian Zouk 3D Trainer

An interactive 3D dance movement visualizer for Brazilian Zouk, built with React + Three.js.

**Live app:** https://zouk3dtrainer.netlify.app  
**Created by:** Avi Moraly

---

## 📁 File Structure

```
zouk-deploy/
├── index.html            ← Main app (self-contained, no build step needed)
├── manual.html           ← User manual with illustrated controls guide
├── manifest.json         ← PWA web app manifest
├── sw.js                 ← Service worker (offline support)
├── preview.png           ← OG image for WhatsApp / Facebook link previews (1200×630)
├── preview.svg           ← SVG version of the preview image
├── instagram-post.png    ← Instagram square post image (1080×1080)
├── instagram-story.png   ← Instagram story image (1080×1920)
├── app-icon-1024.png     ← Facebook Developer app icon (1024×1024)
├── app-icon-512.png      ← App icon fallback (512×512)
├── zouk-trainer.jsx      ← Full React source code
└── icons/                ← PWA icon set
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## 🚀 Deployment

### Netlify Drop (easiest)
1. Unzip the archive
2. Go to https://app.netlify.com/drop
3. Drag and drop the `zouk-deploy` **folder** onto the page
4. Done — the app is live at your Netlify URL

### Custom domain
In Netlify dashboard → Domain settings → Add custom domain

---

## ✨ Features

- **3D humanoid figure** with realistic proportions, skin, clothing and shoes
- **Verlet hair physics** — hair responds to movement in real time
- **8 dance movement presets** — Circular, Tilted Turns, Toalha, Roasted Chicken, Hyper Toalha, Chicote Lateral, Horse Saddle, Planet
- **Body Rotation control** — speed -3 to +3, left or right
- **Head Movement control** — speed -3 to +3, CW or CCW
- **3 Tilt Modes** — Circular orbit, Forward/Back, Left/Right
- **Flexibility slider** — controls how much of the body chain (chest, spine, hips) joins the head tilt
- **Speed slider** — global slow motion / fast forward (0% to 150%), true physics slow-motion including hair
- **Camera orbit** — drag to rotate, pinch or scroll to zoom
- **Figure movement** — MOVE toggle + D-pad (or WASD on desktop)
- **Reverse button** — smoothly flips direction
- **Studio environment** — parquet floor, mirror wall, ballet barre, benches, ceiling spotlights
- **PWA support** — installable on mobile, works offline
- **OG meta tags** — rich previews on WhatsApp, Facebook
- **Responsive** — works on mobile and desktop browsers

---

## 🎛️ Controls Reference

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
| ? | Header | Opens this manual |
| ℹ | Header | Opens About / contact dialog |

---

## 📱 Social Media Files

| File | Use |
|---|---|
| `preview.png` | Deploy alongside `index.html` — auto-shows as link preview on WhatsApp and Facebook |
| `instagram-post.png` | Save to phone → post as Instagram square |
| `instagram-story.png` | Save to phone → post as Instagram story (add link sticker) |
| `app-icon-1024.png` | Upload to Facebook Developer dashboard → Settings → Basic → App Icon |

---

## 📲 PWA / Android App

The app is PWA-ready. To install on Android:
1. Open the live URL in Chrome
2. Tap the browser menu → **"Add to Home Screen"**
3. The app installs like a native app with the Z icon

For a standalone APK via PWABuilder:
1. Go to https://pwabuilder.com
2. Paste `https://zouk3dtrainer.netlify.app`
3. Download the Android package

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI components and state |
| Three.js | r128 | 3D rendering |
| Babel Standalone | latest | JSX transpilation in-browser |
| Verlet integration | custom | Hair physics simulation |

No build step required — everything runs directly in the browser via CDN scripts.

---

## 📧 Contact

**Avi Moraly**  
Email: avimoraly@gmail.com  
Instagram: @avimoraly  
Facebook: facebook.com/avimoraly
