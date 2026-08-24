# Content Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Submersion homepage from a six-zone "logbook" pitch into a nine-zone, 60 m descent that presents Submersion as comprehensive dive software, in a factual diver-to-diver voice, with fresh screenshots from the live app.

**Architecture:** Static site, no build step. `index.html` is rewritten inside the existing zone skeleton (`.zone > .zone__inner.wrap > .zone__tag, h2, .zone__intro, content`). `styles.css` gains a `.features` item grid, a `.shot--wide` figure, a two-column `.shots--2` variant, and CSS-drawn rules for zone tags and gauge ticks; unused selectors are removed at the end. `ocean.js` changes one constant. `script.js` (download logic) is untouched.

**Tech Stack:** HTML, CSS, vanilla JS. Verification with `python3 -m http.server`, `grep`, `sips`, and the Playwright MCP browser tools. Screenshots via macOS `screencapture` against `/Applications/Submersion.app`.

**Spec:** `docs/superpowers/specs/2026-08-23-content-rewrite-design.md`

## Global Constraints

- Copy voice: second person, present tense, one idea per sentence, no metaphor or slogan in body copy. "Logbook" means the record, never the product.
- Every factual claim must match a row of the spec's "Verified claims" table. Never strengthen a claim.
- Required phrasings: "350+ models supported by libdivecomputer"; "computed from the profile" (never "real time"); "depth on the profile" (never "depth-tagged"); "Bluetooth only on iOS"; "your own iCloud, Google Drive, Dropbox or S3"; "11 languages"; "3,600 dive sites and 3,600 dive centers".
- Never mention: VPM-B, Lightroom, Suunto SML/DM5, Diving Log XML, Scubapro import, any v2.0 backlog item.
- Retired phrases that must not appear: "goes deeper", "Begin descent", "no upsells", "fine print", "Buddy check", "Clean on the surface", "See you down there", "submerse yourself", "the wall that dropped", "turtle".
- No em-dash (U+2014) or en-dash-as-punctuation anywhere in new text, code, comments, or commit messages. The existing dash glyphs in zone tags and gauge ticks are replaced by CSS pseudo-elements.
- Visual system unchanged: palette, fonts, motion engine, gauge styling, download block markup and IDs.
- Section IDs: `top`, `computer`, `log`, `sites`, `media`, `analyze`, `plan`, `data`, `download`. Legacy anchors `why`, `screens`, `features`, `support` must still resolve.
- Every `<img>` carries `width`/`height` equal to the file's pixel dimensions, `loading="lazy"`, `decoding="async"`, and descriptive `alt`.
- Screenshots come from the live app only. No mockups. Any capture showing a buddy's full name, a certification or card number, an email address, or a personal photo the user would not want public is recaptured or replaced.
- `<scratchpad>` below means `/private/tmp/claude-501/-Users-ericgriffin-repos-submersion-app-submersion-website/68e18c1c-9019-4b0d-8167-d3f0dbc11d84/scratchpad`. Helper scripts live there and are never committed.
- Commit after each task with the trailer lines used in this repo (`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` and the `Claude-Session:` line from the session).

---

### Task 0: Commit the pending legal-pages work

The working tree already holds finished, unrelated work (`privacy.html`, `terms.html`, their CSS, footer links, README line). Commit it first so the rewrite diff is clean.

**Files:**
- Commit as-is: `README.md`, `index.html`, `styles.css`, `privacy.html`, `terms.html`

- [ ] **Step 1: Confirm the diff is only the legal pages work**

Run: `git status --short && git diff --stat`
Expected: `M README.md`, `M index.html`, `M styles.css`, `?? privacy.html`, `?? terms.html`; the `index.html` diff is the footer links block and the CTA heading; the `styles.css` diff is the `Legal pages` section and `.footer__links`.

- [ ] **Step 2: Commit**

```bash
git add README.md index.html styles.css privacy.html terms.html
git commit -m "Add privacy and terms pages, link them from the footer"
```

---

### Task 1: Extend the gauge to 60 m and draw rules with CSS

**Files:**
- Modify: `index.html` (gauge ticks block, lines 60-72)
- Modify: `styles.css:102-107` (gauge tick styles), `styles.css:165-168` (zone tag)
- Modify: `ocean.js:4`

**Interfaces:**
- Produces: `.gauge__tick` elements whose text is the bare number (e.g. `10`), `data-depth` in metres; `.zone__tag` text is `6 m · From your computer` with no leading dash. Later tasks write zone tags in that form.

- [ ] **Step 1: Write the check script**

Create `/private/tmp/claude-501/-Users-ericgriffin-repos-submersion-app-submersion-website/68e18c1c-9019-4b0d-8167-d3f0dbc11d84/scratchpad/check_gauge.sh`:

```bash
#!/bin/zsh
set -e
cd /Users/ericgriffin/repos/submersion-app/submersion-website
fail=0
grep -q "MAX_DEPTH_M = 60" ocean.js || { echo "FAIL: MAX_DEPTH_M not 60"; fail=1; }
[ "$(grep -c 'class="gauge__tick"' index.html)" = "7" ] || { echo "FAIL: expected 7 ticks"; fail=1; }
grep -q 'data-depth="60"' index.html || { echo "FAIL: no 60 m tick"; fail=1; }
grep -n "gauge__tick\".*—" index.html && { echo "FAIL: dash glyph still in ticks"; fail=1; }
grep -q "gauge__tick::after" styles.css || { echo "FAIL: no CSS tick rule"; fail=1; }
grep -q "zone__tag::before" styles.css || { echo "FAIL: no CSS zone tag rule"; fail=1; }
[ $fail = 0 ] && echo "PASS"
exit $fail
```

Run: `chmod +x <path>/check_gauge.sh && <path>/check_gauge.sh`
Expected: FAIL lines for MAX_DEPTH_M, tick count, 60 m tick, CSS rules.

- [ ] **Step 2: Replace the gauge ticks in `index.html`**

Replace the whole `<div class="gauge__ticks">...</div>` block with:

```html
      <div class="gauge__ticks">
        <span class="gauge__tick" data-depth="0">0 m</span>
        <span class="gauge__tick" data-depth="10">10</span>
        <span class="gauge__tick" data-depth="20">20</span>
        <span class="gauge__tick" data-depth="30">30</span>
        <span class="gauge__tick" data-depth="40">40</span>
        <span class="gauge__tick" data-depth="50">50</span>
        <span class="gauge__tick" data-depth="60">60 m</span>
      </div>
```

- [ ] **Step 3: Update `ocean.js`**

Change line 4 from `const MAX_DEPTH_M = 40;` to `const MAX_DEPTH_M = 60;`.

- [ ] **Step 4: Add the CSS rules**

In `styles.css`, replace lines 106-107:

```css
.gauge__tick { transition: color 400ms ease; }
.gauge__tick--passed { color: var(--cyan); }
```

with:

```css
.gauge__tick { transition: color 400ms ease; white-space: nowrap; }
.gauge__tick::after {
  content: ""; display: inline-block; width: 10px; margin-left: 6px;
  border-top: 1px solid currentColor; vertical-align: middle;
}
.gauge__tick--passed { color: var(--cyan); }
```

and replace the `.zone__tag` rule (lines 165-168) with:

```css
.zone__tag {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--cyan-text); margin: 0 0 14px;
}
.zone__tag::before {
  content: ""; display: inline-block; width: 22px; margin-right: 12px;
  border-top: 1px solid currentColor; vertical-align: middle;
}
```

- [ ] **Step 5: Run the check**

Run: `<path>/check_gauge.sh`
Expected: `PASS`

- [ ] **Step 6: Visual check**

Run `python3 -m http.server 5173` in the background from the repo root. With the Playwright MCP tools: `browser_navigate` to `http://localhost:5173`, `browser_resize` 1440×900, `browser_take_screenshot`. Expected: right rail shows 0 m, 10, 20, 30, 40, 50, 60 m with a short horizontal rule after each label; readout says `0.0 m`. Scroll to the bottom (`browser_evaluate` `window.scrollTo(0, document.body.scrollHeight)`) and screenshot: readout reads `60.0 m`, all ticks cyan.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css ocean.js
git commit -m "Extend depth gauge to 60 m, draw tick and tag rules with CSS"
```

---

### Task 2: Add the layout CSS for feature grids and wide shots

**Files:**
- Modify: `styles.css` (insert after the `.thumbs` media query, line 210)

**Interfaces:**
- Produces classes used by Tasks 4-8: `.features` (grid of `<div class="feature"><h3>…</h3><p>…</p></div>`), `.features--3` (three columns at ≥ 900 px), `.subhead` (a mono label between two grids), `.shot--wide` (a `<figure>` with `<img>` and `<figcaption>` side by side), `.shots--2` (two-column screenshot grid, no stagger).

- [ ] **Step 1: Write the check**

Create a second script, `<scratchpad>/check_css.sh`:

```bash
#!/bin/zsh
cd /Users/ericgriffin/repos/submersion-app/submersion-website
fail=0
for sel in "\.features {" "\.features--3" "\.feature h3" "\.subhead" "\.shot--wide" "\.shots--2"; do
  grep -q "$sel" styles.css || { echo "FAIL: missing $sel"; fail=1; }
done
[ $fail = 0 ] && echo "PASS"
exit $fail
```

Run it. Expected: six FAIL lines.

- [ ] **Step 2: Add the CSS**

Insert after line 210 (`}` closing the `@media (max-width: 860px)` block for `.shots`/`.thumbs`):

```css
.shots--2 { grid-template-columns: repeat(2, 1fr); }
.shots--2 figure:nth-child(2) { transform: none; }
@media (max-width: 860px) { .shots--2 { grid-template-columns: 1fr; } }

/* ---------- Wide shot: one image with its caption beside it ---------- */
.shot--wide {
  display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 28px; align-items: end;
  margin: 48px 0 0;
}
.shot--wide img { border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
.shot--wide figcaption { font-size: 13px; color: var(--ink-faint); line-height: 1.6; padding-bottom: 6px; }
@media (max-width: 1000px) {
  .shot--wide { grid-template-columns: 1fr; gap: 12px; }
}

/* ---------- Feature grids ---------- */
.features { display: grid; grid-template-columns: 1fr 1fr; gap: 30px 40px; margin-top: 52px; }
.features--3 { grid-template-columns: repeat(3, 1fr); }
.feature { border-top: 1px solid var(--line); padding-top: 16px; }
.feature h3 {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--cyan-text); margin: 0 0 8px; font-weight: 500;
}
.feature p { margin: 0; color: var(--ink-muted); font-size: 14.5px; }
.subhead {
  font-family: var(--font-display); font-weight: 400; font-size: 22px;
  color: #d8f0f8; margin: 64px 0 0;
}
.subhead + .features { margin-top: 28px; }
@media (max-width: 900px) { .features--3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .features, .features--3 { grid-template-columns: 1fr; gap: 24px; } }
```

- [ ] **Step 3: Run the check**

Run: `check_css.sh`. Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "Add feature grid, wide shot, and two-column shot layouts"
```

---

### Task 3: Capture new screenshots from the live app

**Prerequisite (user action):** System Settings → Privacy & Security → Accessibility → enable **Ghostty** (the terminal hosting this session). Without it, `osascript` cannot move the window, click, or type. If it is not granted, follow the manual fallback in Step 2.

**Files:**
- Create: `screenshots/dive_detail.png`, `screenshots/dive_table.png`, `screenshots/site_detail.png`, `screenshots/marine_life.png`, `screenshots/certifications.png`, `screenshots/tissue_loading.png`, `screenshots/dive_3d.png`, `screenshots/planner.png`, `screenshots/gas_blender.png`, `screenshots/sync_settings.png`, `screenshots/themes.png`
- Delete: `screenshots/dives_overview.png`
- Helper (scratchpad, not committed): `winid` (already built at `<scratchpad>/winid`; source in `<scratchpad>/winid.swift`)

**Interfaces:**
- Produces: the eleven PNG files above at 2400 px wide, plus a dimensions list `<scratchpad>/dims.txt` (`name width height` per line) that Tasks 4-8 copy into `<img>` attributes.

App facts for navigation: sidebar items in order are Home, Dives, Sites, Trips, Media, Equipment, Buddies, Dive Centers, Certifications, Courses, Statistics, Planning, Transfer, GPS Log, Settings. Keyboard shortcuts: Cmd+1 Dives, Cmd+2 Sites, Cmd+3 Equipment, Cmd+4 Statistics, Cmd+5 Settings, Cmd+W back, Esc close. The app is currently in its dark theme; capture in whatever theme it is in and do not change settings. Never create, edit, or delete records; the only allowed state change is building a plan in the planner without saving it.

- [ ] **Step 1: Create the capture helper**

Create `<scratchpad>/cap.sh`:

```bash
#!/bin/zsh
# usage: cap.sh <name>   -> captures the Submersion window to <scratchpad>/raw/<name>.png
set -e
S=/private/tmp/claude-501/-Users-ericgriffin-repos-submersion-app-submersion-website/68e18c1c-9019-4b0d-8167-d3f0dbc11d84/scratchpad
mkdir -p "$S/raw" "$S/review"
osascript -e 'tell application "Submersion" to activate'
sleep 0.6
ID=$("$S/winid" Submersion | head -1 | awk '{print $1}')
[ -n "$ID" ] || { echo "no Submersion window"; exit 1; }
screencapture -l "$ID" -x "$S/raw/$1.png"
sips -Z 1000 "$S/raw/$1.png" --out "$S/review/$1.png" >/dev/null
echo "captured $1 (window $ID)"
```

`chmod +x` it. Also create `<scratchpad>/click.sh`:

```bash
#!/bin/zsh
# usage: click.sh <x> <y>   (screen coordinates, points)
osascript -e "tell application \"System Events\" to click at {$1, $2}"
```

and `<scratchpad>/key.sh`:

```bash
#!/bin/zsh
# usage: key.sh <key> [cmd|shift|cmd+shift]
case "$2" in
  cmd) mod='using command down';;
  shift) mod='using shift down';;
  cmd+shift) mod='using {command down, shift down}';;
  *) mod='';;
esac
osascript -e "tell application \"System Events\" to keystroke \"$1\" $mod"
```

- [ ] **Step 2: Position the window (or fall back to manual)**

Run:
```bash
osascript -e 'tell application "System Events" to tell process "Submersion" to set {position, size} of window 1 to {{120, 80}, {1440, 900}}'
```
Expected: no error, and `<scratchpad>/winid Submersion` prints `... 120 80 1440 900`.

If it prints `Access not allowed (-10003)`: Accessibility is not granted. Tell the user, and switch to the manual fallback for the rest of this task: for each capture below, describe the screen to the user, wait for them to say it is on screen, then run `cap.sh <name>`. Do not attempt clicks or keystrokes.

- [ ] **Step 3: Capture each screen**

For each entry: navigate, run `cap.sh <name>`, then view `<scratchpad>/review/<name>.png` with the Read tool and confirm the screen matches the description before moving on. Sidebar item positions, measured from the test capture: with the window's top-left at screen {120, 80}, the sidebar labels sit at screen x≈216 and y≈ 191 (Home), 235 (Dives), 278 (Sites), 323 (Trips), 367 (Media), 410 (Equipment), 455 (Buddies), 499 (Dive Centers), 542 (Certifications), 587 (Courses), 630 (Statistics), 674 (Planning), 719 (Transfer), 762 (GPS Log), 806 (Settings). These do not change when the window is resized, only when it is moved. Verify against a first capture (`cap.sh probe`, then view the review image) before relying on them, since spacing depends on the app's display zoom setting.

1. `dive_detail`: Cmd+1 (Dives). Click a dive in the list that has a computer profile and deco data (the list shows a sparkline for each). Expected: list on the left, detail pane on the right with header stats, profile, Deco Status, Oxygen Toxicity, Tissue Loading.
2. `dive_table`: on Dives, open the view switcher (the list-icon button in the Dives header, right of the search icon) and choose the table view. Expected: a column table of dives. Switch back to the card view afterwards.
3. `site_detail`: Cmd+2 (Sites). Click a site with coordinates. If a bathymetry or terrain toggle exists in the detail, enable it. Expected: site record with map and depth/difficulty fields. If no site shows bathymetry, capture the plain site detail and note it in the task report.
4. `marine_life`: Cmd+4 (Statistics), click "Marine Life" in the statistics list. Expected: species sightings summary. If your logbook has no sightings, instead capture Dives → any dive → its Marine Life section, and note it.
5. `certifications`: click Certifications in the sidebar. If a "wallet" or card view exists, use it. Expected: cards with agency and level. Review closely for card numbers; if numbers are visible and cannot be collapsed, discard this capture and use `courses` (Courses page) instead, and note it.
6. `tissue_loading`: from `dive_detail`, click the expand icon on the Tissue Loading panel (or scroll the detail so the Deco Status, Oxygen Toxicity and Tissue Loading panels fill the pane). Expected: the 16-compartment bar chart and the compartment heat map large.
7. `dive_3d`: from the dive detail, open the 3D view (a cube/3D icon in the profile header or the profile's overflow menu). Expected: the 3D scene of the dive. If no 3D control is found, open the dive's overflow menu (⋮ top right) and look there.
8. `planner`: click Planning in the sidebar. If a saved plan exists, open it; otherwise start a new plan and add two segments (for example 40 m for 20 min on 21/35 with a 50 % deco gas) without saving. Expected: the plan profile with segments and the deco schedule. Close without saving (Cmd+W or Esc, choose Discard if asked).
9. `gas_blender`: from Planning (or the Home page tools), open the gas blender; if it is not reachable from Planning, open Settings (Cmd+5) and look for Tools / Calculators. Expected: the blender or one of the MOD/best-mix calculators. Note which one you got.
10. `sync_settings`: Cmd+5 (Settings), open Sync (or Backup). Expected: the provider list (iCloud, Google Drive, Dropbox, S3) or the backup targets. Check for any visible account email or bucket name; if present, capture the Export section (Transfer in the sidebar) instead and note it.
11. `themes`: Settings → Appearance → theme gallery. Expected: the five theme previews.

- [ ] **Step 4: Privacy review**

View every `<scratchpad>/review/*.png` with the Read tool. Reject any capture that shows a buddy's full name, a certification or card number, an email address, a bucket name, or a personal photo that is not already on the current site. Recapture with the panel collapsed or choose the alternative listed above. Record decisions in the task report.

- [ ] **Step 5: Process to 2400 px and record dimensions**

```bash
S=<scratchpad>; cd /Users/ericgriffin/repos/submersion-app/submersion-website
: > $S/dims.txt
for n in dive_detail dive_table site_detail marine_life certifications tissue_loading dive_3d planner gas_blender sync_settings themes; do
  [ -f $S/raw/$n.png ] || { echo "missing $n"; continue; }
  sips -Z 2400 $S/raw/$n.png --out screenshots/$n.png >/dev/null
  w=$(sips -g pixelWidth screenshots/$n.png | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight screenshots/$n.png | awk '/pixelHeight/{print $2}')
  echo "$n $w $h" >> $S/dims.txt
done
cat $S/dims.txt
git rm -q screenshots/dives_overview.png
```

Expected: eleven lines, each width 2400.

- [ ] **Step 6: Commit**

```bash
git add screenshots
git commit -m "Capture eleven new app screenshots, retire dives_overview"
```

Report: which captures were substituted (and why), and the contents of `dims.txt`.

---

### Task 4: Rewrite head, nav, hero, and the 6 m zone

**Files:**
- Modify: `index.html` (head lines 9-19; nav lines 75-91; hero lines 93-106; replace the `#why` section)

**Interfaces:**
- Consumes: `dims.txt` from Task 3 (not needed for this task's image, which is the existing `computer_import.png` 2400×1720).
- Produces: nav link set and the hero; the pattern each later zone follows.

- [ ] **Step 1: Write the copy check script**

Create `<scratchpad>/check_copy.sh`:

```bash
#!/bin/zsh
cd /Users/ericgriffin/repos/submersion-app/submersion-website
fail=0
for bad in "goes deeper" "Begin descent" "no upsells" "fine print" "Buddy check" "Clean on the surface" "See you down there" "submerse yourself" "the wall that dropped" "turtle" "real time" "real-time" "depth-tagged" "VPM" "Lightroom" "Suunto" "Scubapro" "logbook that" "Dive Log</title>"; do
  grep -qi -- "$bad" index.html && { echo "FAIL: found '$bad'"; fail=1; }
done
grep -q "—" index.html && { echo "FAIL: em-dash present"; fail=1; }
for id in top computer log sites media analyze plan data download why screens features support; do
  grep -q "id=\"$id\"" index.html || { echo "FAIL: missing id $id"; fail=1; }
done
for req in "350+ models" "Bluetooth only on iOS" "computed from the profile" "11 languages" "3,600 dive sites" "GPL-3.0"; do
  grep -q -- "$req" index.html || { echo "FAIL: missing required phrase '$req'"; fail=1; }
done
[ $fail = 0 ] && echo "PASS"
exit $fail
```

Run it. Expected: FAIL lines (retired phrases present, new ids missing).

- [ ] **Step 2: Replace the head metadata**

Replace lines 9-19 (`<title>` through the `og:type` meta) with:

```html
    <title>Submersion</title>
    <meta
      name="description"
      content="Submersion is free, open-source dive software for recreational and technical divers: dive computer download, logging, profile analysis with Bühlmann tissue loading, OC and rebreather planning, gas calculators, sites and maps, gear, photos, and encrypted sync through your own cloud. iOS, Android, macOS, Windows, Linux."
    />

    <meta property="og:title" content="Submersion: dive software for the whole dive" />
    <meta
      property="og:description"
      content="Free, open-source dive software. 350+ dive computers, Bühlmann ZH-L16C with gradient factors, OC/CCR/SCR planning, UDDF 3.2 and nine other import formats, end-to-end encrypted sync through your own cloud. No accounts."
    />
    <meta property="og:type" content="website" />
```

- [ ] **Step 3: Replace the nav links**

Replace the `<div class="nav__links">…</div>` block with:

```html
        <div class="nav__links">
          <a href="#computer">Computer</a>
          <a href="#log">Log</a>
          <a href="#sites">Sites</a>
          <a href="#analyze">Analyze</a>
          <a href="#plan">Plan</a>
          <a href="#data">Data</a>
          <a href="#download">Download</a>
          <a href="https://github.com/submersion-app/submersion" target="_blank" rel="noreferrer">GitHub</a>
        </div>
```

- [ ] **Step 4: Replace the hero**

Replace the `<section class="hero">…</section>` block with:

```html
      <section class="hero">
        <div class="zone__inner wrap">
          <p class="eyebrow">Free · Open source · iOS · Android · macOS · Windows · Linux</p>
          <h1>One app for everything you do around a <em>dive</em>.</h1>
          <p class="lead">
            Download your computer, check the deco on the profile, plan tomorrow's dive with the gas
            you actually have, log who you dove with and what you saw, and keep every bit of it on
            your own hardware. Rec or tech, single tank or rebreather, it all fits in the same
            logbook.
          </p>
          <div class="cta-row">
            <a class="btn" href="#download">Download</a>
            <a class="btn btn--ghost" href="https://github.com/submersion-app/submersion" target="_blank" rel="noreferrer">Source on GitHub</a>
          </div>
        </div>
      </section>
```

- [ ] **Step 5: Replace the `#why` section with the 6 m zone**

Replace the entire `<section class="zone" id="why">…</section>` with:

```html
      <section class="zone" id="computer">
        <div class="zone__inner wrap">
          <p class="zone__tag">6 m · From your computer</p>
          <h2>Start with what your <em>computer</em> recorded.</h2>
          <p class="zone__intro">
            Pair over Bluetooth or plug in over USB, download, review what came in, done. After the
            first time, only new dives come across.
          </p>
          <figure class="shot--wide">
            <img src="screenshots/computer_import.png" alt="Dive computer download review step showing a 70 percent match against an existing dive, both profiles overlaid, and four resolution actions" width="2400" height="1720" loading="lazy" decoding="async" />
            <figcaption>The review step of a download: a likely duplicate shown against the existing dive, both profiles overlaid, and the four ways to resolve it.</figcaption>
          </figure>
          <div class="features">
            <div class="feature">
              <h3>350+ models</h3>
              <p>Submersion bundles libdivecomputer. That gives it the 350+ models supported by libdivecomputer, from 37 manufacturers, over Bluetooth LE and USB. The project has confirmed the Shearwater Teric and the Aqualung i300C and i330R and is looking for testers for the rest. Bluetooth only on iOS.</p>
            </div>
            <div class="feature">
              <h3>Incremental downloads</h3>
              <p>Submersion remembers the last dive it took from each computer and fetches only what is new.</p>
            </div>
            <div class="feature">
              <h3>Duplicate review</h3>
              <p>A download that looks like a dive you already have is shown next to it. Skip it, import it as a new dive, replace the earlier source, or keep both computers' readings on one dive.</p>
            </div>
            <div class="feature">
              <h3>Two computers, one dive</h3>
              <p>Wear a backup? Both downloads attach to the same dive, and you can put their profiles on one chart.</p>
            </div>
          </div>
          <h3 class="subhead">Already have a logbook somewhere else?</h3>
          <div class="features">
            <div class="feature">
              <h3>Import files</h3>
              <p>Subsurface, MacDive, Shearwater Cloud, Garmin FIT, DAN DL7, Ratio and UDDF files import directly. CSV comes with presets for MySSI, Diving Log, DiveMate, Garmin Connect and Shearwater Cloud, or map the columns yourself.</p>
            </div>
            <div class="feature">
              <h3>Apple Health</h3>
              <p>Underwater workouts recorded by an Apple Watch import on iOS with depth, temperature and heart rate.</p>
            </div>
            <div class="feature">
              <h3>Paper logbooks</h3>
              <p>Scan the pages and Submersion reads the entries with OCR so you can check them and import them.</p>
            </div>
            <div class="feature">
              <h3>Open formats</h3>
              <p>Everything you import can leave again as UDDF 3.2, CSV, Excel or PDF.</p>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 6: Run the copy check**

Run: `check_copy.sh`. Expected: still FAIL on the ids `log sites media analyze plan data why screens features support` and on phrases belonging to later zones (`computed from the profile`, `11 languages`, `3,600 dive sites`); no FAIL for a retired phrase inside the head, nav, hero, or `#computer` section. (The remaining old sections still contain retired phrases; they go in Tasks 5-8.)

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Rewrite head, nav, hero, and the dive computer zone"
```

---

### Task 5: Write the 12 m and 18 m zones

**Files:**
- Modify: `index.html` (replace the `#screens` section)

**Interfaces:**
- Consumes: `dims.txt` for `dive_detail`, `dive_table`, `site_detail`, `marine_life`. Replace the `WIDTH`/`HEIGHT` placeholders below with the recorded values before saving; the check in Step 3 fails if any placeholder remains.

- [ ] **Step 1: Replace the `#screens` section with two zones**

```html
      <section class="zone" id="log">
        <span id="screens"></span>
        <div class="zone__inner wrap">
          <p class="zone__tag">12 m · The log</p>
          <h2>A record with room for <em>everything</em>.</h2>
          <p class="zone__intro">
            Every field is optional. A quick reef dive needs a site, a depth and a time. A staged
            decompression dive can carry every gas switch, setpoint and signature.
          </p>
          <div class="shots shots--2">
            <figure>
              <img src="screenshots/dive_detail.png" alt="Dive list beside a dive detail pane with header statistics, the dive profile with events, deco status, oxygen exposure and tissue loading" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>A dive's detail pane: header stats, the profile with events, deco status, oxygen exposure and tissue loading.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/dive_table.png" alt="Dive log table view with configurable columns" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>The table view, with the columns you choose.</figcaption>
            </figure>
          </div>
          <div class="features">
            <div class="feature">
              <h3>Conditions</h3>
              <p>Visibility, current, swell, water and air temperature, entry and exit method, altitude. Weather is fetched for the date and place. Tides come from a bundled global model and work offline.</p>
            </div>
            <div class="feature">
              <h3>People</h3>
              <p>Buddies, divemaster, your own role on the dive, dive center, operator and boat. A buddy or instructor can sign the dive on your screen.</p>
            </div>
            <div class="feature">
              <h3>Gases and cylinders</h3>
              <p>Any number of cylinders per dive, each with its oxygen and helium fraction, start and end pressure, and the pressure trace from an air-integrated transmitter. Gas switches are marked on the profile.</p>
            </div>
            <div class="feature">
              <h3>Weights</h3>
              <p>What you carried, where you put it, and whether it felt right. The weight planner learns from this.</p>
            </div>
            <div class="feature">
              <h3>Your own fields</h3>
              <p>Tags with colors, star ratings, favorites, dive types you define, and custom fields for whatever your agency or your habits call for.</p>
            </div>
            <div class="feature">
              <h3>Views</h3>
              <p>Cards, or a table with the columns you choose, sortable and saved. Bulk edit fixes a whole trip's entries at once.</p>
            </div>
            <div class="feature">
              <h3>Safety review</h3>
              <p>After each dive Submersion checks the profile for fast ascents, sawtooth patterns and missed safety stops, and lists what it found.</p>
            </div>
            <div class="feature">
              <h3>Several divers</h3>
              <p>Separate profiles for each diver who uses the app, each with emergency contacts, medical notes and insurance details.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="zone" id="sites">
        <div class="zone__inner wrap">
          <p class="zone__tag">18 m · Where you dove</p>
          <h2>Sites, trips, and the <em>map</em> between them.</h2>
          <p class="zone__intro">
            Submersion ships with 3,600 dive sites and 3,600 dive centers from OpenStreetMap, so most
            places you dive are already on the map. Add your own with a tap.
          </p>
          <div class="shots">
            <figure>
              <img src="screenshots/sites_map.png" alt="Dive site list beside an interactive map with clustered markers and a dive heat map" width="2400" height="1477" loading="lazy" decoding="async" />
              <figcaption>Sites beside the map, with clustering and the heat map on.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/site_detail.png" alt="Dive site record with map, depth range and difficulty" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>A site record with its location, depth range and conditions.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/marine_life.png" alt="Marine life statistics with species sightings" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>Species sightings across the log.</figcaption>
            </figure>
          </div>
          <div class="features features--3">
            <div class="feature">
              <h3>Site records</h3>
              <p>GPS with reverse geocoding, depth range, difficulty, water type, hazards, access notes, mooring and parking. Dives logged at the same spot are matched to one site, and duplicates can be merged.</p>
            </div>
            <div class="feature">
              <h3>Maps</h3>
              <p>Marker clustering, a heat map of where you dive most, and downloadable regions so the map works on the boat without a signal.</p>
            </div>
            <div class="feature">
              <h3>Underwater terrain</h3>
              <p>Bathymetry overlays on the map, and a 3D terrain view of a site with the features you place on it.</p>
            </div>
            <div class="feature">
              <h3>Reef data</h3>
              <p>Protection status, habitat, bleaching alerts and reef health for the sites you visit.</p>
            </div>
            <div class="feature">
              <h3>Marine life</h3>
              <p>511 species built in. Record sightings per dive, see what lives at each site, and tag species in photos.</p>
            </div>
            <div class="feature">
              <h3>Trips</h3>
              <p>Dates, resort or liveaboard, an itinerary by day, preparation checklists, and a gallery for the whole trip.</p>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Fill the dimensions**

For each of `dive_detail`, `dive_table`, `site_detail`, `marine_life`, take `width height` from `<scratchpad>/dims.txt` and replace that image's `WIDTH`/`HEIGHT`. If Task 3 substituted a file (for example `courses` for `certifications`), use the substituted file name and adjust the alt text and caption to describe it.

- [ ] **Step 3: Check**

Run: `grep -n 'WIDTH\|HEIGHT' index.html` Expected: no output. Run `check_copy.sh`. Expected: FAIL only for ids `media analyze plan data why features support` and phrases from later zones.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Write the log and sites zones"
```

---

### Task 6: Write the 24 m and 32 m zones

**Files:**
- Modify: `index.html` (replace the `#features` section)

**Interfaces:**
- Consumes: `dims.txt` for `certifications`, `tissue_loading`, `dive_3d`.

- [ ] **Step 1: Replace the `#features` section with two zones**

```html
      <section class="zone" id="media">
        <div class="zone__inner wrap">
          <p class="zone__tag">24 m · Photos, gear and paperwork</p>
          <h2>The rest of what a dive <em>leaves behind</em>.</h2>
          <p class="zone__intro">
            Photos and video, the gear you wore, and the cards that say you are allowed to.
          </p>
          <div class="shots">
            <figure>
              <img src="screenshots/photo_gallery.png" alt="Photo and video gallery for a dive with each shot placed on the dive profile" width="2400" height="1636" loading="lazy" decoding="async" />
              <figcaption>A dive's photos and video, each placed on the profile at the moment it was taken.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/equipment_sets.png" alt="Equipment sets screen showing a warm water gear configuration" width="2400" height="1636" loading="lazy" decoding="async" />
              <figcaption>Equipment sets: build a configuration once, apply it to a dive.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/certifications.png" alt="Certification wallet showing agency and level for each card" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>The certification wallet.</figcaption>
            </figure>
          </div>
          <div class="features features--3">
            <div class="feature">
              <h3>Photos and video</h3>
              <p>Import from the device gallery, watched folders, a network share, or your own iCloud, Google Drive, Dropbox or S3 bucket. Each shot is matched to a dive by capture time and shown as a marker at its depth on the profile.</p>
            </div>
            <div class="feature">
              <h3>Equipment</h3>
              <p>Every item with brand, model, serial, purchase date and cost. Service schedules with reminders, and a service log of what was done and what it cost.</p>
            </div>
            <div class="feature">
              <h3>Equipment sets</h3>
              <p>Warm water, cold water, sidemount: build sets and apply one to a dive. A set can select itself by location.</p>
            </div>
            <div class="feature">
              <h3>Certifications</h3>
              <p>A wallet of your cards with photos of front and back, agency, level, number and expiry.</p>
            </div>
            <div class="feature">
              <h3>Courses</h3>
              <p>Track a course's requirements and link each one to the dive that satisfied it.</p>
            </div>
            <div class="feature">
              <h3>Pre-dive checklists</h3>
              <p>Run a checklist from a template before the dive and attach the session to the log.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="zone" id="analyze">
        <span id="features"></span>
        <div class="zone__inner wrap">
          <p class="zone__tag">32 m · Reading the profile</p>
          <h2>Every sample, and what it <em>means</em>.</h2>
          <p class="zone__intro">
            Your computer recorded a depth every few seconds. Submersion turns that into
            decompression state, gas exposure and ascent behaviour, computed from the profile, that
            you can scrub through second by second.
          </p>
          <figure class="shot--wide">
            <img src="screenshots/profile_player.png" alt="Full-screen dive profile playback with depth, temperature, NDL, ppO2 and tank pressure over time" width="2400" height="1669" loading="lazy" decoding="async" />
            <figcaption>Full-screen playback with depth, temperature, NDL, ppO₂ and tank pressure on one timeline.</figcaption>
          </figure>
          <div class="shots shots--2">
            <figure>
              <img src="screenshots/tissue_loading.png" alt="Tissue loading panel with a bar per compartment and a heat map of on-gassing and off-gassing over the dive" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>Tissue loading for all 16 compartments, and how each one loaded and unloaded through the dive.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/dive_3d.png" alt="Three-dimensional view of a dive profile" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>The dive in three dimensions.</figcaption>
            </figure>
          </div>
          <div class="features">
            <div class="feature">
              <h3>Playback</h3>
              <p>Play or scrub the profile. Overlay temperature, tank pressure, heart rate, SAC, ppO₂, ppN₂ and ppHe, gas density, gradient factor, surface GF, TTS, ceiling, NDL and deco stops, and choose which of them you want to see.</p>
            </div>
            <div class="feature">
              <h3>Bühlmann ZH-L16C</h3>
              <p>Tissue loading for all 16 compartments, nitrogen and helium, computed from the profile with the gradient factors you set. Watch the leading compartment change as the dive goes on.</p>
            </div>
            <div class="feature">
              <h3>Oxygen exposure</h3>
              <p>CNS and OTU for the dive, plus running totals for the day and the week, using the calculation method you prefer.</p>
            </div>
            <div class="feature">
              <h3>Computer versus model</h3>
              <p>Show the NDL, ceiling and TTS your computer reported next to what the model says, and switch between them.</p>
            </div>
            <div class="feature">
              <h3>Two computers</h3>
              <p>Overlay the profiles from two computers on one chart and see where they disagree.</p>
            </div>
            <div class="feature">
              <h3>Edit</h3>
              <p>Trim a profile that started on the boat, with undo if you get it wrong.</p>
            </div>
            <div class="feature">
              <h3>3D</h3>
              <p>Move through the dive in three dimensions, or view the 16 tissue compartments as a surface that rises and falls with the dive.</p>
            </div>
            <div class="feature">
              <h3>Ascent rate</h3>
              <p>Ascent speed is drawn on the profile and colored where it exceeds the limits.</p>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Fill the dimensions and run the checks**

Replace `WIDTH`/`HEIGHT` for `certifications`, `tissue_loading`, `dive_3d` from `dims.txt` (or the substituted files). Run `grep -n 'WIDTH\|HEIGHT' index.html` (expect nothing) and `check_copy.sh` (expect FAIL only for ids `plan data why support` and later-zone phrases).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Write the media and profile analysis zones"
```

---

### Task 7: Write the 40 m and 50 m zones

**Files:**
- Modify: `index.html` (replace the `#support` section)

**Interfaces:**
- Consumes: `dims.txt` for `planner`, `gas_blender`, `sync_settings`, `themes`.

- [ ] **Step 1: Replace the `#support` section with two zones**

```html
      <section class="zone" id="plan">
        <div class="zone__inner wrap">
          <p class="zone__tag">40 m · Planning</p>
          <h2>Plan with the gas, gear and tissues you'll <em>actually</em> have.</h2>
          <p class="zone__intro">
            The same decompression model as the analysis, run forward. Recreational divers get an
            NDL solver. Technical divers get segments, setpoints and bailout.
          </p>
          <div class="shots shots--2">
            <figure>
              <img src="screenshots/planner.png" alt="Dive planner with a multi-segment profile, gas list and decompression schedule" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>A plan as segments, with the schedule the model produces.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/gas_blender.png" alt="Gas blending calculator" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>The gas blender.</figcaption>
            </figure>
          </div>
          <div class="features">
            <div class="feature">
              <h3>The planner</h3>
              <p>Build the dive as segments, or drag the profile into shape. Cylinders, gases and switches come from your own tank presets and cylinder configurations.</p>
            </div>
            <div class="feature">
              <h3>Open circuit and rebreathers</h3>
              <p>OC, CCR, SCR and PSCR, with setpoints by depth, and the mode switchable partway through the plan for a bailout.</p>
            </div>
            <div class="feature">
              <h3>Bailout check</h3>
              <p>For a CCR plan, Submersion works out open-circuit demand along the whole profile and checks your bailout cylinders against the worst moment, with real-gas correction.</p>
            </div>
            <div class="feature">
              <h3>Contingencies</h3>
              <p>Contingency scenarios next to the main plan, and a range table of depth against time.</p>
            </div>
            <div class="feature">
              <h3>Repetitive dives</h3>
              <p>Seed the plan with the tissues from the dive you just logged, or use the surface interval tool to see how long to wait.</p>
            </div>
            <div class="feature">
              <h3>Weighting</h3>
              <p>The weight planner builds a buoyancy model from your logged dives and predicts what to carry for a new suit, cylinder or water type.</p>
            </div>
            <div class="feature">
              <h3>Gas calculators</h3>
              <p>MOD, best mix, maximum narcotic depth, consumption and rock bottom. The blender works out partial-pressure fills with a real-gas equation and prints the invoice.</p>
            </div>
            <div class="feature">
              <h3>On the slate</h3>
              <p>Export the plan as a PDF for your wet notes.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="zone" id="data">
        <span id="why"></span>
        <div class="zone__inner wrap">
          <p class="zone__tag">50 m · Your data</p>
          <h2>On your devices, encrypted, in formats you can <em>leave with</em>.</h2>
          <p class="zone__intro">
            Submersion has no server and no accounts. Your logbook is a database on your own
            hardware. Sync and backup go through cloud storage you already own.
          </p>
          <div class="shots">
            <figure>
              <img src="screenshots/statistics.png" alt="Dive statistics overview in dark mode with totals, personal records and most visited sites" width="2400" height="1636" loading="lazy" decoding="async" />
              <figcaption>Statistics: totals, records, and nine more pages behind them.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/sync_settings.png" alt="Sync settings listing the supported cloud storage providers" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>Sync through your own cloud storage.</figcaption>
            </figure>
            <figure>
              <img src="screenshots/themes.png" alt="Theme gallery showing the five app themes" width="WIDTH" height="HEIGHT" loading="lazy" decoding="async" />
              <figcaption>Five themes, each in light and dark.</figcaption>
            </figure>
          </div>
          <div class="features">
            <div class="feature">
              <h3>Local and encrypted</h3>
              <p>An SQLite database encrypted at rest, with Face ID, Touch ID or a passphrase to open the app.</p>
            </div>
            <div class="feature">
              <h3>Sync</h3>
              <p>End-to-end encrypted sync between your devices through your own iCloud, Google Drive, Dropbox or S3-compatible storage. A recovery code unlocks it on a new device.</p>
            </div>
            <div class="feature">
              <h3>Backups</h3>
              <p>Encrypted backups to the same places, an automatic backup before every upgrade, and restore from any of them.</p>
            </div>
            <div class="feature">
              <h3>Export</h3>
              <p>UDDF 3.2, CSV, Excel, KML and GPX, and printable PDF logbooks in Simple, Detailed, Professional, PADI and NAUI layouts.</p>
            </div>
            <div class="feature">
              <h3>Data quality</h3>
              <p>An assistant that finds duplicates and anomalies across the log and walks you through fixing them.</p>
            </div>
            <div class="feature">
              <h3>Your units, your language</h3>
              <p>Independent units for depth, temperature, pressure, volume, weight, altitude and SAC. 11 languages. Five themes in light and dark. Keyboard shortcuts on the desktop.</p>
            </div>
            <div class="feature">
              <h3>Statistics</h3>
              <p>Ten pages: totals and records, progression, conditions, gas, marine life, geography, social, time patterns, equipment and profile analysis.</p>
            </div>
            <div class="feature">
              <h3>Open source</h3>
              <p>GPL-3.0, with the whole source on GitHub. No ads, no subscription, no in-app purchases.</p>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Fill the dimensions and run the checks**

Replace `WIDTH`/`HEIGHT` for `planner`, `gas_blender`, `sync_settings`, `themes` from `dims.txt` (or substituted files; if `gas_blender` turned out to be a calculator, rename the caption and alt to say which). Run `grep -n 'WIDTH\|HEIGHT' index.html` (expect nothing) and `check_copy.sh` (expect FAIL only for id `support` and any retired phrase still in the download zone).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Write the planning and data zones"
```

---

### Task 8: Rewrite the download zone and footer

**Files:**
- Modify: `index.html` (the `abyss` section: tag, heading, intro, add support paragraph, footer text)
- Modify: `styles.css` (one rule for `.download__support`)

- [ ] **Step 1: Edit the download zone**

In the `<section class="zone abyss" id="download">` block:

Replace
```html
          <p class="zone__tag">— 40 m · The Abyss</p>
          <div class="orb" aria-hidden="true"></div>
          <h2>Ready to <em>submerse</em> yourself?</h2>
          <p class="zone__intro">
            Free and open source on every platform. No account. No subscription. Just your logbook,
            the way it should be.
          </p>
```
with
```html
          <span id="support"></span>
          <p class="zone__tag">60 m · Download</p>
          <div class="orb" aria-hidden="true"></div>
          <h2>Get <em>Submersion</em>.</h2>
          <p class="zone__intro">
            Free on every platform. Desktop and Android builds are on GitHub Releases. iOS is on the
            App Store.
          </p>
```

Immediately before `<footer class="footer">`, insert:
```html
          <p class="download__support">
            Found a bug, or want something added?
            <a href="https://github.com/submersion-app/submersion/issues" target="_blank" rel="noreferrer">Open an issue on GitHub</a>.
            For anything else, <a href="mailto:support@submersion.app">support@submersion.app</a>.
          </p>
```

Replace the footer's first line
```html
            © <span data-year></span> Submersion · GPL-3.0 · See you down there
```
with
```html
            © <span data-year></span> Submersion · GPL-3.0
```

- [ ] **Step 2: Add the support style**

In `styles.css`, after the `.download__fallback a:hover` rule, add:

```css
.download__support { margin: 44px auto 0; max-width: 48ch; font-size: 14px; color: var(--ink-muted); }
```

- [ ] **Step 3: Run the copy check**

Run: `check_copy.sh`. Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "Rewrite the download zone, move support links into it"
```

---

### Task 9: Remove unused CSS, update the README

**Files:**
- Modify: `styles.css` (delete `.pillars`, `.pillar*`, `.specs`, `.spec*`, `.detail*`, `.thumbs`, `.thumb*` rules and the `.thumbs` line inside the 860 px media query)
- Modify: `README.md`

- [ ] **Step 1: Confirm the selectors are unused**

Run: `grep -c 'class="pillar\|class="spec\|class="detail\|class="thumb' index.html privacy.html terms.html`
Expected: `0` for every file.

- [ ] **Step 2: Delete the dead rules**

Remove the `/* ---------- Why: pillars ---------- */` block (lines 179-190 in the original), the `.thumbs` / `.thumb` / `.thumb img` / `.thumb figcaption` rules and the `.thumbs { grid-template-columns: repeat(2, 1fr); }` line inside the 860 px media query, and the whole `/* ---------- Features: specs + detail ---------- */` block (`.specs`, `.spec`, `.spec strong`, `.spec span`, `.detail`, `.detail h3`, `.detail p`, and the `.detail` 700 px media query). Do not touch any other rule.

- [ ] **Step 3: Verify nothing else referenced them**

Run: `for s in pillars pillar specs spec detail thumbs thumb; do grep -n "\.$s\b" styles.css; done`
Expected: no output.

- [ ] **Step 4: Update `README.md`**

Replace the `## Structure` section with:

```markdown
## Structure

- `index.html`: the homepage. Nine zones from 0 to 60 m: hero, dive computer download and import, the log, sites and trips, photos and gear, profile analysis, planning, your data, download. Section ids are `computer`, `log`, `sites`, `media`, `analyze`, `plan`, `data`, `download`; the older `why`, `screens`, `features`, `support` anchors still resolve.
- `privacy.html`, `terms.html`: Privacy Policy and Terms of Service (mirrors of `PRIVACY.md` / `TERMS.md` in the app repo; linked from the footer)
- `styles.css`: the visual system (dark-only, zone layouts, feature grids, gauge)
- `ocean.js`: scroll-driven water color, parallax, marine snow, the depth gauge, and section reveals
- `script.js`: release lookup and platform-detecting download button
- `screenshots/`: window captures of the macOS app at 2400 px wide, used on the page
- `assets/`: logo, favicon, App Store badge
- `docs/superpowers/specs/`: design specs for the site (the copy rules and verified-claims table live in the 2026-08-23 spec)
```

- [ ] **Step 5: Commit**

```bash
git add styles.css README.md
git commit -m "Remove unused layout CSS, describe the new page structure in README"
```

---

### Task 10: Verification pass

**Files:** none modified unless a check fails; fixes are committed with a message naming the check.

- [ ] **Step 1: Static checks**

Run `check_gauge.sh`, `check_css.sh`, `check_copy.sh`. Expected: `PASS` from all three.

- [ ] **Step 2: Image dimensions match files**

```bash
cd /Users/ericgriffin/repos/submersion-app/submersion-website
grep -o 'src="screenshots/[^"]*" alt="[^"]*" width="[0-9]*" height="[0-9]*"' index.html | while read -r line; do
  f=$(echo "$line" | sed -E 's/.*src="([^"]*)".*/\1/'); w=$(echo "$line" | sed -E 's/.*width="([0-9]*)".*/\1/'); h=$(echo "$line" | sed -E 's/.*height="([0-9]*)".*/\1/')
  rw=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}'); rh=$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')
  [ "$w" = "$rw" ] && [ "$h" = "$rh" ] && echo "ok $f" || echo "MISMATCH $f html=${w}x${h} file=${rw}x${rh}"
done
ls screenshots | while read -r f; do grep -q "screenshots/$f" index.html || echo "UNUSED screenshots/$f"; done
```
Expected: `ok` for every image, no MISMATCH, no UNUSED.

- [ ] **Step 3: Anchors resolve**

With the local server running, use Playwright `browser_navigate` to `http://localhost:5173/` then `browser_evaluate`:
```js
() => ['top','computer','log','sites','media','analyze','plan','data','download','why','screens','features','support'].filter(id => !document.getElementById(id))
```
Expected: `[]`. Also click each nav link (`browser_click` on the link text) and confirm the page scrolls (the depth readout changes).

- [ ] **Step 4: Responsive walk**

For each width in 360×800, 768×1024, 1120×800, 1600×1000: `browser_resize`, then take screenshots at the top and after scrolling to each of `#computer`, `#log`, `#sites`, `#media`, `#analyze`, `#plan`, `#data`, `#download` (`browser_evaluate` `document.getElementById('x').scrollIntoView()`). Look for: text overflowing its column, `.shot--wide` captions colliding with images below 1000 px, `.features--3` collapsing to two then one column, the nav hidden below 700 px, and no horizontal scrollbar (`browser_evaluate` `document.documentElement.scrollWidth <= window.innerWidth` must be `true` at every width).

- [ ] **Step 5: Reduced motion and JS off**

Playwright: `browser_run_code_unsafe` with `page.emulateMedia({ reducedMotion: 'reduce' })`, reload, screenshot: page fully visible, depth readout present. Then load with JavaScript disabled (`context.route` is not needed; use `page.setJavaScriptEnabled(false)` via `browser_run_code_unsafe` on a new page): all zones visible on the static gradient, download button links to the GitHub releases page.

- [ ] **Step 6: Lighthouse**

Run: `npx --yes lighthouse http://localhost:5173 --only-categories=performance,accessibility --chrome-flags="--headless" --output=json --output-path=<scratchpad>/lh.json --quiet && python3 -c "import json;d=json.load(open('<scratchpad>/lh.json'))['categories'];print({k:round(v['score']*100) for k,v in d.items()})"`
Expected: accessibility ≥ 95, performance ≥ 90. If accessibility fails, the usual causes are contrast on `.feature h3` (use `--cyan-text`, already AA on surface teal) or missing alt text; fix and rerun.

- [ ] **Step 7: Download button**

In Playwright at 1440×900, read the primary button: `browser_evaluate` `() => document.getElementById('download-primary').href`. Expected: a GitHub release asset ending in `-macOS.dmg`, or the releases page if the API was rate-limited (same fallback as before).

- [ ] **Step 8: Final commit if anything changed**

```bash
git status --short
```
If clean: done. Otherwise commit with a message naming the check that required the fix.
