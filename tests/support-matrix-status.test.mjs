import { test } from "node:test";
import assert from "node:assert/strict";

import { STATUS, cellStatus, compareVersions } from "../computers/status.js";

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

test("an unreachable cell is n/a even with reports", () => {
  assert.equal(cellStatus([report()], false).status, STATUS.NA);
});

test("a reachable cell with no reports is untested", () => {
  assert.equal(cellStatus([], true).status, STATUS.UNTESTED);
});

test("a linkable works report verifies", () => {
  assert.equal(cellStatus([report()], true).status, STATUS.VERIFIED);
});

test("works reported only in store reviews is not verified", () => {
  const cell = cellStatus(
    [report({ source: "app-store", url: "https://apps.apple.com/us/app/submersion-dive-log/id6757456915", sourceRef: "appstore:us:1" })],
    true,
  );
  assert.equal(cell.status, STATUS.ISSUES);
  assert.equal(cell.label, "Reported working only in app store reviews");
});

test("a newer store review over an older linkable works still verifies", () => {
  const store = report({ appVersion: "1.8.1", source: "play-store", url: "https://play.google.com/store/apps/details?id=app.submersion", sourceRef: "play:1" });
  assert.equal(cellStatus([report(), store], true).status, STATUS.VERIFIED);
});

test("caveats is issues", () => {
  assert.equal(cellStatus([report({ outcome: "caveats" })], true).status, STATUS.ISSUES);
});

test("an unfixed failure is not working", () => {
  assert.equal(cellStatus([report({ outcome: "fails" })], true).status, STATUS.NOT_WORKING);
});

test("a failure from before its fix awaits confirmation", () => {
  const cell = cellStatus([report({ outcome: "fails", appVersion: "1.8.0", fixedIn: "1.8.1" })], true);
  assert.equal(cell.status, STATUS.ISSUES);
  assert.equal(cell.label, "Fixed in v1.8.1, awaiting confirmation");
});

test("a failure with no version and a fix awaits confirmation", () => {
  const cell = cellStatus([report({ outcome: "fails", appVersion: null, fixedIn: "1.8.1" })], true);
  assert.equal(cell.status, STATUS.ISSUES);
});

test("fixedIn does not excuse a failure on the fixed version", () => {
  const onFixed = cellStatus([report({ outcome: "fails", appVersion: "1.8.1", fixedIn: "1.8.1" })], true);
  const after = cellStatus([report({ outcome: "fails", appVersion: "1.8.2", fixedIn: "1.8.1" })], true);
  assert.equal(onFixed.status, STATUS.NOT_WORKING);
  assert.equal(after.status, STATUS.NOT_WORKING);
});

test("a merged but unreleased fix is still not working", () => {
  const cell = cellStatus([report({ outcome: "fails", fixedIn: "unreleased" })], true);
  assert.equal(cell.status, STATUS.NOT_WORKING);
  assert.equal(cell.label, "Fix pending release");
});

test("app version outranks date", () => {
  const oldBuildLater = report({ outcome: "fails", appVersion: "1.6.0", date: "2026-09-20" });
  const newBuildEarlier = report({ outcome: "works", appVersion: "1.8.0", date: "2026-09-01", url: "https://github.com/submersion-app/submersion/issues/1" });
  const cell = cellStatus([oldBuildLater, newBuildEarlier], true);
  assert.equal(cell.status, STATUS.VERIFIED);
  assert.equal(cell.latest, newBuildEarlier);
});

test("a missing version sorts oldest", () => {
  const unknown = report({ outcome: "fails", appVersion: null, date: "2026-09-30" });
  assert.equal(cellStatus([unknown, report()], true).status, STATUS.VERIFIED);
});

test("same version and date resolves to the weaker outcome", () => {
  const works = report();
  const fails = report({ outcome: "fails", url: "https://github.com/submersion-app/submersion/issues/2" });
  assert.equal(cellStatus([works, fails], true).status, STATUS.NOT_WORKING);
  assert.equal(cellStatus([fails, works], true).status, STATUS.NOT_WORKING);
});

test("reports come back newest first", () => {
  const a = report({ appVersion: "1.7.0" });
  const b = report({ appVersion: "1.8.0", url: "https://github.com/submersion-app/submersion/issues/3" });
  assert.deepEqual(cellStatus([a, b], true).reports, [b, a]);
});

test("compareVersions is numeric, part by part", () => {
  assert.equal(compareVersions("1.7.10", "1.7.9"), 1);
  assert.equal(compareVersions("1.8", "1.8.0"), 0);
  assert.equal(compareVersions(null, "0.0.1"), -1);
  assert.equal(compareVersions(null, null), 0);
});
