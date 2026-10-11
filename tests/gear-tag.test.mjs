// Reading rules from the app repo's docs/developer/reference/formats/gear-tag.md.
// Run with: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGearTag } from "../passport/gear-tag.js";

const id = "8f3a5c1e-1b2c-4d5e-8f90-1234567890ab";
// The format document's worked example.
const example =
  `f=1&p=${id}&w=2026-10-10&t=firstStage&n=Apeks+XTX50+primary` +
  "&b=Apeks&mo=XTX50&sn=AB12345&ls=2026-03-02";

test("reads every field of the documented example", () => {
  assert.deepEqual(parseGearTag(example), {
    ok: true,
    format: 1,
    newerFormat: false,
    passportId: id,
    typeCode: "firstStage",
    writtenOn: "2026-10-10",
    name: "Apeks XTX50 primary",
    brand: "Apeks",
    model: "XTX50",
    serial: "AB12345",
    lastService: "2026-03-02",
  });
});

test("only the id and the type are required, and f defaults to 1", () => {
  const tag = parseGearTag(`p=${id}&t=fins`);
  assert.equal(tag.ok, true);
  assert.equal(tag.format, 1);
  assert.equal(tag.newerFormat, false);
  assert.equal(tag.typeCode, "fins");
  for (const key of ["writtenOn", "name", "brand", "model", "serial", "lastService"]) {
    assert.equal(tag[key], null, key);
  }
});

test("a newer format still reads, with the note", () => {
  const tag = parseGearTag(`f=2&p=${id}&t=fins&zz=later`);
  assert.equal(tag.ok, true);
  assert.equal(tag.format, 2);
  assert.equal(tag.newerFormat, true);
});

test("an upper-case id reads as lower case", () => {
  assert.equal(parseGearTag(`p=${id.toUpperCase()}&t=fins`).passportId, id);
});

test("refuses a payload with no id, a malformed id, or no type", () => {
  assert.equal(parseGearTag("t=fins").ok, false);
  assert.equal(parseGearTag("p=not-a-uuid&t=fins").ok, false);
  assert.equal(parseGearTag(`p=${id}`).ok, false);
  assert.equal(parseGearTag(`p=${id}&t=`).ok, false);
});

test("refuses a tank: a cylinder's tag is a cylinder tag", () => {
  assert.equal(parseGearTag(`p=${id}&t=tank`).ok, false);
});

test("refuses bad percent-encoding, as the app does", () => {
  assert.equal(parseGearTag(`p=${id}&t=fins&n=%E0%A4%A`).ok, false);
});

test("keeps a type this page does not know", () => {
  const tag = parseGearTag(`p=${id}&t=jetpack`);
  assert.equal(tag.ok, true);
  assert.equal(tag.typeCode, "jetpack");
});

test("drops dates that are not real calendar dates", () => {
  const tag = parseGearTag(`p=${id}&t=fins&w=2026-02-30&ls=yesterday`);
  assert.equal(tag.writtenOn, null);
  assert.equal(tag.lastService, null);
});

test("caps text by whole characters", () => {
  const long = "\u{1F420}".repeat(50);
  const tag = parseGearTag(
    `p=${id}&t=${"x".repeat(40)}&n=${encodeURIComponent(long)}` +
      `&b=${"b".repeat(30)}&mo=${"m".repeat(30)}&sn=${"s".repeat(30)}`,
  );
  assert.equal([...tag.typeCode].length, 32);
  assert.equal([...tag.name].length, 40);
  assert.equal(tag.name, "\u{1F420}".repeat(40));
  assert.equal(tag.brand.length, 24);
  assert.equal(tag.model.length, 24);
  assert.equal(tag.serial.length, 24);
});

test("an empty value is absent", () => {
  const tag = parseGearTag(`p=${id}&t=fins&n=&b=&mo=&sn=`);
  assert.equal(tag.name, null);
  assert.equal(tag.brand, null);
  assert.equal(tag.model, null);
  assert.equal(tag.serial, null);
});
