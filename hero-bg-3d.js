/* Afriplan Hero Background — deterministic Canvas2D geological intelligence field
   Path B recovery: replaces unstable WebGL/polyhedra pipeline with fixed, seeded 2D render.
   Version: 20260503-new-session-recovery-01-canvas2d
*/
(function () {
  'use strict';

  var VERSION = '20260503-new-session-recovery-01-canvas2d';
  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;
  var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  canvas.classList.add('hero-mesh-canvas');
  canvas.setAttribute('data-renderer', 'canvas2d-geological-intelligence');
  canvas.setAttribute('data-version', VERSION);

  var GOLD = {
    base: [126, 78, 10],
    mid: [170, 109, 22],
    strong: [210, 146, 34],
    hot: [224, 160, 48]
  };

  var starPalette = [
    { color: [120, 76, 14], alpha: 0.38, weight: 0.45 },
    { color: [146, 92, 18], alpha: 0.50, weight: 0.28 },
    { color: [170, 109, 22], alpha: 0.62, weight: 0.17 },
    { color: [196, 129, 31], alpha: 0.74, weight: 0.08 },
    { color: [224, 160, 48], alpha: 0.84, weight: 0.02 }
  ];

  function mulberry32(seed) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function smoothstep(a, b, x) {
    var t = clamp((x - a) / Math.max(0.00001, b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function mix(a, b, t) { return a + (b - a) * t; }
  function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a.toFixed(3) + ')'; }
  function dist(x1, y1, x2, y2) { var dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }

  function pickPalette(rng) {
    var r = rng(), acc = 0;
    for (var i = 0; i < starPalette.length; i++) {
      acc += starPalette[i].weight;
      if (r <= acc) return starPalette[i];
    }
    return starPalette[starPalette.length - 1];
  }

  function lineFeature(value, target, width) {
    return Math.exp(-Math.pow((value - target) / width, 2));
  }

  function pointInPoly(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      var intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / ((yj - yi) || 0.00001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  var W = 1, H = 1, DPR = 1, mobile = false;
  var stars = [], nodes = [], edges = [], mesh = { points: [], segments: [] };
  var pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, active: false };

  function projectTerrainPoint(u, v) {
    var horizonY = H * 0.515;
    var nearY = H * 1.105;
    var perspective = Math.pow(v, 1.55);
    var y = horizonY + perspective * (nearY - horizonY);
    var spread = W * (0.62 + v * 1.58);
    var x = W * 0.5 + (u - 0.5) * spread;
    return { x: x, y: y };
  }

  function featureIntensity(u, v, x, y) {
    // Left flowing strata — layered sinusoidal bands in the left third.
    var leftMask = 1 - smoothstep(0.30, 0.56, u);
    var strataPhase = v * 10.5 + Math.sin(u * 17.0) * 0.82 + Math.sin(v * 7.0 + u * 4.0) * 0.30;
    var strata = Math.pow(0.5 + 0.5 * Math.sin(strataPhase), 10.0) * leftMask * smoothstep(0.06, 0.42, v);

    // Central angular plateau — fixed faceted mineral table.
    var plateauPoly = [[0.38, 0.37], [0.58, 0.33], [0.69, 0.47], [0.62, 0.66], [0.44, 0.69], [0.31, 0.53]];
    var plateauInside = pointInPoly(u, v, plateauPoly) ? 1 : 0;
    var plateauRidge = Math.max(
      lineFeature(Math.abs((v - 0.47) + (u - 0.51) * 0.45), 0, 0.025),
      lineFeature(Math.abs((v - 0.61) - (u - 0.49) * 0.34), 0, 0.030)
    ) * smoothstep(0.30, 0.48, u) * (1 - smoothstep(0.76, 0.96, u));
    var plateau = plateauInside * 0.58 + plateauRidge * 0.72;

    // Lower-center arcs — crescent deposits in the near foreground.
    var dc = dist(u, v, 0.50, 0.93);
    var arcs = Math.max(
      lineFeature(dc, 0.22, 0.014),
      lineFeature(dc, 0.31, 0.016),
      lineFeature(dc, 0.41, 0.019)
    ) * smoothstep(0.48, 0.76, v) * (1 - smoothstep(0.98, 1.08, v));

    // Right concentric deposit rings.
    var dr = dist(u, v, 0.795, 0.60);
    var rings = Math.max(
      lineFeature(dr, 0.055, 0.010),
      lineFeature(dr, 0.105, 0.012),
      lineFeature(dr, 0.158, 0.014),
      lineFeature(dr, 0.218, 0.017)
    ) * smoothstep(0.55, 0.71, u) * (1 - smoothstep(0.94, 1.06, u));

    // Right ridge / fault vein.
    var ridge = lineFeature(Math.abs((u - 0.75) + Math.sin(v * 8.5) * 0.045), 0, 0.018) * smoothstep(0.50, 0.76, v);

    // Low-frequency geological contouring — deterministic, not moving.
    var low = Math.sin(u * 13.2 + Math.sin(v * 4.1) * 1.2) + Math.sin(v * 15.4 + u * 3.7);
    var noiseContour = Math.pow(Math.max(0, 0.5 + 0.5 * Math.sin(low * 2.15 + u * 5.4)), 8) * 0.25;

    return clamp(Math.max(strata, plateau, arcs, rings, ridge * 0.74, noiseContour), 0, 1);
  }

  function terrainDisplace(u, v) {
    var du = 0, dv = 0;
    // Organic but fixed offsets. These are generated once; no translation or drift.
    du += Math.sin(v * 18 + u * 3.5) * 0.010 * (1 - smoothstep(0.35, 0.60, u));
    dv += Math.sin(u * 15 + v * 5.0) * 0.012 * smoothstep(0.08, 0.35, v);
    var ringPull = Math.exp(-Math.pow(dist(u, v, 0.79, 0.60) / 0.22, 2));
    du += (u - 0.79) * ringPull * 0.020;
    dv += (v - 0.60) * ringPull * 0.018;
    var plateauLift = pointInPoly(u, v, [[0.38, 0.37], [0.58, 0.33], [0.69, 0.47], [0.62, 0.66], [0.44, 0.69], [0.31, 0.53]]) ? -0.014 : 0;
    dv += plateauLift;
    return { u: clamp(u + du, -0.08, 1.08), v: clamp(v + dv, 0, 1.08) };
  }

  function rebuild() {
    var rect = hero.getBoundingClientRect();
    W = Math.max(320, Math.round(rect.width || window.innerWidth));
    H = Math.max(560, Math.round(rect.height || window.innerHeight));
    mobile = W < 768;
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.55);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var rng = mulberry32(0xAFAF2026);
    stars = [];
    var farCount = mobile ? 620 : 1500;
    for (var i = 0; i < farCount; i++) {
      var pal = pickPalette(rng);
      var depth = rng();
      var yBias = Math.pow(rng(), 1.18);
      stars.push({
        x: rng() * W,
        y: yBias * H * 0.94,
        r: mix(0.35, 0.90, rng()) * (depth < 0.18 ? 1.28 : 1),
        c: pal.color,
        a: pal.alpha * mix(0.52, 1.0, rng()),
        phase: rng() * Math.PI * 2,
        tw: mix(0.05, 0.18, rng())
      });
    }
    for (var a = 0; a < (mobile ? 10 : 20); a++) {
      stars.push({ x: rng() * W, y: rng() * H * 0.74, r: mix(1.3, 1.8, rng()), c: [224, 160, 48], a: mix(0.54, 0.84, rng()), phase: rng() * 6.28, tw: 0.10 });
    }

    nodes = [];
    var nodeCount = mobile ? 82 : 166;
    for (var n = 0; n < nodeCount; n++) {
      var nx = rng() * W;
      var ny = Math.pow(rng(), 1.16) * H * 0.74 + H * 0.03;
      nodes.push({
        baseX: nx, baseY: ny, x: nx, y: ny, vx: 0, vy: 0,
        depth: mix(0.35, 1.0, rng()), r: mix(0.65, 1.35, rng()),
        phase: rng() * Math.PI * 2
      });
    }
    edges = [];
    var maxEdges = mobile ? 90 : 210;
    for (var e = 0; e < nodes.length && edges.length < maxEdges; e++) {
      var nearest = [];
      for (var j = 0; j < nodes.length; j++) if (j !== e) {
        var d = dist(nodes[e].baseX, nodes[e].baseY, nodes[j].baseX, nodes[j].baseY);
        if (d < (mobile ? 96 : 128)) nearest.push({ j: j, d: d });
      }
      nearest.sort(function (aa, bb) { return aa.d - bb.d; });
      for (var k = 0; k < Math.min(2, nearest.length); k++) {
        if (rng() < 0.44) edges.push([e, nearest[k].j, nearest[k].d]);
      }
    }

    mesh = { points: [], segments: [] };
    var cols = mobile ? 46 : 70;
    var rows = mobile ? 28 : 42;
    for (var r = 0; r <= rows; r++) {
      for (var c = 0; c <= cols; c++) {
        var u = c / cols;
        var v = r / rows;
        var jitterU = (rng() - 0.5) * 0.010;
        var jitterV = (rng() - 0.5) * 0.007;
        var q = terrainDisplace(u + jitterU, v + jitterV);
        var p = projectTerrainPoint(q.u, q.v);
        mesh.points.push({ u: u, v: v, x: p.x, y: p.y, f: featureIntensity(u, v, p.x, p.y), phase: rng() * 6.28 });
      }
    }
    function idx(c, r) { return r * (cols + 1) + c; }
    function addSeg(aIdx, bIdx, bias) {
      var p1 = mesh.points[aIdx], p2 = mesh.points[bIdx];
      var midF = Math.max(p1.f, p2.f);
      var baseVisibility = smoothstep(0.02, 0.24, p1.v) * (1 - smoothstep(1.05, 1.16, p1.v));
      // Keep a real base plane visible even outside features; stronger inside features.
      var strength = (0.18 + midF * 0.82 + bias) * baseVisibility;
      if (strength > 0.055) mesh.segments.push({ a: aIdx, b: bIdx, s: clamp(strength, 0, 1), phase: (p1.phase + p2.phase) * 0.5 });
    }
    for (var rr = 0; rr < rows; rr++) {
      for (var cc = 0; cc < cols; cc++) {
        addSeg(idx(cc, rr), idx(cc + 1, rr), 0.02);
        addSeg(idx(cc, rr), idx(cc, rr + 1), 0.00);
        if ((cc + rr) % 2 === 0) addSeg(idx(cc, rr), idx(cc + 1, rr + 1), 0.025);
        else addSeg(idx(cc + 1, rr), idx(cc, rr + 1), 0.025);
      }
    }
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#010101');
    g.addColorStop(0.48, '#050302');
    g.addColorStop(1, '#010101');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var r1 = ctx.createRadialGradient(W * 0.5, H * 0.34, 0, W * 0.5, H * 0.34, W * 0.50);
    r1.addColorStop(0, 'rgba(165,102,21,0.18)');
    r1.addColorStop(0.58, 'rgba(80,42,6,0.055)');
    r1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H);

    var r2 = ctx.createRadialGradient(W * 0.50, H * 0.62, 0, W * 0.50, H * 0.62, W * 0.66);
    r2.addColorStop(0, 'rgba(150,88,14,0.18)');
    r2.addColorStop(0.45, 'rgba(70,35,5,0.08)');
    r2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r2; ctx.fillRect(0, 0, W, H);
  }

  function drawStars(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 1 + Math.sin(t * s.tw + s.phase) * 0.16;
      ctx.fillStyle = rgba(s.c, clamp(s.a * tw, 0, 0.94));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function updateConstellation(t) {
    var px = pointer.x * W, py = pointer.y * H;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - px, dy = n.y - py;
      var d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
      var force = Math.pow(clamp(1 - d / (mobile ? 175 : 245), 0, 1), 2.2);
      var swirl = force * 0.34 * n.depth;
      var push = force * (mobile ? 1.05 : 1.45) * n.depth;
      n.vx += (dx / d) * push + (-dy / d) * pointer.vx * swirl;
      n.vy += (dy / d) * push + ( dx / d) * pointer.vy * swirl;
      n.vx += (n.baseX - n.x) * 0.018;
      n.vy += (n.baseY - n.y) * 0.018;
      n.vx *= 0.90;
      n.vy *= 0.90;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  function drawConstellation(t) {
    updateConstellation(t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var e = 0; e < edges.length; e++) {
      var a = nodes[edges[e][0]], b = nodes[edges[e][1]];
      var d = dist(a.x, a.y, b.x, b.y);
      var alpha = (1 - clamp(d / (mobile ? 140 : 190), 0, 1)) * 0.15;
      if (alpha <= 0.005) continue;
      ctx.strokeStyle = 'rgba(194,126,30,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var pulse = 0.82 + 0.18 * Math.sin(t * 0.35 + n.phase);
      ctx.fillStyle = 'rgba(214,145,38,' + (0.20 + 0.22 * n.depth * pulse).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawMesh(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Wide fixed base glow under the lower-half terrain. It does not move.
    var ground = ctx.createRadialGradient(W * 0.50, H * 0.80, 0, W * 0.50, H * 0.80, W * 0.72);
    ground.addColorStop(0, 'rgba(170,94,13,0.110)');
    ground.addColorStop(0.45, 'rgba(94,49,5,0.070)');
    ground.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ground; ctx.fillRect(0, H * 0.42, W, H * 0.62);

    for (var i = 0; i < mesh.segments.length; i++) {
      var seg = mesh.segments[i];
      var a = mesh.points[seg.a], b = mesh.points[seg.b];
      var depth = smoothstep(0.04, 0.34, Math.max(a.v, b.v));
      var horizonFade = 0.42 + 0.58 * depth;
      var shimmer = 0.92 + 0.08 * Math.sin(t * 0.42 + seg.phase);
      var alpha = clamp((0.14 + seg.s * 0.74) * horizonFade * shimmer, 0.07, 0.88);
      var hot = seg.s > 0.70;
      ctx.strokeStyle = rgba(hot ? GOLD.hot : (seg.s > 0.45 ? GOLD.strong : GOLD.mid), alpha);
      ctx.lineWidth = (hot ? 1.05 : 0.70) + seg.s * 0.45;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // Explicit deposit signatures so the geological forms remain legible.
    drawFeatureRings(t);
    ctx.restore();
  }

  function drawProjectedPolyline(points, color, width, alpha) {
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = width;
    ctx.beginPath();
    for (var i = 0; i < points.length; i++) {
      var q = terrainDisplace(points[i][0], points[i][1]);
      var p = projectTerrainPoint(q.u, q.v);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawFeatureRings(t) {
    var pulse = 0.92 + 0.08 * Math.sin(t * 0.38);
    // Left flowing strata.
    for (var b = 0; b < 8; b++) {
      var pts = [];
      for (var i = 0; i <= 64; i++) {
        var u = i / 64 * 0.42 - 0.03;
        var v = 0.28 + b * 0.065 + Math.sin(i * 0.18 + b * 0.7) * 0.018;
        pts.push([u, v]);
      }
      drawProjectedPolyline(pts, GOLD.strong, 0.72, 0.18 * pulse);
    }
    // Central angular plateau.
    var poly = [[0.38, 0.37], [0.58, 0.33], [0.69, 0.47], [0.62, 0.66], [0.44, 0.69], [0.31, 0.53], [0.38, 0.37]];
    drawProjectedPolyline(poly, GOLD.hot, 1.15, 0.42 * pulse);
    drawProjectedPolyline([[0.35,0.56],[0.49,0.45],[0.66,0.50]], GOLD.strong, 0.85, 0.30 * pulse);
    drawProjectedPolyline([[0.42,0.67],[0.52,0.55],[0.60,0.35]], GOLD.strong, 0.75, 0.24 * pulse);
    // Lower center arcs.
    for (var r = 0; r < 4; r++) {
      var arcPts = [];
      var rad = 0.20 + r * 0.075;
      for (var a = Math.PI * 1.08; a <= Math.PI * 1.92; a += 0.035) {
        arcPts.push([0.50 + Math.cos(a) * rad, 0.93 + Math.sin(a) * rad * 0.52]);
      }
      drawProjectedPolyline(arcPts, r === 2 ? GOLD.hot : GOLD.strong, 0.95, (0.26 + r * 0.035) * pulse);
    }
    // Right concentric rings.
    for (var rr = 0; rr < 5; rr++) {
      var ringPts = [];
      var rx = 0.055 + rr * 0.045;
      var ry = 0.040 + rr * 0.036;
      for (var aa = 0; aa <= Math.PI * 2.02; aa += 0.045) {
        ringPts.push([0.795 + Math.cos(aa) * rx, 0.60 + Math.sin(aa) * ry]);
      }
      drawProjectedPolyline(ringPts, rr < 2 ? GOLD.hot : GOLD.strong, 0.92, (0.34 - rr * 0.025) * pulse);
    }
  }

  function frame(now) {
    var t = now * 0.001;
    pointer.vx = (pointer.x - pointer.px) * W;
    pointer.vy = (pointer.y - pointer.py) * H;
    pointer.px = pointer.x; pointer.py = pointer.y;
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
    pointer.active = true;
  }

  var resizeTimer = 0;
  function scheduleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 80);
  }

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', scheduleResize, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(scheduleResize).observe(hero);

  rebuild();
  requestAnimationFrame(frame);

  window.__AFRIPLAN_HERO_CANVAS2D__ = {
    version: VERSION,
    renderer: 'canvas2d',
    webglReplaced: true,
    deterministicSeed: '0xAFAF2026',
    stars: function () { return stars.length; },
    constellationNodes: function () { return nodes.length; },
    meshSegments: function () { return mesh.segments.length; },
    fixedMesh: true,
    noCubesNoPolyhedra: true
  };
})();
