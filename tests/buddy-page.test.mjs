// The /b page shows a buddy card, which describes a person. The card stays
// in the URL fragment, which never reaches a server, and the page reads it
// in the browser. Nothing else may run on the page that could read it too.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../b.html", import.meta.url), "utf8");

test("b.html runs only its own page script", () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);
  assert.deepEqual(scripts, ['<script type="module" src="/passport/b-page.js">']);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /javascript:/i);
});

test("b.html stays out of search results and sends no referrer", () => {
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.match(html, /<meta name="referrer" content="no-referrer" \/>/);
});

test("b.html offers the app on both stores", () => {
  assert.match(html, /href="https:\/\/apps\.apple\.com\/us\/app\/submersion-dive-log\/id6757456915"/);
  assert.match(html, /href="https:\/\/play\.google\.com\/store\/apps\/details\?id=app\.submersion"/);
  assert.match(html, /href="\/#download"/);
});

test("the page's scripts never send what they read anywhere", () => {
  for (const file of ["b-page.js", "buddy-render.js", "buddy-card.js"]) {
    const js = readFileSync(new URL(`../passport/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|innerHTML|localStorage|sessionStorage|document\.cookie/, file);
  }
});
