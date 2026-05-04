/**
 * Afriplan — Hero Geological Intelligence Map v2
 * Animated gold geological field: warped heightfield terrain mesh,
 * floating mineral schematics, amber dust, cinematic depth.
 *
 * Built from spec: organic geological terrain, contour-derived
 * brightness, suspended mineral wireframes, premium dark aesthetic.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;

  function boot() {
    if (!window.THREE) { setTimeout(boot, 30); return; }
    var THREE = window.THREE;
    var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
    var destroyed = false;
    var clock = new THREE.Clock();
    var size = { w: 1, h: 1 };
    var isMobile = false;
    var mouse = new THREE.Vector2();
    var damped = new THREE.Vector2();

    function readSize() {
      var r = hero.getBoundingClientRect();
      size.w = Math.max(320, Math.round(r.width || window.innerWidth));
      size.h = Math.max(560, Math.round(r.height || window.innerHeight * 0.94));
      isMobile = size.w < 768;
    }
    readSize();

    // ── Renderer — transparent so CSS owns the deep-space background ─────────────
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch (err) {
      startFallback('webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
    renderer.setSize(size.w, size.h, false);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();

    // ── Camera — low cinematic, locked forever after init ─────────────────────────
    var camera = new THREE.PerspectiveCamera(44, size.w / size.h, 0.1, 720);
    var CAMERA_START    = new THREE.Vector3(0, 1.05, 2.35);
    var CAMERA_LOOK_AT  = new THREE.Vector3(0, -0.12, -1.45);
    camera.position.copy(CAMERA_START);
    camera.lookAt(CAMERA_LOOK_AT);

    // ── Layer 0: DISABLED — CSS aurora/space background now owns this layer ──────────
    // var bgUniforms = {
    //   uTime: { value: 0 },
    //   uAspect: { value: size.w / size.h },
    //   uMouse: { value: new THREE.Vector2() }
    // };
    // var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    //   depthWrite: false,
    //   depthTest: false,
    //   uniforms: bgUniforms,
    //   vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    //   fragmentShader: [
    //     'precision mediump float;',
    //     'varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec2 uMouse;',
    //     'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    //     'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
    //     ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
    //     '            mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    //     'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}',
    //     'void main(){',
    //     ' vec2 p=(vUv-.5)*vec2(uAspect,1.0);',
    //     ' float d=length(p);',
    //     ' float n=fbm(vUv*2.8);',
    //     'vec3 col=vec3(.005,.005,.004);',
    //     ' col += vec3(.55,.32,.05)*smoothstep(.78,.02,d)*(.14+n*.06);',
    //     ' col *= 1.0-smoothstep(.44,1.08,d)*.94;',
    //     ' gl_FragColor=vec4(col,1.0);',
    //     '}'
    //   ].join('\n')
    // }));
    // bg.renderOrder = -200;
    // scene.add(bg);

    // ── Layer 1: DISABLED — CSS aurora/space background now owns this layer ───────────
    // var glowUniforms = { uTime: { value: 0 } };
    // var glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    //   transparent: true,
    //   depthWrite: false,
    //   depthTest: false,
    //   uniforms: glowUniforms,
    //   vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    //   fragmentShader: [
    //     'precision mediump float; varying vec2 vUv; uniform float uTime;',
    //     'void main(){',
    //     ' vec2 p=vUv-vec2(.5,.48); p.x*=1.6;',
    //     ' float d=length(p);',
    //     ' float g=smoothstep(.42,.02,d)*smoothstep(.0,.16,d)*.38;',
    //     ' float pulse=.88+.12*sin(uTime*.18);',
    //     ' vec3 col=vec3(.68,.40,.08)*pulse;',
    //     ' gl_FragColor=vec4(col,g);',
    //     '}'
    //   ].join('\n')
    // }));
    // glow.renderOrder = -190;
    // scene.add(glow);

    // ── Layer 3a: Far static star field (900 desktop / 450 mobile) ─────────────────
    // Tiny soft amber dots scattered across the upper 70% of the hero.
    // Non-interactive — purely atmospheric depth.
    var farCanvas = document.createElement('canvas');
    farCanvas.style.cssText = [
      'position:absolute',
      'top:0','left:0',
      'width:100%','height:100%',
      'pointer-events:none',
      'z-index:1'
    ].join(';');
    hero.appendChild(farCanvas);
    var farCtx = farCanvas.getContext('2d');

    var FAR_STAR_COUNT = isMobile ? 550 : 1200;

    var farStars = [];
    for (var fi = 0; fi < FAR_STAR_COUNT; fi++) {
      var fDepth = 0.2 + Math.random() * 0.6;
      var fRoll = Math.random();
      var fSz = fRoll < 0.78
        ? 0.35 + Math.random() * 0.55    // tiny: 0.35–0.9px
        : fRoll < 0.94
          ? 0.70 + Math.random() * 0.60  // small: 0.7–1.3px
          : 1.40 + Math.random() * 0.40; // rare: 1.4–1.8px
      var fColorIdx = Math.random();
      var fColor;
      if (fColorIdx < 0.45) fColor = 'rgba(120,76,14,' + (0.32 + Math.random() * 0.12) + ')';
      else if (fColorIdx < 0.73) fColor = 'rgba(146,92,18,' + (0.42 + Math.random() * 0.14) + ')';
      else if (fColorIdx < 0.90) fColor = 'rgba(170,109,22,' + (0.52 + Math.random() * 0.14) + ')';
      else if (fColorIdx < 0.98) fColor = 'rgba(196,129,31,' + (0.62 + Math.random() * 0.14) + ')';
      else fColor = 'rgba(224,160,48,' + (0.72 + Math.random() * 0.14) + ')';
      farStars.push({
        x: Math.random(),
        y: Math.random() * 0.88, // upper 88% — avoid bottom mesh zone
        r: fSz,
        color: fColor,
        phase: Math.random() * 6.28,
        pulseSpeed: .04 + Math.random() * .06
      });
    }

    function drawFarStars(t) {
      var FW = size.w;
      var FH = size.h;
      farCtx.clearRect(0, 0, FW, FH);
      for (var fi = 0; fi < farStars.length; fi++) {
        var s = farStars[fi];
        var pulse = 0.88 + 0.12 * Math.sin(t * s.pulseSpeed + s.phase);
        var sx = s.x * FW;
        var sy = s.y * FH;
        var sr = s.r;
        var grad = farCtx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.2);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        farCtx.fillStyle = grad;
        farCtx.beginPath();
        farCtx.arc(sx, sy, sr * 2.2, 0, 6.283);
        farCtx.fill();
      }
    }

    function resizeFarStars() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      farCanvas.width  = Math.floor(size.w * dpr);
      farCanvas.height = Math.floor(size.h * dpr);
      farCanvas.style.width = size.w + 'px';
      farCanvas.style.height = size.h + 'px';
      farCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Layer 3b: Living constellation (Canvas 2D, spring cursor-reactivity) ─────
    // Deep amber mineral star field — replaces the old WebGL dust layer.
    // Stars are tiny soft circles, not square confetti.
    // 150 desktop / 75 mobile cursor-reactive nodes with spring physics.

    // Star palette: weighted deep amber/ochre/mineral-gold
    var STAR_PALETTE = [
      { color: 'rgba(120, 76, 14, 0.38)', weight: 0.45 },  // deep ember amber
      { color: 'rgba(146, 92, 18, 0.50)', weight: 0.28 },  // dark ochre
      { color: 'rgba(170, 109, 22, 0.62)', weight: 0.17 }, // mineral amber
      { color: 'rgba(196, 129, 31, 0.74)', weight: 0.08 }, // warm gold-amber
      { color: 'rgba(224, 160, 48, 0.84)', weight: 0.02 }  // rare bright spark
    ];

    var starPalette = [];
    for (var pi = 0; pi < STAR_PALETTE.length; pi++) {
      for (var pw = 0; pw < Math.floor(STAR_PALETTE[pi].weight * 400); pw++) {
        starPalette.push(STAR_PALETTE[pi].color);
      }
    }

    var constCanvas = document.createElement('canvas');
    constCanvas.style.cssText = [
      'position:absolute',
      'top:0','left:0',
      'width:100%','height:100%',
      'pointer-events:none',
      'z-index:2'
    ].join(';');
    hero.appendChild(constCanvas);
    var constCtx = constCanvas.getContext('2d');

    var NODE_COUNT   = isMobile ? 80 : 160; // living constellation nodes
    var nodeRadius  = isMobile ? 90 : 180;  // influence radius in px (scaled later)

    var constellationNodes = [];
    for (var ni = 0; ni < NODE_COUNT; ni++) {
      var depth = 0.3 + Math.random() * 0.7;
      var sizeRoll = Math.random();
      var sz = sizeRoll < 0.75
        ? 0.35 + Math.random() * 0.55    // far stars: 0.35–0.9px
        : sizeRoll < 0.93
          ? 0.70 + Math.random() * 0.60  // mid stars: 0.7–1.3px
          : 1.40 + Math.random() * 0.40; // rare sparks: 1.4–1.8px max
      constellationNodes.push({
        baseX: Math.random(),
        baseY: Math.random(),
        x: 0, y: 0,
        vx: 0, vy: 0,
        radius: sz,
        depth: depth,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
        phase: Math.random() * 6.28,
        speed: .008 + Math.random() * .012,
        pulsePhase: Math.random() * 6.28,
        pulseSpeed: .06 + Math.random() * .09,
        baseOpacity: .3 + Math.random() * .5
      });
    }

    function smooth01(x) {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    }

    function textZoneMultiplier(xNorm, yNorm) {
      var cx = 0.50, cy = 0.42;
      var dx = (xNorm - cx) / 0.23;
      var dy = (yNorm - cy) / 0.17;
      var d = Math.sqrt(dx * dx + dy * dy);
      // Minimum 18% visibility in the text zone, full visibility outside.
      return 0.18 + 0.82 * smooth01((d - 0.72) / (1.28 - 0.72));
    }

    function drawConstellation(t) {
      var W = size.w;
      var H = size.h;
      constCtx.clearRect(0, 0, W, H);

      var ptrX = (damped.x + 1) * 0.5;  // 0..1
      var ptrY = (1 - damped.y) * 0.5;   // 0..1 (flip Y)
      var ptrVX = mouse.x - damped.x;   // actual delta for swirl
      var ptrVY = mouse.y - damped.y;

      for (var ni = 0; ni < constellationNodes.length; ni++) {
        var n = constellationNodes[ni];

        // Spring toward base
        n.vx += (n.baseX - n.x) * 0.010;
        n.vy += (n.baseY - n.y) * 0.010;

        // Cursor magnetic disturbance
        var dx = n.x - ptrX;
        var dy = n.y - ptrY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var inflR = (nodeRadius / Math.max(W, H)) * n.depth;
        if (dist < inflR && dist > 0.001) {
          var falloff = Math.pow(1 - dist / inflR, 2);
          var angle = Math.atan2(dy, dx);
          var push = falloff * 0.45 * n.depth;
          n.vx += Math.cos(angle) * push;
          n.vy += Math.sin(angle) * push;
          // Cursor velocity swirl
          var swirl = falloff * 0.18 * n.depth;
          n.vx += ptrVX * swirl;
          n.vy += ptrVY * swirl;
        }

        // Damping
        n.vx *= 0.90;
        n.vy *= 0.90;

        n.x += n.vx;
        n.y += n.vy;

        // Local pulse (life, not travel)
        var pulse = 0.88 + 0.12 * Math.sin(t * n.pulseSpeed + n.pulsePhase);

        var sx = n.x * W;
        var sy = n.y * H;

        // Text fade
        var fade = textZoneMultiplier(n.x, n.y);

        var alpha = n.baseOpacity * pulse * fade;
        if (alpha < 0.04) continue;

        var r = n.radius;
        var grad = constCtx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
        grad.addColorStop(0, n.color.replace(/[\d.]+\)$/, (alpha * 1.1).toFixed(2) + ')'));
        grad.addColorStop(0.4, n.color.replace(/[\d.]+\)$/, (alpha * 0.55).toFixed(2) + ')'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        constCtx.fillStyle = grad;
        constCtx.beginPath();
        constCtx.arc(sx, sy, r * 2.5, 0, 6.283);
        constCtx.fill();
      }

      // Sparse constellation connection lines — only nearby nodes, 2-3 connections max
      var connAlpha = 0.06;
      constCtx.lineWidth = 0.4;
      for (var ni = 0; ni < constellationNodes.length; ni++) {
        var na = constellationNodes[ni];
        var ax = na.x * W, ay = na.y * H;
        var connCount = 0;
        // Find 2 nearest other nodes
        var dists = [];
        for (var nj = 0; nj < constellationNodes.length; nj++) {
          if (nj === ni) continue;
          var nb = constellationNodes[nj];
          var dx = na.x - nb.x, dy = na.y - nb.y;
          dists.push({ idx: nj, d: Math.sqrt(dx * dx + dy * dy) });
        }
        dists.sort(function(a, b) { return a.d - b.d; });
        var fadeA = textZoneMultiplier(na.x, na.y);
        for (var k = 0; k < Math.min(2, dists.length); k++) {
          if (connCount >= 2) break;
          var nb = constellationNodes[dists[k].idx];
          var bx = nb.x * W, by = nb.y * H;
          var d = dists[k].d;
          if (d > 0.25) continue; // max connection distance in normalized space
          var fadeB = textZoneMultiplier(nb.x, nb.y);
          var lineAlpha = fadeA * fadeB * connAlpha * (1 - d / 0.25);
          if (lineAlpha < 0.01) continue;
          constCtx.strokeStyle = 'rgba(170,109,22,' + lineAlpha.toFixed(3) + ')';
          constCtx.beginPath();
          constCtx.moveTo(ax, ay);
          constCtx.lineTo(bx, by);
          constCtx.stroke();
          connCount++;
        }
      }
    }

    function resizeConstellation() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      constCanvas.width  = Math.floor(size.w * dpr);
      constCanvas.height = Math.floor(size.h * dpr);
      constCanvas.style.width = size.w + 'px';
      constCanvas.style.height = size.h + 'px';
      constCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Layer 4: Floating mineral wireframe schematics ────────────────────────
    // Composition: large-left, medium-right, small-midright, lower-left crystal,
    // left orbit, upper-right orbit.

    var MINERAL_BASE  = { r: .40, g: .24, b: .04 };
    var MINERAL_MID   = { r: .60, g: .38, b: .08 };
    var MINERAL_BRIGHT= { r: .78, g: .54, b: .16 };
    var MINERAL_GLINT = { r: .95, g: .78, b: .36 };

    function lineMat(rgba, opacity) {
      return new THREE.LineBasicMaterial({
        color: new THREE.Color(rgba.r, rgba.g, rgba.b),
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
    }

    // Build a polyhedron wireframe from vertex pairs (edges of a given geometry)
    function buildWireframe(type, radius, extraLines) {
      var geo, verts, edges;
      if (type === 'ico') {
        geo = new THREE.IcosahedronGeometry(radius, 0);
        verts = geo.attributes.position;
        edges = [];
        var seen = {};
        for (var ii = 0; ii < geo.index.count; ii += 3) {
          var a = geo.index.getX(ii), b = geo.index.getX(ii+1), c = geo.index.getX(ii+2);
          [[a,b],[b,c],[a,c]].forEach(function(e) {
            var key = e[0] < e[1] ? e[0]*1000+e[1] : e[1]*1000+e[0];
            if (!seen[key]) { seen[key]=true; edges.push([verts.getX(e[0]),verts.getY(e[0]),verts.getZ(e[0]), verts.getX(e[1]),verts.getY(e[1]),verts.getZ(e[1])]); }
          });
        }
      } else if (type === 'dodec') {
        geo = new THREE.DodecahedronGeometry(radius, 0);
        verts = geo.attributes.position;
        edges = [];
        seen = {};
        for (var jj = 0; jj < geo.index.count; jj += 3) {
          var aa = geo.index.getX(jj), bb = geo.index.getX(jj+1), cc = geo.index.getX(jj+2);
          [[aa,bb],[bb,cc],[aa,cc]].forEach(function(e) {
            var key = e[0] < e[1] ? e[0]*1000+e[1] : e[1]*1000+e[0];
            if (!seen[key]) { seen[key]=true; edges.push([verts.getX(e[0]),verts.getY(e[0]),verts.getZ(e[0]), verts.getX(e[1]),verts.getY(e[1]),verts.getZ(e[1])]); }
          });
        }
      } else if (type === 'crystal') {
        // Irregular elongated crystal: stretched octahedron
        geo = new THREE.OctahedronGeometry(radius, 0);
        verts = geo.attributes.position;
        edges = [];
        seen = {};
        for (var kk = 0; kk < geo.index.count; kk += 3) {
          var na = geo.index.getX(kk), nb = geo.index.getX(kk+1), nc = geo.index.getX(kk+2);
          [[na,nb],[nb,nc],[na,nc]].forEach(function(e) {
            var key = e[0] < e[1] ? e[0]*1000+e[1] : e[1]*1000+e[0];
            if (!seen[key]) { seen[key]=true; edges.push([verts.getX(e[0]),verts.getY(e[0])*1.6,verts.getZ(e[0])*.7, verts.getX(e[1]),verts.getY(e[1])*1.6,verts.getZ(e[1])*.7]); }
          });
        }
      } else {
        // Pyramid
        var pGeo = new THREE.TetrahedronGeometry(radius, 0);
        var pVerts = pGeo.attributes.position;
        edges = [];
        seen = {};
        for (var mm = 0; mm < pGeo.index.count; mm += 3) {
          var pa = pGeo.index.getX(mm), pb = pGeo.index.getX(mm+1), pc = pGeo.index.getX(mm+2);
          [[pa,pb],[pb,pc],[pa,pc]].forEach(function(e) {
            var key = e[0] < e[1] ? e[0]*1000+e[1] : e[1]*1000+e[0];
            if (!seen[key]) { seen[key]=true; edges.push([pVerts.getX(e[0]),pVerts.getY(e[0]),pVerts.getZ(e[0]), pVerts.getX(e[1]),pVerts.getY(e[1]),pVerts.getZ(e[1])]); }
          });
        }
      }

      // Add sparse internal chords for mineral feel
      if (extraLines && extraLines.length) {
        extraLines.forEach(function(e) { edges.push(e); });
      }

      var pos = new Float32Array(edges.length * 6);
      edges.forEach(function(e, idx) {
        pos[idx*6]=e[0]; pos[idx*6+1]=e[1]; pos[idx*6+2]=e[2];
        pos[idx*6+3]=e[3]; pos[idx*6+4]=e[4]; pos[idx*6+5]=e[5];
      });
      var lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return lineGeo;
    }

    // Build internal diagonal braces for a given radius
    function internalBraces(r, count) {
      var lines = [];
      var rng = [
        [r*.4, r*.2, 0, -r*.2, -r*.3, r*.5],
        [-r*.3, r*.5, r*.2, r*.1, -r*.4, -r*.1],
        [r*.1, -r*.5, r*.4, r*.2, -r*.1, r*.3],
        [-r*.2, r*.3, -r*.5, r*.1, r*.3, -r*.2]
      ];
      for (var bi = 0; bi < Math.min(count, rng.length); bi++) {
        lines.push(rng[bi]);
      }
      return lines;
    }

    // Create a mineral schematic object
    function mineralObject(type, x, y, z, scale, opts) {
      opts = opts || {};
      var group = new THREE.Group();
      group.position.set(x, y, z);
      group.scale.setScalar(scale);

      var internal = internalBraces(scale * .8, 3);
      var wireGeo = buildWireframe(type, 1.0, internal);

      // Line hierarchy: base, medium, bright
      var baseLine  = lineMat(MINERAL_BASE,   opts.baseOpacity  || .22);
      var midLine   = lineMat(MINERAL_MID,      opts.midOpacity   || .44);
      var brightLine= lineMat(MINERAL_BRIGHT,  opts.brightOpacity|| .68);
      var glintLine = lineMat(MINERAL_GLINT,    opts.glintOpacity || .86);

      // Split edges into hierarchy groups by index
      var totalEdges = wireGeo.attributes.position.count / 2;
      var baseCount   = Math.floor(totalEdges * .60);
      var midCount    = Math.floor(totalEdges * .28);
      var brightCount = Math.floor(totalEdges * .10);
      // glintCount = remaining

      var basePos = new Float32Array(baseCount * 6);
      var midPos  = new Float32Array(midCount * 6);
      var brightPos = new Float32Array(brightCount * 6);
      var glintPos  = new Float32Array((totalEdges - baseCount - midCount - brightCount) * 6);

      var allPos = wireGeo.attributes.position.array;
      var bIdx=0, mIdx=0, brIdx=0, gIdx=0;
      for (var ei = 0; ei < totalEdges; ei++) {
        var src = [allPos[ei*6],allPos[ei*6+1],allPos[ei*6+2],allPos[ei*6+3],allPos[ei*6+4],allPos[ei*6+5]];
        var dest;
        if (bIdx < baseCount) { dest=basePos; var di=bIdx++; }
        else if (mIdx < midCount) { dest=midPos; var di=mIdx++; }
        else if (brIdx < brightCount) { dest=brightPos; var di=brIdx++; }
        else { dest=glintPos; var di=gIdx++; }
        dest[di*6]=src[0]; dest[di*6+1]=src[1]; dest[di*6+2]=src[2];
        dest[di*6+3]=src[3]; dest[di*6+4]=src[4]; dest[di*6+5]=src[5];
      }

      function makeLine(p, mat) {
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        return new THREE.LineSegments(g, mat.clone());
      }

      var baseObj  = makeLine(basePos,   baseLine);
      var midObj   = makeLine(midPos,    midLine);
      var brightObj= makeLine(brightPos, brightLine);
      var glintObj = makeLine(glintPos,  glintLine);

      group.add(baseObj); group.add(midObj); group.add(brightObj); group.add(glintObj);

      group.userData = {
        baseY: y, phase: Math.random() * 6.28,
        hoverAmp: .04 + Math.random() * .03,
        hoverPeriod: 14 + Math.random() * 18,
        rotSpeedX: (.008 + Math.random() * .006) * (Math.random() > .5 ? 1 : -1),
        rotSpeedY: (.012 + Math.random() * .008) * (Math.random() > .5 ? 1 : -1),
        rotSpeedZ: (.004 + Math.random() * .004) * (Math.random() > .5 ? 1 : -1),
        breathSpeed: .08 + Math.random() * .06,
        breathPhase: Math.random() * 6.28,
        baseOpacity: opts.baseOpacity || .22,
        depthFade: opts.depthFade || 1.0
      };
      scene.add(group);
      return group;
    }

    // Orbit glyph: tilted ellipse + small bead
    function orbitGlyph(x, y, z, radius, tiltX, tiltZ, opts) {
      opts = opts || {};
      var group = new THREE.Group();
      group.position.set(x, y, z);

      // Primary ellipse ring
      var ringGeo = new THREE.TorusGeometry(radius, .008, 6, 80);
      var ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: new THREE.Color(MINERAL_MID.r, MINERAL_MID.g, MINERAL_MID.b),
        transparent: true, opacity: opts.opacity || .42,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      }));
      ring.rotation.set(tiltX, 0, tiltZ);
      group.add(ring);

      // Second faint ring
      var ring2Geo = new THREE.TorusGeometry(radius * 1.35, .005, 4, 72);
      var ring2 = new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({
        color: new THREE.Color(MINERAL_BASE.r, MINERAL_BASE.g, MINERAL_BASE.b),
        transparent: true, opacity: (opts.opacity || .42) * .45,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      }));
      ring2.rotation.set(tiltX + .6, .3, tiltZ - .4);
      group.add(ring2);

      // Central bead
      var beadGeo = new THREE.SphereGeometry(radius * .13, 12, 12);
      var bead = new THREE.Mesh(beadGeo, new THREE.MeshBasicMaterial({
        color: new THREE.Color(MINERAL_BRIGHT.r, MINERAL_BRIGHT.g, MINERAL_BRIGHT.b),
        transparent: true, opacity: opts.beadOpacity || .82,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      group.add(bead);

      group.userData = {
        baseY: y, phase: Math.random() * 6.28,
        hoverAmp: .025 + Math.random() * .02,
        hoverPeriod: 18 + Math.random() * 14,
        rotSpeed: .004 + Math.random() * .004,
        tiltX: tiltX, tiltZ: tiltZ,
        breathSpeed: .06 + Math.random() * .05,
        breathPhase: Math.random() * 6.28,
        depthFade: opts.depthFade || 1.0
      };
      scene.add(group);
      return group;
    }

    // Build the six floating objects — DISABLED for final render
    // The target is the living star/constellation organism, not floating cubes.
    // var floatingSchematics = [];
    //
    // // Large upper-left polyhedron (icosahedron)
    // floatingSchematics.push(mineralObject('ico', -1.35, 0.85, -3.2, 0.42, {
    //   baseOpacity: .20, midOpacity: .40, brightOpacity: .66, glintOpacity: .84,
    //   depthFade: 0.90
    // }));
    //
    // // Medium upper-right polyhedron (dodecahedron)
    // floatingSchematics.push(mineralObject('dodec', 1.28, 0.72, -3.6, 0.30, {
    //   baseOpacity: .18, midOpacity: .36, brightOpacity: .60, glintOpacity: .78,
    //   depthFade: 0.75
    // }));
    //
    // // Small mid-right crystal
    // floatingSchematics.push(mineralObject('crystal', 0.95, 0.12, -2.8, 0.22, {
    //   baseOpacity: .16, midOpacity: .34, brightOpacity: .58, glintOpacity: .76,
    //   depthFade: 0.60
    // }));
    //
    // // Lower-center-left pyramid crystal
    // floatingSchematics.push(mineralObject('pyramid', -0.55, -0.48, -2.4, 0.26, {
    //   baseOpacity: .18, midOpacity: .38, brightOpacity: .62, glintOpacity: .80,
    //   depthFade: 0.55
    // }));
    //
    // // Left orbit glyph
    // floatingSchematics.push(orbitGlyph(-0.95, 0.35, -2.6, 0.14, 1.1, 0.4, {
    //   opacity: .38, beadOpacity: .78, depthFade: 0.70
    // }));
    //
    // // Upper-right orbit glyph
    // floatingSchematics.push(orbitGlyph(1.05, 0.55, -3.1, 0.11, 0.75, -0.5, {
    //   opacity: .34, beadOpacity: .72, depthFade: 0.65
    // }));

    // ── Layer 5: Dominant organic geological terrain mesh ──────────────────────
    // The core element: triangulated mesh driven by a warped heightfield.
    // Camera is positioned to look INTO the terrain from a low angle.

    var meshCols = isMobile ? 100 : 200;
    var meshRows = isMobile ? 58  : 110;

    // Build vertex arrays
    var numVerts = meshCols * meshRows;
    var meshPos  = new Float32Array(numVerts * 3);
    var meshUv   = new Float32Array(numVerts * 2);
    var edgePos  = [];  // flat list of [x0,y0,z0, x1,y1,z1] pairs
    var edgeUv0  = [];  // midpoint UV of each edge
    var edgeUv1  = [];

    var terrainW = 9;
    var terrainD = 7;
    var terrainY = -1.2;

    // Stable pseudo-random
    function srand(a, b) {
      var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }

    // Simple smooth noise
    function sn(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y);
      var fx = x - ix, fy = y - iy;
      var ux = fx * fx * (3 - 2 * fx);
      var uy = fy * fy * (3 - 2 * fy);
      var a = srand(ix, iy), b = srand(ix+1, iy);
      var c = srand(ix, iy+1), d = srand(ix+1, iy+1);
      return a + (b-a)*ux + (c-a)*uy + (a-b-c+d)*ux*uy;
    }

    // Organic terrain heightfield
    function terrainHeight(u, v, t) {
      // Domain warp
      var warpX = 0.045 * sn(u * 2.4 + 5.0, v * 2.0 + t * 0.04) + 0.020 * Math.sin(v * 9.0 + t * 0.12);
      var warpY = 0.040 * sn(u * 2.0 + 17.0, v * 2.8 + t * 0.04) + 0.016 * Math.sin(u * 8.0 - t * 0.10);
      var wu = u + warpX;
      var wv = v + warpY;

      var h = 0;

      // 1. Base organic noise
      h += sn(wu * 3.5 + t * 0.02, wv * 3.0 - t * 0.015) * 0.30;
      h += sn(wu * 7.0 - t * 0.018, wv * 5.5 + t * 0.012) * 0.15;

      // 2. Left flowing strata
      var flow = 0.18 + 0.08 * Math.sin(wv * 7.5 + 0.8) + 0.035 * Math.sin(wv * 17.0 + t * 0.10) + 0.025 * sn(wu * 4.0, wv * 6.0 + t * 0.05);
      var strataD = Math.abs(wu - flow);
      var strata = Math.max(0, 1 - strataD / 0.09) * Math.pow(0.5 + 0.5 * Math.cos(strataD * 90.0 - 1.5), 5.0);
      strata *= smoothstep(0.20, 0.45, wv) * (0.65 + 0.35 * sn(wu * 16.0, wv * 10.0 + t * 0.03));
      h += strata * 0.75;

      // 3. Right mineral deposit rings
      var rdx = (wu - 0.76) * 1.35;
      var rdy = (wv - 0.54) * 2.25;
      var angleWarp = 0.10 * sn(wu * 8.0 + t * 0.08, wv * 8.0) + 0.04 * Math.sin(wv * 18.0 + t * 0.12);
      var rr = Math.sqrt(rdx * rdx + rdy * rdy) + angleWarp;
      var basin = Math.exp(-rr * rr * 22.0);
      var rings = Math.pow(0.5 + 0.5 * Math.cos(rr * 58.0 - t * 0.45), 7.0);
      h += basin * rings * 0.85;

      // 4. Center angular survey plateau
      var inZone = smoothstep(0.30, 0.38, wu) * smoothstep(0.66, 0.58, wu) * smoothstep(0.32, 0.42, wv) * smoothstep(0.74, 0.64, wv);
      var diagCut = Math.sin(wu * 22.0 + wv * 13.0 + t * 0.08);
      var fracture = sn(wu * 11.0, wv * 9.0 + t * 0.04);
      h += inZone * Math.max(0, (diagCut * 0.5 + 0.5 + fracture * 0.35 - 0.25) / 0.75) * 0.65;

      // 5. Lower-center partial arc/basin
      var adx = (wu - 0.48) * 1.10;
      var ady = (wv - 0.96) * 1.85;
      var ar = Math.sqrt(adx * adx + ady * ady);
      var arc = Math.pow(0.5 + 0.5 * Math.cos(ar * 42.0 + t * 0.12), 6.0);
      h += arc * smoothstep(0.18, 0.50, ar) * smoothstep(0.58, 0.76, wv) * 0.60;

      // 6. Lower-right diagonal ridge
      var ridgeY = 0.78 - (wu - 0.50) * 0.62 + 0.025 * Math.sin(wu * 22.0 + t * 0.12);
      var ridgeD = Math.abs(wv - ridgeY);
      h += smoothstep(0.072, 0.018, ridgeD) * smoothstep(0.50, 0.68, wu) * 0.45;

      return h;
    }

    function smoothstep(edge0, edge1, x) {
      var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    // Build mesh vertices with organic displacement
    for (var row = 0; row < meshRows; row++) {
      for (var col = 0; col < meshCols; col++) {
        var u = col / (meshCols - 1);
        var v = row / (meshRows - 1);

        // Skip outer border for stability
        var borderX = (col === 0 || col === meshCols - 1);
        var borderZ = (row === 0 || row === meshRows - 1);
        var jitterX = borderX ? 0 : (srand(col * 3.7 + 19, row * 5.3 + 31) - 0.5) * (terrainW / meshCols) * 0.20;
        var jitterZ = borderZ ? 0 : (srand(col * 4.1 + 7,  row * 3.9 + 53) - 0.5) * (terrainD / meshRows) * 0.20;

        var x = (u - 0.5) * terrainW + jitterX;
        var z = -terrainD * 0.5 + v * terrainD + jitterZ;

        var idx = row * meshCols + col;
        meshPos[idx * 3]     = x;
        meshPos[idx * 3 + 1] = terrainY;
        meshPos[idx * 3 + 2] = z;
        meshUv[idx * 2]      = u;
        meshUv[idx * 2 + 1] = v;
      }
    }

    // Build triangulated edges (horizontal, vertical, diagonal)
    for (var er = 0; er < meshRows; er++) {
      for (var ec = 0; ec < meshCols - 1; ec++) {
        var u0 = ec / (meshCols - 1), u1 = (ec+1) / (meshCols - 1);
        var v0 = er / (meshRows - 1);
        edgePos.push(meshPos[er*meshCols*3+ec*3],   meshPos[er*meshCols*3+ec*3+1],   meshPos[er*meshCols*3+ec*3+2]);
        edgePos.push(meshPos[er*meshCols*3+(ec+1)*3], meshPos[er*meshCols*3+(ec+1)*3+1], meshPos[er*meshCols*3+(ec+1)*3+2]);
        edgeUv0.push(u0, v0); edgeUv1.push(u1, v0);
      }
    }
    for (var vr = 0; vr < meshRows - 1; vr++) {
      for (var vc = 0; vc < meshCols; vc++) {
        var vu = vc / (meshCols - 1);
        var vv0 = vr / (meshRows - 1), vv1 = (vr+1) / (meshRows - 1);
        edgePos.push(meshPos[vr*meshCols*3+vc*3],       meshPos[vr*meshCols*3+vc*3+1],       meshPos[vr*meshCols*3+vc*3+2]);
        edgePos.push(meshPos[(vr+1)*meshCols*3+vc*3],   meshPos[(vr+1)*meshCols*3+vc*3+1],   meshPos[(vr+1)*meshCols*3+vc*3+2]);
        edgeUv0.push(vu, vv0); edgeUv1.push(vu, vv1);
      }
    }
    for (var dr = 0; dr < meshRows - 1; dr++) {
      for (var dc = 0; dc < meshCols - 1; dc++) {
        var du0 = dc / (meshCols - 1), du1 = (dc+1) / (meshCols - 1);
        var dv0 = dr / (meshRows - 1), dv1 = (dr+1) / (meshRows - 1);
        // Alternating diagonal with occasional noise-based flip
        var flip = ((dc + dr) % 2 === 0) ? false : true;
        if (srand(dc * 7, dr * 11) > 0.88) flip = !flip;
        if (flip) {
          edgePos.push(meshPos[dr*meshCols*3+dc*3],         meshPos[dr*meshCols*3+dc*3+1],       meshPos[dr*meshCols*3+dc*3+2]);
          edgePos.push(meshPos[(dr+1)*meshCols*3+(dc+1)*3], meshPos[(dr+1)*meshCols*3+(dc+1)*3+1], meshPos[(dr+1)*meshCols*3+(dc+1)*3+2]);
          edgeUv0.push(du0, dv0); edgeUv1.push(du1, dv1);
        } else {
          edgePos.push(meshPos[dr*meshCols*3+(dc+1)*3],   meshPos[dr*meshCols*3+(dc+1)*3+1],   meshPos[dr*meshCols*3+(dc+1)*3+2]);
          edgePos.push(meshPos[(dr+1)*meshCols*3+dc*3],   meshPos[(dr+1)*meshCols*3+dc*3+1],   meshPos[(dr+1)*meshCols*3+dc*3+2]);
          edgeUv0.push(du1, dv0); edgeUv1.push(du0, dv1);
        }
      }
    }

    var numEdges = edgePos.length / 6;
    var edgeUvArray = new Float32Array(edgePos.length / 3 * 2);
    for (var ei = 0; ei < numEdges; ei++) {
      edgeUvArray[ei * 4]     = edgeUv0[ei * 2];
      edgeUvArray[ei * 4 + 1] = edgeUv0[ei * 2 + 1];
      edgeUvArray[ei * 4 + 2] = edgeUv1[ei * 2];
      edgeUvArray[ei * 4 + 3] = edgeUv1[ei * 2 + 1];
    }

    var terrainGeo = new THREE.BufferGeometry();
    terrainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePos), 3));
    terrainGeo.setAttribute('aUv0', new THREE.BufferAttribute(new Float32Array(edgeUvArray), 2));

    var terrainUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() }
    };

    var terrainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: terrainUniforms,
      vertexShader: [
        'attribute vec2 aUv0;',
        'uniform float uTime; uniform vec2 uMouse;',
        'varying vec2 vUv0;',
        'void main(){',
        ' vUv0=aUv0;',
        ' vec3 p=position;',
        // Subtle vertex breathing from heightfield
        ' float u=aUv0.x, vv=aUv0.y;',
        ' float warpX=0.045*sin(u*2.4+vv*2.0+uTime*.04)+0.020*sin(vv*9.0+uTime*.12);',
        ' float warpY=0.040*sin(u*2.0+17.0+vv*2.8+uTime*.04)+0.016*sin(u*8.0-uTime*.10);',
        ' float wu=u+warpX, wv=vv+warpY;',
        ' float h=sin(wu*3.5+uTime*.02+wv*3.0)*.15+sin(wu*7.0-uTime*.018+wv*5.5+uTime*.012)*.08;',
        ' p.y += h*1.8;',
        // Cursor only affects constellation — terrain is spatially locked
        ' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform float uTime; uniform vec2 uMouse;',
        'varying vec2 vUv0;',
        // Contour-derived brightness from heightfield
        'float sn(float x,float y){',
        ' float ix=floor(x),iy=floor(y);float fx=x-ix,fy=y-iy;',
        ' float ux=fx*fx*(3.-2.*fx),uy=fy*fy*(3.-2.*fy);',
        ' float a=fract(sin(ix*127.1+iy*311.7)*43758.5453);',
        ' float b=fract(sin((ix+1.)*127.1+iy*311.7)*43758.5453);',
        ' float c=fract(sin(ix*127.1+(iy+1.)*311.7)*43758.5453);',
        ' float d=fract(sin((ix+1.)*127.1+(iy+1.)*311.7)*43758.5453);',
        ' return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;}',
        'float ss(float e0,float e1,float x){',
        ' float t=max(0.,min(1.,(x-e0)/(e1-e0)));return t*t*(3.-2.*t);}',
        'float terrainH(float u,float v,float t){',
        ' float warpX=0.045*sn(u*2.4+5.,v*2.+t*.04)+0.020*sin(v*9.+t*.12);',
        ' float warpY=0.040*sn(u*2.+17.,v*2.8+t*.04)+0.016*sin(u*8.-t*.10);',
        ' float wu=u+warpX,wy=v+warpY;float h=0.;',
        ' h+=sn(wu*3.5+t*.02,wy*3.-t*.015)*.30+sn(wu*7.-t*.018,wy*5.5+t*.012)*.15;',
        // left strata
        ' float flow=.18+.08*sin(wy*7.5+.8)+.035*sin(wy*17.+t*.10)+.025*sn(wu*4.,wy*6.+t*.05);',
        ' float sd=abs(wu-flow);float strata=max(0.,1.-sd/.09)*pow(.5+.5*cos(sd*90.-1.5),5.);',
        ' strata*=ss(.20,.45,wy)*(.65+.35*sn(wu*16.,wy*10.+t*.03));h+=strata*.75;',
        // right rings
        ' float rdx=(wu-.76)*1.35,rdy=(wy-.54)*2.25;',
        ' float aw=.10*sn(wu*8.+t*.08,wy*8.)+.04*sin(wy*18.+t*.12);',
        ' float r=sqrt(rdx*rdx+rdy*rdy)+aw;',
        ' float basin=exp(-r*r*22.);float rings=pow(.5+.5*cos(r*58.-t*.45),7.);',
        ' h+=basin*rings*.85;',
        // center plateau
        ' float zone=ss(.30,.38,wu)*ss(.66,.58,wu)*ss(.32,.42,wy)*ss(.74,.64,wy);',
        ' float dc=sin(wu*22.+wy*13.+t*.08);float fr=sn(wu*11.,wy*9.+t*.04);',
        ' h+=zone*max(0.,(dc*.5+.5+fr*.35-.25)/.75)*.65;',
        // lower arc
        ' float adx=(wu-.48)*1.10,ady=(wy-.96)*1.85;float ar=sqrt(adx*adx+ady*ady);',
        ' float arc=pow(.5+.5*cos(ar*42.+t*.12),6.);',
        ' h+=arc*ss(.18,.50,ar)*ss(.58,.76,wy)*.60;',
        // right ridge
        ' float ry=.78-(wu-.50)*.62+.025*sin(wu*22.+t*.12);',
        ' h+=ss(.072,.018,abs(wy-ry))*ss(.50,.68,wu)*.45;',
        ' return h;}',
        'float contourS(float h,float sp,float w){',
        ' float f=fract(h/sp);float m=min(f,1.-f);',
        ' return 1.-ss(0.,w,m);}',
        'void main(){',
        ' float t=uTime;',
        ' vec2 uv0=vUv0;',
        ' float h=terrainH(uv0.x,uv0.y,t);',
        ' float cS=contourS(h,.085,.010);',
        ' float intensity=.08+cS*h*.55;',
        // Erosion
        ' float ero=ss(.25,.85,sn(uv0.x*28.,uv0.y*18.+t*.02));',
        ' intensity*=.55+.45*ero;',
        // Feature masks
        // left strata
        ' float flow=.18+.08*sin(uv0.y*7.5+.8)+.035*sin(uv0.y*17.+t*.10)+.025*sn(uv0.x*4.,uv0.y*6.+t*.05);',
        ' float sd=abs(uv0.x-flow);float strata=max(0.,1.-sd/.09)*pow(.5+.5*cos(sd*90.-1.5),5.);',
        ' strata*=ss(.20,.45,uv0.y)*(.65+.35*sn(uv0.x*16.,uv0.y*10.+t*.03));',
        // right rings
        ' float rdx=(uv0.x-.76)*1.35,rdy=(uv0.y-.54)*2.25;',
        ' float aw=.10*sn(uv0.x*8.+t*.08,uv0.y*8.)+.04*sin(uv0.y*18.+t*.12);',
        ' float r=sqrt(rdx*rdx+rdy*rdy)+aw;',
        ' float rings=pow(.5+.5*cos(r*58.-t*.45),7.)*exp(-r*r*22.);',
        // center plateau
        ' float zone=ss(.30,.38,uv0.x)*ss(.66,.58,uv0.x)*ss(.32,.42,uv0.y)*ss(.74,.64,uv0.y);',
        ' float dc=sin(uv0.x*22.+uv0.y*13.+t*.08);float fr=sn(uv0.x*11.,uv0.y*9.+t*.04);',
        ' float plateau=zone*max(0.,(dc*.5+.5+fr*.35-.25)/.75);',
        // lower arc
        ' float adx=(uv0.x-.48)*1.10,ady=(uv0.y-.96)*1.85;float ar=sqrt(adx*adx+ady*ady);',
        ' float arc=pow(.5+.5*cos(ar*42.+t*.12),6.)*ss(.18,.50,ar)*ss(.58,.76,uv0.y);',
        // right ridge
        ' float ry=.78-(uv0.x-.50)*.62+.025*sin(uv0.x*22.+t*.12);',
        ' float ridge=ss(.072,.018,abs(uv0.y-ry))*ss(.50,.68,uv0.x);',
        // combine features
        ' float features=strata*.82+rings*.92+plateau*.68+arc*.72+ridge*.58;',
        // shimmer pulse
        ' float shimmer=.88+.12*sin(t*.14+uv0.x*3.5+uv0.y*2.8);',
        ' float alpha = .065 + intensity * .58 + features * .45 + shimmer * .08;',
        // Depth fade — 1.0 everywhere (confirmed mesh-visible in TEST)
        ' float depthFade=1.0;',
        // No center fade — CSS scrim handles text readability
        ' float centerFade=1.0;',
        ' alpha*=depthFade*centerFade;',
        // Alpha ceiling — 90% so terrain stays visible across full terrain extent
        ' alpha=clamp(alpha,0.,.90);',
        // Color
        ' vec3 base=vec3(.48,.29,.04);vec3 gold=vec3(.82,.52,.10);vec3 bright=vec3(.96,.70,.24);',
        ' float colT=ss(.10,.65,intensity+features*.4);',
        ' vec3 col=mix(base,gold,colT);',
        ' col=mix(col,bright,ss(.75,1.2,intensity+features*.5)*.6);',
        ' gl_FragColor=vec4(col,alpha);',
        '}'
      ].join('\n')
    });

    var terrain = new THREE.LineSegments(terrainGeo, terrainMat);
    terrain.frustumCulled = false;
    terrain.renderOrder = 10;
    // Rotate terrain plane to appear as a receding floor
    terrain.rotation.x = -Math.PI * 0.42;
    scene.add(terrain);

    // ── Dark opaque background plane — DISABLED ──────────────────────────────────
    // CSS .hero owns the background. WebGL terrain renders transparently on top.
    // var darkBgUniforms = { uTime: { value: 0 } };
    // var darkBg = new THREE.Mesh(
    //   new THREE.PlaneGeometry(2, 2),
    //   new THREE.ShaderMaterial({
    //     vertexShader: ['varying vec2 vUv;', 'void main(){', ' vUv=uv;', ' gl_Position=vec4(position.xy,0.9999,1.);', '}'].join('\n'),
    //     fragmentShader: ['precision mediump float;', 'varying vec2 vUv;', 'void main(){',
    //       ' float d=distance(vUv,vec2(.5));',
    //       ' float edge=.012*smoothstep(.52,.48,d);',
    //       ' vec3 col=vec3(.022,.014,.006)+vec3(.055,.032,.010)*edge;',
    //       ' gl_FragColor=vec4(col,1.);', '}'].join('\n'),
    //     depthWrite: true,
    //   })
    // );
    // darkBg.renderOrder = 5;
    // scene.add(darkBg);

    // ── Vignette overlay — DISABLED ─────────────────────────────────────────────
    // CSS handles edge darkening. Keeping WebGL vignette would double-darken edges.
    // var vigUniforms = { uTime: { value: 0 } };
    // var vig = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    //   transparent: true,
    //   depthWrite: false,
    //   depthTest: false,
    //   uniforms: vigUniforms,
    //   vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    //   fragmentShader: [
    //     'precision mediump float; varying vec2 vUv; uniform float uTime;',
    //     'void main(){',
    //     ' vec2 p=vUv-vec2(.5,.5);',
    //     ' float d=length(p);',
    //     ' float v=smoothstep(.30,1.10,d)*.82;',
    //     ' gl_FragColor=vec4(0.,0.,0.,v);',
    //     '}'
    //   ].join('\n')
    // }));
    // vig.renderOrder = 80;
    // scene.add(vig);

    // ── Resize & input ────────────────────────────────────────────────────────
    function resize() {
      readSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
      renderer.setSize(size.w, size.h, false);
      resizeFarStars();
      resizeConstellation();
    }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function(e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / Math.max(1, r.width) - .5) * 2;
      mouse.y = ((e.clientY - r.top)  / Math.max(1, r.height) - .5) * 2;
    }, { passive: true });
    window.addEventListener('beforeunload', function() { destroyed = true; });
    resize();

    // ── Animation loop ────────────────────────────────────────────────────────
    function animate() {
      if (destroyed) return;
      var t = clock.getElapsedTime();
      damped.x += (mouse.x - damped.x) * .045;
      damped.y += (mouse.y - damped.y) * .045;

      // Terrain uniforms — spatially locked, only time-driven shimmer
      terrainUniforms.uTime.value = t;
      terrainUniforms.uMouse.value.copy(damped);

      // Initialize constellation node positions on first frame
      if (!constellationNodes._initialized) {
        constellationNodes._initialized = true;
        for (var ini = 0; ini < constellationNodes.length; ini++) {
          constellationNodes[ini].x = constellationNodes[ini].baseX;
          constellationNodes[ini].y = constellationNodes[ini].baseY;
        }
      }

      // Draw far static star field (atmosphere layer)
      drawFarStars(t);

      // Draw living constellation (Canvas 2D, cursor-reactive, spring physics)
      drawConstellation(t);

      // Camera is locked — no parallax, no drift
      // Camera stays at CAMERA_START looking at CAMERA_LOOK_AT every frame

      renderer.render(scene, camera);

      // Context loss check
      var gl = renderer.getContext();
      if (t > 0.5 && (!gl || gl.isContextLost() || gl.drawingBufferWidth === 0 || gl.drawingBufferHeight === 0)) {
        startFallback('webgl-context-lost');
        return;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__AFRIPLAN_HERO_V2 = {
      version: 'geological-field-root-fix-v4',
      renderer: 'three-webgl',
      mesh: meshCols + 'x' + meshRows,
      edges: numEdges,
      floatingObjects: 0,
      farStars: FAR_STAR_COUNT,
      constellationNodes: NODE_COUNT,
      layers: ['aurora-css', 'far-stars-canvas-z1', 'constellation-canvas2d-z2', 'geological-terrain-webgl-z3', 'hero-content-z10']
    };
  }

  // ── Canvas 2D fallback ───────────────────────────────────────────────────────
  function startFallback(reason) {
    var hero = document.querySelector('.hero') || document.body;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = 1, H = 1, DPR = 1, start = performance.now(), dust = [];

    function resize() {
      var r = hero.getBoundingClientRect();
      W = Math.max(320, r.width || innerWidth);
      H = Math.max(560, r.height || innerHeight * .94);
      DPR = Math.min(devicePixelRatio || 1, W < 768 ? 1 : 1.4);
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      dust = [];
      for (var i = 0; i < (W < 768 ? 260 : 560); i++) {
        dust.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), p: Math.random() * 6.28 });
      }
    }

    function h(x, z, t) {
      return Math.sin(x * .055 + t * .25) * 8 + Math.sin(z * .075 - t * .18) * 6 + 18 * Math.exp(-((x - 80) * (x - 80) + (z - 70) * (z - 70)) / 1800);
    }

    function project(x, y, z) {
      var s = 430 / Math.max(50, z + 180);
      return { x: W * .5 + x * s, y: H * .69 - y * s * .72 + (z - 35) * 1.5 };
    }

    function mask(u, v, t) {
      var left = Math.abs(u - (.205 + .06 * Math.sin(v * 18 + t * .16)));
      var l = (left < .15 && Math.abs(Math.sin((left - .012) * 96)) > .78) ? 1 : 0;
      var dx = (u - .765) * 1.34, dy = (v - .535) * 2.05, r = Math.sqrt(dx * dx + dy * dy);
      var rr = (r > .04 && r < .285 && Math.abs(Math.sin((r + .016 * Math.sin(u * 31 + v * 17 + t * .22)) * 49 - t * .2)) > .78) ? 1 : 0;
      var cp = (u > .33 && u < .65 && v > .34 && v < .72 && Math.sin(u * 36 + v * 23 + t * .11) > -.25) ? 1 : 0;
      var la = (Math.abs(Math.sin(Math.sqrt((u - .48) * (u - .48) * 1.16 + (v - .90) * (v - .90) * 2.89) * 43 + t * .08)) > .82 && v > .72) ? 1 : 0;
      return Math.max(l, rr, cp * .7, la * .8);
    }

    function draw(now) {
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W * .5, H * .48, 0, W * .5, H * .48, Math.max(W, H) * .8);
      bg.addColorStop(0, '#2b1905'); bg.addColorStop(.35, '#070604'); bg.addColorStop(1, '#020202');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      dust.forEach(function(s) {
        ctx.fillStyle = 'rgba(214,145,18,' + (.10 + s.z * .34) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, .4 + s.z * 1.2, 0, 6.28); ctx.fill();
      });
      var cols = W < 768 ? 90 : 170, rows = W < 768 ? 52 : 92, pts = [];
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var u = i / (cols - 1), v = j / (rows - 1), x = (u - .5) * 260, z = -20 + v * 165;
          pts.push(project(x, h(x, z, t), z));
        }
      }
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var id = y * cols + x, u = x / (cols - 1), v = y / (rows - 1), m = mask(u, v, t), a = .045 + m * .36;
          ctx.strokeStyle = 'rgba(217,148,18,' + a + ')';
          ctx.lineWidth = .75;
          if (x < cols - 1) { ctx.beginPath(); ctx.moveTo(pts[id].x, pts[id].y); ctx.lineTo(pts[id + 1].x, pts[id + 1].y); ctx.stroke(); }
          if (y < rows - 1) { ctx.beginPath(); ctx.moveTo(pts[id].x, pts[id].y); ctx.lineTo(pts[id + cols].x, pts[id + cols].y); ctx.stroke(); }
          if (x < cols - 1 && y < rows - 1) { ctx.beginPath(); ctx.moveTo(pts[id].x, pts[id].y); ctx.lineTo(pts[id + cols + ((x + y) % 2 ? 0 : 1)].x, pts[id + cols + ((x + y) % 2 ? 0 : 1)].y); ctx.stroke(); }
        }
      }
      // vignette
      var vg = ctx.createRadialGradient(W * .5, H * .5, Math.min(W, H) * .25, W * .5, H * .5, Math.max(W, H) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.96)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      requestAnimationFrame(draw);
    }

    resize();
    addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
    window.__AFRIPLAN_HERO_V2 = { version: 'fallback', renderer: 'canvas2d', reason: reason };
  }

  boot();
})();
