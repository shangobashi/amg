/**
 * Afriplan — Hero Geological Intelligence Map
 * WebGL/Three.js reconstruction of Screenshot 2026-05-02 224224.png
 * Priority: dominant animated amber triangular geological survey mesh.
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

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch (err) {
      startCanvasFallback('webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x020202, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.35));
    renderer.setSize(size.w, size.h, false);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x020202, 120, 360);

    var camera = new THREE.PerspectiveCamera(44, size.w / size.h, 0.1, 720);
    camera.position.set(0, 43, 158);
    camera.lookAt(0, -58, -42);

    // ── black/gold atmospheric underlay ─────────────────────────────────────
    var bgUniforms = { uTime: { value: 0 }, uAspect: { value: size.w / size.h }, uMouse: { value: new THREE.Vector2() } };
    var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: bgUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader: [
        'precision mediump float;',
        'varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec2 uMouse;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
        'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.04;a*=.5;}return v;}',
        'void main(){',
        ' vec2 p=(vUv-.5)*vec2(uAspect,1.0);',
        ' float d=length(p-vec2(uMouse.x*.035,-.02+uMouse.y*.02));',
        ' float n=fbm(vUv*3.2+vec2(uTime*.012,-uTime*.010));',
        ' vec3 col=vec3(.008,.008,.007);',
        ' col += vec3(.62,.36,.055)*smoothstep(.72,.03,d)*(.22+n*.08);',
        ' col += vec3(.82,.50,.09)*smoothstep(.50,.03,abs(p.y+p.x*.14-.09))*0.035;',
        ' col *= 1.0-smoothstep(.42,1.02,d)*.88;',
        ' gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n')
    }));
    bg.renderOrder = -100;
    scene.add(bg);

    // ── WebGL screen-space geological topology pass ─────────────────────────
    // This pass makes the survey mesh visually dominant: triangular topology,
    // left serpentine seams, center angular plateau, lower arc, right deposit rings.
    var screenTerrainUniforms = { uTime: { value: 0 }, uAspect: { value: size.w / size.h }, uMouse: { value: new THREE.Vector2() } };
    var screenTerrain = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: screenTerrainUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader: [
        'precision mediump float;',
        'varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec2 uMouse;',
        'float aaLine(float d, float w){ return 1.0-smoothstep(w, w+0.010, d); }',
        'float triGrid(vec2 p, float near){',
        '  vec2 g = p * vec2(86.0, 54.0);',
        '  float fx = abs(fract(g.x)-0.5);',
        '  float fy = abs(fract(g.y)-0.5);',
        '  float fd1 = abs(fract(g.x+g.y)-0.5);',
        '  float fd2 = abs(fract(g.x-g.y)-0.5);',
        '  float w = mix(0.030, 0.015, near);',
        '  float l = max(max(aaLine(fx,w), aaLine(fy,w)), max(aaLine(fd1,w*.72), aaLine(fd2,w*.72)*0.55));',
        '  return l;',
        '}',
        'float band(float x){ return smoothstep(.76,.96,abs(sin(x))); }',
        'float leftSerpentine(vec2 uv, float t){',
        ' float path=.205+.060*sin(uv.y*18.0+t*.16)+.024*sin(uv.y*41.0-t*.10);',
        ' float d=abs(uv.x-path);',
        ' return band((d-.012)*96.0)*smoothstep(.155,.035,d)*smoothstep(.06,.18,uv.y)*smoothstep(.78,.30,uv.y);',
        '}',
        'float rightRings(vec2 uv, float t){',
        ' vec2 d=vec2((uv.x-.765)*1.34,(uv.y-.535)*2.05); float r=length(d);',
        ' float dist=.018*sin(uv.x*31.0+uv.y*17.0+t*.22)+.010*sin(uv.x*71.0-uv.y*29.0);',
        ' return band((r+dist)*49.0-t*.20)*smoothstep(.285,.245,r)*smoothstep(.040,.070,r)*(.78+.22*sin(t*.95-r*22.0));',
        '}',
        'float centerPlateau(vec2 uv, float t){',
        ' float zone=smoothstep(.325,.365,uv.x)*smoothstep(.645,.605,uv.x)*smoothstep(.34,.39,uv.y)*smoothstep(.72,.65,uv.y);',
        ' float cuts=smoothstep(-.30,.26,sin(uv.x*36.0+uv.y*23.0+t*.11))*smoothstep(-.45,.18,sin(uv.x*18.0-uv.y*31.0));',
        ' return zone*(.42+.58*cuts);',
        '}',
        'float lowerArc(vec2 uv, float t){',
        ' vec2 d=vec2((uv.x-.48)*1.08,(uv.y-.90)*1.70); float r=length(d);',
        ' return band(r*43.0+t*.08)*smoothstep(.43,.38,r)*smoothstep(.18,.22,r)*smoothstep(.72,.84,uv.y);',
        '}',
        'float rightRidge(vec2 uv, float t){',
        ' float y=.78-(uv.x-.50)*.62+.025*sin(uv.x*22.0+t*.12); return smoothstep(.072,.018,abs(uv.y-y))*smoothstep(.50,.68,uv.x);',
        '}',
        'void main(){',
        '  vec2 suv = vUv;',
        '  float terrainTop = 0.70;',
        '  float h = clamp((terrainTop - suv.y) / terrainTop, 0.0, 1.0);',
        '  if(h <= 0.0){ discard; }',
        '  float near = pow(h, .62);',
        '  float denom = 0.18 + near * 1.62;',
        '  vec2 fuv;',
        '  fuv.x = .5 + (suv.x-.5 + uMouse.x*.010) / denom;',
        '  fuv.y = near + uTime*.006;',
        '  float grid = triGrid(fuv, near);',
        '  float l=leftSerpentine(fuv,uTime);',
        '  float rr=rightRings(fuv,uTime);',
        '  float cp=centerPlateau(fuv,uTime);',
        '  float la=lowerArc(fuv,uTime);',
        '  float rg=rightRidge(fuv,uTime);',
        '  float mask=max(max(max(l,rr),max(cp,la)),rg);',
        '  float edgeFade=smoothstep(.02,.13,suv.x)*smoothstep(.98,.87,suv.x);',
        '  float horizonFade=smoothstep(.02,.22,h);',
        '  float bottomFade=1.0-smoothstep(.94,1.0,h)*.35;',
        '  float alpha=grid*(.055 + mask*.56)*edgeFade*horizonFade*bottomFade;',
        '  vec3 base=vec3(.55,.35,.06); vec3 gold=vec3(.84,.55,.08); vec3 bright=vec3(.94,.70,.23);',
        '  vec3 col=mix(base,gold,smoothstep(.12,.55,mask)); col=mix(col,bright,smoothstep(.65,1.0,mask));',
        '  gl_FragColor=vec4(col, clamp(alpha,0.0,.72));',
        '}'
      ].join('\n')
    }));
    screenTerrain.renderOrder = -3;
    scene.add(screenTerrain);

    // ── dense amber mineral dust field ──────────────────────────────────────
    var starCount = isMobile ? 700 : 1850;
    var starPos = new Float32Array(starCount * 3);
    var starSize = new Float32Array(starCount);
    var starColor = new Float32Array(starCount * 3);
    for (var si = 0; si < starCount; si++) {
      var s3 = si * 3;
      var z = Math.random();
      starPos[s3] = (Math.random() - .5) * 270;
      starPos[s3 + 1] = -5 + Math.random() * 110;
      starPos[s3 + 2] = -220 + Math.random() * 215;
      starSize[si] = .45 + Math.pow(z, 2.2) * (isMobile ? 1.1 : 2.0);
      starColor[s3] = .72 + z * .22;
      starColor[s3 + 1] = .45 + z * .25;
      starColor[s3 + 2] = .13 + z * .13;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3));
    var starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: [
        'attribute float aSize; varying vec3 vColor; varying float vAlpha; uniform float uTime; uniform vec2 uMouse;',
        'void main(){ vec3 p=position; p.x += uMouse.x*(3.0+aSize*2.0)+sin(uTime*.08+position.z*.03)*.55; p.y += uMouse.y*(2.0+aSize)+cos(uTime*.07+position.x*.02)*.35; vColor=color; vAlpha=.45+.25*sin(uTime*.55+position.x*.07+position.z*.03); vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=aSize*(230.0/max(38.0,-mv.z)); gl_Position=projectionMatrix*mv; }'
      ].join('\n'),
      fragmentShader: 'precision mediump float; varying vec3 vColor; varying float vAlpha; void main(){ vec2 d=gl_PointCoord-.5; float a=1.0-smoothstep(.06,.48,length(d)); gl_FragColor=vec4(vColor,a*vAlpha*.72); }'
    });
    var stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -10;
    scene.add(stars);

    // ── dominant triangulated geological terrain mesh ───────────────────────
    var meshCols = isMobile ? 118 : 220;
    var meshRows = isMobile ? 68 : 120;
    var terrainWidth = 510;
    var terrainDepth = 292;
    var vertEstimate = ((meshCols - 1) * meshRows + meshCols * (meshRows - 1) + (meshCols - 1) * (meshRows - 1)) * 2;
    var pos = new Float32Array(vertEstimate * 3);
    var uv = new Float32Array(vertEstimate * 2);
    var muv = new Float32Array(vertEstimate * 2);
    var kind = new Float32Array(vertEstimate);
    var cursor = 0;

    function addSeg(u1, v1, u2, v2, k) {
      var mx = (u1 + u2) * .5;
      var my = (v1 + v2) * .5;
      var arr = [[u1, v1], [u2, v2]];
      for (var q = 0; q < 2; q++) {
        var uu = arr[q][0], vv = arr[q][1];
        var x = (uu - .5) * terrainWidth;
        var zpos = -185 + vv * terrainDepth;
        pos[cursor * 3] = x;
        pos[cursor * 3 + 1] = -82;
        pos[cursor * 3 + 2] = zpos;
        uv[cursor * 2] = uu;
        uv[cursor * 2 + 1] = vv;
        muv[cursor * 2] = mx;
        muv[cursor * 2 + 1] = my;
        kind[cursor] = k;
        cursor++;
      }
    }
    for (var r = 0; r < meshRows; r++) {
      for (var c = 0; c < meshCols - 1; c++) addSeg(c / (meshCols - 1), r / (meshRows - 1), (c + 1) / (meshCols - 1), r / (meshRows - 1), 0.0);
    }
    for (var c2 = 0; c2 < meshCols; c2++) {
      for (var r2 = 0; r2 < meshRows - 1; r2++) addSeg(c2 / (meshCols - 1), r2 / (meshRows - 1), c2 / (meshCols - 1), (r2 + 1) / (meshRows - 1), 1.0);
    }
    for (var rr = 0; rr < meshRows - 1; rr++) {
      for (var cc = 0; cc < meshCols - 1; cc++) {
        var u0 = cc / (meshCols - 1), u1 = (cc + 1) / (meshCols - 1);
        var v0 = rr / (meshRows - 1), v1 = (rr + 1) / (meshRows - 1);
        if ((cc + rr) % 2 === 0) addSeg(u0, v0, u1, v1, 2.0);
        else addSeg(u1, v0, u0, v1, 2.0);
      }
    }
    var terrainGeo = new THREE.BufferGeometry();
    terrainGeo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, cursor * 3), 3));
    terrainGeo.setAttribute('aUv', new THREE.BufferAttribute(uv.subarray(0, cursor * 2), 2));
    terrainGeo.setAttribute('aMaskUv', new THREE.BufferAttribute(muv.subarray(0, cursor * 2), 2));
    terrainGeo.setAttribute('aKind', new THREE.BufferAttribute(kind.subarray(0, cursor), 1));

    var terrainUniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
    var terrainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: terrainUniforms,
      vertexShader: [
        'attribute vec2 aUv; attribute vec2 aMaskUv; attribute float aKind;',
        'uniform float uTime; uniform vec2 uMouse;',
        'varying vec2 vUv; varying vec2 vMaskUv; varying float vKind; varying float vDepth;',
        'float peak(vec2 p, vec2 c, float amp, float rad){ vec2 d=p-c; return amp*exp(-dot(d,d)/rad); }',
        'void main(){',
        ' vec3 p=position;',
        ' vec2 map=vec2((aUv.x-.5)*2.0, aUv.y);',
        ' float t=uTime;',
        ' float h=0.0;',
        ' h += sin(map.x*5.4 + map.y*7.2 + t*.18)*2.2;',
        ' h += sin(map.x*12.0 - map.y*6.5 - t*.13)*1.3;',
        ' h += peak(aUv, vec2(.76,.52), 8.0, .010);',
        ' h += peak(aUv, vec2(.46,.56), 5.0, .028);',
        ' h += peak(aUv, vec2(.22,.36), 4.0, .020);',
        ' p.y += h;',
        ' p.x += uMouse.x * 5.0 * (0.2 + aUv.y);',
        ' p.z += uMouse.y * 4.0 * (0.15 + aUv.y);',
        ' vUv=aUv; vMaskUv=aMaskUv; vKind=aKind; vDepth=aUv.y;',
        ' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform float uTime; uniform vec2 uMouse;',
        'varying vec2 vUv; varying vec2 vMaskUv; varying float vKind; varying float vDepth;',
        'float linePulse(float x){ return smoothstep(.78,.97,abs(sin(x))); }',
        'float leftSerpentine(vec2 uv, float t){',
        ' float path=.205+.060*sin(uv.y*18.0+t*.16)+.024*sin(uv.y*41.0-t*.10);',
        ' float d=abs(uv.x-path);',
        ' float repeated=linePulse((d-.012)*96.0);',
        ' float gate=smoothstep(.155,.035,d)*smoothstep(.06,.18,uv.y)*smoothstep(.78,.30,uv.y);',
        ' return repeated*gate;',
        '}',
        'float rightRings(vec2 uv, float t){',
        ' vec2 d=vec2((uv.x-.765)*1.34,(uv.y-.535)*2.05);',
        ' float r=length(d);',
        ' float distortion=.018*sin(uv.x*31.0+uv.y*17.0+t*.22)+.010*sin(uv.x*71.0-uv.y*29.0);',
        ' float rings=linePulse((r+distortion)*49.0-t*.20);',
        ' float gate=smoothstep(.285,.245,r)*smoothstep(.040,.070,r);',
        ' float shimmer=.78+.22*sin(t*.95-r*22.0);',
        ' return rings*gate*shimmer;',
        '}',
        'float centerPlateau(vec2 uv, float t){',
        ' float zone=smoothstep(.325,.365,uv.x)*smoothstep(.645,.605,uv.x)*smoothstep(.34,.39,uv.y)*smoothstep(.72,.65,uv.y);',
        ' float cuts=smoothstep(-.30,.26,sin(uv.x*36.0+uv.y*23.0+t*.11))*smoothstep(-.45,.18,sin(uv.x*18.0-uv.y*31.0));',
        ' return zone*(.42+.58*cuts);',
        '}',
        'float lowerArc(vec2 uv, float t){',
        ' vec2 d=vec2((uv.x-.48)*1.08,(uv.y-.90)*1.70);',
        ' float r=length(d);',
        ' float bands=linePulse(r*43.0+t*.08);',
        ' return bands*smoothstep(.43,.38,r)*smoothstep(.18,.22,r)*smoothstep(.72,.84,uv.y);',
        '}',
        'float rightRidge(vec2 uv, float t){',
        ' float y=.78-(uv.x-.50)*.62+.025*sin(uv.x*22.0+t*.12);',
        ' float d=abs(uv.y-y);',
        ' return smoothstep(.072,.018,d)*smoothstep(.50,.68,uv.x);',
        '}',
        'void main(){',
        ' float t=uTime;',
        ' vec2 uv=vMaskUv;',
        ' float l=leftSerpentine(uv,t);',
        ' float rr=rightRings(uv,t);',
        ' float cp=centerPlateau(uv,t);',
        ' float la=lowerArc(uv,t);',
        ' float rg=rightRidge(uv,t);',
        ' float rare=smoothstep(.985,.999,fract(sin(dot(floor(uv*vec2(160.0,90.0)),vec2(12.9898,78.233)))*43758.5453 + t*.035));',
        ' float intensity=.12 + l*.86 + rr*1.12 + cp*.70 + la*.82 + rg*.72 + rare*.32;',
        ' float edgeFade=smoothstep(.015,.10,uv.x)*smoothstep(.985,.90,uv.x);',
        ' float horizonFade=smoothstep(.035,.22,uv.y);',
        ' float bottomFade=1.0-smoothstep(.96,1.015,uv.y)*.42;',
        ' float alpha=(.055 + intensity*.34)*edgeFade*horizonFade*bottomFade;',
        ' alpha *= .72 + .28*smoothstep(.18,1.0,uv.y);',
        ' vec3 base=vec3(.48,.29,.04);',
        ' vec3 gold=vec3(.85,.55,.08);',
        ' vec3 bright=vec3(.98,.72,.23);',
        ' vec3 col=mix(base,gold,smoothstep(.18,.78,intensity));',
        ' col=mix(col,bright,smoothstep(.90,1.55,intensity));',
        ' gl_FragColor=vec4(col, clamp(alpha,0.0,.66));',
        '}'
      ].join('\n')
    });
    var terrain = new THREE.LineSegments(terrainGeo, terrainMat);
    terrain.frustumCulled = false;
    terrain.renderOrder = 5;
    scene.add(terrain);

    // ── floating mineral objects and orbit icons ────────────────────────────
    var wireMat = new THREE.MeshBasicMaterial({ color: 0xc99524, wireframe: true, transparent: true, opacity: .30, depthWrite: false, blending: THREE.AdditiveBlending });
    var orbitMat = new THREE.MeshBasicMaterial({ color: 0xe0aa38, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    var moonMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: .88, depthWrite: false, blending: THREE.AdditiveBlending });
    function mineral(kind, x, y, z, r, ring) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      var geo = kind === 'tetra' ? new THREE.TetrahedronGeometry(r, 0) : (kind === 'oct' ? new THREE.OctahedronGeometry(r, 0) : new THREE.IcosahedronGeometry(r, 0));
      var body = new THREE.Mesh(geo, wireMat.clone());
      g.add(body); g.userData.body = body; g.userData.baseY = y; g.userData.phase = Math.random() * 6.28; g.userData.speed = .12 + Math.random() * .08;
      if (ring) {
        var tor = new THREE.Mesh(new THREE.TorusGeometry(r * 1.55, Math.max(.035, r * .011), 5, 96), orbitMat.clone());
        tor.rotation.set(1.24, .18, ring > 1 ? -.52 : .64);
        var moon = new THREE.Mesh(new THREE.SphereGeometry(Math.max(.45, r * .095), 16, 16), moonMat.clone());
        g.add(tor); g.add(moon); g.userData.ring = tor; g.userData.moon = moon; g.userData.moonR = r * 1.55;
      }
      scene.add(g); return g;
    }
    var minerals = [
      mineral('ico', -76, 38, -82, 10.5, 1),
      mineral('ico', 82, 42, -90, 7.4, 2),
      mineral('oct', 48, 14, -58, 5.2, 0),
      mineral('tetra', -28, -23, -38, 7.0, 0)
    ];

    function resize() {
      readSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.35));
      renderer.setSize(size.w, size.h, false);
      bgUniforms.uAspect.value = size.w / size.h;
      screenTerrainUniforms.uAspect.value = size.w / size.h;
      var aspectBoost = Math.max(1.0, (size.w / Math.max(1, size.h)) / 1.66);
      terrain.scale.set(aspectBoost, 1, 1);
    }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / Math.max(1, r.width) - .5) * 2;
      mouse.y = ((e.clientY - r.top) / Math.max(1, r.height) - .5) * 2;
    }, { passive: true });
    window.addEventListener('beforeunload', function () { destroyed = true; });
    resize();

    function animate() {
      if (destroyed) return;
      var t = clock.getElapsedTime();
      damped.x += (mouse.x - damped.x) * .045;
      damped.y += (mouse.y - damped.y) * .045;
      bgUniforms.uTime.value = t; bgUniforms.uMouse.value.copy(damped);
      screenTerrainUniforms.uTime.value = t; screenTerrainUniforms.uMouse.value.copy(damped);
      terrainUniforms.uTime.value = t; terrainUniforms.uMouse.value.copy(damped);
      starMat.uniforms.uTime.value = t; starMat.uniforms.uMouse.value.copy(damped);
      stars.rotation.y = damped.x * .018 + Math.sin(t * .035) * .006;
      stars.rotation.x = damped.y * .012;
      for (var i = 0; i < minerals.length; i++) {
        var m = minerals[i], u = m.userData;
        m.position.y = u.baseY + Math.sin(t * .28 + u.phase) * 1.6;
        m.rotation.x += u.speed * .004;
        m.rotation.y += u.speed * .007;
        m.rotation.z += u.speed * .003;
        if (u.ring) {
          u.ring.rotation.z += .004 + i * .001;
          var a = t * (.34 + u.speed) + u.phase;
          u.moon.position.set(Math.cos(a) * u.moonR, Math.sin(a) * u.moonR * .36, Math.sin(a) * u.moonR * .18);
        }
      }
      camera.position.x = damped.x * 3.2;
      camera.position.y = 43 + damped.y * 1.6;
      camera.lookAt(damped.x * 2.0, -58 + damped.y * 1.0, -42);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__AFRIPLAN_HERO_WEBGL__ = {
      version: 'geological-intelligence-map-webgl-v1',
      renderer: 'three-webgl',
      grid: (meshCols + 'x' + meshRows),
      triangularCells: true,
      segments: cursor / 2,
      contourMasks: ['leftSerpentine', 'rightRings', 'centerPlateau', 'lowerArc', 'rightRidge'],
      fullWidthMesh: true,
      particles: starCount,
      mineralObjects: minerals.length
    };
  }

  // Emergency visual fallback only for environments with broken/no WebGL. The intended renderer is WebGL.
  function startCanvasFallback(reason) {
    var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = 1, H = 1, DPR = 1, start = performance.now(), stars = [];
    function resize() {
      var r = hero.getBoundingClientRect(); W = Math.max(320, r.width || innerWidth); H = Math.max(560, r.height || innerHeight * .94); DPR = Math.min(devicePixelRatio || 1, W < 768 ? 1 : 1.4);
      canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(DPR,0,0,DPR,0,0); stars = [];
      for (var i=0;i<(W<768?260:720);i++) stars.push({x:Math.random()*W,y:Math.random()*H*.75,z:Math.random(),p:Math.random()*6.28});
    }
    function h(x,z,t){return Math.sin(x*.055+t*.25)*8+Math.sin(z*.075-t*.18)*6+18*Math.exp(-((x-80)*(x-80)+(z-70)*(z-70))/1800);}
    function project(x,y,z){var s=430/Math.max(50,z+180);return {x:W*.5+x*s,y:H*.69-y*s*.72+(z-35)*1.5};}
    function mask(u,v,t){var left=Math.abs(u-(.205+.06*Math.sin(v*18+t*.16))); var l=(left<.15&&Math.abs(Math.sin((left-.012)*96))>.78)?1:0; var dx=(u-.765)*1.34,dy=(v-.535)*2.05,r=Math.sqrt(dx*dx+dy*dy); var rr=(r>.04&&r<.285&&Math.abs(Math.sin((r+.016*Math.sin(u*31+v*17+t*.22))*49-t*.2))>.78)?1:0; var cp=(u>.33&&u<.65&&v>.34&&v<.72&&Math.sin(u*36+v*23+t*.11)>-.25)?1:0; var la=(Math.abs(Math.sin(Math.sqrt((u-.48)*(u-.48)*1.16+(v-.90)*(v-.90)*2.89)*43+t*.08))>.82&&v>.72)?1:0; return Math.max(l,rr,cp*.7,la*.8);}
    function draw(now){var t=(now-start)/1000;ctx.clearRect(0,0,W,H);var bg=ctx.createRadialGradient(W*.5,H*.48,0,W*.5,H*.48,Math.max(W,H)*.8);bg.addColorStop(0,'#2b1905');bg.addColorStop(.35,'#070604');bg.addColorStop(1,'#020202');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='screen';stars.forEach(function(s){ctx.fillStyle='rgba(214,145,18,'+(.10+s.z*.34)+')';ctx.beginPath();ctx.arc(s.x,s.y,.4+s.z*1.2,0,6.28);ctx.fill();});var cols=W<768?90:170,rows=W<768?52:92,pts=[];for(var j=0;j<rows;j++){for(var i=0;i<cols;i++){var u=i/(cols-1),v=j/(rows-1),x=(u-.5)*260,z=-20+v*165;pts.push(project(x,h(x,z,t),z));}}for(var y=0;y<rows;y++){for(var x=0;x<cols;x++){var id=y*cols+x,u=x/(cols-1),v=y/(rows-1),m=mask(u,v,t),a=.045+m*.36;ctx.strokeStyle='rgba(217,148,18,'+a+')';ctx.lineWidth=.75;if(x<cols-1){ctx.beginPath();ctx.moveTo(pts[id].x,pts[id].y);ctx.lineTo(pts[id+1].x,pts[id+1].y);ctx.stroke();}if(y<rows-1){ctx.beginPath();ctx.moveTo(pts[id].x,pts[id].y);ctx.lineTo(pts[id+cols].x,pts[id+cols].y);ctx.stroke();}if(x<cols-1&&y<rows-1){ctx.beginPath();ctx.moveTo(pts[id].x,pts[id].y);ctx.lineTo(pts[id+cols+((x+y)%2?0:1)].x,pts[id+cols+((x+y)%2?0:1)].y);ctx.stroke();}}}requestAnimationFrame(draw);}resize();addEventListener('resize',resize,{passive:true});requestAnimationFrame(draw);window.__AFRIPLAN_HERO_WEBGL__={version:'geology-fallback',renderer:'canvas2d',reason:reason};
  }

  boot();
})();
