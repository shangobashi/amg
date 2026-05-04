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

    var starsCanvas = document.getElementById('heroStarsCanvas');
    if (!starsCanvas) {
      starsCanvas = document.createElement('canvas');
      starsCanvas.id = 'heroStarsCanvas';
      starsCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent;z-index:1;';
      var hero = document.querySelector('.hero');
      if (hero) hero.appendChild(starsCanvas);
    }

    var meshCanvas = document.getElementById('heroMeshCanvas');
    if (!meshCanvas) {
      meshCanvas = document.createElement('canvas');
      meshCanvas.id = 'heroMeshCanvas';
      meshCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent;z-index:3;';
      var hero2 = document.querySelector('.hero');
      if (hero2) hero2.appendChild(meshCanvas);
    }

    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      starsCanvas.width = w;
      starsCanvas.height = h;
      meshCanvas.width = w;
      meshCanvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    var stars = initStars(starsCanvas);
    var constellation = initConstellation(starsCanvas);
    var mesh = initMesh(meshCanvas);

    var pointerX = window.innerWidth / 2, pointerY = window.innerHeight / 2;
    var pointerVX = 0, pointerVY = 0;
    var lastPointerX = pointerX, lastPointerY = pointerY;

    window.addEventListener('mousemove', function(e) {
      pointerVX = e.clientX - lastPointerX;
      pointerVY = e.clientY - lastPointerY;
      lastPointerX = pointerX;
      lastPointerY = pointerY;
      pointerX = e.clientX;
      pointerY = e.clientY;
    });

    var startTime = performance.now();

    function animate() {
      var t = (performance.now() - startTime) / 1000;

      var sctx = starsCanvas.getContext('2d');
      sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      drawStars(sctx, starsCanvas, stars, t);

      updateConstellation(constellation, pointerX, pointerY, pointerVX, pointerVY, starsCanvas.width, starsCanvas.height, t);
      drawConstellation(sctx, starsCanvas, constellation);

      var mctx = meshCanvas.getContext('2d');
      mctx.clearRect(0, 0, meshCanvas.width, meshCanvas.height);
      drawMesh(mctx, meshCanvas, mesh, t);

      pointerVX *= 0.92;
      pointerVY *= 0.92;

      requestAnimationFrame(animate);
    }

    animate();
  }
})();

// Seeded RNG
function seededRandom(seed) {
  var s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Stars
var STAR_PALETTE = [
  'rgba(120, 76, 14, 0.38)',
  'rgba(146, 92, 18, 0.50)',
  'rgba(170, 109, 22, 0.62)',
  'rgba(196, 129, 31, 0.74)',
  'rgba(224, 160, 48, 0.84)'
];

function initStars(canvas) {
  var isMobile = window.innerWidth < 768;
  var count = isMobile ? 700 : 1500;
  var rng = seededRandom(777);
  var stars = [];

  for (var i = 0; i < count; i++) {
    var r = rng();
    var colorIdx = r < 0.45 ? 0 : r < 0.73 ? 1 : r < 0.90 ? 2 : r < 0.98 ? 3 : 4;
    var sizeBase = colorIdx < 2 ? 0.35 : colorIdx < 3 ? 0.7 : colorIdx < 4 ? 1.3 : 1.6;
    var size = sizeBase + rng() * (colorIdx < 2 ? 0.2 : 0.3);

    stars.push({
      x: rng() * canvas.width,
      y: rng() * canvas.height * 0.65,
      size: size,
      colorIdx: colorIdx,
      alpha: 1.0,
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.7
    });
  }
  return stars;
}

function drawStars(ctx, canvas, stars, time) {
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    var twinkle = 0.72 + 0.28 * Math.sin(time * s.speed + s.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = STAR_PALETTE[s.colorIdx];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// Constellation
function initConstellation(canvas) {
  var isMobile = window.innerWidth < 768;
  var count = isMobile ? 90 : 160;
  var rng = seededRandom(555);
  var nodes = [];

  for (var i = 0; i < count; i++) {
    nodes.push({
      baseX: rng() * canvas.width,
      baseY: rng() * canvas.height * 0.65,
      x: 0, y: 0,
      vx: 0, vy: 0,
      size: 0.5 + rng() * 1.2,
      depth: 0.3 + rng() * 0.7,
      phase: rng() * Math.PI * 2,
      speed: 0.2 + rng() * 0.4
    });
  }

  for (var j = 0; j < nodes.length; j++) {
    nodes[j].x = nodes[j].baseX;
    nodes[j].y = nodes[j].baseY;
  }

  return nodes;
}

function updateConstellation(nodes, px, py, pvx, pvy, w, h, time) {
  var springK = 0.018;
  var damping = 0.88;

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    n.vx += (n.baseX - n.x) * springK;
    n.vy += (n.baseY - n.y) * springK;

    var pdx = n.x - px;
    var pdy = n.y - py;
    var pdist = Math.sqrt(pdx * pdx + pdy * pdy) + 1;
    if (pdist < 200) {
      var push = (1 - pdist / 200) * 180;
      n.vx += (pdx / pdist) * push * 0.04;
      n.vy += (pdy / pdist) * push * 0.04;
    }

    var pSpeed = Math.sqrt(pvx * pvx + pvy * pvy);
    if (pSpeed > 2) {
      var swirl = pSpeed * 0.015 * (1 - pdist / 400);
      n.vx += (-pvy * swirl) / (pdist + 50);
      n.vy += (pvx * swirl) / (pdist + 50);
    }

    n.vx += Math.cos(time * n.speed + n.phase) * 0.05;
    n.vy += Math.sin(time * n.speed * 0.7 + n.phase) * 0.03;

    n.vx *= damping;
    n.vy *= damping;

    n.x += n.vx;
    n.y += n.vy;
  }
}

function drawConstellation(ctx, canvas, nodes) {
  ctx.strokeStyle = 'rgba(180, 115, 30, 0.12)';
  ctx.lineWidth = 0.5;

  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var a = nodes[i], b = nodes[j];
      var dx = a.x - b.x, dy = a.y - b.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.globalAlpha = (1 - dist / 120) * 0.15;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (var k = 0; k < nodes.length; k++) {
    var n = nodes[k];
    ctx.globalAlpha = 0.3 + n.depth * 0.4;
    ctx.fillStyle = 'rgba(200, 140, 40, 0.7)';
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.size * n.depth, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}

// Geological Mesh
function initMesh(canvas) {
  var cols = 28, rows = 16;
  var vertices = [];
  var rng = seededRandom(999);

  for (var j = 0; j <= rows; j++) {
    for (var i = 0; i <= cols; i++) {
      var u = i / cols;
      var v = j / rows;
      vertices.push({ u: u + (rng() - 0.5) * 0.04, v: v + (rng() - 0.5) * 0.03 });
    }
  }

  return { cols: cols, rows: rows, vertices: vertices };
}

function projectPoint(u, v, width, height) {
  var horizonY = height * 0.52;
  var nearY = height * 1.08;
  var perspective = Math.pow(v, 1.55);
  var y = horizonY + perspective * (nearY - horizonY);
  var spread = width * (0.55 + v * 1.45);
  var x = width * 0.5 + (u - 0.5) * spread;
  return { x: x, y: y };
}

function getFeature(u, v) {
  var strata = 0;
  if (u < 0.4) {
    strata = (Math.sin(v * 14 + u * 4) + 1) * 0.5;
    strata *= (1 - u / 0.4);
  }

  var plateau = (u > 0.33 && u < 0.67 && v > 0.28 && v < 0.72) ? 1.0 : 0.0;

  var rdx = u - 0.72, rdy = v - 0.42;
  var rdist = Math.sqrt(rdx * rdx + rdy * rdy);
  var rings = 0;
  if (rdist < 0.25) {
    rings = (1 - rdist / 0.25);
    rings = rings * rings;
  }

  var bdx = u - 0.45, bdy = v - 0.80;
  var bdist = Math.sqrt(bdx * bdx + bdy * bdy);
  var arcs = bdist < 0.18 ? (1 - bdist / 0.18) : 0;

  var noise = Math.sin(u * 8.3 + v * 6.1) * Math.cos(u * 4.2 - v * 9.7) * 0.5 + 0.5;

  return Math.max(strata * 0.85, plateau * 0.95, rings * 0.9, arcs * 0.8, noise * 0.25);
}

function drawMesh(ctx, canvas, mesh, time) {
  var cols = mesh.cols, rows = mesh.rows;
  var w = canvas.width, h = canvas.height;

  var projected = [];
  for (var k = 0; k < mesh.vertices.length; k++) {
    var vert = mesh.vertices[k];
    projected.push(projectPoint(vert.u, vert.v, w, h));
  }

  for (var j = 0; j < rows; j++) {
    for (var i = 0; i < cols; i++) {
      var i00 = j * (cols + 1) + i;
      var i10 = j * (cols + 1) + i + 1;
      var i01 = (j + 1) * (cols + 1) + i;
      var i11 = (j + 1) * (cols + 1) + i + 1;

      var v00 = projected[i00], v10 = projected[i10];
      var v01 = projected[i01], v11 = projected[i11];

      var u = (i + 0.5) / cols;
      var v = (j + 0.5) / rows;
      var feature = getFeature(u, v);

      var depth = 0.28 + v * 0.72;
      var shimmer = 0.80 + 0.20 * Math.sin(time * 0.35 + u * 7.5 + v * 5.2);

      var alpha = 0.14 + feature * 0.68;
      alpha *= depth;
      alpha *= shimmer;
      alpha = Math.max(0.10, Math.min(0.94, alpha));

      var color;
      if (feature > 0.75) {
        color = 'rgba(224, 160, 48, ' + alpha + ')';
      } else if (feature > 0.50) {
        color = 'rgba(210, 146, 34, ' + (alpha * 0.92) + ')';
      } else if (feature > 0.25) {
        color = 'rgba(170, 109, 22, ' + (alpha * 0.85) + ')';
      } else {
        color = 'rgba(126, 78, 10, ' + (alpha * 0.65) + ')';
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6 + feature * 0.8;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(v00.x, v00.y);
      ctx.lineTo(v10.x, v10.y);
      ctx.lineTo(v01.x, v01.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v10.x, v10.y);
      ctx.lineTo(v11.x, v11.y);
      ctx.lineTo(v01.x, v01.y);
      ctx.stroke();
    }
  }
}
