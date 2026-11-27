import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { renderBuddyCardPage } from "../passport/buddy-render.js";

const encode = (json) => Buffer.from(JSON.stringify(json), "utf8").toString("base64url");
const now = new Date(Date.UTC(2026, 10, 27));

const example = encode({
  v: 1,
  i: "d1a2b3c4",
  n: "Sam Diver",
  p: "+44 7700 900123",
  e: "sam@example.com",
  s: "@samdives",
  c: [
    ["PADI", "Rescue Diver", "Rescue Diver", "1234567", "2024-05-01"],
    ["SSI", "Nitrox"],
  ],
  d: 1180,
  f: 2016,
  l: "2026-10-03",
});

// Every element the renderer reaches for by id.
const PAGE_IDS = ["card", "invalid", "info", "title", "newer", "trimmed", "spec", "certs", "certList"];

function fakeDocument() {
  const element = (tag = "div") => ({
    tag,
    hidden: true,
    textContent: "",
    className: "",
    children: [],
    append(...nodes) {
      this.children.push(...nodes);
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

function render(fragment) {
  const doc = fakeDocument();
  renderBuddyCardPage({ doc, fragment, locale: "en-US", now });
  return doc;
}

const rows = (doc) => {
  const cells = doc.byId.spec.children.map((c) => c.textContent);
  const pairs = [];
  for (let i = 0; i < cells.length; i += 2) pairs.push([cells[i], cells[i + 1]]);
  return pairs;
};

const certs = (doc) => doc.byId.certList.children.map((li) => li.children.map((c) => c.textContent));

test("no card shows what a buddy card is", () => {
  const doc = render("");
  assert.equal(doc.byId.info.hidden, false);
  assert.equal(doc.byId.card.hidden, true);
  assert.equal(doc.byId.invalid.hidden, true);
});

test("an unreadable card says so", () => {
  const doc = render("not-a-card");
  assert.equal(doc.byId.invalid.hidden, false);
  assert.equal(doc.byId.card.hidden, true);
});

test("a card shows the diver's details with the app's labels", () => {
  const doc = render(example);
  assert.equal(doc.byId.card.hidden, false);
  assert.equal(doc.byId.title.textContent, "Sam Diver");
  assert.equal(doc.title, "Sam Diver - Submersion");
  assert.deepEqual(rows(doc), [
    ["Phone", "+44 7700 900123"],
    ["Email", "sam@example.com"],
    ["Social handle", "@samdives"],
    ["Dives", "1,180"],
    ["Diving since", "2016"],
    ["Last dive", "Oct 3, 2026"],
  ]);
  assert.equal(doc.byId.newer.hidden, true);
  assert.equal(doc.byId.trimmed.hidden, true);
});

test("certifications are listed highest first, with their details when shared", () => {
  const doc = render(example);
  assert.equal(doc.byId.certs.hidden, false);
  assert.deepEqual(certs(doc), [
    ["PADI Rescue Diver", "Card 1234567 · Issued May 1, 2024"],
    ["SSI Nitrox"],
  ]);
});

test("a level different from the name joins the details", () => {
  const doc = render(encode({ v: 1, i: "x", n: "Sam", c: [["TDI", "Advanced Nitrox", "Technical"]] }));
  assert.deepEqual(certs(doc), [["TDI Advanced Nitrox", "Technical"]]);
});

test("a card with only a name shows no empty boxes", () => {
  const doc = render(encode({ v: 1, i: "x", n: "Sam" }));
  assert.equal(doc.byId.spec.hidden, true);
  assert.equal(doc.byId.certs.hidden, true);
});

test("a trimmed card and a newer format each get their note", () => {
  const doc = render(encode({ v: 2, i: "x", n: "Sam", t: 1 }));
  assert.equal(doc.byId.trimmed.hidden, false);
  assert.equal(doc.byId.newer.hidden, false);
});

test("text from the card is set as text, never as markup", () => {
  const doc = render(encode({ v: 1, i: "x", n: "<img src=x onerror=alert(1)>" }));
  assert.equal(doc.byId.title.textContent, "<img src=x onerror=alert(1)>");
});

test("b.html declares every element the renderer uses", () => {
  const html = readFileSync(new URL("../b.html", import.meta.url), "utf8");
  for (const i of PAGE_IDS) assert.match(html, new RegExp(`id="${i}"`), i);
  assert.match(html, /src="\/passport\/b-page\.js"/);
});
