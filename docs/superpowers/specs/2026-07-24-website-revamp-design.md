# Submersion Website Revamp — "The Descent"

**Date:** 2026-07-24
**Status:** Approved pending user review
**Scope:** Homepage only (`index.html`, `styles.css`, `script.js`). The `/lightroom` walkthrough and `docs/` OAuth callback pages are untouched.

## Problem

The current homepage is competent but generic — dark navy gradient, frosted-glass cards, system fonts, symmetric card grids. It reads as AI-generated boilerplate and says nothing about diving. The goal is a site with genuine personality that a diver remembers.

## Concept

The page is one continuous dive from surface to seafloor. Depth is the organizing metaphor: the page starts in sunlit teal water and genuinely darkens as the visitor scrolls, with a fixed depth gauge tracking their descent in metres. Chosen over three alternatives (instrument-panel technical, warm indie-craft, clean-minimal) via side-by-side full-page mockups; mockups are preserved in `.superpowers/brainstorm/` (untracked).

## Decisions (settled during brainstorming)

- **Direction:** Immersive & atmospheric ("Build A"), with one element kept from the technical direction: mono-type instrument text for data.
- **Color mode:** Dark-only. The `prefers-color-scheme: light` palette is removed; the page is "underwater" for everyone.
- **Copy voice:** Evocative, diver-to-diver, throughout. All factual claims stay accurate.
- **Content:** Curated, nothing lost — 3 hero screenshots featured large, remaining 4 in a compact strip; feature bullets folded into the narrative as secondary text.
- **Motion tier:** Full "living ocean" (scroll-driven color, parallax, canvas particles), with strict performance rails.
- **Stack:** Vanilla HTML/CSS/JS, no build step, GitHub Pages-compatible.

## Page structure — six zones

| Depth | Zone | Section ID | Content |
|---|---|---|---|
| 0 m | Surface | `#top` | Nav (logo, Why / Screens / Features / Support / Download / GitHub — link order matches descent order) + hero: headline "The logbook that goes *deeper*.", lead copy, CTAs "Begin descent ↓" (scrolls to `#why`) and "View on GitHub". Light rays strongest here. |
| 10 m | The Shallows | `#why` | Four ownership pillars (your device, open formats, cross-platform, free forever) as a bordered 2×2 grid. No glass cards. |
| 20 m | The Reef | `#screens` | Hero screenshots: `home_screen`, `dive_details_1`, `sites_map` large with narrative captions; `statistics`, `equipment`, `dive_log`, `dive_sites` as a compact thumbnail strip. |
| 30 m | The Wall | `#features` | Technical spec row in mono type (ZH-L16C + gradient factors, 300+ computers, NDL·TTS·CNS·OTU, Air·Nitrox·Trimix) with current detailed feature bullets as compact secondary text. |
| 38 m | Buddy Check | `#support` | GitHub issues link + support email. |
| 40 m | The Abyss | `#download` | Bioluminescent orb, primary download CTA (existing auto-platform detection), App Store badge, all-platform links, build-instructions fallback. Footer as seafloor: "© <year> Submersion · GPL-3.0 · See you down there". |

Zone labels in-page use mono type: "— 20 m · THE REEF". All current section anchors keep working (external links may point at them).

## Visual system

**Palette.** Water column: surface teal `#14506e` → mid blues → near-black `#01060e`. Accent: pale cyan `#8fdcec` (links, readout, zone tags, CTA borders). Text: warm white `#eaf6fa` with reduced-opacity tiers. The current red accent is removed entirely.

**Typography** (Google Fonts + fallbacks):
- **Fraunces** 300 + italic — display headlines; italics mark the emotional word ("goes *deeper*").
- **IBM Plex Mono** — zone tags, depth readout, spec numbers, footer.
- **Inter** 300/400 — body copy.
- Fallbacks: Georgia/serif, system mono, system sans. Layout must survive fallback metrics.

## Motion — five systems

1. **Scroll-driven water color.** JS interpolates the background color from scroll depth; the viewport darkens on descent, lightens on ascent. CSS paints a static mid-depth gradient first; JS enhances.
2. **Parallax layers.** Light rays (fastest), far-water haze (slowest), mid-water bubbles — different scroll rates, `transform: translate3d` only.
3. **Canvas particle field.** Full-viewport marine snow, ~60–90 particles, subtle opacity, density thinning with depth.
4. **Depth gauge.** Fixed right rail (hidden < 900px) with tick marks and live readout (e.g. `12.4 m`); ticks light up when passed.
5. **Section reveals.** IntersectionObserver: fade + ~12px rise, once per section.

**Performance rails.** One `requestAnimationFrame` loop drives color, parallax, and particles — no per-scroll-event style writes. Canvas capped at `devicePixelRatio ≤ 2`. All animation pauses when the tab is hidden. Targets: Lighthouse Performance ≥ 90, Accessibility ≥ 95.

**Reduced motion.** `prefers-reduced-motion: reduce` gets a complete static experience: pre-painted gradient, no particles, no parallax, no ray animation. The depth readout stays (informational).

## Copy

Evocative diver-to-diver voice throughout ("no upsells at 30 metres", "See you down there"). Rules: every factual claim (300+ computers, UDDF 3.2, ZH-L16C, GPL-3.0, platform list) stays accurate; feature detail text may be lightly rewritten for tone but not for substance; final copy drafted during implementation using the approved mockup as the reference register.

## Architecture

- `index.html` — rewritten; semantic sections, same IDs; skip link and landmarks preserved.
- `styles.css` — rewritten visual system; download-section classes ported so existing JS keeps working.
- `script.js` — existing release-fetch/platform-detection code preserved as-is; motion engine appended as a clearly separated section (or a second file `ocean.js` — implementer's choice, favor whichever keeps `script.js` diffs minimal).

## Degradation ladder

- **JS disabled:** full content renders on the static CSS gradient; download falls back to GitHub releases page (as today).
- **Fonts unreachable:** system fallbacks; layout survives.
- **GitHub API rate-limited:** existing fallback behavior unchanged.
- **Canvas unavailable:** particles skipped silently; all else runs.

## Accessibility

- Contrast: each text opacity tier passes WCAG AA against the **lightest** water color it can ever sit on (surface teal is the worst case under scroll-driven color).
- Decorative layers (rays, particles, gauge rail, orb) are `aria-hidden`; depth labels remain real text.
- Skip link, focus-visible styles, alt text, semantic landmarks preserved from current site.

## Verification checklist (definition of done)

1. Local serve; walk 360 / 768 / 1120 / 1600 px in Chrome — layout, motion, and text readability at every scroll position.
2. Emulated `prefers-reduced-motion` pass — static experience is complete.
3. JS-off pass — content + fallback background intact.
4. Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
5. Download platform detection resolves correct links on macOS at minimum.
6. All pre-existing anchors (`#why`, `#features`, `#screens`, `#support`, `#download`) resolve.

## Out of scope

- `/lightroom` walkthrough and OAuth callback restyling (follow-up project).
- Light color scheme.
- Any backend, analytics, or build tooling.
