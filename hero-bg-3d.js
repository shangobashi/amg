(function() {
  'use strict';

  var SHOW_EXPLICIT_MOTIF_OVERLAYS = false;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var old = document.getElementById('heroBgCanvas');
    if (old) old.remove();

    var hero = document.querySelector('.hero');
    if (!hero) return;

    var starsCanvas = document.getElementById('heroStarsCanvas');
    if (!starsCanvas) {
      starsCanvas = document.createElement('canvas');
      starsCanvas.id = 'heroStarsCanvas';
      starsCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent;z-index:1;';
      hero.appendChild(starsCanvas);
    }

    var meshCanvas = document.getElementById('heroMeshCanvas');
    if (!meshCanvas) {
      meshCanvas = document.createElement('canvas');
      meshCanvas.id = 'heroMeshCanvas';
      meshCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent;z-index:3;';
      hero.appendChild(meshCanvas);
    }

    var starsCtx = starsCanvas.getContext('2d');
    var meshCtx = meshCanvas.getContext('2d');
    if (!starsCtx || !meshCtx) return;

    var pointer = {
      x: 0.5,
      y: 0.5,
      tx: 0.5,
      ty: 0.5,
      vx: 0,
      vy: 0,
      active: false
    };

    hero.addEventListener('pointermove', function(e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / Math.max(1, r.width);
      var ny = (e.clientY - r.top) / Math.max(1, r.height);
      pointer.vx = nx - pointer.tx;
      pointer.vy = ny - pointer.ty;
      pointer.tx = clamp(nx, 0, 1);
      pointer.ty = clamp(ny, 0, 1);
      pointer.active = true;
    }, { passive: true });

    hero.addEventListener('pointerleave', function() {
      pointer.tx = 0.5;
      pointer.ty = 0.5;
      pointer.active = false;
    }, { passive: true });

    var state = {
      width: 1,
      height: 1,
      dpr: 1,
      isMobile: false,
      stars: [],
      nodes: [],
      mesh: null,
      hero: hero,
      pointer: pointer
    };

    function resize() {
      var rect = hero.getBoundingClientRect();
      var w = Math.max(360, Math.round(rect.width || window.innerWidth));
      var h = Math.max(560, Math.round(rect.height || window.innerHeight));
      state.isMobile = w < 768;
      state.dpr = Math.min(window.devicePixelRatio || 1, state.isMobile ? 1.15 : 1.55);
      state.width = w;
      state.height = h;

      starsCanvas.width = Math.round(w * state.dpr);
      starsCanvas.height = Math.round(h * state.dpr);
      starsCanvas.style.width = w + 'px';
      starsCanvas.style.height = h + 'px';
      starsCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      meshCanvas.width = Math.round(w * state.dpr);
      meshCanvas.height = Math.round(h * state.dpr);
      meshCanvas.style.width = w + 'px';
      meshCanvas.style.height = h + 'px';
      meshCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      state.stars = buildStars(w, h, state.isMobile);
      state.nodes = buildConstellationNodes(w, h, state.isMobile);
      state.mesh = buildMesh(w, h, state.isMobile);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    var startTime = performance.now();

    function frame() {
      var time = (performance.now() - startTime) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      pointer.vx *= 0.88;
      pointer.vy *= 0.88;

      starsCtx.clearRect(0, 0, state.width, state.height);
      drawStars(starsCtx, state, time);
      updateConstellation(state, time);
      drawConstellation(starsCtx, state, time);

      meshCtx.clearRect(0, 0, state.width, state.height);
      renderHero(meshCtx, state, time);

      requestAnimationFrame(frame);
    }

    frame();
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function fract(x) {
    return x - Math.floor(x);
  }

  function seededRandom(seed) {
    var s = seed >>> 0;
    return function() {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hash2(x, y) {
    return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
  }

  function valueNoise(x, y) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var x1 = x0 + 1;
    var y1 = y0 + 1;
    var sx = x - x0;
    var sy = y - y0;
    var ux = sx * sx * (3 - 2 * sx);
    var uy = sy * sy * (3 - 2 * sy);
    var n00 = hash2(x0, y0);
    var n10 = hash2(x1, y0);
    var n01 = hash2(x0, y1);
    var n11 = hash2(x1, y1);
    return lerp(lerp(n00, n10, ux), lerp(n01, n11, ux), uy);
  }

  function rgbaGold(alpha, feature) {
    if (feature > 0.70) return 'rgba(224,160,48,' + alpha + ')';
    if (feature > 0.42) return 'rgba(196,129,31,' + alpha + ')';
    return 'rgba(146,92,18,' + alpha + ')';
  }

  function buildStars(w, h, isMobile) {
    var rng = seededRandom(isMobile ? 77 : 91);
    var count = isMobile ? 820 : 1900;
    var anchors = isMobile ? 18 : 30;
    var stars = [];

    for (var i = 0; i < count; i++) {
      var anchor = i < anchors;
      var depth = 0.18 + rng() * 0.82;
      var y = Math.pow(rng(), anchor ? 1.06 : 1.42) * h * 0.76;
      stars.push({
        x: rng() * w,
        y: y,
        depth: depth,
        size: anchor ? 1.4 + rng() * 0.7 : 0.20 + Math.pow(rng(), 2.8) * 0.65,
        anchor: anchor,
        phase: rng() * Math.PI * 2,
        speed: 0.42 + rng() * 0.58,
        alpha: anchor ? 0.50 + rng() * 0.18 : 0.18 + rng() * 0.28,
        colorIndex: anchor ? 4 : (rng() < 0.24 ? 0 : rng() < 0.50 ? 1 : rng() < 0.78 ? 2 : 3)
      });
    }

    return stars;
  }

  function drawStars(ctx, state, time) {
    var palette = [
      '120,76,14',
      '146,92,18',
      '170,109,22',
      '196,129,31',
      '224,160,48'
    ];
    var stars = state.stars;
    var w = state.width;
    var h = state.height;
    var pointer = state.pointer;

    for (var i = 0; i < stars.length; i++) {
      var star = stars[i];
      var px = (pointer.x - 0.5) * star.depth * 8;
      var py = (pointer.y - 0.5) * star.depth * 5;
      var x = star.x + px;
      var y = star.y + py;
      var twinkle = 0.72 + 0.28 * Math.sin(time * star.speed + star.phase);
      var alpha = star.alpha * twinkle * (0.84 + 0.16 * contentFade(x, y, w, h));
      var rgb = palette[star.colorIndex];

      if (star.anchor) {
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 4 + star.size * 2.4);
        glow.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(0.18, alpha * 0.30) + ')');
        glow.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 4 + star.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function buildConstellationNodes(w, h, isMobile) {
    var rng = seededRandom(isMobile ? 303 : 404);
    var count = isMobile ? 72 : 138;
    var nodes = [];

    for (var i = 0; i < count; i++) {
      var x = rng() * w;
      var y = Math.pow(rng(), 1.32) * h * 0.70;
      nodes.push({
        baseX: x,
        baseY: y,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        depth: 0.25 + rng() * 0.75,
        phase: rng() * Math.PI * 2,
        size: 0.28 + rng() * 0.65
      });
    }

    return nodes;
  }

  function updateConstellation(state, time) {
    var nodes = state.nodes;
    var pointer = state.pointer;
    var w = state.width;
    var h = state.height;
    var px = pointer.x * w;
    var py = pointer.y * h;
    var radius = Math.min(w, h) * 0.22;
    var radius2 = radius * radius;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var dx = node.x - px;
      var dy = node.y - py;
      var d2 = dx * dx + dy * dy;

      if (d2 < radius2) {
        var d = Math.sqrt(d2) || 1;
        var force = (1 - d / radius) * 0.32 * node.depth;
        node.vx += (dx / d) * force + pointer.vx * 12 * node.depth;
        node.vy += (dy / d) * force + pointer.vy * 8 * node.depth;
      }

      node.vx += (node.baseX - node.x) * 0.012;
      node.vy += (node.baseY - node.y) * 0.012;
      node.vx += Math.cos(time * 0.20 + node.phase) * 0.0018;
      node.vy += Math.sin(time * 0.18 + node.phase) * 0.0012;
      node.vx *= 0.88;
      node.vy *= 0.88;
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  function drawConstellation(ctx, state, time) {
    var nodes = state.nodes;
    var w = state.width;
    var h = state.height;

    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var fadeA = contentFade(a.x, a.y, w, h);
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist2 = dx * dx + dy * dy;
        var maxDist = 58 + (a.depth + b.depth) * 28;
        if (dist2 > maxDist * maxDist) continue;
        var dist = Math.sqrt(dist2) || 1;
        var midX = (a.x + b.x) * 0.5;
        var midY = (a.y + b.y) * 0.5;
        var fade = contentFade(midX, midY, w, h);
        var alpha = (1 - dist / maxDist) * 0.13 * fade * fadeA;
        if (midY > h * 0.62) alpha *= 0.45;
        ctx.strokeStyle = 'rgba(170,109,22,' + alpha + ')';
        ctx.lineWidth = 0.28 + Math.min(a.depth, b.depth) * 0.22;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      var nAlpha = (0.10 + n.depth * 0.20) * contentFade(n.x, n.y, w, h);
      if (n.y > h * 0.62) nAlpha *= 0.55;
      ctx.fillStyle = 'rgba(196,129,31,' + nAlpha + ')';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function buildMesh(w, h, isMobile) {
    var cols;
    var rows;
    if (isMobile) {
      cols = 36;
      rows = 24;
    } else if (w >= 1680) {
      cols = 88;
      rows = 44;
    } else {
      cols = 76;
      rows = 40;
    }

    var rng = seededRandom(1129 + cols * 13 + rows * 7);
    var vertices = [];
    var edges = [];
    var edgeSeen = {};
    var jitterU = isMobile ? 0.012 : 0.010;
    var jitterV = isMobile ? 0.012 : 0.009;

    for (var j = 0; j <= rows; j++) {
      for (var i = 0; i <= cols; i++) {
        var u = i / cols;
        var v = j / rows;
        vertices.push({
          u: clamp(u + (rng() - 0.5) * jitterU, 0, 1),
          v: clamp(v + (rng() - 0.5) * jitterV, 0, 1)
        });
      }
    }

    function addEdge(a, b) {
      var key = a < b ? a + ':' + b : b + ':' + a;
      if (edgeSeen[key]) return;
      edgeSeen[key] = true;
      edges.push({
        a: a,
        b: b,
        seed: rng(),
        phase: rng() * Math.PI * 2,
        noise: rng()
      });
    }

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var i00 = row * (cols + 1) + col;
        var i10 = i00 + 1;
        var i01 = (row + 1) * (cols + 1) + col;
        var i11 = i01 + 1;
        addEdge(i00, i10);
        addEdge(i10, i01);
        addEdge(i01, i00);
        addEdge(i10, i11);
        addEdge(i11, i01);
      }
    }

    return { cols: cols, rows: rows, vertices: vertices, edges: edges };
  }

  function leftFlowMask(u, v) {
    var region = smoothstep(0.60, 0.16, u) * smoothstep(0.28, 0.76, v) * smoothstep(0.98, 0.42, v);
    var flowA = Math.sin(v * 24.0 + u * 8.5 + Math.sin(u * 6.0) * 1.8);
    var flowB = Math.sin(v * 18.0 + u * 12.0 + 0.8);
    var band = Math.max(Math.pow(Math.max(0, 1 - Math.abs(flowA)), 5.0), Math.pow(Math.max(0, 1 - Math.abs(flowB)), 4.0) * 0.72);
    return band * region * 0.78;
  }

  function centerPlateauMask(u, v) {
    var inX = smoothstep(0.30, 0.42, u) * smoothstep(0.72, 0.56, u);
    var inY = smoothstep(0.36, 0.48, v) * smoothstep(0.72, 0.58, v);
    var diagonal = 0.5 + 0.5 * Math.sin(u * 10.0 - v * 7.0);
    return inX * inY * (0.42 + diagonal * 0.34);
  }

  function rightTopoMask(u, v) {
    var cx = 0.72;
    var cy = 0.64;
    var dx = (u - cx) / 0.16;
    var dy = (v - cy) / 0.13;
    var d = Math.sqrt(dx * dx + dy * dy);
    var ring = 1 - Math.abs((d * 7.2) % 1.0 - 0.5) * 2.0;
    var envelope = smoothstep(1.05, 0.12, d);
    return Math.pow(Math.max(0, ring), 2.6) * envelope * 0.56;
  }

  function basinMask(u, v) {
    var dx = (u - 0.46) / 0.28;
    var dy = (v - 0.84) / 0.18;
    var d = Math.sqrt(dx * dx + dy * dy);
    var ring = 1 - Math.abs((d * 5.5) % 1.0 - 0.5) * 2.0;
    var envelope = smoothstep(1.20, 0.16, d) * smoothstep(0.62, 0.78, v);
    return Math.pow(Math.max(0, ring), 2.3) * envelope * 0.42;
  }

  function fanMask(u, v) {
    var region = smoothstep(0.62, 0.76, u) * smoothstep(0.64, 0.84, v);
    var diagA = Math.pow(Math.max(0, 1 - Math.abs((v - 0.77) - (u - 0.68) * 0.78) / 0.058), 2.3);
    var diagB = Math.pow(Math.max(0, 1 - Math.abs((v - 0.81) - (u - 0.72) * 0.60) / 0.072), 2.0);
    return Math.max(diagA, diagB * 0.74) * region * 0.50;
  }

  function featureField(u, v) {
    var noise = valueNoise(u * 4.2, v * 4.2) * 0.18;
    return Math.max(leftFlowMask(u, v), centerPlateauMask(u, v), rightTopoMask(u, v), basinMask(u, v), fanMask(u, v), noise);
  }

  function contentFade(x, y, w, h) {
    var cx = w * 0.50;
    var cy = h * 0.47;
    var dx = (x - cx) / (w * 0.235);
    var dy = (y - cy) / (h * 0.175);
    var d = Math.sqrt(dx * dx + dy * dy);
    return 0.22 + 0.78 * smoothstep(0.78, 1.34, d);
  }

  function projectPoint(u, v, width, height, feature, time) {
    var horizonY = height * 0.48;
    var nearY = height * 1.08;
    var p = Math.pow(v, 1.42);
    var y = horizonY + p * (nearY - horizonY);
    var spread = width * (0.52 + v * 1.55);
    var x = width * 0.5 + (u - 0.5) * spread;
    var warp = (feature - 0.5) * width * 0.018 * (0.25 + v);
    var breath = Math.sin(time * 0.45 + u * 5.0 + v * 3.2) * 0.0018 * smoothstep(0.24, 1.0, v);
    x += warp + width * breath;
    y -= (feature - 0.5) * height * 0.010 * smoothstep(0.24, 1.0, v);
    return { x: x, y: y };
  }

  function projectMesh(mesh, width, height, time) {
    var out = new Array(mesh.vertices.length);
    for (var i = 0; i < mesh.vertices.length; i++) {
      var vtx = mesh.vertices[i];
      var feature = featureField(vtx.u, vtx.v);
      out[i] = projectPoint(vtx.u, vtx.v, width, height, feature, time);
    }
    return out;
  }

  function meshPointerInfluence(x, y, w, h, pointer) {
    var px = pointer.x * w;
    var py = pointer.y * h;
    var dx = x - px;
    var dy = y - py;
    var r = Math.min(w, h) * 0.26;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > r) return { boost: 0, ox: 0, oy: 0 };
    var t = 1 - d / r;
    var eased = t * t * (3 - 2 * t);
    var motion = Math.min(1, Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy) * 30);
    return {
      boost: eased * 0.45,
      ox: (dx / (d || 1)) * eased * motion * 3.5,
      oy: (dy / (d || 1)) * eased * motion * 2.2
    };
  }

  function renderHero(ctx, state, time) {
    var mesh = state.mesh;
    var w = state.width;
    var h = state.height;
    var projected = projectMesh(mesh, w, h, time);
    var edges = mesh.edges;
    var verts = mesh.vertices;

    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      drawEdge(ctx, projected, verts, edge, state, time);
    }

    if (SHOW_EXPLICIT_MOTIF_OVERLAYS) {
      // intentionally disabled: topology must be carried by mesh only
    }
  }

  function drawEdge(ctx, projected, verts, edge, state, time) {
    var a = edge.a;
    var b = edge.b;
    var p1 = projected[a];
    var p2 = projected[b];
    var v1 = verts[a];
    var v2 = verts[b];
    var midU = (v1.u + v2.u) * 0.5;
    var midV = (v1.v + v2.v) * 0.5;
    var midX = (p1.x + p2.x) * 0.5;
    var midY = (p1.y + p2.y) * 0.5;
    var f = Math.max(featureField(v1.u, v1.v), featureField(v2.u, v2.v), featureField(midU, midV));
    var depth = 0.18 + midV * 0.82;
    var shimmer = 0.86 + 0.14 * Math.sin(time * 0.65 + edge.phase);
    var pointerFx = meshPointerInfluence(midX, midY, state.width, state.height, state.pointer);
    var fade = contentFade(midX, midY, state.width, state.height);
    var p1Fx = meshPointerInfluence(p1.x, p1.y, state.width, state.height, state.pointer);
    var p2Fx = meshPointerInfluence(p2.x, p2.y, state.width, state.height, state.pointer);
    var x1 = p1.x + p1Fx.ox;
    var y1 = p1.y + p1Fx.oy;
    var x2 = p2.x + p2Fx.ox;
    var y2 = p2.y + p2Fx.oy;

    var ghostAlpha = (0.025 + depth * 0.050) * shimmer * fade * 0.35;
    ghostAlpha = clamp(ghostAlpha, 0.018, 0.075);
    ctx.strokeStyle = 'rgba(92,58,14,' + ghostAlpha + ')';
    ctx.lineWidth = 0.26 + depth * 0.18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    var mainThreshold = 0.26 - f * 0.12 + midV * 0.04;
    if (edge.seed > mainThreshold) {
      var alpha = 0.035 + depth * 0.10 + f * 0.55 + pointerFx.boost * 0.35;
      alpha *= shimmer;
      alpha *= fade;
      alpha = clamp(alpha, 0.14, 0.48);
      var width = 0.35 + depth * 0.45 + f * 0.75 + pointerFx.boost * 0.45;
      ctx.strokeStyle = rgbaGold(alpha, f);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    var featureThreshold = 0.46 - f * 0.12;
    if (f > 0.34 && edge.noise > featureThreshold) {
      var featureAlpha = 0.11 + depth * 0.16 + f * 0.60 + pointerFx.boost * 0.42;
      featureAlpha *= shimmer;
      featureAlpha *= fade;
      featureAlpha = clamp(featureAlpha, 0.42, 0.86);
      var featureWidth = 0.42 + depth * 0.50 + f * 0.82 + pointerFx.boost * 0.45;
      if (f > 0.72) {
        ctx.save();
        ctx.shadowBlur = 5 + f * 8;
        ctx.shadowColor = 'rgba(196,129,31,0.18)';
        ctx.strokeStyle = rgbaGold(featureAlpha, f);
        ctx.lineWidth = featureWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = rgbaGold(featureAlpha, f);
        ctx.lineWidth = featureWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }
})();
