# Submersion Website Content Rewrite

**Date:** 2026-08-23
**Status:** Approved pending user review of this document
**Scope:** `index.html` content, small additive changes to `styles.css` and `ocean.js`, new screenshots, `README.md`. The ocean motion engine, download logic (`script.js`), `privacy.html`, and `terms.html` are unchanged.

## Problem

The July revamp gave the site a strong visual identity (the descent, scroll-driven water color, depth gauge) but the copy is thin: catchphrases ("the logbook that goes deeper", "no upsells at 30 metres", "Buddy check") and a four-item spec row stand in for content. It sells Submersion as a logbook. Submersion is comprehensive dive software: computer download, logging, profile analysis and decompression, planning for OC and rebreathers, gas calculators and blending, sites and maps, gear, people, media, safety, encrypted sync, and export. None of that reaches the page.

## Goals

1. Position Submersion as dive software, with the logbook as one part.
2. Replace every catchphrase with specific, verifiable copy in a diver-to-diver voice.
3. Cover the full scope of the application, ordered so recreational divers get a complete picture early and technical divers keep finding what they need as they scroll.
4. Add screenshots from the live app for areas the site currently doesn't show.
5. Keep the visual system and motion engine as they are.

## Decisions (settled during brainstorming)

- **Page shape:** one longer descent. Nine zones, 0 to 60 m, rather than six zones to 40 m. No second page.
- **Voice:** diver-to-diver and factual. Second person, present tense, concrete nouns and numbers. No metaphor in body copy. Reference hero paragraph:

  > One app for everything you do around a dive.
  > Download your computer, check the deco on the profile, plan tomorrow's dive with the gas you actually have, log who you dove with and what you saw, and keep every bit of it on your own hardware. Rec or tech, single tank or rebreather, it all fits in the same logbook.

- **Zone order:** by complexity. Shallow zones cover what every diver does; deeper zones get progressively more technical. The depth gauge becomes an index of the content.
- **Screenshot data:** the user's live logbook in `/Applications/Submersion.app` (1.7.5). Nothing is fabricated or seeded.
- **Depth tags:** kept as structure ("12 m · The log") but the nicknames (Shallows, Reef, Wall, Abyss) are dropped.

## Copy rules

Every line on the page follows these:

- Second person, present tense, one idea per sentence.
- No metaphor, pun, or slogan in body copy. Lines being retired: "goes deeper", "Begin descent", "no upsells at 30 metres", "read the fine print", "Buddy check", "Clean on the surface, thorough underneath", "See you down there", "Ready to submerse yourself", "the wall that dropped into blue / the turtle at your safety stop". Footer becomes "© <year> Submersion · GPL-3.0".
- Both audiences where natural: lead with what a recreational diver does, follow with what a technical diver needs ("air and nitrox ... and trimix, heliox, CCR diluents").
- "Logbook" refers to the record, never to the product.

### Verified claims (source-checked 2026-08-23 against the app repo)

Use these phrasings. Do not strengthen them.

| Topic | Phrasing | Basis |
|---|---|---|
| Computers | "350+ models supported by libdivecomputer, over Bluetooth LE and USB" | 356 descriptors, 37 vendors, libdivecomputer v0.9.0-94 bundled |
| Tested computers | "Confirmed on Shearwater Teric, Aqualung i300C and i330R. Testers wanted for the rest." | README |
| iOS | "Bluetooth only on iOS" | serial/USB is macOS-only in the Darwin plugin |
| Download | incremental by fingerprint; duplicate review with skip / import as new / replace / consolidate | `fingerprint_utils.dart`, `dive_matcher.dart`, import review UI |
| Imports | Subsurface XML, MacDive (XML and SQLite), Shearwater Cloud, Garmin FIT, DAN DL7, Ratio XML, UDDF, CSV with presets (MySSI, Subsurface, MacDive, Diving Log, DiveMate, Garmin Connect, Shearwater Cloud); Apple Health underwater workouts (iOS); OCR of scanned paper logbooks | `universal_import` parsers, `ocr_import`, `healthkit_service.dart` |
| Deco | "Bühlmann ZH-L16C with gradient factors, all 16 compartments, N2 and He" | `buhlmann_algorithm.dart` |
| Live values | "computed from the profile" / "as you scrub"; never "real time" | app is not a dive computer |
| O2 | CNS and OTU per dive and running totals | `o2_toxicity_calculator.dart` |
| Overlays | ~20: temperature, pressure, heart rate, SAC, ppO2/ppN2/ppHe, gas density, GF, surface GF, TTS, ceiling, NDL, deco stops, gas switches, ascent rate, photos, mean depth | `DiverSettings` overlay columns |
| Comparison | two computers on one chart; computer deco vs computed deco | `overlaid_profile_chart.dart`, deco source settings |
| 3D | 3D dive view and tissue landscape with playback | `lib/features/dive_3d/` |
| Safety review | flags rapid ascents, sawtooth profiles, missed safety stops | `safety_review_service.dart` |
| Planner | multi-segment, drag-editable profile; OC, CCR, SCR, PSCR with per-segment mode override (bailout mid-plan); setpoints; contingencies; range table; recreational NDL solver; tissue seeding from a previous dive; plan slate PDF | `lib/features/planner/` |
| Bailout | solver checks bailout-role cylinders against worst-case OC demand along a CCR plan | `bailout_solver.dart` |
| Weight planner | learns a buoyancy model from logged dives | `lib/features/weight_planner/`, `lib/core/buoyancy/` |
| Surface interval tool | tissue recovery chart | `lib/features/surface_interval_tool/` |
| Gas calculators | MOD, best mix, MND, consumption, rock bottom; blender with real-gas fills, templates, and billing | `lib/features/gas_calculators/` |
| Cylinders | multiple per dive with O2/He per tank, roles, presets, reusable cylinder configurations; AI pressure profiles; gas switches | `DiveTanks`, `cylinder_configs`, `TankPressureProfiles` |
| Photos | matched to the dive by capture time; depth at that moment shown on the profile ("depth on the profile", not "depth-tagged") | `dive_photo_matcher.dart`, `mini_dive_profile_overlay.dart` |
| Media sources | device gallery, local folders, network URLs, iCloud / Google Drive / Dropbox / S3 | `media_store` |
| Species | 511 bundled species; sightings per dive, per site, per photo | `assets/data/species.json` |
| Sites | GPS with reverse geocoding; 3,612 sites and 3,593 dive centers bundled from OpenStreetMap ("3,600" each in copy); depth range, difficulty, hazards, access, mooring; offline map regions; heat map; bathymetry overlay and 3D site terrain; reef protection and bleaching data | `location_service.dart`, `assets/data/`, `maps`, `bathymetry`, `site_scape`, `reef` |
| Trips | dates, itinerary days, checklists, liveaboard details, trip gallery | `Trips`, `TripItineraryDays`, `TripChecklistItems` |
| Equipment | serials, purchase, service schedules with reminders, equipment sets, location-based set selection | `Equipment`, `ServiceSchedules`, `EquipmentSetGeofences` |
| Certifications and courses | wallet with card photos; courses with requirements linked to dives | `certification_wallet_page.dart`, `Courses` |
| Signatures | buddy and instructor signatures on a dive | `lib/features/signatures/` |
| Checklists | pre-dive checklist sessions from templates | `lib/features/pre_dive/` |
| Weather and tides | weather for the date and place; tides offline from a bundled global constituent grid, NOAA stations | `lib/features/weather/`, `lib/features/tides/` |
| Emergency | chamber directory and emergency numbers by region, no-fly time | `lib/features/safety/` |
| Storage | local SQLite, encrypted at rest (SQLCipher), biometric / passphrase app lock | `pubspec.yaml` hooks, `security/` |
| Sync | end-to-end encrypted, through the user's own iCloud, Google Drive, Dropbox, or S3-compatible account; no Submersion server | `sync/crypto/`, `cloud_storage/`, TERMS.md |
| Backups | encrypted `.sbe` backups, automatic backup before migrations, restore | `lib/features/backup/` |
| Exports | UDDF 3.2, CSV, Excel, KML, GPX, PDF logbooks (Simple, Detailed, Professional, PADI, NAUI) | `core/services/export/`, `pdf_templates/` |
| Data quality | assistant that finds duplicates and anomalies and guides repairs | `lib/features/data_quality/` |
| Settings | 11 languages; independent units for depth, temperature, pressure, volume, weight, altitude, SAC; 5 themes each in light and dark; keyboard shortcuts | `lib/l10n/arb/`, `units.dart`, `app_theme_registry.dart` |
| Platforms | iOS 15+, Android, macOS 12+, Windows, Linux | platform dirs, v1.7.4 release notes |
| License and cost | GPL-3.0; free; no accounts, subscriptions, ads, or in-app purchases | LICENSE, TERMS.md |

### Not to be advertised

- VPM-B (implemented in code, not reachable from the UI).
- Adobe Lightroom integration (behind a feature flag pending approval).
- Import of Diving Log XML, Suunto SML, Suunto DM5, Scubapro, generic SQLite (declared, unimplemented; the Diving Log and DiveMate CSV presets do work).
- Anything from the v2.0 backlog (Wi-Fi device download, sidemount multi-transmitter, what-if planning, community features).

## Page structure

Nine zones. Depth tags use the existing mono style, "12 m · The log", with the leading rule drawn by a CSS pseudo-element rather than a dash character (the same applies to the gauge tick marks, which currently embed one).

| Depth | ID | Heading (working) | Content | Screenshots |
|---|---|---|---|---|
| 0 m | `#top` | One app for everything you do around a dive. | Eyebrow "Free · Open source · iOS, Android, macOS, Windows, Linux". Reference hero paragraph. CTAs: "Download" (scrolls to `#download`), "Source on GitHub". | none |
| 6 m | `#computer` | From your computer | 350+ models via BLE and USB (BLE only on iOS); confirmed models and testers note; incremental download; duplicate review with skip / new / replace / consolidate; several computers on one dive. Sub-block "Already have a logbook?": import formats, CSV presets, Apple Health, OCR. | `computer_import.png` (existing) |
| 12 m | `#log` | The log | Conditions (visibility, current, swell, temperatures, weather, tides); people (buddies, divemaster, role, center, operator, boat); gases and cylinders with AI pressures; weights and weighting feedback; tags, ratings, favorites, custom fields; card and table views, configurable columns, bulk edit; signatures; safety review. | dives list + detail (new), table view (new) |
| 18 m | `#sites` | Where you dove | GPS and reverse geocoding; 3,600 bundled sites and dive centers; offline map regions; heat map; depth, difficulty, hazards, access, mooring; bathymetry and 3D site terrain; reef data; 511 species with sightings; trips with itineraries, checklists, liveaboard details, gallery. | `sites_map.png` (existing), site detail with bathymetry or SiteScape (new), marine life (new) |
| 24 m | `#media` | Photos, gear and paperwork | Photos and video matched by capture time with depth on the profile; media sources; equipment with serials, service schedules, reminders; equipment sets incl. location-based; certification wallet; courses linked to dives; pre-dive checklists. | `photo_gallery.png`, `equipment_sets.png` (existing), certification wallet (new) |
| 32 m | `#analyze` | Reading the profile | Scrub or play with the overlay list; ZH-L16C tissue loading, gradient factors; CNS and OTU; computer deco vs computed; two computers on one chart; profile editor with trim; 3D dive and tissue view. | `profile_player.png` (existing), tissue loading panel (new), 3D view (new) |
| 40 m | `#plan` | Planning | Multi-segment planner; OC, CCR, SCR, PSCR with mid-plan bailout; bailout solver; contingencies and range tables; recreational NDL solver; tissue seeding; surface interval tool; weight planner; gas calculators and blender; plan slate PDF. | planner (new), gas blender or calculators (new) |
| 50 m | `#data` | Your data | Local encrypted database, app lock; end-to-end encrypted sync via own iCloud / Drive / Dropbox / S3; encrypted backups; exports incl. PDF logbooks in PADI and NAUI layouts; data quality assistant; 11 languages, independent units, 5 themes, keyboard shortcuts; GPL-3.0, no accounts, no ads, no server. | `statistics.png` (existing), sync or export settings (new), theme gallery (new) |
| 60 m | `#download` | Get Submersion. | "Free on every platform. Releases on GitHub; iOS on the App Store." Existing platform-detecting button, App Store badge, all-platform list, build-instructions link, unchanged. Support links (GitHub issues, support@submersion.app) move here. Footer "© <year> Submersion · GPL-3.0" with privacy and terms links. | none |

Nav: Computer · Log · Sites · Analyze · Plan · Data · Download · GitHub.

Legacy anchors `#why`, `#screens`, `#features`, `#support` are kept as empty `<span id="...">` elements at the nearest equivalent zone (`#why` → data, `#screens` → log, `#features` → analyze, `#support` → download) so external links resolve.

Head: `<title>Submersion</title>`; meta description and OG description rewritten in the same voice; OG title "Submersion: dive software for the whole dive".

## Screenshots

**Source and method.** `/Applications/Submersion.app` 1.7.5 against the live database. Read-only use: navigation, opening existing records, toggling view options, building an unsaved plan if needed. Window set to a consistent size (about 1440×900 points on a retina display); captured with `screencapture -l <windowid>` so the frame and shadow match the existing set.

**New captures** (11):
1. Dives list with detail pane (light theme; replaces `dives_overview.png`)
2. Dive table view with columns
3. Site detail with bathymetry or SiteScape
4. Marine life (species or sightings)
5. Certification wallet
6. Tissue loading / deco panel
7. 3D dive view
8. Planner with a CCR or multi-gas plan
9. Gas blender or calculators
10. Sync / backup settings or the export sheet
11. Theme gallery (dark)

**Kept:** `computer_import.png`, `sites_map.png`, `profile_player.png`, `photo_gallery.png`, `equipment_sets.png`, `statistics.png`. **Retired:** `dives_overview.png`.

**Processing.** Resample to 2400 px wide PNG; set real `width` and `height` on each `<img>`; `loading="lazy"`, `decoding="async"`; descriptive alt text.

**Privacy check.** Every capture is reviewed before use. Anything showing a buddy's full name, a certification or card number, an email address, or a personal photo the user would not want public is recaptured with that panel collapsed or replaced with another screen. The user approved use of the real logbook; this check limits exposure to what a screenshot needs.

**Fallback.** If a screen cannot be made presentable with existing data (empty planner, no bathymetry for the user's sites), the closest alternative is used and the gap is reported. Nothing is mocked up.

## Technical changes

- **`index.html`**: content rewritten inside the existing skeleton (`zone` > `zone__inner wrap` > `zone__tag`, `h2`, `zone__intro`, then content). New IDs as above, legacy anchor spans, gauge ticks extended to 60 m in 10 m steps. Download block markup and IDs untouched.
- **`styles.css`**: additive only. (1) `.features` grid for per-zone item lists: 2 columns at ≥ 720 px, 1 column below; reuses the `pillars` border treatment; item is `h3` + `p`. (2) `.shot--wide` figure variant: one image with its caption beside it at ≥ 1000 px, stacked below. No palette, type, motion, or gauge style changes.
- **`ocean.js`**: `MAX_DEPTH_M` 40 → 60. Color stops already span the full scroll range.
- **`README.md`**: structure section updated (nine zones, screenshot list).
- **Unchanged:** `script.js`, `privacy.html`, `terms.html`, `assets/`.

## Verification (definition of done)

1. Serve locally (`python3 -m http.server`); in Playwright walk 360 / 768 / 1120 / 1600 px, screenshot each zone, and check layout and readability at every scroll position.
2. All nav anchors and the four legacy anchors resolve.
3. `grep` the final HTML for every retired phrase (list above) and for "real time", "depth-tagged", "VPM", "Lightroom", "Suunto", "logbook that": all zero hits except "logbook" used for the record.
4. Every claim on the page maps to a row in the verified-claims table.
5. Every `<img>` has `width`/`height` matching the file; no CLS on load.
6. Reduced-motion pass: static experience complete, depth readout present.
7. Lighthouse: Accessibility ≥ 95, Performance ≥ 90 (same targets as the July revamp).
8. Download button resolves the correct macOS asset.

## Out of scope

- Renaming the App Store listing ("Submersion Dive Log") or README hero images in the app repo.
- Any change to the ocean motion engine's behavior, palette, or typography.
- `privacy.html`, `terms.html`.
- Light color scheme.
