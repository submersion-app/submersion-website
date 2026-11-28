import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { renderEmergencyTagPage } from "../passport/emergency-render.js";

const example =
  "f=1&w=2026-11-27&n=Sam+Diver&y=1984&al=Penicillin&me=None&bt=O%2B" +
  "&mn=Asthma+as+a+child&c1=Alex+Diver&r1=Partner&p1=%2B15551234567" +
  "&in=DAN&ip=1234567&il=%2B19196849111";

// Every element the renderer reaches for by id, in the order e.html holds
// them: the order of the tag's text record.
const PAGE_IDS = [
  "tag",
  "name",
  "born",
  "newer",
  "allergiesBlock",
  "allergies",
  "contactsBlock",
  "contacts",
  "insuranceBlock",
  "insurance",
  "details",
  "written",
  "trimmed",
  "invalid",
  "info",
];

function fakeDocument() {
  const element = (tag = "div") => ({
    tag,
    hidden: true,
    className: "",
    textContent: "",
    href: "",
    children: [],
    append(...nodes) {
      this.children.push(...nodes);
    },
    set innerHTML(_) {
      throw new Error("innerHTML is never used");
    },
  });
  const byId = Object.fromEntries(PAGE_IDS.map((i) => [i, element()]));
  return {
    title: "Emergency info - Submersion",
    byId,
    getElementById: (i) => byId[i],
    createElement: (tag) => element(tag),
  };
}

function render(query) {
  const doc = fakeDocument();
  renderEmergencyTagPage({ doc, query, locale: "en-US" });
  return doc;
}

// Every element under a node, depth first, in page order.
function flatten(node) {
  return [node, ...node.children.flatMap(flatten)];
}

const texts = (node) =>
  flatten(node)
    .slice(1)
    .filter((n) => n.children.length === 0)
    .map((n) => n.textContent);

const rows = (doc) => {
  const cells = doc.byId.details.children.map((c) => c.textContent);
  const pairs = [];
  for (let i = 0; i < cells.length; i += 2) pairs.push([cells[i], cells[i + 1]]);
  return pairs;
};

test("no tag shows what an emergency tag is", () => {
  const doc = render("");
  assert.equal(doc.byId.info.hidden, false);
  assert.equal(doc.byId.tag.hidden, true);
  assert.equal(doc.byId.invalid.hidden, true);
});

test("a link without a name says it is no emergency tag", () => {
  for (const query of ["al=Penicillin", "n=", "x"]) {
    const doc = render(query);
    assert.equal(doc.byId.invalid.hidden, false, query);
    assert.equal(doc.byId.tag.hidden, true, query);
  }
});

test("the documented example shows every detail, in the text record's order", () => {
  const doc = render(example);
  assert.equal(doc.byId.tag.hidden, false);
  assert.equal(doc.byId.name.textContent, "Sam Diver");
  assert.equal(doc.byId.born.hidden, false);
  assert.equal(doc.byId.born.textContent, "Born 1984");
  assert.equal(doc.byId.newer.hidden, true);

  assert.equal(doc.byId.allergiesBlock.hidden, false);
  assert.equal(doc.byId.allergies.textContent, "Penicillin");

  assert.equal(doc.byId.contactsBlock.hidden, false);
  assert.deepEqual(texts(doc.byId.contacts), ["Alex Diver (Partner)", "Call +15551234567"]);

  assert.equal(doc.byId.insuranceBlock.hidden, false);
  assert.deepEqual(texts(doc.byId.insurance), [
    "DAN",
    "Policy 1234567",
    "Call the 24-hour line +19196849111",
  ]);

  assert.equal(doc.byId.details.hidden, false);
  assert.deepEqual(rows(doc), [
    ["Medications", "None"],
    ["Blood type", "O+"],
    ["Medical notes", "Asthma as a child"],
  ]);

  assert.equal(doc.byId.written.textContent, "Written on Nov 27, 2026 by the diver.");
  assert.equal(doc.byId.trimmed.hidden, true);
});

test("the page title stays generic, so the name stays out of history", () => {
  assert.equal(render(example).title, "Emergency info - Submersion");
});

test("phone numbers are tel: links", () => {
  const doc = render(example + "&c2=Jo&p2=%2B44+20+7946+0000");
  const calls = [doc.byId.contacts, doc.byId.insurance]
    .flatMap(flatten)
    .filter((n) => n.tag === "a");
  assert.deepEqual(
    calls.map((a) => [a.className, a.href]),
    [
      ["call", "tel:+15551234567"],
      ["call", "tel:+442079460000"],
      ["call", "tel:+19196849111"],
    ],
  );
});

test("a number that cannot be dialled shows as text, without a link", () => {
  const doc = render("n=Sam&c1=Alex&p1=ask+the+boat");
  const nodes = flatten(doc.byId.contacts);
  assert.equal(nodes.some((n) => n.tag === "a"), false);
  assert.deepEqual(texts(doc.byId.contacts), ["Alex", "Call ask the boat"]);
});

test("t=1 adds the note that details were left off", () => {
  assert.equal(render("n=Sam&t=1").byId.trimmed.hidden, false);
});

test("a tag with only a name hides every empty section", () => {
  const doc = render("n=Sam");
  assert.equal(doc.byId.tag.hidden, false);
  for (const id of ["born", "allergiesBlock", "contactsBlock", "insuranceBlock", "details", "trimmed"]) {
    assert.equal(doc.byId[id].hidden, true, id);
  }
  assert.equal(doc.byId.written.textContent, "Written by the diver.");
});

test("a newer format shows the note", () => {
  assert.equal(render("f=2&n=Sam").byId.newer.hidden, false);
});

test("markup in a value is shown as text", () => {
  const evil = encodeURIComponent("<script>alert(1)</script>");
  const doc = render(`n=${evil}&al=${evil}&c1=${evil}&in=${evil}&me=${evil}`);
  assert.equal(doc.byId.name.textContent, "<script>alert(1)</script>");
  assert.equal(doc.byId.allergies.textContent, "<script>alert(1)</script>");
  assert.deepEqual(texts(doc.byId.contacts), ["<script>alert(1)</script>"]);
  assert.deepEqual(texts(doc.byId.insurance), ["<script>alert(1)</script>"]);
  assert.deepEqual(rows(doc), [["Medications", "<script>alert(1)</script>"]]);
});

test("e.html declares every element the renderer uses, in the text record's order", () => {
  const html = readFileSync(new URL("../e.html", import.meta.url), "utf8");
  let last = -1;
  for (const i of PAGE_IDS) {
    const at = html.indexOf(`id="${i}"`);
    assert.notEqual(at, -1, i);
    assert.ok(at > last, `${i} is out of order`);
    last = at;
  }
  assert.match(html, /src="\/passport\/e-page\.js"/);
});

test("e.html keeps the details out of the referrer, search and other hosts", () => {
  const html = readFileSync(new URL("../e.html", import.meta.url), "utf8");
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.match(html, /<meta name="referrer" content="no-referrer" \/>/);
  assert.match(html, /http-equiv="Content-Security-Policy"[^>]*connect-src 'none'/);
  assert.match(html, /<title>Emergency info - Submersion<\/title>/);
});

test("the readable tag offers no app and no store: the reader is helping the diver", () => {
  const html = readFileSync(new URL("../e.html", import.meta.url), "utf8");
  const tag = html.slice(html.indexOf('id="tag"'), html.indexOf('id="invalid"'));
  assert.doesNotMatch(tag, /submersion:\/\//);
  assert.doesNotMatch(tag, /apps\.apple\.com|play\.google\.com|#download/);
  const info = html.slice(html.indexOf('id="info"'));
  assert.match(info, /href="\/#download">Get Submersion</);
});

test("the page's scripts send, store and inject nothing", () => {
  for (const file of ["e-page.js", "emergency-render.js", "emergency-tag.js"]) {
    const source = readFileSync(new URL(`../passport/${file}`, import.meta.url), "utf8");
    for (const word of ["fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage", "innerHTML", "WebSocket", "indexedDB", "document.cookie"]) {
      assert.equal(source.includes(word), false, `${file} uses ${word}`);
    }
  }
});
