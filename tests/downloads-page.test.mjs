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
