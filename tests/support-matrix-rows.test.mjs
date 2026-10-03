import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildRows,
  filterRows,
  hashTarget,
  parseState,
  revealTarget,
  stateToSearch,
  urlFor,
  vendorsOf,
} from "../computers/rows.js";

const catalog = JSON.parse(
  readFileSync(new URL("./fixtures/support-matrix-catalog.json", import.meta.url), "utf8"),
);

const report = (over = {}) => ({
  model: "shearwater-perdix-3",
  platform: "android",
  transport: "bluetooth",
  outcome: "works",
  appVersion: "1.8.0",
  date: "2026-09-01",
  source: "github-issue",
  url: "https://github.com/submersion-app/submersion/issues/723",
  sourceRef: null,
  fixedIn: null,
  note: "Downloaded 40 dives",
  ...over,
});

const EMPTY = { q: "", brand: "", platform: "", status: "", transport: "" };
const keys = (rows) => rows.map((r) => `${r.id}/${r.family}`);

test("one row per reachable family, n/a where a platform cannot reach it", () => {
  const rows = buildRows(catalog, []);
  assert.deepEqual(keys(rows), [
    "mares-puck-pro-plus/bluetooth",
    "mares-puck-pro-plus/usb",
    "scubapro-aladin-square/usb",
    "scubapro-g2/bluetooth",
    "scubapro-g2/usb",
    "shearwater-perdix-3/bluetooth",
  ]);
  const square = rows.find((r) => r.id === "scubapro-aladin-square");
  assert.equal(square.cells.ios.status, "na");
  assert.equal(square.cells.macos.status, "untested");
});

test("reports land in their cell", () => {
  const rows = buildRows(catalog, [report()]);
  const perdix = rows.find((r) => r.id === "shearwater-perdix-3");
  assert.equal(perdix.cells.android.status, "verified");
  assert.equal(perdix.cells.ios.status, "untested");
});

test("a model with evidence sorts first within its vendor, rows kept together", () => {
  const rows = buildRows(catalog, [report({ model: "scubapro-g2", platform: "macos", transport: "usb" })]);
  assert.deepEqual(keys(rows).slice(2, 5), [
    "scubapro-g2/bluetooth",
    "scubapro-g2/usb",
    "scubapro-aladin-square/usb",
  ]);
  assert.equal(rows.find((r) => r.id === "scubapro-g2" && r.family === "bluetooth").hasEvidence, true);
});

test("search ignores spacing and punctuation", () => {
  const rows = buildRows(catalog, []);
  const find = (q) => keys(filterRows(rows, { ...EMPTY, q }));
  assert.deepEqual(find("perdix3"), ["shearwater-perdix-3/bluetooth"]);
  assert.deepEqual(find("Perdix 3"), ["shearwater-perdix-3/bluetooth"]);
  assert.deepEqual(find("shear 3"), ["shearwater-perdix-3/bluetooth"]);
  assert.equal(find("puck pro+").length, 2);
});

// "+" is part of a product name: "puck pro+" must find the Puck Pro + and not
// the Puck Pro. The fixture has no plain Puck Pro, so this reads the catalog.
test("search keeps a plus sign", () => {
  const real = JSON.parse(readFileSync(new URL("../computers/data/catalog.json", import.meta.url), "utf8"));
  const ids = new Set(filterRows(buildRows(real, []), { ...EMPTY, q: "puck pro+" }).map((r) => r.id));
  assert.deepEqual([...ids], ["mares-puck-pro-plus"]);
});

test("hashTarget decodes the hash and ignores a malformed one", () => {
  assert.equal(hashTarget("#shearwater-perdix-3"), "shearwater-perdix-3");
  assert.equal(hashTarget("#a%20b"), "a b");
  assert.equal(hashTarget("#%E0"), "");
  assert.equal(hashTarget(""), "");
});

test("brand and transport filters", () => {
  const rows = buildRows(catalog, []);
  assert.deepEqual(keys(filterRows(rows, { ...EMPTY, brand: "Shearwater" })), ["shearwater-perdix-3/bluetooth"]);
  assert.deepEqual(keys(filterRows(rows, { ...EMPTY, brand: "Scubapro", transport: "usb" })), [
    "scubapro-aladin-square/usb",
    "scubapro-g2/usb",
  ]);
});

test("a platform filter hides rows that are n/a there", () => {
  const rows = buildRows(catalog, []);
  const ios = keys(filterRows(rows, { ...EMPTY, platform: "ios" }));
  assert.ok(!ios.includes("scubapro-aladin-square/usb"));
  assert.ok(!ios.includes("scubapro-g2/usb"));
});

test("status filters a platform's cell, or any cell when no platform is set", () => {
  const rows = buildRows(catalog, [report()]);
  assert.deepEqual(keys(filterRows(rows, { ...EMPTY, platform: "android", status: "verified" })), [
    "shearwater-perdix-3/bluetooth",
  ]);
  assert.deepEqual(keys(filterRows(rows, { ...EMPTY, platform: "ios", status: "verified" })), []);
  assert.deepEqual(keys(filterRows(rows, { ...EMPTY, status: "verified" })), ["shearwater-perdix-3/bluetooth"]);
  assert.equal(filterRows(rows, { ...EMPTY, status: "na" }).length, 3);
});

test("vendorsOf lists each vendor once, sorted", () => {
  assert.deepEqual(vendorsOf(buildRows(catalog, [])), ["Mares", "Scubapro", "Shearwater"]);
});

test("parseState keeps known values and drops unknown ones", () => {
  assert.deepEqual(parseState("?q=perdix&platform=ios&status=bogus&transport=usb&brand=Mares"), {
    q: "perdix",
    brand: "Mares",
    platform: "ios",
    status: "",
    transport: "usb",
  });
});

test("stateToSearch round-trips and omits empty values", () => {
  const state = { ...EMPTY, q: "puck pro +", platform: "android" };
  assert.deepEqual(parseState(stateToSearch(state)), state);
  assert.equal(stateToSearch(EMPTY), "");
});

test("urlFor drops an empty query", () => {
  assert.equal(urlFor("/computers/", EMPTY, "#scubapro-g2"), "/computers/#scubapro-g2");
  assert.equal(urlFor("/computers/", { ...EMPTY, q: "g2" }, ""), "/computers/?q=g2");
});

test("revealTarget keeps filters that already show the target", () => {
  const rows = buildRows(catalog, []);
  const state = { ...EMPTY, brand: "Scubapro" };
  assert.deepEqual(revealTarget(rows, state, "scubapro-g2"), state);
});

test("revealTarget clears filters that hide the target", () => {
  const rows = buildRows(catalog, []);
  assert.deepEqual(revealTarget(rows, { ...EMPTY, brand: "Mares" }, "scubapro-g2"), EMPTY);
});

test("revealTarget ignores a hash that is not a model", () => {
  assert.equal(revealTarget(buildRows(catalog, []), EMPTY, "content"), null);
});
