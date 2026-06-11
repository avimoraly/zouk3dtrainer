// ─── HUMANOID FIGURE ─────────────────────────────────
// Builds the dancer: hips, spine, chest, head/face, hair cap,
// arms, legs, and the hair-collision spheres parented to body groups.
// Returns the group handles + collider list used by the animation loop.
window.ZT = window.ZT || {};

ZT.buildFigure = function (scene) {
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

    return { fig, hipsG, spineG, chestG, headG, LA, RA, LL, RL, colliders };
};
