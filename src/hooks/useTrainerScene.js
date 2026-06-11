import { useEffect } from 'react';
import * as THREE from 'three';

export default function useTrainerScene({ mountRef, bodySpeedRef, headSpeedRef, flexRef, speedMultRef }) {
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 320;
    const H = el.clientHeight || 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a3f35);
    scene.fog = new THREE.Fog(0x4a3f35, 8, 18);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 50);
    camera.position.set(0, 4.2, 6.2);
    camera.lookAt(0, 1, 0);

    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1a1410;color:#cc9944;font-family:sans-serif;text-align:center;padding:24px;gap:12px;">
        <div style="font-size:36px">⚠️</div>
        <div style="font-size:16px;font-weight:700;color:#ffcc55">WebGL is unavailable</div>
        <div style="font-size:13px;color:#8a7060;max-width:320px;line-height:1.5">The 3D view could not start in this browser. Try a modern browser with WebGL enabled.</div>
      </div>`;
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xc8a878, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff2d9, 1.2);
    keyLight.position.set(4, 7, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd8a5, 0.55);
    fillLight.position.set(-3, 4, 2);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(8, 48),
      new THREE.MeshStandardMaterial({ color: 0xb47a45, roughness: 0.9, metalness: 0.05, transparent: true, opacity: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const dancer = new THREE.Group();
    scene.add(dancer);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.56, 1.18, 16),
      new THREE.MeshStandardMaterial({ color: 0xd5c3a2, roughness: 0.6, metalness: 0.05 })
    );
    torso.position.y = 1.1;
    torso.castShadow = true;
    torso.receiveShadow = true;
    dancer.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xf0dec8, roughness: 0.45, metalness: 0.02 })
    );
    head.position.set(0, 1.95, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    dancer.add(head);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 12), new THREE.MeshStandardMaterial({ color: 0xd3b995 }));
    leftArm.position.set(-0.55, 1.4, 0);
    leftArm.rotation.z = 0.35;
    leftArm.castShadow = true;
    dancer.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.set(0.55, 1.4, 0);
    rightArm.rotation.z = -0.35;
    dancer.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0xcbad87 }));
    leftLeg.position.set(-0.22, 0.45, 0);
    leftLeg.rotation.z = -0.15;
    leftLeg.castShadow = true;
    dancer.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.22, 0.45, 0);
    rightLeg.rotation.z = 0.15;
    dancer.add(rightLeg);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x7c5a3a }));
    base.position.y = 0.08;
    base.receiveShadow = true;
    scene.add(base);

    let lastTime = performance.now();
    let frame = 0;

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.03);
      lastTime = now;
      frame += dt;

      const bodySpeed = bodySpeedRef.current * (speedMultRef.current || 1);
      const headSpeed = headSpeedRef.current * (speedMultRef.current || 1);
      const flex = flexRef.current || 0.68;

      dancer.rotation.y += bodySpeed * 0.35 * dt;
      dancer.rotation.x = Math.sin(frame * 1.4 + bodySpeed) * 0.06 + (flex - 0.5) * 0.08;
      head.rotation.z = headSpeed * 0.18;
      head.rotation.y = Math.sin(frame * 2.0) * 0.03;

      torso.scale.y = 1 + (1 - flex) * 0.16;
      leftArm.rotation.z = 0.35 + Math.sin(frame * 2.4) * 0.04;
      rightArm.rotation.z = -0.35 - Math.sin(frame * 2.4) * 0.04;
      leftLeg.rotation.z = -0.15 + Math.sin(frame * 2.0 + 0.35) * 0.04;
      rightLeg.rotation.z = 0.15 - Math.sin(frame * 2.0 + 0.35) * 0.04;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    let frameId = requestAnimationFrame(animate);

    const onResize = () => {
      const nextW = el.clientWidth || 320;
      const nextH = el.clientHeight || 240;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, [mountRef, bodySpeedRef, headSpeedRef, flexRef, speedMultRef]);
}
