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
- `c.html`, `f.html`: landing pages for cylinder passport tags (`https://submersion.app/c#<payload>`) and fill records (`/f`). The tag page reads the payload from the URL fragment in the browser, so nothing reaches the server; `passport/tag.js` mirrors the app's decoder (format: `docs/import-formats/cylinder-passport-tag.md` in the app repo), including the newest fill an NFC tag carries, which the page shows with a note to analyse the gas. The fill record page only explains the link until the app ships that format.
- `.well-known/`: `apple-app-site-association` and `assetlinks.json`, which let iOS and Android open `/c` and `/f` links in the app. `assetlinks.json` must list the SHA-256 of every certificate that signs an Android build. It lists Play's app-signing key (Play Console, Test and release, App integrity), which signs every copy installed from Google Play, and the CI release key behind the GitHub-release APK (also the Play upload key). Debug keys stay out: a debug keystore's password is the public default, so trusting one would let whoever holds it claim these links.
- `tests/`: `node --test tests/*.test.mjs` runs the tag page's tests and pins the shape of both link files (also run in CI).
- `.github/workflows/link-files.yml`: after a deploy, and daily, checks that the site serves both link files unchanged and that Apple's CDN and Google's Digital Asset Links have picked them up. GitHub Pages serves `apple-app-site-association` as `application/octet-stream`; this check is what shows whether Apple accepts it.
- `assets/card.css`: the card layout shared by the single-purpose pages (the Lightroom callback and the passport pages).
- `docs/superpowers/specs/`: design specs for the site (the copy rules and verified-claims table live in the 2026-08-23 spec)
