/**
 * Afriplan — Hero 3D Background
 * Simplified topographic ring field — dark + bright amber contour rings
 * Uses Three.js CDN: https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js
 */
(function () {
  console.log('[HERO] bisimwa WebGL starting...');
  'use strict';

  var canvasEl = document.getElementById('heroBgCanvas');
  if (!canvasEl) return;

  // ── Hero-aware sizing ──────────────────────────────────────────────────────
  var heroEl = document.querySelector('.hero');
  function getHeroSize() {
    if (heroEl) {
      return { w: heroEl.offsetWidth, h: heroEl.offsetHeight };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }
  var heroSize = getHeroSize();

  // ── Renderer ───────────────────────────────────────────────────────────────
  var isMobile = heroSize.w < 768;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: false,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  console.log('[HERO] Renderer created, WebGL? ' + !!renderer.getContext().getParameter && 'yes'); renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 2));
  console.log('[HERO] Renderer ready, webgl: ' + !!renderer.getContext()); console.log('[HERO] Renderer info: ' + renderer.info.render.calls + ' calls');
  renderer.setSize(heroSize.w, heroSize.h);
  renderer.setClearColor(0x0A0A08, 1);

  // ── Scene & Camera ─────────────────────────────────────────────────────────
  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    50, heroSize.w / heroSize.h, 0.1, 1000
  );
  camera.position.set(0, 0, 90);
  camera.lookAt(0, 0, 0);

  // ── Layer 1: Deep aurora plane ─────────────────────────────────────────────
  const auroraVert = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const auroraFrag = `
    uniform float uTime = 0.0; // LOCKED - no time drift
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                 mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float t = 0.0; // LOCKED

      float n1 = fbm(uv * 3.0 + vec2(t, t * 0.5));
      float n2 = fbm(uv * 5.0 - vec2(t * 0.4, t * 0.7) + n1 * 0.5);

      // Wide amber bands
      float band1 = sin(uv.y * 6.0 + n2 * 4.0 + t) * 0.5 + 0.5;
      float band2 = sin(uv.x * 3.0 - n1 * 2.0 + t * 0.6) * 0.5 + 0.5;

      vec3 colA = vec3(0.961, 0.620, 0.043); // #F59E0B
      vec3 colB = vec3(0.851, 0.467, 0.024); // #D97706
      vec3 void_col = vec3(0.039, 0.039, 0.031); // near-black

      float intensity = band1 * band2 * n2;
      vec3 col = mix(void_col, colA, clamp(intensity * 0.6, 0.0, 0.6));
      col = mix(col, colB, band2 * 0.3);

      // Center glow
      float cg = 1.0 - smoothstep(0.0, 0.55, length((uv - 0.5) * vec2(1.1, 1.4)));
      col += vec3(0.961, 0.620, 0.043) * cg * 0.08;

      // Vignette
      float vig = 1.0 - smoothstep(0.3, 0.9, length(uv - 0.5) * 1.6);
      col *= vig * 0.85;

      gl_FragColor = vec4(col, 1.0);
    }
  `;
  const auroraMat = new THREE.ShaderMaterial({
    vertexShader: auroraVert,
    fragmentShader: auroraFrag,
    uniforms: { uTime: { value: 0 } },
    depthWrite: false,
    depthTest: false
  });
  const auroraPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 220),
    auroraMat
  );
  auroraPlane.position.z = -50;
  scene.add(auroraPlane);

  // ── Layer 2: Topographic mesh (bright amber rings) ────────────────────────
  const topoVert = `
    uniform float uTime = 0.0; // LOCKED - no time drift
    varying float vH;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float h = sin(pos.x * 0.05) * 3.0; // LOCKED
              + sin(pos.y * 0.07) * 2.0;
              + sin((pos.x + pos.y) * 0.03) * 4.0;
      pos.z += h;
      vH = h;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  const topoFrag = `
    varying float vH;
    varying vec2 vUv;
    uniform float uTime = 0.0; // LOCKED - no time drift
    void main() {
      float c = sin(vH * 2.8) * 0.5 + 0.5; // LOCKED
      c = smoothstep(0.42, 0.58, c);
      vec3 lineCol = vec3(0.961, 0.620, 0.043);
      vec3 baseCol = vec3(0.035, 0.033, 0.030);
      float alpha = mix(0.5, 0.95, c);
      gl_FragColor = vec4(mix(baseCol, lineCol, c * 0.85), alpha);
    }
  `;
  const topoMat = new THREE.ShaderMaterial({
    vertexShader: topoVert,
    fragmentShader: topoFrag,
    uniforms: { uTime: { value: 0 } },
    wireframe: true,
    transparent: true,
    depthWrite: false
  });
  const topoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 130, 70, 50),
    topoMat
  );
  topoMesh.rotation.x = -Math.PI / 2.4;
  topoMesh.position.set(0, -25, -35);
  scene.add(topoMesh);

  // ── Layer 3: Floating crystal wireframes ───────────────────────────────────
  const crystalDefs = [
    { geo: new THREE.IcosahedronGeometry(8, 0),   x: -52, y:  22, z: -22, rx: 0.0012, ry: 0.0018, rz: 0.0008 },
    { geo: new THREE.OctahedronGeometry(5.5, 0),   x:  55, y: -12, z: -32, rx: 0.0018, ry: 0.0012, rz: 0.0015 },
    { geo: new THREE.IcosahedronGeometry(4.5, 0),  x:  18, y:  35, z: -12, rx: 0.0022, ry: 0.0008, rz: 0.0018 },
    { geo: new THREE.OctahedronGeometry(6.5, 0),   x: -28, y: -28, z:  -8, rx: 0.0010, ry: 0.0022, rz: 0.0012 },
  ];

  const crystalMeshes = crystalDefs.map(function(d) {
    var mat = new THREE.MeshBasicMaterial({
      color: 0xC9A454,
      wireframe: true,
      transparent: true,
      opacity: 0.015
    });
    var m = new THREE.Mesh(d.geo, mat);
    m.position.set(d.x, d.y, d.z);
    m.userData = { rx: d.rx, ry: d.ry, rz: d.rz, baseY: d.y };
    scene.add(m);
    return m;
  });

  // ── Layer 4: Attractor nodes ────────────────────────────────────────────────
  var nodeDefs = [
    { x: -38, y:  12, z: -18 },
    { x:  32, y: -18, z: -28 },
    { x:   8, y:  28, z: -10 },
  ];
  var attractors = nodeDefs.map(function(nd) {
    // Core
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.7 });
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), coreMat);
    core.position.set(nd.x, nd.y, nd.z);
    // Halo
    var haloMat = new THREE.MeshBasicMaterial({ color: 0xD97706, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    var halo = new THREE.Mesh(new THREE.TorusGeometry(5, 0.12, 8, 32), haloMat);
    halo.position.set(nd.x, nd.y, nd.z);
    halo.rotation.x = Math.random() * Math.PI;
    halo.rotation.y = Math.random() * Math.PI;
    // Vertical beam
    var beamMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.03 });
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 100, 4), beamMat);
    beam.position.set(nd.x, nd.y - 50, nd.z);
    core.userData = { halo: halo, beam: beam };
    halo.userData = { core: core };
    core.renderOrder = 5;
    halo.renderOrder = 4;
    scene.add(core); scene.add(halo); scene.add(beam);
    return core;
  });

  // ── Layer 5: Particle field ─────────────────────────────────────────────────
  var N = isMobile ? 1200 : 8000;
  var pPos = new Float32Array(N * 3);
  var pCol = new Float32Array(N * 3);
  var pScl = new Float32Array(N);
  var pVel = new Float32Array(N * 3);

  for (var i = 0; i < N; i++) {
    var i3 = i * 3;
    pPos[i3]     = (Math.random() - 0.5) * 180;
    pPos[i3 + 1] = (Math.random() - 0.5) * 110;
    pPos[i3 + 2] = (Math.random() - 0.5) * 90 - 15;
    var c = Math.random() > 0.5 ? new THREE.Color(0xF59E0B) : new THREE.Color(0xC9A454);
    var jit = 0.75 + Math.random() * 0.5;
    pCol[i3]     = c.r * jit;
    pCol[i3 + 1] = c.g * jit;
    pCol[i3 + 2] = c.b * jit;
    pScl[i] = 0.5 + Math.random() * 1.5;
    pVel[i3]     = (Math.random() - 0.5) * 0.01;
    pVel[i3 + 1] = (Math.random() - 0.5) * 0.008;
    pVel[i3 + 2] = (Math.random() - 0.5) * 0.005;
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size',     new THREE.BufferAttribute(pScl, 1));

  var pMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Mouse tracking ───────────────────────────────────────────────────────────
  var mouse   = new THREE.Vector2(0, 0);
  var damped  = new THREE.Vector2(0, 0);
  document.addEventListener('mousemove', function(e) {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Resize ─────────────────────────────────────────────────────────────────
  window.addEventListener('resize', function() {
    var hs = getHeroSize();
    var newIsMobile = hs.w < 768;
    camera.aspect = hs.w / hs.h;
    camera.updateProjectionMatrix();
    renderer.setSize(hs.w, hs.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, newIsMobile ? 1.0 : 2));
  });

  // ── Clock ─────────────────────────────────────────────────────────────────
  var clock = new THREE.Clock();
  var startTime = null;

  // ── Render loop ─────────────────────────────────────────────────────────────
  function animate(ts) {
    requestAnimationFrame(animate);
    if (startTime === null) startTime = ts;
    var t   = (ts - startTime) / 1000;
    var delta = clock.getDelta();

    // Smooth mouse
    damped.x += (mouse.x - damped.x) * 0.04;
    damped.y += (mouse.y - damped.y) * 0.04;

    // Auroras
    // AURORA LOCKED
    // auroraMat.uniforms.uTime.value = 0;
    // TOPO LOCKED
    // topoMat.uniforms.uTime.value = 0;

    // CRYSTALS REMOVED - no floating polyhedra
    // crystalMeshes removed entirely

    // Attractors
    attractors.forEach(function(core, idx) {
      var ud  = core.userData;
      var halo = ud.halo;
      var beam = ud.beam;
      var pulse = 0.8 + 0.2 * Math.sin(t * 1.4 + idx * 2.1);
      core.position.y = nodeDefs[idx].y + Math.sin(t * 0.4 + idx * 1.3) * 2;
      core.material.opacity = 0.55 + 0.2 * pulse;
      halo.rotation.z += 0.000; // MINIMIZED
      halo.rotation.x += 0.000;
      halo.material.opacity = 0.01 + 0.005 * pulse; // nearly invisible
      beam.scale.y = 0.7 + 0.3 * pulse;
      beam.material.opacity = 0.025 + 0.02 * pulse;
    });

    // Particles drift + mouse inertia
    for (var i = 0; i < N; i++) {
      var i3 = i * 3;
      pPos[i3]     += pVel[i3];
      pPos[i3 + 1] += pVel[i3 + 1];
      pPos[i3 + 2] += pVel[i3 + 2];
      // Wrap boundaries
      if (pPos[i3]     >  90) pPos[i3]     = -90;
      if (pPos[i3]     < -90) pPos[i3]     =  90;
      if (pPos[i3 + 1] >  55) pPos[i3 + 1] = -55;
      if (pPos[i3 + 1] < -55) pPos[i3 + 1] =  55;
      if (pPos[i3 + 2] >  30) pPos[i3 + 2] = -75;
      if (pPos[i3 + 2] < -75) pPos[i3 + 2] =  30;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Parallax on camera
    // CAMERA LOCKED - no parallax drift
    camera.position.set(0, 5, 90);
    camera.lookAt(0, 0, 0);

    // Slight mesh sway
    // MESH LOCKED - no mouse sway
    topoMesh.position.set(0, -25, -35);

    console.log('[HERO] Render call, meshes: ' + scene.children.length + ', camera pos: ' + camera.position.x + ',' + camera.position.y + ',' + camera.position.z); renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
