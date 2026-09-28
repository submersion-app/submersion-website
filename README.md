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
- `privacy/`, `terms/`: Privacy Policy and Terms of Service (mirrors of `PRIVACY.md` / `TERMS.md` in the app repo; linked from the footer)
- `styles.css`: the visual system (dark-only, zone layouts, feature grids, gauge)
- `ocean.js`: scroll-driven water color, parallax, marine snow, the depth gauge, and section reveals
- `script.js`: release lookup and platform-detecting download button
- `screenshots/`: window captures of the macOS app at 2400 px wide, used on the page
- `assets/`: logo, favicon, App Store badge
- `lightroom/`: Adobe Lightroom integration walkthrough and OAuth callback page (self-contained styles)
- `c.html`, `f.html`: landing pages for cylinder passport tags (`https://submersion.app/c#<payload>`) and fill records (`/f`). The tag page reads the payload from the URL fragment in the browser, so nothing reaches the server; `passport/tag.js` mirrors the app's decoder (format: `docs/import-formats/cylinder-passport-tag.md` in the app repo). The fill record page only explains the link until the app ships that format.
- `.well-known/`: `apple-app-site-association` and `assetlinks.json`, which let iOS and Android open `/c` and `/f` links in the app. `assetlinks.json` must list the SHA-256 of every certificate that signs an Android build. It lists the CI release key behind the GitHub-release APK and a debug key; Play's app-signing key (Play Console, Setup, App signing) is still to be added, and until it is, copies installed from Google Play open these links in the browser.
- `tests/`: `node --test tests/*.test.mjs` runs the tag parser's tests (also run in CI).
- `docs/superpowers/specs/`: design specs for the site (the copy rules and verified-claims table live in the 2026-08-23 spec)
