// Reading rules from the app repo's docs/import-formats/cylinder-passport-tag.md.
// Run with: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { parsePassportTag } from "../passport/tag.js";

const id = "8f3a5c1e-1b2c-4d5e-8f90-1234567890ab";
const full =
  `f=1&p=${id}&w=2026-09-25&n=Steel+12+L&sn=AB12345&v=12&wp=232` +
  "&m=st&vt=din&h=2024-06-14&vi=2026-03-02&oc=1";

test("reads every field of the documented example", () => {
  assert.deepEqual(parsePassportTag(full), {
    ok: true,
    format: 1,
    newerFormat: false,
    passportId: id,
    writtenOn: "2026-09-25",
    name: "Steel 12 L",
    serial: "AB12345",
    volumeL: 12,
    workingPressureBar: 232,
    material: "st",
    valve: "din",
    hydroTest: "2024-06-14",
    visualInspection: "2026-03-02",
    o2Clean: true,
  });
});

test("only f and p are required", () => {
  const tag = parsePassportTag(`f=1&p=${id}`);
  assert.equal(tag.ok, true);
  assert.equal(tag.passportId, id);
  assert.equal(tag.name, null);
  assert.equal(tag.o2Clean, false);
});

test("a missing or malformed p is no tag", () => {
  assert.equal(parsePassportTag("f=1").ok, false);
  assert.equal(parsePassportTag("f=1&p=not-a-uuid").ok, false);
  assert.equal(parsePassportTag("").ok, false);
});

test("the passport id is compared case-insensitively and kept lower case", () => {
  const tag = parsePassportTag(`f=1&p=${id.toUpperCase()}`);
  assert.equal(tag.passportId, id);
});

test("a missing or unreadable f reads as format 1, a newer f opens with a note", () => {
  // As the app does: only p is checked strictly.
  assert.equal(parsePassportTag(`p=${id}`).format, 1);
  assert.equal(parsePassportTag(`f=x&p=${id}`).format, 1);
  const newer = parsePassportTag(`f=2&p=${id}&n=Tank`);
  assert.equal(newer.ok, true);
  assert.equal(newer.newerFormat, true);
  assert.equal(newer.name, "Tank");
});

test("out-of-range numbers and unparseable dates are dropped", () => {
  const tag = parsePassportTag(
    `f=1&p=${id}&v=51&wp=49&w=2026-02-30&h=soon&vi=2026-13-01&m=wood&vt=bayonet`,
  );
  assert.equal(tag.ok, true);
  assert.equal(tag.volumeL, null);
  assert.equal(tag.workingPressureBar, null);
  assert.equal(tag.writtenOn, null);
  assert.equal(tag.hydroTest, null);
  assert.equal(tag.visualInspection, null);
  assert.equal(tag.material, null);
  assert.equal(tag.valve, null);
});

test("a volume is any number in range, a pressure an integer", () => {
  assert.equal(parsePassportTag(`f=1&p=${id}&v=11.1`).volumeL, 11.1);
  assert.equal(parsePassportTag(`f=1&p=${id}&v=0.5`).volumeL, 0.5);
  assert.equal(parsePassportTag(`f=1&p=${id}&v=50`).volumeL, 50);
  assert.equal(parsePassportTag(`f=1&p=${id}&wp=400`).workingPressureBar, 400);
  assert.equal(parsePassportTag(`f=1&p=${id}&wp=232.5`).workingPressureBar, null);
});

test("unknown keys are ignored", () => {
  const tag = parsePassportTag(`f=1&p=${id}&zz=1&n=A`);
  assert.equal(tag.ok, true);
  assert.equal(tag.name, "A");
});

test("names and serials are cut to their limits by whole characters", () => {
  const long = "\u{1F420}".repeat(45);
  const tag = parsePassportTag(
    `f=1&p=${id}&n=${encodeURIComponent(long)}&sn=${"9".repeat(30)}`,
  );
  assert.equal([...tag.name].length, 40);
  assert.equal(tag.serial.length, 24);
});

test("broken percent-encoding is no tag rather than an error", () => {
  assert.equal(parsePassportTag(`f=1&p=${id}&n=%E0%A4%A`).ok, false);
});

test("numbers follow the app's grammar, not JavaScript's", () => {
  // The app reads v with double.tryParse and wp with int.tryParse.
  const v = (text) => parsePassportTag(`f=1&p=${id}&v=${text}`).volumeL;
  const wp = (text) => parsePassportTag(`f=1&p=${id}&wp=${text}`).workingPressureBar;
  assert.equal(v("0x10"), null);
  assert.equal(v("0b1010"), null);
  assert.equal(v(".5"), 0.5);
  assert.equal(v("1.2e1"), 12);
  assert.equal(v("Infinity"), null);
  assert.equal(wp("232.0"), null);
  assert.equal(wp("2.32e2"), null);
  assert.equal(wp("0xE8"), 232);
  assert.equal(wp("%2B232"), 232);
});
