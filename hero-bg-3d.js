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
      drawMotifOverlays(mctx, meshCanvas.width, meshCanvas.height, t);

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



// Stars — 1700-2200 desktop, 700-900 mobile

var STAR_PALETTE = [

  'rgba(120, 76, 14, 0.32)',

  'rgba(146, 92, 18, 0.44)',

  'rgba(170, 109, 22, 0.58)',

  'rgba(196, 129, 31, 0.70)',

  'rgba(224, 160, 48, 0.86)'

];



function initStars(canvas) {

  var isMobile = window.innerWidth < 768;

  var count = isMobile ? 900 : 2300;

  var rng = seededRandom(777);

  var stars = [];

  

  for (var i = 0; i < count; i++) {

    var r = rng();

    var colorIdx = r < 0.45 ? 0 : r < 0.73 ? 1 : r < 0.90 ? 2 : r < 0.98 ? 3 : 4;

    var sizeBase = colorIdx < 2 ? 0.35 : colorIdx < 3 ? 0.7 : colorIdx < 4 ? 1.3 : 1.6;

    var size = sizeBase + rng() * (colorIdx < 2 ? 0.25 : 0.35);

    

    var depth = 0.3 + rng() * 0.7;

    

    stars.push({

      x: rng() * canvas.width,

      y: rng() * canvas.height *0.70,
      baseY: 0, // overwritten below
      _powY: Math.pow(rng(), 1.35) * canvas.height * 0.70,

      baseX: 0, baseY: 0,

      size: size,

      colorIdx: colorIdx,

      depth: depth,

      phase: rng() * Math.PI * 2,

      speed: 0.3 + rng() * 0.7,

      baseAlpha: parseFloat(STAR_PALETTE[colorIdx].match(/[\d.]+\)$/)[0])

    });

  }

  

  // Set baseX/baseY after canvas size known

  for (var j = 0; j < stars.length; j++) {

    stars[j].baseX = stars[j].x;

    stars[j].baseY = stars[j].y;

  }

  

  return stars;

}



function drawStars(ctx, canvas, stars, time) {

  for (var i = 0; i < stars.length; i++) {

    var s = stars[i];

    

    // Slow parallax drift

    var driftX = Math.sin(time * 0.025 + s.phase) * s.depth * 2.0;

    var driftY = Math.cos(time * 0.018 + s.phase) * s.depth * 1.2;

    var sx = s.baseX + driftX;

    var sy = s.baseY + driftY;

    

    var twinkle = 0.72 + 0.28 * Math.sin(time * s.speed + s.phase);

    ctx.globalAlpha = twinkle;

    ctx.fillStyle = STAR_PALETTE[s.colorIdx];

    ctx.beginPath();

    ctx.arc(sx, sy, s.size, 0, Math.PI * 2);

    ctx.fill();

  }

  ctx.globalAlpha = 1.0;

}



// Constellation

function initConstellation(canvas) {

  var isMobile = window.innerWidth < 768;

  var count = isMobile ? 80 : 165;

  var rng = seededRandom(555);

  var nodes = [];

  

  for (var i = 0; i < count; i++) {

    nodes.push({

      baseX: rng() * canvas.width,

      baseY: rng() * canvas.height * 0.65,

      x: 0, y: 0,

      vx: 0, vy: 0,

      size: 0.5 + rng() * 1.0,

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

  ctx.strokeStyle = 'rgba(180, 115, 30, 0.10)';

  ctx.lineWidth = 0.4;

  

  for (var i = 0; i < nodes.length; i++) {

    for (var j = i + 1; j < nodes.length; j++) {

      var a = nodes[i], b = nodes[j];

      var dx = a.x - b.x, dy = a.y - b.y;

      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {

        ctx.globalAlpha = (1 - dist / 100) * 0.10;

        ctx.beginPath();

        ctx.moveTo(a.x, a.y);

        ctx.lineTo(b.x, b.y);

        ctx.stroke();

      }

    }

  }

  

  for (var k = 0; k < nodes.length; k++) {

    var n = nodes[k];

    ctx.globalAlpha = 0.18 + n.depth * 0.30;

    ctx.fillStyle = 'rgba(200, 140, 40, 0.55)';

    ctx.beginPath();

    ctx.arc(n.x, n.y, n.size * n.depth, 0, Math.PI * 2);

    ctx.fill();

  }

  

  ctx.globalAlpha = 1.0;

}



// Geological Mesh — DENSE grid with 5 feature masks

function initMesh(canvas) {

  var isMobile = window.innerWidth < 768;

  var cols = isMobile ? 42 : 76;

  var rows = isMobile ? 26 : 42;

  var vertices = [];

  var rng = seededRandom(999);

  

  for (var j = 0; j <= rows; j++) {

    for (var i = 0; i <= cols; i++) {

      var u = i / cols;

      var v = j / rows;

      vertices.push({ 

        u: u + (rng() - 0.5) * 0.03, 

        v: v + (rng() - 0.5) * 0.025 

      });

    }

  }

  

  return { cols: cols, rows: rows, vertices: vertices };

}



function projectPoint(u, v, width, height) {

  var horizonY = height * 0.50;

  var nearY = height * 1.10;

  var perspective = Math.pow(v, 1.42);

  var y = horizonY + perspective * (nearY - horizonY);

  var spread = width * (0.48 + v * 1.72);

  var x = width * 0.5 + (u - 0.5) * spread;

  return { x: x, y: y };

}



function smoothstep(edge0, edge1, x) {

  var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));

  return t * t * (3 - 2 * t);

}



function leftStrata(u, v) {

  var leftMask = smoothstep(0.46, 0.22, u) * smoothstep(0.25, 0.48, v);

  var wave = Math.sin(v * 22.0 + u * 8.0 + Math.sin(v * 5.0) * 2.2);

  var band = 1.0 - smoothstep(0.08, 0.22, Math.abs(wave));

  return leftMask * band;

}



function centralPlateau(u, v) {

  var cx = 0.50;

  var cy = 0.55;

  var dx = Math.abs(u - cx);

  var dy = Math.abs(v - cy);

  var diamond = 1.0 - smoothstep(0.16, 0.34, dx + dy * 0.75);

  var box = smoothstep(0.30, 0.38, u) * smoothstep(0.72, 0.62, u) *

            smoothstep(0.32, 0.42, v) * smoothstep(0.82, 0.70, v);

  return Math.max(diamond, box * 0.85);

}



function lowerBasin(u, v) {

  var dx = (u - 0.48) / 0.35;

  var dy = (v - 0.88) / 0.22;

  var d = Math.sqrt(dx * dx + dy * dy);

  var ring = 1.0 - smoothstep(0.025, 0.075, Math.abs(Math.sin(d * 18.0)));

  var mask = smoothstep(0.55, 0.72, v);

  return ring * mask * smoothstep(1.65, 0.35, d);

}



function rightRings(u, v) {

  var dx = (u - 0.74) / 0.25;

  var dy = (v - 0.58) / 0.18;

  var d = Math.sqrt(dx * dx + dy * dy);

  var rings = 1.0 - smoothstep(0.025, 0.065, Math.abs(Math.sin(d * 24.0)));

  var mask = smoothstep(1.25, 0.20, d);

  return rings * mask;

}



function lowerRightFan(u, v) {

  var diag = Math.abs((v - 0.72) - (u - 0.62) * 0.55);

  var band = 1.0 - smoothstep(0.025, 0.09, diag);

  var mask = smoothstep(0.58, 0.75, u) * smoothstep(0.58, 0.82, v);

  return band * mask;

}



function getFeature(u, v) {

  return Math.max(

    leftStrata(u, v),

    centralPlateau(u, v),

    lowerBasin(u, v),

    rightRings(u, v),

    lowerRightFan(u, v)

  );

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

      

      var depth = smoothstep(0.16, 1.0, v);

      var horizonFade = smoothstep(0.22, 0.52, v);

      var shimmer = 0.86 + 0.14 * Math.sin(time * 0.7 + u * 8.0 + v * 5.0);

      

      var alpha = 0.16 + depth * 0.22 + feature * 0.58;

      alpha *= horizonFade;

      alpha *= shimmer;

      alpha = Math.max(0.16, Math.min(alpha, 0.95));

      


      if (feature > 0.72) {
        color = 'rgba(224, 160, 48, ' + Math.min(0.95, alpha) + ')';
      } else if (feature > 0.55) {
        color = 'rgba(224, 160, 48, ' + Math.min(0.92, alpha) + ')';
      } else if (feature > 0.25) {
        color = 'rgba(196, 129, 31, ' + Math.min(0.78, alpha) + ')';
      } else {
        color = 'rgba(146, 92, 18, ' + Math.min(0.46, alpha) + ')';
      }

      


      ctx.strokeStyle = color;

      ctx.lineWidth = 0.45 + depth * 0.55 + feature * 1.05;

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



// ── MOTIF OVERLAY HELPERS ──────────────────────────────────────────────────
function strokeGold(ctx, alpha, width) {
  ctx.strokeStyle = 'rgba(224,160,48,' + alpha + ')';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function strokeDimGold(ctx, alpha, width) {
  ctx.strokeStyle = 'rgba(146,92,18,' + alpha + ')';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawLeftStrata(ctx, w, h, time) {
  for (var band = 0; band < 6; band++) {
    var startX = w * 0.03;
    var startY = h * (0.72 + band * 0.032);
    var cp1X = w * 0.12;
    var cp1Y = h * (0.62 + band * 0.018 + Math.sin(time * 0.12 + band) * 0.004);
    var cp2X = w * 0.28;
    var cp2Y = h * (0.68 + band * 0.020);
    var endX = w * 0.39;
    var endY = h * (0.58 + band * 0.030);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    strokeGold(ctx, 0.42 + band * 0.045, 1.05 + band * 0.12);
    ctx.stroke();

    if (band < 5) {
      for (var k = 0; k < 5; k++) {
        var tt = (k + 1) / 6;
        var x1 = startX + (endX - startX) * tt;
        var y1 = startY + (endY - startY) * tt + Math.sin(tt * Math.PI * 2 + band) * h * 0.018;
        var x2 = x1 + w * 0.035;
        var y2 = y1 + h * 0.028;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        strokeDimGold(ctx, 0.26, 0.75);
        ctx.stroke();
      }
    }
  }
}


function drawRightRings(ctx, w, h, time) {
  var cx = w * 0.72;
  var cy = h * 0.70;
  for (var r = 0; r < 7; r++) {
    var radius = 55 + r * 36;
    var rx = radius;
    var ry = radius * 0.58;
    ctx.beginPath();
    for (var i = 0; i <= 240; i++) {
      var a = (i / 240) * Math.PI * 2;
      var wobble = 1 + 0.025 * Math.sin(a * 6 + r * 0.9 + time * 0.04);
      var x = cx + Math.cos(a) * rx * wobble;
      var y = cy + Math.sin(a) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    strokeGold(ctx, Math.max(0.36, 0.72 - r * 0.055), 1.45 - r * 0.07);
    ctx.stroke();
  }
}


function drawLowerBasin(ctx, w, h, time) {
  var cx = w * 0.46;
  var cy = h * 0.86;
  var start = Math.PI * (200 / 180);
  var end = Math.PI * (345 / 180);
  for (var r = 0; r < 7; r++) {
    var rx = 90 + r * 40;
    var ry = 46 + r * 24;
    ctx.beginPath();
    for (var i = 0; i <= 190; i++) {
      var a = start + (i / 190) * (end - start);
      var wobble = 1 + 0.025 * Math.sin(a * 5.5 + r + time * 0.035);
      var x = cx + Math.cos(a) * rx * wobble;
      var y = cy + Math.sin(a) * ry * wobble;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    strokeGold(ctx, Math.max(0.30, 0.65 - r * 0.052), 1.40 - r * 0.07);
    ctx.stroke();
  }
}


function drawCentralPlateau(ctx, w, h, time) {
  var shapes = [
    [[0.38,0.60],[0.48,0.56],[0.61,0.58],[0.66,0.66],[0.61,0.73],[0.48,0.74],[0.39,0.69]],
    [[0.43,0.63],[0.51,0.59],[0.59,0.62],[0.62,0.68],[0.55,0.71],[0.45,0.68]]
  ];
  for (var idx = 0; idx < shapes.length; idx++) {
    var poly = shapes[idx];
    ctx.beginPath();
    for (var i = 0; i < poly.length; i++) {
      var x = poly[i][0] * w;
      var y = poly[i][1] * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    strokeGold(ctx, idx === 0 ? 0.72 : 0.50, idx === 0 ? 1.55 : 1.10);
    ctx.stroke();
  }
  var diagonals = [
    [[0.38,0.60],[0.61,0.73]],
    [[0.48,0.56],[0.62,0.68]],
    [[0.61,0.58],[0.39,0.69]],
    [[0.43,0.63],[0.59,0.62]],
    [[0.51,0.59],[0.55,0.71]]
  ];
  for (var d = 0; d < diagonals.length; d++) {
    var aa = diagonals[d][0];
    var bb = diagonals[d][1];
    ctx.beginPath();
    ctx.moveTo(aa[0] * w, aa[1] * h);
    ctx.lineTo(bb[0] * w, bb[1] * h);
    strokeDimGold(ctx, 0.42, 0.95);
    ctx.stroke();
  }
}


function drawLowerRightFan(ctx, w, h, time) {
  var originX = w * 0.68;
  var originY = h * 0.77;
  for (var i = 0; i < 14; i++) {
    var tt = i / 13;
    var x2 = w * (0.78 + tt * 0.20);
    var y2 = h * (0.80 + tt * 0.14);
    ctx.beginPath();
    ctx.moveTo(originX, originY + i * h * 0.012);
    ctx.lineTo(x2, y2);
    strokeGold(ctx, 0.30 + tt * 0.38, 0.80 + tt * 0.60);
    ctx.stroke();
  }
}


function drawMotifOverlays(ctx, w, h, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawLeftStrata(ctx, w, h, time);
  drawLowerBasin(ctx, w, h, time);
  drawCentralPlateau(ctx, w, h, time);
  drawRightRings(ctx, w, h, time);
  drawLowerRightFan(ctx, w, h, time);
  ctx.restore();
}
