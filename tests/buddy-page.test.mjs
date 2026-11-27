// The /b page, which a buddy card link opens on a phone without the app.
// A card describes a person, and its link keeps the card in the URL
// fragment so that it never reaches a server. The page must never read it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../b.html", import.meta.url), "utf8");

test("b.html runs no script, so the card in the fragment is never read", () => {
  assert.doesNotMatch(html, /<script\b/i);
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
