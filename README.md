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

- `index.html` — page markup/content
- `privacy.html`, `terms.html` — Privacy Policy and Terms of Service (mirrors of `PRIVACY.md` / `TERMS.md` in the app repo; linked from the footer)
- `styles.css` — styling
- `script.js` — scroll-driven screenshot swapping + progressive expansion
- `screenshots/` — UI screenshots used on the page
- `assets/submersion-logo.png` — Submersion logo used in nav + favicon
