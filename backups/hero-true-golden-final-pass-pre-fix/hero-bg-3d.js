(function() {
  'use strict';

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
      globalMesh: null,
      detailMesh: null,
      pointer: { x: 0, y: 0, tx: 0, ty: 0 },
      hero: hero
    };

    function resize() {
      var rect = hero.getBoundingClientRect();
      var w = Math.max(360, Math.round(rect.width || window.innerWidth));
      var h = Math.max(560, Math.round(rect.height || window.innerHeight));
      state.isMobile = w < 768;
      state.dpr = Math.min(window.devicePixelRatio || 1, state.isMobile ? 1.15 : 1.6);
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
      state.globalMesh = buildMesh(state.isMobile ? 34 : 58, state.isMobile ? 22 : 32, 0.020, 0.018, 101);
      state.detailMesh = buildMesh(state.isMobile ? 48 : 92, state.isMobile ? 30 : 54, 0.012, 0.012, 202);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('pointermove', function(e) {
      var rect = hero.getBoundingClientRect();
      state.pointer.tx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      state.pointer.ty = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    }, { passive: true });

    var startTime = performance.now();

    function frame() {
      var time = (performance.now() - startTime) / 1000;
      state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.05;
      state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.05;

      starsCtx.clearRect(0, 0, state.width, state.height);
      drawStars(starsCtx, state, time);

      meshCtx.clearRect(0, 0, state.width, state.height);
      renderHero(meshCtx, state, time);

      requestAnimationFrame(frame);
    }

    frame();
  }

  function seededRandom(seed) {
    var s = seed;
    return function() {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function buildStars(w, h, isMobile) {
    var rng = seededRandom(isMobile ? 77 : 88);
    var count = isMobile ? 980 : 2450;
    var anchors = isMobile ? 20 : 46;
    var stars = [];

    for (var i = 0; i < count; i++) {
      var depth = 0.15 + rng() * 0.85;
      var bright = i < anchors;
      var y = Math.pow(rng(), bright ? 1.05 : 1.55) * h * 0.78;
      var size = bright ? 1.15 + rng() * 1.2 : 0.22 + Math.pow(depth, 2.3) * 1.15;
      stars.push({
        x: rng() * w,
        y: y,
        depth: depth,
        size: size,
        phase: rng() * Math.PI * 2,
        speed: 0.18 + rng() * 0.55,
        alpha: bright ? 0.34 + rng() * 0.28 : 0.05 + depth * 0.16,
        hue: bright ? 0 : (rng() < 0.72 ? 1 : 2),
        bright: bright
      });
    }

    return stars;
  }

  function drawStars(ctx, state, time) {
    var stars = state.stars;
    var w = state.width;
    var h = state.height;
    var palette = [
      '224,160,48',
      '196,129,31',
      '146,92,18'
    ];

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var dx = state.pointer.x * s.depth * 5.0 + Math.sin(time * 0.022 + s.phase) * s.depth * 2.2;
      var dy = state.pointer.y * s.depth * 2.6 + Math.cos(time * 0.017 + s.phase) * s.depth * 1.25;
      var x = s.x + dx;
      var y = s.y + dy;
      if (x < -6 || x > w + 6 || y < -6 || y > h + 6) continue;

      var twinkle = 0.84 + 0.16 * Math.sin(time * s.speed + s.phase);
      var alpha = s.alpha * twinkle;
      var rgb = palette[s.hue];

      if (s.bright) {
        var glow = ctx.createRadialGradient(x, y, 0, x, y, s.size * 5.5);
        glow.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(0.24, alpha * 0.60) + ')');
        glow.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, s.size * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(' + rgb + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
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

  function projectPoint(u, v, width, height) {
    var horizonY = height * 0.49;
    var nearY = height * 1.11;
    var perspective = Math.pow(v, 1.44);
    var y = horizonY + perspective * (nearY - horizonY);
    var spread = width * (0.44 + v * 1.70);
    var x = width * 0.5 + (u - 0.5) * spread;

    var broadNoise = Math.sin(u * 8.4 + v * 1.2) * Math.cos(v * 10.5 - u * 1.8);
    y -= broadNoise * height * 0.010 * smoothstep(0.18, 1.0, v);
    x += Math.sin(v * 9.0 + u * 5.5) * width * 0.0035 * smoothstep(0.25, 1.0, v);

    return { x: x, y: y };
  }

  function projectMesh(mesh, w, h) {
    var out = new Array(mesh.vertices.length);
    for (var i = 0; i < mesh.vertices.length; i++) {
      out[i] = projectPoint(mesh.vertices[i].u, mesh.vertices[i].v, w, h);
    }
    return out;
  }

  function leftStrataWeight(u, v) {
    var mask = smoothstep(0.56, 0.18, u) * smoothstep(0.50, 0.66, v) * smoothstep(0.98, 0.52, v);
    var center = 0.02 + (0.78 - v) * 2.0 + Math.sin(v * 11.0) * 0.018;
    var spine = 1.0 - smoothstep(0.035, 0.16, Math.abs(u - center));
    var bands = 1.0 - smoothstep(0.08, 0.20, Math.abs(Math.sin(v * 30.0 + u * 9.0 + Math.sin(v * 6.0) * 2.0)));
    return Math.max(spine * 0.82, bands) * mask;
  }

  function plateauWeight(u, v) {
    var dx = Math.abs(u - 0.515);
    var dy = Math.abs(v - 0.63);
    var diamond = 1.0 - smoothstep(0.14, 0.30, dx + dy * 0.82);
    var box = smoothstep(0.37, 0.42, u) * smoothstep(0.67, 0.61, u) * smoothstep(0.52, 0.57, v) * smoothstep(0.74, 0.70, v);
    return Math.max(diamond, box * 0.95);
  }

  function basinWeight(u, v) {
    var dx = (u - 0.46) / 0.37;
    var dy = (v - 0.86) / 0.22;
    var d = Math.sqrt(dx * dx + dy * dy);
    var rings = 1.0 - smoothstep(0.016, 0.070, Math.abs(Math.sin(d * 23.0)));
    var mask = smoothstep(0.60, 0.72, v) * smoothstep(1.55, 0.24, d);
    return rings * mask;
  }

  function rightRingsWeight(u, v) {
    var dx = (u - 0.72) / 0.20;
    var dy = (v - 0.68) / 0.17;
    var d = Math.sqrt(dx * dx + dy * dy);
    var rings = 1.0 - smoothstep(0.014, 0.050, Math.abs(Math.sin(d * 28.0)));
    var core = 1.0 - smoothstep(0.00, 0.18, d);
    return Math.max(rings, core * 0.55) * smoothstep(1.10, 0.16, d);
  }

  function fanWeight(u, v) {
    var mask = smoothstep(0.62, 0.78, u) * smoothstep(0.62, 0.80, v);
    var diag = 1.0 - smoothstep(0.016, 0.065, Math.abs((v - 0.77) - (u - 0.68) * 0.74));
    var spoke = 1.0 - smoothstep(0.03, 0.11, Math.abs(Math.sin((u * 22.0 - v * 14.0) * 2.2)));
    return Math.max(diag, spoke * 0.72) * mask;
  }

  function drawMeshPass(ctx, mesh, projected, time, style, featureFn) {
    var cols = mesh.cols;
    var rows = mesh.rows;
    var verts = mesh.vertices;

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var i00 = j * (cols + 1) + i;
        var i10 = i00 + 1;
        var i01 = (j + 1) * (cols + 1) + i;
        var i11 = i01 + 1;

        var a = projected[i00];
        var b = projected[i10];
        var c = projected[i01];
        var d = projected[i11];

        var va = verts[i00];
        var vb = verts[i10];
        var vc = verts[i01];
        var vd = verts[i11];

        drawEdge(ctx, a, b, va, vb, time, style, featureFn);
        drawEdge(ctx, b, c, vb, vc, time, style, featureFn);
        drawEdge(ctx, c, a, vc, va, time, style, featureFn);

        drawEdge(ctx, b, d, vb, vd, time, style, featureFn);
        drawEdge(ctx, d, c, vd, vc, time, style, featureFn);
        drawEdge(ctx, c, b, vc, vb, time, style, featureFn);
      }
    }
  }

  function drawEdge(ctx, p1, p2, v1, v2, time, style, featureFn) {
    var u = (v1.u + v2.u) * 0.5;
    var v = (v1.v + v2.v) * 0.5;
    var feature = featureFn ? Math.max(featureFn(v1.u, v1.v), featureFn(v2.u, v2.v), featureFn(u, v)) : 0;
    var depth = smoothstep(0.12, 1.0, v);
    var horizonFade = smoothstep(style.horizon0, style.horizon1, v);
    var shimmer = style.shimmer ? (0.90 + 0.10 * Math.sin(time * style.shimmerSpeed + u * 7.0 + v * 4.5)) : 1.0;
    var alpha = style.baseAlpha + depth * style.depthAlpha + feature * style.featureAlpha;
    alpha *= horizonFade * shimmer;
    alpha = clamp(alpha, style.minAlpha, style.maxAlpha);

    var color;
    if (feature > 0.60) {
      color = 'rgba(224,160,48,' + alpha + ')';
    } else if (feature > 0.28) {
      color = 'rgba(210,146,34,' + alpha + ')';
    } else {
      color = 'rgba(' + style.baseColor + ',' + alpha + ')';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = style.baseWidth + depth * style.depthWidth + feature * style.featureWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  function renderHero(ctx, state, time) {
    var w = state.width;
    var h = state.height;
    var projectedGlobal = projectMesh(state.globalMesh, w, h);
    var projectedDetail = projectMesh(state.detailMesh, w, h);

    drawMeshPass(ctx, state.globalMesh, projectedGlobal, time, {
      baseAlpha: 0.05,
      depthAlpha: 0.09,
      featureAlpha: 0.00,
      horizon0: 0.18,
      horizon1: 0.42,
      shimmer: true,
      shimmerSpeed: 0.55,
      minAlpha: 0.05,
      maxAlpha: 0.16,
      baseWidth: 0.35,
      depthWidth: 0.40,
      featureWidth: 0.00,
      baseColor: '110,70,16'
    }, null);

    drawLeftStrataRegion(ctx, state, time, projectedDetail);
    drawPlateauRegion(ctx, state, time, projectedDetail);
    drawBasinRegion(ctx, state, time, projectedDetail);
    drawRingsRegion(ctx, state, time, projectedDetail);
    drawFanRegion(ctx, state, time, projectedDetail);
  }

  function fillBuiltPath(ctx, builder, fillStyle, w, h) {
    ctx.beginPath();
    builder(ctx, w, h);
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function clipAndDrawRegion(ctx, state, projectedDetail, builder, fillKind, featureFn, time) {
    var w = state.width;
    var h = state.height;

    ctx.save();
    ctx.beginPath();
    builder(ctx, w, h);
    ctx.clip();

    if (fillKind === 'left') {
      var g1 = ctx.createLinearGradient(0, h * 0.86, w * 0.46, h * 0.52);
      g1.addColorStop(0, 'rgba(110,70,16,0.12)');
      g1.addColorStop(0.4, 'rgba(170,109,22,0.08)');
      g1.addColorStop(1, 'rgba(224,160,48,0.03)');
      ctx.fillStyle = g1;
    } else if (fillKind === 'plateau') {
      var g2 = ctx.createLinearGradient(w * 0.40, h * 0.54, w * 0.66, h * 0.72);
      g2.addColorStop(0, 'rgba(196,129,31,0.10)');
      g2.addColorStop(1, 'rgba(110,70,16,0.06)');
      ctx.fillStyle = g2;
    } else if (fillKind === 'basin') {
      var g3 = ctx.createRadialGradient(w * 0.46, h * 0.86, 20, w * 0.46, h * 0.86, Math.max(160, h * 0.24));
      g3.addColorStop(0, 'rgba(224,160,48,0.06)');
      g3.addColorStop(0.45, 'rgba(170,109,22,0.08)');
      g3.addColorStop(1, 'rgba(110,70,16,0.02)');
      ctx.fillStyle = g3;
    } else if (fillKind === 'rings') {
      var g4 = ctx.createRadialGradient(w * 0.72, h * 0.68, 20, w * 0.72, h * 0.68, Math.max(180, h * 0.24));
      g4.addColorStop(0, 'rgba(224,160,48,0.08)');
      g4.addColorStop(0.5, 'rgba(196,129,31,0.05)');
      g4.addColorStop(1, 'rgba(110,70,16,0.01)');
      ctx.fillStyle = g4;
    } else {
      var g5 = ctx.createLinearGradient(w * 0.66, h * 0.76, w, h);
      g5.addColorStop(0, 'rgba(196,129,31,0.07)');
      g5.addColorStop(1, 'rgba(110,70,16,0.03)');
      ctx.fillStyle = g5;
    }

    ctx.beginPath();
    builder(ctx, w, h);
    ctx.fill();

    drawMeshPass(ctx, state.detailMesh, projectedDetail, time, {
      baseAlpha: 0.18,
      depthAlpha: 0.10,
      featureAlpha: 0.58,
      horizon0: 0.18,
      horizon1: 0.40,
      shimmer: true,
      shimmerSpeed: 0.80,
      minAlpha: 0.18,
      maxAlpha: 0.95,
      baseWidth: 0.65,
      depthWidth: 0.38,
      featureWidth: 0.95,
      baseColor: '146,92,18'
    }, featureFn);

    ctx.restore();
  }

  function bezierPoint(p0, p1, p2, p3, t) {
    var mt = 1 - t;
    var mt2 = mt * mt;
    var t2 = t * t;
    return {
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
    };
  }

  function leftRegionPath(ctx, w, h) {
    ctx.moveTo(-0.08 * w, 0.80 * h);
    ctx.bezierCurveTo(0.02 * w, 0.74 * h, 0.16 * w, 0.64 * h, 0.43 * w, 0.54 * h);
    ctx.lineTo(0.46 * w, 0.61 * h);
    ctx.bezierCurveTo(0.25 * w, 0.68 * h, 0.10 * w, 0.78 * h, -0.04 * w, 0.92 * h);
    ctx.closePath();
  }

  function drawLeftStrataRegion(ctx, state, time, projectedDetail) {
    var w = state.width;
    var h = state.height;
    clipAndDrawRegion(ctx, state, projectedDetail, leftRegionPath, 'left', leftStrataWeight, time);

    var bands = [];
    for (var i = 0; i < 6; i++) {
      bands.push({
        p0: { x: -0.05 * w, y: h * (0.74 + i * 0.028) },
        p1: { x:  0.12 * w, y: h * (0.68 + i * 0.020) },
        p2: { x:  0.25 * w, y: h * (0.60 + i * 0.025) },
        p3: { x:  0.42 * w, y: h * (0.56 + i * 0.030) }
      });
    }

    for (var b = 0; b < bands.length; b++) {
      var band = bands[b];
      ctx.beginPath();
      ctx.moveTo(band.p0.x, band.p0.y);
      ctx.bezierCurveTo(band.p1.x, band.p1.y, band.p2.x, band.p2.y, band.p3.x, band.p3.y);
      ctx.strokeStyle = 'rgba(224,160,48,' + (0.05 + b * 0.012) + ')';
      ctx.lineWidth = 6 + b * 0.55;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(band.p0.x, band.p0.y);
      ctx.bezierCurveTo(band.p1.x, band.p1.y, band.p2.x, band.p2.y, band.p3.x, band.p3.y);
      ctx.strokeStyle = 'rgba(224,160,48,' + (0.48 + b * 0.07) + ')';
      ctx.lineWidth = 1.45 + b * 0.15;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    for (var bi = 0; bi < bands.length - 1; bi++) {
      for (var k = 0; k < 6; k++) {
        var t0 = (k + 1) / 7;
        var a = bezierPoint(bands[bi].p0, bands[bi].p1, bands[bi].p2, bands[bi].p3, t0);
        var bpt = bezierPoint(bands[bi + 1].p0, bands[bi + 1].p1, bands[bi + 1].p2, bands[bi + 1].p3, t0 * 0.96);
        var c = { x: lerp(a.x, bpt.x, 0.5) + w * 0.012, y: lerp(a.y, bpt.y, 0.5) - h * 0.012 };
        ctx.strokeStyle = 'rgba(210,146,34,0.34)';
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(bpt.x, bpt.y);
        ctx.stroke();
      }
    }
  }

  function plateauRegionPath(ctx, w, h) {
    ctx.moveTo(0.37 * w, 0.60 * h);
    ctx.lineTo(0.47 * w, 0.54 * h);
    ctx.lineTo(0.61 * w, 0.57 * h);
    ctx.lineTo(0.66 * w, 0.65 * h);
    ctx.lineTo(0.63 * w, 0.72 * h);
    ctx.lineTo(0.47 * w, 0.72 * h);
    ctx.lineTo(0.39 * w, 0.68 * h);
    ctx.closePath();
  }

  function drawPlateauRegion(ctx, state, time, projectedDetail) {
    var w = state.width;
    var h = state.height;
    clipAndDrawRegion(ctx, state, projectedDetail, plateauRegionPath, 'plateau', plateauWeight, time);

    ctx.beginPath();
    plateauRegionPath(ctx, w, h);
    ctx.strokeStyle = 'rgba(224,160,48,0.10)';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    plateauRegionPath(ctx, w, h);
    ctx.strokeStyle = 'rgba(224,160,48,0.74)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0.47 * w, 0.54 * h);
    ctx.lineTo(0.61 * w, 0.57 * h);
    ctx.strokeStyle = 'rgba(224,160,48,0.84)';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0.61 * w, 0.57 * h);
    ctx.lineTo(0.66 * w, 0.65 * h);
    ctx.strokeStyle = 'rgba(224,160,48,0.78)';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    var points = [
      [0.37,0.60],[0.43,0.58],[0.47,0.54],[0.52,0.56],[0.57,0.58],[0.61,0.57],[0.64,0.62],[0.66,0.65],
      [0.63,0.72],[0.56,0.70],[0.50,0.67],[0.45,0.72],[0.39,0.68],[0.42,0.63],[0.49,0.61],[0.58,0.64]
    ];
    var edges = [
      [0,3],[0,13],[1,4],[1,13],[2,4],[2,10],[2,12],[3,5],[3,10],[3,14],[4,6],[4,15],[5,7],[5,15],
      [6,8],[6,15],[7,8],[8,10],[9,10],[9,11],[10,12],[10,14],[11,12],[11,14],[14,15]
    ];
    ctx.strokeStyle = 'rgba(210,146,34,0.52)';
    ctx.lineWidth = 1.05;
    for (var i = 0; i < edges.length; i++) {
      var ea = points[edges[i][0]];
      var eb = points[edges[i][1]];
      ctx.beginPath();
      ctx.moveTo(ea[0] * w, ea[1] * h);
      ctx.lineTo(eb[0] * w, eb[1] * h);
      ctx.stroke();
    }
  }

  function basinRegionPath(ctx, w, h) {
    var cx = 0.46 * w;
    var cy = 0.86 * h;
    var outerRx = Math.min(360, w * 0.25);
    var outerRy = Math.min(145, h * 0.17);
    var innerRx = Math.min(120, w * 0.08);
    var innerRy = Math.min(52, h * 0.06);
    ellipticalArcPath(ctx, cx, cy, outerRx, outerRy, degToRad(205), degToRad(350), false);
    ellipticalArcPath(ctx, cx, cy, innerRx, innerRy, degToRad(350), degToRad(205), true);
    ctx.closePath();
  }

  function drawBasinRegion(ctx, state, time, projectedDetail) {
    var w = state.width;
    var h = state.height;
    var cx = 0.46 * w;
    var cy = 0.86 * h;
    clipAndDrawRegion(ctx, state, projectedDetail, basinRegionPath, 'basin', basinWeight, time);

    for (var i = 0; i < 7; i++) {
      var rx = 80 + i * ((Math.min(360, w * 0.25) - 80) / 6);
      var ry = 40 + i * ((Math.min(145, h * 0.17) - 40) / 6);
      ctx.beginPath();
      drawPartialEllipse(ctx, cx, cy, rx, ry, degToRad(205), degToRad(350), time * 0.02 + i * 0.03);
      ctx.strokeStyle = 'rgba(224,160,48,' + (0.70 - i * 0.055) + ')';
      ctx.lineWidth = 1.55 - i * 0.08;
      ctx.stroke();
    }
  }

  function ringsRegionPath(ctx, w, h) {
    var cx = 0.72 * w;
    var cy = 0.68 * h;
    var rx = Math.min(250, w * 0.18);
    var ry = rx * 0.68;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  function drawRingsRegion(ctx, state, time, projectedDetail) {
    var w = state.width;
    var h = state.height;
    var cx = 0.72 * w;
    var cy = 0.68 * h;
    clipAndDrawRegion(ctx, state, projectedDetail, ringsRegionPath, 'rings', rightRingsWeight, time);

    var ringCount = 7;
    for (var r = 0; r < ringCount; r++) {
      var radius = 32 + r * ((235 - 32) / (ringCount - 1));
      var rx = radius;
      var ry = radius * 0.66;
      ctx.beginPath();
      drawPartialEllipse(ctx, cx, cy, rx, ry, degToRad(12 + r * 4), degToRad(332 - r * 2), time * 0.025 + r * 0.08);
      ctx.strokeStyle = 'rgba(224,160,48,' + (0.82 - r * 0.06) + ')';
      ctx.lineWidth = 2.0 - r * 0.12;
      ctx.stroke();
    }

    var chordAngles = [0.22, 0.58, 1.15, 1.72, 2.22];
    for (var c = 0; c < chordAngles.length; c++) {
      var a1 = chordAngles[c] * Math.PI;
      var a2 = a1 + Math.PI * 0.35;
      var rr = 80 + c * 28;
      var p1 = { x: cx + Math.cos(a1) * rr, y: cy + Math.sin(a1) * rr * 0.66 };
      var p2 = { x: cx + Math.cos(a2) * (rr + 24), y: cy + Math.sin(a2) * (rr + 24) * 0.66 };
      var p3 = { x: cx + Math.cos(a1 + 0.22) * (rr + 12), y: cy + Math.sin(a1 + 0.22) * (rr + 12) * 0.66 };
      ctx.strokeStyle = 'rgba(210,146,34,0.36)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  function fanRegionPath(ctx, w, h) {
    ctx.moveTo(0.66 * w, 0.76 * h);
    ctx.lineTo(0.78 * w, 0.74 * h);
    ctx.lineTo(1.02 * w, 0.95 * h);
    ctx.lineTo(0.72 * w, 0.98 * h);
    ctx.closePath();
  }

  function drawFanRegion(ctx, state, time, projectedDetail) {
    var w = state.width;
    var h = state.height;
    var ox = 0.66 * w;
    var oy = 0.76 * h;
    clipAndDrawRegion(ctx, state, projectedDetail, fanRegionPath, 'fan', fanWeight, time);

    var ridgeCount = 15;
    var ridges = [];
    for (var i = 0; i < ridgeCount; i++) {
      var t = i / (ridgeCount - 1);
      var x2 = lerp(0.76 * w, 1.02 * w, t);
      var y2 = lerp(0.78 * h, 0.95 * h, t);
      ridges.push([{ x: ox, y: oy + i * h * 0.008 }, { x: x2, y: y2 }]);
      ctx.strokeStyle = 'rgba(224,160,48,' + (0.35 + t * 0.34) + ')';
      ctx.lineWidth = 0.95 + t * 0.70;
      ctx.beginPath();
      ctx.moveTo(ox, oy + i * h * 0.008);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(210,146,34,0.34)';
    ctx.lineWidth = 0.9;
    for (var r = 0; r < ridges.length - 1; r++) {
      for (var s = 0; s < 2; s++) {
        var tt = s === 0 ? 0.34 : 0.66;
        var a = {
          x: lerp(ridges[r][0].x, ridges[r][1].x, tt),
          y: lerp(ridges[r][0].y, ridges[r][1].y, tt)
        };
        var b = {
          x: lerp(ridges[r + 1][0].x, ridges[r + 1][1].x, tt * 0.96),
          y: lerp(ridges[r + 1][0].y, ridges[r + 1][1].y, tt * 0.96)
        };
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  function drawPartialEllipse(ctx, cx, cy, rx, ry, start, end, wobblePhase) {
    var steps = 220;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = start + (end - start) * t;
      var wobble = 1 + 0.018 * Math.sin(a * 5.0 + wobblePhase * 7.0) + 0.010 * Math.cos(a * 3.0 + wobblePhase * 5.0);
      var x = cx + Math.cos(a) * rx * wobble;
      var y = cy + Math.sin(a) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  function ellipticalArcPath(ctx, cx, cy, rx, ry, start, end, reverse) {
    var steps = 180;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = reverse ? end + (start - end) * t : start + (end - start) * t;
      var x = cx + Math.cos(a) * rx;
      var y = cy + Math.sin(a) * ry;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }
})();
