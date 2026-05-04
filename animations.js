/**
 * animations.js — Afriplan Scroll Animations & Micro-interactions
 * Awwwards-grade entrance choreography + hover micro-interactions
 * No dependencies — pure Intersection Observer + CSS
 */

(function () {
  'use strict';

  // ── Entrance Animation Classes ─────────────────────────────────────────────
  // Elements start invisible; we add these classes on scroll entry
  const REVEAL_CLASSES = [
    'reveal-fade-up',     // translateY(32px) → 0, opacity 0 → 1
    'reveal-fade-left',   // translateX(-24px) → 0, opacity 0 → 1
    'reveal-fade-right',  // translateX(24px) → 0, opacity 0 → 1
    'reveal-scale-in',    // scale(0.94) → 1, opacity 0 → 1
    'reveal-stagger',     // parent: stagger children 80ms apart
  ];

  // ── Scroll Observer ────────────────────────────────────────────────────────
  function initScrollReveal() {
    const els = document.querySelectorAll(
      '.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-scale-in, .reveal-stagger'
    );
    if (!els.length) return;

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;

            // Stagger: animate children with 80ms delays
            if (el.classList.contains('reveal-stagger')) {
              var children = el.children;
              for (var i = 0; i < children.length; i++) {
                (function (child, idx) {
                  child.style.transitionDelay = (idx * 80) + 'ms';
                  child.classList.add('reveal-child-visible');
                })(children[i], i);
              }
            }

            // Small delay before reveal for organic feel
            el.style.transitionDelay = '0ms';
            el.classList.add('reveal-visible');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(function (el) { io.observe(el); });
  }

  // ── Mineral Cards — Tilt Effect ────────────────────────────────────────────
  // Subtle perspective tilt on hover using CSS + JS
  function initCardTilt() {
    var cards = document.querySelectorAll('.mineral-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var dx = (x - cx) / cx;  // -1 to 1
        var dy = (y - cy) / cy;  // -1 to 1

        card.style.transform =
          'perspective(800px) rotateY(' + (dx * 6) + 'deg) rotateX(' + (-dy * 4) + 'deg) translateY(-6px)';
        card.style.transition = 'transform 0.15s ease-out';

        // Move inner glow
        var glow = card.querySelector('.card-glow');
        if (glow) {
          glow.style.background =
            'radial-gradient(circle at ' + (dx * 50 + 50) + '% ' + (dy * 50 + 50) + '%, rgba(245,158,11,0.18) 0%, transparent 70%)';
        }
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
        var glow = card.querySelector('.card-glow');
        if (glow) {
          glow.style.background = '';
        }
      });
    });
  }

  // ── Magnetic Buttons ───────────────────────────────────────────────────────
  // CTA buttons slightly follow cursor on hover
  function initMagneticButtons() {
    var buttons = document.querySelectorAll('.btn--magnetic');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);

        btn.style.transform =
          'translate(' + (dx * 4) + 'px, ' + (dy * 3) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
      });
    });
  }

  // ── Nav Scroll Behavior ─────────────────────────────────────────────────────
  // Nav gains backdrop blur + border on scroll
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 20) {
            nav.classList.add('nav--scrolled');
          } else {
            nav.classList.remove('nav--scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Number Counter Animation ─────────────────────────────────────────────────
  // Any [data-count] element will count up to its value on scroll entry
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var prefix = el.getAttribute('data-prefix') || '';
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = 1800;
          var start = performance.now();

          function update(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            // Ease out expo
            var eased = 1 - Math.pow(2, -10 * progress);
            var current = eased * target;
            el.textContent = prefix + current.toFixed(target % 1 !== 0 ? 1 : 0) + suffix;
            if (progress < 1) requestAnimationFrame(update);
          }

          requestAnimationFrame(update);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { io.observe(el); });
  }

  // ── Hero Section Parallax ────────────────────────────────────────────────────
  // Hero content shifts slightly on scroll
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var ticking = false;
    var content = hero.querySelector('.hero__content');

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          var heroHeight = hero.offsetHeight;
          if (scrollY < heroHeight) {
            var ratio = scrollY / heroHeight;
            if (content) {
              content.style.transform = 'translateY(' + (ratio * 30) + 'px)';
              // Keep content fully opaque — opacity fade causes hero content to disappear
              content.style.opacity = 1;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Cursor Follower (optional) ───────────────────────────────────────────────
  // Small amber dot that follows cursor in hero section
  function initCursorFollower() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var dot = document.createElement('div');
    dot.className = 'cursor-follower';
    document.body.appendChild(dot);

    var mx = 0, my = 0;
    var cx = 0, cy = 0;
    var raf;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function follow() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      dot.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)';
      raf = requestAnimationFrame(follow);
    }

    // Only activate when in hero
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          raf = requestAnimationFrame(follow);
        } else {
          cancelAnimationFrame(raf);
        }
      });
    });
    observer.observe(hero);
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    initScrollReveal();
    initCardTilt();
    initMagneticButtons();
    initNavScroll();
    initCounters();
    initHeroParallax();
    // initCursorFollower(); // Disabled by default — uncomment to enable cursor dot
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
