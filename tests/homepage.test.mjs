// Pins the homepage's three-act structure: what the page must keep resolving,
// what it must never say, and what it no longer carries.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

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
});

test("screenshots and files match", () => {
  const used = new Set([...page().matchAll(/src="screenshots\/([^"]+)"/g)].map((m) => m[1]));
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
  const text = page().replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(text, /\u2014|real time|keeps you safe|prevent|guarantee/i);
  for (const phrase of RETIRED) assert.ok(!text.toLowerCase().includes(phrase.toLowerCase()), phrase);
});

test("the shallow rows read without script", () => {
  for (const id of ["computer", "log", "sites"]) {
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
  assert.doesNotMatch(page(), /dive log(?!book)/i);
});

test("the hero shows the dive details page with its profile", () => {
  const hero = /<figure class="hero__art">([\s\S]*?)<\/figure>/.exec(page())[1];
  assert.match(hero, /src="screenshots\/dive-detail\.png"/);
});
