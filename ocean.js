(() => {
  'use strict';

  const MAX_DEPTH_M = 60;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Water color stops: [scroll fraction, [r, g, b]] — must mirror the CSS fallback gradient.
  const STOPS = [
    [0.0, [0x14, 0x50, 0x6e]],
    [0.14, [0x0e, 0x3f, 0x5a]],
    [0.32, [0x0a, 0x30, 0x49]],
    [0.55, [0x06, 0x20, 0x33]],
    [0.78, [0x03, 0x14, 0x23]],
    [1.0, [0x01, 0x06, 0x0e]],
  ];

  function waterColor(t) {
    for (let i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        const [t0, c0] = STOPS[i - 1];
        const [t1, c1] = STOPS[i];
        const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
        const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
        return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
      }
    }
    return 'rgb(1,6,14)';
  }

  const root = document.documentElement;
  const readout = document.getElementById('depth-readout');
  const ticks = Array.prototype.slice.call(document.querySelectorAll('.gauge__tick'));
  const rays = Array.prototype.slice.call(document.querySelectorAll('.ocean__ray'));
  const parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));

  // ---- Marine snow (canvas) ----
  function createSnow(canvas) {
    if (!canvas || !canvas.getContext) return { step: function () {}, resize: function () {} };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { step: function () {}, resize: function () {} };
    let parts = [];
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(90, ((w * h) / (1440 * 900)) * 90));
      parts = [];
      for (let i = 0; i < target; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.2,
          vy: 0.08 + Math.random() * 0.27,
          a: 0.12 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          amp: 0.15 + Math.random() * 0.35,
        });
      }
    }

    let tGlobal = 0;
    function step(depthFrac) {
      tGlobal += 0.008;
      ctx.clearRect(0, 0, w, h);
      // Marine snow thins as you descend
      const fade = 1 - depthFrac * 0.65;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y += p.vy;
        p.x += Math.sin(tGlobal + p.phase) * p.amp * 0.3;
        if (p.y > h + 4) { p.y = -4; p.x = Math.random() * w; }
        if (p.x > w + 4) p.x = -4;
        if (p.x < -4) p.x = w + 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,240,250,' + (p.a * fade).toFixed(3) + ')';
        ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return { step: step, resize: resize };
  }

  // ---- Section reveals ----
  function setupReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const targets = Array.prototype.slice.call(document.querySelectorAll('.zone .zone__inner'));
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // ---- Main loop: one rAF drives color, parallax, gauge, snow ----
  const snow = createSnow(document.getElementById('ocean-snow'));
  let lastY = -1;
  let depthFrac = 0;

  if (!reducedMotion.matches) {
    root.classList.add('ocean-live');
  }

  function frame() {
    if (!document.hidden) {
      const y = window.scrollY || 0;
      if (y !== lastY) {
        lastY = y;
        const maxScroll = root.scrollHeight - window.innerHeight;
        depthFrac = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;

        const depth = depthFrac * MAX_DEPTH_M;
        if (readout) readout.textContent = depth.toFixed(1) + ' m';
        for (let i = 0; i < ticks.length; i++) {
          ticks[i].classList.toggle('gauge__tick--passed', Number(ticks[i].dataset.depth) <= depth);
        }

        if (!reducedMotion.matches) {
          root.style.setProperty('--water', waterColor(depthFrac));
          for (let i = 0; i < parallaxEls.length; i++) {
            const el = parallaxEls[i];
            el.style.transform =
              'translate3d(0,' + (-y * Number(el.dataset.speed)).toFixed(1) + 'px,0)';
          }
          // Light rays belong to the surface: fade them out by ~45% depth
          const rayOpacity = Math.max(0, 1 - depthFrac * 2.2);
          for (let i = 0; i < rays.length; i++) {
            rays[i].style.opacity = String(rayOpacity * (i === 0 ? 1 : i === 1 ? 0.7 : 0.5));
          }
        }
      }
      if (!reducedMotion.matches) snow.step(depthFrac);
    }
    window.requestAnimationFrame(frame);
  }

  setupReveals();
  window.requestAnimationFrame(frame);
})();
