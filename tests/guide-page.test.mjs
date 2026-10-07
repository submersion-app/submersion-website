// The user guide page. Its text lives in the app repo's docs/user/ and is read
// from main at view time, so what this page must get right is the wiring:
// pinned, integrity-checked scripts, the right source folder, and a way in
// from every other page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const guide = read("guide/index.html");

// Every external script or stylesheet. Google Fonts serves a different file
// per browser, so it cannot carry an integrity hash and is the one exception.
const externalTags = [
  ...guide.matchAll(/<(script|link)\b[^>]*\b(?:src|href)="(https:\/\/[^"]+)"[^>]*>/g),
].filter(([tag, , url]) => /^<script|rel="stylesheet"/.test(tag) && !url.startsWith("https://fonts.googleapis.com/"));

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

// The pages with the site's header and footer. lightroom/ is a standalone
// integration overview with its own minimal footer and no site header.
const sitePages = ["index.html", "computers/index.html", "privacy/index.html", "terms/index.html"];

test("every header nav links to the guide", () => {
  for (const page of sitePages) {
    const nav = read(page).match(/<div class="nav__links">([\s\S]*?)<\/div>/);
    assert.ok(nav, `${page}: no header nav found`);
    assert.match(nav[1], /href="(?:\.\.\/)?guide\/">Guide<\/a>/, `${page}: header nav has no Guide link`);
  }
});

test("every footer link row links to the guide", () => {
  for (const page of sitePages) {
    const row = read(page).match(/<div class="footer__links">([\s\S]*?)<\/div>/);
    assert.ok(row, `${page}: no footer link row found`);
    assert.match(row[1], /href="(?:\.\.\/)?guide\/">User Guide<\/a>/, `${page}: footer has no User Guide link`);
  }
});

const css = read("guide/guide.css");

test("the theme sets docsify 5's variables, not its 4.x names", () => {
  for (const name of ["--color-bg", "--color-text", "--font-family", "--sidebar-bg", "--sidebar-link-color"]) {
    assert.match(css, new RegExp(`${name}:`), `guide.css does not set ${name}`);
  }
  for (const old of ["--base-background-color", "--base-color", "--base-font-family", "--sidebar-background", "--sidebar-nav-link-color"]) {
    assert.doesNotMatch(css, new RegExp(`${old}:`), `${old} is a docsify 4 name that docsify 5 ignores`);
  }
});

test("the site links bar scrolls with the page instead of floating over it", () => {
  const rule = css.match(/\.guide-nav\s*\{([^}]*)\}/);
  assert.ok(rule, "no .guide-nav rule");
  assert.doesNotMatch(rule[1], /position:\s*fixed/);
});

test("the guide's name returns to its home page without reloading", () => {
  assert.match(guide, /nameLink:\s*'#\/'/);
});

test("a page that failed to load gets no edit link", () => {
  assert.match(guide, /\(vm\.route\.response \|\| \{\}\)\.status >= 400\) return html;/);
});

test("the guide preconnects to the origins it loads from", () => {
  for (const origin of ["https://cdn.jsdelivr.net", "https://raw.githubusercontent.com"]) {
    assert.match(guide, new RegExp(`<link rel="preconnect" href="${origin}"`), `no preconnect to ${origin}`);
  }
});

// The guide inserts Markdown from another repository as HTML, so a content
// security policy is what stops a script in that Markdown from running.
const csp = guide.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? "";
const directive = (name) => (csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "").split(/\s+/).slice(1);

test("a content security policy keeps scripts in the Markdown from running", () => {
  assert.ok(csp, "guide/index.html has no Content-Security-Policy");
  const scriptSrc = directive("script-src");
  assert.ok(scriptSrc.length > 0, "no script-src directive");
  assert.ok(!scriptSrc.includes("'unsafe-inline'"), "script-src allows inline script, so onerror attributes would run");
  assert.ok(!scriptSrc.includes("'unsafe-eval'"), "script-src allows eval");
  assert.deepEqual(directive("object-src"), ["'none'"]);
  assert.match(guide, /executeScript:\s*false/);
});

test("the policy allows the inline configuration by its current hash", () => {
  const inline = guide.match(/<script>([\s\S]*?)<\/script>/)[1];
  const hash = `'sha256-${createHash("sha256").update(inline, "utf8").digest("base64")}'`;
  assert.ok(directive("script-src").includes(hash), `script-src lacks the inline configuration's hash; set it to ${hash}`);
});

test("the policy lets the guide load its scripts, styles, fonts and Markdown", () => {
  assert.ok(directive("script-src").includes("https://cdn.jsdelivr.net"));
  assert.ok(directive("style-src").includes("https://cdn.jsdelivr.net"));
  assert.ok(directive("style-src").includes("https://fonts.googleapis.com"));
  assert.ok(directive("font-src").includes("https://fonts.gstatic.com"));
  assert.ok(directive("connect-src").includes("https://raw.githubusercontent.com"));
});
