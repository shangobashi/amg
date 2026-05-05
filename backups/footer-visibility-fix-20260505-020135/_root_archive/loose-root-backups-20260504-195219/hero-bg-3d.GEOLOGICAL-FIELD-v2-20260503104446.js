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

    // ── Renderer ────────────────────────────────────────────────────────────────
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch (err) {
      startFallback('webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x020202, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
    renderer.setSize(size.w, size.h, false);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();

    // ── Camera — low cinematic, looking into terrain ────────────────────────────
    var camera = new THREE.PerspectiveCamera(44, size.w / size.h, 0.1, 720);
    camera.position.set(0, 1.05, 2.35);
    camera.lookAt(0, -0.12, -1.45);

    // ── Layer 1: Near-black base background ───────────────────────────────────
    var bgUniforms = {
      uTime: { value: 0 },
      uAspect: { value: size.w / size.h },
      uMouse: { value: new THREE.Vector2() }
    };
    var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: bgUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader: [
        'precision mediump float;',
        'varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec2 uMouse;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
        ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
        '            mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
        'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}',
        'void main(){',
        ' vec2 p=(vUv-.5)*vec2(uAspect,1.0);',
        ' float d=length(p);',
        ' float n=fbm(vUv*2.8+vec2(uTime*.008,uTime*.006));',
        ' vec3 col=vec3(.008,.008,.007);',
        ' col += vec3(.55,.32,.05)*smoothstep(.78,.02,d)*(.18+n*.07);',
        ' col *= 1.0-smoothstep(.38,1.05,d)*.90;',
        ' gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n')
    }));
    bg.renderOrder = -200;
    scene.add(bg);

    // ── Layer 2: Amber radial glow behind hero center ─────────────────────────
    var glowUniforms = { uTime: { value: 0 } };
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: glowUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader: [
        'precision mediump float; varying vec2 vUv; uniform float uTime;',
        'void main(){',
        ' vec2 p=vUv-vec2(.5,.48); p.x*=1.6;',
        ' float d=length(p);',
        ' float g=smoothstep(.42,.02,d)*smoothstep(.0,.16,d)*.38;',
        ' float pulse=.88+.12*sin(uTime*.18);',
        ' vec3 col=vec3(.68,.40,.08)*pulse;',
        ' gl_FragColor=vec4(col,g);',
        '}'
      ].join('\n')
    }));
    glow.renderOrder = -190;
    scene.add(glow);

    // ── Layer 3: Amber mineral dust particles ──────────────────────────────────
    var dustCount = isMobile ? 500 : 1400;
    var dustPos = new Float32Array(dustCount * 3);
    var dustSize = new Float32Array(dustCount);
    var dustColor = new Float32Array(dustCount * 3);
    for (var di = 0; di < dustCount; di++) {
      var d3 = di * 3;
      var dz = Math.random();
      dustPos[d3]     = (Math.random() - .5) * 6;
      dustPos[d3 + 1]  = -1.2 + Math.random() * 3.2;
      dustPos[d3 + 2]  = -4 + Math.random() * 4;
      dustSize[di]     = 0.6 + Math.pow(dz, 2.5) * (isMobile ? 1.4 : 2.8);
      dustColor[d3]    = .68 + dz * .26;
      dustColor[d3+1]  = .40 + dz * .28;
      dustColor[d3+2]  = .10 + dz * .12;
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColor, 3));
    var dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: [
        'attribute float aSize; varying vec3 vColor; uniform float uTime; uniform vec2 uMouse;',
        'void main(){',
        ' vec3 p=position;',
        ' p.x += uMouse.x*.4 + sin(uTime*.06+position.z*1.8)*.08;',
        ' p.y += uMouse.y*.25 + cos(uTime*.05+position.x*1.5)*.06;',
        ' vColor=color;',
        ' vec4 mv=modelViewMatrix*vec4(p,1.0);',
        ' gl_PointSize=aSize*(180.0/max(28.0,-mv.z));',
        ' gl_Position=projectionMatrix*mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float; varying vec3 vColor;',
        'void main(){',
        ' vec2 d=gl_PointCoord-.5;',
        ' float a=1.0-smoothstep(.08,.50,length(d));',
        ' gl_FragColor=vec4(vColor,a*.55);',
        '}'
      ].join('\n')
    });
    var dust = new THREE.Points(dustGeo, dustMat);
    dust.renderOrder = -50;
    scene.add(dust);

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

    // Build the six floating objects
    var floatingSchematics = [];

    // Large upper-left polyhedron (icosahedron)
    floatingSchematics.push(mineralObject('ico', -1.35, 0.85, -3.2, 0.42, {
      baseOpacity: .20, midOpacity: .40, brightOpacity: .66, glintOpacity: .84,
      depthFade: 0.90
    }));

    // Medium upper-right polyhedron (dodecahedron)
    floatingSchematics.push(mineralObject('dodec', 1.28, 0.72, -3.6, 0.30, {
      baseOpacity: .18, midOpacity: .36, brightOpacity: .60, glintOpacity: .78,
      depthFade: 0.75
    }));

    // Small mid-right crystal
    floatingSchematics.push(mineralObject('crystal', 0.95, 0.12, -2.8, 0.22, {
      baseOpacity: .16, midOpacity: .34, brightOpacity: .58, glintOpacity: .76,
      depthFade: 0.60
    }));

    // Lower-center-left pyramid crystal
    floatingSchematics.push(mineralObject('pyramid', -0.55, -0.48, -2.4, 0.26, {
      baseOpacity: .18, midOpacity: .38, brightOpacity: .62, glintOpacity: .80,
      depthFade: 0.55
    }));

    // Left orbit glyph
    floatingSchematics.push(orbitGlyph(-0.95, 0.35, -2.6, 0.14, 1.1, 0.4, {
      opacity: .38, beadOpacity: .78, depthFade: 0.70
    }));

    // Upper-right orbit glyph
    floatingSchematics.push(orbitGlyph(1.05, 0.55, -3.1, 0.11, 0.75, -0.5, {
      opacity: .34, beadOpacity: .72, depthFade: 0.65
    }));

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
        ' float h=sin(wu*3.5+uTime*.02+wv*3.0-uTime*.015)*.15+sin(wu*7.0-uTime*.018+wv*5.5+uTime*.012)*.08;',
        ' p.y += h*.18;',
        ' p.x += uMouse.x * .12 * (0.2 + vv);',
        ' p.z += uMouse.y * .10 * (0.15 + vv);',
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
        ' float m=abs(mod(h/sp+.5,1.)-.5);return 1.-ss(w,0.,m);}',
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
        ' float alpha=.045+intensity*.38+features*.28+shimmer*.04;',
        // Depth fade
        ' float depthFade=ss(.08,.28,uv0.y)*ss(1.02,.76,uv0.y);',
        ' float centerFade=ss(.02,.28,uv0.x)*ss(.98,.72,uv0.x);',
        ' alpha*=depthFade*centerFade;',
        ' alpha=clamp(alpha,0.,.72);',
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

    // ── Layer 6: Vignette overlay ─────────────────────────────────────────────
    var vigUniforms = { uTime: { value: 0 } };
    var vig = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: vigUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader: [
        'precision mediump float; varying vec2 vUv; uniform float uTime;',
        'void main(){',
        ' vec2 p=vUv-vec2(.5,.5);',
        ' float d=length(p);',
        ' float v=smoothstep(.30,1.10,d)*.96;',
        ' gl_FragColor=vec4(0.,0.,0.,v);',
        '}'
      ].join('\n')
    }));
    vig.renderOrder = 80;
    scene.add(vig);

    // ── Resize & input ────────────────────────────────────────────────────────
    function resize() {
      readSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
      renderer.setSize(size.w, size.h, false);
      bgUniforms.uAspect.value = size.w / size.h;
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

      bgUniforms.uTime.value = t;       bgUniforms.uMouse.value.copy(damped);
      glowUniforms.uTime.value = t;
      vigUniforms.uTime.value = t;
      terrainUniforms.uTime.value = t;  terrainUniforms.uMouse.value.copy(damped);
      dustMat.uniforms.uTime.value = t; dustMat.uniforms.uMouse.value.copy(damped);

      // Dust drift
      dust.rotation.y = damped.x * .012 + Math.sin(t * .028) * .004;
      dust.rotation.x = damped.y * .008;

      // Animate floating schematics
      for (var fi = 0; fi < floatingSchematics.length; fi++) {
        var obj = floatingSchematics[fi];
        var u = obj.userData;

        // Slow hover drift
        obj.position.y = u.baseY + Math.sin(t / u.hoverPeriod * 6.283 + u.phase) * u.hoverAmp;
        // Slow rotational drift
        obj.rotation.x += u.rotSpeedX;
        obj.rotation.y += u.rotSpeedY;
        obj.rotation.z += u.rotSpeedZ;

        // Breathing glow (update material opacity slightly)
        var breath = .88 + .12 * Math.sin(t * u.breathSpeed + u.breathPhase);
        if (obj.children) {
          obj.children.forEach(function(child) {
            if (child.material && child.material.opacity !== undefined) {
              // Only modulate the base lines, not the bead/orbit mat
              if (child.material.opacity < .7) {
                child.material.opacity = Math.min(.9, child.material.opacity * breath);
              }
            }
          });
        }
      }

      // Camera parallax
      camera.position.x = damped.x * 0.25;
      camera.position.y = 1.05 + damped.y * 0.15;
      camera.lookAt(damped.x * 0.15, -0.12 + damped.y * 0.08, -1.45);

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
      version: 'geological-field-v2',
      renderer: 'three-webgl',
      mesh: meshCols + 'x' + meshRows,
      edges: numEdges,
      floatingObjects: floatingSchematics.length,
      layers: ['base-bg', 'amber-glow', 'mineral-dust', 'floating-schematics', 'geological-terrain', 'vignette']
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
