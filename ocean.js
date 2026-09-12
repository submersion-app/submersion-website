(() => {
  'use strict';

  const MAX_DEPTH_M = 60;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const root = document.documentElement;
  const readout = document.getElementById('depth-readout');
  const ticks = Array.prototype.slice.call(document.querySelectorAll('.gauge__tick'));
  const rays = Array.prototype.slice.call(document.querySelectorAll('.ocean__ray'));
  const parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));

  // ---- The water column ----
  // One straight gradient down the whole page (the body background in
  // styles.css), so the water at any page offset is known. Its two ends are read
  // from the custom properties that define it there.
  function parseHex(value, fallback) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(value).trim());
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rootStyle = window.getComputedStyle(root);
  const WATER_TOP = parseHex(rootStyle.getPropertyValue('--water-top'), [0x49, 0xe8, 0xff]);
  const WATER_BOTTOM = parseHex(rootStyle.getPropertyValue('--water-bottom'), [0x01, 0x06, 0x0e]);
  let pageH = root.scrollHeight;

  function mix(a, b, f) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ];
  }
  // t: 0 at the top of the page, 1 at the bottom
  function waterAt(t) {
    return mix(WATER_TOP, WATER_BOTTOM, Math.min(1, Math.max(0, t)));
  }
  // WCAG relative luminance and contrast ratio
  function channel(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function luminance(c) {
    return 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
  }
  function contrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  // ---- Ink: text color solved from the water ----
  // The water behind a text block darkens from its top edge to its bottom edge,
  // so dark ink is at its worst at the bottom and light ink at the top. Each
  // block gets whichever family reads better there, pushed toward black or white
  // until its main text reaches 7:1 (or as close as it can get), with the muted
  // and faint tones eased back toward the water only as far as 4.5:1 allows.
  const INK_BLOCKS = [
    'main .zone__inner > :not(.features):not(.shots):not(.legal__body)',
    'main .features > *',
    'main .shots > *',
    'main .legal__body > :not(.callout)',
  ].join(',');
  const INK_PAD = 16;
  const INKS = {
    dark: { ink: [6, 48, 60], accent: [11, 68, 82], extreme: [0, 0, 0] }, // the lockup's navies
    light: { ink: [234, 246, 250], accent: [143, 220, 236], extreme: [255, 255, 255] },
  };

  // The least push of `color` toward `extreme` that reaches `target` on `bg`
  function strengthen(color, extreme, bg, target) {
    if (contrast(color, bg) >= target) return color;
    if (contrast(extreme, bg) <= target) return extreme;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 12; i++) {
      const f = (lo + hi) / 2;
      if (contrast(mix(color, extreme, f), bg) >= target) hi = f;
      else lo = f;
    }
    return mix(color, extreme, hi);
  }
  // AA asks for 4.5:1; aim a little above it so rounding never lands under
  const AA = 4.6;

  // `color` eased toward `bg` by up to `amount`, keeping at least AA on it
  function soften(color, bg, amount) {
    if (contrast(mix(color, bg, amount), bg) >= AA) return mix(color, bg, amount);
    let lo = 0;
    let hi = amount;
    for (let i = 0; i < 12; i++) {
      const f = (lo + hi) / 2;
      if (contrast(mix(color, bg, f), bg) >= AA) lo = f;
      else hi = f;
    }
    return mix(color, bg, lo);
  }
  function rgb(c, a) {
    return a === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')';
  }

  // Ink tokens for text over water running from `waterTop` down to `waterBottom`
  function solve(waterTop, waterBottom) {
    // Compare what each family can reach, not where it starts: in the
    // mid-depth water near-black ink reads better than near-white does.
    const darkInk = strengthen(INKS.dark.ink, INKS.dark.extreme, waterBottom, 7);
    const lightInk = strengthen(INKS.light.ink, INKS.light.extreme, waterTop, 7);
    const dark = contrast(darkInk, waterBottom) >= contrast(lightInk, waterTop);
    const family = dark ? INKS.dark : INKS.light;
    const bg = dark ? waterBottom : waterTop;
    const ink = dark ? darkInk : lightInk;
    const accent = strengthen(family.accent, family.extreme, bg, AA);
    return {
      family: dark ? 'dark' : 'light',
      reach: contrast(ink, bg),
      '--ink': rgb(ink),
      '--ink-muted': rgb(soften(ink, bg, 0.28)),
      '--ink-faint': rgb(soften(ink, bg, 0.32)),
      '--cyan-text': rgb(accent),
      '--cyan': rgb(dark ? ink : accent),
      '--cyan-dim': rgb(dark ? family.ink : family.accent, 0.5),
      '--line': rgb(family.ink, dark ? 0.22 : 0.16),
    };
  }
  const TOKENS = ['--ink', '--ink-muted', '--ink-faint', '--cyan-text', '--cyan', '--cyan-dim', '--line'];
  const CLIP = ['background-image', 'background-clip', '-webkit-background-clip', 'color'];
  function applyInk(el, tokens) {
    el.setAttribute('data-ink', tokens.family);
    for (let i = 0; i < CLIP.length; i++) el.style.removeProperty(CLIP[i]);
    for (let i = 0; i < TOKENS.length; i++) el.style.setProperty(TOKENS[i], tokens[TOKENS[i]]);
  }

  // A tall block on a short page can span the depth where neither black nor
  // white reaches AA for all of it. At that depth, the crossover, the two read
  // equally well (about 4.58:1), so its lines above the crossover are inked
  // black and the lines below it white: the text is filled with a two-color
  // gradient clipped to its glyphs, switching on the line boundary nearest the
  // crossover. Every token goes transparent so links and strong text show the
  // fill too.
  function crossoverY(top, bottom) {
    let lo = top;
    let hi = bottom;
    for (let i = 0; i < 20; i++) {
      const y = (lo + hi) / 2;
      const water = waterAt(y / pageH);
      if (contrast([0, 0, 0], water) > contrast([255, 255, 255], water)) lo = y;
      else hi = y;
    }
    return (lo + hi) / 2;
  }
  function applyTwilight(el, blockTop, blockBottom) {
    const st = window.getComputedStyle(el);
    const lineH = parseFloat(st.lineHeight) || parseFloat(st.fontSize) * 1.6;
    const inset = parseFloat(st.paddingTop) + parseFloat(st.borderTopWidth);
    const lines = Math.round((crossoverY(blockTop, blockBottom) - blockTop - inset) / lineH);
    const cut = (inset + Math.max(0, lines) * lineH).toFixed(1) + 'px';
    el.setAttribute('data-ink', 'twilight');
    for (let i = 0; i < TOKENS.length; i++) el.style.setProperty(TOKENS[i], 'transparent');
    el.style.setProperty('--cyan-dim', 'rgba(128, 128, 128, 0.8)');
    el.style.setProperty('--line', 'rgba(128, 128, 128, 0.35)');
    el.style.setProperty('background-image', 'linear-gradient(180deg, #000 ' + cut + ', #fff ' + cut + ')');
    el.style.setProperty('-webkit-background-clip', 'text');
    el.style.setProperty('background-clip', 'text');
    el.style.setProperty('color', 'transparent');
  }

  function solveInk() {
    pageH = root.scrollHeight;
    const scrollY = window.scrollY || 0;
    // The shallow sections carry a static data-ink for the page without JS;
    // the per-block values below replace it.
    const marked = document.querySelectorAll('main .zone[data-ink]');
    for (let i = 0; i < marked.length; i++) marked[i].removeAttribute('data-ink');

    const blocks = document.querySelectorAll(INK_BLOCKS);
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect();
      if (!r.height) continue;
      // Sample a little beyond the block: the reveal animation shifts it 12px
      const top = r.top + scrollY - INK_PAD;
      const bottom = r.bottom + scrollY + INK_PAD;
      const tokens = solve(waterAt(top / pageH), waterAt(bottom / pageH));
      if (tokens.reach >= AA) applyInk(blocks[i], tokens);
      else applyTwilight(blocks[i], r.top + scrollY, r.bottom + scrollY);
    }
    measureTicks();
    inkTicks(scrollY);
  }

  // The depth gauge is fixed, so the water behind each of its ticks changes as
  // the page scrolls; they are re-inked on every scroll update.
  let tickY = [];
  function measureTicks() {
    tickY = ticks.map(function (tick) {
      const r = tick.getBoundingClientRect();
      return (r.top + r.bottom) / 2;
    });
  }
  function inkTicks(scrollY) {
    for (let i = 0; i < ticks.length; i++) {
      const water = waterAt((scrollY + tickY[i]) / pageH);
      applyInk(ticks[i], solve(water, water));
    }
  }
  window.addEventListener('resize', measureTicks);

  solveInk();
  // Re-solve when anything changes the page's height or a block's position
  if ('ResizeObserver' in window) new ResizeObserver(solveInk).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(solveInk);
  window.addEventListener('load', solveInk);

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
    function step(depthFrac, scrollY) {
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
        // Motes catch the light where the water is bright; the pale snow that
        // reads on deep water would vanish against the bright cyan without this.
        const water = luminance(waterAt((scrollY + p.y) / pageH));
        const lit = Math.min(1, Math.max(0, (water - 0.05) / 0.5));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + 0.35 * lit), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.9, p.a * fade * (1 + 1.8 * lit)).toFixed(3) + ')';
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

  // ---- Depth + motion updates ----
  const snow = createSnow(document.getElementById('ocean-snow'));
  let lastY = -1;
  let depthFrac = 0;

  function update() {
    const y = window.scrollY || 0;
    lastY = y;
    const maxScroll = root.scrollHeight - window.innerHeight;
    depthFrac = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;

    const depth = depthFrac * MAX_DEPTH_M;
    if (readout) readout.textContent = depth.toFixed(1) + ' m';
    for (let i = 0; i < ticks.length; i++) {
      ticks[i].classList.toggle('gauge__tick--passed', Number(ticks[i].dataset.depth) <= depth);
    }
    inkTicks(y);

    if (!reducedMotion.matches) {
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

  // Full motion: one continuous rAF loop drives parallax, gauge, snow.
  function frame() {
    if (!document.hidden) {
      if ((window.scrollY || 0) !== lastY) update();
      snow.step(depthFrac, lastY);
    }
    window.requestAnimationFrame(frame);
  }

  setupReveals();

  if (reducedMotion.matches) {
    // Reduced motion: no continuous loop. Keep the depth readout and tick
    // states current by coalescing scroll/resize events into a single rAF.
    let queued = false;
    const schedule = function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        update();
      });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  } else {
    window.requestAnimationFrame(frame);
  }
})();
