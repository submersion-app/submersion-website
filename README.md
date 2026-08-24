# Submersion Website

Single-page marketing site for Submersion (scrollytelling landing page).

## Local preview

- Open `index.html` directly in a browser, or
- Run a simple static server:

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Structure

- `index.html`: the homepage. Nine zones from 0 to 60 m: hero, dive computer download and import, the log, sites and trips, photos and gear, profile analysis, planning, your data, download. Section ids are `computer`, `log`, `sites`, `media`, `analyze`, `plan`, `data`, `download`; the older `why`, `screens`, `features`, `support` anchors still resolve.
- `privacy.html`, `terms.html`: Privacy Policy and Terms of Service (mirrors of `PRIVACY.md` / `TERMS.md` in the app repo; linked from the footer)
- `styles.css`: the visual system (dark-only, zone layouts, feature grids, gauge)
- `ocean.js`: scroll-driven water color, parallax, marine snow, the depth gauge, and section reveals
- `script.js`: release lookup and platform-detecting download button
- `screenshots/`: window captures of the macOS app at 2400 px wide, used on the page
- `assets/`: logo, favicon, App Store badge
- `docs/superpowers/specs/`: design specs for the site (the copy rules and verified-claims table live in the 2026-08-23 spec)
