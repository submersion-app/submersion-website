// Pins how the download count appears: where it sits, that it starts hidden, and
// that it stays apart from the release lookup behind the download button.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the home line starts hidden and links to the page", () => {
  const line = /<p[^>]*id="download-count"[\s\S]*?<\/p>/.exec(read("index.html"));
  assert.ok(line, "no download-count line");
  assert.match(line[0], /\shidden[\s>]/);
  assert.match(line[0], /href="downloads\/"/);
  assert.match(line[0], /<\/strong>\s*downloads from GitHub/);
});

test("the home line sits between the download button and the store badges", () => {
  const html = read("index.html");
  const order = ["download-primary-meta", 'id="download-count"', 'id="download-stores"'].map((s) =>
    html.indexOf(s),
  );
  assert.ok(order[0] > 0 && order[0] < order[1] && order[1] < order[2], String(order));
});

test("the home line loads on its own, away from the release lookup", () => {
  assert.match(read("index.html"), /<script type="module" src="downloads\/home-line\.js"><\/script>/);
  assert.doesNotMatch(read("script.js"), /download-count/);
});

test("the home page adds nothing to the top menu", () => {
  const links = /<div class="nav__links">([\s\S]*?)<\/div>/.exec(read("index.html"));
  assert.doesNotMatch(links[1], /downloads\//);
});

const page = () => read("downloads/index.html");

test("the page carries the required copy", () => {
  assert.match(page(), /downloads from GitHub, including app updates/);
  assert.match(page(), /App Store and Google Play installs are not counted\./);
});

test("the trend placeholder is the approved wording", () => {
  assert.match(
    read("downloads/page.js"),
    /The trend will appear here once a few weeks of daily snapshots have built up\. GitHub keeps no history, so it starts from the first snapshot\./,
  );
});

test("numbers and the unavailable message both start hidden", () => {
  assert.match(page(), /id="numbers"[^>]*\shidden/);
  assert.match(page(), /id="unavailable"[^>]*\shidden/);
});

test("the page explains itself without JavaScript", () => {
  assert.match(page(), /<noscript>[\s\S]*github\.com\/submersion-app\/submersion\/releases[\s\S]*<\/noscript>/);
});

test("the page says it is loading, and announces the result", () => {
  assert.match(page(), /id="loading"[^>]*\shidden/);
  assert.match(page(), /class="downloads__sheet" aria-live="polite"/);
});

test("the page has its canonical address", () => {
  assert.match(page(), /<link rel="canonical" href="https:\/\/submersion\.app\/downloads\/" \/>/);
});

test("page.js never writes data as HTML", () => {
  assert.doesNotMatch(read("downloads/page.js"), /innerHTML|insertAdjacentHTML/);
});
