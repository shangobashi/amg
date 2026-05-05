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
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var clock = new THREE.Clock();
    var size = { w: 1, h: 1 };
    var isMobile = false;
    var mouse = new THREE.Vector2(0, 0);
    var dampedMouse = new THREE.Vector2(0, 0);

    // iOS-safe viewport reading: use visualViewport when available
    function readSize() {
      var r = hero.getBoundingClientRect();
      var vv = window.visualViewport;
      if (vv) {
        // visualViewport gives the actual visible area (excludes address bar)
        size.w = Math.max(320, Math.round(r.width || vv.width));
        size.h = Math.max(520, Math.round(r.height || vv.height));
      } else {
        size.w = Math.max(320, Math.round(r.width || window.innerWidth));
        size.h = Math.max(520, Math.round(r.height || window.innerHeight));
      }
      isMobile = size.w < 768;
    }

    readSize();

    // Opaque WebGL canvas. No alpha trap, no transparent black failure.
    var renderer;
    var glContext;

    // iOS conservative renderer settings
    var iosPixelRatio = Math.min(window.devicePixelRatio || 1, isIOS ? 2 : 2);
    var iosAntialias = !isMobile && !isIOS; // disable on iOS for stability
    var iosPower = isIOS ? 'default' : 'high-performance';

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: iosAntialias,
        powerPreference: iosPower,
        // Keep buffer so the dark clear color stays between frames.
        preserveDrawingBuffer: true
      });
    } catch (err) {
      launchCanvasFallback(canvas, 'webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x020201, 1);
    renderer.setPixelRatio(iosPixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;

    // Force canvas element to near-black CSS background so the body white
    // does not bleed through when WebGL paints its opaque framebuffer.
    canvas.style.background = 'rgb(2,2,1)';

    glContext = renderer.getContext();
    if (!glContext || glContext.isContextLost()) {
      launchCanvasFallback(canvas, 'webgl-context-lost-at-init');
      return;
    }

    // iOS context loss recovery
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      launchCanvasFallback(canvas, 'webgl-context-lost');
    }, false);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020201, 0.0085);

    var camera = new THREE.PerspectiveCamera(46, size.w / size.h, 0.1, 900);
    camera.position.set(0, 26, 118);
    camera.lookAt(0, 2, -44);

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
          '  vec3 black = vec3(0.006,0.006,0.005);',
          '  vec3 amber = vec3(0.79,0.55,0.20);',
          '  vec3 gold = vec3(0.96,0.72,0.30);',
          '  vec3 col = black;',
          '  col += amber * core * (0.12 + n * 0.05);',
          '  col += gold * band * 0.016;',
          '  col *= 1.0 - smoothstep(0.42, 1.05, d) * 0.84;',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      })
    );
    backdrop.renderOrder = -100;
    // Do NOT add to scene — backdrop is a full-frame quad that paints bright
    // amber/gold at full opacity, washing out hero text. The fog still affects
    // 3D objects (terrain, stars, crystals) without an opaque background plane.
    // scene.add(backdrop);

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
      var warm = 0.50 + Math.random() * 0.30;
      starCol[i3] = 0.42 + warm * 0.28;
      starCol[i3 + 1] = 0.24 + warm * 0.22;
      starCol[i3 + 2] = 0.05 + warm * 0.10;
      starSize[i] = 0.55 + Math.pow(depth, 2.0) * (isMobile ? 1.2 : 2.5);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
    var starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: [
        'attribute float aSize;',
        'varying vec3 vColor;',
        'varying float vPulse;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'void main(){',
        '  vec3 p = position;',
        '  vec2 cursor = vec2(uMouse.x * 118.0, 22.0 + uMouse.y * 44.0);',
        '  vec2 delta = cursor - p.xy;',
        '  float dist = length(delta);',
        '  float attract = smoothstep(96.0, 0.0, dist);',
        '  vec2 radial = delta / max(dist, 0.001);',
        '  vec2 tangent = vec2(-radial.y, radial.x);',
        '  p.xy += radial * attract * (6.5 + aSize * 1.8);',
        '  p.xy += tangent * attract * (1.8 + aSize * 0.45) * sin(uTime * 0.9 + dist * 0.05);',
        '  p.z += attract * (4.5 + aSize * 1.4);',
        '  p.x += sin(uTime * 0.12 + position.z * 0.03) * 0.35;',
        '  p.y += cos(uTime * 0.10 + position.x * 0.02) * 0.22;',
        '  vPulse = attract;',
        '  vColor = mix(color, vec3(0.66, 0.42, 0.12), attract * 0.55);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * (210.0 / max(35.0, -mv.z)) * (1.0 + attract * 0.65);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying vec3 vColor;',
        'varying float vPulse;',
        'void main(){',
        '  vec2 d = gl_PointCoord - vec2(0.5);',
        '  float a = 1.0 - smoothstep(0.05, 0.48, length(d));',
        '  a *= (0.32 + vPulse * 0.36);',
        '  gl_FragColor = vec4(vColor, a);',
        '}'
      ].join('\n')
    });
    var stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -20;
    scene.add(stars);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 2: shaped topographic mesh. The footprint is actual geometry:
    // bounded foreground, organic sides, and a long dissolving recession tail.
    // ────────────────────────────────────────────────────────────────────────
    var terrainUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() }
    };
    function createGoldenTerrainGeometry() {
      var cols = isMobile ? 78 : 144;
      var rows = isMobile ? 52 : 92;
      var terrainW = 430;
      var terrainH = 330;
      var verts = [];
      var uvs = [];
      var indices = [];

      function ss(a, b, x) {
        var t = Math.max(0, Math.min(1, (x - a) / Math.max(0.0001, b - a)));
        return t * t * (3 - 2 * t);
      }
      function mix(a, b, t) { return a + (b - a) * t; }

      for (var j = 0; j <= rows; j++) {
        var v = j / rows;
        // v=0 is the distant horizon/tail, v=1 is the foreground. The golden
        // reference feels infinite because the far rows exist but dissolve;
        // it does not rely on a chopped last row or a rectangular foreground.
        var tailOpen = ss(0.00, 0.34, v);
        var midSwell = ss(0.18, 0.58, v) * (1.0 - ss(0.74, 1.00, v));
        var nearFrame = ss(0.64, 1.00, v);
        var baseWidth = 0.20 + tailOpen * 0.34 + midSwell * 0.18 - nearFrame * 0.10;
        baseWidth = Math.max(0.18, Math.min(0.66, baseWidth));
        var sideAmp = 0.024 + 0.030 * (1.0 - Math.abs(v - 0.52) * 1.6);
        var leftNoise = sideAmp * Math.sin(v * 8.0 + 1.7) + 0.018 * Math.sin(v * 23.0);
        var rightNoise = sideAmp * Math.sin(v * 7.2 + 3.4) + 0.016 * Math.sin(v * 19.0 + 0.8);
        var leftBound = -baseWidth + leftNoise;
        var rightBound = baseWidth + rightNoise;

        for (var i = 0; i <= cols; i++) {
          var u = i / cols;
          var xNorm = mix(leftBound, rightBound, u);
          var edgeBow = (u - 0.5) * (u - 0.5) * (0.030 * Math.sin(v * 10.0 + 0.5));
          var x = (xNorm + edgeBow) * terrainW * 0.5;
          var y = (v - 0.5) * terrainH;
          verts.push(x, y, 0);
          uvs.push(u, v);
        }
      }

      // Keep the full tail geometry in the index buffer. Opacity, contour, and
      // fog fade it out progressively so the eye never sees the mesh terminate.
      // Omit only the absolute nearest strip to prevent a broad bottom rail.
      for (var row = 0; row < rows - 1; row++) {
        for (var col = 0; col < cols; col++) {
          var a = row * (cols + 1) + col;
          var b = a + 1;
          var c = (row + 1) * (cols + 1) + col;
          var d = c + 1;
          if (row < rows - 3) indices.push(a, c, b);
          if (row > 0) indices.push(b, c, d);
        }
      }

      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeBoundingSphere();
      return geo;
    }

    var terrainGeo = createGoldenTerrainGeometry();
    var terrainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: true,
      blending: THREE.NormalBlending,
      uniforms: terrainUniforms,
      vertexShader: [
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'varying float vContour;',
        'varying float vSecondary;',
        'varying float vCursor;',
        'varying float vActivity;',
        'varying vec2 vUv;',
        'float bump(vec2 p, vec2 c, float power, float radius){',
        '  float d = distance(p, c);',
        '  return power * exp(-(d*d) / radius);',
        '}',
        'void main(){',
        '  vUv = uv;',
        '  vec3 p = position;',
        '  float t = uTime;',
        '  float baseH = 0.0;',
        '  baseH += sin(p.x * 0.035) * 5.5;',
        '  baseH += sin(p.y * 0.055) * 4.0;',
        '  baseH += sin((p.x + p.y) * 0.026) * 8.0;',
        '  baseH += bump(p.xy, vec2(-74.0, 22.0), 18.0, 2600.0);',
        '  baseH += bump(p.xy, vec2(58.0, -8.0), 15.0, 2200.0);',
        '  baseH -= bump(p.xy, vec2(4.0, 52.0), 12.0, 3400.0);',
        '  float tail = smoothstep(0.00, 0.34, uv.y);',
        '  float foreground = smoothstep(0.62, 1.00, uv.y);',
        '  float depthPhase = t * 0.18 + uv.y * 10.5;',
        '  float breath = 0.91 + 0.09 * sin(t * 0.42 + uv.y * 5.4);',
        '  float downstream = sin((p.y * 0.024) - t * 0.34) * 1.15 + sin((p.x * 0.018 + p.y * 0.013) - t * 0.21) * 0.85;',
        '  float tailSwell = sin(depthPhase + p.x * 0.014) * 1.75 * (1.0 - foreground) * tail;',
        '  p.y += (sin(depthPhase * 0.72 + p.x * 0.010) * 1.25) * tail * (1.0 - foreground * 0.65);',
        '  p.x += sin(depthPhase * 0.46 + p.y * 0.010) * 0.95 * tail * (1.0 - foreground * 0.70);',
        '  vec2 cursor = vec2(uMouse.x * 95.0, uMouse.y * 32.0 - 8.0);',
        '  vec2 delta = p.xy - cursor;',
        '  float dist = length(delta);',
        '  float cursorLift = smoothstep(72.0, 0.0, dist);',
        '  float h = baseH * breath + downstream * tail + tailSwell + cursorLift * 4.2;',
        '  float contour = abs(sin(h * 0.44 + t * 0.10 + uv.y * 1.6));',
        '  // Three-level hierarchy:',
        '  // Level 3 primary: contour peaks + cursor — the golden active topology',
        '  vContour = smoothstep(0.44, 0.96, contour);',
        '  vCursor = cursorLift;',
        '  // Level 2 secondary: spatial structure, depth bands, bump features',
        '  vSecondary = smoothstep(0.12, 0.74, uv.y) * 0.55 + tail * 0.28 + smoothstep(0.55, 0.88, uv.y) * foreground * 0.20;',
        '  vSecondary = clamp(vSecondary, 0.0, 1.0);',
        '  // Level 1 ghost: everything else — barely visible bronze support lattice',
        '  vActivity = vContour * 0.65 + vCursor * 0.25;',
        '  p.z += h;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying float vContour;',
        'varying float vSecondary;',
        'varying float vCursor;',
        'varying float vActivity;',
        'varying vec2 vUv;',
        'void main(){',
        '  float edgeFade = smoothstep(0.00, 0.18, vUv.x) * smoothstep(1.00, 0.82, vUv.x);',
        '  float tailFade = smoothstep(0.00, 0.34, vUv.y);',
        '  float nearFade = 1.0 - smoothstep(0.92, 1.00, vUv.y) * 0.55;',
        '  float horizonFade = smoothstep(0.02, 0.24, vUv.y);',
        '  float fade = edgeFade * tailFade * horizonFade * nearFade;',
        '  // Level 1 — ghost terrain: dark earthy bronze, barely visible',
        '  vec3 ghostBronze = vec3(0.24, 0.16, 0.04);',
        '  float ghostAlpha = 0.028 * fade;',
        '  // Level 2 — secondary activity: muted amber support lattice',
        '  vec3 mutedAmber = vec3(0.52, 0.34, 0.10);',
        '  float secondaryAlpha = vSecondary * 0.28 * fade;',
        '  // Level 3 — primary activity: refined gold on contour/cursor',
        '  vec3 refinedGold = vec3(0.80, 0.55, 0.16);',
        '  vec3 brightGold = vec3(0.92, 0.68, 0.22);',
        '  float primaryAlpha = (vContour * 0.68 + vCursor * 0.38) * fade;',
        '  vec3 primaryColor = mix(refinedGold, brightGold, vContour * 0.55 + vCursor * 0.35);',
        '  // Build final color hierarchically — gold wins where activity is high',
        '  float ghostW = max(0.0, 1.0 - vActivity * 2.2);',
        '  float secondaryW = clamp(vSecondary * (1.0 - vActivity) * 1.8, 0.0, 1.0);',
        '  float primaryW = clamp(vActivity * 2.8, 0.0, 1.0);',
        '  float totalW = ghostW + secondaryW + primaryW;',
        '  vec3 col = (ghostBronze * ghostW + mutedAmber * secondaryW + primaryColor * primaryW) / max(totalW, 0.001);',
        '  // Compose alpha: ghost always present, secondary adds structure, primary carries gold',
        '  float alpha = ghostAlpha + secondaryAlpha + primaryAlpha;',
        '  alpha = clamp(alpha, 0.0, 0.94);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });
    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2.55;
    terrain.position.set(0, -126, -86);
    terrain.scale.set(1.18, 1.08, 1.0);
    terrain.renderOrder = 1;
    scene.add(terrain);

    // A subtle point lattice on the same field gives the screenshot its mineral-map sparkle.
    var lattice = new THREE.Points(
      terrainGeo.clone(),
      new THREE.PointsMaterial({
        color: 0x925c12,
        size: isMobile ? 0.34 : 0.46,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.NormalBlending
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
      color: 0x784c0e,
      wireframe: true,
      transparent: true,
      opacity: 0.21,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x925c12,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    var moonMat = new THREE.MeshBasicMaterial({
      color: 0xAA6D16,
      transparent: true,
      opacity: 0.57,
      depthWrite: false,
      blending: THREE.NormalBlending
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
        new THREE.MeshBasicMaterial({ color: 0xC4811F, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.NormalBlending })
      );
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 2.6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x784c0e, transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.NormalBlending })
      );
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.055, 5, 80),
        new THREE.MeshBasicMaterial({ color: 0x925c12, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending })
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

      // CRITICAL for iOS: set BOTH drawing buffer size AND CSS dimensions
      // iOS needs explicit CSS width/height or it may render at wrong size
      var DPR = Math.min(window.devicePixelRatio || 1, isIOS ? 2 : 2);
      renderer.setPixelRatio(DPR);
      renderer.setSize(size.w, size.h, false);
      // Sync CSS dimensions to match drawing buffer (critical for iOS Safari)
      canvas.style.width = size.w + 'px';
      canvas.style.height = size.h + 'px';

      backdropUniforms.uAspect.value = size.w / size.h;
      // Preserve a bounded mesh on wide screens; do not let the foreground
      // become an edge-to-edge floor just because the viewport is ultra-wide.
      var aspectBoost = Math.max(0.92, Math.min(1.08, (size.w / Math.max(1, size.h)) / 1.70));
      terrain.scale.x = 1.18 * aspectBoost;
      lattice.scale.copy(terrain.scale);
    }

    window.addEventListener('resize', resize, { passive: true });
    // iOS orientationchange — resize may not fire on rotation
    window.addEventListener('orientationchange', function () {
      setTimeout(resize, 150);
      setTimeout(resize, 600);
    }, { passive: true });
    // visualViewport resize — iOS address bar shows/hides without window.resize
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        setTimeout(resize, 80);
        setTimeout(resize, 300);
      }, { passive: true });
      window.visualViewport.addEventListener('scroll', function () {
        setTimeout(resize, 80);
      }, { passive: true });
    }
    // iOS reliability: force resize at 250ms and 1000ms after load
    setTimeout(resize, 250);
    setTimeout(resize, 1000);
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

      terrain.rotation.z = Math.sin(t * 0.055) * 0.004;
      lattice.rotation.copy(terrain.rotation);

      stars.rotation.y = Math.sin(t * 0.025) * 0.004;
      stars.rotation.x = 0.0;

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

      camera.position.x = 0;
      camera.position.y = 26;
      camera.lookAt(0, 2, -44);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__AFRIPLAN_HERO_WEBGL__ = {
      version: 'webgl-mesh-texture-hierarchy-01',
      renderer: 'three-webgl',
      iOSSafe: true,
      terrainWidth: 430,
      terrainSegments: isMobile ? '78x52-infinite-tail' : '144x92-infinite-tail',
      fullWidthMesh: false,
      shapedGeometry: true,
      shaderMaskPrimary: false,
      polyhedrons: crystals.length,
      orbitRings: 2,
      starCount: starCount
    };
  }

  boot();
})();
