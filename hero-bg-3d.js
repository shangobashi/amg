/**
 * Afriplan — Final Depth Pass
 * Source of truth: Screenshot 2026-05-02 224224.png
 * Changes: deeper star layers, spatial halos, receding mesh footprint,
 * integrated topological motifs, ocean-in-space undulation.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;

  function launchCanvasFallback(originalCanvas, reason) {
    if (window.__AFRIPLAN_HERO_FALLBACK_ACTIVE__) return;
    window.__AFRIPLAN_HERO_FALLBACK_ACTIVE__ = true;
    var hero = document.querySelector('.hero') || originalCanvas.parentElement || document.body;
    var c = document.createElement('canvas');
    c.id = 'heroBgCanvasFallback';
    c.setAttribute('aria-hidden', 'true');
    c.style.position = 'absolute';
    c.style.inset = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.zIndex = '1';
    c.style.pointerEvents = 'none';
    c.style.display = 'block';
    originalCanvas.style.display = 'none';
    hero.insertBefore(c, originalCanvas.nextSibling);
    var ctx = c.getContext('2d', { alpha: true });
    if (!ctx) return;
    var W = 1, H = 1, DPR = 1, CX = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var stars = [];
    var start = performance.now();
    var GOLD = '201,164,84', AMBER = '245,158,11', PALE = '255,229,168';
    function resizeFallback() {
      var r = hero.getBoundingClientRect();
      W = Math.max(320, Math.round(r.width || window.innerWidth));
      H = Math.max(520, Math.round(r.height || window.innerHeight * 0.92));
      DPR = Math.min(window.devicePixelRatio || 1, W < 768 ? 1 : 1.5);
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(DPR,0,0,DPR,0,0); CX = W * 0.5;
      stars = [];
      for (var i=0;i<(W<768?220:520);i++) stars.push({x:Math.random()*W,y:Math.random()*H*0.76,z:Math.random(),p:Math.random()*6.28});
    }
    function height(x,z,t){return Math.sin(x*.055+t*.42)*9+Math.sin(z*.075-t*.3)*7+Math.sin((x+z)*.035+t*.22)*12+22*Math.exp(-((x+70)*(x+70)+(z-18)*(z-18))/2700)+18*Math.exp(-((x-60)*(x-60)+(z+6)*(z+6))/2300);}
    function project(x,y,z){var s=390/Math.max(42,z+160);return {x:CX+x*s+mouse.x*14,y:H*.69-y*s*.72+(z-40)*1.55+mouse.y*7};}
    function poly(cx,cy,r,t,ring){
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*.18); ctx.strokeStyle='rgba('+GOLD+',.42)'; ctx.lineWidth=1;
      var n=12, pts=[]; for(var i=0;i<n;i++){var aa=i/n*6.283+t*.25; var rr=r*(.82+((i%3)*.09)); pts.push([Math.cos(aa)*rr,Math.sin(aa)*rr]);}
      ctx.beginPath(); for(var a=0;a<n;a++){for(var b=a+1;b<n;b++){if((a+b)%5===0||Math.abs(a-b)===1){ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);}}} ctx.stroke();
      if(ring){ctx.rotate(.65);ctx.scale(1.35,.42);ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.75,0,0,6.283);ctx.strokeStyle='rgba('+PALE+',.48)';ctx.stroke();ctx.setTransform(DPR,0,0,DPR,0,0);var ma=t*.55;ctx.fillStyle='rgba('+PALE+',.9)';ctx.beginPath();ctx.arc(cx+Math.cos(ma)*r*1.8,cy+Math.sin(ma)*r*.55,4.8,0,6.283);ctx.fill();}
      ctx.restore();
    }
    function draw(now){var t=(now-start)/1000; mouse.x+=(mouse.tx-mouse.x)*.045; mouse.y+=(mouse.ty-mouse.y)*.045; ctx.clearRect(0,0,W,H);
      var bg=ctx.createRadialGradient(CX,H*.42,0,CX,H*.42,Math.max(W,H)*.78); bg.addColorStop(0,'rgba(61,40,13,.92)'); bg.addColorStop(.28,'rgba(17,15,11,.98)'); bg.addColorStop(1,'rgba(0,0,0,1)'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation='screen'; for(var i=0;i<stars.length;i++){var s=stars[i], tw=.65+.35*Math.sin(t*.7+s.p);ctx.fillStyle='rgba('+ (s.z>.78?PALE:GOLD) +','+(.12+s.z*.38)*tw+')';ctx.beginPath();ctx.arc(s.x+mouse.x*(4+s.z*10),s.y+mouse.y*(2+s.z*7),.45+s.z*1.8,0,6.283);ctx.fill();}
      var pts=[], cols=W<768?42:82, rows=W<768?20:38; for(var j=0;j<rows;j++){for(var k=0;k<cols;k++){var x=(k/(cols-1)-.5)*230,z=(j/(rows-1))*150-18,y=height(x,z,t);pts.push(project(x,y,z));}}
      for(var jj=0;jj<rows;jj++){for(var ii=0;ii<cols;ii++){var id=jj*cols+ii,p=pts[id],boost=Math.max(0,(p.y-H*.45)/(H*.42));ctx.strokeStyle='rgba('+GOLD+','+Math.min(.48,.07+boost*.27)+')';ctx.lineWidth=.82;if(ii<cols-1){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+1].x,pts[id+1].y);ctx.stroke();}if(jj<rows-1){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+cols].x,pts[id+cols].y);ctx.stroke();}if(ii<cols-1&&jj<rows-1&&(ii+jj)%2===0){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[id+cols+1].x,pts[id+cols+1].y);ctx.stroke();}}}
      poly(W*.18,H*.25,42,t,true); poly(W*.82,H*.25,38,-t,true); poly(W*.62,H*.38,26,t*.8,false); poly(W*.34,H*.54,28,-t*.7,false);
      ctx.globalCompositeOperation='source-over'; var bot=ctx.createLinearGradient(0,H*.72,0,H);bot.addColorStop(0,'rgba(12,12,10,0)');bot.addColorStop(1,'rgba(12,12,10,.86)');ctx.fillStyle=bot;ctx.fillRect(0,H*.7,W,H*.3);
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resizeFallback, {passive:true}); window.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();mouse.tx=((e.clientX-r.left)/Math.max(1,r.width)-.5)*2;mouse.ty=((e.clientY-r.top)/Math.max(1,r.height)-.5)*2;},{passive:true});
    resizeFallback(); requestAnimationFrame(draw);
    window.__AFRIPLAN_HERO_WEBGL__ = { version:'webgl-fallback-canvas-active', renderer:'canvas2d-fallback', reason: reason, fullWidthMesh:true, polyhedrons:4, orbitRings:2 };
  }

  function boot() {
    if (!window.THREE) {
      setTimeout(boot, 30);
      return;
    }

    var THREE = window.THREE;
    var hero = document.querySelector('.hero') || canvas.parentElement || document.body;
    var isDestroyed = false;
    var clock = new THREE.Clock();
    var size = { w: 1, h: 1 };
    var isMobile = false;
    var mouse = new THREE.Vector2(0, 0);
    var dampedMouse = new THREE.Vector2(0, 0);

    function readSize() {
      var r = hero.getBoundingClientRect();
      size.w = Math.max(320, Math.round(r.width || window.innerWidth));
      size.h = Math.max(520, Math.round(r.height || window.innerHeight * 0.92));
      isMobile = size.w < 768;
    }

    readSize();

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch (err) {
      launchCanvasFallback(canvas, 'webgl-constructor-failed');
      return;
    }
    renderer.setClearColor(0x020202, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));
    renderer.setSize(size.w, size.h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;
    // Force the canvas element CSS background to near-black so the body white
    // does not bleed through when WebGL paints an opaque framebuffer.
    canvas.style.backgroundColor = 'rgb(2,2,2)';
    var glContext = renderer.getContext();
    if (!glContext || glContext.isContextLost()) {
      launchCanvasFallback(canvas, 'webgl-context-lost-at-init');
      return;
    }

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020202, 0.0072);

    var camera = new THREE.PerspectiveCamera(46, size.w / size.h, 0.1, 900);
    camera.position.set(0, 26, 118);
    camera.lookAt(0, 2, -44);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 0: Spatial depth backdrop — very subtle dark halos for z-feel.
    // NOT a bright wash. Near-black with faint spatial presence halos.
    // ────────────────────────────────────────────────────────────────────────
    var backdropUniforms = {
      uTime: { value: 0 },
      uAspect: { value: size.w / size.h },
      uMouse: { value: new THREE.Vector2() }
    };
    var backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: backdropUniforms,
        vertexShader: [
          'varying vec2 vUv;',
          'void main(){',
          '  vUv = uv;',
          '  gl_Position = vec4(position.xy, 0.0, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'precision mediump float;',
          'varying vec2 vUv;',
          'uniform float uTime;',
          'uniform float uAspect;',
          'uniform vec2 uMouse;',
          'void main(){',
          '  vec2 uv = vUv;',
          '  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);',
          '  vec2 cursor = vec2(uMouse.x * 0.04, uMouse.y * 0.018);',
          '  float d = length(p - cursor);',
          '  float d2 = length(p - vec2(0.08, 0.04));',
          '  float d3 = length(p - vec2(-0.12, -0.06));',
          '  // Deep spatial halos — very faint amber presence in space',
          '  float halo1 = smoothstep(0.55, 0.05, d) * 0.038;',
          '  float halo2 = smoothstep(0.70, 0.10, d2) * 0.022;',
          '  float halo3 = smoothstep(0.45, 0.05, d3) * 0.028;',
          '  // Upper-center depth swell (horizon feel)',
          '  float horizon = smoothstep(0.60, 0.10, abs(p.y + 0.15)) * 0.018;',
          '  vec3 black = vec3(0.006, 0.006, 0.005);',
          '  vec3 amber = vec3(0.52, 0.32, 0.08);',
          '  vec3 col = black;',
          '  col += amber * (halo1 + halo2 + halo3 + horizon);',
          '  // Gentle vignette toward edges for spatial depth',
          '  col *= 1.0 - smoothstep(0.30, 0.90, d) * 0.50;',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      })
    );
    backdrop.renderOrder = -100;
    // Re-engage: values tuned low enough to not wash out text.
    scene.add(backdrop);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 1: Deep layered starfield — more numerous, z-stratified.
    // Palette: deep amber #784C0E → warm amber #925C12 → gold #AA6D16 → bright #C4811F → orange-gold #D6912C
    // Ratios: 74% deep far, 18% mid warm, 6% brighter near, 2% accent highlights.
    // ────────────────────────────────────────────────────────────────────────
    var STAR_BANDS = [
      // [count, minDepth, maxDepth, rMin, rMax, gMin, gMax, bMax, sizeMult, alphaMult]
      // Deep far layer — tiny, dim, many
      { count: isMobile ? 640 : 1628, minD: 0.00, maxD: 0.40, r: [0.26, 0.36], g: [0.14, 0.22], b: [0.02, 0.07], sz: [0.30, 0.70], al: [0.18, 0.36] },
      // Mid-far warm layer
      { count: isMobile ? 200 : 410,  minD: 0.30, maxD: 0.65, r: [0.38, 0.52], g: [0.20, 0.30], b: [0.04, 0.09], sz: [0.50, 1.10], al: [0.28, 0.48] },
      // Mid-near warmer layer
      { count: isMobile ?  80: 155,  minD: 0.55, maxD: 0.82, r: [0.52, 0.66], g: [0.28, 0.38], b: [0.06, 0.12], sz: [0.85, 1.60], al: [0.38, 0.62] },
      // Near highlights — sparse, gold-amber
      { count: isMobile ?  28:  75,  minD: 0.72, maxD: 1.00, r: [0.66, 0.78], g: [0.38, 0.50], b: [0.08, 0.16], sz: [1.20, 2.20], al: [0.52, 0.78] },
      // Accent sparks — very sparse, orange-gold
      { count: isMobile ?  12:  32,  minD: 0.85, maxD: 1.00, r: [0.76, 0.88], g: [0.48, 0.60], b: [0.10, 0.20], sz: [1.60, 2.80], al: [0.65, 0.90] }
    ];

    var totalStars = STAR_BANDS.reduce(function(s, b){ return s + b.count; }, 0);
    var starPos = new Float32Array(totalStars * 3);
    var starCol = new Float32Array(totalStars * 3);
    var starSz  = new Float32Array(totalStars);

    var si = 0;
    for (var bi = 0; bi < STAR_BANDS.length; bi++) {
      var band = STAR_BANDS[bi];
      for (var i = 0; i < band.count; i++) {
        var depth = band.minD + Math.random() * (band.maxD - band.minD);
        var i3 = si * 3;
        starPos[i3]     = (Math.random() - 0.5) * 290;
        starPos[i3 + 1] = -4 + Math.random() * 96;
        starPos[i3 + 2] = -190 + depth * 175;
        var r = band.r[0] + Math.random() * (band.r[1] - band.r[0]);
        var g = band.g[0] + Math.random() * (band.g[1] - band.g[0]);
        var b = band.b[0] + Math.random() * (band.b[1] - band.b[0]);
        starCol[i3]     = r;
        starCol[i3 + 1] = g;
        starCol[i3 + 2] = b;
        starSz[si] = band.sz[0] + Math.random() * (band.sz[1] - band.sz[0]);
        si++;
      }
    }

    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('aSize',    new THREE.BufferAttribute(starSz,  1));

    var starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: new THREE.Vector2() }
      },
      vertexShader: [
        'attribute float aSize;',
        'varying vec3 vColor;',
        'varying float vPulse;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'void main(){',
        '  vec3 p = position;',
        '  vec2 cursor = vec2(uMouse.x * 118.0, 22.0 + uMouse.y * 44.0);',
        '  vec2 delta = cursor - p.xy;',
        '  float dist = length(delta);',
        '  float attract = smoothstep(96.0, 0.0, dist);',
        '  vec2 radial = delta / max(dist, 0.001);',
        '  vec2 tangent = vec2(-radial.y, radial.x);',
        '  // Subtle elegant aggregation — elegant, not chaotic',
        '  p.xy += radial * attract * (5.0 + aSize * 1.4);',
        '  p.xy += tangent * attract * (1.2 + aSize * 0.32) * sin(uTime * 0.7 + dist * 0.04);',
        '  p.z += attract * (3.5 + aSize * 1.0);',
        '  // Slow depth drift for far layers',
        '  p.x += sin(uTime * 0.08 + position.z * 0.025) * 0.28;',
        '  p.y += cos(uTime * 0.07 + position.x * 0.018) * 0.18;',
        '  vPulse = attract;',
        '  vColor = mix(color, vec3(0.70, 0.44, 0.10), attract * 0.42);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * (210.0 / max(38.0, -mv.z)) * (1.0 + attract * 0.55);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying vec3 vColor;',
        'varying float vPulse;',
        'void main(){',
        '  vec2 d = gl_PointCoord - vec2(0.5);',
        '  float a = 1.0 - smoothstep(0.05, 0.48, length(d));',
        '  a *= (0.30 + vPulse * 0.32);',
        '  gl_FragColor = vec4(vColor, a);',
        '}'
      ].join('\n')
    });
    var stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -20;
    scene.add(stars);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 2: Topographic mesh — redesigned footprint for receding depth.
    // Key changes:
    //   - Edge falloff stronger: mesh tapers at lateral edges
    //   - Horizon fade stronger: mesh appears to recede from near viewer
    //   - Lateral asymmetry: left/right fade differently for authored feel
    //   - Position: near edge lower, far edge higher (perspective depth)
    //   - 3 slow ocean-in-space displacement layers
    //   - Stronger topological bumps (integrated motifs)
    // ────────────────────────────────────────────────────────────────────────
    var terrainUniforms = {
      uTime:  { value: 0 },
      uMouse: { value: new THREE.Vector2() }
    };

    var terrainGeo = new THREE.PlaneGeometry(
      isMobile ? 330 : 430,
      isMobile ? 160 : 210,
      isMobile ? 74  : 132,
      isMobile ? 36  : 58
    );

    var terrainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: true,
      blending: THREE.NormalBlending,
      uniforms: terrainUniforms,
      vertexShader: [
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'varying float vIntensity;',
        'varying vec2 vUv;',
        'varying float vFeature;',   // track feature zones for fragment coloring
        'float bump(vec2 p, vec2 c, float power, float radius){',
        '  float d = distance(p, c);',
        '  return power * exp(-(d*d) / radius);',
        '}',
        'void main(){',
        '  vUv = uv;',
        '  vec3 p = position;',
        '  float t = uTime;',

        // ── Layer 1: very slow deep swell (ocean base)
        '  float swell1 = sin(p.x * 0.022 + t * 0.14) * sin(p.y * 0.028 - t * 0.11) * 4.2;',
        // ── Layer 2: mid-frequency contour drift
        '  float swell2 = sin((p.x * 0.038 + p.y * 0.030) + t * 0.28) * 2.8;',
        // ── Layer 3: very low frequency horizon breathing
        '  float swell3 = sin(p.x * 0.014 - t * 0.08) * cos(p.y * 0.018 + t * 0.06) * 3.5;',

        '  float baseH = 0.0;',
        '  baseH += sin(p.x * 0.035) * 5.5;',
        '  baseH += sin(p.y * 0.055) * 4.0;',
        '  baseH += sin((p.x + p.y) * 0.026) * 8.0;',

        // ── Stronger topological motifs (integrated into terrain) ──
        // Left serpentine strata — strong left-side rise
        '  float leftStrata = bump(p.xy, vec2(-78.0, 18.0), 22.0, 2800.0);',
        // Central angular plateau — rises near center
        '  float plateau   = bump(p.xy, vec2(  8.0, -4.0), 18.0, 2400.0);',
        // Lower-center basin depression
        '  float basin     = bump(p.xy, vec2(  4.0, 58.0), 16.0, 3600.0);',
        // Right concentric ring field — ring emphasis
        '  float ringField = bump(p.xy, vec2( 62.0, -14.0), 14.0, 2200.0);',
        // Lower-right survey fan
        '  float fanField  = bump(p.xy, vec2( 72.0, 38.0), 12.0, 2000.0);',

        '  baseH += leftStrata * 1.0;',
        '  baseH += plateau   * 1.0;',
        '  baseH -= basin    * 0.8;',
        '  baseH += ringField * 0.7;',
        '  baseH += fanField  * 0.6;',

        // Track feature zone for fragment shader color
        '  vFeature = max(leftStrata, max(plateau, max(ringField, fanField)));',

        '  float breath = 0.92 + 0.08 * sin(t * 0.55 + uv.y * 2.4);',
        '  float ripple = sin((p.x * 0.020 + p.y * 0.016) - t * 0.42) * 0.85 * smoothstep(0.08, 1.0, uv.y);',
        '  vec2 cursor = vec2(uMouse.x * 95.0, uMouse.y * 32.0 - 8.0);',
        '  vec2 delta = p.xy - cursor;',
        '  float dist = length(delta);',
        '  float cursorLift = smoothstep(72.0, 0.0, dist);',
        '  float h = baseH * breath + ripple + cursorLift * 4.2;',
        '  h += swell1 + swell2 + swell3;',
        '  float contour = abs(sin(h * 0.44 + t * 0.10));',
        '  vIntensity = 0.24 + smoothstep(0.48, 1.0, contour) * 0.50 + smoothstep(0.15, 0.82, uv.y) * 0.18 + cursorLift * 0.14;',
        '  p.z += h;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'varying float vIntensity;',
        'varying vec2 vUv;',
        'varying float vFeature;',
        'void main(){',
        // Stronger edge falloff — mesh visually dissolves before full-width edges
        '  float leftEdge   = smoothstep(0.00, 0.12, vUv.x);',
        '  float rightEdge  = smoothstep(1.00, 0.88, vUv.x);',
        '  float edgeFade   = leftEdge * rightEdge;',
        // Horizon fade — mesh recedes away from viewer (near bottom = denser)
        '  float horizonFade = smoothstep(0.02, 0.22, vUv.y);',
        // Lateral asymmetry — left fades slightly differently than right
        '  float asymFade = 0.70 + 0.30 * (1.0 - abs(vUv.x - 0.50) * 2.0);',

        '  vec3 deepAmber  = vec3(0.36, 0.22, 0.04);',
        '  vec3 gold       = vec3(0.52, 0.32, 0.08);',
        '  vec3 brightGold = vec3(0.68, 0.44, 0.10);',
        '  vec3 col = mix(deepAmber, gold, vIntensity);',
        '  col = mix(col, brightGold, smoothstep(0.55, 1.0, vIntensity) * 0.45);',
        // Feature zones get subtle warm tint
        '  col = mix(col, vec3(0.72, 0.48, 0.12), smoothstep(0.40, 0.90, vFeature) * 0.25);',

        '  float baseAlpha = 0.09 + vIntensity * 0.36;',
        '  float alpha = baseAlpha * edgeFade * horizonFade * asymFade * 0.62;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });

    var terrain = new THREE.Mesh(terrainGeo, terrainMat);
    // Rotation and position create receding-field perspective:
    // Near edge of plane appears lower/closer, far edge appears to recede.
    terrain.rotation.x = -Math.PI / 2.42;
    terrain.position.set(0, -118, -74);
    terrain.scale.set(1.22, 1.08, 1.0);
    terrain.renderOrder = 1;
    scene.add(terrain);

    // Mineral-map sparkle point lattice
    var lattice = new THREE.Points(
      terrainGeo.clone(),
      new THREE.PointsMaterial({
        color: 0x925c12,
        size: isMobile ? 0.34 : 0.46,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.NormalBlending
      })
    );
    lattice.rotation.copy(terrain.rotation);
    lattice.position.copy(terrain.position);
    lattice.scale.copy(terrain.scale);
    lattice.renderOrder = 2;
    scene.add(lattice);

    // ────────────────────────────────────────────────────────────────────────
    // Layer 3: floating wireframe polyhedrons with planet-like rings/moons.
    // ────────────────────────────────────────────────────────────────────────
    var crystalMat = new THREE.MeshBasicMaterial({
      color: 0x784c0e,
      wireframe: true,
      transparent: true,
      opacity: 0.21,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x925c12,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    var moonMat = new THREE.MeshBasicMaterial({
      color: 0xAA6D16,
      transparent: true,
      opacity: 0.57,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    function addCrystal(def) {
      var group = new THREE.Group();
      group.position.set(def.x, def.y, def.z);
      group.userData = {
        baseY: def.y,
        speed: def.speed,
        phase: def.phase,
        moonPhase: def.moonPhase || 0,
        hasRing: !!def.ring
      };

      var geo = def.kind === 'oct'
        ? new THREE.OctahedronGeometry(def.r, 0)
        : new THREE.IcosahedronGeometry(def.r, 0);
      var body = new THREE.Mesh(geo, crystalMat.clone());
      body.material.opacity = def.opacity || 0.32;
      body.renderOrder = 5;
      group.add(body);
      group.userData.body = body;

      if (def.ring) {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(def.r * 1.62, Math.max(0.055, def.r * 0.018), 6, 128),
          ringMat.clone()
        );
        ring.rotation.x = def.ringX;
        ring.rotation.y = def.ringY;
        ring.rotation.z = def.ringZ;
        ring.material.opacity = def.ringOpacity || 0.38;
        ring.renderOrder = 4;
        group.add(ring);
        group.userData.ring = ring;

        var moon = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.85, def.r * 0.135), 18, 18), moonMat.clone());
        moon.renderOrder = 6;
        group.add(moon);
        group.userData.moon = moon;
        group.userData.moonRadius = def.r * 1.58;
      }

      scene.add(group);
      return group;
    }

    var crystals = [
      addCrystal({ kind: 'ico', x: -82, y: 38, z: -74, r: 10.5, speed: 0.20, phase: 0.2, ring: true,  ringX: 1.18, ringY: 0.25, ringZ: 0.74, ringOpacity: 0.62, moonPhase: 0.3, opacity: 0.38 }),
      addCrystal({ kind: 'ico', x:  83, y: 41, z: -82, r:  9.5, speed:-0.17, phase: 1.8, ring: true,  ringX: 1.34, ringY:-0.20, ringZ:-0.55, ringOpacity: 0.60, moonPhase: 2.5, opacity: 0.36 }),
      addCrystal({ kind: 'ico', x:  34, y: 19, z: -55, r:  5.8, speed: 0.24, phase: 3.1, ring: false, opacity: 0.28 }),
      addCrystal({ kind: 'oct', x: -28, y: -6, z: -44, r:  6.8, speed:-0.15, phase: 4.0, ring: false, opacity: 0.22 })
    ];

    // ────────────────────────────────────────────────────────────────────────
    // Layer 4: restrained attractor nodes embedded near the terrain.
    // ────────────────────────────────────────────────────────────────────────
    function addAttractor(x, y, z, radius, ringR, phase) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      g.userData = { baseY: y, phase: phase };
      var core = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xC4811F, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.NormalBlending })
      );
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 2.6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x784c0e, transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.NormalBlending })
      );
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.055, 5, 80),
        new THREE.MeshBasicMaterial({ color: 0x925c12, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending })
      );
      ring.rotation.x = Math.PI / 2.9;
      ring.rotation.y = phase * 0.12;
      g.add(halo); g.add(core); g.add(ring);
      g.userData.core = core;
      g.userData.halo = halo;
      g.userData.ring = ring;
      scene.add(g);
      return g;
    }
    var attractors = [
      addAttractor(-42, -8, -54, 1.4, 5.9, 0.0),
      addAttractor( 38,-16, -68, 1.1, 5.0, 2.0),
      addAttractor(  8, 18, -60, 1.8, 7.0, 4.2)
    ];

    // ────────────────────────────────────────────────────────────────────────
    // Resize / input / animation.
    // ────────────────────────────────────────────────────────────────────────
    function resize() {
      readSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));
      renderer.setSize(size.w, size.h, false);
      backdropUniforms.uAspect.value = size.w / size.h;
      // Terrain scale: slightly narrower, more aspect-correct for receding field
      var aspectBoost = Math.max(1.0, (size.w / Math.max(1, size.h)) / 1.78);
      terrain.scale.x = 1.22 * aspectBoost;
      lattice.scale.copy(terrain.scale);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('beforeunload', function () { isDestroyed = true; });
    resize();

    function animate() {
      if (isDestroyed) return;
      var t = clock.getElapsedTime();
      dampedMouse.x += (mouse.x - dampedMouse.x) * 0.045;
      dampedMouse.y += (mouse.y - dampedMouse.y) * 0.045;

      backdropUniforms.uTime.value = t;
      backdropUniforms.uMouse.value.copy(dampedMouse);
      terrainUniforms.uTime.value = t;
      terrainUniforms.uMouse.value.copy(dampedMouse);
      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uMouse.value.copy(dampedMouse);

      // Very gentle terrain drift — no obvious wobble
      terrain.rotation.z = Math.sin(t * 0.055) * 0.004;
      lattice.rotation.copy(terrain.rotation);

      stars.rotation.y = Math.sin(t * 0.025) * 0.004;
      stars.rotation.x = 0.0;

      for (var i = 0; i < crystals.length; i++) {
        var c = crystals[i];
        var ud = c.userData;
        c.position.y = ud.baseY + Math.sin(t * 0.32 + ud.phase) * 1.6;
        c.rotation.x += ud.speed * 0.006;
        c.rotation.y += ud.speed * 0.009;
        c.rotation.z += ud.speed * 0.004;
        if (ud.ring) {
          ud.ring.rotation.z += ud.speed * 0.010;
          var a = t * (0.34 + Math.abs(ud.speed)) + ud.moonPhase;
          var rr = ud.moonRadius;
          ud.moon.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.36, Math.sin(a) * rr * 0.18);
        }
      }

      for (var j = 0; j < attractors.length; j++) {
        var aNode = attractors[j];
        var au = aNode.userData;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.85 + au.phase);
        aNode.position.y = au.baseY + Math.sin(t * 0.38 + au.phase) * 1.15;
        au.core.material.opacity = 0.44 + pulse * 0.18;
        au.halo.material.opacity = 0.055 + pulse * 0.045;
        au.ring.material.opacity = 0.16 + pulse * 0.10;
        au.ring.rotation.z += 0.0035 + j * 0.0008;
      }

      camera.position.x = 0;
      camera.position.y = 26;
      camera.lookAt(0, 2, -44);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__AFRIPLAN_HERO_WEBGL__ = {
      version: 'true-golden-depth-pass-02',
      renderer: 'three-webgl',
      terrainWidth: isMobile ? 330 : 430,
      terrainSegments: isMobile ? '74x36' : '132x58',
      fullWidthMesh: false,
      recedingMesh: true,
      polyhedrons: crystals.length,
      orbitRings: 2,
      starCount: totalStars
    };
  }

  boot();
})();