# Homepage: the three-act story

**Date:** 2026-11-22
**Status:** Approved by Eric, 2026-11-24
**Branch:** `ericgriffin/website-story` (cut from `main` at cd1c71e)
**Release:** written against Submersion 1.8.5
**Scope:** `index.html`, `styles.css`, `ocean.js`, `script.js` where the layout needs it, `screenshots/`, `README.md`. Every other page (`computers/`, `guide/`, `downloads/`, the tag pages, `lightroom/`, `privacy/`, `terms/`) is unchanged.

## Why

The homepage was last rewritten in August against 1.7.5. It lists features from shallow to technical, which reads as a long catalogue, and it predates almost everything from 1.7.6 to 1.8.5. Eric wants a visitor to leave with three ideas:

1. **The whole dive.** Submersion covers everything from logging to analytics, with features other dive software does not have.
2. **A safer diver.** It helps you dive more safely: equipment maintenance and tracking, dive planning, and analysis of each dive for safety problems.
3. **Open data.** Your data is yours, stored where you choose, in formats you can read and take elsewhere, computed in ways you can inspect.

## Goals

1. Tell those three ideas as three acts, in that order, so the page reads as an argument and not a list.
2. Cover what shipped from 1.7.6 to 1.8.5, placed in the act it supports.
3. Replace the screenshots with captures from the installed 1.8.5 app, led by the screens with the strongest visuals.
4. Adopt the redesign branch's layout with the live site's water and logo.
5. Keep every fix that reached `main` after the redesign branched.

## Non-goals

- New pages, or changes to any page other than the homepage.
- Changes to the download logic beyond what the new markup needs.
- A light theme. The water is the theme.
- Translations.

## Anti-goals (a failure even if it ships)

- **Claiming Submersion makes diving safe.** It is not a dive computer and does not replace training, a buddy or a computer. Safety copy says what the app checks, tracks or calculates, and lets the diver draw the conclusion. "Helps you" is the strongest verb; never "keeps you safe", "prevents", "guarantees".
- **Claims stronger than the app.** Every feature named must be reachable in the 1.8.5 build. If a screen cannot be opened there (unshipped, behind a switch, desktop-only when the copy implies all platforms), it is not advertised, or its platform limit is stated.
- **Slogans in body copy.** The August copy rules stay in force (below).
- **Private details on the site.** Screenshots come from Eric's own logbook (his decision, 2026-11-24), so every shot gets a privacy pass: no real person's name, email address, phone number, card number, medical note, emergency contact, account name, bucket or key in frame.
- **Losing `main`'s fixes** by copying the redesign's files wholesale.
- **Unreadable text on the water.** Every text block meets 4.5:1 against the water behind it, at every scroll position and width.

## Constraints

- Static site on GitHub Pages; no build step. Scripts and styles are hand-written files in the repo; Google Fonts is the only external load.
- `node --test tests/*.test.mjs` must keep passing (it covers the tag pages and link files, not the homepage, but it runs in CI).
- The homepage must work at phone width (360 px) with no horizontal scroll.
- `prefers-reduced-motion` turns off the moving water layers, as it does today.

## Approaches considered

### Base page

| Option | Trade-off | Outcome |
|---|---|---|
| Live descent site (`main`) | Keeps the water, logo and gauge; its depth order (simple to technical) fights a three-theme story. | Not chosen |
| Redesign branch (`bionic/redesign`, bcf5fa0, local and unpushed) | Alternating screenshot rows and card grids that reorder freely; near-black background and a small logo; branched before eight later fixes and drops two of them. | Layout chosen |
| **Hybrid** | Redesign layout on the live site's water, with the live logo, ported onto current `main`. | **Chosen by Eric** |

Eric also chose to **drop the depth gauge**. A mockup with and without it was reviewed.

### Story order

| Option | Trade-off | Outcome |
|---|---|---|
| **A. Three acts** | One stretch of page per idea; the nav changes from feature names to act names. | **Chosen by Eric** |
| B. Today's journey with safety and openness tagged | Smallest change; safety ends up spread over four sections and openness stays last. | Not chosen |
| C. Three claims, then a feature index | Shortest; the comprehensiveness act becomes one-liners, the thin copy the August rewrite removed. | Not chosen |

### Screenshot data

| Option | Trade-off | Outcome |
|---|---|---|
| **Sample logbook** ("Explore with sample data", 700 dives over six years with buddies, gear service history, photos, tracks) | Rich on every screen and no one's real data. | First choice (2026-11-22), replaced |
| Eric's own log in the installed app | Authentic and current with the newest build; needs a privacy pass per shot. | **Chosen by Eric (2026-11-24)** |

## Visual system (decided)

- **Layout from the redesign:** a hero with the copy on the left and a screenshot on the right; each section is a feature row (screenshot beside an eyebrow, heading and intro, alternating sides) followed by a row of four feature cards. Content width up to 1440 px, as the redesign has it.
- **Water from the live site:** the full-page gradient `--water-top` `#49e8ff` to `--water-bottom` `#01060e`, with the haze, light rays, bubbles and marine snow from `ocean.js`. The live site's ink solving (dark navy text on bright water, light text on deep water, solved per block for contrast) is extended to the redesign's blocks: hero copy, section text, feature cards.
- **Feature cards on water:** translucent rather than solid black. Pale (white at about 20%) where the ink is dark, deep (near-black at about 45%, light blur) where it is light. Card borders follow the ink.
- **Logo from the live site:** `assets/brand/lockup-dark.png` at 96 px tall (76 px under 700 px), in a header that sits on the surface water and scrolls away with the page, with the nav in the lockup's navy. The redesign's fixed, blurred header bar is not used.
- **No depth gauge:** its markup, styles, the readout and tick code in `ocean.js`, and the right-hand padding it reserves are removed. The section depth tags ("12 m · The log") go too; the redesign's eyebrows replace them.
- **Buttons:** the redesign's CTA buttons may stay if they meet contrast on the water at their position; otherwise use the live site's button styles. Builder's call, checked against the mockup.

The reviewed mockup lived in a session scratchpad and is not kept. This section is its written record and governs; where it leaves a visual choice open (buttons, card opacity), the contrast check in Verification decides. (My call, after the builder check.)

## Page structure

Section ids marked *legacy* already exist on the live page and must keep resolving (external links point at them). Where a legacy id no longer has its own section, keep it as an empty `<span id="...">` at the nearest equivalent, as the August rewrite did for `why`, `screens`, `features` and `support`.

| Order | id | Eyebrow / heading (working) | Content |
|---|---|---|---|
| Hero | `top` | Free · Open source · iOS · Android · macOS · Windows · Linux. An h1 that names all three ideas (it must not repeat the lockup's "Dive safe. Log everything."). A lead paragraph, two CTAs (Download, Source on GitHub). | Hero screenshot |
| Pillars | `why` (legacy) | Three short cards, one per act, each linking to its act: the whole dive, a safer diver, your data. | none |
| **Act 1** | `dive` | **The whole dive.** Intro line for the act. | |
| 1.1 | `computer` (legacy) | Download and import | 350+ computers over Bluetooth LE and USB (Bluetooth only on iOS), incremental download, duplicate review, auto-connect to known computers; imports from Subsurface, MacDive, Shearwater Cloud, Suunto Cloud, Garmin Connect, Diving Log, DiveLogDT, divelogs.de, DAN DL7, UDDF, CSV presets, Apple Health, paper logbooks by OCR. |
| 1.2 | `log` (legacy), `screens` (legacy) | The log | Every field optional; conditions, weather and tides; people, roles and signatures; cylinders and gas switches; search in plain words; the Home dashboard (1.8.5); trips with itineraries, tabs, fills and gas records. |
| 1.3 | `sites`, `media` (legacy) | Sites, photos and what you saw | Bundled site and dive center catalogue, maps with offline regions, bathymetry and 3D terrain, GPS and underwater tracks; photos and video matched to the profile, colour correction; on-device species identification in photos and video (1.8.5); documents. |
| 1.4 | `analyze`, `features` (legacy) | Analysis and Insights | Profile playback with overlays, Bühlmann ZH-L16C tissue loading, CNS and OTU, two computers on one chart, 3D; Insights (the statistics pages, renamed in 1.8.1) and Connections. |
| **Act 2** | `safety` | **A safer diver.** Intro line that states the limit: it checks, tracks and calculates; the dive is yours. | |
| 2.1 | `review` | After every dive | Safety review (fast ascents, sawtooth profiles, missed safety stops), your own logbook rules, computer versus model deco side by side, oxygen exposure for the day and week, ascent-rate marking. |
| 2.2 | `plan` (legacy) | Before the dive | Planner for OC, CCR, SCR and pSCR; bailout checked against the worst moment with the worst-case point marked; contingencies and range tables; per-O2-band deco limits; a day of repetitive dives; compare a plan with the dive as dived; gas calculators and blender. |
| 2.3 | `gear` | Gear you can trust | Service clocks by time, dives and exposure, with reminders; equipment condition; cylinder and gear passports with QR and NFC tags and fill records (the `/c` and `/g` pages on this site read them); regulator service and O2 clean clocks; transmitters tied to cylinders; service and inventory reports. |
| 2.4 | `ready` | Ready to go | Certification currency, pre-dive checklists (including GUE EDGE and O2 cell linearity), the emergency card with chamber directory and no-fly time, emergency contacts and medical notes per diver. |
| **Act 3** | `data` (legacy) | **Your data, open.** Intro line: no server, no accounts. | |
| 3.1 | `storage` | Where it lives | Local database encrypted at rest with app lock; end-to-end encrypted sync through your own iCloud, Google Drive, Dropbox, S3, WebDAV or Git, or device to device over Bluetooth; encrypted backups, automatic before upgrades. |
| 3.2 | `open` | What you can see and take | Exports (UDDF 3.2, CSV, Excel, KML, GPX, PDF logbooks and reports); raw dive computer data kept and re-parseable; a change log you can revert from; the data quality assistant; the app's own calculations shown next to your computer's; agent access on desktop (local only, token, preview before any write); GPL-3.0 source, no ads, no subscription. |
| Download | `download`, `support` (legacy) | Get Submersion. | Unchanged behaviour from `main`: platform-detecting button pointed at the newest release with installers, the download count line, App Store and Google Play badges, all-platform list, support links. |

**Nav:** The dive · Safety · Your data · Guide · GitHub · Download. The Guide link stays visible on phones (fix from `main`).

**Head:** title "Submersion"; meta and OG descriptions rewritten to carry the three ideas in the same voice; OG image unchanged.

## Copy rules (from the August spec, still in force)

- Second person, present tense, one idea per sentence. Diver to diver, factual.
- No metaphor, pun or slogan in body copy. The lockup's tagline is the brand, not body copy.
- Lead with what a recreational diver does, follow with what a technical diver needs.
- "Logbook" means the record, never the product.
- "Computed from the profile", never "real time".
- Each feature card is two or three sentences: what it does, with a specific number, name or limit. The redesign's one-line cards are too thin.
- No em-dashes anywhere in the page or the docs.

## Verified claims

The August table (`2026-08-23-content-rewrite-design.md`) is the starting point. Every claim that table does not cover is checked twice before it goes on the page: once against the app repo at the 1.8.5 release (the code path that implements it), and once by opening the screen in the 1.8.5 beta or the main build used for the screenshots. The plan builds the new table; the August "Not to be advertised" list carries over unless the check shows a feature has since shipped. Numbers (computer models, sites, species, languages, insight pages) are re-counted, not copied.

**Reference build.** 1.8.5 is not tagged yet. The installed app is Beta v1.8.5.9757 (installed 2026-11-24), and claims and screenshots are checked against it.

**Merge timing (Eric's decision).** The PR is built and reviewed now but held until 1.8.5 is published, so the page never advertises features the Download button does not hand out. On release day, every 1.8.5 claim is re-checked against the published release notes, anything that did not ship is cut, and then it merges.

**Platform limits** are stated where they exist. Known so far: species identification is switched on for iPhone, iPad and Mac only (app PR #4701); agent access is desktop only; Apple Health import is iOS only; Bluetooth is the only computer transport on iOS.

## Screenshots

- **Source (Eric's decision, 2026-11-24):** the installed app (`/Applications/Submersion.app`, Beta 1.8.5.9757) on Eric's own logbook, so the shots show the newest build. The sample logbook and the main debug build are no longer used.
- **Video species tracking:** Eric's screen recording of the media viewer (`Screen Recording 2026-11-23 at 12.52.20 AM.mov`, 60 s at 2784 × 1888): stills of labels following the fish, and of the Suggested list with confidence. The viewer is dark in the recording; that is the viewer's own look, not the app theme.
- **Who captures:** the builder, driving the app through computer use on Eric's Mac, then cropping and naming the files. (My call.)
- **Window:** consistent size, about 1440 × 900 points, captured with `screencapture -l <window id>` so frame and shadow match; resampled to 2400 px wide.
- **Theme (Eric's decision):** the app's light theme for every shot.
- **Must show (Eric's list, 2026-11-24), chosen to draw people in with strong visuals:**
  1. Equipment: the diver figure.
  2. Dive detail: the buoyancy card.
  3. The 3D seascape.
  4. Trips: a day detail page.
  5. Video species tracking (from the recording above).
  6. Insights: progression, and Connections (centred on a site, without people; see the privacy pass).
  7. Dive detail: tissue loading and the cylinders card.
- **Filling the rest of the rows (my call):** safety review findings, the planner, a gear passport or service status, certifications or a checklist, and Settings > Data or the change log for act 3, where Eric's list leaves a row without a shot. Existing files that no longer appear are deleted.
- **Privacy pass:** per the anti-goal above, checked on every shot before it is committed. No people's names in any shot (Eric's decision, 2026-11-24): the Connections shot is centred on a site ("Around Mama Vina Wreck": species, dive center, trip, certification, dive types and a computer, no buddies) rather than the "Trips and people" preset.
- **Processing:** PNG at 2400 px wide, real `width` and `height`, `loading="lazy"` and `decoding="async"` below the hero, descriptive alt text naming what the shot shows.

## Porting onto `main`

The redesign branched on 7 October. Since then `main` gained: the downloads page and the download count line under the button; the button pointed at the newest release with installers; the Guide link kept on phones; the red rule under all of "Sub" in the logo images; the legal page sync; the support matrix sweep; the gear tag fix. The redesign's `index.html`, `styles.css` and `script.js` are brought over by hand onto current `main`, not merged, so that `script.js` keeps `main`'s release lookup, installer selection and download count, and only gains what the layout needs (the reveal hooks). `ocean.js` comes from `main` and loses the gauge.

## Verification

1. Serve locally and walk the page in a browser at 360, 768, 1120, 1440 and 1600 px; screenshot each section.
2. Contrast: every text block at 4.5:1 or better against the water behind it at its position (the ink solver's output, spot-checked).
3. Every nav link and every legacy anchor (`computer`, `log`, `sites`, `media`, `analyze`, `plan`, `data`, `download`, `why`, `screens`, `features`, `support`) resolves.
4. The download button, count line and store badges behave as on `main`.
5. Reduced motion: no moving layers.
6. `grep` the page for the retired phrases in the August spec, for "real time", "keeps you safe", "prevent", "guarantee", and for the em-dash character: zero hits.
7. `node --test tests/*.test.mjs` passes.

## Left to the builder

- Exact headings, intros and card copy, within the rules above.
- Which four cards each row carries when a section has more than four things to say (a second card row is allowed).
- Whether the pillars band uses icons.
- Button styling on the water, per the visual system note.
- The phone layout of feature rows (stacked, screenshot first or text first).

## Changes after review (2026-11-24)

Eric reviewed the built page and changed these; where they differ from the sections above, these govern.

- **Copy voice:** concise and technical. Headings name the feature ("Dive planning", "Post-dive safety review"), and each card says what it does in one or two plain sentences, with no jokes, rhetorical questions or sales lines. No clipped comma phrases ("Your data, open"). The product is a "dive application", never a "dive log"; "logbook" is the record. A test fails the page on "dive log".
- **Headline:** the live site's "The complete dive app, free and open." stays (Eric, 2026-11-25, after reviewing shorter and slogan options); the lead opens with "For recreational and technical divers".
- **Act headings:** Logging and analysis, Safety, Your data (eyebrows: The whole dive, A safer diver, Your data stays yours). The menu keeps The dive, Safety, Your data.
- **Rows:** Act 1 gains an Insights row (`insights`) for Progression and Connections. Some rows show two images, the second overlapping the first: Insights, the safety review with the buoyancy card, and the seascape with the species clip.
- **Hero:** the uncropped dive details page with its profile.
- **Screenshots:** Eric set up each scene himself in the installed app (1.8.5) on the sample logbook, which replaced his own as the app's database with no demo mode, and each was captured from that window. The dive computers screen is the one exception (taken earlier from his logbook). Window captures at 1440 × 900, or 1440 × 1228 for the tall dive-detail and certification shots, are trimmed to the window and resized to 2400 px. The buoyancy card is cropped to the card.
- **Species tracking:** a 14-second muted, looping H.264 clip cut from Eric's screen recording (`screenshots/video-species.mp4`, 3.4 MB, poster `video-species.jpg`). It plays only while on screen and keeps its poster under reduced motion.
- **Privacy:** no real person's name in frame. The sample's made-up divers and instructor may appear (Eric kept the "Trips and people" Connections map).
- **Without script:** every row above the mid-water crossover carries static dark ink, and without `ocean.js` the section inks run at full strength, so text meets 4.5:1 with or without script.
- **Rows, 2026-11-25:** the download row shows the duplicate review (sample logbook; the two computer serial numbers blurred). Sites is its own row with the seascape. A new Photos and species row (`media`, the legacy anchor) shows the media browser (Eric's logbook) with the species clip inset (a paused-playback still was tried and dropped); the clip now shows the app window around the video (dark mode, as recorded; the pointer is blended out). Species identification is described for all media.
- **Platforms row (`platforms`, Eric, 2026-11-25):** just before Download, the same dive (USS Algol #683, sample logbook) on the Mac app, an iPad and an iPhone (iOS Simulator, debug build of `main`), layered in one figure, with cards for iPhone and iPad, Android, desktop and one logbook across devices.
- **Sites row (Eric, 2026-11-25):** the site map viewer (Eric's logbook: Bonaire with catalogue sites clustered and a heat map of sites dived) leads, with the 3D seascape inset at the lower left so the map stays in view.
- **Storage and sync row (Eric, 2026-11-25):** the connected Sync between devices page from Eric's logbook replaces the add-account sheet; the bucket name is blurred.
- **Act 1 name (Eric, 2026-11-25):** the menu and the act heading read "Logbook"; its label and first card read "Logging and analysis" (replacing "The dive" and "The whole dive"). The download row's heading and paragraph also cover importing from other apps' formats.
