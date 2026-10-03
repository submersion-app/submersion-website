// The committed support matrix data must pass the validator, so a sweep PR
// with a broken reference fails here instead of on the live page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validate } from "../tools/support-matrix/validate.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

test("the committed support matrix data is valid", () => {
  assert.deepEqual(validate(read("computers/data/catalog.json"), read("computers/data/reports.json")), []);
});

test("the catalog is a full generator run", () => {
  const catalog = read("computers/data/catalog.json");
  assert.ok(catalog.models.length > 300, `only ${catalog.models.length} models`);
  assert.match(catalog.generatedFrom.appCommit, /^[0-9a-f]{40}$/);
  assert.match(catalog.generatedFrom.libdcCommit, /^[0-9a-f]{40}$/);
});
