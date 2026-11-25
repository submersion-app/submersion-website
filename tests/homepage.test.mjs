// Pins the homepage's three-act structure: what the page must keep resolving,
// what it must never say, and what it no longer carries.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the depth gauge is gone", () => {
  assert.doesNotMatch(read("index.html"), /depth-gauge|gauge__/);
  assert.doesNotMatch(read("ocean.js"), /gauge|readout|tick/i);
  assert.doesNotMatch(read("styles.css"), /\.gauge|--gauge-w/);
});

const navLinks = (html) => {
  const links = /<div class="nav__links">([\s\S]*?)<\/div>/.exec(html);
  assert.ok(links, "no nav__links block");
  return [...links[1].matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2].trim()]);
};

test("the menu names the three acts", () => {
  assert.deepEqual(navLinks(read("index.html")), [
    ["#dive", "The dive"],
    ["#safety", "Safety"],
    ["#data", "Your data"],
    ["guide/", "Guide"],
    ["https://github.com/submersion-app/submersion", "GitHub"],
    ["#download", "Download"],
  ]);
});

const page = () => read("index.html");
const main = () => /<main[\s\S]*<\/main>/.exec(page())[0];

test("every legacy and act id resolves", () => {
  const ids = [
    "top", "why", "screens", "features", "support", "computer", "log", "sites", "media", "analyze", "plan", "data", "download",
    "dive", "insights", "safety", "review", "gear", "ready", "storage", "open",
  ];
  for (const id of ids) {
    const hits = page().match(new RegExp(`id="${id}"`, "g")) ?? [];
    assert.equal(hits.length, 1, `id="${id}" appears ${hits.length} times`);
  }
});

test("the acts come in order", () => {
  const at = (id) => page().indexOf(`id="${id}"`);
  assert.ok(at("why") < at("dive"), "pillars before act 1");
  assert.ok(at("dive") < at("safety") && at("safety") < at("data") && at("data") < at("download"));
});

test("the h1 names the three ideas, not the lockup tagline", () => {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(page());
  assert.ok(h1 && h1[1].trim(), "no h1");
  assert.doesNotMatch(h1[1], /Dive safe/i);
  // Eric's choice (2026-11-25): the live site's headline stays
  assert.equal(h1[1].trim(), "The complete dive app, free and open.");
});

test("screenshots and files match", () => {
  const used = new Set([...page().matchAll(/(?:src|poster)="screenshots\/([^"]+)"/g)].map((m) => m[1]));
  const files = new Set(readdirSync(new URL("../screenshots/", import.meta.url)));
  assert.deepEqual([...used].sort(), [...files].sort());
});

test("images below the hero are sized, described and lazy", () => {
  for (const img of main().match(/<img\b[^>]*>/g)) {
    for (const attr of [/\swidth="\d+"/, /\sheight="\d+"/, /\salt="[^"]+"/, /\sloading="lazy"/, /\sdecoding="async"/]) {
      assert.match(img, attr, img);
    }
  }
});

test("home.css belongs to the homepage alone", () => {
  const html = page();
  assert.ok(html.indexOf('href="styles.css"') < html.indexOf('href="home.css"'), "home.css not after styles.css");
  for (const inner of ["computers/index.html", "downloads/index.html", "privacy/index.html", "terms/index.html", "guide/index.html"]) {
    assert.doesNotMatch(read(inner), /home\.css/, inner);
  }
});

// The August spec's retired lines, plus words that overclaim safety
const RETIRED = [
  "goes deeper", "Begin descent", "no upsells at 30 metres", "read the fine print", "Buddy check",
  "Clean on the surface, thorough underneath", "See you down there", "Ready to submerse yourself",
  "the wall that dropped into blue", "the turtle at your safety stop",
];

test("no retired or unsafe phrasing", () => {
  // Body text plus the attribute text people see or hear: alt, aria-label, meta content
  const attrs = [...page().matchAll(/\s(?:alt|aria-label|content)="([^"]*)"/g)].map((m) => m[1]).join(" ");
  const text = page().replace(/<[^>]+>/g, " ") + " " + attrs;
  assert.doesNotMatch(text, /\u2014|real time|keeps you safe|prevent|guarantee/i);
  for (const phrase of RETIRED) assert.ok(!text.toLowerCase().includes(phrase.toLowerCase()), phrase);
});

test("the shallow rows read without script", () => {
  // Every row above the mid-water crossover, where light ink would fall below 4.5:1 without the solver
  for (const id of ["computer", "log", "sites", "media", "analyze", "insights"]) {
    assert.match(page(), new RegExp(`<section[^>]*id="${id}"[^>]*data-ink="dark"|<section[^>]*data-ink="dark"[^>]*id="${id}"`), id);
  }
});

test("the solver inks every new text block on its own", () => {
  const blocks = /const INK_BLOCKS = \[([\s\S]*?)\]/.exec(read("ocean.js"))[1];
  for (const sel of ["main .feature-text > *", "main .feature-cards > *", "main .pillars > *"]) {
    assert.ok(blocks.includes(`'${sel}'`), `INK_BLOCKS lacks ${sel}`);
  }
  const first = /'([^']+)'/.exec(blocks)[1];
  for (const cls of [".feature-row", ".feature-cards", ".pillars"]) {
    assert.ok(first.includes(`:not(${cls})`), `first selector still inks ${cls} as one block`);
  }
});

// Eric, 2026-11-24: Submersion is a dive application; "logbook" is the record.
test("the product is a dive application, never a dive log", () => {
  assert.doesNotMatch(page(), /\bdive logs?\b/i);
});

test("the hero shows the dive details page with its profile", () => {
  const hero = /<figure class="hero__art">([\s\S]*?)<\/figure>/.exec(page())[1];
  assert.match(hero, /src="screenshots\/dive-detail\.png"/);
});

test("the species clip is quiet, looped and starts only when motion is allowed", () => {
  const video = /<video\b[^>]*>/.exec(page());
  assert.ok(video, "no video element");
  for (const attr of [/\smuted\b/, /\sloop\b/, /\splaysinline\b/, /\spreload="none"/, /\sposter="screenshots\/video-species\.jpg"/, /\ssrc="screenshots\/video-species\.mp4"/]) {
    assert.match(video[0], attr, video[0]);
  }
  assert.doesNotMatch(video[0], /\sautoplay\b/, "autoplay would ignore reduced motion");
  const ocean = read("ocean.js");
  assert.match(ocean, /video\[data-play-in-view\]/, "ocean.js does not start the clip");
  assert.match(ocean, /reducedMotion\.matches[\s\S]{0,200}video|video[\s\S]{0,400}reducedMotion\.matches/, "clip start ignores reduced motion");
});

test("the hero does not promise the data never leaves the device", () => {
  const lead = /<p class="lead">([\s\S]*?)<\/p>/.exec(page())[1];
  assert.doesNotMatch(lead, /stays on your devices/i, "sync copies the logbook to the user's storage");
});

test("the clip's poster is light enough to load up front", () => {
  const bytes = statSync(new URL("../screenshots/video-species.jpg", import.meta.url)).size;
  assert.ok(bytes < 300 * 1024, `poster is ${bytes} bytes`);
});

test("the no-script inks apply only while the page has no script", () => {
  assert.match(page(), /<html lang="en" class="no-js">/);
  assert.match(read("ocean.js"), /classList\.remove\('no-js'\)/);
  const css = read("home.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [...css.matchAll(/([^{}]+)\{[^}]*--ink-muted:/g)].map((m) => m[1].trim());
  assert.ok(blocks.length >= 2, "no-script ink rules missing");
  for (const sel of blocks) for (const part of sel.split(",")) assert.match(part.trim(), /^html\.no-js /, part);
});

test("paired images stack in one grid cell, not on margins tuned to one aspect", () => {
  const css = read("home.css");
  assert.match(css, /\.feature-visual--pair \{[^}]*display: grid/);
  assert.match(css, /\.feature-visual--pair > \* \{[^}]*grid-area: 1 \/ 1/);
  assert.doesNotMatch(css, /margin(?:-top)?:\s*-\d+%/, "negative percentage margins depend on the first image's aspect");
});

test("the clip stops when reduced motion is turned on later", () => {
  assert.match(read("ocean.js"), /reducedMotion\.addEventListener\('change'/);
});

// Claims the app does not back (code review round 2, checked against the app at 1.8.5)
test("no claim stronger than the app", () => {
  const html = page();
  assert.doesNotMatch(html, /NDL, ceiling, deco stops/, "the ceiling is always calculated");
  assert.doesNotMatch(html, /Dives export as [^.]*KML/, "KML exports sites, not dives");
  assert.doesNotMatch(html, /backup is made before every upgrade/, "backups run before schema migrations");
  assert.doesNotMatch(html, /opens the fill record/, "the /f page only explains the link");
});

// WCAG 2.2.2: moving content that runs longer than 5 seconds needs a way to pause it
test("the clip has a pause control that the auto-play respects", () => {
  const fig = /<figure[^>]*>((?:(?!<\/figure>)[\s\S])*<video[\s\S]*?)<\/figure>/.exec(page());
  assert.ok(fig, "no figure around the clip");
  const button = /<button\b[^>]*data-clip-toggle[^>]*>[\s\S]*?<\/button>/.exec(fig[1]);
  assert.ok(button, "no pause control beside the clip");
  assert.match(button[0], /\stype="button"/);
  assert.match(button[0], /\shidden\b/, "hidden until script can drive it");
  const ocean = read("ocean.js");
  assert.match(ocean, /data-clip-toggle/, "ocean.js does not wire the control");
  assert.match(ocean, /userPaused/, "auto-play does not remember a user's pause");
  assert.match(ocean, /aria-pressed|aria-label/, "the control does not announce its state");
});

// Eric, 2026-11-25: the sites row splits into sites, and photos and species
test("photos and species have their own row after sites", () => {
  const html = page();
  const media = /<section class="zone" id="media"[^>]*>([\s\S]*?)<\/section>/.exec(html);
  assert.ok(media, "no media row");
  // Eric, 2026-11-25: the library leads, with the species identification clip inset
  const order = ["media-browser.jpg", "video-species.mp4"].map((f) => media[1].indexOf(f));
  assert.ok(order.every((i) => i > 0) && order[0] < order[1], String(order));
  assert.match(media[1], /<figure class="feature-visual feature-visual--pair">/);
  assert.doesNotMatch(media[1], /playback\.jpg/);
  assert.match(media[1], /<video\b/);
  assert.ok(html.indexOf('id="sites"') < html.indexOf('id="media"') && html.indexOf('id="media"') < html.indexOf('id="analyze"'));
  const sites = /<section class="zone" id="sites"[^>]*>([\s\S]*?)<\/section>/.exec(html)[1];
  assert.doesNotMatch(sites, /<video\b/);
});

test("the download row shows the duplicate review", () => {
  const row = /<section class="zone" id="computer"[^>]*>([\s\S]*?)<\/section>/.exec(page())[1];
  assert.match(row, /src="screenshots\/duplicate-review\.png"/);
});

// Eric, 2026-11-25: identification covers all media, not photos alone
test("species identification is described for all media", () => {
  const row = /<section class="zone" id="media"[^>]*>([\s\S]*?)<\/section>/.exec(page())[1];
  assert.doesNotMatch(row, /<h4>Species in photos<\/h4>/);
  assert.match(row, /<h4>Species in all media<\/h4>/);
});

// Eric, 2026-11-25: a section before Download showing the same dive on Mac, iPad and iPhone
test("a platforms row shows the same app on Mac, iPad and iPhone before Download", () => {
  const html = page();
  const row = /<section class="zone" id="platforms"[^>]*>([\s\S]*?)<\/section>/.exec(html);
  assert.ok(row, "no platforms row");
  assert.ok(html.indexOf('id="data"') < html.indexOf('id="platforms"') && html.indexOf('id="platforms"') < html.indexOf('id="download"'));
  for (const f of ["platform-mac.png", "platform-ipad.png", "platform-iphone.png"]) assert.match(row[1], new RegExp(`src="screenshots/${f.replace(".", "\\.")}"`), f);
  assert.match(row[1], /<figure class="feature-visual feature-visual--devices">/);
});
