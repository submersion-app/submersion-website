// The user guide page. Its text lives in the app repo's docs/user/ and is read
// from main at view time, so what this page must get right is the wiring:
// pinned, integrity-checked scripts, the right source folder, and a way in
// from every other page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const guide = read("guide/index.html");

const externalTags = [...guide.matchAll(/<(script|link)\b[^>]*\b(?:src|href)="(https:\/\/cdn\.jsdelivr\.net\/[^"]+)"[^>]*>/g)];

test("every CDN file is version-pinned and integrity-checked", () => {
  assert.ok(externalTags.length >= 5, "expected docsify, its search plugin, two themes and the alerts plugin");
  for (const [tag, , url] of externalTags) {
    assert.match(url, /@\d+\.\d+\.\d+\//, `not pinned to an exact version: ${url}`);
    assert.doesNotMatch(url, /@latest/, `floating version: ${url}`);
    assert.match(tag, /\bintegrity="sha384-[A-Za-z0-9+/=]+"/, `no integrity hash: ${url}`);
    assert.match(tag, /\bcrossorigin="anonymous"/, `integrity needs crossorigin: ${url}`);
  }
});

test("the guide reads docs/user/ from the app repo's main branch", () => {
  assert.match(
    guide,
    /basePath:\s*'https:\/\/raw\.githubusercontent\.com\/submersion-app\/submersion\/main\/docs\/user\/'/,
  );
  assert.match(guide, /homepage:\s*'README\.md'/);
});

test("the sidebar comes from docs/user/ and routing is hash-based", () => {
  assert.match(guide, /loadSidebar:\s*true/);
  assert.match(guide, /routerMode:\s*'hash'/);
  assert.match(guide, /relativePath:\s*false/);
});

test("every page offers an edit link into docs/user/ on main", () => {
  assert.match(guide, /https:\/\/github\.com\/submersion-app\/submersion\/edit\/main\/docs\/user\//);
});

test("without JavaScript the reader is sent to the Markdown on GitHub", () => {
  assert.match(guide, /<noscript>[\s\S]*github\.com\/submersion-app\/submersion\/tree\/main\/docs\/user[\s\S]*<\/noscript>/);
});

const sitePages = ["index.html", "computers/index.html", "privacy/index.html", "terms/index.html", "lightroom/index.html"];

test("every header nav links to the guide", () => {
  for (const page of sitePages) {
    const html = read(page);
    const nav = html.match(/<div class="nav__links">([\s\S]*?)<\/div>/);
    if (!nav) continue;
    assert.match(nav[1], /href="(?:\.\.\/)?guide\/">Guide<\/a>/, `${page}: header nav has no Guide link`);
  }
});

test("every footer link row links to the guide", () => {
  for (const page of sitePages) {
    const html = read(page);
    const row = html.match(/<div class="footer__links">([\s\S]*?)<\/div>/);
    if (!row) continue;
    assert.match(row[1], /href="(?:\.\.\/)?guide\/">User Guide<\/a>/, `${page}: footer has no User Guide link`);
  }
});
