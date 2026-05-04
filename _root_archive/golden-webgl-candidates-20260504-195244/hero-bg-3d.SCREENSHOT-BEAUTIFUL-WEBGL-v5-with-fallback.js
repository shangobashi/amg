/**
 * Afriplan — Screenshot Beautiful WebGL Hero
 * Source of truth: Screenshot 2026-05-02 224224.png
 * Three.js/WebGL renderer: full-width topographic mesh + wireframe polyhedrons
 * + orbit rings/moons + depth starfield. Designed for am.issalabs.xyz.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;

  function launchCanvasFallback(originalCanvas, reason) {
    if (window.__AFRIPLAN_HERO_FALLBACK_ACTIVE__) return;
    window.__AFRIPLAN_HERO_FALLBACK_ACTIVE__ = true;
    var hero = document.querySelector('.hero') || originalCanvas.parentElement || document.body;
    var c = document.createElement('canvas');
    c.id = 'heroBgCanvasFallback';
    c.setAttribute('aria-hidden', 'true');
    c.style.position = 'absolute';
    c.style.inset = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.zIndex = '1';
    c.style.pointerEvents = 'none';
    c.style.display = 'block';
    originalCanvas.style.display = 'none';
    hero.insertBefore(c, originalCanvas.nextSibling);
    var ctx = c.getContext('2d', { alpha: true });
    if (!ctx) return;
    var W = 1, H = 1, DPR = 1, CX = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var stars = [];
    var start = performance.now();
    var GOLD = '201,164,84', AMBER = '245,158,11', PALE = '255,229,168';
    function resizeFallback() {
      var r = hero.getBoundingClientRect();
      W = Math.max(320, Math.round(r.width || window.innerWidth));
      H = Math.max(520, Math.round(r.height || window.innerHeight * 0.92));
      DPR = Math.min(window.devicePixelRatio || 1, W < 768 ? 1 : 1.5);
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(DPR,0,0,DPR,0,0); CX = W * 0.5;
      stars = [];
      for (var i=0;i<(W<768?220:520);i++) stars.push({x:Math.random()*W,y:Math.random()*H*0.76,z:Math.random(),p:Math.random()*6.28});
    }
    function height(x,z,t){return Math.sin(x*.055+t*.42)*9+Math.sin(z*.075-t*.3)*7+Math.sin((x+z)*.035+t*.22)*12+22*Math.exp(-((x+70)*(x+70)+(z-18)*(z-18))/2700)+18*Math.exp(-((x-60)*(x-60)+(z+6)*(z+6))/2300);}
    function project(x,y,z){var s=390/Math.max(42,z+160);return {x:CX+x*s+mouse.x*14,y:H*.69-y*s*.72+(z-40)*1.55+mouse.y*7};}
    function poly(cx,cy,r,t,ring){
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*.18); ctx.strokeStyle='rgba('+GOLD+',.42)'; ctx.lineWidth=1;
      var n=12, pts=[]; for(var i=0;i<n;i++){var aa=i/n*6.283+t*.25; var rr=r*(.82+((i%3)*.09)); pts.push([Math.cos(aa)*rr,Math.sin(aa)*rr]);}
      ctx.beginPath(); for(var a=0;a<n;a++){for(var b=a+1;b<n;b++){if((a+b)%5===0||Math.abs(a-b)===1){ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);}}} ctx.stroke();
      if(ring){ctx.rotate(.65);ctx.scale(1.35,.42);ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.75,0,0,6.283);ctx.strokeStyle='rgba('+PALE+',.48)';ctx.stroke();ctx.setTransform(DPR,0,0,DPR,0,0);var ma=t*.55;ctx.fillStyle='rgba('+PALE+',.9)';ctx.beginPath();ctx.arc(cx+Math.cos(ma)*r*1.8,cy+Math.sin(ma)*r*.55,4.8,0,6.283);ctx.fill();}
      ctx.restore();
    }
    function draw(now){var t=(now-start)/1000; mouse.x+=(mouse.tx-mouse.x)*.045; mouse.y+=(mouse.ty-mouse.y)*.045; ctx.clearRect(0,0,W,H);
      var bg=ctx.createRadialGradient(CX,H*.42,0,CX,H*.42,Math.max(W,H)*.78); bg.addColorStop(0,'rgba(61,40,13,.92)'); bg.addColorStop(.28,'rgba(17,15,11,.98)'); bg.addColorStop(1,'rgba(0,0,0,1)'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation='screen'; for(var i=0;i<stars.length;i++){var s=stars[i], tw=.65+.35*Math.sin(t*.7+s.p);ctx.fillStyle='rgba('+ (s.z>.78?PALE:GOLD) +','+(.12+s.z*.38)*tw+')';ctx.beginPath();ctx.arc(s.x+mouse.x*(4+s.z*10),s.y+mouse.y*(2+s.z*7),.45+s.z*1.8,0,6.283);ctx.fill();}
      var pts=[], cols=W<768?42:82, rows=W<768?20:38; for(var j=0;j<rows;j++){for(var k=0;k<cols;k++){var x=(k/(cols-1)-.5)*230,z=(j/(rows-1))*150-18,y=height(x,z,t);pts.push(project(x,y,z));}}
      for(var jj=0;jj<rows;jj++){for(var ii=0;ii<cols;ii++){var id=jj*cols+ii,p=pts[id],boost=Math.max(0,(p.y-H*.45)/(H*.42));ctx.strokeStyle='rgba('+GOLD+','+Math.min(.48,.07+boost*.27)+')';ctx.lineWidth=.82;if(ii<cols-1){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+1].x,pts[id+1].y);ctx.stroke();}if(jj<rows-1){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+cols].x,pts[id+cols].y);ctx.stroke();}if(ii<cols-1&&jj<rows-1&&(ii+jj)%2===0){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+cols+1].x,pts[id+cols+1].y);ctx.stroke();}}}
      poly(W*.18,H*.25,42,t,true); poly(W*.82,H*.25,38,-t,true); poly(W*.62,H*.38,26,t*.8,false); poly(W*.34,H*.54,28,-t*.7,false);
      ctx.globalCompositeOperation='source-over'; var bot=ctx.createLinearGradient(0,H*.72,0,H);bot.addColorStop(0,'rgba(12,12,10,0)');bot.addColorStop(1,'rgba(12,12,10,.86)');ctx.fillStyle=bot;ctx.fillRect(0,H*.7,W,H*.3);
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resizeFallback, {passive:true}); window.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();mouse.tx=((e.clientX-r.left)/Math.max(1,r.width)-.5)*2;mouse.ty=((e.clientY-r.top)/Math.max(1,r.height)-.5)*2;},{passive:true});
    resizeFallback(); requestAnimationFrame(draw);
    window.__AFRIPLAN_HERO_WEBGL__ = { version:'webgl-fallback-canvas-active', renderer:'canvas2d-fallback', reason: reason, fullWidthMesh:true, polyhedrons:4, orbitRings:2 };
  }

  function boot() {
    if (!window.THREE) {
      setTimeout(boot, 30);
      return;
    }

    var THREE = window.THREE;
    var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
    var isDestroyed = false;
    var clock = new THREE.Clock();
    var size = { w: 1, h: 1 };
    var isMobile = false;
    var mouse = new THREE.Vector2(0, 0);
    var dampedMouse = new THREE.Vector2(0, 0);

    function readSize() {
      var r = hero.getBoundingClientRect();
      size.w = Math.max(320, Math.round(r.width || window.innerWidth));
      size.h = Math.max(520, Math.round(r.height || window.innerHeight * 0.92));
      isMobile = size.w < 768;
    }

    readSize();

    // Opaque WebGL canvas. No alpha trap, no transparent black failure.
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
    } catch (err) {
      launchCanvasFallback(canvas, 'webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x050504, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));
    renderer.setSize(size.w, size.h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;
    var glContext = renderer.getContext();
    if (!glContext || glContext.isContextLost()) {
      launchCanvasFallback(canvas, 'webgl-context-lost-at-init');
      return;
    }

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050504, 0.0105);

    var camera = new THREE.PerspectiveCamera(46, size.w / size.h, 0.1, 900);
    camera.position.set(0, 18, 118);
    camera.lookAt(0, -8, -42);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 0: deep radial WebGL backdrop, independent from CSS aurora.
    // ────────────────────────────────────────────────────────────────────────
    var backdropUniforms = {
      uTime: { value: 0 },
      uAspect: { value: size.w / size.h },
      uMouse: { value: new THREE.Vector2() }
    };
    var backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: backdropUniforms,
        vertexShader: [
          'varying vec2 vUv;',
          'void main(){',
          '  vUv = uv;',
          '  gl_Position = vec4(position.xy, 0.0, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'precision mediump float;',
          'varying vec2 vUv;',
          'uniform float uTime;',
          'uniform float uAspect;',
          'uniform vec2 uMouse;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
          'float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }',
          'float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }',
          'void main(){',
          '  vec2 uv = vUv;',
          '  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);',
          '  vec2 center = vec2(uMouse.x * 0.055, -0.02 + uMouse.y * 0.025);',
          '  float d = length(p - center);',
          '  float n = fbm(uv * 3.2 + vec2(uTime * 0.018, -uTime * 0.012));',
          '  float core = smoothstep(0.72, 0.03, d);',
          '  float band = smoothstep(0.95, 0.08, abs((p.y + p.x * 0.18) + sin(uv.x * 2.4 + uTime * 0.05) * 0.025));',
          '  vec3 black = vec3(0.012,0.011,0.009);',
          '  vec3 amber = vec3(0.79,0.55,0.20);',
          '  vec3 gold = vec3(0.96,0.72,0.30);',
          '  vec3 col = black;',
          '  col += amber * core * (0.19 + n * 0.08);',
          '  col += gold * band * 0.025;',
          '  col *= 1.0 - smoothstep(0.42, 1.05, d) * 0.84;',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      })
    );
    backdrop.renderOrder = -100;
    scene.add(backdrop);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 1: depth-varied starfield. Moderate; expensive, not noisy.
    // ────────────────────────────────────────────────────────────────────────
    var starCount = isMobile ? 460 : 1350;
    var starPos = new Float32Array(starCount * 3);
    var starCol = new Float32Array(starCount * 3);
    var starSize = new Float32Array(starCount);
    for (var i = 0; i < starCount; i++) {
      var i3 = i * 3;
      var depth = Math.random();
      starPos[i3] = (Math.random() - 0.5) * 260;
      starPos[i3 + 1] = -4 + Math.random() * 92;
      starPos[i3 + 2] = -180 + Math.random() * 170;
      var warm = 0.65 + Math.random() * 0.35;
      starCol[i3] = 0.72 + warm * 0.28;
      starCol[i3 + 1] = 0.50 + warm * 0.30;
      starCol[i3 + 2] = 0.20 + warm * 0.18;
      starSize[i] = 0.55 + Math.pow(depth, 2.0) * (isMobile ? 1.2 : 2.5);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
    var starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: [
        'attribute float aSize;',
        'varying vec3 vColor;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'void main(){',
        '  vColor = color;',
        '  vec3 p = position;',
        '  p.x += uMouse.x * (4.0 + aSize * 1.8) + sin(uTime * 0.12 + position.z * 0.03) * 0.8;',
        '  p.y += uMouse.y * (2.0 + aSize) + cos(uTime * 0.10 + position.x * 0.02) * 0.45;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * (210.0 / max(35.0, -mv.z));',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying vec3 vColor;',
        'void main(){',
        '  vec2 d = gl_PointCoord - vec2(0.5);',
        '  float a = 1.0 - smoothstep(0.05, 0.48, length(d));',
        '  gl_FragColor = vec4(vColor, a * 0.62);',
        '}'
      ].join('\n')
    });
    var stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -20;
    scene.add(stars);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 2: full-width topographic mesh. This is the visual foundation.
    // It deliberately overfills the viewport horizontally like the screenshot.
    // ────────────────────────────────────────────────────────────────────────
    var terrainUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() }
    };
    var terrainGeo = new THREE.PlaneGeometry(430, 210, isMobile ? 74 : 132, isMobile ? 36 : 58);
    var terrainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      uniforms: terrainUniforms,
      vertexShader: [
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'varying float vIntensity;',
        'varying vec2 vUv;',
        'float bump(vec2 p, vec2 c, float power, float radius){',
        '  float d = distance(p, c);',
        '  return power * exp(-(d*d) / radius);',
        '}',
        'void main(){',
        '  vUv = uv;',
        '  vec3 p = position;',
        '  float t = uTime;',
        '  float h = 0.0;',
        '  h += sin(p.x * 0.035 + t * 0.42) * 5.5;',
        '  h += sin(p.y * 0.055 - t * 0.31) * 4.0;',
        '  h += sin((p.x + p.y) * 0.026 + t * 0.22) * 8.0;',
        '  h += bump(p.xy, vec2(-74.0, 22.0), 18.0, 2600.0);',
        '  h += bump(p.xy, vec2(58.0, -8.0), 15.0, 2200.0);',
        '  h -= bump(p.xy, vec2(4.0, 52.0), 12.0, 3400.0);',
        '  float contour = abs(sin(h * 0.44 + t * 0.10));',
        '  vIntensity = 0.18 + smoothstep(0.52, 1.0, contour) * 0.48 + smoothstep(0.15, 0.82, uv.y) * 0.20;',
        '  p.z += h;',
        '  p.x += uMouse.x * 4.0 * (0.2 + uv.y);',
        '  p.z += uMouse.y * 2.5 * (0.2 + uv.y);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying float vIntensity;',
        'varying vec2 vUv;',
        'void main(){',
        '  float edgeFade = smoothstep(0.00, 0.10, vUv.x) * smoothstep(1.00, 0.90, vUv.x);',
        '  float horizonFade = smoothstep(0.03, 0.20, vUv.y);',
        '  vec3 gold = vec3(0.82, 0.62, 0.25);',
        '  vec3 bright = vec3(1.00, 0.78, 0.34);',
        '  vec3 col = mix(gold, bright, vIntensity);',
        '  float alpha = (0.18 + vIntensity * 0.55) * edgeFade * horizonFade;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });
    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2.55;
    terrain.position.set(0, -82, -70);
    terrain.scale.set(1.28, 1.0, 1.0);
    terrain.renderOrder = 1;
    scene.add(terrain);

    // A subtle point lattice on the same field gives the screenshot its mineral-map sparkle.
    var lattice = new THREE.Points(
      terrainGeo.clone(),
      new THREE.PointsMaterial({
        color: 0xe8c878,
        size: isMobile ? 0.34 : 0.46,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      })
    );
    lattice.rotation.copy(terrain.rotation);
    lattice.position.copy(terrain.position);
    lattice.scale.copy(terrain.scale);
    lattice.renderOrder = 2;
    scene.add(lattice);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 3: floating wireframe polyhedrons with planet-like rings/moons.
    // ────────────────────────────────────────────────────────────────────────
    var crystalMat = new THREE.MeshBasicMaterial({
      color: 0xc9a454,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xe8c878,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var moonMat = new THREE.MeshBasicMaterial({
      color: 0xffe5a8,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    function addCrystal(def) {
      var group = new THREE.Group();
      group.position.set(def.x, def.y, def.z);
      group.userData = {
        baseY: def.y,
        speed: def.speed,
        phase: def.phase,
        moonPhase: def.moonPhase || 0,
        hasRing: !!def.ring
      };

      var geo = def.kind === 'oct'
        ? new THREE.OctahedronGeometry(def.r, 0)
        : new THREE.IcosahedronGeometry(def.r, 0);
      var body = new THREE.Mesh(geo, crystalMat.clone());
      body.material.opacity = def.opacity || 0.32;
      body.renderOrder = 5;
      group.add(body);
      group.userData.body = body;

      if (def.ring) {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(def.r * 1.62, Math.max(0.055, def.r * 0.018), 6, 128),
          ringMat.clone()
        );
        ring.rotation.x = def.ringX;
        ring.rotation.y = def.ringY;
        ring.rotation.z = def.ringZ;
        ring.material.opacity = def.ringOpacity || 0.38;
        ring.renderOrder = 4;
        group.add(ring);
        group.userData.ring = ring;

        var moon = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.85, def.r * 0.135), 18, 18), moonMat.clone());
        moon.renderOrder = 6;
        group.add(moon);
        group.userData.moon = moon;
        group.userData.moonRadius = def.r * 1.58;
      }

      scene.add(group);
      return group;
    }

    var crystals = [
      addCrystal({ kind: 'ico', x: -82, y: 38, z: -74, r: 10.5, speed: 0.20, phase: 0.2, ring: true,  ringX: 1.18, ringY: 0.25, ringZ: 0.74, ringOpacity: 0.62, moonPhase: 0.3, opacity: 0.38 }),
      addCrystal({ kind: 'ico', x:  83, y: 41, z: -82, r:  9.5, speed:-0.17, phase: 1.8, ring: true,  ringX: 1.34, ringY:-0.20, ringZ:-0.55, ringOpacity: 0.60, moonPhase: 2.5, opacity: 0.36 }),
      addCrystal({ kind: 'ico', x:  34, y: 19, z: -55, r:  5.8, speed: 0.24, phase: 3.1, ring: false, opacity: 0.28 }),
      addCrystal({ kind: 'oct', x: -28, y: -6, z: -44, r:  6.8, speed:-0.15, phase: 4.0, ring: false, opacity: 0.22 })
    ];

    // ────────────────────────────────────────────────────────────────────────
    // Layer 4: restrained attractor nodes embedded near the terrain.
    // ────────────────────────────────────────────────────────────────────────
    function addAttractor(x, y, z, radius, ringR, phase) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      g.userData = { baseY: y, phase: phase };
      var core = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xf5b642, transparent: true, opacity: 0.62, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 2.6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xc9a454, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.055, 5, 80),
        new THREE.MeshBasicMaterial({ color: 0xe8c878, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      ring.rotation.x = Math.PI / 2.9;
      ring.rotation.y = phase * 0.12;
      g.add(halo); g.add(core); g.add(ring);
      g.userData.core = core;
      g.userData.halo = halo;
      g.userData.ring = ring;
      scene.add(g);
      return g;
    }
    var attractors = [
      addAttractor(-42, -8, -54, 1.4, 5.9, 0.0),
      addAttractor( 38, -16, -68, 1.1, 5.0, 2.0),
      addAttractor(  8,  18, -60, 1.8, 7.0, 4.2)
    ];

    // ────────────────────────────────────────────────────────────────────────
    // Resize / input / animation.
    // ────────────────────────────────────────────────────────────────────────
    function resize() {
      readSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));
      renderer.setSize(size.w, size.h, false);
      backdropUniforms.uAspect.value = size.w / size.h;
      // Make the terrain always overfill the viewport width, including ultra-wide.
      var aspectBoost = Math.max(1.0, (size.w / Math.max(1, size.h)) / 1.65);
      terrain.scale.x = 1.28 * aspectBoost;
      lattice.scale.copy(terrain.scale);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('beforeunload', function () { isDestroyed = true; });
    resize();

    function animate() {
      if (isDestroyed) return;
      var t = clock.getElapsedTime();
      dampedMouse.x += (mouse.x - dampedMouse.x) * 0.045;
      dampedMouse.y += (mouse.y - dampedMouse.y) * 0.045;

      backdropUniforms.uTime.value = t;
      backdropUniforms.uMouse.value.copy(dampedMouse);
      terrainUniforms.uTime.value = t;
      terrainUniforms.uMouse.value.copy(dampedMouse);
      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uMouse.value.copy(dampedMouse);

      terrain.rotation.z = Math.sin(t * 0.055) * 0.012 + dampedMouse.x * 0.010;
      lattice.rotation.copy(terrain.rotation);

      stars.rotation.y = dampedMouse.x * 0.018 + Math.sin(t * 0.025) * 0.006;
      stars.rotation.x = dampedMouse.y * 0.010;

      for (var i = 0; i < crystals.length; i++) {
        var c = crystals[i];
        var ud = c.userData;
        c.position.y = ud.baseY + Math.sin(t * 0.32 + ud.phase) * 1.6;
        c.rotation.x += ud.speed * 0.006;
        c.rotation.y += ud.speed * 0.009;
        c.rotation.z += ud.speed * 0.004;
        if (ud.ring) {
          ud.ring.rotation.z += ud.speed * 0.010;
          var a = t * (0.34 + Math.abs(ud.speed)) + ud.moonPhase;
          var rr = ud.moonRadius;
          ud.moon.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.36, Math.sin(a) * rr * 0.18);
        }
      }

      for (var j = 0; j < attractors.length; j++) {
        var aNode = attractors[j];
        var au = aNode.userData;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.85 + au.phase);
        aNode.position.y = au.baseY + Math.sin(t * 0.38 + au.phase) * 1.15;
        au.core.material.opacity = 0.44 + pulse * 0.18;
        au.halo.material.opacity = 0.055 + pulse * 0.045;
        au.ring.material.opacity = 0.16 + pulse * 0.10;
        au.ring.rotation.z += 0.0035 + j * 0.0008;
      }

      camera.position.x = dampedMouse.x * 3.5;
      camera.position.y = 18 + dampedMouse.y * 1.8;
      camera.lookAt(dampedMouse.x * 2.0, -9 + dampedMouse.y * 1.2, -44);
      renderer.render(scene, camera);
      var liveGl = renderer.getContext();
      if (t > 0.35 && (!liveGl || liveGl.isContextLost() || liveGl.drawingBufferWidth === 0 || liveGl.drawingBufferHeight === 0)) {
        launchCanvasFallback(canvas, 'webgl-zero-drawing-buffer');
        return;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__AFRIPLAN_HERO_WEBGL__ = {
      version: 'screenshot-beautiful-webgl-v4-preserve-buffer',
      renderer: 'three-webgl',
      terrainWidth: 430,
      terrainSegments: isMobile ? '74x36' : '132x58',
      fullWidthMesh: true,
      polyhedrons: crystals.length,
      orbitRings: 2,
      starCount: starCount
    };
  }

  boot();
})();
