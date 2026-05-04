/* Afriplan Hero Background — reference-family Canvas2D geological intelligence field
   Path B: deterministic Canvas2D. No WebGL, no Three.js, no floating objects.
   Version: 20260503-reference-family-02
*/
(function () {
  'use strict';

  var VERSION = '20260503-reference-family-02';
  var DEBUG_MESH = /(?:\?|&)debugMesh=1(?:&|$)/.test(location.search);
  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;
  var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  canvas.classList.add('hero-mesh-canvas');
  canvas.setAttribute('data-renderer', 'canvas2d-reference-family');
  canvas.setAttribute('data-version', VERSION);

  if (DEBUG_MESH) {
    document.documentElement.classList.add('afriplan-debug-mesh');
    var st = document.createElement('style');
    st.textContent = '.afriplan-debug-mesh body{overflow:hidden!important;background:#000!important}.afriplan-debug-mesh .nav,.afriplan-debug-mesh .hero__content,.afriplan-debug-mesh .section,.afriplan-debug-mesh .section--tight,.afriplan-debug-mesh .footer{display:none!important}.afriplan-debug-mesh .hero{min-height:100vh!important;padding:0!important;background:#000!important}.afriplan-debug-mesh .hero__aurora,.afriplan-debug-mesh .hero__aurora-2,.afriplan-debug-mesh .hero__glow-overlay,.afriplan-debug-mesh .hero__grain-overlay,.afriplan-debug-mesh .hero__particles,.afriplan-debug-mesh .hero__energy-band{display:none!important}.afriplan-debug-mesh #heroBgCanvas{z-index:9999!important;background:#000!important}';
    document.head.appendChild(st);
  }

  var GOLD = {
    dim: [90, 55, 8],
    base: [142, 88, 12],
    mid: [188, 123, 23],
    strong: [224, 157, 42],
    hot: [255, 198, 86],
    debug: [0, 255, 255]
  };

  function rngFactory(seed) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / Math.max(1e-5, b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  function distance(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function gaussian(x, target, width) { var d = (x - target) / width; return Math.exp(-d * d); }

  var W = 1, H = 1, DPR = 1, mobile = false;
  var stars = [], nodes = [], links = [], terrain = { points: [], segments: [], contours: [] };
  var pointer = { x: 0.5, y: 0.36, px: 0.5, py: 0.36, vx: 0, vy: 0 };

  function project(u, v) {
    // v=0 horizon, v=1 near edge. The mesh starts high enough to dominate the lower hero.
    var horizonY = H * 0.535;
    var nearY = H * 1.18;
    var p = Math.pow(v, 1.45);
    var y = horizonY + p * (nearY - horizonY);
    var spread = W * (0.50 + v * 1.95);
    var x = W * 0.5 + (u - 0.5) * spread;
    return { x: x, y: y };
  }

  function heightField(u, v) {
    // Fixed topographic scalar field: ridges/basins are spatial, not time-scrolled.
    var leftStrata = (1 - smooth(0.22, 0.54, u)) *
      (0.5 + 0.5 * Math.sin(v * 42 + Math.sin(u * 17) * 3.2 + u * 7));
    leftStrata = Math.pow(leftStrata, 7) * smooth(0.02, 0.28, v);

    var plateau = Math.max(
      gaussian(Math.abs((v - 0.36) + (u - 0.48) * 0.52), 0, 0.035),
      gaussian(Math.abs((v - 0.54) - (u - 0.53) * 0.40), 0, 0.042),
      gaussian(Math.abs((u - 0.49) + (v - 0.47) * 0.20), 0, 0.060)
    ) * smooth(0.26, 0.42, u) * (1 - smooth(0.72, 0.92, u));

    var lower = distance(u, v, 0.50, 0.91);
    var lowerArcs = Math.max(
      gaussian(lower, 0.18, 0.012), gaussian(lower, 0.27, 0.014),
      gaussian(lower, 0.36, 0.018), gaussian(lower, 0.47, 0.023)
    ) * smooth(0.50, 0.78, v);

    var right = distance(u, v, 0.80, 0.57);
    var rightRings = Math.max(
      gaussian(right, 0.045, 0.010), gaussian(right, 0.088, 0.011),
      gaussian(right, 0.135, 0.013), gaussian(right, 0.188, 0.016), gaussian(right, 0.248, 0.020)
    ) * smooth(0.58, 0.75, u);

    var longRidge = gaussian(Math.abs((u - 0.70) + Math.sin(v * 9.5) * 0.050), 0, 0.020) * smooth(0.32, 0.68, v);
    var mineralNoise = Math.pow(Math.max(0, 0.5 + 0.5 * Math.sin(Math.sin(u * 8.7) * 2.4 + v * 21.0 + u * 5.2)), 9) * 0.35;
    return clamp(Math.max(leftStrata * 0.95, plateau, lowerArcs, rightRings, longRidge * 0.75, mineralNoise), 0, 1);
  }

  function warp(u, v) {
    var ring = Math.exp(-Math.pow(distance(u, v, 0.80, 0.57) / 0.24, 2));
    var basin = Math.exp(-Math.pow(distance(u, v, 0.50, 0.91) / 0.38, 2));
    var left = 1 - smooth(0.20, 0.55, u);
    var du = Math.sin(v * 18 + u * 4.0) * 0.014 * left + (u - 0.80) * ring * 0.026;
    var dv = Math.sin(u * 15 + v * 4.2) * 0.012 * smooth(0.10, 0.40, v) + (v - 0.57) * ring * 0.020 - basin * 0.010;
    return { u: clamp(u + du, -0.10, 1.10), v: clamp(v + dv, 0, 1.08) };
  }

  function rebuild() {
    var rect = hero.getBoundingClientRect();
    W = Math.max(320, Math.round(rect.width || innerWidth));
    H = Math.max(560, Math.round(rect.height || innerHeight));
    mobile = W < 768;
    DPR = Math.min(devicePixelRatio || 1, mobile ? 1.2 : 1.65);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var rng = rngFactory(0xAF520224);
    stars = [];
    var starCount = mobile ? 1400 : 4600;
    for (var i = 0; i < starCount; i++) {
      var band = rng();
      var y = Math.pow(rng(), 1.18) * H * 0.84;
      var x = rng() * W;
      // Nebular concentration left/right, not uniform wallpaper.
      if (band < 0.46) { x = W * (0.18 + rng() * 0.66); y = H * (0.06 + Math.pow(rng(), 1.4) * 0.58); }
      var tier = rng();
      stars.push({ x: x, y: y, r: tier > 0.992 ? mix(0.95, 1.55, rng()) : mix(0.16, 0.55, rng()), a: mix(0.16, tier > 0.965 ? 0.72 : 0.42, rng()), p: rng() * 6.283, s: mix(0.05, 0.18, rng()) });
    }

    nodes = [];
    var nodeCount = mobile ? 96 : 190;
    for (var n = 0; n < nodeCount; n++) {
      var nx = rng() * W;
      var ny = H * (0.05 + Math.pow(rng(), 1.12) * 0.58);
      if (rng() < 0.55) nx = W * (0.15 + rng() * 0.70);
      nodes.push({ baseX: nx, baseY: ny, x: nx, y: ny, vx: 0, vy: 0, d: mix(0.35, 1, rng()), r: mix(0.55, 1.35, rng()), p: rng() * 6.283 });
    }
    links = [];
    for (var a = 0; a < nodes.length; a++) {
      var near = [];
      for (var b = 0; b < nodes.length; b++) if (a !== b) {
        var dd = distance(nodes[a].baseX, nodes[a].baseY, nodes[b].baseX, nodes[b].baseY);
        if (dd < (mobile ? 100 : 145)) near.push({ b: b, d: dd });
      }
      near.sort(function (x, y) { return x.d - y.d; });
      for (var k = 0; k < Math.min(2, near.length); k++) if (rng() < 0.58) links.push([a, near[k].b, near[k].d]);
    }

    terrain = { points: [], segments: [], contours: [] };
    var cols = mobile ? 58 : 92;
    var rows = mobile ? 38 : 62;
    for (var r = 0; r <= rows; r++) {
      for (var c = 0; c <= cols; c++) {
        var u = c / cols, v = r / rows;
        var q = warp(u + (rng() - 0.5) * 0.010, v + (rng() - 0.5) * 0.006);
        var pnt = project(q.u, q.v);
        var f = heightField(u, v);
        terrain.points.push({ u: u, v: v, x: pnt.x, y: pnt.y, f: f, p: rng() * 6.283 });
      }
    }
    function id(c, r) { return r * (cols + 1) + c; }
    function seg(ia, ib, bias) {
      var A = terrain.points[ia], B = terrain.points[ib];
      var v = Math.max(A.v, B.v), f = Math.max(A.f, B.f);
      var lowerVisibility = smooth(0.00, 0.18, v) * (1 - smooth(1.06, 1.18, v));
      var s = (0.22 + f * 1.15 + bias) * lowerVisibility;
      if (DEBUG_MESH || s > 0.075) terrain.segments.push({ a: ia, b: ib, s: clamp(s, 0, 1.35), p: (A.p + B.p) * 0.5 });
    }
    for (var rr = 0; rr < rows; rr++) {
      for (var cc = 0; cc < cols; cc++) {
        seg(id(cc, rr), id(cc + 1, rr), 0.025);
        seg(id(cc, rr), id(cc, rr + 1), 0.000);
        if ((cc + rr) & 1) seg(id(cc + 1, rr), id(cc, rr + 1), 0.045); else seg(id(cc, rr), id(cc + 1, rr + 1), 0.045);
      }
    }
  }

  function drawBackground() {
    ctx.fillStyle = '#010101';
    ctx.fillRect(0, 0, W, H);
    if (DEBUG_MESH) return;
    var g = ctx.createRadialGradient(W * 0.50, H * 0.40, 0, W * 0.50, H * 0.40, W * 0.48);
    g.addColorStop(0, 'rgba(178,108,18,0.105)');
    g.addColorStop(0.36, 'rgba(92,48,6,0.045)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var top = ctx.createRadialGradient(W * 0.48, H * 0.20, 0, W * 0.48, H * 0.20, W * 0.60);
    top.addColorStop(0, 'rgba(185,120,24,0.050)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);
  }

  function drawStars(t) {
    if (DEBUG_MESH) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.86 + 0.14 * Math.sin(t * s.s + s.p);
      var c = s.r > 1.2 ? GOLD.hot : (s.a > 0.50 ? GOLD.strong : GOLD.mid);
      ctx.fillStyle = rgba(c, s.a * tw);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawConstellation(t) {
    if (DEBUG_MESH) return;
    var px = pointer.x * W, py = pointer.y * H;
    pointer.vx = (pointer.x - pointer.px) * W; pointer.vy = (pointer.y - pointer.py) * H;
    pointer.px = pointer.x; pointer.py = pointer.y;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], dx = n.x - px, dy = n.y - py, d = Math.sqrt(dx * dx + dy * dy) + 1e-4;
      var force = Math.pow(clamp(1 - d / (mobile ? 175 : 260), 0, 1), 2.0) * n.d;
      n.vx += (dx / d) * force * 1.4 + (-dy / d) * pointer.vx * force * 0.018;
      n.vy += (dy / d) * force * 1.4 + ( dx / d) * pointer.vy * force * 0.018;
      n.vx += (n.baseX - n.x) * 0.020; n.vy += (n.baseY - n.y) * 0.020;
      n.vx *= 0.90; n.vy *= 0.90; n.x += n.vx; n.y += n.vy;
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var e = 0; e < links.length; e++) {
      var A = nodes[links[e][0]], B = nodes[links[e][1]];
      var dd = distance(A.x, A.y, B.x, B.y);
      var alpha = (1 - clamp(dd / (mobile ? 145 : 205), 0, 1)) * 0.20;
      if (alpha < 0.008) continue;
      ctx.strokeStyle = rgba(GOLD.mid, alpha); ctx.lineWidth = 0.58;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    for (var j = 0; j < nodes.length; j++) {
      var nd = nodes[j], pulse = 0.82 + 0.18 * Math.sin(t * 0.34 + nd.p);
      ctx.fillStyle = rgba(GOLD.strong, (0.18 + 0.25 * nd.d) * pulse);
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r * pulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPoly(points, color, width, alpha) {
    if (DEBUG_MESH && width >= 2.0) { color = [255, 218, 0]; alpha = 1; width = width * 1.45; }
    ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath();
    for (var i = 0; i < points.length; i++) {
      var q = warp(points[i][0], points[i][1]); var p = project(q.u, q.v);
      if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawSignatures(t) {
    var pulse = DEBUG_MESH ? 1 : (0.92 + 0.08 * Math.sin(t * 0.35));
    // left flowing strata: dense layered bands
    for (var b = 0; b < 12; b++) {
      var pts = [];
      for (var i = 0; i <= 90; i++) {
        var u = -0.07 + i / 90 * 0.54;
        var v = 0.18 + b * 0.052 + Math.sin(i * 0.11 + b * 0.72) * 0.020;
        pts.push([u, v]);
      }
      drawPoly(pts, DEBUG_MESH ? GOLD.debug : GOLD.strong, DEBUG_MESH ? 2.4 : 1.45, DEBUG_MESH ? 1 : 0.48 * pulse);
    }
    // central faceted plateau, explicit angular geometry
    var polys = [
      [[0.34,0.31],[0.57,0.25],[0.72,0.41],[0.65,0.62],[0.43,0.68],[0.27,0.50],[0.34,0.31]],
      [[0.36,0.55],[0.49,0.37],[0.67,0.44]],
      [[0.43,0.67],[0.53,0.50],[0.58,0.27]],
      [[0.29,0.50],[0.50,0.49],[0.72,0.41]]
    ];
    for (var p = 0; p < polys.length; p++) drawPoly(polys[p], DEBUG_MESH ? GOLD.debug : (p ? GOLD.strong : GOLD.hot), DEBUG_MESH ? 2.8 : (p ? 1.45 : 1.90), DEBUG_MESH ? 1 : (p ? 0.50 : 0.74) * pulse);

    // lower center contour basin arcs
    for (var r = 0; r < 6; r++) {
      var arc = [], rad = 0.15 + r * 0.067;
      for (var a = Math.PI * 1.03; a <= Math.PI * 1.98; a += 0.030) arc.push([0.50 + Math.cos(a) * rad, 0.91 + Math.sin(a) * rad * 0.54]);
      drawPoly(arc, DEBUG_MESH ? GOLD.debug : (r < 2 ? GOLD.hot : GOLD.strong), DEBUG_MESH ? 2.6 : 1.55, DEBUG_MESH ? 1 : (0.58 - r * 0.035) * pulse);
    }
    // right deposit rings, unmistakable concentric structures
    for (var rr = 0; rr < 7; rr++) {
      var ring = [], rx = 0.038 + rr * 0.038, ry = 0.030 + rr * 0.031;
      for (var aa = 0; aa <= Math.PI * 2.02; aa += 0.035) ring.push([0.80 + Math.cos(aa) * rx, 0.57 + Math.sin(aa) * ry]);
      drawPoly(ring, DEBUG_MESH ? GOLD.debug : (rr < 3 ? GOLD.hot : GOLD.strong), DEBUG_MESH ? 2.4 : 1.55, DEBUG_MESH ? 1 : (0.68 - rr * 0.052) * pulse);
    }
  }

  function drawMesh(t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (!DEBUG_MESH) {
      var glow = ctx.createRadialGradient(W * 0.50, H * 0.72, 0, W * 0.50, H * 0.72, W * 0.82);
      glow.addColorStop(0, 'rgba(206,126,18,0.055)'); glow.addColorStop(0.45, 'rgba(112,57,5,0.028)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, H * 0.32, W, H * 0.76);
    }
    for (var i = 0; i < terrain.segments.length; i++) {
      var s = terrain.segments[i], A = terrain.points[s.a], B = terrain.points[s.b];
      var depth = smooth(0.02, 0.28, Math.max(A.v, B.v));
      var midX = (A.x + B.x) * 0.5 / W;
      var edgeFade = 1.0 - 0.58 * smooth(0.58, 1.0, Math.abs(midX - 0.5) * 2.0);
      var shimmer = DEBUG_MESH ? 1 : (0.92 + 0.08 * Math.sin(t * 0.42 + s.p));
      var alpha = DEBUG_MESH ? 0.50 : clamp((0.10 + s.s * 0.56) * depth * edgeFade * shimmer, 0.055, 0.72);
      var color = DEBUG_MESH ? GOLD.debug : (s.s > 0.92 ? GOLD.hot : (s.s > 0.55 ? GOLD.strong : GOLD.mid));
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = DEBUG_MESH ? 0.9 : (0.54 + Math.min(1.0, s.s) * 0.66);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    drawSignatures(t);
    ctx.restore();
  }

  function frame(now) {
    var t = now * 0.001;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawStars(t);
    drawConstellation(t);
    drawMesh(t);
    requestAnimationFrame(frame);
  }

  function onPointer(e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
    pointer.y = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1);
  }
  var resizeTimer = 0;
  function scheduleResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(rebuild, 80); }
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('resize', scheduleResize, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(scheduleResize).observe(hero);
  rebuild(); requestAnimationFrame(frame);

  window.__AFRIPLAN_HERO_CANVAS2D__ = {
    version: VERSION,
    renderer: 'canvas2d-reference-family',
    debugMeshMode: DEBUG_MESH,
    webglReplaced: true,
    deterministicSeed: '0xAF520224',
    fixedMesh: true,
    noCubesNoPolyhedra: true,
    stars: function () { return stars.length; },
    constellationNodes: function () { return nodes.length; },
    meshSegments: function () { return terrain.segments.length; }
  };
})();
