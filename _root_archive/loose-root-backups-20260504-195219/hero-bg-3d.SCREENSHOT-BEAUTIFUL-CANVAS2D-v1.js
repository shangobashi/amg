/**
 * Afriplan — Screenshot Beautiful Hero Background
 * Reconstructed from Screenshot 2026-05-02 224224.png
 * Reliable 2D canvas renderer with pseudo-3D projection:
 * - black/gold premium field
 * - live topographic wireframe terrain
 * - floating wireframe polyhedrons
 * - orbital rings + small planetoid moons
 * - depth-varied starfield
 * No WebGL dependency for the scene itself; Three.js may still load harmlessly.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;

  var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var W = 1, H = 1, DPR = 1, CX = 0, CY = 0;
  var isMobile = false;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var start = performance.now();

  var GOLD = '201,164,84';
  var AMBER = '245,158,11';
  var PALE = '255,229,168';

  function resize() {
    var r = hero.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width || window.innerWidth));
    H = Math.max(520, Math.round(r.height || window.innerHeight * 0.92));
    isMobile = W < 768;
    DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W * 0.5;
    CY = H * 0.50;
    buildStars();
    buildTerrain();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
  }, { passive: true });

  // ────────────────────────────────────────────────────────────────────────────
  // Starfield — moderate density, real depth variation, not a flat sprinkle.
  // ────────────────────────────────────────────────────────────────────────────
  var stars = [];
  function buildStars() {
    var count = isMobile ? 150 : 360;
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.82,
        z: z,
        r: 0.35 + Math.pow(z, 2.2) * (isMobile ? 1.3 : 2.2),
        a: 0.10 + z * 0.45,
        tw: Math.random() * Math.PI * 2,
        sp: 0.12 + Math.random() * 0.22
      });
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Terrain — pseudo-3D topographic wireframe occupying lower half like screenshot.
  // ────────────────────────────────────────────────────────────────────────────
  var terrain = [];
  var cols = 58;
  var rows = 24;

  function buildTerrain() {
    cols = isMobile ? 34 : 62;
    rows = isMobile ? 16 : 27;
    terrain = [];
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var u = i / (cols - 1);
        var v = j / (rows - 1);
        terrain.push({ u: u, v: v, seed: Math.sin(i * 12.9898 + j * 78.233) * 43758.5453 });
      }
    }
  }

  function terrainHeight(x, z, t) {
    var h = 0;
    h += Math.sin(x * 0.085 + t * 0.42) * 11;
    h += Math.sin(z * 0.105 - t * 0.32) * 8;
    h += Math.sin((x + z) * 0.050 + t * 0.24) * 13;
    // Three quiet mineral wells/peaks; gives the mesh physical logic.
    var wells = [
      { x: -42, z: 20, p: 22 },
      { x:  28, z:  8, p: 17 },
      { x:   2, z: 42, p: -14 }
    ];
    for (var k = 0; k < wells.length; k++) {
      var dx = x - wells[k].x, dz = z - wells[k].z;
      var d2 = dx * dx + dz * dz;
      h += wells[k].p * Math.exp(-d2 / 1350);
    }
    return h;
  }

  function project3(x, y, z, t) {
    // Screenshot-style camera: horizon high, terrain widening toward viewer.
    var parX = mouse.x * 18;
    var parY = mouse.y * 10;
    var camZ = 154;
    var zz = z + camZ;
    var s = 360 / Math.max(38, zz);
    return {
      x: CX + (x + parX) * s,
      y: H * 0.70 + parY - y * s * 0.72 + (z - 38) * 1.62,
      s: s,
      d: Math.max(0, Math.min(1, (z + 70) / 150))
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Polyhedrons — wireframe icosa/octa bodies, with screenshot-like rings/moons.
  // ────────────────────────────────────────────────────────────────────────────
  var phi = (1 + Math.sqrt(5)) / 2;
  var icoVerts = normalizeVerts([
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ]);
  var icoEdges = uniqueEdges([
    [0,11,5], [0,5,1], [0,1,7], [0,7,10], [0,10,11],
    [1,5,9], [5,11,4], [11,10,2], [10,7,6], [7,1,8],
    [3,9,4], [3,4,2], [3,2,6], [3,6,8], [3,8,9],
    [4,9,5], [2,4,11], [6,2,10], [8,6,7], [9,8,1]
  ]);
  var octVerts = normalizeVerts([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]);
  var octEdges = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]];

  function normalizeVerts(arr) {
    return arr.map(function (v) {
      var l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) || 1;
      return [v[0]/l, v[1]/l, v[2]/l];
    });
  }
  function uniqueEdges(faces) {
    var map = {}, out = [];
    faces.forEach(function (f) {
      for (var i = 0; i < f.length; i++) {
        var a = f[i], b = f[(i + 1) % f.length];
        var k = a < b ? a + '-' + b : b + '-' + a;
        if (!map[k]) { map[k] = true; out.push([a, b]); }
      }
    });
    return out;
  }

  var bodies = [
    { kind: 'ico', x: -0.36, y: 0.23, r: 44, a: 0.15, ring: true,  moon: 0.2, speed: 0.24 },
    { kind: 'ico', x:  0.38, y: 0.25, r: 38, a: 1.90, ring: true,  moon: 2.7, speed: -0.18 },
    { kind: 'ico', x:  0.18, y: 0.48, r: 26, a: 3.10, ring: false, moon: 0.0, speed: 0.21 },
    { kind: 'oct', x: -0.20, y: 0.55, r: 30, a: 2.20, ring: false, moon: 0.0, speed: -0.16 }
  ];

  function rotatePoint(v, ax, ay, az) {
    var x = v[0], y = v[1], z = v[2];
    var cx = Math.cos(ax), sx = Math.sin(ax);
    var cy = Math.cos(ay), sy = Math.sin(ay);
    var cz = Math.cos(az), sz = Math.sin(az);
    var y1 = y * cx - z * sx, z1 = y * sx + z * cx; y = y1; z = z1;
    var x1 = x * cy + z * sy, z2 = -x * sy + z * cy; x = x1; z = z2;
    var x2 = x * cz - y * sz, y2 = x * sz + y * cz; x = x2; y = y2;
    return [x, y, z];
  }

  function drawPoly(body, t) {
    var verts = body.kind === 'ico' ? icoVerts : octVerts;
    var edges = body.kind === 'ico' ? icoEdges : octEdges;
    var cx = CX + W * body.x + mouse.x * (12 + body.r * 0.05);
    var cy = H * body.y + mouse.y * 8;
    var r = body.r * (isMobile ? 0.72 : 1);
    var ax = body.a + t * body.speed * 0.55;
    var ay = body.a * 0.7 + t * body.speed * 0.82;
    var az = body.a * 0.4 + t * body.speed * 0.35;
    var p = verts.map(function (v) {
      var q = rotatePoint(v, ax, ay, az);
      var s = 1 + q[2] * 0.10;
      return { x: cx + q[0] * r * s, y: cy + q[1] * r * s, z: q[2] };
    });

    if (body.ring) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((body.a * 0.4) + Math.sin(t * 0.12 + body.a) * 0.18);
      ctx.scale(1.28, 0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.32, r * 0.70, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + GOLD + ',0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      var ma = t * (0.38 + Math.abs(body.speed)) + body.moon;
      var mx = cx + Math.cos(ma) * r * 1.65;
      var my = cy + Math.sin(ma) * r * 0.48;
      var grd = ctx.createRadialGradient(mx, my, 0, mx, my, 6);
      grd.addColorStop(0, 'rgba(' + PALE + ',0.95)');
      grd.addColorStop(1, 'rgba(' + AMBER + ',0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.beginPath();
    for (var i = 0; i < edges.length; i++) {
      var a = p[edges[i][0]], b = p[edges[i][1]];
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.strokeStyle = 'rgba(' + GOLD + ',0.32)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    for (var j = 0; j < p.length; j++) {
      ctx.moveTo(p[j].x + 1.5, p[j].y);
      ctx.arc(p[j].x, p[j].y, 1.5, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(' + PALE + ',0.18)';
    ctx.fill();
  }

  function drawBackground(t) {
    ctx.clearRect(0, 0, W, H);

    var bg = ctx.createRadialGradient(CX, H * 0.48, 0, CX, H * 0.48, Math.max(W, H) * 0.75);
    bg.addColorStop(0, 'rgba(58,38,12,0.88)');
    bg.addColorStop(0.26, 'rgba(20,17,12,0.96)');
    bg.addColorStop(0.72, 'rgba(3,3,3,1)');
    bg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Soft central nebula behind text, kept restrained.
    var glow = ctx.createRadialGradient(CX, H * 0.42, 0, CX, H * 0.42, W * 0.42);
    glow.addColorStop(0, 'rgba(' + AMBER + ',0.17)');
    glow.addColorStop(0.34, 'rgba(' + GOLD + ',0.055)');
    glow.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Diagonal quiet aurora band like the screenshot's gold atmospheric sweep.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(CX, H * 0.48);
    ctx.rotate(-0.16 + Math.sin(t * 0.04) * 0.018);
    var band = ctx.createLinearGradient(-W * 0.45, 0, W * 0.45, 0);
    band.addColorStop(0, 'rgba(' + GOLD + ',0)');
    band.addColorStop(0.5, 'rgba(' + GOLD + ',0.10)');
    band.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = band;
    ctx.fillRect(-W, -42, W * 2, 84);
    ctx.restore();
  }

  function drawStars(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var driftX = mouse.x * (4 + s.z * 12) + Math.sin(t * s.sp + s.tw) * 0.8;
      var driftY = mouse.y * (3 + s.z * 8) + Math.cos(t * s.sp * 0.8 + s.tw) * 0.5;
      var tw = 0.72 + 0.28 * Math.sin(t * (0.55 + s.sp) + s.tw);
      ctx.beginPath();
      ctx.arc(s.x + driftX, s.y + driftY, s.r * tw, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (s.z > 0.78 ? PALE : GOLD) + ',' + (s.a * tw) + ')';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTerrain(t) {
    var pts = new Array(terrain.length);
    var fieldW = 192;
    var fieldD = 140;
    for (var idx = 0; idx < terrain.length; idx++) {
      var p = terrain[idx];
      var x = (p.u - 0.5) * fieldW;
      var z = (p.v - 0.02) * fieldD - 15;
      var y = terrainHeight(x, z, t);
      pts[idx] = project3(x, y, z, t);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Mesh lines: triangular lattice with stronger brightness near center and front.
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var id = j * cols + i;
        var a = pts[id];
        var centerBoost = 1 - Math.min(1, Math.abs(a.x - CX) / (W * 0.55));
        var frontBoost = Math.max(0, (a.y - H * 0.47) / (H * 0.36));
        var alpha = 0.035 + centerBoost * 0.10 + frontBoost * 0.13;
        if (i < cols - 1) line(a, pts[id + 1], alpha);
        if (j < rows - 1) line(a, pts[id + cols], alpha * 0.92);
        if (i < cols - 1 && j < rows - 1 && ((i + j) % 2 === 0)) line(a, pts[id + cols + 1], alpha * 0.58);
      }
    }

    // Highlighted contour-like ridges.
    for (var r = 3; r < rows; r += 4) {
      ctx.beginPath();
      for (var c = 0; c < cols; c++) {
        var pp = pts[r * cols + c];
        if (c === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
      }
      ctx.strokeStyle = 'rgba(' + AMBER + ',0.20)';
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }
    ctx.restore();
  }

  function line(a, b, alpha) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = 'rgba(' + GOLD + ',' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 0.72;
    ctx.stroke();
  }

  function drawVignette() {
    var vg = ctx.createRadialGradient(CX, H * 0.48, W * 0.06, CX, H * 0.48, W * 0.68);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.74, 'rgba(0,0,0,0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.82)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Bottom blend to section surface.
    var bot = ctx.createLinearGradient(0, H * 0.72, 0, H);
    bot.addColorStop(0, 'rgba(12,12,10,0)');
    bot.addColorStop(0.70, 'rgba(12,12,10,0.28)');
    bot.addColorStop(1, 'rgba(12,12,10,0.86)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.70, W, H * 0.30);
  }

  function frame(now) {
    var t = (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;

    drawBackground(t);
    drawStars(t);
    drawTerrain(t);
    for (var i = 0; i < bodies.length; i++) drawPoly(bodies[i], t);
    drawVignette();

    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})();
