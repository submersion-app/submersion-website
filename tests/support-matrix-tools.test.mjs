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
  const candidate = { ...report({ platform: "ios" }), modelText: "Perdix 3" };
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

// A fix found after the failure was recorded (or a pending fix that has since
// shipped) must reach the stored report, or the cell stays Not working.
test("merge upgrades fixedIn on a report already recorded", () => {
  const stored = report({ outcome: "fails", fixedIn: null });
  const pending = mergeReports({ watermarks: {}, reports: [stored] }, { reports: [{ ...stored, fixedIn: "unreleased", fixedBy: 2758 }] });
  assert.equal(pending.added, 0);
  assert.equal(pending.upgraded, 1);
  assert.equal(pending.data.reports[0].fixedIn, "unreleased");
  assert.equal(pending.data.reports[0].fixedBy, 2758);

  const released = mergeReports(pending.data, { reports: [{ ...stored, fixedIn: "1.8.2" }] });
  assert.equal(released.upgraded, 1);
  assert.equal(released.data.reports[0].fixedIn, "1.8.2");
  assert.equal("fixedBy" in released.data.reports[0], false);
});

test("merge never downgrades a resolved fixedIn", () => {
  const stored = report({ outcome: "fails", fixedIn: "1.8.2" });
  for (const fixedIn of [null, "unreleased"]) {
    const candidate = fixedIn === "unreleased" ? { ...stored, fixedIn, fixedBy: 1 } : { ...stored, fixedIn };
    const result = mergeReports({ watermarks: {}, reports: [stored] }, { reports: [candidate] });
    assert.equal(result.upgraded, 0);
    assert.equal(result.data.reports[0].fixedIn, "1.8.2");
  }
});

test("merge keeps fixedBy only while the fix is unreleased", () => {
  const { reports } = mergeReports(
    { watermarks: {}, reports: [] },
    {
      reports: [
        report({ outcome: "fails", fixedIn: "unreleased", fixedBy: 2758 }),
        report({ outcome: "fails", platform: "ios", fixedIn: "1.8.2", fixedBy: 2700 }),
      ],
    },
  ).data;
  const byPlatform = Object.fromEntries(reports.map((r) => [r.platform, r]));
  assert.equal(byPlatform.android.fixedBy, 2758);
  assert.equal("fixedBy" in byPlatform.ios, false);
});

// A fixedBy with no fixedIn means step 3 never ran; dropping it would hide the fix.
test("merge refuses a candidate whose fixedBy was never resolved", () => {
  assert.throws(
    () => mergeReports({ watermarks: {}, reports: [] }, { reports: [report({ outcome: "fails", fixedBy: 2758 })] }),
    /fixedBy 2758 .*step 3/,
  );
});

test("firstRelease picks the lowest version tag and drops the build", () => {
  assert.equal(firstRelease(["v1.8.0.8404", "v1.7.10.8264", "pre-rebase-228", "v1.7.9.8162", ""]), "1.7.9");
  assert.equal(firstRelease(["v1.7.10", "v1.7.9.1"]), "1.7.9");
});

test("firstRelease with no release tag is unreleased", () => {
  assert.equal(firstRelease(["pre-rebase-228", ""]), "unreleased");
  assert.equal(firstRelease([]), "unreleased");
});
