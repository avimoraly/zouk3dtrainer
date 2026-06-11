// ─── STUDIO ENVIRONMENT ──────────────────────────────
// Builds lights, parquet floor, walls, mirror, ballet barre,
// benches, ceiling spotlights and baseboard trim into the scene.
// Static geometry — nothing here is touched by the animation loop.
window.ZT = window.ZT || {};

ZT.buildStudio = function (scene) {
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
};
