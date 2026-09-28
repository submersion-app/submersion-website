// The files that let iOS and Android open submersion.app links in the app.
// A typo here fails silently on phones, so their shape is pinned.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

// The CI release keystore, which signs the APK attached to GitHub Releases
// (its SHA-1 is the one the app repo registers in
// scripts/check_apk_signing_cert.py).
const CI_RELEASE =
  "6F:DE:06:CB:1A:8C:20:91:00:7A:D4:4E:8C:65:F4:01:67:15:A1:06:B1:44:35:02:90:96:8B:66:4B:9E:AC:BD";

// Play's app-signing key: Play re-signs every copy it delivers with it
// (Play Console, Test and release, App integrity, App signing).
const PLAY_APP_SIGNING =
  "C1:3F:06:30:B1:24:D3:71:21:7A:57:FA:0A:D4:6D:BB:D0:1E:C7:71:DD:FF:0C:C7:F9:C6:AB:DF:0D:55:1D:66";

test("iOS: the app handles /c and /f links", () => {
  const [detail] = read(".well-known/apple-app-site-association").applinks.details;
  assert.deepEqual(detail.appIDs, ["8U3RSKF42Q.app.submersion"]);
  assert.deepEqual(
    detail.components.map((c) => c["/"]),
    ["/c", "/c/*", "/f", "/f/*"],
  );
});

test("Android: only release signing keys are trusted", () => {
  // A debug key would let anyone holding that debug keystore (whose password
  // is the public default) ship an app Android verifies for these links.
  const [statement] = read(".well-known/assetlinks.json");
  assert.deepEqual(statement.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(statement.target.namespace, "android_app");
  assert.equal(statement.target.package_name, "app.submersion");
  assert.deepEqual(statement.target.sha256_cert_fingerprints, [PLAY_APP_SIGNING, CI_RELEASE]);
});
