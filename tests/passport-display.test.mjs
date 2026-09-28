import { test } from "node:test";
import assert from "node:assert/strict";

import { parsePassportTag } from "../passport/tag.js";
import { openInAppUrl, specRows, tagTitle, formatDate } from "../passport/display.js";

const id = "8f3a5c1e-1b2c-4d5e-8f90-1234567890ab";
const example =
  `f=1&p=${id}&w=2026-09-25&n=Steel+12+L&sn=AB12345&v=12&wp=232` +
  "&m=st&vt=din&h=2024-06-14&vi=2026-03-02&oc=1";

test("the documented example reads as labelled rows, in tag order", () => {
  assert.deepEqual(specRows(parsePassportTag(example), "en-GB"), [
    ["Serial number", "AB12345"],
    ["Volume", "12 L"],
    ["Working pressure", "232 bar (3,365 psi)"],
    ["Material", "Steel"],
    ["Valve", "DIN"],
    ["Last hydrostatic test", "14 Jun 2024"],
    ["Last visual inspection", "2 Mar 2026"],
    ["O2 clean", "Yes, when the tag was written"],
  ]);
});

test("fields the tag leaves out get no row", () => {
  assert.deepEqual(specRows(parsePassportTag(`f=1&p=${id}&m=cf&vt=yoke`), "en-GB"), [
    ["Material", "Carbon fiber"],
    ["Valve", "Yoke (INT)"],
  ]);
});

test("a volume keeps its decimal", () => {
  assert.deepEqual(specRows(parsePassportTag(`f=1&p=${id}&v=11.1`), "en-GB"), [
    ["Volume", "11.1 L"],
  ]);
});

test("the title is the tag's name, or a plain one without it", () => {
  assert.equal(tagTitle(parsePassportTag(example)), "Steel 12 L");
  assert.equal(tagTitle(parsePassportTag(`f=1&p=${id}`)), "Cylinder");
});

test("dates are calendar dates, never shifted by the viewer's time zone", () => {
  assert.equal(formatDate("2026-01-01", "en-US"), "Jan 1, 2026");
});

test("Open in Submersion hands the payload to the app's own scheme", () => {
  assert.equal(openInAppUrl(example), `submersion://c?${example}`);
});

test("a year below 100 is shown as that year", () => {
  assert.equal(formatDate("0024-06-14", "en-US"), "Jun 14, 24");
});
