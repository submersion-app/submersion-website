import { test } from "node:test";
import assert from "node:assert/strict";

import { BUDDY_CARD_FORMAT, parseBuddyCard } from "../passport/buddy-card.js";

// A payload as the app's BuddyCardCodec.encodeLink writes one: JSON, UTF-8,
// base64url without padding.
const encode = (json) => Buffer.from(JSON.stringify(json), "utf8").toString("base64url");

const now = new Date(Date.UTC(2026, 10, 27));
const parse = (json) => parseBuddyCard(encode(json), now);

const full = {
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
  d: 118,
  f: 2016,
  l: "2026-10-03",
};

test("reads every field of a card", () => {
  const card = parse(full);
  assert.equal(card.ok, true);
  assert.equal(card.format, 1);
  assert.equal(card.newerFormat, false);
  assert.equal(card.trimmed, false);
  assert.equal(card.name, "Sam Diver");
  assert.equal(card.phone, "+44 7700 900123");
  assert.equal(card.email, "sam@example.com");
  assert.equal(card.social, "@samdives");
  assert.deepEqual(card.certs, [
    { agency: "PADI", name: "Rescue Diver", level: "Rescue Diver", cardNumber: "1234567", issueDate: "2024-05-01" },
    { agency: "SSI", name: "Nitrox", level: null, cardNumber: null, issueDate: null },
  ]);
  assert.equal(card.dives, 118);
  assert.equal(card.since, 2016);
  assert.equal(card.lastDive, "2026-10-03");
});

test("reads a name and id alone", () => {
  const card = parse({ v: 1, i: "x", n: "Sam" });
  assert.equal(card.ok, true);
  assert.equal(card.phone, null);
  assert.deepEqual(card.certs, []);
  assert.equal(card.dives, null);
});

test("reads non-ASCII text", () => {
  assert.equal(parse({ v: 1, i: "x", n: "Zoë Ångström 潜水" }).name, "Zoë Ångström 潜水");
});

test("flags a trimmed card and a newer format", () => {
  const card = parse({ v: BUDDY_CARD_FORMAT + 1, i: "x", n: "Sam", t: 1 });
  assert.equal(card.trimmed, true);
  assert.equal(card.newerFormat, true);
});

test("a missing version reads as the current one", () => {
  assert.equal(parse({ i: "x", n: "Sam" }).format, BUDDY_CARD_FORMAT);
});

test("refuses what is not a card", () => {
  for (const payload of ["", "!!!", "eyJ2IjoxfQ", encode([1, 2]), encode("text")]) {
    assert.equal(parseBuddyCard(payload, now).ok, false, payload);
  }
  // Not UTF-8.
  assert.equal(parseBuddyCard(Buffer.from([0xff, 0xfe, 0x7b]).toString("base64url"), now).ok, false);
});

test("refuses a card without a usable id or name", () => {
  assert.equal(parse({ v: 1, n: "Sam" }).ok, false);
  assert.equal(parse({ v: 1, i: " ", n: "Sam" }).ok, false);
  assert.equal(parse({ v: 1, i: "x".repeat(129), n: "Sam" }).ok, false);
  assert.equal(parse({ v: 1, i: 5, n: "Sam" }).ok, false);
  assert.equal(parse({ v: 1, i: "x" }).ok, false);
  assert.equal(parse({ v: 1, i: "x", n: "  " }).ok, false);
  assert.equal(parse({ v: 1, i: "x", n: 7 }).ok, false);
});

test("trims text, caps the name and drops empty or overlong fields", () => {
  const card = parse({ v: 1, i: "x", n: `  ${"N".repeat(250)}  `, p: "  ", e: "e".repeat(501), s: 9 });
  assert.equal(card.name, "N".repeat(200));
  assert.equal(card.phone, null);
  assert.equal(card.email, null);
  assert.equal(card.social, null);
});

test("drops numbers and dates that are not real", () => {
  const card = parse({ v: 1, i: "x", n: "Sam", d: 100001, f: 1899, l: "2026-02-31" });
  assert.equal(card.dives, null);
  assert.equal(card.since, null);
  assert.equal(card.lastDive, null);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", d: -1 }).dives, null);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", d: 1.5 }).dives, null);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", d: 0 }).dives, 0);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", f: 2027 }).since, 2027);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", f: 2028 }).since, null);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", f: "2016" }).since, null);
});

test("skips certifications without an agency and a name, and keeps at most 50", () => {
  const card = parse({ v: 1, i: "x", n: "Sam", c: [["PADI"], [null, "OW"], ["PADI", ""], "OW", ["PADI", "OW", 3, null, "bad"]] });
  assert.deepEqual(card.certs, [{ agency: "PADI", name: "OW", level: null, cardNumber: null, issueDate: null }]);
  const many = parse({ v: 1, i: "x", n: "Sam", c: Array.from({ length: 60 }, (_, k) => ["A", `C${k}`]) });
  assert.equal(many.certs.length, 50);
  assert.equal(parse({ v: 1, i: "x", n: "Sam", c: "OW" }).certs.length, 0);
});

test("ignores a photo, which a link never carries", () => {
  assert.equal("photo" in parse({ v: 1, i: "x", n: "Sam", ph: "AAAA" }), false);
});
