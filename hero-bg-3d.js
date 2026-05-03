/**
 * Afriplan - Hero 3D Background
 * Golden Screenshot Forensic Restoration v2
 */
(function () {
  'use strict';
  var canvasEl = document.getElementById('heroBgCanvas');
  if (!canvasEl) return;
  var heroEl = document.querySelector('.hero');
  function getHeroSize() {
    if (heroEl) return { w: heroEl.offsetWidth, h: heroEl.offsetHeight };
    return { w: window.innerWidth, h: window.innerHeight };
  }
  var heroSize = getHeroSize();
  var isMobile = heroSize.w < 768;
  var renderer = new THREE.WebGLRenderer({
    canvas: canvasEl, alpha: false, antialias: !isMobile, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 2));
  renderer.setSize(heroSize.w, heroSize.h);
  renderer.setClearColor(0x050505, 1);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, heroSize.w / heroSize.h, 0.1, 1000);
  camera.position.set(0, 0, 90);
  camera.lookAt(0, 0, 0);
  (function () {
    var bw = Math.max(2, Math.floor(heroSize.w * 0.25));
    var bh = Math.max(2, Math.floor(heroSize.h * 0.25));
    var bc = document.createElement('canvas');
    bc.width = bw; bc.height = bh;
    var ctx = bc.getContext('2d');
    var g = ctx.createRadialGradient(bw * 0.5, bh * 0.38, 0, bw * 0.5, bh * 0.38, bw * 0.55);
    g.addColorStop(0.0, 'rgba(26,18,8,0.55)');
    g.addColorStop(0.4, 'rgba(18,12,5,0.25)');
    g.addColorStop(0.75, 'rgba(5,5,5,0.08)');
    g.addColorStop(1.0, 'rgba(5,5,5,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, bw, bh);
    var tex = new THREE.CanvasTexture(bc);
    var bg = new THREE.Mesh(
      new THREE.PlaneGeometry(heroSize.w * 1.1, heroSize.h * 1.1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    bg.position.z = -60;
    scene.add(bg);
  })();
  (function () {
    var count = isMobile ? 120 : 300;
    var maxX = heroSize.w, maxY = heroSize.h * 0.58;
    var palette = [[74,50,16],[100,65,20],[146,92,18],[196,129,31],[212,175,55]];
    var pW = [0.40, 0.30, 0.18, 0.09, 0.03];
    var rng = 9183;
    function rand() { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; }
    var sData = [];
    for (var i = 0; i < count; i++) {
      var xf = rand(), yf = rand();
      var cx = Math.abs(xf - 0.5) * 2.0;
      yf = yf * (1.0 - Math.pow(cx, 2.0) * 0.6);
      var sx = Math.floor(xf * maxX), sy = Math.floor(yf * maxY);
      var r = rand(), ci = 0, cum = 0;
      for (var j = 0; j < pW.length; j++) { cum += pW[j]; if (r < cum) { ci = j; break; } }
      var sz = rand() < 0.72 ? 1 : 2;
      sData.push({ x: sx, y: sy, c: palette[ci], sz: sz, a: 0.28 + rand() * 0.56 });
    }
    var sc = document.createElement('canvas');
    sc.width = 4; sc.height = count * 4;
    var sctx = sc.getContext('2d');
    for (var i = 0; i < count; i++) {
      var d = sData[i];
      sctx.fillStyle = 'rgba(' + d.c[0] + ',' + d.c[1] + ',' + d.c[2] + ',' + d.a + ')' ;
      sctx.fillRect(0, i * 4, d.sz, d.sz);
    }
    var starTex = new THREE.CanvasTexture(sc);
    starTex.magFilter = THREE.NearestFilter;
    starTex.minFilter = THREE.NearestFilter;
    var sGeo = new THREE.BufferGeometry();
    var sPos = new Float32Array(count * 3), sUV = new Float32Array(count * 2);
    for (var i = 0; i < count; i++) {
      sPos[i * 3] = sData[i].x - heroSize.w * 0.5;
      sPos[i * 3 + 1] = sData[i].y - heroSize.h * 0.5;
      sPos[i * 3 + 2] = -(Math.random() * 20);
      sUV[i * 2] = (sData[i].sz === 1 ? 0.5 : 1.5) / 4;
      sUV[i * 2 + 1] = (i * 4 + 0.5) / (count * 4);
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('uv', new THREE.BufferAttribute(sUV, 2));
    var sMat = new THREE.PointsMaterial({
      size: isMobile ? 2.0 : 2.5,
      map: starTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: false
    });
    scene.add(new THREE.Points(sGeo, sMat));
  })();
  var tUni = { uTime: { value: 0.0 } };
  var topoVert = [
    'varying float vH; varying vec2 vUv; uniform float uTime;',
    'void main(){',
    '  vUv = uv; vec3 pos = position; float h = 0.0;',
    '  float nx = pos.x * 0.007, ny = pos.y * 0.009;',
    '  h = sin(nx*4.1+ny*3.3)*0.8 + sin(nx*7.7-ny*5.9)*0.4 + sin(nx*13.0+ny*11.0)*0.2;',
    '  float lM = smoothstep(0.42,0.28,vUv.x)*smoothstep(0.62,0.45,vUv.y);',
    '  float lb = sin(vUv.y*10.0+vUv.x*5.5+1.2)*0.5+0.5;',
    '  float lc = sin(vUv.y*14.0+lb*3.14)*0.5+0.5;',
    '  h += lM*(lb*2.5+lc*1.5-2.0);',
    '  float pX = smoothstep(0.28,0.38,vUv.x)*smoothstep(0.72,0.62,vUv.x);',
    '  float pY = smoothstep(0.50,0.42,vUv.y)*smoothstep(0.30,0.38,vUv.y);',
    '  h = mix(h,0.0,pX*pY*0.85);',
    '  float bX = smoothstep(0.28,0.38,vUv.x)*smoothstep(0.72,0.62,vUv.x);',
    '  float bY = smoothstep(0.34,0.22,vUv.y);',
    '  float a1 = sin(vUv.x*9.0+0.5)*0.5+0.5;',
    '  float a2 = sin(vUv.x*6.5-1.2)*0.5+0.5;',
    '  h += bX*bY*(a1*1.2+a2*0.8-0.8);',
    '  float rdx = vUv.x-0.74, rdy = vUv.y-0.42;',
    '  float rdist = sqrt(rdx*rdx*2.2+rdy*rdy*1.8);',
    '  float rings = sin(rdist*22.0)*0.5+0.5;',
    '  float rM = smoothstep(0.42,0.28,vUv.x)*smoothstep(0.58,0.42,vUv.y);',
    '  h += rM*rings*2.0;',
    '  float fX = (vUv.x-0.60)/0.35, fY = (0.22-vUv.y)/0.22;',
    '  float iF = smoothstep(0.0,0.05,fY)*smoothstep(1.0,0.3,fX)*smoothstep(0.0,0.1,fX)*smoothstep(1.0,0.5,fY);',
    '  float sl = sin((fX-fY)*3.14159*1.5*6.0+fY*4.0)*0.5+0.5;',
    '  float sc2 = sin(fX*8.0+fY*5.0)*0.5+0.5;',
    '  h += iF*(sl*1.8+sc2*0.9-1.0);',
    '  vH = h; pos.z += h * 2.5;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);',
    '}'
  ].join(chr(10));
  var topoFrag = [
    'varying float vH; varying vec2 vUv; uniform float uTime;',
    'void main(){',
    '  vec3 lc = vec3(0.82,0.52,0.10), bc = vec3(0.04,0.035,0.03);',
    '  float hv = clamp(vH*0.15+0.5,0.0,1.0);',
    '  float cont = sin(vH*3.8)*0.5+0.5; cont = smoothstep(0.35,0.65,cont);',
    '  float alpha = mix(0.38,0.92,cont*hv);',
    '  gl_FragColor = vec4(mix(bc,lc,cont*0.85),alpha);',
    '}'
  ].join(chr(10));
  var topoMat = new THREE.ShaderMaterial({
    vertexShader: topoVert, fragmentShader: topoFrag,
    uniforms: tUni, wireframe: true, transparent: true, depthWrite: false
  });
  var topoMesh = new THREE.Mesh(new THREE.PlaneGeometry(260, 160, 90, 60), topoMat);
  topoMesh.rotation.x = -Math.PI / 2.5;
  topoMesh.position.set(0, -22, -32);
  scene.add(topoMesh);
  function addIco(x, y, z, r, op) {
    op = op || 0.18;
    var m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      new THREE.MeshBasicMaterial({ color: 0xC9943A, wireframe: true, transparent: true, opacity: op, depthWrite: false })
    );
    m.position.set(x, y, z); scene.add(m);
  }
  function addTorus(x, y, z, sr, tr, op) {
    op = op || 0.14;
    var s = new THREE.Mesh(
      new THREE.SphereGeometry(sr, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xC9943A, wireframe: true, transparent: true, opacity: op * 0.8, depthWrite: false })
    );
    s.position.set(x, y, z); scene.add(s);
    var t = new THREE.Mesh(
      new THREE.TorusGeometry(tr, 0.25, 4, 20),
      new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: op, depthWrite: false })
    );
    t.position.set(x, y, z);
    t.rotation.x = Math.PI * 0.3;
    t.rotation.z = Math.PI * 0.15;
    scene.add(t);
  }
  addIco(-55, 20, -22, 9, 0.16);
  addTorus(-48, -5, -28, 2.5, 5.0, 0.13);
  addIco(52, 28, -28, 6.5, 0.15);
  addIco(30, 12, -18, 4.5, 0.14);
  addTorus(-5, 30, -38, 2.0, 4.2, 0.12);
  addIco(-32, 38, -35, 3.5, 0.12);
  var nodeDefs = [
    { x: -38, y: 8, z: -18 },
    { x: 42, y: 5, z: -25 },
    { x: 12, y: 28, z: -30 },
    { x: -18, y: -8, z: -15 },
    { x: 55, y: -18, z: -35 },
    { x: -60, y: 15, z: -40 },
    { x: 28, y: 40, z: -45 }
  ];
  var attractors = nodeDefs.map(function (nd) {
    var c = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.65, depthWrite: false })
    );
    c.position.set(nd.x, nd.y, nd.z); scene.add(c); return c;
  });
  window.addEventListener('resize', function () {
    var hs = getHeroSize();
    camera.aspect = hs.w / hs.h;
    camera.updateProjectionMatrix();
    renderer.setSize(hs.w, hs.h);
  });
  var clock = new THREE.Clock(), startTime = null;
  function animate(ts) {
    requestAnimationFrame(animate);
    if (startTime === null) startTime = ts;
    var t = (ts - startTime) / 1000;
    tUni.uTime.value = t * 0.04;
    attractors.forEach(function (c, i) {
      c.material.opacity = 0.35 + 0.15 * (0.8 + 0.2 * Math.sin(t * 1.2 + i * 1.9));
    });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
  (function () {
    if (location.search.indexOf('debugMesh=1') === -1) return;
    topoMat.wireframe = true; topoMat.transparent = false; topoMat.opacity = 1.0;
    topoMat.fragmentShader = 'varying float vH; void main(){gl_FragColor=vec4(1.0,0.85,0.2,1.0);}';
    topoMat.needsUpdate = true;
    var hc = document.querySelector('.hero__content');
    if (hc) hc.style.display = 'none';
    var c = document.getElementById('heroBgCanvas');
    if (c) c.style.zIndex = '9999';
    console.log('[DEBUG] Mesh proof mode active');
  })();
})();
