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
    fill: null,
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

test("the format version is read as the app's int.tryParse reads it", () => {
  const format = (text) => parsePassportTag(`f=${text}&p=${id}`);
  assert.equal(format("%2B2").format, 2);
  assert.equal(format("%2B2").newerFormat, true);
  assert.equal(format("0x2").format, 2);
  assert.equal(format("%202%20").format, 2);
  assert.equal(format("2.0").format, 1);
});

test("years below 100 are those years, not the 1900s", () => {
  // Date.UTC maps 0 to 99 to 1900 to 1999; the app's DateTime does not.
  assert.equal(parsePassportTag(`f=1&p=${id}&h=0024-06-14`).hydroTest, "0024-06-14");
  // Year 0 is a leap year in the proleptic calendar; 1900 is not.
  assert.equal(parsePassportTag(`f=1&p=${id}&h=0000-02-29`).hydroTest, "0000-02-29");
  assert.equal(parsePassportTag(`f=1&p=${id}&h=0001-02-29`).hydroTest, null);
});

const fillId = "3f0c2b8e-6a1d-4c47-9e2a-5b7d8c9e0f11";
const withFill =
  `f=1&p=${id}&fi=${fillId}&ft=2026-09-28T09%3A30%3A00Z` +
  "&fo=32.1&fh=0&fp=232&fc=24.5&fb=Blue+Hole&fa=Divesoft";

test("reads the newest fill an NFC tag carries", () => {
  assert.deepEqual(parsePassportTag(withFill).fill, {
    id: fillId,
    filledAt: "2026-09-28T09:30:00.000Z",
    o2Percent: 32.1,
    hePercent: 0,
    pressureBar: 232,
    temperatureC: 24.5,
    filledBy: "Blue Hole",
    analyzer: "Divesoft",
  });
});

test("a malformed fill is dropped and the tag still opens", () => {
  const good = `fi=${fillId}&ft=2026-09-28T09:30:00Z`;
  for (const bad of [
    "fi=nope&ft=2026-09-28T09:30:00Z&fo=32",
    `fi=${fillId}&ft=yesterday&fo=32`,
    `fi=${fillId}&ft=2026-09-28T09:30:00&fo=32`,
    `${good}&fo=80&fh=30`,
    good,
    `${good}&fo=0`,
    `${good}&fo=NaN`,
    `${good}&fo=21&fh=-1`,
    `${good}&fo=0x20`,
  ]) {
    const tag = parsePassportTag(`f=1&p=${id}&${bad}`);
    assert.equal(tag.ok, true, bad);
    assert.equal(tag.fill, null, bad);
  }
});

test("an He the app reads as NaN or infinite drops the fill, as the app does", () => {
  // Dart's double.tryParse takes these tokens; the app then refuses the fill.
  for (const he of ["NaN", "Infinity", "-Infinity", "+Infinity"]) {
    const tag = parsePassportTag(
      `f=1&p=${id}&fi=${fillId}&ft=2026-09-28T09:30:00Z&fo=32&fh=${encodeURIComponent(he)}`,
    );
    assert.equal(tag.ok, true, he);
    assert.equal(tag.fill, null, he);
  }
});

test("fill times must be RFC 3339, as the app requires", () => {
  const at = (ft) =>
    parsePassportTag(`f=1&p=${id}&fi=${fillId}&ft=${encodeURIComponent(ft)}&fo=32`).fill;
  assert.equal(at("2026-09-28T09:30:00.123456Z").filledAt, "2026-09-28T09:30:00.123Z");
  for (const bad of [
    "2026-09-28 09:30:00Z",
    "2026-09-28T09:30Z",
    "2026-09-28t09:30:00Z",
    "2026-09-28T09:30:00z",
    "2026-02-30T09:30:00Z",
    "2026-09-28T24:00:00Z",
  ]) {
    assert.equal(at(bad), null, bad);
  }
});

test("a fill without He is air or nitrox, He defaulting to 0", () => {
  const tag = parsePassportTag(`f=1&p=${id}&fi=${fillId}&ft=2026-09-28T09:30:00Z&fo=32`);
  assert.equal(tag.fill.hePercent, 0);
  assert.equal(tag.fill.pressureBar, null);
});

test("out-of-range fill details are dropped, the fill kept, fs ignored", () => {
  const tag = parsePassportTag(
    `f=1&p=${id}&fi=${fillId}&ft=2026-09-28T09:30:00Z&fo=21&fp=900&fc=300&fs=abc`,
  );
  assert.equal(tag.fill.o2Percent, 21);
  assert.equal(tag.fill.pressureBar, null);
  assert.equal(tag.fill.temperatureC, null);
  assert.equal("signature" in tag.fill, false);
});

test("a fill time with an offset reads as the same instant in UTC", () => {
  const tag = parsePassportTag(`f=1&p=${id}&fi=${fillId}&ft=2026-09-28T11:30:00%2B02:00&fo=32`);
  assert.equal(tag.fill.filledAt, "2026-09-28T09:30:00.000Z");
});

test("who filled it and the analyzer are trimmed and cut to 40 characters", () => {
  const long = "\u{1F42C}".repeat(45);
  const tag = parsePassportTag(
    `f=1&p=${id}&fi=${fillId}&ft=2026-09-28T09:30:00Z&fo=32` +
      `&fb=${encodeURIComponent(long)}&fa=+++`,
  );
  assert.equal([...tag.fill.filledBy].length, 40);
  assert.equal(tag.fill.analyzer, null);
});
