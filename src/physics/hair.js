// ─── HAIR STRANDS ────────────────────────────────────
// Creates the Verlet hair strands and adds their lines to the scene.
// The per-frame Verlet integration runs inside the animation loop
// (sceneController) because it is driven by the slow-motion factor.
// Returns the strand list plus the segment count/length the loop needs.
window.ZT = window.ZT || {};

ZT.buildHair = function (scene) {
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

    return { strands, NS, SL };
};
