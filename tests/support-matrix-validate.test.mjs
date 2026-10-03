import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validate } from "../tools/support-matrix/validate.mjs";

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
const data = (...reports) => ({ watermarks: {}, reports });
const problems = (...reports) => validate(catalog, data(...reports));
const one = (over, pattern) => {
  const errors = problems(report(over));
  assert.equal(errors.length, 1, errors.join("\n"));
  assert.match(errors[0], pattern);
};

test("valid data has no problems", () => {
  assert.deepEqual(problems(report(), report({ platform: "ios", url: "https://github.com/submersion-app/submersion/issues/1" })), []);
});

test("missing watermarks", () => {
  assert.match(validate(catalog, { reports: [] })[0], /watermarks missing/);
});

test("unknown model", () => one({ model: "nope" }, /unknown model/));
test("unsupported model", () => one({ model: "uwatec-aladin-2g" }, /unsupported on every platform/));
test("unknown platform", () => one({ platform: "symbian" }, /unknown platform/));
test("unknown transport", () => one({ transport: "irda" }, /unknown transport/));
test("unreachable family", () => one({ model: "scubapro-aladin-square", platform: "ios", transport: "usb" }, /usb is not reachable on ios/));
test("unknown outcome", () => one({ outcome: "great" }, /unknown outcome/));
test("unknown source", () => one({ source: "forum" }, /unknown source/));
test("non-https url", () => one({ url: "javascript:alert(1)" }, /not an https URL/));
test("http url", () => one({ url: "http://github.com/x" }, /not an https URL/));
test("host must match source", () => one({ source: "reddit" }, /does not match source reddit/));
test("reddit subdomains are fine", () => assert.deepEqual(problems(report({ source: "reddit", url: "https://www.reddit.com/r/submersion/comments/abc/x/def/" })), []));
test("store review needs a sourceRef", () =>
  one({ source: "app-store", url: "https://apps.apple.com/us/app/submersion-dive-log/id6757456915" }, /needs a sourceRef/));
test("only store reviews carry a sourceRef", () => one({ sourceRef: "x" }, /only store reviews/));
test("appVersion must be a version", () => one({ appVersion: "1.8-beta" }, /appVersion/));
test("appVersion must be present", () => {
  const r = report();
  delete r.appVersion;
  assert.match(problems(r)[0], /appVersion/);
});
test("fixedIn must be a version or unreleased", () => one({ fixedIn: "soon" }, /fixedIn/));
// fixedBy is how the next sweep re-resolves a fix that has not shipped yet.
test("an unreleased fix needs the fixing PR number", () => one({ outcome: "fails", fixedIn: "unreleased" }, /fixedBy/));
test("fixedBy is a PR number", () => one({ outcome: "fails", fixedIn: "unreleased", fixedBy: "#2758" }, /fixedBy/));
test("fixedBy rides only on an unreleased fix", () => one({ outcome: "fails", fixedIn: "1.8.2", fixedBy: 2758 }, /fixedBy/));
test("an unreleased fix with its PR number is valid", () => {
  assert.deepEqual(problems(report({ outcome: "fails", fixedIn: "unreleased", fixedBy: 2758 })), []);
});
test("date must be YYYY-MM-DD", () => one({ date: "Sept 1" }, /date/));
test("note length", () => one({ note: "x".repeat(121) }, /note must be 1 to 120/));
test("note without an em dash", () => one({ note: "works \u2014 mostly" }, /em dash/));
test("duplicates", () => {
  const errors = problems(report(), report());
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate/);
});
test("store duplicates key on sourceRef, not the shared listing url", () => {
  const store = (ref) => report({ source: "app-store", url: "https://apps.apple.com/us/app/submersion-dive-log/id6757456915", sourceRef: ref });
  assert.deepEqual(problems(store("appstore:us:1"), store("appstore:us:2")), []);
});
