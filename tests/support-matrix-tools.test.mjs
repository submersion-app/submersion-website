import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeReports } from "../tools/support-matrix/merge.mjs";
import { firstRelease } from "../tools/support-matrix/fixed-in.mjs";

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

test("merge adds new reports and skips ones already recorded", () => {
  const existing = { watermarks: { github: { since: "2026-09-01T00:00:00Z" } }, reports: [report()] };
  const fresh = report({ platform: "ios", url: "https://github.com/submersion-app/submersion/issues/9" });
  const result = mergeReports(existing, { reports: [report(), fresh], watermarks: {} });
  assert.equal(result.added, 1);
  assert.equal(result.duplicates, 1);
  assert.equal(result.data.reports.length, 2);
});

test("merge keeps only report fields and fills nullable ones", () => {
  const candidate = { ...report({ platform: "ios" }), modelText: "Perdix 3", fixedBy: 1465 };
  delete candidate.sourceRef;
  delete candidate.fixedIn;
  const [merged] = mergeReports({ watermarks: {}, reports: [] }, { reports: [candidate] }).data.reports;
  assert.deepEqual(Object.keys(merged), [
    "model", "platform", "transport", "outcome", "appVersion", "date", "source", "url", "sourceRef", "fixedIn", "note",
  ]);
  assert.equal(merged.sourceRef, null);
  assert.equal(merged.fixedIn, null);
});

test("merge replaces only the watermarks the sweep reports", () => {
  const existing = { watermarks: { scubaboard: { lastPostId: 1 }, reddit: { lastCreatedUtc: 5 } }, reports: [] };
  const { data } = mergeReports(existing, { reports: [], watermarks: { reddit: { lastCreatedUtc: 9 } } });
  assert.deepEqual(data.watermarks, { scubaboard: { lastPostId: 1 }, reddit: { lastCreatedUtc: 9 } });
});

test("merge output order is stable", () => {
  const a = report({ model: "b-model" });
  const b = report({ model: "a-model", url: "https://github.com/submersion-app/submersion/issues/2" });
  const { data } = mergeReports({ watermarks: {}, reports: [a] }, { reports: [b] });
  assert.deepEqual(data.reports.map((r) => r.model), ["a-model", "b-model"]);
});

test("firstRelease picks the lowest version tag and drops the build", () => {
  assert.equal(firstRelease(["v1.8.0.8404", "v1.7.10.8264", "pre-rebase-228", "v1.7.9.8162", ""]), "1.7.9");
  assert.equal(firstRelease(["v1.7.10", "v1.7.9.1"]), "1.7.9");
});

test("firstRelease with no release tag is unreleased", () => {
  assert.equal(firstRelease(["pre-rebase-228", ""]), "unreleased");
  assert.equal(firstRelease([]), "unreleased");
});
