# Submersion Website Revamp ("The Descent") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Submersion homepage as an immersive "descent" — a single dive from sunlit surface to seafloor, with scroll-driven water color, parallax, marine-snow particles, and a live depth gauge.

**Architecture:** Static site, three files rewritten/added: `index.html` (six-zone structure), `styles.css` (dark-only visual system + static fallback), new `ocean.js` (motion engine: one rAF loop driving water color, parallax, particles, depth gauge, plus IntersectionObserver reveals). The existing `script.js` (GitHub release fetch + platform detection) is **not modified**; the new HTML preserves every DOM hook it uses.

**Tech Stack:** Vanilla HTML/CSS/JS. Google Fonts (Fraunces, IBM Plex Mono, Inter). No build step. GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-07-24-website-revamp-design.md`

## Global Constraints

- **Do not edit `script.js`.** The new HTML must contain, verbatim: IDs `download-primary`, `download-primary-icon`, `download-primary-label`, `download-primary-meta`, `download-platforms`; a `[data-year]` element; container `#download-stores` and `#download-secondary` blocks. CSS must style classes `download__platform`, `download__platform--active`, `download__version` (script.js injects the first two).
- **Dark-only.** No `prefers-color-scheme: light` block anywhere. `<meta name="color-scheme" content="dark">`.
- **Anchors preserved:** `#top`, `#why`, `#screens`, `#features`, `#support`, `#download` must all exist.
- **Fonts:** Fraunces (300 + italics), IBM Plex Mono (400/500/600), Inter (300/400/500) via Google Fonts with fallbacks Georgia/serif, ui-monospace, system-ui.
- **Reduced motion:** `prefers-reduced-motion: reduce` ⇒ static pre-painted gradient, no particles/parallax/ray animation/reveals; depth readout still works.
- **JS disabled** ⇒ full content on static CSS gradient; download links fall back exactly as today.
- **Performance rails:** one rAF loop; `transform: translate3d` only for parallax; canvas DPR cap 2; all animation idles when `document.hidden`.
- **Targets:** Lighthouse Performance ≥ 90, Accessibility ≥ 95 (desktop preset).
- **Factual claims may not change:** 300+ dive computers, UDDF 3.2, CSV, Bühlmann ZH-L16C, gradient factors, NDL/ceiling/TTS/CNS/OTU, air/nitrox/trimix, GPL-3.0, platforms iOS/Android/macOS/Windows/Linux, App Store URL `https://apps.apple.com/us/app/submersion-dive-log/id6757456915`.
- Work happens on branch `website-revamp`. Local server for verification: `python3 -m http.server 4173` from repo root (background it; kill when done).

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Rewrite | Six-zone semantic structure, all copy, decorative-layer markup, depth-gauge markup, download DOM contract |
| `styles.css` | Rewrite | Dark-only visual system, static fallback background, gauge/layers styling, responsive + reduced-motion rules |
| `ocean.js` | Create | Motion engine (water color, parallax, marine snow, gauge, reveals) — progressive enhancement only |
| `script.js` | Untouched | Release fetching / platform detection (existing) |

**DOM contract produced by Task 1 and consumed by Tasks 2–3** (exact names):
`.ocean` (fixed decorative stack: `.ocean__haze[data-speed]`, `.ocean__rays[data-speed]` > `.ocean__ray--1/2/3`, `.ocean__bubbles[data-speed]` > `.ocean__bubble`×6, `canvas#ocean-snow.ocean__snow`), `#depth-gauge.gauge` (`.gauge__ticks` > `.gauge__tick[data-depth]`×9, `#depth-readout.gauge__readout`), sections `section.zone` each containing one `div.zone__inner`, plus the download contract in Global Constraints.

---

### Task 1: Rewrite `index.html` — structure, copy, DOM contracts

**Files:**
- Modify: `index.html` (full rewrite)

**Interfaces:**
- Consumes: `script.js` DOM contract (Global Constraints), existing assets `assets/icon.png`, `assets/favicon.png`, `assets/app-store-badge.svg`, `screenshots/*.png`.
- Produces: the DOM contract listed in File Structure, used by `styles.css` (Task 2) and `ocean.js` (Task 3).

- [ ] **Step 1: Write the failing check**

Run from repo root:

```bash
python3 - <<'EOF'
import re, sys
html = open('index.html').read()
required = ['id="why"', 'id="screens"', 'id="features"', 'id="support"', 'id="download"',
  'id="depth-gauge"', 'id="depth-readout"', 'id="ocean-snow"',
  'id="download-primary"', 'id="download-primary-icon"', 'id="download-primary-label"',
  'id="download-primary-meta"', 'id="download-platforms"', 'data-year',
  'zone__tag', 'ocean__ray--3', 'fonts.googleapis.com']
missing = [r for r in required if r not in html]
forbidden = [f for f in ['hero__stats', 'class="cards"', 'featureGrid'] if f in html]
print('MISSING:', missing); print('FORBIDDEN (old markup):', forbidden)
sys.exit(1 if (missing or forbidden) else 0)
EOF
```

Expected now: exits 1 — MISSING lists `depth-gauge`, `ocean-snow`, `zone__tag`, etc.; FORBIDDEN lists old classes.

- [ ] **Step 2: Replace `index.html` with the new document**

Full contents:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#0a3049" />

    <title>Submersion Dive Log</title>
    <meta
      name="description"
      content="Submersion is a free, open-source dive log for recreational and technical divers. Your dives stay on your device, in open formats, forever. iOS, Android, macOS, Windows, Linux."
    />

    <meta property="og:title" content="Submersion — the logbook that goes deeper" />
    <meta
      property="og:description"
      content="Free, open-source dive logging with complete data ownership. 300+ dive computers, UDDF 3.2, full decompression modelling. No accounts, no subscriptions."
    />
    <meta property="og:type" content="website" />

    <link rel="icon" type="image/png" href="assets/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body id="top">
    <a class="skip" href="#content">Skip to content</a>

    <!-- Fixed decorative water column (JS-enhanced; harmless without JS) -->
    <div class="ocean" aria-hidden="true">
      <div class="ocean__haze" data-speed="0.04"></div>
      <!-- Parallax lives on the wrapper; the sway animation on the rays themselves.
           Both set transform, so they must be on different elements. -->
      <div class="ocean__rays" data-speed="0.2">
        <div class="ocean__ray ocean__ray--1"></div>
        <div class="ocean__ray ocean__ray--2"></div>
        <div class="ocean__ray ocean__ray--3"></div>
      </div>
      <div class="ocean__bubbles" data-speed="-0.08">
        <span class="ocean__bubble" style="left: 12%; width: 10px; height: 10px; animation-duration: 16s"></span>
        <span class="ocean__bubble" style="left: 23%; width: 5px; height: 5px; animation-duration: 21s; animation-delay: 4s"></span>
        <span class="ocean__bubble" style="left: 47%; width: 7px; height: 7px; animation-duration: 18s; animation-delay: 9s"></span>
        <span class="ocean__bubble" style="left: 63%; width: 4px; height: 4px; animation-duration: 24s; animation-delay: 2s"></span>
        <span class="ocean__bubble" style="left: 78%; width: 9px; height: 9px; animation-duration: 17s; animation-delay: 12s"></span>
        <span class="ocean__bubble" style="left: 90%; width: 6px; height: 6px; animation-duration: 22s; animation-delay: 6s"></span>
      </div>
      <canvas id="ocean-snow" class="ocean__snow"></canvas>
    </div>

    <!-- Fixed depth gauge -->
    <div class="gauge" id="depth-gauge" aria-hidden="true">
      <div class="gauge__ticks">
        <span class="gauge__tick" data-depth="0">0 m —</span>
        <span class="gauge__tick" data-depth="5">5 —</span>
        <span class="gauge__tick" data-depth="10">10 —</span>
        <span class="gauge__tick" data-depth="15">15 —</span>
        <span class="gauge__tick" data-depth="20">20 —</span>
        <span class="gauge__tick" data-depth="25">25 —</span>
        <span class="gauge__tick" data-depth="30">30 —</span>
        <span class="gauge__tick" data-depth="35">35 —</span>
        <span class="gauge__tick" data-depth="40">40 m —</span>
      </div>
      <div class="gauge__readout" id="depth-readout">0.0 m</div>
    </div>

    <header>
      <nav class="nav" aria-label="Primary">
        <a class="nav__brand" href="#top">
          <img src="assets/icon.png" alt="" width="30" height="30" decoding="async" />
          SUBMERSION
        </a>
        <div class="nav__links">
          <a href="#why">Why</a>
          <a href="#screens">Screens</a>
          <a href="#features">Features</a>
          <a href="#support">Support</a>
          <a href="#download">Download</a>
          <a href="https://github.com/submersion-app/submersion" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </nav>

      <section class="hero">
        <div class="zone__inner wrap">
          <p class="eyebrow">Free · Open Source · Yours</p>
          <h1>The logbook that goes <em>deeper</em>.</h1>
          <p class="lead">
            Every dive tells a story — the wall that dropped into blue, the current that surprised
            you, the turtle at your safety stop. Submersion keeps those stories on your device, in
            open formats, forever. No accounts. No subscriptions. No lock-in.
          </p>
          <div class="cta-row">
            <a class="btn" href="#why">Begin descent ↓</a>
            <a class="btn btn--ghost" href="https://github.com/submersion-app/submersion" target="_blank" rel="noreferrer">View on GitHub</a>
          </div>
        </div>
      </section>
    </header>

    <main id="content">
      <section class="zone" id="why">
        <div class="zone__inner wrap">
          <p class="zone__tag">— 10 m · The Shallows</p>
          <h2>Your dive data belongs to <em>you</em>.</h2>
          <p class="zone__intro">
            Most dive logs hold your history hostage — locked behind accounts, subscriptions, and
            proprietary clouds. Submersion works differently, on principle.
          </p>
          <div class="pillars">
            <div class="pillar">
              <h3>Yours, on your device</h3>
              <p>Your dives live locally. Sync to a cloud only if you choose to. Export everything, any time — no questions asked.</p>
            </div>
            <div class="pillar">
              <h3>Open formats</h3>
              <p>Full UDDF 3.2 import and export, plus CSV. Your logbook stays portable for the rest of your diving life.</p>
            </div>
            <div class="pillar">
              <h3>Every device you own</h3>
              <p>iOS, Android, macOS, Windows, Linux. One logbook, the same on all of them.</p>
            </div>
            <div class="pillar">
              <h3>Free, forever</h3>
              <p>GPL-3.0 open source. No ads, no premium tier, no upsells at 30 metres.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="zone" id="screens">
        <div class="zone__inner wrap">
          <p class="zone__tag">— 20 m · The Reef</p>
          <h2>A closer <em>look</em>.</h2>
          <p class="zone__intro">Clean on the surface, thorough underneath — like any good dive plan.</p>
          <div class="shots">
            <figure>
              <img src="screenshots/home_screen.png" alt="Submersion dashboard showing recent dives and lifetime statistics" loading="lazy" decoding="async" />
              <figcaption>Your logbook at a glance — recent dives, lifetime stats, and where you're headed next.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/dive_details_1.png" alt="Dive detail view with conditions, cylinders, gases and profile" loading="lazy" decoding="async" />
              <figcaption>The whole story of a dive: conditions, cylinders, gases, and profile in one place.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/sites_map.png" alt="Interactive map of dive sites with clustered markers" loading="lazy" decoding="async" />
              <figcaption>Every site you've splashed, mapped — with clustering when your logbook outgrows the coastline.</figcaption>
            </figure>
          </div>
          <div class="thumbs">
            <figure class="thumb">
              <img src="screenshots/statistics.png" alt="Dive statistics screen" loading="lazy" decoding="async" />
              <figcaption>Lifetime trends</figcaption>
            </figure>
            <figure class="thumb">
              <img src="screenshots/equipment.png" alt="Equipment management screen" loading="lazy" decoding="async" />
              <figcaption>Gear &amp; service</figcaption>
            </figure>
            <figure class="thumb">
              <img src="screenshots/dive_log.png" alt="Dive entry screen" loading="lazy" decoding="async" />
              <figcaption>Fast entry</figcaption>
            </figure>
            <figure class="thumb">
              <img src="screenshots/dive_sites.png" alt="Dive site database screen" loading="lazy" decoding="async" />
              <figcaption>Site database</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="zone" id="features">
        <div class="zone__inner wrap">
          <p class="zone__tag">— 30 m · The Wall</p>
          <h2>Built for divers who read the <em>fine print</em>.</h2>
          <p class="zone__intro">
            Under the calm interface: a complete decompression toolset that takes your diving as
            seriously as you do.
          </p>
          <div class="specs">
            <div class="spec"><strong>ZH-L16C</strong><span>Bühlmann, with gradient factors</span></div>
            <div class="spec"><strong>300+</strong><span>dive computers, USB &amp; Bluetooth</span></div>
            <div class="spec"><strong>NDL · TTS · CNS · OTU</strong><span>computed in real time</span></div>
            <div class="spec"><strong>Air · Nitrox · Trimix</strong><span>multi-cylinder, multi-gas</span></div>
          </div>
          <div class="detail">
            <div>
              <h3>Dive documentation</h3>
              <p>Complete records — conditions, timestamps, temperatures. Trips, tags, favorites, and notes. Multi-cylinder configurations with gas mixes from air to trimix.</p>
            </div>
            <div>
              <h3>Site management</h3>
              <p>GPS capture with reverse geocoding. Depth ranges, difficulty ratings, hazard documentation. An interactive map of everywhere you've been.</p>
            </div>
            <div>
              <h3>Computer integration</h3>
              <p>Direct USB and Bluetooth downloads. Incremental sync with duplicate detection. Support for 300+ models via libdivecomputer.</p>
            </div>
            <div>
              <h3>Planning &amp; analysis</h3>
              <p>Complete multi-gas dive planning. Real-time NDL, ceiling, TTS, CNS and OTU. Gradient factors you set yourself.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="zone" id="support">
        <div class="zone__inner wrap">
          <p class="zone__tag">— 38 m · Buddy Check</p>
          <h2>Buddy <em>check</em>.</h2>
          <p class="zone__intro">
            Found a bug? Have an idea? Surface it —
            <a href="https://github.com/submersion-app/submersion/issues" target="_blank" rel="noreferrer">open an issue on GitHub</a>.
            For everything else: <a href="mailto:support@submersion.app">support@submersion.app</a>.
          </p>
        </div>
      </section>

      <section class="zone abyss" id="download">
        <div class="zone__inner wrap">
          <p class="zone__tag">— 40 m · The Abyss</p>
          <div class="orb" aria-hidden="true"></div>
          <h2>Ready to <em>descend</em>?</h2>
          <p class="zone__intro">
            Free and open source on every platform. No account. No subscription. Just your logbook,
            the way it should be.
          </p>

          <a
            id="download-primary"
            class="btn download__primary"
            href="https://github.com/submersion-app/submersion/releases"
            target="_blank"
            rel="noreferrer"
          >
            <span id="download-primary-icon"></span>
            <span>
              <span id="download-primary-label">Download</span>
              <small id="download-primary-meta" class="download__version"></small>
            </span>
          </a>

          <div class="download__stores" id="download-stores">
            <a
              class="download__store"
              href="https://apps.apple.com/us/app/submersion-dive-log/id6757456915"
              target="_blank"
              rel="noreferrer"
            >
              <img src="assets/app-store-badge.svg" alt="Download on the App Store" width="120" height="40" />
            </a>
          </div>

          <div class="download__secondary" id="download-secondary">
            <p class="download__secondary-label">All platforms</p>
            <div class="download__platforms" id="download-platforms"></div>
          </div>

          <div class="download__fallback">
            <a href="https://github.com/submersion-app/submersion" target="_blank" rel="noreferrer">View on GitHub</a>
            <a href="https://github.com/submersion-app/submersion#quick-start" target="_blank" rel="noreferrer">Build instructions</a>
          </div>

          <footer class="footer">
            © <span data-year></span> Submersion · GPL-3.0 · See you down there
          </footer>
        </div>
      </section>
    </main>

    <script src="script.js" defer></script>
    <script src="ocean.js" defer></script>
  </body>
</html>
```

- [ ] **Step 3: Re-run the Step 1 check**

Same command. Expected: `MISSING: []`, `FORBIDDEN (old markup): []`, exit 0.

- [ ] **Step 4: Visual smoke check**

```bash
python3 -m http.server 4173 &
```

Open `http://localhost:4173` in a browser. Expected: unstyled-ish page (old styles.css partially applies) but ALL content present and readable top to bottom: hero copy, 4 pillars, 3 large + 4 small screenshots, spec row, 4 detail groups, support links, download section, footer. No console 404s except none — `ocean.js` doesn't exist yet, so exactly one 404 for `/ocean.js` is expected and acceptable at this stage.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Rebuild homepage structure as six-zone descent narrative"
```

---

### Task 2: Rewrite `styles.css` — the visual system

**Files:**
- Modify: `styles.css` (full rewrite)

**Interfaces:**
- Consumes: Task 1 DOM contract (class names above).
- Produces: CSS custom property `--water` on `:root` (read/written by `ocean.js`); classes `reveal` / `reveal--in` (applied by `ocean.js`); class `ocean-live` expected on `<html>` (added by `ocean.js`); class `gauge__tick--passed` (toggled by `ocean.js`).

- [ ] **Step 1: Write the failing check**

```bash
python3 - <<'EOF'
import sys
css = open('styles.css').read()
required = ['--water', 'ocean-live', 'gauge__tick--passed', 'reveal--in',
  'Fraunces', 'IBM Plex Mono', 'prefers-reduced-motion',
  'download__platform--active', 'download__version', '.skip:focus', ':focus-visible']
missing = [r for r in required if r not in css]
forbidden = [f for f in ['prefers-color-scheme: light', 'hero__stats', '.featureGrid'] if f in css]
print('MISSING:', missing); print('FORBIDDEN:', forbidden)
sys.exit(1 if (missing or forbidden) else 0)
EOF
```

Expected now: exits 1 with several MISSING entries and `prefers-color-scheme: light` in FORBIDDEN.

- [ ] **Step 2: Replace `styles.css` with the new stylesheet**

Full contents:

```css
/* Submersion — "The Descent". Dark-only visual system. No external deps beyond Google Fonts. */

:root {
  --water: #14506e; /* live water color; ocean.js interpolates this on scroll */
  --ink: #eaf6fa;
  --ink-muted: rgba(234, 246, 250, 0.72);
  --ink-faint: rgba(234, 246, 250, 0.6);
  --cyan: #8fdcec;
  --cyan-dim: rgba(143, 220, 236, 0.55);
  --line: rgba(234, 246, 250, 0.16);
  --panel: #04182a;
  --max: 1080px;
  --gauge-w: 74px;
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-body: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-body);
  font-weight: 300;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  /* Fallback water column: paints the whole descent even with JS disabled */
  background: linear-gradient(
    180deg,
    #14506e 0%, #0e3f5a 14%, #0a3049 32%, #062033 55%, #031423 78%, #01060e 100%
  );
}

/* ocean.js adds .ocean-live to <html> and drives --water per frame */
.ocean-live body { background: var(--water); }

a { color: var(--cyan); text-decoration: none; }
a:hover { text-decoration: underline; text-decoration-color: var(--cyan-dim); }
img { max-width: 100%; height: auto; display: block; }

:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }

.skip {
  position: absolute; top: 12px; left: 12px; z-index: 1000;
  padding: 10px 14px; border-radius: 10px;
  background: var(--panel); border: 1px solid var(--line); color: var(--ink);
  transform: translateY(-260%); transition: transform 150ms ease;
}
.skip:focus { transform: translateY(0); }

.wrap { max-width: var(--max); margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }

/* ---------- Fixed decorative water layers ---------- */
.ocean { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }

.ocean__haze {
  position: absolute; inset: -20%;
  background:
    radial-gradient(60% 50% at 30% 20%, rgba(80, 170, 190, 0.1), transparent 70%),
    radial-gradient(50% 40% at 75% 70%, rgba(30, 90, 130, 0.12), transparent 70%);
}

.ocean__rays { position: absolute; inset: 0; }
.ocean__ray {
  position: absolute; top: -12vh; height: 88vh;
  background: linear-gradient(180deg, rgba(140, 215, 235, 0.16), transparent 82%);
  filter: blur(10px); transform-origin: top center;
  animation: ray-sway 11s ease-in-out infinite alternate;
}
.ocean__ray--1 { left: 16%; width: 9vw; animation-duration: 9s; }
.ocean__ray--2 { left: 32%; width: 4.5vw; opacity: 0.7; animation-duration: 12s; animation-direction: alternate-reverse; }
.ocean__ray--3 { left: 52%; width: 6.5vw; opacity: 0.5; animation-duration: 14s; }
@keyframes ray-sway {
  from { transform: skewX(-14deg) translateX(-12px); }
  to { transform: skewX(-8deg) translateX(16px); }
}

.ocean__bubbles { position: absolute; inset: 0; }
.ocean__bubble {
  position: absolute; bottom: -30px;
  border: 1px solid rgba(234, 246, 250, 0.22); border-radius: 50%;
  animation: bubble-rise linear infinite;
}
@keyframes bubble-rise {
  from { transform: translateY(0); opacity: 0.45; }
  to { transform: translateY(-110vh); opacity: 0; }
}

.ocean__snow { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ---------- Depth gauge ---------- */
.gauge {
  position: fixed; top: 0; right: 0; bottom: 0; width: var(--gauge-w); z-index: 50;
  border-left: 1px solid var(--line);
  background: linear-gradient(90deg, transparent, rgba(1, 8, 16, 0.35));
  font-family: var(--font-mono); pointer-events: none;
}
.gauge__ticks {
  display: flex; flex-direction: column; justify-content: space-between; height: 100%;
  padding: 84px 0 24px 10px; font-size: 10px; color: var(--ink-faint);
}
.gauge__tick { transition: color 400ms ease; }
.gauge__tick--passed { color: var(--cyan); }
.gauge__readout {
  position: absolute; top: 50%; right: 10px; transform: translateY(-50%);
  font-size: 14px; font-weight: 600; color: var(--cyan);
  background: rgba(2, 12, 22, 0.82); border: 1px solid var(--cyan-dim);
  border-radius: 8px; padding: 6px 9px;
}

@media (min-width: 901px) { body { padding-right: var(--gauge-w); } }
@media (max-width: 900px) { .gauge { display: none; } }

/* ---------- Nav ---------- */
.nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 22px clamp(20px, 4vw, 48px);
  max-width: calc(var(--max) + 160px); margin: 0 auto;
}
.nav__brand {
  display: flex; align-items: center; gap: 10px;
  color: var(--ink); font-size: 14px; letter-spacing: 0.22em; font-weight: 500;
}
.nav__brand:hover { text-decoration: none; color: var(--cyan); }
.nav__brand img { border-radius: 8px; }
.nav__links { display: flex; gap: clamp(14px, 2vw, 26px); font-size: 13px; }
.nav__links a { color: var(--ink-muted); }
.nav__links a:hover { color: var(--cyan); text-decoration: none; }
@media (max-width: 700px) { .nav__links { display: none; } }

/* ---------- Hero ---------- */
.hero { min-height: 84vh; display: flex; align-items: center; }
.eyebrow {
  font-family: var(--font-mono); color: var(--cyan);
  font-size: 12px; letter-spacing: 0.42em; text-transform: uppercase; margin: 0 0 22px;
}
h1 {
  font-family: var(--font-display); font-weight: 300;
  font-size: clamp(42px, 6.5vw, 82px); line-height: 1.04; letter-spacing: 0.005em; margin: 0;
}
h1 em, h2 em { font-style: italic; font-weight: 400; color: var(--cyan); }
.lead {
  color: var(--ink-muted); font-size: clamp(16px, 1.5vw, 18px);
  line-height: 1.7; max-width: 52ch; margin: 24px 0 0;
}
.cta-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 36px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 13px 28px; border-radius: 999px;
  border: 1px solid var(--cyan-dim); background: rgba(143, 220, 236, 0.12);
  color: #cdeef7; font-size: 14px; letter-spacing: 0.04em;
  transition: background 250ms ease, border-color 250ms ease;
}
.btn:hover { background: rgba(143, 220, 236, 0.22); text-decoration: none; }
.btn--ghost { border-color: var(--line); background: transparent; color: var(--ink-muted); }
.btn--ghost:hover { background: rgba(234, 246, 250, 0.06); color: var(--ink); }

/* ---------- Zones ---------- */
.zone { padding: clamp(72px, 10vh, 120px) 0; }
.zone__tag {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--cyan-dim); margin: 0 0 14px;
}
h2 {
  font-family: var(--font-display); font-weight: 300;
  font-size: clamp(30px, 3.6vw, 46px); line-height: 1.12; margin: 0;
}
.zone__intro { color: var(--ink-muted); max-width: 56ch; margin: 16px 0 0; }

/* Reveal animation hooks (classes applied by ocean.js only) */
.reveal { opacity: 0; transform: translateY(12px); transition: opacity 700ms ease, transform 700ms ease; }
.reveal--in { opacity: 1; transform: none; }

/* ---------- Why: pillars ---------- */
.pillars {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: var(--line); border: 1px solid var(--line); margin-top: 44px;
}
.pillar { background: var(--panel); padding: 30px; }
.pillar h3 {
  font-family: var(--font-display); font-weight: 400; font-size: 20px;
  margin: 0 0 10px; color: #d8f0f8;
}
.pillar p { margin: 0; color: var(--ink-muted); font-size: 14.5px; }
@media (max-width: 700px) { .pillars { grid-template-columns: 1fr; } }

/* ---------- Screens ---------- */
.shots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; margin-top: 48px; align-items: start; }
.shots figure { margin: 0; }
.shots figure:nth-child(2) { transform: translateY(42px); }
.shots img { border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
.shots figcaption { font-size: 13px; color: var(--ink-faint); margin-top: 12px; line-height: 1.6; }

.thumbs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 76px; }
.thumb { margin: 0; }
.thumb img { border-radius: 10px; border: 1px solid var(--line); opacity: 0.85; }
.thumb figcaption {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-faint); margin-top: 8px;
}
@media (max-width: 860px) {
  .shots { grid-template-columns: 1fr; }
  .shots figure:nth-child(2) { transform: none; }
  .thumbs { grid-template-columns: repeat(2, 1fr); }
}

/* ---------- Features: specs + detail ---------- */
.specs { display: flex; gap: clamp(24px, 4vw, 44px); flex-wrap: wrap; margin-top: 44px; }
.spec { border-left: 1px solid var(--cyan-dim); padding-left: 18px; }
.spec strong {
  font-family: var(--font-mono); display: block; color: var(--cyan);
  font-size: clamp(17px, 1.8vw, 21px); font-weight: 500;
}
.spec span { color: var(--ink-faint); font-size: 13px; }

.detail { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 40px; margin-top: 52px; }
.detail h3 {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cyan-dim); margin: 0 0 8px; font-weight: 500;
}
.detail p { margin: 0; color: var(--ink-muted); font-size: 14.5px; }
@media (max-width: 700px) { .detail { grid-template-columns: 1fr; } }

/* ---------- Abyss / download ---------- */
.abyss { text-align: center; }
.abyss .zone__intro { margin-left: auto; margin-right: auto; }
.orb {
  width: 8px; height: 8px; border-radius: 50%; background: #aef0ff; margin: 26px auto 34px;
  box-shadow: 0 0 24px 6px rgba(140, 230, 250, 0.65), 0 0 90px 30px rgba(80, 180, 220, 0.25);
  animation: orb-pulse 3.4s ease-in-out infinite;
}
@keyframes orb-pulse { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }

.download__primary { margin-top: 36px; padding: 16px 40px; font-size: 16px; }
.download__version {
  display: block; font-family: var(--font-mono); font-size: 11px;
  font-weight: 400; color: var(--ink-faint); margin-top: 2px;
}
.download__stores { display: flex; justify-content: center; margin-top: 20px; }
.download__store { display: inline-block; border-radius: 8px; transition: opacity 150ms ease; }
.download__store:hover { opacity: 0.8; }
.download__secondary { margin-top: 24px; }
.download__secondary-label {
  font-family: var(--font-mono); color: var(--ink-faint); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 12px;
}
.download__platforms { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.download__platform {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 999px; border: 1px solid var(--line);
  color: var(--ink-muted); font-size: 13px; font-weight: 400;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}
.download__platform:hover { border-color: var(--cyan-dim); color: var(--ink); text-decoration: none; }
.download__platform--active { border-color: var(--cyan-dim); background: rgba(143, 220, 236, 0.08); color: var(--ink); }
.download__fallback { display: flex; gap: 18px; justify-content: center; margin-top: 22px; font-size: 13px; }
.download__fallback a { color: var(--ink-faint); display: inline-flex; gap: 6px; align-items: center; }
.download__fallback a:hover { color: var(--cyan); }

.footer {
  padding: 64px 0 40px; text-align: center;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  color: rgba(234, 246, 250, 0.38);
}

/* ---------- Reduced motion: complete static experience ---------- */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .ocean__ray, .orb { animation: none !important; }
  .ocean__bubble { display: none; }
  .gauge__tick { transition: none; }
  .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Re-run the Step 1 check**

Expected: `MISSING: []`, `FORBIDDEN: []`, exit 0.

- [ ] **Step 4: Visual verification in browser**

With the local server running, open `http://localhost:4173` and verify at widths 1600, 1120, 768, 360 (device toolbar):

- Surface: teal-blue backdrop, swaying light rays, serif headline with italic cyan "deeper", mono eyebrow.
- Depth gauge rail visible on the right at ≥ 901px, hidden below; content not overlapped by it.
- Pillars 2×2 (1-col ≤ 700px); middle screenshot offset down at ≥ 861px; thumbs 4-up / 2-up.
- Abyss: pulsing orb, centered download block, footer "See you down there".
- The page background is the static gradient (ocean.js not written yet) — the water does NOT yet change on scroll. That's expected.
- Emulate `prefers-reduced-motion: reduce` (DevTools Rendering tab): rays and orb stop animating, bubbles disappear.

- [ ] **Step 5: Commit**

```bash
git add styles.css
git commit -m "Add dark-only descent visual system"
```

---

### Task 3: Create `ocean.js` — the motion engine

**Files:**
- Create: `ocean.js`

**Interfaces:**
- Consumes: DOM contract from Task 1; CSS hooks from Task 2 (`--water`, `ocean-live`, `gauge__tick--passed`, `reveal`, `reveal--in`).
- Produces: nothing consumed downstream; self-contained IIFE like `script.js`.

- [ ] **Step 1: Write the failing check**

```bash
test -f ocean.js && node --check ocean.js && grep -q 'requestAnimationFrame' ocean.js && echo OK || echo FAIL
```

Expected now: `FAIL` (file does not exist).

- [ ] **Step 2: Write `ocean.js`**

Full contents:

```js
(() => {
  'use strict';

  const MAX_DEPTH_M = 40;
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
```

- [ ] **Step 3: Re-run the Step 1 check**

```bash
test -f ocean.js && node --check ocean.js && grep -q 'requestAnimationFrame' ocean.js && echo OK || echo FAIL
```

Expected: `OK`.

- [ ] **Step 4: Behavior verification in browser**

With the server running, open `http://localhost:4173` (normal motion settings) and verify:

1. `document.documentElement.classList.contains('ocean-live')` → `true` (run in console).
2. At top: readout shows `0.0 m`; `getComputedStyle(document.body).backgroundColor` → `rgb(20, 80, 110)`.
3. Scroll to bottom: readout shows `40.0 m`; body background is near `rgb(1, 6, 14)`; all gauge ticks cyan.
4. Scroll mid-page: rays invisible (opacity 0) past ~half depth; marine-snow particles drifting on the canvas; particles visibly sparser near the bottom.
5. Sections fade in the first time they enter the viewport.
6. Scroll back to top: water lightens again, ticks un-highlight.
7. Emulate reduced motion, reload: `ocean-live` absent, static gradient page, no particles, but the depth readout still updates on scroll.
8. Console shows no errors.

- [ ] **Step 5: Commit**

```bash
git add ocean.js
git commit -m "Add living-ocean motion engine (water color, parallax, marine snow, depth gauge)"
```

---

### Task 4: Full verification pass and fixes

**Files:**
- Modify (fixes only, as needed): `index.html`, `styles.css`, `ocean.js`

**Interfaces:**
- Consumes: everything above. Produces: the verified site.

- [ ] **Step 1: Spec verification checklist**

With `python3 -m http.server 4173` running, work through the spec's definition of done:

1. **Breakpoints:** 360 / 768 / 1120 / 1600 px — no horizontal scroll, no overlapped text, gauge behavior correct, download section centered and usable.
2. **Reduced motion:** emulated — complete static experience per Task 3 Step 4 item 7.
3. **JS off** (DevTools → Settings → Debugger → Disable JavaScript, reload): full content readable on the static gradient; primary download button links to GitHub releases page; footer year span empty but layout intact.
4. **Anchors:** visiting `http://localhost:4173/#features` (and each of `#why`, `#screens`, `#support`, `#download`) lands on the right section.
5. **Download detection (JS on):** on macOS the primary button label becomes "Download for macOS" with a version tag, and the macOS chip is highlighted (requires network access to api.github.com; if rate-limited, the fallback label "Download" with releases-page link is the correct behavior).
6. **Contrast spot-checks (worst case = surface teal `#14506e`):** body text `#eaf6fa` ≥ 4.5:1; `--ink-muted` on `#14506e` ≥ 4.5:1; `.zone__tag` cyan-dim labels are decorative-adjacent but must still hit ≥ 3:1 — verify with DevTools' contrast checker on the hero eyebrow and first zone tag. If any tier fails, raise its alpha in `:root` until it passes and re-check the mood hasn't collapsed (small bumps only, e.g. 0.72 → 0.78).

- [ ] **Step 2: Lighthouse**

```bash
npx --yes lighthouse http://localhost:4173 --preset=desktop --quiet \
  --chrome-flags="--headless=new" --output=json --output-path=/tmp/lh.json
python3 -c "import json; d=json.load(open('/tmp/lh.json'))['categories']; print({k: v['score'] for k, v in d.items()})"
```

Expected: `performance` ≥ 0.90, `accessibility` ≥ 0.95. If performance falls short, the usual culprits in order: screenshot PNG sizes (add `width`/`height` attributes if CLS is flagged), font-display (already `swap` via Google Fonts URL), canvas work (reduce particle cap from 90 → 60).

- [ ] **Step 3: Fix anything the checklist surfaced, re-run the failed check, and commit**

```bash
git add -A
git commit -m "Verification fixes: contrast, breakpoints, Lighthouse"
```

(If nothing needed fixing, skip the commit.)

- [ ] **Step 4: Stop the local server**

```bash
kill %1 2>/dev/null || pkill -f "http.server 4173"
```
