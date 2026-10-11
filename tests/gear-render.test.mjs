import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { renderGearTagPage } from "../passport/gear-render.js";
import { OPEN_APP_WAIT_MS } from "../passport/render.js";

const id = "8f3a5c1e-1b2c-4d5e-8f90-1234567890ab";
const example =
  `f=1&p=${id}&w=2026-10-10&t=firstStage&n=Apeks+XTX50+primary` +
  "&b=Apeks&mo=XTX50&sn=AB12345&ls=2026-03-02";

// Every element the renderer reaches for by id.
const PAGE_IDS = ["tag", "invalid", "info", "title", "newer", "spec", "written", "open", "notOpened"];

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
  const byId = Object.fromEntries(PAGE_IDS.map((i) => [i, element()]));
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
  renderGearTagPage({
    doc,
    query,
    locale: "en-US",
    schedule: (fn, ms) => timers.push({ fn, ms }),
    isPageVisible: () => visible,
  });
  return { doc, timers };
}

const rows = (doc) => {
  const cells = doc.byId.spec.children.map((c) => c.textContent);
  const pairs = [];
  for (let i = 0; i < cells.length; i += 2) pairs.push([cells[i], cells[i + 1]]);
  return pairs;
};

test("no tag shows what a gear tag is", () => {
  const { doc } = render("");
  assert.equal(doc.byId.info.hidden, false);
  assert.equal(doc.byId.tag.hidden, true);
  assert.equal(doc.byId.invalid.hidden, true);
});

test("a link that is no gear tag says so", () => {
  for (const query of ["t=fins", `p=${id}&t=tank`, `p=${id}`]) {
    const { doc } = render(query);
    assert.equal(doc.byId.invalid.hidden, false, query);
    assert.equal(doc.byId.tag.hidden, true, query);
  }
});

test("the documented example shows the gear as the tag has it", () => {
  const { doc } = render(example);
  assert.equal(doc.byId.tag.hidden, false);
  assert.equal(doc.byId.title.textContent, "Apeks XTX50 primary");
  assert.equal(doc.title, "Apeks XTX50 primary - Submersion");
  assert.equal(doc.byId.newer.hidden, true);
  assert.deepEqual(rows(doc), [
    ["Type", "First Stage"],
    ["Brand", "Apeks"],
    ["Model", "XTX50"],
    ["Serial number", "AB12345"],
    ["Last service", "Mar 2, 2026"],
  ]);
  assert.match(doc.byId.written.textContent, /^This tag was written on Oct 10, 2026\./);
});

test("an unnamed item is titled by its type, an unknown type as Gear", () => {
  assert.equal(render(`p=${id}&t=bcd`).doc.byId.title.textContent, "BCD");
  const { doc } = render(`p=${id}&t=jetpack`);
  assert.equal(doc.byId.title.textContent, "Gear");
  assert.deepEqual(rows(doc), [["Type", "Gear"]]);
});

test("a newer format shows the note", () => {
  assert.equal(render(`f=2&p=${id}&t=fins`).doc.byId.newer.hidden, false);
});

test("Open in Submersion carries the tag in the app's own scheme", () => {
  assert.equal(render(example).doc.byId.open.href, `submersion://g?${example}`);
});

test("when the app does not take over, the page suggests getting it", () => {
  const { doc, timers } = render(example, { visible: true });
  doc.byId.open.listeners.click();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, OPEN_APP_WAIT_MS);
  timers[0].fn();
  assert.equal(doc.byId.notOpened.hidden, false);
});

test("when the app opens, the page stays quiet", () => {
  const { doc, timers } = render(example, { visible: false });
  doc.byId.open.listeners.click();
  timers[0].fn();
  assert.equal(doc.byId.notOpened.hidden, true);
});

test("g.html declares every element the renderer uses", () => {
  const html = readFileSync(new URL("../g.html", import.meta.url), "utf8");
  for (const i of PAGE_IDS) assert.match(html, new RegExp(`id="${i}"`), i);
  assert.match(html, /src="\/passport\/g-page\.js"/);
});
