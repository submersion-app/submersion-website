# Homepage claims, three-act story (verified 2026-11-24)

Every feature the homepage names is in this table. Code paths are in `submersion-app/submersion` at `origin/main` on 2026-11-24 (the 1.8.5 release candidate); "Seen" is how it was confirmed in the installed build, Beta 1.8.5.9757, on macOS. Use these phrasings and do not strengthen them. The August table (`2026-08-23-content-rewrite-design.md`) still holds for anything not repeated here.

## Numbers (re-counted)

| Number | Value | How counted |
|---|---|---|
| Dive computer models | 358 from 38 makers, so "350+" | `g_descriptors[]` rows in libdivecomputer `src/descriptor.c` at the pinned submodule (fe60f0a) |
| Bundled dive sites | 20,999, so "21,000" | `sites` in `assets/data/site_catalogue.json` (generated 2026-11-17) |
| Bundled dive centers | 3,593, so "3,500" | `centers` in `assets/data/dive_centers.json` |
| Bundled species | 681, so "680" | `species` in `assets/data/species.json` |
| Languages | 12 (ar, de, en, es, fr, he, hu, it, ja, nl, pt, zh) | `lib/l10n/arb/app_*.arb` |
| Insights pages | 12 | `insightsCategoriesOf()` in `insights_list_content.dart` |

## Act 1: the whole dive

| Claim (as it reads) | Code | Seen | Limit |
|---|---|---|---|
| Downloads from 350+ computers over Bluetooth LE and USB; only new dives come across | libdivecomputer plugin, `fingerprint_utils.dart` | Transfer > Dive Computers | Bluetooth only on iOS |
| Connects on its own to computers it already knows | `auto_connect_providers.dart` | "Auto-connect known computers" switch | While Transfer > Dive Computers is open |
| Imports Subsurface, MacDive, Shearwater Cloud files, Diving Log and DiveLogDT, DAN DL7, UDDF, Garmin FIT and CSV with presets; signs in to Suunto, Garmin Connect and divelogs.de | `universal_import` parsers, `SuuntoCloudAdapter`, `GarminCloudAdapter`, `DivelogsImportAdapter` | Transfer > Cloud lists Suunto, Garmin, divelogs.de | Shearwater Cloud is its exported file; Diving Log is its SQLite file |
| Apple Health underwater workouts | `HealthKitAdapter` | | iOS only |
| Paper logbooks read by OCR | `lib/features/ocr_import` | | Camera on phones; desktop picks an image |
| A Home page with your numbers, recent trips, gear service and the latest profile | `dashboard_page.dart` and its panels | Home | |
| Trips with an itinerary and a page per day: the day's dives on a map, the day's timeline, photos | `TripStoryDayPage`, `TripDayMap` | Trip > day page | |
| Search the log in plain words | `query_plain_words.dart` | | A fixed grammar; never call it AI |
| Buddies with roles, and signatures | `dive_roles`, `signatures` | | |
| 21,000 bundled sites and 3,500 dive centers, offline map regions | catalogue assets, `offline_maps_page.dart` | | |
| The seafloor around a site in 3D | `site_seascape_section.dart`, `spatial_site_page.dart` | Site > 3D view | Bathymetry downloads per site; coverage varies |
| Photos and videos matched to the profile by time; colour correction | `dive_photo_matcher.dart`, `auto_correction.dart` | | |
| Media linked from the device gallery, local folders, network URLs, or iCloud, Google Drive, Dropbox and S3 storage | `media_store` (August table) | Your media store set to S3 | |
| Video plays back with a virtual dive computer (depth, NDL, time, gas, tank pressure, CNS, ppO2) and a mini profile for that moment | `media/presentation/widgets/perdix_overlay/`, `mini_dive_profile_overlay.dart`, `media_viewer_page.dart` | Media viewer, Hilma Hooker video (Eric, 2026-11-25) | Needs the video matched to a dive with a profile |
| Species identified on the device in photos, and followed through video | `media_identification_service.dart`, `video_tracker.dart`, `feature_flags.dart` | Media viewer, Eric's recording 2026-11-23 | Photos on iPhone, iPad, Mac, Android, Windows and Linux; video not on Linux; Android needs 8 GB of memory; the model pack is a separate download |
| Profile playback, Bühlmann ZH-L16C tissue loading, CNS and OTU, every computer worn on a dive attached to it and overlaid on one chart, 3D | `buhlmann_algorithm.dart`, `compact_tissue_loading_card.dart`, `o2_toxicity_calculator.dart`, `dive_3d_page.dart` | Dive detail | |
| A buoyancy model of the dive, a suggested lead weight for the next dive, and "What if?" for other lead, water or suit | `buoyancy_section.dart`, `lib/core/buoyancy` | Dive detail, "Lead for next time" with the last 11 dives | Shown only for dives it can model |
| Insights: 12 pages, from progression to Connections, a map of who and what you dive with | `insights_list_content.dart`, `connection_presets.dart` | Insights > Progression, Connections | |
| Equipment sets drawn on a diver figure | `diver_figure.dart`, `gear_figure.dart` | Equipment > Sets | |

## Act 2: a safer diver

| Claim | Code | Seen | Limit |
|---|---|---|---|
| A safety review of every dive: fast ascents, missed deco and safety stops, sawtooth profiles, high surfacing gradient factor, late gas switches, isobaric counterdiffusion | `safety_review_service.dart`, `SafetyRuleId` | Dive detail > Safety review | On by default; each rule can be turned off |
| NDL, deco stops, TTS and CNS from your computer or from the app's own calculation, your choice (the ceiling is always calculated) | `chart_options_dialog_rows.dart`, deco source settings | | One source at a time, never "side by side" |
| Oxygen exposure for the day and the week | `cns_otu_page.dart` | | |
| Ascent rate coloured on the profile | `ascent_rate_calculator.dart`, `dive_profile_chart.dart` | | Off until turned on |
| Plans for open circuit, CCR, SCR and pSCR | `PlanMode` | Planning > saved plan | |
| Bailout checked at the worst moment of a loop plan, marked on the chart | `bailout_solver.dart`, `plan_worst_case_marker_layer.dart` | | Loop plans with a bailout cylinder |
| Contingencies (deeper, longer, lost gas) and range tables | `contingency_service.dart`, `range_table_service.dart` | Plan's +5 ft, +5 min, Lost EAN50 chips | |
| A deco ppO2 limit per oxygen band | `plan_ppo2_bands_control.dart` | | Off by default; ppO2 only |
| A day of repetitive dives carried dive to dive | `plan_series_calculator.dart` | | |
| A plan set against the dive as dived | `plan_actual_toggle.dart` | | For dives dived from the plan |
| Gas tools: MOD, best mix, MND, consumption, rock bottom, density, a blender | `gas_calculator_tools.dart` | Planning > Gas Calculators | |
| Service clocks by date, dives, hours and exposure (salt, cold, oxygen) | `service_due_engine.dart`, `exposure_unit.dart` | Equipment > Service Due | Reminders are date based and on phones |
| Condition checks that read the trend in your gear | `equipment_condition_engine.dart` | | Quiet until enough dives |
| Cylinder and gear passports with QR and NFC tags, and fill records; a scan without the app opens the passport or item page here | `cylinder_passports`, `gear_passports` | | NFC on iPhone and Android phones |
| Transmitters tied to cylinders | `transmitters` | | |
| Service and inventory reports as PDF | `service_report_pdf_export_service.dart`, `equipment_inventory_pdf_export_service.dart` | | |
| Certification currency: when each card was last used and when a refresher is due | `certification_currency_engine.dart` | Training > certification > Currency | |
| Pre-dive checklists, including GUE EDGE and a CCR build with O2 cell linearity checks | `kSeedBuiltInPreDiveTemplatesSql`, `cell_linearity.dart` | | |
| An emergency card with chambers nearby, contacts and medical notes; a separate no-fly countdown | `emergency_card_page.dart`, `no_fly_service.dart` | | Works offline |

## Act 3: your data, open

| Claim | Code | Seen | Limit |
|---|---|---|---|
| No Submersion account or server; free, GPL-3.0, no ads, subscriptions or purchases | LICENSE, TERMS.md | | Sync uses your own storage account |
| The database can be encrypted on the device, behind an app lock | `sqlcipher_setup.dart`, `security_settings_page.dart` | | Off until you turn it on |
| Sync through your own Google Drive, Dropbox, S3 or WebDAV server, or Git; iCloud on iPhone and iPad | `CloudProviderType`, `account_group_providers.dart` | Sync > Add an account | End-to-end encryption is a setting you turn on |
| Sync between nearby devices over Bluetooth, with no cloud | `lib/core/services/nearby/` | "Sync nearby automatically" | Not on Linux to Linux |
| A backup before every database upgrade; encrypted backups you schedule | `pre_migration_backup_service.dart`, `backup_crypto.dart` | | Scheduled backups and their encryption are settings |
| Export dives as UDDF 3.2, CSV, Excel and PDF logbooks, and sites as KML | `core/services/export/` | | GPX is for GPS tracks only |
| Raw computer data kept and re-read when the parser improves | `reparse_service.dart` | | Dives downloaded with raw data |
| A change log of every edit, which you can revert | `change_log_page.dart`, `ChangeLogRevertService` | Settings > Data > Change log | Kept 12 months by default |
| A data quality check that compares records with the sensor data and offers repairs | `data_quality` detectors and repairs | Data quality inbox | |
| Agent access on desktop: a local server an AI assistant can use, with a token, showing each change before it is written | `agent_access_server_io.dart`, `preview_changes_tool.dart` | | Desktop only; off by default |

## Platforms row

| Claim | Code | Seen | Limit |
|---|---|---|---|
| iPhone and iPad from the App Store, dive computers over Bluetooth | download section links; libdivecomputer Darwin plugin | iPhone 17 Pro and iPad Pro 11-inch simulators (debug build of `main` at 20da100) | Bluetooth only on iOS |
| Android from Google Play or as an APK from GitHub Releases | download section links | | |
| Desktop layouts with side-by-side panes and keyboard shortcuts; agent access on desktop only | keyboard shortcuts (August table); `agentAccess: hasDesktopWindow()` | Mac app, list beside detail | |
| Sync or nearby Bluetooth sync keeps dives, equipment and settings the same on each device | sync providers; `lib/core/services/nearby/`; synced `diver_settings` | | |

## Not to be advertised

- Everything on the August list.
- Logbook rules as safety checks: they automate edits.
- A side-by-side computer and calculated view.
- iCloud on the Mac (the installed Developer ID build does not offer it).
- A document scanner (documents are photos or files).
- GPX export of dives.

## Release-day check

Before merge, tick each 1.8.5 claim against the published 1.8.5 release notes and cut what did not ship: Home page; trip day page; auto-connect; Suunto, Garmin Connect and divelogs.de sign-in; species in photos and video on all six platforms; buoyancy card; Connections; certification currency; safety review kinds; bailout worst case; deco ppO2 bands; repetitive plan series; condition checks; passports and fill records; nearby Bluetooth sync; Git sync; change log revert; data quality; agent access.
