// Pins the homepage's three-act structure: what the page must keep resolving,
// what it must never say, and what it no longer carries.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the depth gauge is gone", () => {
  assert.doesNotMatch(read("index.html"), /depth-gauge|gauge__/);
  assert.doesNotMatch(read("ocean.js"), /gauge|readout|tick/i);
  assert.doesNotMatch(read("styles.css"), /\.gauge|--gauge-w/);
});
