import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { renderTagPage } from "../passport/render.js";

const id = "8f3a5c1e-1b2c-4d5e-8f90-1234567890ab";
const example = `f=1&p=${id}&w=2026-09-25&n=Steel+12+L&sn=AB12345&wp=232`;

// Every element the renderer reaches for by id.
const PAGE_IDS = [
  "tag",
  "invalid",
  "info",
  "title",
  "newer",
  "spec",
  "fill",
  "fillSummary",
  "fillBy",
  "fillAnalyzer",
  "written",
  "open",
  "notOpened",
];

// Just enough of a document for the page: the elements c.html declares, each
// hidden until shown.
function fakeDocument() {
  const element = (tag = "div") => ({
    tag,
    hidden: true,
    textContent: "",
    href: "",
    children: [],
    listeners: {},
    append(...nodes) {
      this.children.push(...nodes);
    },
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
  });
  const ids = PAGE_IDS;
  const byId = Object.fromEntries(ids.map((i) => [i, element()]));
  return {
    title: "",
    byId,
    getElementById: (i) => byId[i],
    createElement: (tag) => element(tag),
  };
}

function render(query, { visible = true } = {}) {
  const doc = fakeDocument();
  const timers = [];
  renderTagPage({
    doc,
    query,
    locale: "en-US",
    schedule: (fn, ms) => timers.push({ fn, ms }),
    isPageVisible: () => visible,
  });
  return { doc, timers };
}

test("no tag shows what a cylinder tag is", () => {
  const { doc } = render("");
  assert.equal(doc.byId.info.hidden, false);
  assert.equal(doc.byId.tag.hidden, true);
  assert.equal(doc.byId.invalid.hidden, true);
});

test("a damaged tag says so", () => {
  const { doc } = render("f=1&p=nope");
  assert.equal(doc.byId.invalid.hidden, false);
  assert.equal(doc.byId.tag.hidden, true);
});

test("a tag fills the title, the rows, the written line and the app link", () => {
  const { doc } = render(example);
  assert.equal(doc.byId.tag.hidden, false);
  assert.equal(doc.byId.title.textContent, "Steel 12 L");
  assert.equal(doc.title, "Steel 12 L - Submersion");
  assert.deepEqual(
    doc.byId.spec.children.map((c) => `${c.tag}:${c.textContent}`),
    ["dt:Serial number", "dd:AB12345", "dt:Working pressure", "dd:232 bar (3,365 psi)"],
  );
  assert.match(doc.byId.written.textContent, /^This tag was written on Sep 25, 2026\./);
  assert.equal(doc.byId.open.href, `submersion://c?${example}`);
  assert.equal(doc.byId.newer.hidden, true);
});

test("a tag with a fill shows the last fill, who filled it and the analyzer", () => {
  const { doc } = render(
    `${example}&fi=3f0c2b8e-6a1d-4c47-9e2a-5b7d8c9e0f11&ft=2026-09-28T12%3A00%3A00Z` +
      "&fo=21&fh=35&fp=232&fb=Blue+Hole&fa=Divesoft",
  );
  assert.equal(doc.byId.fill.hidden, false);
  assert.equal(doc.byId.fillSummary.textContent, "Tx 21/35 · 232 bar (3,365 psi) · Sep 28, 2026");
  assert.equal(doc.byId.fillBy.textContent, "Filled by Blue Hole");
  assert.equal(doc.byId.fillBy.hidden, false);
  assert.equal(doc.byId.fillAnalyzer.textContent, "Analyzer: Divesoft");
  assert.equal(doc.byId.fillAnalyzer.hidden, false);
});

test("a tag without a fill shows no fill", () => {
  const { doc } = render(example);
  assert.equal(doc.byId.fill.hidden, true);
});

test("a fill with no one named hides those lines", () => {
  const { doc } = render(
    `${example}&fi=3f0c2b8e-6a1d-4c47-9e2a-5b7d8c9e0f11&ft=2026-09-28T12%3A00%3A00Z&fo=32`,
  );
  assert.equal(doc.byId.fill.hidden, false);
  assert.equal(doc.byId.fillBy.hidden, true);
  assert.equal(doc.byId.fillAnalyzer.hidden, true);
});

test("the fill asks the reader to analyse the gas", () => {
  const html = readFileSync(new URL("../c.html", import.meta.url), "utf8");
  assert.match(html, /Last fill on the tag/);
  assert.match(html, /Analyse the gas yourself before you dive it\./);
});

test("a newer format shows its note", () => {
  const { doc } = render(`f=2&p=${id}`);
  assert.equal(doc.byId.newer.hidden, false);
});

test("Open in Submersion that leaves the page here says the app did not open", () => {
  // Without the app the scheme goes nowhere and the page stays in front.
  const { doc, timers } = render(example, { visible: true });
  doc.byId.open.listeners.click();
  assert.equal(timers.length, 1);
  timers[0].fn();
  assert.equal(doc.byId.notOpened.hidden, false);
});

test("Open in Submersion that opens the app says nothing", () => {
  const { doc, timers } = render(example, { visible: false });
  doc.byId.open.listeners.click();
  timers[0].fn();
  assert.equal(doc.byId.notOpened.hidden, true);
});

test("c.html declares every element the renderer uses", () => {
  // The fake document above has them all; the real page must too, or a
  // renamed id leaves the page blank while every other test passes.
  const html = readFileSync(new URL("../c.html", import.meta.url), "utf8");
  for (const pageId of PAGE_IDS) {
    assert.match(html, new RegExp(`id="${pageId}"`), pageId);
  }
});
