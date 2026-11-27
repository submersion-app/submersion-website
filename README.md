# Submersion Website

Marketing site for Submersion: the homepage, the user guide, the download count and the tag landing pages.

## Local preview

- Open `index.html` directly in a browser, or
- Run a simple static server:

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Structure

- `index.html`: the homepage, in three acts after the hero and a row of three cards (`why`): the whole dive (`dive`: `computer`, `log`, `sites`, `analyze`, `insights`), safety (`safety`: `review`, `plan`, `gear`, `ready`) and your data (`data`: `storage`, `open`), then `download`. Each row is a screenshot beside its text, then four feature cards. The older `screens`, `media`, `features` and `support` anchors still resolve. Every claim on it is in `docs/superpowers/specs/2026-11-24-three-act-claims.md`.
- `privacy/`, `terms/`: Privacy Policy and Terms of Service (mirrors of `PRIVACY.md` / `TERMS.md` in the app repo; linked from the footer)
- `styles.css`: the visual system shared by the homepage and the inner pages (water, ink tokens, header, zones, download section, footer, legal pages)
- `home.css`: the homepage's own layout (pillars, acts, feature rows and cards, the hero's sizes); only `index.html` loads it
- `ocean.js`: the water's light rays, bubbles and marine snow, section reveals, the ink solver that picks dark or light text for the water behind each block, and the homepage clip, which plays only while on screen and never under reduced motion
- `script.js`: release lookup and platform-detecting download button
- `downloads/`: the public download count. The page and the line under the home page's download button read `downloads/summary.json` from the app repo's `metrics` branch, and show nothing if it is missing, invalid or more than 7 days old. `scripts/snapshot_downloads.py` in the app repo has the counting rules.
- `screenshots/`: window captures of the macOS app in light mode, trimmed to the window (no shadow) and resized to 2400 px wide, then compressed with `pngquant --quality 70-90`; the buoyancy card is a crop at its native size, and `video-species.mp4` is a 14-second muted H.264 clip (poster `video-species.jpg`)
- `assets/`: logo, favicon, App Store and Google Play badges
- `lightroom/`: Adobe Lightroom integration walkthrough and OAuth callback page (self-contained styles)
- `c.html`, `g.html`, `f.html`: landing pages for cylinder passport tags (`https://submersion.app/c#<payload>`), gear tags (`/g`, any other equipment) and fill records (`/f`). The tag page reads the payload from the URL fragment in the browser, so nothing reaches the server; `passport/tag.js` mirrors the app's decoder (format: `docs/developer/reference/formats/cylinder-passport-tag.md` in the app repo), including the newest fill an NFC tag carries, which the page shows with a note to analyse the gas. The gear tag page works the same way with `passport/gear-tag.js`, which mirrors the app's gear tag decoder (format: `docs/developer/reference/formats/gear-tag.md` in the app repo) and shares the cylinder decoder's text and date rules. The fill record page only explains the link until the app ships that format. `b.html` is the landing page for buddy cards (`/b#<payload>`). `passport/buddy-card.js` mirrors the app's `BuddyCardCodec.decodeLink` and the page shows the card in the browser; a card describes a person, so the page loads no other script and sends nothing anywhere, which `tests/buddy-page.test.mjs` pins.
- `.well-known/`: `apple-app-site-association` and `assetlinks.json`, which let iOS and Android open `/c`, `/g`, `/f` and `/b` links in the app. Android takes the paths from the app's own manifest; only the iOS file lists them. `assetlinks.json` must list the SHA-256 of every certificate that signs an Android build. It lists Play's app-signing key (Play Console, Test and release, App integrity), which signs every copy installed from Google Play, and the CI release key behind the GitHub-release APK (also the Play upload key). Debug keys stay out: a debug keystore's password is the public default, so trusting one would let whoever holds it claim these links.
- `tests/`: `node --test tests/*.test.mjs` runs the tag page's tests, pins the shape of both link files, and pins the homepage's structure, anchors, images and wording rules (`tests/homepage.test.mjs`); also run in CI.
- `.github/workflows/link-files.yml`: after a deploy, and daily, checks that the site serves both link files unchanged and that Apple's CDN and Google's Digital Asset Links have picked them up. GitHub Pages serves `apple-app-site-association` as `application/octet-stream`; this check is what shows whether Apple accepts it.
- `assets/card.css`: the card layout shared by the single-purpose pages (the Lightroom callback and the passport pages).
- `docs/superpowers/specs/`: design specs for the site (the copy rules and verified-claims table live in the 2026-08-23 spec)
