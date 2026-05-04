/**
 * Afriplan — Hero 3D Background
 * Clean "Mineral Field" — aurora plane + topographic rings + attractor nodes + star dust
 * No crystal wireframes — maximum elegance and restraint.
 * Uses Three.js CDN: https://unpkg.com/three@0.158.0/build/three.min.js
 */
(function () {
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 2));
  renderer.setSize(heroSize.w, heroSize.h);
  renderer.setClearColor(0x0C0C0A, 1);

  // ── Scene & Camera ─────────────────────────────────────────────────────────
  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    50, heroSize.w / heroSize.h, 0.1, 1000
  );
  camera.position.set(0, 0, 90);
  camera.lookAt(0, 0, 0);

  // ── Mouse tracking ──────────────────────────────────────────────────────────
  var mouse   = { x: 0, y: 0 };
  var damped  = { x: 0, y: 0 };
  document.addEventListener('mousemove', function (e) {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Layer 1: Deep aurora/noise plane ───────────────────────────────────────
  // A slow-drifting FBM noise plane in deep amber — creates an ambient glow field.
  var auroraVert = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var auroraFrag = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform float uTime;',

    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
    '}',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    'float fbm(vec2 p) {',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p); p *= 2.1; a *= 0.5;',
    '  }',
    '  return v;',
    '}',

    'void main() {',
    '  vec2 uv = vUv;',
    '  float t = uTime * 0.06;',
    '  float f = fbm(uv * 2.5 + vec2(t, t * 0.7));',
    '  float f2 = fbm(uv * 4.0 - vec2(t * 1.3, t * 0.5) + f);',
    '  float band = sin((uv.y * 3.14159) + f * 2.0) * 0.5 + 0.5;',
    '  float center = 1.0 - length(uv - 0.5) * 1.8;',
    '  center = clamp(center, 0.0, 1.0);',
    '  vec3 col = mix(vec3(0.04, 0.03, 0.02), vec3(0.16, 0.09, 0.01), band * f2);',
    '  col += vec3(0.06, 0.04, 0.01) * center;',
    '  float edge = 1.0 - clamp(length((uv - 0.5) * 1.6), 0.0, 1.0);',
    '  col *= 0.3 + edge * 0.7;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var auroraMat = new THREE.ShaderMaterial({
    vertexShader:   auroraVert,
    fragmentShader: auroraFrag,
    uniforms: { uTime: { value: 0 } },
    side: THREE.DoubleSide,
    depthWrite: false
  });
  var auroraPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 220),
    auroraMat
  );
  auroraPlane.position.z = -50;
  scene.add(auroraPlane);

  // ── Layer 2: Topographic contour rings ────────────────────────────────────
  // A slowly rotating field of bright amber contour rings — geological precision.
  var topoVert = [
    'varying vec2 vUv;',
    'varying float vElevation;',
    'uniform float uTime;',

    'void main() {',
    '  vUv = uv;',
    '  vec3 pos = position;',
    '  float h = sin(pos.x * 0.04 + uTime * 0.10) * 2.5',
    '       + sin(pos.y * 0.06 + uTime * 0.08) * 2.0',
    '       + sin((pos.x + pos.y) * 0.025 + uTime * 0.06) * 3.5;',
    '  pos.z += h;',
    '  vElevation = h;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var topoFrag = [
    'precision highp float;',
    'varying vec2 vUv;',
    'varying float vElevation;',
    'uniform float uTime;',

    'void main() {',
    '  float dist = length(vUv - 0.5) * 2.0;',
    '  float ring = sin(dist * 18.0 - uTime * 0.4 + vElevation * 0.5);',
    '  ring = smoothstep(0.3, 0.8, ring);',
    '  float alpha = ring * (1.0 - dist * 0.7);',
    '  alpha = clamp(alpha, 0.0, 1.0) * 0.45;',
    '  vec3 col = mix(vec3(0.72, 0.44, 0.08), vec3(0.96, 0.62, 0.04), vElevation * 0.15 + 0.5);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var topoMat = new THREE.ShaderMaterial({
    vertexShader:   topoVert,
    fragmentShader: topoFrag,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  var topoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 130, 70, 50),
    topoMat
  );
  topoMesh.rotation.x = -Math.PI / 2.4;
  topoMesh.position.set(0, -25, -35);
  scene.add(topoMesh);

  // ── Layer 3: Three attractor nodes ──────────────────────────────────────────
  // Each node: glowing core sphere + two orbital rings + pulsing halo + light beam.
  // Clean, minimal — no crystal wireframes.
  var nodeDefs = [
    { x: -42, y:  14, z: -20, r: 2.0, ringR: 7.0,  speed: 0.18 },
    { x:  36, y: -16, z: -30, r: 1.6, ringR: 5.5,  speed: 0.24 },
    { x:   6, y:  30, z: -12, r: 2.5, ringR: 8.5,  speed: 0.13 }
  ];

  var attractors = nodeDefs.map(function (nd, idx) {
    var group = new THREE.Group();

    // Core — glowing amber sphere
    var coreMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      emissive: 0xD97706,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75
    });
    var core = new THREE.Mesh(new THREE.SphereGeometry(nd.r, 24, 24), coreMat);
    group.add(core);

    // Atmosphere — larger translucent sphere
    var atmoMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    var atmo = new THREE.Mesh(new THREE.SphereGeometry(nd.r * 1.35, 16, 16), atmoMat);
    group.add(atmo);

    // Inner bright ring (fast orbit)
    var innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xFCD34D,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    var innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(nd.ringR * 0.6, 0.06, 8, 64),
      innerRingMat
    );
    innerRing.rotation.x = Math.PI / 2.8 + idx * 0.9;
    innerRing.rotation.z = idx * 1.2;
    group.add(innerRing);

    // Outer diffuse ring (slow counter-orbit)
    var outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xD97706,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    var outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(nd.ringR, 0.04, 8, 80),
      outerRingMat
    );
    outerRing.rotation.x = Math.PI / 2.2 + idx * 0.7;
    outerRing.rotation.y = idx * 0.85;
    group.add(outerRing);

    // Vertical light beam
    var beamMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide
    });
    var beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 120, 8),
      beamMat
    );
    group.add(beam);

    group.position.set(nd.x, nd.y, nd.z);
    group.userData = {
      ringAngle: Math.random() * Math.PI * 2,
      innerAngle: Math.random() * Math.PI * 2,
      speed: nd.speed,
      ringR: nd.ringR,
      innerRingR: nd.ringR * 0.6,
      bobOffset: idx * 2.1
    };

    scene.add(group);
    return group;
  });

  // ── Layer 4: 8,000-particle star/dust field ──────────────────────────────────
  // Particles vary in size — small = far (z-deep), large = near.
  // Creates proper z-level depth.
  var N = isMobile ? 1200 : 8000;
  var pPos = new Float32Array(N * 3);
  var pCol = new Float32Array(N * 3);
  var pScl = new Float32Array(N);
  var pVel = new Float32Array(N * 3);

  var palette = [
    { r: 0.96, g: 0.62, b: 0.04 }, // bright amber
    { r: 0.79, g: 0.64, b: 0.33 }, // muted gold
    { r: 0.91, g: 0.45, b: 0.08 }, // deep amber
    { r: 0.99, g: 0.78, b: 0.45 }  // pale gold
  ];

  for (var i = 0; i < N; i++) {
    var i3 = i * 3;
    // Distribute across the scene volume
    pPos[i3]     = (Math.random() - 0.5) * 180;
    pPos[i3 + 1] = (Math.random() - 0.5) * 110;
    pPos[i3 + 2] = (Math.random() - 0.5) * 100 - 15;

    // Size — smaller particles tend to be further away (depth cue)
    var sizeClass = Math.random();
    var baseSize;
    if (sizeClass < 0.4)       baseSize = 0.4;  // far: tiny
    else if (sizeClass < 0.75) baseSize = 0.9;  // mid
    else if (sizeClass < 0.92) baseSize = 1.6;  // near
    else                        baseSize = 2.5;  // closest: large bright stars
    pScl[i] = baseSize + Math.random() * 0.5;

    // Color from palette
    var c = palette[Math.floor(Math.random() * palette.length)];
    var jit = 0.82 + Math.random() * 0.36;
    pCol[i3]     = c.r * jit;
    pCol[i3 + 1] = c.g * jit;
    pCol[i3 + 2] = c.b * jit;

    // Slow drift velocity
    pVel[i3]     = (Math.random() - 0.5) * 0.015;
    pVel[i3 + 1] = (Math.random() - 0.5) * 0.010;
    pVel[i3 + 2] = (Math.random() - 0.5) * 0.008;
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size',     new THREE.BufferAttribute(pScl, 1));

  var pMat = new THREE.PointsMaterial({
    size:        1.2,
    sizeAttenuation: true,   // perspective depth — smaller when far
    vertexColors: true,
    transparent: true,
    opacity:     0.85,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false
  });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Animation loop ───────────────────────────────────────────────────────────
  var clock = new THREE.Clock();
  var t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += clock.getDelta();

    // Aurora plane drift
    auroraMat.uniforms.uTime.value = t;
    auroraPlane.rotation.z = t * 0.008;

    // Topographic rings animation
    topoMat.uniforms.uTime.value = t;
    topoMesh.rotation.z = t * 0.012;

    // Smooth mouse damping
    damped.x += (mouse.x - damped.x) * 0.04;
    damped.y += (mouse.y - damped.y) * 0.04;

    // Camera parallax (subtle — preserves depth)
    camera.position.x += (damped.x * 3.5 - camera.position.x) * 0.025;
    camera.position.y += (-damped.y * 2.0 + 5 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    // Topo mesh sway
    topoMesh.position.x = damped.x * 1.5;
    topoMesh.position.y = -25 + damped.y * 1.2;

    // Attractor nodes — orbit rings, pulse core, bob
    attractors.forEach(function (group) {
      var ud = group.userData;
      ud.ringAngle += ud.speed * 0.012;
      ud.innerAngle += ud.speed * 0.028;

      // Find the two ring meshes and beam
      var rings = group.children.filter(function (c) {
        return c.geometry && c.geometry.type === 'TorusGeometry';
      });
      var innerR = rings[0] || null;
      var outerR = rings[1] || null;

      if (innerR) {
        innerR.rotation.y = ud.innerAngle;
        innerR.rotation.x = Math.PI / 2.5 + Math.sin(ud.innerAngle * 0.5) * 0.15;
      }
      if (outerR) {
        outerR.rotation.y = ud.ringAngle;
        outerR.rotation.z = Math.sin(ud.ringAngle * 0.4) * 0.1;
      }

      // Core pulse (opacity)
      var core = group.children[0];
      if (core && core.material) {
        core.material.emissiveIntensity = 0.45 + Math.sin(t * 1.2 + ud.bobOffset) * 0.2;
      }

      // Beam opacity pulse
      var beam = group.children[group.children.length - 1];
      if (beam && beam.material) {
        beam.material.opacity = 0.025 + Math.sin(t * 0.8 + ud.bobOffset) * 0.012;
      }

      // Group bob
      group.position.y = nodeDefs[attractors.indexOf(group)].y +
        Math.sin(t * 0.35 + ud.bobOffset) * 1.8;
    });

    // Particle drift — toroidal wrap
    for (var i = 0; i < N; i++) {
      var i3 = i * 3;
      pPos[i3]     += pVel[i3];
      pPos[i3 + 1] += pVel[i3 + 1];
      pPos[i3 + 2] += pVel[i3 + 2];

      // Wrap
      if (pPos[i3]     >  90) pPos[i3]     = -90;
      if (pPos[i3]     < -90) pPos[i3]     =  90;
      if (pPos[i3 + 1] >  55) pPos[i3 + 1] = -55;
      if (pPos[i3 + 1] < -55) pPos[i3 + 1] =  55;
      if (pPos[i3 + 2] >  35) pPos[i3 + 2] = -85;
      if (pPos[i3 + 2] < -85) pPos[i3 + 2] =  35;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize handling ─────────────────────────────────────────────────────────
  window.addEventListener('resize', function () {
    var newHeroSize = getHeroSize();
    var newIsMobile = newHeroSize.w < 768;
    camera.aspect = newHeroSize.w / newHeroSize.h;
    camera.updateProjectionMatrix();
    renderer.setSize(newHeroSize.w, newHeroSize.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, newIsMobile ? 1.0 : 2));
  }, { passive: true });

})();
