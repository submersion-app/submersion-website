# Three-act homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, inline in one session (Eric's choice; no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage as three acts (the whole dive, a safer diver, your data open) in the redesign's row-and-card layout on the live site's water, with new light-mode screenshots from the installed 1.8.5 app.

**Architecture:** `index.html` is rewritten on current `main`; nothing is merged from `bionic/redesign`, its layout is re-expressed by hand. Homepage-only layout lives in a new `home.css` so the inner pages, which share `styles.css` and `ocean.js`, keep their look. `ocean.js` loses the gauge and learns the new ink blocks; `script.js` and `downloads/home-line.js` are untouched.

**Tech Stack:** Static HTML, hand-written CSS and plain JS on GitHub Pages; `node --test` for tests; no build step, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-22-three-act-story-design.md` (approved 2026-11-24). Issue: submersion-app/submersion#4991.

## Global Constraints

- No em-dash (U+2014) anywhere in the page, CSS comments, docs or commits; no en-dash as sentence punctuation.
- Never "keeps you safe", "prevent", "guarantee", "real time" in page copy; "helps you" is the strongest safety verb.
- Copy: second person, present tense, one idea per sentence, diver to diver; feature cards are two or three sentences with a specific number, name or limit; "logbook" means the record, never the product; "computed from the profile".
- The h1 names all three ideas and does not repeat "Dive safe. Log everything."
- Nav, in order: The dive · Safety · Your data · Guide · GitHub · Download. The Guide link keeps `class="nav__guide"`.
- Every legacy id resolves: `top`, `why`, `screens`, `features`, `support`, `computer`, `log`, `sites`, `media`, `analyze`, `plan`, `data`, `download`.
- Water gradient `--water-top` `#49e8ff` to `--water-bottom` `#01060e`; logo `assets/brand/lockup-dark.png` at 96 px tall (76 px under 700 px); no depth gauge.
- Every text block at 4.5:1 or better against the water behind it, at 360, 768, 1120, 1440 and 1600 px.
- 360 px wide: no horizontal scroll. `prefers-reduced-motion`: no moving layers, no content hidden by reveals.
- Screenshots: PNG at 2400 px wide, real `width`/`height`, `loading="lazy"` and `decoding="async"` below the hero, descriptive alt text; no person's name, email, phone, card number, medical note, emergency contact, account name, bucket or key in frame.
- Every claim on the page is in the claims table (Task 3) with its app code path and how it was seen in build 1.8.5.9757.
- `node --test tests/*.test.mjs` passes.

## Review Focus

1. **Phone width.** A 360 px viewport with the pair visual (Insights, After every dive) and the four-card rows: a person expects no sideways scroll and no clipped card text. Pinned by the overflow check in Task 7, Step 2.
2. **Deepest cards.** Act 3 cards sit near `#01060e`, where light ink on a deep translucent card must still read; a person expects every card legible. Pinned by the contrast sweep in Task 7, Step 3.
3. **No JavaScript.** With scripts off, the ink solver never runs; a person expects readable text and visible screenshots. Pinned by the static `data-ink` test in Task 5 and the no-JS look in Task 7, Step 4.
4. **Reduced motion.** Reveals must never leave a row at opacity 0. Pinned by Task 7, Step 4.
5. **Inner pages after the gauge goes.** Removing `body { padding-right: var(--gauge-w) }` widens `computers/`, `downloads/`, `privacy/`, `terms/` by 74 px at 901 px and up; a person expects them to look as before apart from that. Pinned by the inner-page walk in Task 7, Step 5.

---

### Task 1: Remove the depth gauge

**Files:**
- Modify: `index.html` (the `.gauge` block, about lines 62-73)
- Modify: `ocean.js` (`readout`, `ticks`, `measureTicks`, `inkTicks`, `tickY`, the tick update in `update()`, the gauge comments)
- Modify: `styles.css` (`--gauge-w`, the `.gauge*` rules, the `padding-right` media rule, about lines 13 and 116-140)
- Create: `tests/homepage.test.mjs`

**Interfaces:**
- Produces: `tests/homepage.test.mjs` with `read(path)` (same helper as the other test files); later tasks append tests to it.

- [ ] **Step 1: Write the failing test** `the depth gauge is gone`: `index.html` does not match `/depth-gauge|gauge__/`; `ocean.js` does not match `/gauge|readout|tick/i`; `styles.css` does not match `/\.gauge|--gauge-w/`.
- [ ] **Step 2: Run** `node --test tests/homepage.test.mjs`. Expected: FAIL on all three.
- [ ] **Step 3: Delete** the gauge markup, the gauge code paths in `ocean.js` (`solveInk()` keeps everything except its two tick calls; `update()` keeps depth fraction, parallax, rays), and the gauge CSS.
- [ ] **Step 4: Run** `node --test tests/*.test.mjs`. Expected: all PASS.
- [ ] **Step 5: Commit** `refactor(site): drop the depth gauge` with the four files.

### Task 2: The three-act menu on every page that shares it

**Files:**
- Modify: `index.html`, `computers/index.html`, `downloads/index.html`, `privacy/index.html`, `terms/index.html` (the `nav__links` block only)
- Test: `tests/homepage.test.mjs`

The spec keeps other pages unchanged, but `tests/support-matrix-page.test.mjs` requires their menu to equal the homepage's, so the menu is the one shared change.

- [ ] **Step 1: Write the failing test** `the menu names the three acts`: the `nav__links` links of `index.html` deep-equal `[["#dive","The dive"],["#safety","Safety"],["#data","Your data"],["guide/","Guide"],["https://github.com/submersion-app/submersion","GitHub"],["#download","Download"]]`.
- [ ] **Step 2: Run** it. Expected: FAIL (old menu).
- [ ] **Step 3: Replace** the five `nav__links` blocks; inner pages use `../#dive`, `../guide/`, and so on. GitHub keeps `target="_blank" rel="noreferrer"`.
- [ ] **Step 4: Run** `node --test tests/*.test.mjs`. Expected: all PASS, including the inner-page menu and phone Guide tests.
- [ ] **Step 5: Commit** `feat(nav): name the three acts in the menu`.

### Task 3: Verified claims table

**Files:**
- Create: `docs/superpowers/specs/2026-11-24-three-act-claims.md`

- [ ] **Step 1:** Start from the August table (`2026-08-23-content-rewrite-design.md`) and list every claim the spec's Page structure names, one row each: claim as it will read, act and row, app code path in `submersion-app/submersion` at `origin/main` (file and symbol), how it was seen in the installed 1.8.5.9757 build, platform limit if any.
- [ ] **Step 2:** Re-count the numbers (supported computer models, catalogue sites, species, languages, Insights pages) from the app repo; record the command used for each.
- [ ] **Step 3:** Mark any claim that cannot be found in code or opened in the build as "Not advertised" with the reason. Carry over the August "Not to be advertised" list unless a row shows the feature shipped.
- [ ] **Step 4:** Add a "Release-day check" section listing every 1.8.5 claim, to be ticked against the published release notes before merge.
- [ ] **Step 5: Commit** `docs(site): verified claims for the three-act homepage`.

### Task 4: Screenshots

**Files:**
- Create: `screenshots/*.png` (names below)
- Delete: the 17 current `screenshots/*.png`
- Raw captures: `.superpowers/shots/raw/` (git-ignored)

Row assignment (my call within the spec; Eric's seven are all used):

| File | Row | Source |
|---|---|---|
| `seascape.png` | Hero | raw `03-site-seascape` |
| `computer-download.png` | 1.1 `computer` | new capture: Transfer, dive computer download or its review |
| `trip-day.png` | 1.2 `log` | raw `04-trip-day` |
| `video-species.png` | 1.3 `sites` | raw `08-video-tracking` (no window chrome) |
| `tissue-cylinders.png` | 1.4 `analyze` | raw `07-dive-tissue-cylinders` |
| `insights-connections.png`, `insights-progression.png` | 1.5 `insights` (pair) | raw `06`, `05` |
| `safety-review.png`, `buoyancy.png` | 2.1 `review` (pair) | new capture: a dive's safety review findings; raw `02-dive-buoyancy` |
| `planner.png` | 2.2 `plan` | new capture: planner with bailout or plan versus as-dived |
| `gear-figure.png` | 2.3 `gear` | raw `01-equipment-figure` |
| `ready.png` | 2.4 `ready` | new capture: certification currency or a pre-dive checklist |
| `sync-storage.png` | 3.1 `storage` | new capture: the sync setup screen listing storage choices, no account in frame |
| `change-log.png` | 3.2 `open` | new capture: a dive's change log, or export formats |

- [ ] **Step 1:** Capture the six new screens from `/Applications/Submersion.app` in light mode at 1440 × 900 with `screencapture -l <window id> -x`, as the raw set was. Drag the scrollbar thumb to scroll (background scroll events do not reach Flutter scroll views).
- [ ] **Step 2: Privacy pass** on all 14 images at full size: no person's name (buddy, instructor, signer, "ID Eric"), email, phone, card, medical, emergency contact, account, bucket or key. Crop or retake any that fail; record each check in the PR body.
- [ ] **Step 3: Process:** `sips --resampleWidth 2400` then `pngquant --quality 70-90 --skip-if-larger --strip`; keep any file under 1.2 MB; record real width and height.
- [ ] **Step 4:** Put the new files in `screenshots/` and `git rm` the old ones, but do not commit: the page still points at the old names until Task 5, which commits both together.

### Task 5: The three-act page

**Files:**
- Modify: `index.html` (head meta, hero, everything in `<main>` before `#download`; the download section and footer stay as on `main` apart from the eyebrow)
- Create: `home.css` (linked only from `index.html`, after `styles.css`)
- Test: `tests/homepage.test.mjs`

**Interfaces:**
- Produces, for Task 6: the markup classes `pillars`, `act`, `act__head`, `feature-row`, `feature-row--reverse`, `feature-text`, `feature-visual`, `feature-visual--pair`, `feature-cards`, `feature-card`, `showcase-img`, `showcase-img--bare`.

Markup per act: `<section class="act" id="dive">` holds `<div class="zone__inner wrap act__head">` (eyebrow, h2, intro) and one `<section class="zone" id="…"><div class="zone__inner wrap">` per row containing a `feature-row` (a `feature-text` with eyebrow, h3, paragraph; a `figure.feature-visual` with one or two `img.showcase-img`) and a `feature-cards` grid of four `article.feature-card` (h4 and paragraph). Rows alternate `feature-row--reverse`. Ids per row: Act 1 `computer`, `log` (+ `<span id="screens">`), `sites` (+ `<span id="media">`), `analyze` (+ `<span id="features">`), `insights`; Act 2 `safety` (act), `review`, `plan`, `gear`, `ready`; Act 3 `data` (act), `storage`, `open`. Pillars: `<section class="zone" id="why">` with `div.pillars` of three cards linking `#dive`, `#safety`, `#data`. Act 1 rows carry static `data-ink="dark"` for the no-JS page, as `main`'s shallow zones do.

`home.css`: rows are a two-column grid from 900 px (`minmax(0,1fr) minmax(0,1.15fr)`), stacked text-first below it; cards are 1 column below 560 px, 2 to 1120 px, 4 above; content width up to 1440 px. Cards are translucent by ink: `[data-ink="dark"]` white at 20%, `[data-ink="light"]` `rgba(1,6,14,0.45)` with `backdrop-filter: blur(6px)`, `[data-ink="twilight"]` grey at 25%; borders use `var(--line)`. `showcase-img` has no bezel (the window capture carries its own frame and shadow); `showcase-img--bare` (video still, cropped gear figure) gets 12 px radius and a soft shadow. The pair visual overlaps the second image 18% down and 12% in, and stacks plainly below 560 px. Buttons are `main`'s `.btn`/`.btn--ghost`.

- [ ] **Step 1: Write the failing tests:**
  - `every legacy and act id resolves`: each id in the Global Constraints list plus `dive`, `insights`, `safety`, `review`, `gear`, `ready`, `storage`, `open` matches `id="<id>"` exactly once.
  - `the acts come in order`: index of `id="dive"` < `id="safety"` < `id="data"` < `id="download"`, and `id="why"` < `id="dive"`.
  - `the h1 names the three ideas`: the h1 text does not contain `Dive safe` and is non-empty.
  - `screenshots and files match`: the set of `screenshots/*.png` srcs in `index.html` equals the set of files in `screenshots/`.
  - `images are sized and described`: every `<img` in `<main>` has `width`, `height`, non-empty `alt`, `loading="lazy"`, `decoding="async"`.
  - `home.css is the homepage's alone`: `index.html` links `home.css` after `styles.css`; no inner page links it.
  - `no retired or unsafe phrasing`: the text of `index.html` does not match `/\u2014|real time|keeps you safe|prevent|guarantee/i`, nor any phrase on the August spec's retired list (copied into the test as an array).
  - `the shallow rows read without script`: the `computer`, `log`, `sites` sections carry `data-ink="dark"`.
- [ ] **Step 2: Run** `node --test tests/homepage.test.mjs`. Expected: FAIL on all but the h1 test.
- [ ] **Step 3: Write** the head meta and OG descriptions, the hero (lead plus the `seascape.png` shot), pillars, three acts and every row's copy, from the spec's Page structure and only from claims in Task 3's table, stating each platform limit the table records (species identification on iPhone, iPad and Mac only; agent access desktop only; Apple Health import iOS only; Bluetooth only on iOS).
- [ ] **Step 4: Write** `home.css` as specified above.
- [ ] **Step 5: Run** `node --test tests/*.test.mjs`. Expected: all PASS.
- [ ] **Step 6: Commit** `feat(site): tell the homepage as three acts` with `index.html`, `home.css`, the test file, and the Task 4 screenshots if not yet committed.

### Task 6: Ink for the new blocks

**Files:**
- Modify: `ocean.js` (`INK_BLOCKS`)
- Test: `tests/homepage.test.mjs`

- [ ] **Step 1: Write the failing test** `the solver inks every new text block`: `ocean.js` contains the selectors `main .feature-text > *`, `main .feature-cards > *`, `main .pillars > *`, and its first selector excludes `.feature-row`, `.feature-cards` and `.pillars`.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3:** Extend `INK_BLOCKS` accordingly, keeping the existing `.features`, `.shots` and `.legal__body` entries the inner pages use.
- [ ] **Step 4: Run** `node --test tests/*.test.mjs`. Expected: PASS. Then serve the worktree (`python3 -m http.server`) and confirm in a browser that every `.feature-card` and `.feature-text > *` has a `data-ink` after load.
- [ ] **Step 5: Commit** `feat(site): solve ink for the act rows and cards`.

### Task 7: Verify in the browser, README, after screenshots

**Files:**
- Modify: `README.md` (Structure: the homepage's acts and ids, `home.css`, `ocean.js` without the gauge, screenshot recipe)

- [ ] **Step 1:** Serve the worktree; walk the page at 360, 768, 1120, 1440 and 1600 px; full-page screenshot each into `.superpowers/shots/after/`.
- [ ] **Step 2: Overflow:** at each width `document.documentElement.scrollWidth <= innerWidth`. Expected: true at all five.
- [ ] **Step 3: Contrast sweep:** at each width, for every inked block, read its computed `color` and the water colour at its page position (`waterAt` mirrored in the console) blended with its card background; ratio ≥ 4.5. Expected: no failures; fix the card opacity in `home.css` if any.
- [ ] **Step 4:** With scripts disabled, and separately with reduced motion emulated: all text readable, every row visible, no moving layers.
- [ ] **Step 5:** Open `computers/`, `downloads/`, `privacy/`, `terms/` at 1440 px and compare with `main`: only the menu and the 74 px of gauge padding differ.
- [ ] **Step 6:** Every nav link and every legacy anchor scrolls to its section; the download button, count line and store badges behave as on `main`.
- [ ] **Step 7:** Update `README.md`; run `node --test tests/*.test.mjs`; grep the page and docs for U+2014. Commit `docs(site): describe the three-act homepage`.

### Task 8: Pull request (held for 1.8.5)

- [ ] **Step 1:** Push `ericgriffin/website-story`; open the PR on submersion-app/submersion-website with `Closes submersion-app/submersion#4991`, links to the spec, plan and claims table, the privacy-pass record, and before/after shots (desktop and phone) through the `PR screenshots: submersion-app/submersion-website` secret gist. Title and body say the merge waits for the 1.8.5 release.
- [ ] **Step 2:** `tracker.py pr <n> --issue 4991 --status "In review" --release v1.8.5 --repo submersion-app/submersion-website` (or record the FAIL if the tracker cannot reach a cross-repo PR), then bind the PR and run two review rounds, Copilot once and Auto-fix per the build-feature workflow.
- [ ] **Step 3 (release day):** tick the claims table's release-day check against the published 1.8.5 notes, cut anything that did not ship, then merge.
