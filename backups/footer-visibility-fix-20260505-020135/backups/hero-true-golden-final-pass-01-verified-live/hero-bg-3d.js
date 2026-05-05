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

    var state = {
      width: 1,
      height: 1,
      dpr: 1,
      isMobile: false,
      stars: [],
      mesh: null,
      hero: hero
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
      state.mesh = buildMesh(state.isMobile ? 34 : 64, state.isMobile ? 22 : 36, state.isMobile ? 0.015 : 0.011, state.isMobile ? 0.014 : 0.010, 1129);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    var startTime = performance.now();

    function frame() {
      var time = (performance.now() - startTime) / 1000;
      starsCtx.clearRect(0, 0, state.width, state.height);
      drawStars(starsCtx, state, time);

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
    if (feature > 0.56) return 'rgba(224,160,48,' + alpha + ')';
    if (feature > 0.30) return 'rgba(196,129,31,' + alpha + ')';
    return 'rgba(146,92,18,' + alpha + ')';
  }

  function buildStars(w, h, isMobile) {
    var rng = seededRandom(isMobile ? 77 : 91);
    var count = isMobile ? 780 : 1850;
    var anchors = isMobile ? 18 : 26;
    var stars = [];

    for (var i = 0; i < count; i++) {
      var anchor = i < anchors;
      var y = Math.pow(rng(), anchor ? 1.10 : 1.46) * h * 0.74;
      stars.push({
        x: rng() * w,
        y: y,
        size: anchor ? 1.4 + rng() * 0.7 : 0.20 + Math.pow(rng(), 2.8) * 0.62,
        anchor: anchor,
        phase: rng() * Math.PI * 2,
        speed: 0.35 + rng() * 0.55,
        alpha: anchor ? 0.48 + rng() * 0.18 : 0.18 + rng() * 0.26,
        colorIndex: anchor ? 4 : (rng() < 0.26 ? 0 : rng() < 0.54 ? 1 : rng() < 0.80 ? 2 : 3)
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

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var alpha = s.alpha * (0.88 + 0.12 * Math.sin(time * s.speed + s.phase));
      var fade = contentFade(s.x, s.y, w, h);
      alpha *= 0.80 + 0.20 * fade;
      var rgb = palette[s.colorIndex];

      if (s.anchor) {
        var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4 + s.size * 2.2);
        glow.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(0.16, alpha * 0.28) + ')');
        glow.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4 + s.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function buildMesh(cols, rows, jitterU, jitterV, seed) {
    var rng = seededRandom(seed);
    var vertices = [];
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
    return { cols: cols, rows: rows, vertices: vertices };
  }

  function leftStrataMask(u, v) {
    var region = smoothstep(0.58, 0.18, u) * smoothstep(0.24, 0.72, v);
    var wave = Math.sin(v * 26.0 + u * 9.0 + Math.sin(u * 7.0) * 1.8);
    var band = Math.pow(Math.max(0, 1 - Math.abs(wave)), 5.0);
    return band * region * 0.68;
  }

  function plateauMask(u, v) {
    var inX = smoothstep(0.30, 0.42, u) * smoothstep(0.70, 0.56, u);
    var inY = smoothstep(0.34, 0.46, v) * smoothstep(0.72, 0.60, v);
    var diagonal = 0.5 + 0.5 * Math.sin((u * 9.0 - v * 6.0));
    return inX * inY * (0.34 + diagonal * 0.22);
  }

  function basinMask(u, v) {
    var dx = (u - 0.46) / 0.30;
    var dy = (v - 0.86) / 0.20;
    var d = Math.sqrt(dx * dx + dy * dy);
    var arc = 1 - Math.abs((d * 5.4) % 1 - 0.5) * 2;
    var envelope = smoothstep(1.20, 0.18, d) * smoothstep(0.62, 0.76, v);
    return Math.pow(Math.max(0, arc), 2.2) * envelope * 0.38;
  }

  function rightRingsMask(u, v) {
    var cx = 0.74;
    var cy = 0.66;
    var dx = (u - cx) / 0.16;
    var dy = (v - cy) / 0.14;
    var d = Math.sqrt(dx * dx + dy * dy);
    var ring = 1 - Math.abs((d * 7.0) % 1.0 - 0.5) * 2.0;
    var envelope = smoothstep(1.00, 0.12, d);
    return Math.pow(Math.max(0, ring), 2.6) * envelope * 0.42;
  }

  function fanMask(u, v) {
    var region = smoothstep(0.62, 0.74, u) * smoothstep(0.64, 0.80, v);
    var diagA = Math.pow(Math.max(0, 1 - Math.abs((v - 0.77) - (u - 0.69) * 0.78) / 0.060), 2.2);
    var diagB = Math.pow(Math.max(0, 1 - Math.abs((v - 0.81) - (u - 0.73) * 0.60) / 0.075), 2.0);
    return Math.max(diagA, diagB * 0.75) * region * 0.48;
  }

  function featureField(u, v) {
    var left = leftStrataMask(u, v);
    var plateau = plateauMask(u, v);
    var basin = basinMask(u, v);
    var rings = rightRingsMask(u, v);
    var fan = fanMask(u, v);
    var noise = valueNoise(u * 4.0, v * 4.0) * 0.12;
    return Math.max(left, plateau, basin, rings, fan, noise);
  }

  function contentFade(x, y, w, h) {
    var cx = w * 0.50;
    var cy = h * 0.47;
    var dx = (x - cx) / (w * 0.235);
    var dy = (y - cy) / (h * 0.175);
    var d = Math.sqrt(dx * dx + dy * dy);
    return 0.22 + 0.78 * smoothstep(0.78, 1.34, d);
  }

  function projectPoint(u, v, width, height, feature) {
    var horizonY = height * 0.445;
    var nearY = height * 1.065;
    var p = Math.pow(v, 1.40);
    var y = horizonY + p * (nearY - horizonY);
    var spread = width * (0.50 + v * 1.50);
    var x = width * 0.5 + (u - 0.5) * spread;

    var warp = (feature - 0.5) * width * 0.013 * (0.22 + v);
    x += warp;
    y -= (feature - 0.20) * height * 0.008 * smoothstep(0.24, 1.0, v);

    return { x: x, y: y };
  }

  function projectMesh(mesh, width, height) {
    var out = new Array(mesh.vertices.length);
    for (var i = 0; i < mesh.vertices.length; i++) {
      var vtx = mesh.vertices[i];
      var f = featureField(vtx.u, vtx.v);
      out[i] = projectPoint(vtx.u, vtx.v, width, height, f);
    }
    return out;
  }

  function renderHero(ctx, state, time) {
    var mesh = state.mesh;
    var width = state.width;
    var height = state.height;
    var projected = projectMesh(mesh, width, height);
    var cols = mesh.cols;
    var rows = mesh.rows;
    var verts = mesh.vertices;

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var i00 = j * (cols + 1) + i;
        var i10 = i00 + 1;
        var i01 = (j + 1) * (cols + 1) + i;
        var i11 = i01 + 1;

        drawEdgePair(ctx, projected[i00], projected[i10], verts[i00], verts[i10], width, height, time);
        drawEdgePair(ctx, projected[i10], projected[i01], verts[i10], verts[i01], width, height, time);
        drawEdgePair(ctx, projected[i01], projected[i00], verts[i01], verts[i00], width, height, time);

        drawEdgePair(ctx, projected[i10], projected[i11], verts[i10], verts[i11], width, height, time);
        drawEdgePair(ctx, projected[i11], projected[i01], verts[i11], verts[i01], width, height, time);
      }
    }

    if (SHOW_EXPLICIT_MOTIF_OVERLAYS) {
      // intentionally disabled for final-pass hierarchy
    }
  }

  function drawEdgePair(ctx, p1, p2, v1, v2, width, height, time) {
    var midX = (p1.x + p2.x) * 0.5;
    var midY = (p1.y + p2.y) * 0.5;
    var avgU = (v1.u + v2.u) * 0.5;
    var avgV = (v1.v + v2.v) * 0.5;
    var f = Math.max(featureField(v1.u, v1.v), featureField(v2.u, v2.v), featureField(avgU, avgV));
    var depth = 0.18 + avgV * 0.82;
    var fade = contentFade(midX, midY, width, height);
    var verticalFade = 0.36 + avgV * 0.64;
    var shimmer = 0.92 + 0.08 * Math.sin(time * 0.72 + avgU * 8.0 + avgV * 5.2);

    var baseAlpha = (0.018 + avgV * 0.036) * (0.86 + 0.14 * fade) * shimmer;
    baseAlpha = clamp(baseAlpha, 0.012, 0.065);

    ctx.strokeStyle = 'rgba(82,52,12,' + baseAlpha + ')';
    ctx.lineWidth = 0.24 + avgV * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    var alpha = 0.028 + f * 0.42 + depth * 0.10;
    alpha *= fade;
    alpha *= verticalFade;
    alpha *= shimmer;
    alpha = clamp(alpha, 0.018, 0.70);

    ctx.strokeStyle = rgbaGold(alpha, f);
    ctx.lineWidth = 0.34 + f * 0.54 + avgV * 0.38;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
})();
